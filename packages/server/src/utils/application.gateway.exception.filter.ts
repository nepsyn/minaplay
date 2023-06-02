import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ErrorCodeEnum } from '../enums/error-code.enum';

@Catch(Error)
export class ApplicationGatewayExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(ApplicationGatewayExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    const socket: Socket = host.switchToWs().getClient();
    const syncId: number = host.switchToWs().getData().sync;
    if (exception instanceof WsException) {
      socket.emit('exception', {
        sync: syncId,
        ...(exception.getError() as object),
      });
    } else if (exception instanceof HttpException) {
      socket.emit('exception', {
        sync: syncId,
        ...(exception.getResponse() as object),
      });
    } else {
      socket.emit('exception', {
        sync: syncId,
        code: ErrorCodeEnum.INTERNAL_SERVER_ERROR,
        error: 'INTERNAL SERVER ERROR',
      });
      this.logger.error(exception.stack);
    }
  }
}
