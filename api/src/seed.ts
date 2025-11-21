import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'

async function main() {
  const prisma = new PrismaClient()
  await prisma.$connect()
  const admin = await prisma.user.findUnique({ where: { username: 'admin' } })
  if (!admin) {
    const hash = await argon2.hash('admin123')
    await prisma.user.create({ data: { username: 'admin', passwordHash: hash, role: 'ADMIN', status: 'ACTIVE' } })
    console.log('Seeded admin account: admin/admin123')
  } else {
    console.log('Admin exists')
  }
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})