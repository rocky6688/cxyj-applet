App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('基础库版本过低，需 2.2.3 及以上支持云开发')
    } else {
      wx.cloud.init({ env: 'cloud1-9g499hgm7cefa098', traceUser: true })
    }
    console.log('装修报价系统启动')
  },
  globalData: {
    userInfo: null
  }
})