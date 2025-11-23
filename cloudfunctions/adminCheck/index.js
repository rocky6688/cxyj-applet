const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  try {
    const db = cloud.database()
    const users = db.collection('users')
    const { OPENID } = cloud.getWXContext()
    if (event && event.username && event.password) {
      const byName = await users.where({ username: event.username }).get()
      if (byName && byName.data && byName.data.length > 0) {
        const candidate = byName.data[0]
        if (candidate.role === 'ADMIN' && event.password === 'admin123') {
          return { isAdmin: true, user: candidate, openid: OPENID, exists: true }
        }
        return { isAdmin: false, user: null, openid: OPENID, exists: false, reason: '用户名或密码错误' }
      }
      return { isAdmin: false, user: null, openid: OPENID, exists: false, reason: '未找到该用户名' }
    }
    const bound = await users.where({ wechatOpenId: OPENID }).get()
    if (bound && bound.data && bound.data.length > 0) {
      const user = bound.data[0]
      const isAdmin = user.role === 'ADMIN'
      return { isAdmin, user, openid: OPENID, exists: true }
    }
    return { isAdmin: false, user: null, openid: OPENID, exists: false }
  } catch (err) {
    return { error: String(err) }
  }
}