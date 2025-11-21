import { Module } from '@nestjs/common'
import { ComputeController } from './compute.controller'

@Module({
  controllers: [ComputeController],
})
export class ComputeModule {}