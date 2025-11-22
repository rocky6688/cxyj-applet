const axios = require('axios')

/**
 * 云函数：apiProxy
 * 功能：作为通用代理，在云端请求后端 API 并返回结果（支持任意路径与方法）
 * 参数：event = { url, method, data, headers, apiBase }
 * - url: 前端传入的相对路径，如 '/api/templates'
 * - method: HTTP 方法，如 'GET'、'POST' 等
 * - data: 请求体数据
 * - headers: 需转发的头（如 Authorization）
 * - apiBase: 后端 API 基础地址（如 'https://your-api-domain.com'）
 * 返回：{ status, data, headers } 或 { error, message, status, data }
 * 说明：本函数仅做 HTTP 代理，不依赖云开发 SDK（无需 wx-server-sdk）。
 */
exports.main = async (event, context) => {
  const { url, method = 'GET', data = {}, headers = {}, apiBase } = event || {}

  // 组装完整请求地址（支持前端传绝对地址或相对地址）
  const base = apiBase || process.env.API_BASE_URL || ''
  const fullUrl = (url && url.startsWith('http')) ? url : `${base}${url || ''}`

  try {
    const res = await axios({ url: fullUrl, method, data, headers })
    return { status: res.status, data: res.data, headers: res.headers }
  } catch (err) {
    const status = err && err.response ? err.response.status : 0
    const body = err && err.response ? err.response.data : null
    return { error: true, message: err.message || 'request failed', status, data: body }
  }
}