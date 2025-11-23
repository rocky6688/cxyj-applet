const { DBQUERY_FUNCTION } = require('../../utils/config.js')

Page({
  data: {
    stores: [],
    editingId: null,
    editForm: { name: '', code: '', phone: '', address: '', status: 'ACTIVE' },
    statusOptions: ['ACTIVE','INACTIVE'],
    statusIndex: 0
  },
  onShow() { this.fetchStores() },
  fetchStores() {
    wx.cloud.callFunction({
      name: DBQUERY_FUNCTION,
      data: { collection: 'stores', where: [], field: {}, orderBy: [{ field: 'updatedAt', order: 'desc' }], skip: 0, limit: 100 }
    }).then((res) => {
      const r = res && res.result ? res.result : {}
      const data = (r && r.data) || []
      this.setData({ stores: data })
    })
  },
  goToCreate() { wx.navigateTo({ url: '/pages/admin-store-create/admin-store-create' }) },
  startEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/admin-store-create/admin-store-create?id=${id}` })
  },
  onEditName(e) { const v = String(e.detail.value || '').slice(0,20); this.setData({ 'editForm.name': v }) },
  onEditCode(e) { this.setData({ 'editForm.code': e.detail.value }) },
  onEditPhone(e) { const v = String(e.detail.value || '').replace(/\D/g,'').slice(0,11); this.setData({ 'editForm.phone': v }) },
  onEditAddress(e) { const v = String(e.detail.value || '').slice(0,40); this.setData({ 'editForm.address': v }) },
  onStatusChange(e) { const i = Number(e.detail.value); this.setData({ statusIndex: i, 'editForm.status': this.data.statusOptions[i] }) },
  saveEdit() {
    const id = this.data.editingId
    if (!id) return
    const name = String(this.data.editForm.name || '')
    const phone = String(this.data.editForm.phone || '')
    const address = String(this.data.editForm.address || '')
    if (!name) return wx.showToast({ title: '请输入门店名称', icon: 'none' })
    if (name.length > 20) return wx.showToast({ title: '门店名称最多20字符', icon: 'none' })
    if (address && address.length > 40) return wx.showToast({ title: '地址最多40字符', icon: 'none' })
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) return wx.showToast({ title: '请输入正确手机号', icon: 'none' })
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`
    const data = { ...this.data.editForm, updatedAt: nowStr }
    wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'update', collection: 'stores', docId: id, data } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        if (r && !r.error) {
          wx.showToast({ title: '已保存', icon: 'success' })
          this.setData({ editingId: null })
          this.fetchStores()
        } else {
          const msg = (r && r.message) || '保存失败'
          wx.showToast({ title: msg, icon: 'none' })
        }
      })
  },
  cancelEdit() { this.setData({ editingId: null }) },
  removeStore(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({ title: '确认删除', content: '删除后不可恢复', success: (r) => {
      if (!r.confirm) return
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'delete', collection: 'stores', docId: id } })
        .then((res) => {
          const r = res && res.result ? res.result : {}
          if (r && !r.error) { wx.showToast({ title: '已删除', icon: 'success' }); this.fetchStores() }
          else { const msg = (r && r.message) || '删除失败'; wx.showToast({ title: msg, icon: 'none' }) }
        })
    } })
  }
})