import { Controller, Get, Query } from '@nestjs/common'

@Controller('compute')
export class ComputeController {
  @Get('config')
  async getConfig(@Query('templateId') _templateId?: string) {
    return { code: 501, message: 'not implemented', data: null }
  }
}