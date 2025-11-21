import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common'

class TemplateDto {
  name!: string
  isDefault?: boolean
  status?: 'DRAFT' | 'PUBLISHED'
}

@Controller('templates')
export class TemplatesController {
  @Get()
  async list() {
    return { code: 501, message: 'not implemented', data: [] }
  }

  @Post()
  async createFromCurrentConfig() {
    return { code: 501, message: 'not implemented', data: null }
  }

  @Put(':id')
  async update(@Param('id') _id: string, @Body() _body: TemplateDto) {
    return { code: 501, message: 'not implemented', data: null }
  }

  @Post(':id/publish')
  async publish(@Param('id') _id: string) {
    return { code: 501, message: 'not implemented', data: null }
  }

  @Post(':id/set-default')
  async setDefault(@Param('id') _id: string) {
    return { code: 501, message: 'not implemented', data: null }
  }

  @Get('default')
  async getDefault() {
    return { code: 501, message: 'not implemented', data: null }
  }
}