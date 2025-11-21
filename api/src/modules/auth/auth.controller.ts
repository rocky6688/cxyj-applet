import { Body, Controller, Post } from '@nestjs/common'

class LoginDto {
  username!: string
  password!: string
}

@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() _body: LoginDto) {
    return { code: 501, message: 'not implemented', data: null }
  }
}