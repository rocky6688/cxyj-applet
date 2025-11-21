import { Controller, Get, Query } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'

@Controller('compute')
export class ComputeController {
  constructor(private prisma: PrismaService) {}
  @Get('config')
  async getConfig(@Query('templateId') _templateId?: string) {
    const tpl = _templateId
      ? await this.prisma.template.findUnique({ where: { id: _templateId }, include: { groups: { include: { items: true }, orderBy: { orderIndex: 'asc' } } } })
      : await this.prisma.template.findFirst({ where: { isDefault: true }, include: { groups: { include: { items: true }, orderBy: { orderIndex: 'asc' } } } })
    return { code: 0, message: 'ok', data: tpl }
  }
}