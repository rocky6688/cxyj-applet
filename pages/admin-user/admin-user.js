const { DBQUERY_FUNCTION } = require('../../utils/config.js')

Page({
  data: { users: [] },
  onShow() { this.fetchUsers() },
  fetchUsers() {
    wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'users', field: { _id: true, id: true, username: true, nickName: true, role: true, status: true }, orderBy: [{ field: 'updatedAt', order: 'desc' }], limit: 200 } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const list = (r && r.data) || []
        const roleMap = { ADMIN: '管理员', STAFF: '员工', USER: '用户' }
        const statusMap = { ACTIVE: '启用', INACTIVE: '停用' }
        const mapped = list.map((u) => ({ ...u, roleLabel: roleMap[u.role] || u.role, statusLabel: statusMap[u.status] || u.status, displayName: u.nickName || u.username || '微信用户' }))
        this.setData({ users: mapped })
      })
  },
  goToCreate() { wx.navigateTo({ url: '/pages/admin-user-edit/admin-user-edit' }) },
  startEdit(e) { const id = e.currentTarget.dataset.id; wx.navigateTo({ url: `/pages/admin-user-edit/admin-user-edit?id=${id}` }) },
  removeUser(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({ title: '确认删除', content: '删除后不可恢复', success: (r) => {
      if (!r.confirm) return
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'delete', collection: 'users', docId: id } })
        .then((res) => { const rr = res && res.result ? res.result : {}; if (rr && !rr.error) { wx.showToast({ title: '已删除', icon: 'success' }); this.fetchUsers() } else { wx.showToast({ title: (rr && rr.message) || '删除失败', icon: 'none' }) } })
    } })
  }
})