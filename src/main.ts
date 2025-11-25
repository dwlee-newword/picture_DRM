import 'dotenv-flow/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  console.log(`Running in ${process.env.NODE_ENV} mode`);
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Picture DRM API')
      .setDescription('API 설명서')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  // Serve uploaded files from /uploads as static assets
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  await app.listen(process.env.NODE_PORT ?? 3000);
}
bootstrap();
