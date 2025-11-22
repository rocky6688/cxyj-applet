const { API_BASE_URL, USE_CLOUD_PROXY, CLOUD_PROXY_FUNCTION, DBQUERY_FUNCTION } = require('./config.js')

/**
 * 显示错误提示
 * 参数：message
 * 说明：若传入的 message 存在且非空，使用 wx.showToast 统一弹出错误文案。
 */
function showErrorMessage(message) {
  try {
    const msg = (message === undefined || message === null) ? '' : String(message)
    if (msg) {
      wx.showToast({ title: msg, icon: 'none', duration: 3000 })
    }
  } catch (e) {}
}

/**
 * 请求封装：支持直连后端、云函数代理，以及针对性改为云数据库查询
 * 参数：{ url, method, data, header, success, fail, complete, loading }
 * 说明：
 * - 当 USE_CLOUD_PROXY 为 true 时：
 *   1) 对 GET /api/templates 进行拦截，改走云函数 dbQuery 读取集合 'templates'
 *   2) 其他请求默认通过云函数 apiProxy 转发到后端
 * - loading: 是否显示全局加载中提示（默认 true），会在请求开始时显示，结束时隐藏。
 * - 错误：当接口返回 error 或发生失败，将弹出后端 message 进行提示。
 */
function request({ url, method = 'GET', data, header = {}, success, fail, complete, loading = true }) {
  const token = wx.getStorageSync('access_token')
  const h = { ...header }
  if (token) h.Authorization = `Bearer ${token}`

  // 显示全局 Loading（可通过传入 loading=false 关闭）
  if (loading) {
    try { wx.showLoading({ title: '加载中...', mask: true }) } catch (e) {}
  }

  if (USE_CLOUD_PROXY) {
    // 1) 拦截 GET /api/templates：改用云数据库查询
    if (method === 'GET' && url === '/api/templates') {
      /**
       * 云数据库查询：读取 'templates' 集合列表
       * 返回数据结构为了兼容页面已有逻辑，包装为 { data: { data: [...] } }
       */
      wx.cloud.callFunction({
        name: DBQUERY_FUNCTION,
        data: {
          collection: 'templates',
          where: [],
          field: {},
          orderBy: [],
          skip: 0,
          limit: 100
        }
      }).then((res) => {
        const r = res && res.result ? res.result : {}
        if (r && !r.error) {
          success && success({ statusCode: r.status || 200, data: { data: r.data || [] }, header: {} })
        } else {
          const err = { errMsg: r.message || 'db query failed', statusCode: r.status || 500, data: r.data }
          showErrorMessage(err.errMsg || err.message)
          fail && fail(err)
        }
      }).catch((err) => {
        showErrorMessage((err && (err.errMsg || err.message)) || '请求失败')
        fail && fail(err)
      }).finally(() => {
        if (loading) { try { wx.hideLoading() } catch (e) {} }
        complete && complete()
      })
    // 2) 管理页：模板详情
    } else if (method === 'GET' && /^\/api\/templates\/[^/]+\/detail$/.test(url)) {
      const m = url.match(/^\/api\/templates\/([^/]+)\/detail$/)
      const templateId = m && m[1]
      wx.cloud.callFunction({
        name: DBQUERY_FUNCTION,
        data: { action: 'templateDetail', templateId }
      }).then((res) => {
        const r = res && res.result ? res.result : {}
        if (r && !r.error) {
          success && success({ statusCode: r.status || 200, data: { data: r.data || {} }, header: {} })
        } else {
          showErrorMessage(r.message || 'template detail failed')
          fail && fail({ errMsg: r.message || 'template detail failed', statusCode: r.status || 500, data: r.data })
        }
      }).catch((err) => { showErrorMessage((err && (err.errMsg || err.message)) || '请求失败'); fail && fail(err) }).finally(() => { if (loading) { try { wx.hideLoading() } catch (e) {} } complete && complete() })
    // 3) 管理页：重命名子类
    } else if (method === 'PUT' && /^\/api\/templates\/items\/[^/]+$/.test(url)) {
      const m = url.match(/^\/api\/templates\/items\/([^/]+)$/)
      const templateItemId = m && m[1]
      wx.cloud.callFunction({
        name: DBQUERY_FUNCTION,
        data: { action: 'renameItem', templateItemId, name: data && data.name }
      }).then((res) => {
        const r = res && res.result ? res.result : {}
        if (r && !r.error) success && success({ statusCode: r.status || 200, data: r.data, header: {} })
        else { showErrorMessage(r.message || 'rename item failed'); fail && fail({ errMsg: r.message || 'rename item failed', statusCode: r.status || 500 }) }
      }).catch((err) => { showErrorMessage((err && (err.errMsg || err.message)) || '请求失败'); fail && fail(err) }).finally(() => { if (loading) { try { wx.hideLoading() } catch (e) {} } complete && complete() })
    // 4) 管理页：重命名大类
    } else if (method === 'PUT' && /^\/api\/templates\/groups\/[^/]+$/.test(url)) {
      const m = url.match(/^\/api\/templates\/groups\/([^/]+)$/)
      const templateGroupId = m && m[1]
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'renameGroup', templateGroupId, name: data && data.name } })
        .then((res) => { const r = res && res.result ? res.result : {}; if (r && !r.error) success && success({ statusCode: r.status || 200, data: r.data, header: {} }); else { showErrorMessage(r.message || 'rename group failed'); fail && fail({ errMsg: r.message || 'rename group failed', statusCode: r.status || 500 }) } })
        .catch((err) => { showErrorMessage((err && (err.errMsg || err.message)) || '请求失败'); fail && fail(err) }).finally(() => { if (loading) { try { wx.hideLoading() } catch (e) {} } complete && complete() })
    // 5) 管理页：新增大类
    } else if (method === 'POST' && /^\/api\/templates\/[^/]+\/groups$/.test(url)) {
      const m = url.match(/^\/api\/templates\/([^/]+)\/groups$/)
      const templateId = m && m[1]
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'addGroup', templateId, name: data && data.name } })
        .then((res) => { const r = res && res.result ? res.result : {}; if (r && !r.error) success && success({ statusCode: r.status || 200, data: r.data, header: {} }); else { showErrorMessage(r.message || 'add group failed'); fail && fail({ errMsg: r.message || 'add group failed', statusCode: r.status || 500 }) } })
        .catch((err) => { showErrorMessage((err && (err.errMsg || err.message)) || '请求失败'); fail && fail(err) }).finally(() => { if (loading) { try { wx.hideLoading() } catch (e) {} } complete && complete() })
    // 6) 管理页：新增子类
    } else if (method === 'POST' && /^\/api\/templates\/[^/]+\/items$/.test(url)) {
      // 注意：后端原接口只用到 templateGroupId + name，templateId 不参与
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'addItem', templateGroupId: data && data.templateGroupId, name: data && data.name } })
        .then((res) => { const r = res && res.result ? res.result : {}; if (r && !r.error) success && success({ statusCode: r.status || 200, data: r.data, header: {} }); else { showErrorMessage(r.message || 'add item failed'); fail && fail({ errMsg: r.message || 'add item failed', statusCode: r.status || 500 }) } })
        .catch((err) => { showErrorMessage((err && (err.errMsg || err.message)) || '请求失败'); fail && fail(err) }).finally(() => { if (loading) { try { wx.hideLoading() } catch (e) {} } complete && complete() })
    // 7) 管理页：删除大类
    } else if (method === 'DELETE' && /^\/api\/templates\/groups\/[^/]+$/.test(url)) {
      const m = url.match(/^\/api\/templates\/groups\/([^/]+)$/)
      const templateGroupId = m && m[1]
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'removeGroup', templateGroupId } })
        .then((res) => { const r = res && res.result ? res.result : {}; if (r && !r.error) success && success({ statusCode: r.status || 200, data: r.data, header: {} }); else { showErrorMessage(r.message || 'remove group failed'); fail && fail({ errMsg: r.message || 'remove group failed', statusCode: r.status || 500 }) } })
        .catch((err) => { showErrorMessage((err && (err.errMsg || err.message)) || '请求失败'); fail && fail(err) }).finally(() => { if (loading) { try { wx.hideLoading() } catch (e) {} } complete && complete() })
    // 8) 管理页：删除子类
    } else if (method === 'DELETE' && /^\/api\/templates\/items\/[^/]+$/.test(url)) {
      const m = url.match(/^\/api\/templates\/items\/([^/]+)$/)
      const templateItemId = m && m[1]
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'removeItem', templateItemId } })
        .then((res) => { const r = res && res.result ? res.result : {}; if (r && !r.error) success && success({ statusCode: r.status || 200, data: r.data, header: {} }); else { showErrorMessage(r.message || 'remove item failed'); fail && fail({ errMsg: r.message || 'remove item failed', statusCode: r.status || 500 }) } })
        .catch((err) => { showErrorMessage((err && (err.errMsg || err.message)) || '请求失败'); fail && fail(err) }).finally(() => { if (loading) { try { wx.hideLoading() } catch (e) {} } complete && complete() })
    // 9) 管理页：保存子类金额单位
    } else if (method === 'PUT' && /^\/api\/templates\/items\/[^/]+\/meta$/.test(url)) {
      const m = url.match(/^\/api\/templates\/items\/([^/]+)\/meta$/)
      const templateItemId = m && m[1]
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'saveItemMeta', templateItemId, unit: data && data.unit, price: data && data.price, minQuantity: data && data.minQuantity } })
        .then((res) => { const r = res && res.result ? res.result : {}; if (r && !r.error) success && success({ statusCode: r.status || 200, data: r.data, header: {} }); else { showErrorMessage(r.message || 'save meta failed'); fail && fail({ errMsg: r.message || 'save meta failed', statusCode: r.status || 500 }) } })
        .catch((err) => { showErrorMessage((err && (err.errMsg || err.message)) || '请求失败'); fail && fail(err) }).finally(() => { if (loading) { try { wx.hideLoading() } catch (e) {} } complete && complete() })
    // 10) 管理页：大类排序
    } else if (method === 'POST' && /^\/api\/templates\/[^/]+\/groups\/reorder$/.test(url)) {
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'reorder', collection: 'template_groups', items: Array.isArray(data) ? data : [] } })
        .then((res) => { const r = res && res.result ? res.result : {}; if (r && !r.error) success && success({ statusCode: r.status || 200, data: r.data, header: {} }); else { showErrorMessage(r.message || 'reorder groups failed'); fail && fail({ errMsg: r.message || 'reorder groups failed', statusCode: r.status || 500 }) } })
        .catch((err) => { showErrorMessage((err && (err.errMsg || err.message)) || '请求失败'); fail && fail(err) }).finally(() => { if (loading) { try { wx.hideLoading() } catch (e) {} } complete && complete() })
    // 11) 管理页：子类排序
    } else if (method === 'POST' && /^\/api\/templates\/[^/]+\/items\/reorder$/.test(url)) {
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'reorder', collection: 'template_items', items: Array.isArray(data) ? data : [] } })
        .then((res) => { const r = res && res.result ? res.result : {}; if (r && !r.error) success && success({ statusCode: r.status || 200, data: r.data, header: {} }); else { showErrorMessage(r.message || 'reorder items failed'); fail && fail({ errMsg: r.message || 'reorder items failed', statusCode: r.status || 500 }) } })
        .catch((err) => { showErrorMessage((err && (err.errMsg || err.message)) || '请求失败'); fail && fail(err) }).finally(() => { if (loading) { try { wx.hideLoading() } catch (e) {} } complete && complete() })
    } else {
      // 2) 其他请求通过云函数代理到后端（适用于云开发，无需配置业务域名）
      wx.cloud.callFunction({
        name: CLOUD_PROXY_FUNCTION,
        data: { url, method, data, headers: h, apiBase: API_BASE_URL }
      }).then((res) => {
        const r = res && res.result ? res.result : {}
        if (r && !r.error) {
          success && success({ statusCode: r.status, data: r.data, header: r.headers })
        } else {
          const err = { errMsg: r.message || 'cloud proxy request failed', statusCode: r.status, data: r.data }
          showErrorMessage(err.errMsg || err.message)
          fail && fail(err)
        }
      }).catch((err) => {
        showErrorMessage((err && (err.errMsg || err.message)) || '请求失败')
        fail && fail(err)
      }).finally(() => {
        if (loading) { try { wx.hideLoading() } catch (e) {} }
        complete && complete()
      })
    }
  } else {
    // 直连后端（需在小程序后台配置业务域名并支持 HTTPS）
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`
    wx.request({
      url: fullUrl,
      method,
      data,
      header: h,
      success: (r) => { success && success(r) },
      fail: (e) => { showErrorMessage((e && (e.errMsg || e.message)) || '请求失败'); fail && fail(e) },
      complete: () => { if (loading) { try { wx.hideLoading() } catch (e) {} } complete && complete() }
    })
  }
}

module.exports = { request }