import { Module } from '@nestjs/common'
import { ComputeController } from './compute.controller'
import { PrismaModule } from '../../common/prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [ComputeController],
})
export class ComputeModule {}