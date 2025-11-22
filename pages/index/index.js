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
  },
  goToTemplateList() {
    wx.navigateTo({ url: '/pages/template-list/template-list' })
  }
  
  ,goToAdminLogin() {
    wx.navigateTo({ url: '/pages/admin-login/admin-login' })
  }
})