const { API_BASE_URL } = require('./config.js')

function request({ url, method = 'GET', data, header = {}, success, fail, complete }) {
  const token = wx.getStorageSync('access_token')
  const h = { ...header }
  if (token) h.Authorization = `Bearer ${token}`
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`
  wx.request({ url: fullUrl, method, data, header: h, success, fail, complete })
}

module.exports = { request }