import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { ConfigService } from '@nestjs/config';

export class SocketIOAdapter extends IoAdapter {
  constructor(app: INestApplicationContext, private configService: ConfigService) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    if (Number(this.configService.get('APP_ENABLE_CORS', 0)) === 1) {
      options.cors = {
        origin: '*',
      };
    }
    return super.createIOServer(port, options);
  }
}
