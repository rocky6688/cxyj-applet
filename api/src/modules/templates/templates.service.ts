import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.template.findMany({ orderBy: { updatedAt: 'desc' } })
  }

  async createFromCurrentConfig(name: string, createdBy: string) {
    const groups = await this.prisma.categoryGroup.findMany({ orderBy: { orderIndex: 'asc' }, include: { items: { orderBy: { orderIndex: 'asc' } } } })
    const tpl = await this.prisma.template.create({ data: { name, createdBy } })
    for (const g of groups) {
      const tg = await this.prisma.templateGroup.create({ data: { templateId: tpl.id, groupId: g.id, orderIndex: g.orderIndex } })
      for (const it of g.items) {
        await this.prisma.templateItem.create({ data: { templateGroupId: tg.id, itemId: it.id, orderIndex: it.orderIndex } })
      }
    }
    return tpl
  }

  update(id: string, data: Partial<{ name: string; status: 'DRAFT' | 'PUBLISHED' }>) {
    return this.prisma.template.update({ where: { id }, data })
  }

  publish(id: string) {
    return this.prisma.template.update({ where: { id }, data: { status: 'PUBLISHED' } })
  }

  async setDefault(id: string) {
    await this.prisma.$transaction([
      this.prisma.template.updateMany({ data: { isDefault: false }, where: { isDefault: true } }),
      this.prisma.template.update({ where: { id }, data: { isDefault: true } }),
    ])
    return { ok: true }
  }

  async getDefaultStructure() {
    const tpl = await this.prisma.template.findFirst({
      where: { isDefault: true },
      include: {
        groups: {
          include: { group: true, items: { include: { item: true } } },
          orderBy: { orderIndex: 'asc' },
        },
      },
    })
    return tpl
  }

  getDetail(id: string) {
    return this.prisma.template.findUnique({
      where: { id },
      include: {
        groups: {
          include: { group: true, items: { include: { item: true } } },
          orderBy: { orderIndex: 'asc' },
        },
      },
    })
  }

  async addGroupToTemplate(templateId: string, data: { name: string; slug?: string; description?: string; orderIndex?: number; createdBy: string }) {
    const slug = data.slug ?? `grp_${Date.now()}`
    const group = await this.prisma.categoryGroup.create({ data: { name: data.name, slug, description: data.description, orderIndex: data.orderIndex ?? 0, isActive: true, createdBy: data.createdBy } })
    const tg = await this.prisma.templateGroup.create({ data: { templateId, groupId: group.id, orderIndex: group.orderIndex } })
    return { group, templateGroup: tg }
  }

  async addItemToTemplate(templateId: string, templateGroupId: string, data: { name: string; slug?: string; description?: string; orderIndex?: number; createdBy: string }) {
    const slug = data.slug ?? `item_${Date.now()}`
    const tg = await this.prisma.templateGroup.findUnique({ where: { id: templateGroupId } })
    if (!tg || tg.templateId !== templateId) throw new Error('invalid template group')
    const item = await this.prisma.categoryItem.create({ data: { groupId: tg.groupId, name: data.name, slug, description: data.description, orderIndex: data.orderIndex ?? 0, isActive: true, createdBy: data.createdBy } })
    const ti = await this.prisma.templateItem.create({ data: { templateGroupId, itemId: item.id, orderIndex: item.orderIndex } })
    return { item, templateItem: ti }
  }

  async removeTemplateGroup(templateGroupId: string) {
    await this.prisma.templateItem.deleteMany({ where: { templateGroupId } })
    await this.prisma.templateGroup.delete({ where: { id: templateGroupId } })
    return { ok: true }
  }

  async removeTemplateItem(templateItemId: string) {
    await this.prisma.templateItem.delete({ where: { id: templateItemId } })
    return { ok: true }
  }

  async deleteTemplate(id: string) {
    const groups = await this.prisma.templateGroup.findMany({ where: { templateId: id } })
    await this.prisma.$transaction([
      this.prisma.templateItem.deleteMany({ where: { templateGroupId: { in: groups.map(g => g.id) } } }),
      this.prisma.templateGroup.deleteMany({ where: { templateId: id } }),
      this.prisma.template.delete({ where: { id } }),
    ])
    return { ok: true }
  }

  async reorderTemplateGroups(templateId: string, items: Array<{ id: string; orderIndex: number }>) {
    const affected = await this.prisma.$transaction(
      items.map(i => this.prisma.templateGroup.update({ where: { id: i.id }, data: { orderIndex: i.orderIndex } }))
    )
    return { ok: true, count: affected.length }
  }

  async reorderTemplateItems(templateId: string, items: Array<{ id: string; orderIndex: number }>) {
    const affected = await this.prisma.$transaction(
      items.map(i => this.prisma.templateItem.update({ where: { id: i.id }, data: { orderIndex: i.orderIndex } }))
    )
    return { ok: true, count: affected.length }
  }

  async updateTemplateGroupName(templateGroupId: string, name: string) {
    const tg = await this.prisma.templateGroup.findUnique({ where: { id: templateGroupId } })
    if (!tg) throw new Error('template group not found')
    const updated = await this.prisma.categoryGroup.update({ where: { id: tg.groupId }, data: { name } })
    return { ok: true, group: updated }
  }

  async updateTemplateItemName(templateItemId: string, name: string) {
    const ti = await this.prisma.templateItem.findUnique({ where: { id: templateItemId } })
    if (!ti) throw new Error('template item not found')
    const updated = await this.prisma.categoryItem.update({ where: { id: ti.itemId }, data: { name } })
    return { ok: true, item: updated }
  }
}