Page({
  data: {
    motto: '装修报价系统',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName')
  },
  
  onLoad() {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  },
  
  goToQuote() {
    wx.navigateTo({
      url: '/pages/quote/quote'
    })
  }
  ,wechatLogin() {
    const { API_BASE_URL } = require('../../utils/config.js')
    wx.login({
      success: (res) => {
        const code = res.code
        wx.request({
          url: `${API_BASE_URL}/api/auth/wechat-login`,
          method: 'POST',
          data: { code },
          success: (r) => {
            const data = r.data && r.data.data ? r.data.data : {}
            if (data.access_token) {
              wx.setStorageSync('access_token', data.access_token)
              wx.setStorageSync('refresh_token', data.refresh_token)
              wx.showToast({ title: '登录成功', icon: 'success' })
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
  ,goToAdminLogin() {
    wx.navigateTo({ url: '/pages/admin-login/admin-login' })
  }
})