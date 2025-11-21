import { Body, Controller, Get, Param, Post, Put, UseGuards, Req } from '@nestjs/common'
import { TemplatesService } from './templates.service'
import { AuthGuard } from '@nestjs/passport'
import { RolesGuard } from '../../common/auth/roles.guard'
import { Roles } from '../../common/auth/roles.decorator'
import { Delete } from '@nestjs/common'
import { IsBoolean, IsOptional, IsString } from 'class-validator'

class TemplateDto {
  @IsString()
  name!: string
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean
  @IsOptional()
  status?: 'DRAFT' | 'PUBLISHED'
}

@Controller('templates')
export class TemplatesController {
  constructor(private service: TemplatesService) {}
  @Get()
  async list() {
    const data = await this.service.list()
    return { code: 0, message: 'ok', data }
  }

  @Get(':id/detail')
  async detail(@Param('id') id: string) {
    const data = await this.service.getDetail(id)
    return { code: 0, message: 'ok', data }
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async createFromCurrentConfig(@Req() req: any, @Body() body: { name: string }) {
    const tpl = await this.service.createFromCurrentConfig(body?.name || '新模板', req.user.username)
    return { code: 0, message: 'ok', data: tpl }
  }

  @Put(':id')
  async update(@Param('id') _id: string, @Body() _body: TemplateDto) {
    const updated = await this.service.update(_id, _body)
    return { code: 0, message: 'ok', data: updated }
  }

  @Post(':id/publish')
  async publish(@Param('id') _id: string) {
    const res = await this.service.publish(_id)
    return { code: 0, message: 'ok', data: res }
  }

  @Post(':id/set-default')
  async setDefault(@Param('id') _id: string) {
    const res = await this.service.setDefault(_id)
    return { code: 0, message: 'ok', data: res }
  }

  @Get('default')
  async getDefault() {
    const tpl = await this.service.getDefaultStructure()
    return { code: 0, message: 'ok', data: tpl }
  }

  @Post(':id/groups')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async addGroup(@Req() req: any, @Param('id') id: string, @Body() body: { name: string; slug?: string; description?: string; orderIndex?: number }) {
    const res = await this.service.addGroupToTemplate(id, { ...body, createdBy: req.user.username })
    return { code: 0, message: 'ok', data: res }
  }

  @Post(':id/items')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async addItem(@Req() req: any, @Param('id') id: string, @Body() body: { templateGroupId: string; name: string; slug?: string; description?: string; orderIndex?: number }) {
    const res = await this.service.addItemToTemplate(id, body.templateGroupId, { name: body.name, slug: body.slug, description: body.description, orderIndex: body.orderIndex, createdBy: req.user.username })
    return { code: 0, message: 'ok', data: res }
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async delete(@Param('id') id: string) {
    const res = await this.service.deleteTemplate(id)
    return { code: 0, message: 'ok', data: res }
  }

  @Delete('groups/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async removeGroup(@Param('id') id: string) {
    const res = await this.service.removeTemplateGroup(id)
    return { code: 0, message: 'ok', data: res }
  }

  @Delete('items/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async removeItem(@Param('id') id: string) {
    const res = await this.service.removeTemplateItem(id)
    return { code: 0, message: 'ok', data: res }
  }

  @Post(':id/groups/reorder')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async reorderGroups(@Param('id') id: string, @Body() body: Array<{ id: string; orderIndex: number }>) {
    const res = await this.service.reorderTemplateGroups(id, body)
    return { code: 0, message: 'ok', data: res }
  }

  @Post(':id/items/reorder')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async reorderItems(@Param('id') id: string, @Body() body: Array<{ id: string; orderIndex: number }>) {
    const res = await this.service.reorderTemplateItems(id, body)
    return { code: 0, message: 'ok', data: res }
  }

  @Put('groups/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async updateGroupName(@Param('id') id: string, @Body() body: { name: string }) {
    const res = await this.service.updateTemplateGroupName(id, body.name)
    return { code: 0, message: 'ok', data: res }
  }

  @Put('items/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async updateItemName(@Param('id') id: string, @Body() body: { name: string }) {
    const res = await this.service.updateTemplateItemName(id, body.name)
    return { code: 0, message: 'ok', data: res }
  }
}