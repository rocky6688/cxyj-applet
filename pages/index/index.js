Page({
  data: {
    motto: '装修报价系统',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName'),
    loggedAsAdmin: false,
    // 当前用户角色（用于前端可见性控制）
    userRole: '',
    // 首页「报价入口」可见性：仅 DESIGNER / MANAGER / ADMIN 可见
    canSeeHero: false
  },
  
  /**
   * 页面加载（仅一次）📦
   * 说明：检查是否可用 getUserProfile 能力
   * @param {any} e 无
   */
  onLoad() {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  },
  /**
   * 页面显示：刷新角色并控制首页入口可见性 👀
   * 行为：
   * - 读取 storage 的 current_user
   * - 设置是否为管理员
   * - 计算首页 hero 区域是否可见（仅设计师/店长/管理员）
   * @param {any} e 无
   */
  onShow() {
    try {
      const u = wx.getStorageSync('current_user')
      const role = (u && u.role) || ''
      const isAdmin = role === 'ADMIN'
      const canSeeHero = role === 'ADMIN' || role === 'MANAGER' || role === 'DESIGNER'
      this.setData({ loggedAsAdmin: !!isAdmin, userRole: role, canSeeHero })
    } catch (e) { this.setData({ loggedAsAdmin: false, userRole: '', canSeeHero: false }) }
  },
  
  /**
   * 跳转到报价页面 ➡️
   * @param {any} e 无
   */
  goToQuote() {
    wx.navigateTo({
      url: '/pages/quote/quote'
    })
  },
  /**
   * 跳转到模板报价列表 ➡️
   * @param {any} e 无
   */
  goToTemplateList() {
    wx.navigateTo({ url: '/pages/template-list/template-list' })
  }
  
  /**
   * 后台登录入口（仅非管理员显示）🔐
   * @param {any} e 无
   */
  ,goToAdminLogin() {
    wx.navigateTo({ url: '/pages/admin-login/admin-login' })
  }
})