import { importESM } from './utils/import-esm.util';
import type { ExecaChildProcess } from 'execa';
import process from 'node:process';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SocketIOAdapter } from './common/socket-io.adapter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MINAPLAY_VERSION } from './constants';
import { ProcMessage } from './interfaces/proc-message';
import { ApplicationLogger } from './common/application.logger.service';

class MinaPlayApplication {
  private proc: ExecaChildProcess = undefined;

  async createAppProcess() {
    const { execaNode } = await importESM<typeof import('execa')>('execa');
    if (this.proc && !this.proc.killed) {
      this.proc.kill('SIGKILL');
    }

    this.proc = execaNode(__filename, ['bootstrap'], {
      cleanup: true,
      cwd: process.cwd(),
      env: process.env,
      reject: false,
      all: true,
    });
    this.proc.pipeStdout(process.stdout);
    this.proc.pipeStderr(process.stderr);

    this.proc.on('message', (message) => {
      if (typeof message === 'string') {
        const data: ProcMessage = JSON.parse(message);

        if (data.type === 'app-restart') {
          app.createAppProcess();
        }
      }
    });
    this.proc.on('exit', (code, signal) => {
      if (signal !== 'SIGKILL') {
        app.createAppProcess();
      }
    });

    await this.proc;
  }

  async bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: new ApplicationLogger(),
    });
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

    await app.listen(configService.get('APP_PORT', 3000), configService.get<string>('APP_HOST', '127.0.0.1'));
  }
}

const app = new MinaPlayApplication();
if (process.argv[2] === 'bootstrap') {
  app.bootstrap();
} else {
  app.createAppProcess();
}
