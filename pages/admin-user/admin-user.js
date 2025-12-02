const { DBQUERY_FUNCTION } = require('../../utils/config.js')

Page({
  data: { users: [], deleteDialogVisible: false, deleteSource: null, deleteEntryCount: 0, transferUsers: [], transferIndex: 0, deleting: false },
  onShow() { this.fetchUsers() },
  fetchUsers() {
    wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'users', field: { _id: true, id: true, username: true, nickName: true, role: true, status: true }, orderBy: [{ field: 'updatedAt', order: 'desc' }], limit: 200 } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const list = (r && r.data) || []
        const roleMap = { ADMIN: '管理员', STAFF: '员工', USER: '用户', MANAGER: '店长', DESIGNER: '设计师' }
        const statusMap = { ACTIVE: '启用', INACTIVE: '停用' }
        const mapped = list.map((u) => ({ ...u, roleLabel: roleMap[u.role] || u.role, statusLabel: statusMap[u.status] || u.status, displayName: u.nickName || u.username || '微信用户' }))
        this.setData({ users: mapped })
      })
  },
  goToCreate() { wx.navigateTo({ url: '/pages/admin-user-edit/admin-user-edit' }) },
  startEdit(e) { const id = e.currentTarget.dataset.id; wx.navigateTo({ url: `/pages/admin-user-edit/admin-user-edit?id=${id}` }) },
  removeUser(e) {
    const docId = e.currentTarget.dataset.id
    const src = (this.data.users || []).find(u => u._id === docId)
    if (!src) return wx.showToast({ title: '用户不存在', icon: 'none' })
    const uid = src.id || src._id
    const name = src.nickName || src.username || '微信用户'
    Promise.all([
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'customerEntries', where: [{ field: 'createdBy', op: 'eq', value: uid }], field: { _id: true }, limit: 2000 } }),
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'users', field: { _id: true, id: true, username: true, nickName: true, status: true }, limit: 500 } })
    ]).then(([ceRes, uRes]) => {
      const ceR = ceRes && ceRes.result ? ceRes.result : {}
      const ceList = (ceR && ceR.data) || []
      const uR = uRes && uRes.result ? uRes.result : {}
      const allUsers = (uR && uR.data) || []
      const options = allUsers.filter(x => (x.id || x._id) !== uid && (x.status || 'ACTIVE') === 'ACTIVE').map(x => ({ id: x.id || x._id, name: x.nickName || x.username || '微信用户' }))
      this.setData({ deleteDialogVisible: true, deleteSource: { docId, uid, name }, deleteEntryCount: ceList.length, transferUsers: options, transferIndex: 0 })
    })
  },
  cancelDeleteDialog() { this.setData({ deleteDialogVisible: false, deleteSource: null, deleteEntryCount: 0, transferUsers: [], transferIndex: 0, deleting: false }) },
  onTransferChange(e) { const i = Number(e.detail.value); this.setData({ transferIndex: i }) },
  confirmSoftDelete() {
    if (this.data.deleting) return
    const src = this.data.deleteSource
    if (!src) return this.cancelDeleteDialog()
    const count = this.data.deleteEntryCount
    const target = this.data.transferUsers[this.data.transferIndex]
    if (count > 0 && !target) return wx.showToast({ title: '请选择转移的用户', icon: 'none' })
    this.setData({ deleting: true })
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`
    const transferPromise = count > 0 ? wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'customerEntries', where: [{ field: 'createdBy', op: 'eq', value: src.uid }], field: { _id: true }, limit: 2000 } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const list = (r && r.data) || []
        const updates = list.map(it => wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'update', collection: 'customerEntries', docId: it._id, data: { createdBy: target.id, createdByName: target.name, updatedAt: nowStr } } }))
        return Promise.all(updates)
      }) : Promise.resolve()
    transferPromise
      .then(() => wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'update', collection: 'users', docId: src.docId, data: { status: 'INACTIVE', updatedAt: nowStr } } }))
      .then(() => { wx.showToast({ title: '已停用并完成转移', icon: 'success' }); this.cancelDeleteDialog(); this.fetchUsers() })
      .catch((err) => { wx.showToast({ title: (err && (err.errMsg || err.message)) || '操作失败', icon: 'none' }); this.setData({ deleting: false }) })
  }
})
