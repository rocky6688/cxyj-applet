App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('基础库版本过低，需 2.2.3 及以上支持云开发')
    } else {
      wx.cloud.init({ env: 'cloud1-9g499hgm7cefa098', traceUser: true })
    }
    console.log('装修报价系统启动')
    // 全局注入 Page 包装器：在每个页面 onShow 前刷新最新权限
    this.injectPageWrapper()
  },
  globalData: {
    userInfo: null
  },
  /**
   * 全局刷新用户权限（所有页面通用）🛡️
   * 入参：any（预留不使用）
   * 行为：
   * - 从 storage 读取 current_user，若存在则到云端拉取最新用户
   * - 若角色/状态变更或 forceLogout=true，则清理登录并提示重新登录
   * - 若仅资料更新，则同步 storage 与 globalData
   */
  ensureFreshUser() {
    try {
      const local = wx.getStorageSync('current_user') || {}
      const uid = local.id || local._id
      if (!uid) return Promise.resolve()
      const { DBQUERY_FUNCTION } = require('./utils/config.js')
      // 先按 id 查找，找不到再按 _id 兜底
      return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'users', where: [{ field: 'id', op: 'eq', value: uid }], limit: 1 } })
        .then((res) => {
          const r = res && res.result ? res.result : {}
          let serverUser = (r && r.data && r.data[0]) || null
          if (!serverUser) {
            return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'users', where: [{ field: '_id', op: 'eq', value: uid }], limit: 1 } })
              .then((res2) => { const rr = res2 && res2.result ? res2.result : {}; serverUser = (rr && rr.data && rr.data[0]) || null; return serverUser })
          }
          return serverUser
        })
        .then((serverUser) => {
          // 云端没有用户，不强制登出，避免因为网络/环境导致误登出
          if (!serverUser) return
          const roleChanged = String(serverUser.role || '') !== String(local.role || '')
          const statusChanged = String(serverUser.status || '') !== String(local.status || '')
          const forceLogoutFlag = !!serverUser.forceLogout
          if (forceLogoutFlag || roleChanged || statusChanged) {
            try { wx.removeStorageSync('current_user') } catch (e) {}
            this.globalData.userInfo = null
            wx.showToast({ title: '权限更新，请重新登录', icon: 'none' })
            // 若当前不是登录页，跳转到“我的”页引导重新登录
            try { wx.switchTab({ url: '/pages/my/my' }) } catch (e) {}
            return
          }
          // 同步最新资料到 storage 和 globalData
          try { wx.setStorageSync('current_user', serverUser) } catch (e) {}
          this.globalData.userInfo = serverUser
        })
        .catch(() => { /* 静默失败，避免影响用户体验 */ })
    } catch (e) {
      return Promise.resolve()
    }
  },
  /**
   * 包装 Page 定义：在各页面 onShow 前调用 ensureFreshUser ⚙️
   * 入参：无
   * 行为：覆盖全局 Page，自动注入 onShow 前置逻辑
   */
  injectPageWrapper() {
    const originalPage = Page
    const app = this
    Page = function(def) {
      const oldOnShow = def.onShow
      def.onShow = function() {
        const p = app.ensureFreshUser()
        if (p && typeof p.then === 'function') {
          p.finally(() => { if (typeof oldOnShow === 'function') oldOnShow.call(this) })
        } else {
          if (typeof oldOnShow === 'function') oldOnShow.call(this)
        }
      }
      return originalPage(def)
    }
  }
})