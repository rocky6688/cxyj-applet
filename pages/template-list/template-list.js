const req = require('../../utils/request.js')
const request = typeof req === 'function' ? req : req.request

Page({
  data: { templates: [] },
  onShow() { this.fetchTemplates() },
  fetchTemplates() {
    request({ url: '/api/templates', method: 'GET', success: (r) => {
      const list = (r.data && r.data.data) || []
      this.setData({ templates: list })
    } })
  },
  choose(e) {
    const id = e.currentTarget.dataset.id
    try { wx.setStorageSync('current_template_id', id) } catch (e) {}
    wx.navigateTo({ url: `/pages/template-quote/template-quote?id=${id}` })
  }
})