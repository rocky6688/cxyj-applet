const { DBQUERY_FUNCTION } = require('../../utils/config.js')

Page({
  data: {
    id: '',
    item: null,
    loading: true,
    error: ''
  },
  /**
   * 页面加载时读取参数并获取详情 📄
   * 参数：options:any，期望包含 `id`（文档 _id）
   */
  onLoad(options) {
    const id = (options && options.id) || ''
    this.setData({ id })
    if (!id) {
      this.setData({ loading: false, error: '缺少记录ID' })
      return
    }
    this.fetchDetail(id)
  },
  /**
   * 拉取详情（通过 docId 精确查询）🔎
   * 参数：docId:any
   * 行为：调用云函数 dbQuery，设置页面数据
   */
  fetchDetail(docId) {
    this.setData({ loading: true, error: '' })
    wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'customerEntries', docId: docId } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const data = r && r.data ? r.data : null
        if (!data) {
          this.setData({ error: '未找到该记录', loading: false })
          return
        }
        this.setData({ item: data, loading: false })
      })
      .catch(() => this.setData({ error: '加载失败，请稍后重试', loading: false }))
  },
  /**
   * 返回列表页 ⬅️
   * 行为：优先调用内置返回（返回后列表页会保留原来的分页与位置）；
   *       仅当没有可返回的页面时才跳转到列表页，避免返回成功后又被重定向导致列表重置到第一页
   */
  backToList() {
    const stack = (typeof getCurrentPages === 'function' && getCurrentPages()) || []
    if (stack.length > 1) {
      wx.navigateBack({ delta: 1 })
      return
    }
    // 兜底：详细页是唯一页面（如直接编译该页面）时跳转到列表页
    wx.redirectTo({ url: '/pages/customer-entry/customer-entry' })
  }
})
