import { PrismaClient } from '@prisma/client'
import path from 'path'

async function main() {
  const prisma = new PrismaClient()
  await prisma.$connect()
  const dataModule = require(path.resolve(__dirname, '../../utils/data.js'))
  const renovationData = dataModule.renovationData

  const groups = [] as { id: string; key: string }[]
  let gi = 0
  for (const [key, val] of Object.entries(renovationData as Record<string, any>)) {
    const existing = await prisma.categoryGroup.findUnique({ where: { slug: key } })
    const g = existing
      ? await prisma.categoryGroup.update({ where: { id: existing.id }, data: { name: (val as any).title, orderIndex: gi++, isActive: true } })
      : await prisma.categoryGroup.create({ data: { name: (val as any).title, slug: key, orderIndex: gi++, isActive: true, createdBy: 'system' } })
    groups.push({ id: g.id, key })
    let ii = 0
    for (const item of (val as any).items) {
      const existItem = await prisma.categoryItem.findUnique({ where: { slug: item.id } })
      if (existItem) {
        await prisma.categoryItem.update({ where: { id: existItem.id }, data: { groupId: g.id, name: item.name, description: `${item.unit}`, orderIndex: ii++, isActive: true } })
      } else {
        await prisma.categoryItem.create({ data: { groupId: g.id, name: item.name, slug: item.id, description: `${item.unit}`, orderIndex: ii++, isActive: true, createdBy: 'system' } })
      }
    }
  }
  await prisma.$transaction(async tx => {
    await tx.template.updateMany({ data: { isDefault: false }, where: { isDefault: true } })
    const tpl = await tx.template.create({ data: { name: '默认模板', isDefault: true, status: 'PUBLISHED', createdBy: 'system' } })
    const allGroups = await tx.categoryGroup.findMany({ include: { items: true }, orderBy: { orderIndex: 'asc' } })
    for (const g of allGroups) {
      const tg = await tx.templateGroup.create({ data: { templateId: tpl.id, groupId: g.id, orderIndex: g.orderIndex } })
      for (const it of g.items) {
        await tx.templateItem.create({ data: { templateGroupId: tg.id, itemId: it.id, orderIndex: it.orderIndex } })
      }
    }
  })
  console.log('Imported default template')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })