const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()

/**
 * 主入口：dbQuery
 * 说明：在原有通用查询基础上，扩展写操作与模板详情聚合。
 * 参数：event:any，包含以下形态：
 * - 通用查询：{ collection, where, field, orderBy, skip, limit, docId }
 * - 写操作：
 *   - { action:'add', collection, data }
 *   - { action:'update', collection, docId, data }
 *   - { action:'delete', collection, docId }
 *   - { action:'reorder', collection, items:[{ id, orderIndex }] }
 * - 模板详情聚合：{ action:'templateDetail', templateId }
 * - 模板相关便捷写：
 *   - { action:'renameGroup', templateGroupId, name }
 *   - { action:'renameItem', templateItemId, name }
 *   - { action:'addGroup', templateId, name }
 *   - { action:'addItem', templateGroupId, name }
 *   - { action:'removeGroup', templateGroupId }
 *   - { action:'removeItem', templateItemId }
 *   - { action:'saveItemMeta', templateItemId, unit, price, minQuantity }
 * 返回：{ status, data } 或 { error:true, status, message }
 */
exports.main = async (event, context) => {
  try {
    const action = (event && event.action) || 'list'
    switch (action) {
      case 'add': return await handleAdd(event)
      case 'update': return await handleUpdate(event)
      case 'delete': return await handleDelete(event)
      case 'reorder': return await handleReorder(event)
      case 'templateDetail': return await handleTemplateDetail(event)
      case 'cloneFromDefault': return await cloneFromDefault(event)
      case 'renameGroup': return await renameGroup(event)
      case 'renameItem': return await renameItem(event)
      case 'addGroup': return await addGroup(event)
      case 'addItem': return await addItem(event)
      case 'removeGroup': return await removeGroup(event)
      case 'removeItem': return await removeItem(event)
      case 'saveItemMeta': return await saveItemMeta(event)
      default: return await handleQuery(event)
    }
  } catch (err) {
    return { error: true, message: err.message || 'db query failed', status: 500 }
  }
}

/**
 * 通用查询处理
 * 功能：保留原 where/field/orderBy/skip/limit/docId 能力
 */
async function handleQuery(event) {
  const { collection, where = [], field = null, orderBy = [], skip = 0, limit = 20, docId = '', count = false } = event || {}
  if (!collection) return { error: true, message: 'collection required', status: 400 }
  const _ = db.command
  let ref = db.collection(collection)
  if (docId) {
    const docRef = ref.doc(docId)
    const docRes = await docRef.get()
    return { status: 200, data: docRes.data || null }
  }
  if (Array.isArray(where) && where.length > 0) {
    const ops = { gt: (v) => _.gt(v), gte: (v) => _.gte(v), lt: (v) => _.lt(v), lte: (v) => _.lte(v), eq: (v) => _.eq(v), ne: (v) => _.neq(v), in: (v) => _.in(v), nin: (v) => _.nin(v) }
    const whereObj = {}
    for (const cond of where) {
      const f = cond && cond.field
      const op = cond && cond.op
      const val = cond && cond.value
      if (!f || !op) continue
      const fn = ops[op]
      whereObj[f] = fn ? fn(val) : val
    }
    ref = ref.where(whereObj)
  }
  if (count) {
    const c = await ref.count()
    return { status: 200, data: { total: c.total } }
  }
  if (field && typeof field === 'object') ref = ref.field(field)
  if (Array.isArray(orderBy) && orderBy.length > 0) {
    for (const ord of orderBy) {
      const f = ord && ord.field
      const o = ord && ord.order
      if (!f || !o) continue
      ref = ref.orderBy(f, o)
    }
  }
  if (skip && Number(skip) > 0) ref = ref.skip(Number(skip))
  if (limit && Number(limit) > 0) ref = ref.limit(Number(limit))
  const res = await ref.get()
  return { status: 200, data: res.data || [] }
}

/**
 * 写操作：新增文档
 * 参数：{ collection, data }
 */
async function handleAdd(event) {
  const { collection, data } = event || {}
  if (!collection || !data) return { error: true, status: 400, message: 'collection & data required' }
  const res = await db.collection(collection).add({ data })
  return { status: 200, data: { id: res._id } }
}

/**
 * 写操作：更新文档
 * 参数：{ collection, docId, data }
 */
async function handleUpdate(event) {
  const { collection, docId, data } = event || {}
  if (!collection || !docId || !data) return { error: true, status: 400, message: 'collection & docId & data required' }
  await db.collection(collection).doc(docId).update({ data })
  return { status: 200, data: true }
}

/**
 * 写操作：删除文档
 * 参数：{ collection, docId }
 */
async function handleDelete(event) {
  const { collection, docId } = event || {}
  if (!collection || !docId) return { error: true, status: 400, message: 'collection & docId required' }
  await db.collection(collection).doc(docId).remove()
  return { status: 200, data: true }
}

