import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../common/prisma/prisma.service'
import * as argon2 from 'argon2'
import { fetch } from 'undici'

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } })
    if (!user) throw new UnauthorizedException('invalid credentials')
    const ok = await argon2.verify(user.passwordHash, password)
    if (!ok) throw new UnauthorizedException('invalid credentials')
    return user
  }

  async issueTokens(user: { id: string; role: string; username: string }) {
    const payload = { sub: user.id, role: user.role, username: user.username }
    const access = await this.jwt.signAsync(payload, { expiresIn: '30m' })
    const refresh = await this.jwt.signAsync(payload, { expiresIn: '7d' })
    return { access_token: access, refresh_token: refresh }
  }

  async wechatLogin(code: string, nickName?: string, avatarUrl?: string) {
    const appid = process.env.WECHAT_APPID
    const secret = process.env.WECHAT_SECRET
    const isDev = process.env.NODE_ENV !== 'production'
    if (!appid || !secret) {
      if (isDev) return this.createDevUser(nickName, avatarUrl)
      throw new UnauthorizedException('wechat not configured')
    }
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`
    const resp = await fetch(url)
    const data = await resp.json() as any
    if (!data.openid) {
      if (isDev) return this.createDevUser(nickName, avatarUrl)
      throw new UnauthorizedException(data.errmsg || 'wechat auth failed')
    }
    let user = await this.prisma.user.findUnique({ where: { wechatOpenId: data.openid } })
    if (!user) {
      user = await this.prisma.user.create({ data: { username: `wx_${data.openid}`, passwordHash: await argon2.hash(data.openid), role: 'USER', status: 'ACTIVE', wechatOpenId: data.openid, nickName, avatarUrl } })
    } else {
      await this.prisma.user.update({ where: { id: user.id }, data: { nickName: nickName ?? user.nickName, avatarUrl: avatarUrl ?? user.avatarUrl } })
    }
    const tokens = await this.issueTokens({ id: user.id, role: user.role, username: user.username })
    return { user: { id: user.id, role: user.role, username: user.username, nickName: user.nickName, avatarUrl: user.avatarUrl }, ...tokens }
  }

  private async createDevUser(nickName?: string, avatarUrl?: string) {
    let user = await this.prisma.user.findUnique({ where: { username: 'dev_user' } })
    if (!user) {
      const hash = await argon2.hash('dev_user')
      user = await this.prisma.user.create({ data: { username: 'dev_user', passwordHash: hash, role: 'USER', status: 'ACTIVE', nickName, avatarUrl } })
    }
    const tokens = await this.issueTokens({ id: user.id, role: user.role, username: user.username })
    return { user: { id: user.id, role: user.role, username: user.username, nickName: user.nickName, avatarUrl: user.avatarUrl }, ...tokens }
  }
}