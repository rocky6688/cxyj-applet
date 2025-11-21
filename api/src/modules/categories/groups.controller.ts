import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Req } from '@nestjs/common'
import { CategoriesService } from './categories.service'
import { AuthGuard } from '@nestjs/passport'
import { RolesGuard } from '../../common/auth/roles.guard'
import { Roles } from '../../common/auth/roles.decorator'
import { IsBoolean, IsOptional, IsString } from 'class-validator'

class GroupDto {
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

@Controller('category-groups')
export class CategoryGroupsController {
  constructor(private service: CategoriesService) {}
  @Get()
  async list() {
    const data = await this.service.listGroups()
    return { code: 0, message: 'ok', data }
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async create(@Req() req: any, @Body() _body: GroupDto) {
    const created = await this.service.createGroup({ ..._body, createdBy: req.user.username })
    return { code: 0, message: 'ok', data: created }
  }

  @Put(':id')
  async update(@Param('id') _id: string, @Body() _body: GroupDto) {
    const updated = await this.service.updateGroup(_id, _body)
    return { code: 0, message: 'ok', data: updated }
  }

  @Delete(':id')
  async remove(@Param('id') _id: string) {
    const removed = await this.service.removeGroup(_id)
    return { code: 0, message: 'ok', data: removed }
  }

  @Post('reorder')
  async reorder(@Body() _body: Array<{ id: string; orderIndex: number }>) {
    await this.service.reorderGroups(_body)
    return { code: 0, message: 'ok', data: null }
  }
}