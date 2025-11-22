const { API_BASE_URL } = require('../../utils/config.js')

Page({
  data: { username: '', password: '' },
  onUserInput(e) { this.setData({ username: e.detail.value }) },
  onPassInput(e) { this.setData({ password: e.detail.value }) },
  adminLogin() {
    wx.cloud.callFunction({
      name: 'adminCheck',
      config: { env: 'cloud1-9g499hgm7cefa098' },
      data: { username: this.data.username, password: this.data.password },
      success: (res) => {
        const result = res && res.result ? res.result : {}
        if (result && result.isAdmin && result.user) {
          wx.setStorageSync('current_user', result.user)
          wx.showToast({ title: '管理员登录成功', icon: 'success' })
          wx.redirectTo({ url: '/pages/admin/index' })
        } else {
          const msg = (result && (result.error || result.reason)) || '非管理员或未登录'
          wx.showToast({ title: msg, icon: 'none' })
        }
      },
      fail: (err) => {
        const msg = (err && err.errMsg) || '云函数调用失败'
        wx.showToast({ title: msg, icon: 'none' })
      }
    })
  }
})