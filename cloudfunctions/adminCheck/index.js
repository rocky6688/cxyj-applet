const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  try {
    const db = cloud.database()
    const users = db.collection('users')
    const { OPENID } = cloud.getWXContext()
    const found = await users.where({ wechatOpenId: OPENID }).get()
    if (!found || !found.data || found.data.length === 0) {
      if (event && event.username && event.password) {
        const byName = await users.where({ username: event.username }).get()
        if (byName && byName.data && byName.data.length > 0) {
          const candidate = byName.data[0]
          if (candidate.role === 'ADMIN' && event.password === 'admin123') {
            const now = new Date()
            const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`
            await users.doc(candidate._id).update({ data: { wechatOpenId: OPENID, updatedAt: nowStr } })
            const updated = await users.doc(candidate._id).get()
            return { isAdmin: true, user: updated.data, openid: OPENID, exists: true, boundBy: 'username' }
          }
          return { isAdmin: false, user: null, openid: OPENID, exists: false, reason: '用户名或密码错误' }
        }
        return { isAdmin: false, user: null, openid: OPENID, exists: false, reason: '未找到该用户名' }
      }
      return { isAdmin: false, user: null, openid: OPENID, exists: false, reason: '未找到绑定的用户' }
    }
    const user = found.data[0]
    const isAdmin = user.role === 'ADMIN'
    if (!isAdmin) {
      return { isAdmin, user, openid: OPENID, exists: true, reason: '非管理员' }
    }
    return { isAdmin, user, openid: OPENID, exists: true }
  } catch (err) {
    return { error: String(err) }
  }
}