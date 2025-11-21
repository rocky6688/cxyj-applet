import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import * as argon2 from 'argon2'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } })
  }

  async createStaff(username: string, password: string, createdBy: string) {
    const exists = await this.findByUsername(username)
    if (exists) throw new BadRequestException('username already exists')
    const hash = await argon2.hash(password)
    return this.prisma.user.create({ data: { username, passwordHash: hash, role: 'STAFF', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() } })
  }

  async changeRole(id: string, role: 'USER' | 'STAFF') {
    return this.prisma.user.update({ where: { id }, data: { role } })
  }
}