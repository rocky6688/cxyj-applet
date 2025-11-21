import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  await prisma.$connect()
  const groups: Array<{ slug: string; name: string }> = [
    { slug: 'demolition', name: '基本拆除类' },
    { slug: 'wall', name: '墙面类' },
    { slug: 'ceiling', name: '天花类' },
    { slug: 'floor', name: '地面类' },
    { slug: 'comprehensive', name: '综合类' },
  ]

  let order = 0
  for (const g of groups) {
    const existing = await prisma.categoryGroup.findUnique({ where: { slug: g.slug } })
    if (!existing) {
      await prisma.categoryGroup.create({
        data: {
          name: g.name,
          slug: g.slug,
          orderIndex: order++,
          isActive: true,
          createdBy: 'system',
        },
      })
    }
  }
  console.log('Seeded category groups')
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})