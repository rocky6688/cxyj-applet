Page({
  data: {
    avatarUrl: '',
    nickname: '',
    // 默认头像：显示用 HTTPS 下载地址，保存用云 FileID
    defaultAvatar: 'https://636c-cloud1-9g499hgm7cefa098-1387601215.tcb.qcloud.la/image/def_avatar.png?sign=171921f04185d03cf65fc02903fd454c&t=1764090807',
    defaultAvatarFileId: 'cloud://cloud1-9g499hgm7cefa098.636c-cloud1-9g499hgm7cefa098-1387601215/image/def_avatar.png'
  },
  onShow() {
    try {
      const u = wx.getStorageSync('current_user')
      if (u) this.setData({ avatarUrl: u.avatarUrl || '', nickname: u.nickName || '' })
    } catch (e) {}
  },
  onChooseAvatar(e) {
    const url = (e && e.detail && e.detail.avatarUrl) || ''
    if (!url) { wx.showToast({ title: '未选择头像', icon: 'none' }); return }
    this.setData({ avatarUrl: url })
  },
  onNicknameInput(e) { this.setData({ nickname: (e && e.detail && e.detail.value) || '' }) },
  /**
   * 确保头像可用并上传到云存储（如需）
   * 入参：localOrUrl:any 可为 http、cloud、wxfile、本地选择的临时路径或 data URI
   * 规则：
   * - 空值：直接返回默认头像的 HTTPS 地址，不上传
   * - data URI：直接返回原值，不上传
   * - cloud://：直接返回原值，不上传
   * - http(s)：先下载为临时文件，再上传云，并返回 fileID
   * - 其他（wxfile 等本地临时路径）：直接上传云并返回 fileID
   */
  ensureCloudAvatar(localOrUrl) {
    const url = String(localOrUrl || '')
    const isEmpty = !url
    const isDataUri = /^data:image\//.test(url)
    const isHttp = /^https?:\/\//.test(url)
    const isCloud = /^cloud:\/\//.test(url)
    // 静态资源路径（形如 ../../static/... 或 /static/...）作为占位图，直接返回，不上传
    const isStaticAsset = /^(\.\.\/|\/)/.test(url)
    const isDefaultHttp = url === this.data.defaultAvatar
    const isDefaultCloud = url === this.data.defaultAvatarFileId
    const ts = Date.now()
    const rand = Math.random().toString(36).slice(2,8)
    const cloudPath = `avatar/${ts}_${rand}.png`
    // 空值：返回默认头像的 HTTPS 地址，避免上传与覆盖
    if (isEmpty) return Promise.resolve(this.data.defaultAvatar)
    // 默认头像：若是 HTTPS 地址或云 FileID，统一保持为 HTTPS 地址
    if (isDefaultHttp || isDefaultCloud) return Promise.resolve(this.data.defaultAvatar)
    if (isDataUri || isCloud || isStaticAsset) return Promise.resolve(url)
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
    // 本地临时文件（如 chooseAvatar 返回的 wxfile:// 路径）
    return wx.cloud.uploadFile({ cloudPath, filePath: url })
      .then((res) => { const fid = res && res.fileID ? res.fileID : cloudPath; this.setData({ avatarUrl: fid }); return fid })
  },
  /**
   * 保存资料：昵称必填，头像可为空（使用默认）
   */
  saveProfile() {
    const { avatarUrl, nickname } = this.data
    if (!nickname) { wx.showToast({ title: '请输入昵称', icon: 'none' }); return }
    try { wx.showLoading({ title: '保存中...', mask: true }) } catch (e) {}
    this.ensureCloudAvatar(avatarUrl || '')
      .then((finalUrl) => wx.cloud.callFunction({ name: 'userLogin', data: { action: 'profileUpdate', nickName: nickname, avatarUrl: finalUrl } }))
      .then((res) => {
        const data = (res && res.result) || {}
        if (data && data.user) {
          try {
            wx.setStorageSync('current_user', data.user)
            if (data.token) wx.setStorageSync('access_token', data.token)
          } catch (e) {}
          wx.showToast({ title: '已保存', icon: 'success' })
          wx.navigateBack()
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' })
        }
      })
      .catch((err) => {
        const msg = (err && (err.errMsg || err.message)) || '保存失败'
        wx.showToast({ title: msg, icon: 'none' })
      })
      .finally(() => { try { wx.hideLoading() } catch (e) {} })
  }
})