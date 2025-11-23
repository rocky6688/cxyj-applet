const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const db = cloud.database()
  const stores = db.collection('stores')
  const users = db.collection('users')
  const { OPENID } = cloud.getWXContext()

  const action = (event && event.action) || 'list'
  const payload = (event && event.payload) || {}

  let role = null
  try {
    const u = await users.where({ wechatOpenId: OPENID }).get()
    if (u && u.data && u.data.length > 0) role = u.data[0].role
  } catch (e) {}
  const canManage = role === 'ADMIN' || role === 'MANAGER'

  try {
    if (action === 'list') {
      const res = await stores.orderBy('updatedAt', 'desc').get()
      return { ok: true, data: res.data }
    }

    if (action === 'create') {
      if (!canManage) return { error: true, message: '没有权限', status: 403 }
      const now = new Date()
      const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`
      const id = payload.id || `store_${Date.now()}`
      const doc = {
        id,
        name: payload.name || '未命名门店',
        code: payload.code || '',
        address: payload.address || '',
        phone: payload.phone || '',
        status: payload.status || 'ACTIVE',
        createdAt: nowStr,
        updatedAt: nowStr,
      }
      const addRes = await stores.add({ data: doc })
      const newDoc = await stores.doc(addRes._id).get()
      return { ok: true, data: newDoc.data }
    }

    if (action === 'update') {
      if (!canManage) return { error: true, message: '没有权限', status: 403 }
      const _id = payload._id
      if (!_id) return { error: true, message: '缺少 _id', status: 400 }
      const now = new Date()
      const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`
      const data = { ...payload }
      delete data._id
      data.updatedAt = nowStr
      await stores.doc(_id).update({ data })
      const updated = await stores.doc(_id).get()
      return { ok: true, data: updated.data }
    }

    if (action === 'remove') {
      if (!canManage) return { error: true, message: '没有权限', status: 403 }
      const _id = payload._id
      if (!_id) return { error: true, message: '缺少 _id', status: 400 }
      await stores.doc(_id).remove()
      return { ok: true }
    }

    return { error: true, message: '未知操作', status: 400 }
  } catch (err) {
    return { error: true, message: String(err), status: 500 }
  }
}