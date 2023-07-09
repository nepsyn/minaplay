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
      const error = exception.getError();
      if (typeof error === 'object' && 'code' in error) {
        socket.emit('exception', {
          sync: syncId,
          ...error,
        });
      } else {
        socket.emit('exception', {
          sync: syncId,
          code: ErrorCodeEnum.UNKNOWN_ERROR,
          error: exception.message,
        });
      }
    } else if (exception instanceof HttpException) {
      const error = exception.getResponse();
      if (typeof error === 'object' && 'code' in error) {
        socket.emit('exception', {
          sync: syncId,
          ...error,
        });
      } else {
        socket.emit('exception', {
          sync: syncId,
          code: ErrorCodeEnum.UNKNOWN_ERROR,
          error: exception.message,
        });
      }
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
