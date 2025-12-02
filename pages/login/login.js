const { API_BASE_URL } = require('../../utils/config.js')

Page({
  data: { hasPending: false, pendingUser: null },

  /**
   * 页面加载：读取“我的”页面存储的头像和昵称
   * 说明：从 storage 中读取 pending_user_info，若存在则启用确认登录流程。
   */
  onLoad() {
    try {
      const pending = wx.getStorageSync('pending_user_info')
      if (pending && pending.avatarUrl && pending.nickName) {
        this.setData({ hasPending: true, pendingUser: pending })
      } else {
        this.setData({ hasPending: false, pendingUser: null })
      }
    } catch (e) { this.setData({ hasPending: false }) }
  },

  /**
   * 执行登录：使用云函数 userLogin 完成登录
   * 参数：使用 storage 中的 avatarUrl 与 nickName
   */
  doLogin() {
    const info = this.data.pendingUser || {}
    if (!info.avatarUrl || !info.nickName) {
      wx.showToast({ title: '缺少头像或昵称', icon: 'none' })
      return
    }
    wx.cloud.callFunction({
      name: 'userLogin',
      data: { nickName: info.nickName, avatarUrl: info.avatarUrl },
      success: (res) => {
        const data = (res && res.result) || {}
        if (data && data.user) {
          const status = String(data.user.status || 'ACTIVE')
          if (status !== 'ACTIVE') { wx.showToast({ title: '账号已停用，请联系管理员', icon: 'none' }); return }
          try { wx.setStorageSync('current_user', data.user); wx.removeStorageSync('pending_user_info') } catch (e) {}
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
  },

  /**
   * 跳转到“我的”页面
   * 说明：由于“我的”使用了 TabBar，采用 switchTab 进行跳转。
   */
  goToMy() { wx.switchTab({ url: '/pages/my/my' }) }
})
