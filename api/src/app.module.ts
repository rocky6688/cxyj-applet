import { Module } from '@nestjs/common'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { CategoriesModule } from './modules/categories/categories.module'
import { TemplatesModule } from './modules/templates/templates.module'
import { ComputeModule } from './modules/compute/compute.module'
import { HealthModule } from './modules/health/health.module'

@Module({
  imports: [AuthModule, UsersModule, CategoriesModule, TemplatesModule, ComputeModule, HealthModule],
})
export class AppModule {}