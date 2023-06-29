import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { map, Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { buildException } from './build-exception.util';
import { ErrorCodeEnum } from '../enums/error-code.enum';

@Injectable()
export class ApplicationGatewayInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const socket: Socket = context.switchToWs().getClient();
    const syncId: number = context.switchToWs().getData().sync;
    if (syncId == null) {
      throw buildException(WsException, ErrorCodeEnum.NO_SYNC_FIELD);
    }

    return next.handle().pipe(
      map((data) => {
        const response = {
          sync: syncId,
          data: data ?? {},
        };
        socket.emit('response', response);
      }),
    );
  }
}
