const { DBQUERY_FUNCTION } = require('../../utils/config.js')

Page({
  data: {
    pageTitle: '编辑人员',
    docId: '',
    nickName: '',
    roleOptions: ['ADMIN','STAFF','USER'],
    roleOptionsCn: ['管理员','员工','用户'],
    roleIndex: 2,
    statusOptions: ['ACTIVE','INACTIVE'],
    statusOptionsCn: ['启用','停用'],
    statusIndex: 0
  },
  onLoad(options) {
    const id = options && (options.id || options._id)
    if (id) {
      this.setData({ docId: id, pageTitle: '编辑人员' })
      try { wx.setNavigationBarTitle({ title: '编辑人员' }) } catch (e) {}
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'users', docId: id } })
        .then((res) => {
          const r = res && res.result ? res.result : {}
          const u = r && r.data ? r.data : null
          if (!u) return
          const ri = this.data.roleOptions.indexOf(u.role || 'USER')
          const si = this.data.statusOptions.indexOf(u.status || 'ACTIVE')
          this.setData({ nickName: u.nickName || u.username || '', roleIndex: ri >= 0 ? ri : 2, statusIndex: si >= 0 ? si : 0 })
        })
    } else {
      this.setData({ pageTitle: '新增人员' })
      try { wx.setNavigationBarTitle({ title: '新增人员' }) } catch (e) {}
    }
  },
  onNickInput(e) { const v = String(e.detail.value || '').slice(0,30); this.setData({ nickName: v }) },
  onRoleChange(e) { const i = Number(e.detail.value); this.setData({ roleIndex: i }) },
  onStatusChange(e) { const i = Number(e.detail.value); this.setData({ statusIndex: i }) },
  submit() {
    const name = String(this.data.nickName || '').trim()
    if (!name) return wx.showToast({ title: '请输入昵称', icon: 'none' })
    const role = this.data.roleOptions[this.data.roleIndex]
    const status = this.data.statusOptions[this.data.statusIndex]
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`
    if (this.data.docId) {
      const data = { nickName: name, role, status, updatedAt: nowStr }
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'update', collection: 'users', docId: this.data.docId, data } })
        .then((res) => { const r = res && res.result ? res.result : {}; if (r && !r.error) { wx.showToast({ title: '已保存', icon: 'success' }); setTimeout(() => { wx.navigateBack() }, 600) } else { const msg = (r && r.message) || '保存失败'; wx.showToast({ title: msg, icon: 'none' }) } })
    } else {
      const data = { id: `user_${Date.now()}`, username: name, nickName: name, role, status, createdAt: nowStr, updatedAt: nowStr }
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'add', collection: 'users', data } })
        .then((res) => { const r = res && res.result ? res.result : {}; if (r && !r.error) { wx.showToast({ title: '已新增', icon: 'success' }); setTimeout(() => { wx.navigateBack() }, 600) } else { const msg = (r && r.message) || '新增失败'; wx.showToast({ title: msg, icon: 'none' }) } })
    }
  }
})