/**
 * 写操作：批量更新排序
 * 参数：{ collection, items:[{ id, orderIndex }] }
 */
async function handleReorder(event) {
  const { collection, items = [] } = event || {}
  if (!collection || !Array.isArray(items)) return { error: true, status: 400, message: 'collection & items required' }
  const tasks = items.map((it) => db.collection(collection).doc(it.id).update({ data: { orderIndex: it.orderIndex } }))
  await Promise.all(tasks)
  return { status: 200, data: true }
}

/**
 * 聚合：模板详情
 * 参数：{ templateId }
 * 返回：{ id, name, isDefault, groups:[{ id, orderIndex, group, items:[{ id, orderIndex, item }] }] }
 */
async function handleTemplateDetail(event) {
  const { templateId } = event || {}
  if (!templateId) return { error: true, status: 400, message: 'templateId required' }

  let tpl = null
  let docId = null
  // 1) 兼容两种 ID：文档 _id 与业务字段 id
  try {
    const tplRes = await db.collection('templates').doc(templateId).get()
    tpl = tplRes.data || null
    docId = tplRes._id || (tpl && tpl._id) || null
  } catch (e) {
    // docId 不存在时，尝试通过字段 id 查找
    const byBiz = await db.collection('templates').where({ id: templateId }).limit(1).get()
    tpl = (byBiz.data && byBiz.data[0]) || null
    docId = tpl && tpl._id
  }
  if (!tpl) return { error: true, status: 404, message: 'template not found' }

  // 2) 组查询：同时兼容存储为 _id 或业务 id 的历史数据
  const _ = db.command
  const ids = docId && docId !== templateId ? [templateId, docId] : [templateId]
  const tgRes = await db.collection('template_groups').where({ templateId: _.in(ids) }).orderBy('orderIndex', 'asc').get()
  const tgList = tgRes.data || []
  const groups = []
  for (const tg of tgList) {
    const baseGroupRes = await db.collection('category_groups').doc(tg.groupId).get()
    const baseGroup = baseGroupRes.data || null
    const showGroup = { ...(baseGroup || {}), name: (tg.name || (baseGroup && baseGroup.name)) }
    const tiRes = await db.collection('template_items').where({ templateGroupId: (tg._id || tg.id) }).orderBy('orderIndex', 'asc').get()
    const tiList = tiRes.data || []
    const items = []
    for (const ti of tiList) {
      const baseItemRes = await db.collection('category_items').doc(ti.itemId).get()
      const baseItem = baseItemRes.data || null
      const showItem = {
        ...(baseItem || {}),
        name: (ti.name || (baseItem && baseItem.name)),
        unit: (typeof ti.unit !== 'undefined' ? ti.unit : (baseItem && baseItem.unit)),
        price: (typeof ti.price !== 'undefined' ? ti.price : (baseItem && baseItem.price)),
        minQuantity: (typeof ti.minQuantity !== 'undefined' ? ti.minQuantity : (baseItem && baseItem.minQuantity))
      }
      items.push({ id: (ti._id || ti.id), orderIndex: ti.orderIndex, item: showItem })
    }
    groups.push({ id: (tg._id || tg.id), orderIndex: tg.orderIndex, group: showGroup, items })
  }
  return { status: 200, data: { id: (tpl.id || tpl._id), name: tpl.name, isDefault: tpl.isDefault, groups } }
}

async function cloneFromDefault(event) {
  const { name } = event || {}
  const _ = db.command
  const defRes = await db.collection('templates').where({ isDefault: true }).limit(1).get()
  const defTpl = (defRes.data && defRes.data[0]) || null
  if (!defTpl) return { error: true, status: 404, message: 'default template not found' }
  const now = new Date().toISOString()
  const bizId = `tpl_${Date.now()}`
  const newRes = await db.collection('templates').add({ data: { id: bizId, name: name || '新模板', status: 'DRAFT', isDefault: false, createdAt: now, updatedAt: now } })
  const newTplId = newRes._id
  const ids = defTpl._id && defTpl.id && defTpl._id !== defTpl.id ? [defTpl.id, defTpl._id] : [defTpl.id || defTpl._id]
  const grpRes = await db.collection('template_groups').where({ templateId: _.in(ids) }).orderBy('orderIndex', 'asc').get()
  const groups = grpRes.data || []
  for (const g of groups) {
    const newGroup = await db.collection('template_groups').add({ data: { templateId: bizId, groupId: g.groupId, orderIndex: g.orderIndex, name: g.name } })
    const newGroupId = newGroup._id
    const itemsRes = await db.collection('template_items').where({ templateGroupId: _.in([g._id || g.id]) }).orderBy('orderIndex', 'asc').get()
    const items = itemsRes.data || []
    for (const it of items) {
      const data = { templateGroupId: newGroupId, itemId: it.itemId, orderIndex: it.orderIndex }
      if (typeof it.name !== 'undefined') data.name = it.name
      if (typeof it.unit !== 'undefined') data.unit = it.unit
      if (typeof it.price !== 'undefined') data.price = it.price
      if (typeof it.minQuantity !== 'undefined') data.minQuantity = it.minQuantity
      await db.collection('template_items').add({ data })
    }
  }
  return { status: 200, data: { id: newTplId, bizId } }
}

