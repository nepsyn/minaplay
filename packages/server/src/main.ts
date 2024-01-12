import type { ExecaChildProcess } from 'execa';
import { execaNode } from 'execa';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import { SocketIOAdapter } from './common/socket-io.adapter.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MINAPLAY_VERSION } from './constants.js';
import { ProcMessage } from './interfaces/proc-message.js';
import { ApplicationLogger } from './common/application.logger.service.js';
import { ConsoleLogger } from '@nestjs/common';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

class MinaPlayApplication {
  private proc: ExecaChildProcess = undefined;
  private logger = new ConsoleLogger(MinaPlayApplication.name);

  async createAppProcess() {
    if (this.proc && !this.proc.killed) {
      this.proc.kill('SIGKILL');
    }

    const __filename = fileURLToPath(import.meta.url);
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
      if (signal && signal !== 'SIGKILL' && code !== 0) {
        this.logger.log('MinaPlay app exit, restarting in 5 seconds...');
        setTimeout(() => {
          app.createAppProcess();
        }, 5000);
      }
    });

    await this.proc;
  }

  async bootstrap() {
    process.on('unhandledRejection', (reason) => {
      this.logger.error(`Uncaught rejection: ${reason}`);
      process.exit(-1);
    });

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
