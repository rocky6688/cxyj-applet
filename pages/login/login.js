const { API_BASE_URL } = require('../../utils/config.js')

Page({
  data: {},
  onGetUserInfo(e) {
    const userInfo = e.detail.userInfo || {}
    wx.cloud.callFunction({
      name: 'userLogin',
      config: { env: 'cloud1-9g499hgm7cefa098' },
      data: { nickName: userInfo.nickName, avatarUrl: userInfo.avatarUrl },
      success: (res) => {
        const data = (res && res.result) || {}
        if (data && data.user) {
          wx.setStorageSync('current_user', data.user)
          wx.reLaunch({ url: '/pages/index/index' })
        } else {
          wx.showToast({ title: '登录失败', icon: 'none' })
        }
      },
      fail: (err) => {
        const msg = (err && err.errMsg) || '云函数调用失败'
        wx.showToast({ title: msg, icon: 'none' })
      }
    })
  }
})