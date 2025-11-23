Page({
  data: {},
  onShow() {},
  goToUserManage() { wx.navigateTo({ url: '/pages/admin-user/admin-user' }) },
  goToStoreManage() { wx.navigateTo({ url: '/pages/admin-store/admin-store' }) },
  goToTemplateManage() { wx.navigateTo({ url: '/pages/admin-templates/admin-templates' }) }
})