const { API_BASE_URL } = require('../../utils/config.js')

Page({
  data: { username: '', password: '' },
  onUserInput(e) { this.setData({ username: e.detail.value }) },
  onPassInput(e) { this.setData({ password: e.detail.value }) },
  adminLogin() {
    if (!this.data.username || !this.data.password) {
      wx.showToast({ title: '请输入账号密码', icon: 'none' })
      return
    }
    wx.request({
      url: `${API_BASE_URL}/api/auth/login`,
      method: 'POST',
      data: { username: this.data.username, password: this.data.password },
      success: (r) => {
        const data = r.data && r.data.data ? r.data.data : {}
        if (data.access_token) {
          wx.setStorageSync('access_token', data.access_token)
          wx.setStorageSync('refresh_token', data.refresh_token)
          wx.showToast({ title: '登录成功', icon: 'success' })
          wx.redirectTo({ url: '/pages/admin/index' })
        } else {
          wx.showToast({ title: '登录失败', icon: 'none' })
        }
      },
      fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
    })
  }
})