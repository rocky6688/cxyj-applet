const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const db = cloud.database()
  const users = db.collection('users')
  const { OPENID } = cloud.getWXContext()
  const now = new Date()
  const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`

  let user = null
  const found = await users.where({ wechatOpenId: OPENID }).get()
  if (found && found.data && found.data.length > 0) {
    user = found.data[0]
  } else {
    const nickName = event.nickName || `user_${Date.now()}`
    const avatarUrl = event.avatarUrl || null
    const addRes = await users.add({
      data: {
        username: nickName,
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

  return { ok: true, user }
}