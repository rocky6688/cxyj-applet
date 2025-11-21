import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ transform: true }))

  const config = new DocumentBuilder().setTitle('API').setDescription('Service APIs').setVersion('1.0').addBearerAuth().build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.PORT ? Number(process.env.PORT) : 3000
  await app.listen(port)
  // LOG: start confirmation
  console.log(`API listening on http://localhost:${port}/api`)
}

bootstrap()