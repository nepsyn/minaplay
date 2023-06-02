import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // global prefix
  app.setGlobalPrefix('/api/v1');

  // enable cors
  app.enableCors();

  // swagger settings
  if (configService.get('APP_ENV') === 'development') {
    const docOptions = new DocumentBuilder()
      .setTitle('MinaPlay')
      .setDescription('MinaPlay api document')
      .addBearerAuth()
      .setVersion('1.0.0')
      .build();
    const doc = SwaggerModule.createDocument(app, docOptions);
    SwaggerModule.setup('doc', app, doc);
  }

  await app.listen(configService.get('APP_PORT', 3000), configService.get<string>('APP_HOST', '127.0.0.1'));
}

bootstrap();
