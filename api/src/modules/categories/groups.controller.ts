import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'

class GroupDto {
  name!: string
  slug!: string
  description?: string
  isActive?: boolean
}

@Controller('category-groups')
export class CategoryGroupsController {
  @Get()
  async list() {
    return { code: 501, message: 'not implemented', data: [] }
  }

  @Post()
  async create(@Body() _body: GroupDto) {
    return { code: 501, message: 'not implemented', data: null }
  }

  @Put(':id')
  async update(@Param('id') _id: string, @Body() _body: GroupDto) {
    return { code: 501, message: 'not implemented', data: null }
  }

  @Delete(':id')
  async remove(@Param('id') _id: string) {
    return { code: 501, message: 'not implemented', data: null }
  }

  @Post('reorder')
  async reorder(@Body() _body: Array<{ id: string; orderIndex: number }>) {
    return { code: 501, message: 'not implemented', data: null }
  }
}