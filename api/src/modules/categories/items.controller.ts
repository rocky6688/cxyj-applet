import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, Req } from '@nestjs/common'
import { CategoriesService } from './categories.service'
import { AuthGuard } from '@nestjs/passport'
import { RolesGuard } from '../../common/auth/roles.guard'
import { Roles } from '../../common/auth/roles.decorator'
import { IsBoolean, IsOptional, IsString } from 'class-validator'

class ItemDto {
  @IsString()
  groupId!: string
  @IsString()
  name!: string
  @IsString()
  slug!: string
  @IsOptional()
  @IsString()
  description?: string
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

@Controller('category-items')
export class CategoryItemsController {
  constructor(private service: CategoriesService) {}
  @Get()
  async list(@Query('group_id') _groupId?: string) {
    const data = await this.service.listItems(_groupId)
    return { code: 0, message: 'ok', data }
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async create(@Req() req: any, @Body() _body: ItemDto) {
    const created = await this.service.createItem({ ..._body, createdBy: req.user.username })
    return { code: 0, message: 'ok', data: created }
  }

  @Put(':id')
  async update(@Param('id') _id: string, @Body() _body: ItemDto) {
    const updated = await this.service.updateItem(_id, _body)
    return { code: 0, message: 'ok', data: updated }
  }

  @Delete(':id')
  async remove(@Param('id') _id: string) {
    const removed = await this.service.removeItem(_id)
    return { code: 0, message: 'ok', data: removed }
  }

  @Post('reorder')
  async reorder(@Body() _body: Array<{ id: string; orderIndex: number }>) {
    await this.service.reorderItems(_body)
    return { code: 0, message: 'ok', data: null }
  }
}