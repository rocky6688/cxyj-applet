Page({
  data: {
    loggedIn: false,
    user: {},
    avatarUrl: '',
    nickname: '',
    // 使用内联透明 PNG 作为占位，避免 404 与域名白名单问题
    defaultAvatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAF+AKlzJZArwAAAABJRU5ErkJggg==',
    // 防止频繁调用 getUserProfile
    hasFetchedProfile: false,
    lastProfileTs: 0
  },

  /**
   * 页面显示：判断是否已登录并加载用户信息
   * 说明：通过 storage 的 current_user 判断登录状态
   */
  onShow() {
    try {
      const user = wx.getStorageSync('current_user')
      if (user && user.id) {
        this.setData({ loggedIn: true, user })
      } else {
        this.setData({ loggedIn: false, user: {} })
      }
    } catch (e) { this.setData({ loggedIn: false }) }
  },

  /**
   * 选择头像（用户主动点击）
   * 参数：e.detail.avatarUrl
   */
  onChooseAvatar(e) {
    const url = (e && e.detail && e.detail.avatarUrl) || ''
    if (!url) { wx.showToast({ title: '未选择头像', icon: 'none' }); return }
    this.setData({ avatarUrl: url })
  },

  /**
   * 输入昵称（用户主动输入）
   */
  onNicknameInput(e) { this.setData({ nickname: (e && e.detail && e.detail.value) || '' }) },

  /**
   * 请求微信资料：通过用户主动点击触发，避免过于频繁
   * 策略：
   * - 若已成功获取过一次且昵称已存在，则不再重复调用（提升体验）；
   * - 5 秒节流：短时间内重复点击将提示“操作太频繁”；
   * - 成功后填充昵称与头像（若未设置头像）。
   */
  onNicknameFocus() {
    if (!wx.getUserProfile) { return }
    const now = Date.now()
    if (this.data.hasFetchedProfile && this.data.nickname) {
      wx.showToast({ title: '已获取微信昵称', icon: 'none' })
      return
    }
    if (now - this.data.lastProfileTs < 5000) {
      wx.showToast({ title: '操作太频繁', icon: 'none' })
      return
    }
    this.setData({ lastProfileTs: now })
    wx.getUserProfile({
      desc: '用于完善个人信息',
      success: (res) => {
        const info = (res && res.userInfo) || {}
        const nn = info.nickName || ''
        const av = info.avatarUrl || ''
        const data = { nickname: nn || this.data.nickname }
        if (!this.data.avatarUrl && av) data.avatarUrl = av
        data.hasFetchedProfile = true
        this.setData(data)
      },
      fail: () => {
        // 不提示过多信息，避免打扰；用户可再次点击尝试
      }
    })
  },

  /**
   * 一键填入微信昵称按钮：显式触发获取微信资料
   */
  fillWechatNickname() { this.onNicknameFocus() },

  /**
   * 点击微信登录：将头像与昵称存入 storage 并跳转至登录页
   * 说明：需 avatarUrl 和 nickname 均已存在方可跳转
   */
  onWechatLoginTap() {
    const { avatarUrl, nickname } = this.data
    if (!avatarUrl || !nickname) { wx.showToast({ title: '请先选择头像并填写昵称', icon: 'none' }); return }
    // 直接调用云函数完成登录，并停留/刷新到“我的”页
    wx.cloud.callFunction({
      name: 'userLogin',
      data: { nickName: nickname, avatarUrl },
      success: (res) => {
        const data = (res && res.result) || {}
        if (data && data.user) {
          try { wx.setStorageSync('current_user', data.user) } catch (e) {}
          this.setData({ loggedIn: true, user: data.user })
          wx.showToast({ title: '登录成功', icon: 'success' })
          // 通过切换 Tab 触发刷新（当前即“我的”页，也可不跳）
          wx.switchTab({ url: '/pages/my/my' })
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
   * 退出登录：清理用户信息
   */
  logout() {
    try { wx.removeStorageSync('current_user') } catch (e) {}
    this.setData({ loggedIn: false, user: {} })
    wx.showToast({ title: '已退出', icon: 'none' })
  }
})