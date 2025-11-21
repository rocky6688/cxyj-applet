const { API_BASE_URL } = require('../../utils/config.js')

Page({
  data: {},
  onGetUserInfo(e) {
    wx.login({
      success: (res) => {
        const code = res.code
        const userInfo = e.detail.userInfo || {}
        wx.request({
          url: `${API_BASE_URL}/api/auth/wechat-login`,
          method: 'POST',
          data: { code, nickName: userInfo.nickName, avatarUrl: userInfo.avatarUrl },
          success: (r) => {
            const data = r.data && r.data.data ? r.data.data : {}
            if (data.access_token) {
              wx.setStorageSync('access_token', data.access_token)
              wx.setStorageSync('refresh_token', data.refresh_token)
              wx.reLaunch({ url: '/pages/index/index' })
            } else {
              wx.showToast({ title: '登录失败', icon: 'none' })
            }
          },
          fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
        })
      },
      fail: () => wx.showToast({ title: '微信登录失败', icon: 'none' })
    })
  }
})