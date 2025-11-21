import { Body, Controller, Post, UseGuards, Req, Param } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from './users.service'
import { Roles } from '../../common/auth/roles.decorator'
import { RolesGuard } from '../../common/auth/roles.guard'
import { AuthGuard } from '@nestjs/passport'
import { IsString, MinLength } from 'class-validator'

class CreateStaffDto {
  @IsString()
  username!: string
  @IsString()
  @MinLength(6)
  password!: string
}

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async createStaff(@Req() req: any, @Body() _body: CreateStaffDto) {
    const created = await this.users.createStaff(_body.username, _body.password, req.user.username)
    return { code: 0, message: 'ok', data: { id: created.id, username: created.username } }
  }

  @Post(':id/role')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async changeRole(@Param('id') id: string, @Body() body: { role: 'USER' | 'STAFF' }) {
    const updated = await this.users.changeRole(id, body.role)
    return { code: 0, message: 'ok', data: { id: updated.id, role: updated.role } }
  }
}