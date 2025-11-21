const { request } = require('../../utils/request.js')

Page({
  data: { templates: [], newTplName: '' },
  onShow() { this.fetchTemplates() },
  fetchTemplates() {
    request({ url: '/api/templates', method: 'GET', success: (r) => { this.setData({ templates: (r.data && r.data.data) || [] }) } })
  },
  createFromCurrent() {
    request({ url: '/api/templates', method: 'POST', data: { name: '新模板' }, success: () => { wx.showToast({ title: '已生成', icon: 'success' }); this.fetchTemplates() } })
  },
  onNewTplName(e) { this.setData({ newTplName: e.detail.value }) },
  createTemplate() {
    if (!this.data.newTplName) return wx.showToast({ title: '请输入名称', icon: 'none' })
    request({ url: '/api/templates', method: 'POST', data: { name: this.data.newTplName }, success: () => { wx.showToast({ title: '已新增', icon: 'success' }); this.setData({ newTplName: '' }); this.fetchTemplates() } })
  },
  setDefault(e) {
    const id = e.currentTarget.dataset.id
    request({ url: `/api/templates/${id}/set-default`, method: 'POST', success: () => { wx.showToast({ title: '已设默认', icon: 'success' }); this.fetchTemplates() } })
  },
  publish(e) {
    const id = e.currentTarget.dataset.id
    request({ url: `/api/templates/${id}/publish`, method: 'POST', success: () => { wx.showToast({ title: '已发布', icon: 'success' }); this.fetchTemplates() } })
  },
  edit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/admin-template-edit/admin-template-edit?id=${id}` })
  },
  remove(e) {
    const id = e.currentTarget.dataset.id
    request({ url: `/api/templates/${id}`, method: 'DELETE', success: () => { wx.showToast({ title: '已删除', icon: 'success' }); this.fetchTemplates() } })
  }
})