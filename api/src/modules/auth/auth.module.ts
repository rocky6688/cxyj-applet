import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './jwt.strategy'
import { PrismaModule } from '../../common/prisma/prisma.module'

@Module({
  imports: [PassportModule, JwtModule.register({ secret: process.env.JWT_SECRET || 'change_me', signOptions: { expiresIn: '30m' } }), PrismaModule],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}