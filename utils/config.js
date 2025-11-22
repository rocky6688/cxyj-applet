const CONFIG = {
  // 后端 API 基础地址（本地开发为 127.0.0.1，不可被云函数访问）。
  API_BASE_URL: 'http://127.0.0.1:3000',
  // 是否通过云函数代理请求后端（云开发）。
  USE_CLOUD_PROXY: true,
  // 云函数名称（需与 cloudfunctions 目录保持一致）。
  CLOUD_PROXY_FUNCTION: 'apiProxy',
  // 云数据库查询函数名称（需与 cloudfunctions 目录保持一致）。
  DBQUERY_FUNCTION: 'dbQuery'
}

module.exports = CONFIG