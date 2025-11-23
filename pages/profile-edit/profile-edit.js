Page({
  data: {
    avatarUrl: '',
    nickname: '',
    defaultAvatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAF+AKlzJZArwAAAABJRU5ErkJggg=='
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
  ensureCloudAvatar(localOrUrl) {
    const url = String(localOrUrl || '')
    const isHttp = /^https?:\/\//.test(url)
    const isCloud = /^cloud:\/\//.test(url)
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
    return wx.cloud.uploadFile({ cloudPath, filePath: url })
      .then((res) => { const fid = res && res.fileID ? res.fileID : cloudPath; this.setData({ avatarUrl: fid }); return fid })
  },
  saveProfile() {
    const { avatarUrl, nickname } = this.data
    if (!nickname) { wx.showToast({ title: '请输入昵称', icon: 'none' }); return }
    try { wx.showLoading({ title: '保存中...', mask: true }) } catch (e) {}
    this.ensureCloudAvatar(avatarUrl || '')
      .then((finalUrl) => wx.cloud.callFunction({ name: 'userLogin', data: { nickName: nickname, avatarUrl: finalUrl } }))
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