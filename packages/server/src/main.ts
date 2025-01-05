import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import { SocketIOAdapter } from './common/socket-io.adapter.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MINAPLAY_VERSION } from './constants.js';
import { ApplicationLogger } from './common/application.logger.service.js';
import { bootstrap as globalProxyBootstrap } from 'global-agent';
import process from 'node:process';

async function bootstrap() {
  const logger = new ApplicationLogger();

  process.title = `MinaPlay v${MINAPLAY_VERSION}`;
  process.on('unhandledRejection', (reason: Error) => {
    logger.error(`Uncaught rejection: ${JSON.stringify(reason)}`, reason?.stack, 'MinaPlay');
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger });
  const configService = app.get(ConfigService);

  // global prefix
  app.setGlobalPrefix('/api/v1');

  // public dir
  app.useStaticAssets('public');

  // enable cors
  if (Number(configService.get('APP_ENABLE_CORS', 0)) === 1) {
    app.enableCors();
  }

  // use custom socket-io adapter
  app.useWebSocketAdapter(new SocketIOAdapter(app, configService));

  // global proxy setting
  const proxy = process.env.HTTP_PROXY ?? configService.get('APP_HTTP_PROXY');
  if (proxy && configService.get('APP_GLOBAL_PROXY')) {
    globalProxyBootstrap();
    global.GLOBAL_AGENT.HTTP_PROXY = proxy;
  }

  // swagger settings
  if (configService.get('APP_ENV') === 'dev') {
    const docOptions = new DocumentBuilder()
      .setTitle('MinaPlay')
      .setDescription('MinaPlay api document')
      .addBearerAuth()
      .setVersion(MINAPLAY_VERSION)
      .build();
    const doc = SwaggerModule.createDocument(app, docOptions);
    SwaggerModule.setup('doc', app, doc);
  }

  await app.listen(configService.get('APP_PORT', 3000), configService.get<string>('APP_HOST', '0.0.0.0'));
}

bootstrap();
