const { DBQUERY_FUNCTION } = require('../../utils/config.js')

Page({
  data: {
    loggedIn: false,
    user: {},
    avatarUrl: '',
    nickname: '',
    // 使用内联透明 PNG 作为占位，避免 404 与域名白名单问题
    defaultAvatar: '/static/images/def_avatar.png',
    // 防止频繁调用 getUserProfile
    hasFetchedProfile: false,
    lastProfileTs: 0,
    staffStoreName: '',
    isManagerOfStaffStore: false,
    roleLabel: ''
  },

  /**
   * 页面显示：判断是否已登录并加载用户信息
   * 说明：通过 storage 的 current_user 判断登录状态
   */
  onShow() {
    try {
      const user = wx.getStorageSync('current_user')
      if (user && (user.id || user._id)) {
        const roleMap = { ADMIN: '管理员', STAFF: '员工', USER: '用户' }
        const roleLabel = roleMap[user.role] || ''
        this.setData({ loggedIn: true, user, avatarUrl: user.avatarUrl || this.data.avatarUrl, nickname: user.nickName || this.data.nickname, roleLabel })
        const uid = user.id || user._id
        this.fetchStaffStore(uid)
      } else {
        this.setData({ loggedIn: false, user: {}, staffStoreName: '', isManagerOfStaffStore: false, roleLabel: '' })
      }
    } catch (e) { this.setData({ loggedIn: false }) }
  },
  fetchStaffStore(userId) {
    if (!userId) return
    let staffStoreId = ''
    wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'storeMembers', where: [{ field: 'userId', op: 'eq', value: userId }, { field: 'role', op: 'eq', value: 'STAFF' }], limit: 1 } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const m = (r && r.data && r.data[0]) || null
        staffStoreId = (m && m.storeId) || ''
        if (staffStoreId) return staffStoreId
        return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'storeMembers', where: [{ field: 'userId', op: 'eq', value: userId }], limit: 1 } })
          .then((res2) => { const rr = res2 && res2.result ? res2.result : {}; const any = (rr && rr.data && rr.data[0]) || null; staffStoreId = (any && any.storeId) || ''; return staffStoreId })
      })
      .then((sid) => {
        if (!sid) { this.setData({ staffStoreName: '', isManagerOfStaffStore: false }); return }
        return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'stores', where: [{ field: 'id', op: 'eq', value: sid }], limit: 1 } })
          .then((res3) => {
            const r3 = res3 && res3.result ? res3.result : {}
            let s = (r3 && r3.data && r3.data[0]) || null
            if (!s) {
              return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'stores', where: [{ field: '_id', op: 'eq', value: sid }], limit: 1 } })
                .then((res4) => { const r4 = res4 && res4.result ? res4.result : {}; s = (r4 && r4.data && r4.data[0]) || null })
            }
            this.setData({ staffStoreName: (s && s.name) || '' })
            return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'storeMembers', where: [{ field: 'userId', op: 'eq', value: userId }, { field: 'role', op: 'eq', value: 'MANAGER' }, { field: 'storeId', op: 'eq', value: sid }], limit: 1 } })
              .then((res5) => { const r5 = res5 && res5.result ? res5.result : {}; const mgr = (r5 && r5.data && r5.data[0]) || null; this.setData({ isManagerOfStaffStore: !!mgr }) })
          })
      })
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
   * 兼容：open-type="getUserInfo" 事件回调，填充微信昵称与头像
   */
  onGetUserInfo(e) {
    const info = (e && e.detail && e.detail.userInfo) || {}
    const nn = info.nickName || ''
    const av = info.avatarUrl || ''
    const data = { nickname: nn || this.data.nickname }
    if (!this.data.avatarUrl && av) data.avatarUrl = av
    data.hasFetchedProfile = true
    this.setData(data)
    if (!nn) wx.showToast({ title: '未授权或未获取到昵称', icon: 'none' })
  },

  /**
   * 点击微信登录：将头像与昵称存入 storage 并跳转至登录页
   * 说明：需 avatarUrl 和 nickname 均已存在方可跳转
   */
  onWechatLoginTap() {
    try { wx.showLoading({ title: '登录中...', mask: true }) } catch (e) {}
    wx.cloud.callFunction({ name: 'userLogin', data: {} })
      .then((res) => {
        const data = (res && res.result) || {}
        if (data && data.user) {
          try { wx.setStorageSync('current_user', data.user) } catch (e) {}
          if (data.token) { try { wx.setStorageSync('access_token', data.token) } catch (e) {} }
          this.setData({ loggedIn: true, user: data.user })
          wx.showToast({ title: '登录成功', icon: 'success' })
          wx.switchTab({ url: '/pages/my/my' })
        } else {
          wx.showToast({ title: '登录失败', icon: 'none' })
        }
      })
      .catch((err) => {
        const msg = (err && (err.errMsg || err.message)) || '登录失败'
        wx.showToast({ title: msg, icon: 'none' })
      })
      .finally(() => { try { wx.hideLoading() } catch (e) {} })
  },

  /**
   * 退出登录：清理用户信息
   */
  logout() {
    try { wx.removeStorageSync('current_user') } catch (e) {}
    this.setData({ loggedIn: false, user: {}, staffStoreName: '', isManagerOfStaffStore: false, roleLabel: '' })
    wx.showToast({ title: '已退出', icon: 'none' })
  },
  onOneTapLogin() {
    if (wx.getUserProfile) {
      wx.getUserProfile({
        desc: '用于登录',
        success: (res) => {
          this.onWechatLoginTap()
        },
        fail: () => { wx.showToast({ title: '授权失败，请重试', icon: 'none' }) }
      })
    } else {
      this.onWechatLoginTap()
    }
  },
  goToCustomerEntry() { wx.navigateTo({ url: '/pages/customer-entry/customer-entry' }) },
  goToDataView() { wx.navigateTo({ url: '/pages/data-view/data-view' }) }
  ,goToProfileEdit() { wx.navigateTo({ url: '/pages/profile-edit/profile-edit' }) }
  ,goToAdmin() { wx.navigateTo({ url: '/pages/admin/index' }) }
  ,ensureCloudAvatar(localOrUrl) {
    const url = String(localOrUrl || '')
    const isHttp = /^https?:\/\//.test(url)
    const isCloud = /^cloud:\/\//.test(url)
    const isLocal = /^wxfile:\/\//.test(url) || (!isHttp && !isCloud)
    const ts = Date.now()
    const rand = Math.random().toString(36).slice(2,8)
    const cloudPath = `avatar/${ts}_${rand}.png`
    if (isCloud) return Promise.resolve(url)
    if (isHttp) {
      return new Promise((resolve, reject) => {
        wx.downloadFile({ url, success: (r) => {
          const fp = r && r.tempFilePath
          if (!fp) return reject(new Error('下载头像失败'))
          wx.cloud.uploadFile({ cloudPath, filePath: fp })
            .then((res) => { const fid = (res && res.fileID) ? res.fileID : cloudPath; this.setData({ avatarUrl: fid }); resolve(fid) })
            .catch(reject)
        }, fail: (e) => reject(e) })
      })
    }
    // 本地临时文件
    return wx.cloud.uploadFile({ cloudPath, filePath: url })
      .then((res) => { const fid = res && res.fileID ? res.fileID : cloudPath; this.setData({ avatarUrl: fid }); return fid })
  }
})