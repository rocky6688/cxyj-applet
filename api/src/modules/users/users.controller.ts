import { Body, Controller, Post } from '@nestjs/common'

class CreateStaffDto {
  username!: string
  password!: string
}

@Controller('users')
export class UsersController {
  @Post()
  async createStaff(@Body() _body: CreateStaffDto) {
    return { code: 501, message: 'not implemented', data: null }
  }
}