/**
 * 便捷：重命名模板组
 * 参数：{ templateGroupId, name }
 */
async function renameGroup(event) {
  const { templateGroupId, name } = event || {}
  if (!templateGroupId || !name) return { error: true, status: 400, message: 'templateGroupId & name required' }
  await db.collection('template_groups').doc(templateGroupId).update({ data: { name } })
  return { status: 200, data: true }
}

/**
 * 便捷：重命名模板项
 * 参数：{ templateItemId, name }
 */
async function renameItem(event) {
  const { templateItemId, name } = event || {}
  if (!templateItemId || !name) return { error: true, status: 400, message: 'templateItemId & name required' }
  await db.collection('template_items').doc(templateItemId).update({ data: { name } })
  return { status: 200, data: true }
}

/**
 * 便捷：新增模板组（创建基础组并映射到模板）
 * 参数：{ templateId, name }
 */
async function addGroup(event) {
  const { templateId, name } = event || {}
  if (!templateId || !name) return { error: true, status: 400, message: 'templateId & name required' }
  const slug = `grp_${Date.now()}`
  const baseRes = await db.collection('category_groups').add({ data: { name, slug, description: null, orderIndex: 0, isActive: 1, createdBy: 'admin', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } })
  const baseId = baseRes._id
  const currentGroupsRes = await db.collection('template_groups').where({ templateId }).get()
  const orderIndex = (currentGroupsRes.data || []).length
  const tgRes = await db.collection('template_groups').add({ data: { templateId, groupId: baseId, orderIndex } })
  return { status: 200, data: { id: tgRes._id } }
}

/**
 * 便捷：新增模板项（创建基础项并映射到模板组）
 * 参数：{ templateGroupId, name }
 */
async function addItem(event) {
  const { templateGroupId, name } = event || {}
  if (!templateGroupId || !name) return { error: true, status: 400, message: 'templateGroupId & name required' }
  const tgRes = await db.collection('template_groups').doc(templateGroupId).get()
  const tg = tgRes.data || null
  if (!tg) return { error: true, status: 404, message: 'template group not found' }
  const slug = `item_${Date.now()}`
  const baseRes = await db.collection('category_items').add({ data: { name, slug, description: null, orderIndex: 0, isActive: 1, createdBy: 'admin', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), groupId: tg.groupId, price: 0, unit: null, minQuantity: 1 } })
  const baseId = baseRes._id
  const currentItemsRes = await db.collection('template_items').where({ templateGroupId }).get()
  const orderIndex = (currentItemsRes.data || []).length
  const tiRes = await db.collection('template_items').add({ data: { templateGroupId, itemId: baseId, orderIndex } })
  return { status: 200, data: { id: tiRes._id } }
}

/**
 * 便捷：删除模板组（仅解除映射，同时清理其下模板项映射）
 * 参数：{ templateGroupId }
 */
async function removeGroup(event) {
  const { templateGroupId } = event || {}
  if (!templateGroupId) return { error: true, status: 400, message: 'templateGroupId required' }
  const tiRes = await db.collection('template_items').where({ templateGroupId }).get()
  const tis = tiRes.data || []
  const delItems = tis.map(it => db.collection('template_items').doc(it.id || it._id).remove())
  await Promise.all(delItems)
  await db.collection('template_groups').doc(templateGroupId).remove()
  return { status: 200, data: true }
}

/**
 * 便捷：删除模板项（仅解除映射）
 * 参数：{ templateItemId }
 */
async function removeItem(event) {
  const { templateItemId } = event || {}
  if (!templateItemId) return { error: true, status: 400, message: 'templateItemId required' }
  await db.collection('template_items').doc(templateItemId).remove()
  return { status: 200, data: true }
}

/**
 * 便捷：保存模板项金额/单位/最小数量（模板内覆盖）
 * 参数：{ templateItemId, unit, price, minQuantity }
 */
async function saveItemMeta(event) {
  const { templateItemId, unit, price, minQuantity } = event || {}
  if (!templateItemId) return { error: true, status: 400, message: 'templateItemId required' }
  const data = {}
  if (typeof unit !== 'undefined') data.unit = unit
  if (typeof price !== 'undefined') data.price = price
  if (typeof minQuantity !== 'undefined') data.minQuantity = minQuantity
  await db.collection('template_items').doc(templateItemId).update({ data })
  return { status: 200, data: true }
}