import { Body, Controller, Post } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'
import { AuthService } from './auth.service'

class LoginDto {
  @IsString()
  username!: string
  @IsString()
  @MinLength(6)
  password!: string
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}
  @Post('login')
  async login(@Body() _body: LoginDto) {
    const user = await this.auth.validateUser(_body.username, _body.password)
    const tokens = await this.auth.issueTokens({ id: user.id, role: user.role, username: user.username })
    return { code: 0, message: 'ok', data: tokens }
  }

  @Post('refresh')
  @ApiBearerAuth()
  async refresh(@Body() _body: { refresh_token: string }) {
    return { code: 0, message: 'ok', data: null }
  }

  @Post('wechat-login')
  async wechatLogin(@Body() body: { code: string; nickName?: string; avatarUrl?: string }) {
    const res = await this.auth.wechatLogin(body.code, body.nickName, body.avatarUrl)
    return { code: 0, message: 'ok', data: res }
  }
}