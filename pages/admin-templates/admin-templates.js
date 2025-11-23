const { DBQUERY_FUNCTION } = require('../../utils/config.js')

Page({
  data: { templates: [], newTplName: '', cloning: false },
  onShow() { this.fetchTemplates() },
  fetchTemplates() {
    wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'templates', field: { _id: true, id: true, name: true, status: true, isDefault: true }, orderBy: [{ field: 'updatedAt', order: 'desc' }], limit: 200 } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const list = (r && r.data) || []
        const mapped = list.map((t) => ({ ...t, id: t.id || t._id }))
        this.setData({ templates: mapped })
      })
  },
  createFromCurrent() {
    const name = this.data.newTplName && String(this.data.newTplName).trim() ? this.data.newTplName : '新模板'
    this.setData({ cloning: true })
    try { wx.showLoading({ title: '生成中...', mask: true }) } catch (e) {}
    wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'cloneFromDefault', name } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        if (r && !r.error) { wx.showToast({ title: '已生成', icon: 'success' }); this.fetchTemplates() }
        else { return this.cloneFromDefaultClient(name) }
      })
      .catch(() => { return this.cloneFromDefaultClient(name) })
      .finally(() => { try { wx.hideLoading() } catch (e) {} this.setData({ cloning: false }) })
  },
  cloneFromDefaultClient(name) {
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`
    const bizId = `tpl_${Date.now()}`
    return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'templates', where: [{ field: 'isDefault', op: 'eq', value: true }], limit: 1 } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const defTpl = (r && r.data && r.data[0]) || null
        if (!defTpl) { wx.showToast({ title: '未找到默认模板', icon: 'none' }); return null }
        return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'add', collection: 'templates', data: { id: bizId, name, status: 'DRAFT', isDefault: false, createdAt: nowStr, updatedAt: nowStr } } })
          .then(() => defTpl)
      })
      .then((defTpl) => {
        if (!defTpl) return null
        const ids = defTpl._id && defTpl.id && defTpl._id !== defTpl.id ? [defTpl.id, defTpl._id] : [defTpl.id || defTpl._id]
        return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'template_groups', where: [{ field: 'templateId', op: 'in', value: ids }], orderBy: [{ field: 'orderIndex', order: 'asc' }], limit: 200 } })
          .then((res) => {
            const r = res && res.result ? res.result : {}
            const groups = (r && r.data) || []
            return { defTpl, groups }
          })
      })
      .then((ctx) => {
        if (!ctx) return
        const { groups } = ctx
        const addGroups = groups.map((g) => wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'add', collection: 'template_groups', data: { templateId: bizId, groupId: g.groupId, orderIndex: g.orderIndex, name: g.name } } })
          .then((res) => ({ oldId: g._id || g.id, newId: (res && res.result && res.result.data && res.result.data.id) || '' })))
        return Promise.all(addGroups)
      })
      .then((pairs) => {
        if (!Array.isArray(pairs)) return
        const tasks = pairs.map((p) => {
          const old = p.oldId
          const neu = p.newId
          return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'template_items', where: [{ field: 'templateGroupId', op: 'in', value: [old] }], orderBy: [{ field: 'orderIndex', order: 'asc' }], limit: 500 } })
            .then((res) => {
              const r = res && res.result ? res.result : {}
              const items = (r && r.data) || []
              const adds = items.map((it) => {
                const data = { templateGroupId: neu, itemId: it.itemId, orderIndex: it.orderIndex }
                if (typeof it.name !== 'undefined') data.name = it.name
                if (typeof it.unit !== 'undefined') data.unit = it.unit
                if (typeof it.price !== 'undefined') data.price = it.price
                if (typeof it.minQuantity !== 'undefined') data.minQuantity = it.minQuantity
                return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'add', collection: 'template_items', data } })
              })
              return Promise.all(adds)
            })
        })
        return Promise.all(tasks)
      })
      .then(() => { wx.showToast({ title: '已生成', icon: 'success' }); this.fetchTemplates() })
      .catch((err) => { wx.showToast({ title: (err && (err.errMsg || err.message)) || '生成失败', icon: 'none' }) })
  },
  onNewTplName(e) { this.setData({ newTplName: e.detail.value }) },
  createTemplate() {
    if (!this.data.newTplName) return wx.showToast({ title: '请输入名称', icon: 'none' })
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`
    const data = { id: `tpl_${Date.now()}`, name: this.data.newTplName, status: 'DRAFT', isDefault: false, createdAt: nowStr, updatedAt: nowStr }
    wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'add', collection: 'templates', data } })
      .then((res) => { const r = res && res.result ? res.result : {}; if (r && !r.error) { wx.showToast({ title: '已新增', icon: 'success' }); this.setData({ newTplName: '' }); this.fetchTemplates() } else { wx.showToast({ title: (r && r.message) || '新增失败', icon: 'none' }) } })
  },
  setDefault(e) {
    const id = e.currentTarget.dataset.id
    // 取消其他默认并设置当前为默认
    const ensureDocId = (tid) => {
      return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'templates', where: [{ field: 'id', op: 'eq', value: tid }], limit: 1 } })
        .then((res) => { const r = res && res.result ? res.result : {}; const d = (r && r.data && r.data[0]) || null; if (d) return d._id; return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'templates', where: [{ field: '_id', op: 'eq', value: tid }], limit: 1 } }).then((res2) => { const rr = res2 && res2.result ? res2.result : {}; const dd = (rr && rr.data && rr.data[0]) || null; return dd ? dd._id : tid }) })
    }
    const now = new Date(); const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`
    ensureDocId(id).then((docId) => {
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'templates', where: [{ field: 'isDefault', op: 'eq', value: true }], limit: 100 } })
        .then((res) => {
          const r = res && res.result ? res.result : {}
          const list = (r && r.data) || []
          const updates = list.map((t) => wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'update', collection: 'templates', docId: t._id, data: { isDefault: false, updatedAt: nowStr } } }))
          return Promise.all(updates)
        })
        .then(() => wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'update', collection: 'templates', docId: docId, data: { isDefault: true, updatedAt: nowStr } } }))
        .then(() => { wx.showToast({ title: '已设默认', icon: 'success' }); this.fetchTemplates() })
        .catch((err) => { wx.showToast({ title: (err && (err.errMsg || err.message)) || '设置失败', icon: 'none' }) })
    })
  },
  publish(e) {
    const id = e.currentTarget.dataset.id
    const ensureDocId = (tid) => {
      return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'templates', where: [{ field: 'id', op: 'eq', value: tid }], limit: 1 } })
        .then((res) => { const r = res && res.result ? res.result : {}; const d = (r && r.data && r.data[0]) || null; if (d) return d._id; return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'templates', where: [{ field: '_id', op: 'eq', value: tid }], limit: 1 } }).then((res2) => { const rr = res2 && res2.result ? res2.result : {}; const dd = (rr && rr.data && rr.data[0]) || null; return dd ? dd._id : tid }) })
    }
    const now = new Date(); const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`
    ensureDocId(id).then((docId) => {
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'update', collection: 'templates', docId, data: { status: 'PUBLISHED', updatedAt: nowStr } } })
        .then(() => { wx.showToast({ title: '已发布', icon: 'success' }); this.fetchTemplates() })
        .catch((err) => { wx.showToast({ title: (err && (err.errMsg || err.message)) || '发布失败', icon: 'none' }) })
    })
  },
  edit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/admin-template-edit/admin-template-edit?id=${id}` })
  },
  remove(e) {
    const id = e.currentTarget.dataset.id
    const ensureDocId = (tid) => {
      return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'templates', where: [{ field: 'id', op: 'eq', value: tid }], limit: 1 } })
        .then((res) => { const r = res && res.result ? res.result : {}; const d = (r && r.data && r.data[0]) || null; if (d) return d._id; return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'templates', where: [{ field: '_id', op: 'eq', value: tid }], limit: 1 } }).then((res2) => { const rr = res2 && res2.result ? res2.result : {}; const dd = (rr && rr.data && rr.data[0]) || null; return dd ? dd._id : tid }) })
    }
    ensureDocId(id).then((docId) => {
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'delete', collection: 'templates', docId } })
        .then((res) => { const r = res && res.result ? res.result : {}; if (r && !r.error) { wx.showToast({ title: '已删除', icon: 'success' }); this.fetchTemplates() } else { wx.showToast({ title: (r && r.message) || '删除失败', icon: 'none' }) } })
    })
  }
})