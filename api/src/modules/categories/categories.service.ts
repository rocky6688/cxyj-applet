import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  listGroups() {
    return this.prisma.categoryGroup.findMany({ orderBy: { orderIndex: 'asc' } })
  }
  createGroup(data: { name: string; slug: string; description?: string; isActive?: boolean; createdBy: string }) {
    return this.prisma.categoryGroup.create({ data: { ...data, orderIndex: 0, isActive: data.isActive ?? true } })
  }
  updateGroup(id: string, data: Partial<{ name: string; slug: string; description?: string; isActive?: boolean }>) {
    return this.prisma.categoryGroup.update({ where: { id }, data })
  }
  removeGroup(id: string) {
    return this.prisma.categoryGroup.delete({ where: { id } })
  }
  async reorderGroups(items: Array<{ id: string; orderIndex: number }>) {
    return this.prisma.$transaction(items.map(i => this.prisma.categoryGroup.update({ where: { id: i.id }, data: { orderIndex: i.orderIndex } })))
  }

  listItems(groupId?: string) {
    return this.prisma.categoryItem.findMany({ where: groupId ? { groupId } : {}, orderBy: { orderIndex: 'asc' } })
  }
  createItem(data: { groupId: string; name: string; slug: string; description?: string; isActive?: boolean; createdBy: string }) {
    return this.prisma.categoryItem.create({ data: { ...data, orderIndex: 0, isActive: data.isActive ?? true } })
  }
  updateItem(id: string, data: Partial<{ name: string; slug: string; description?: string; isActive?: boolean }>) {
    return this.prisma.categoryItem.update({ where: { id }, data })
  }
  removeItem(id: string) {
    return this.prisma.categoryItem.delete({ where: { id } })
  }
  async reorderItems(items: Array<{ id: string; orderIndex: number }>) {
    return this.prisma.$transaction(items.map(i => this.prisma.categoryItem.update({ where: { id: i.id }, data: { orderIndex: i.orderIndex } })))
  }
}