const { DBQUERY_FUNCTION } = require('../../utils/config.js')

Page({
  data: {
    pageTitle: '编辑人员',
    docId: '',
    nickName: '',
    roleOptions: ['ADMIN','STAFF','USER','MANAGER','DESIGNER'],
    roleOptionsCn: ['管理员','员工','用户','店长','设计师'],
    roleIndex: 2,
    statusOptions: ['ACTIVE','INACTIVE'],
    statusOptionsCn: ['启用','停用'],
    statusIndex: 0,
    // 店长/员工需要选择所属门店
    isStoreLinked: false,
    storeNames: [],
    storeIds: [],
    storeIndex: 0,
    userUniqueId: ''
  },
  onLoad(options) {
    const id = options && (options.id || options._id)
    if (id) {
      this.setData({ docId: id, pageTitle: '编辑人员' })
      try { wx.setNavigationBarTitle({ title: '编辑人员' }) } catch (e) {}
      try { wx.showLoading({ title: '加载中...', mask: true }) } catch (e) {}
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'users', docId: id } })
        .then((res) => {
          const r = res && res.result ? res.result : {}
          const u = r && r.data ? r.data : null
          if (!u) return
          const ri = this.data.roleOptions.indexOf(u.role || 'USER')
          const si = this.data.statusOptions.indexOf(u.status || 'ACTIVE')
          const roleIndex = ri >= 0 ? ri : 2
          const statusIndex = si >= 0 ? si : 0
          const uid = u.id || u._id || ''
          // 角色联动：员工/店长需要门店选择
          const roleNow = this.data.roleOptions[roleIndex]
          const isStoreLinked = roleNow === 'STAFF' || roleNow === 'MANAGER'
          this.setData({ nickName: u.nickName || u.username || '', roleIndex, statusIndex, userUniqueId: uid, isStoreLinked })
          if (isStoreLinked) this.loadStoreCascade(uid)
        })
        .finally(() => { try { wx.hideLoading() } catch (e) {} })
    } else {
      this.setData({ pageTitle: '新增人员' })
      try { wx.setNavigationBarTitle({ title: '新增人员' }) } catch (e) {}
      try { wx.hideLoading() } catch (e) {}
    }
  },
  onNickInput(e) { const v = String(e.detail.value || '').slice(0,30); this.setData({ nickName: v }) },
  /**
   * 角色变更：员工/店长显示门店选择并加载门店
   * @param {any} e 事件对象
   */
  onRoleChange(e) { const i = Number(e.detail.value); const roleNow = this.data.roleOptions[i]; const isStoreLinked = roleNow === 'STAFF' || roleNow === 'MANAGER'; this.setData({ roleIndex: i, isStoreLinked }); if (isStoreLinked) { const uid = this.data.userUniqueId; this.loadStoreCascade(uid) } },
  onStatusChange(e) { const i = Number(e.detail.value); this.setData({ statusIndex: i }) },
  onStoreChange(e) { const i = Number(e.detail.value); this.setData({ storeIndex: i }) },
  /**
   * 加载门店级联：管理员可见全部；当前登录店长仅可见本人管理的门店
   * @param {any} userId 被编辑用户ID，用于预填现有门店关系
   */
  loadStoreCascade(userId) {
    const current = wx.getStorageSync('current_user') || {}
    const currentRole = current.role || 'ADMIN'
    wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'stores', orderBy: [{ field: 'updatedAt', order: 'desc' }], limit: 200 } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const list = (r && r.data) || []
        let all = list.map((s) => ({ id: s.id || s._id, name: s.name }))
        if (currentRole === 'MANAGER') {
          const uid = current.id || current._id
          return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'storeMembers', where: [{ field: 'userId', op: 'eq', value: uid }, { field: 'role', op: 'eq', value: 'MANAGER' }], limit: 200 } })
            .then((res2) => {
              const rr = res2 && res2.result ? res2.result : {}
              const mems = (rr && rr.data) || []
              const allowed = mems.map((m) => m.storeId)
              all = all.filter((s) => allowed.indexOf(s.id) >= 0)
              this.setData({ storeNames: all.map((s) => s.name), storeIds: all.map((s) => s.id) })
              return this.prefillStoreByRole(userId)
            })
        }
        this.setData({ storeNames: all.map((s) => s.name), storeIds: all.map((s) => s.id) })
        return this.prefillStoreByRole(userId)
      })
  },
  /**
   * 预填门店：根据当前选择的角色（员工/店长）查询对应门店关系并设置选中项
   * @param {any} userId 被编辑用户ID
   */
  prefillStoreByRole(userId) {
    if (!userId) return Promise.resolve()
    const role = this.data.roleOptions[this.data.roleIndex]
    if (role !== 'STAFF' && role !== 'MANAGER') return Promise.resolve()
    return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'storeMembers', where: [{ field: 'userId', op: 'eq', value: userId }, { field: 'role', op: 'eq', value: role }], limit: 1 } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const m = (r && r.data && r.data[0]) || null
        if (!m) return
        const idx = this.data.storeIds.indexOf(m.storeId)
        if (idx >= 0) this.setData({ storeIndex: idx })
      })
  },
  prefillStaffStore(userId) {
    if (!userId) return Promise.resolve()
    return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'storeMembers', where: [{ field: 'userId', op: 'eq', value: userId }, { field: 'role', op: 'eq', value: 'STAFF' }], limit: 1 } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const m = (r && r.data && r.data[0]) || null
        if (!m) return
        const idx = this.data.storeIds.indexOf(m.storeId)
        if (idx >= 0) this.setData({ storeIndex: idx })
      })
  },
  submit() {
    const name = String(this.data.nickName || '').trim()
    if (!name) return wx.showToast({ title: '请输入昵称', icon: 'none' })
    const role = this.data.roleOptions[this.data.roleIndex]
    const status = this.data.statusOptions[this.data.statusIndex]
    if (role === 'STAFF' || role === 'MANAGER') { const sid = this.data.storeIds[this.data.storeIndex]; if (!sid) return wx.showToast({ title: '请选择门店', icon: 'none' }) }
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`
    if (this.data.docId) {
      const data = { nickName: name, role, status, updatedAt: nowStr }
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'update', collection: 'users', docId: this.data.docId, data } })
        .then((res) => { const r = res && res.result ? res.result : {}; if (r && !r.error) { const uid = this.data.userUniqueId || this.data.docId; if (role === 'STAFF' || role === 'MANAGER') { const sid = this.data.storeIds[this.data.storeIndex]; syncStoreMembership(uid, sid, role).then(() => { wx.showToast({ title: '已保存', icon: 'success' }); setTimeout(() => { wx.navigateBack() }, 600) }) } else { clearAllStoreMemberships(uid).then(() => { wx.showToast({ title: '已保存', icon: 'success' }); setTimeout(() => { wx.navigateBack() }, 600) }) } } else { const msg = (r && r.message) || '保存失败'; wx.showToast({ title: msg, icon: 'none' }) } })
    } else {
      const data = { id: `user_${Date.now()}`, username: name, nickName: name, role, status, createdAt: nowStr, updatedAt: nowStr }
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'add', collection: 'users', data } })
        .then((res) => { const r = res && res.result ? res.result : {}; if (r && !r.error) { if (role === 'STAFF' || role === 'MANAGER') { const sid = this.data.storeIds[this.data.storeIndex]; const uid = (r && r.data && (r.data.id || r.data._id)) || data.id; syncStoreMembership(uid, sid, role).then(() => { wx.showToast({ title: '已新增', icon: 'success' }); setTimeout(() => { wx.navigateBack() }, 600) }) } else { wx.showToast({ title: '已新增', icon: 'success' }); setTimeout(() => { wx.navigateBack() }, 600) } } else { const msg = (r && r.message) || '新增失败'; wx.showToast({ title: msg, icon: 'none' }) } })
    }
  }
})

function syncStaffStore(userId, storeId) {
  const now = new Date()
  const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`
  return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'storeMembers', where: [{ field: 'userId', op: 'eq', value: userId }, { field: 'role', op: 'eq', value: 'STAFF' }], limit: 50 } })
    .then((res) => { const r = res && res.result ? res.result : {}; const list = (r && r.data) || []; const delCalls = list.map((m) => wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'delete', collection: 'storeMembers', docId: m._id } })); return Promise.all(delCalls) })
    .then(() => wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'add', collection: 'storeMembers', data: { id: `sm_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, storeId, userId, role: 'STAFF', status: 'ACTIVE', createdAt: nowStr, updatedAt: nowStr } } }))
}

/**
 * 同步门店成员关系：先清理用户的店长/员工记录，再写入当前角色对应门店
 * @param {any} userId 用户ID
 * @param {any} storeId 门店ID
 * @param {any} role 角色（'STAFF'或'MANAGER'）
 */
function syncStoreMembership(userId, storeId, role) {
  const now = new Date()
  const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`
  // 删除既有的店长/员工关系，避免重复
  return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'storeMembers', where: [{ field: 'userId', op: 'eq', value: userId }, { field: 'role', op: 'in', value: ['STAFF','MANAGER'] }], limit: 200 } })
    .then((res) => { const r = res && res.result ? res.result : {}; const list = (r && r.data) || []; const delCalls = list.map((m) => wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'delete', collection: 'storeMembers', docId: m._id } })); return Promise.all(delCalls) })
    .then(() => wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'add', collection: 'storeMembers', data: { id: `sm_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, storeId, userId, role, status: 'ACTIVE', createdAt: nowStr, updatedAt: nowStr } } }))
}

function clearAllStoreMemberships(userId) {
  return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'storeMembers', where: [{ field: 'userId', op: 'eq', value: userId }], limit: 200 } })
    .then((res) => { const r = res && res.result ? res.result : {}; const list = (r && r.data) || []; const delCalls = list.map((m) => wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'delete', collection: 'storeMembers', docId: m._id } })); return Promise.all(delCalls) })
}