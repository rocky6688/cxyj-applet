const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 用户登录 / 注册并回传用户信息
 * 逻辑：
 * 1) 通过 OPENID 查找用户；
 * 2) 命中则按传入的 nickName / avatarUrl 进行补充更新，并补齐 wechatOpenId；
 * 3) 未命中则创建新用户；
 * 4) 返回最新用户对象。
 */
exports.main = async (event, context) => {
  const db = cloud.database()
  const users = db.collection('users')
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) {
    return { ok: false, error: 'NO_OPENID' }
  }
  const now = new Date()
  const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`

  let user = null
  const found = await users.where({ wechatOpenId: OPENID }).get()
  if (found && found.data && found.data.length > 0) {
    user = found.data[0]
    const updateData = {}
    const byProfileEdit = !!(event && (event.action === 'profileUpdate' || event.forceUpdate === true))
    if (byProfileEdit) {
      const nickName = event.nickName
      const avatarUrl = event.avatarUrl
      const username = event.username
      if (nickName && nickName !== user.nickName) updateData.nickName = nickName
      if (avatarUrl && avatarUrl !== user.avatarUrl) updateData.avatarUrl = avatarUrl
      if (username && username !== user.username) updateData.username = username
    }
    if (!user.wechatOpenId) updateData.wechatOpenId = OPENID
    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = nowStr
      await users.doc(user._id).update({ data: updateData })
      const fresh = await users.doc(user._id).get()
      user = fresh.data
    }
  } else {
    const nickName = event.nickName || '微信用户'
    const avatarUrl = event.avatarUrl || null
    const username = event.username || nickName
    const addRes = await users.add({
      data: {
        username,
        passwordHash: null,
        role: 'USER',
        status: 'ACTIVE',
        createdAt: nowStr,
        updatedAt: nowStr,
        avatarUrl,
        nickName,
        wechatOpenId: OPENID
      }
    })
    const newDoc = await users.doc(addRes._id).get()
    user = newDoc.data
  }

  const token = `${OPENID}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
  return { ok: true, user, token, expiresIn: 86400 }
}