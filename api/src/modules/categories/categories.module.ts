import { Module } from '@nestjs/common'
import { CategoryGroupsController } from './groups.controller'
import { CategoryItemsController } from './items.controller'
import { CategoriesService } from './categories.service'
import { PrismaModule } from '../../common/prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [CategoryGroupsController, CategoryItemsController],
  providers: [CategoriesService],
})
export class CategoriesModule {}