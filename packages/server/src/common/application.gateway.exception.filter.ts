import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ErrorCodeEnum } from '../enums/error-code.enum.js';
import { ApplicationLogger } from './application.logger.service.js';

@Catch(Error)
export class ApplicationGatewayExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new ApplicationLogger(ApplicationGatewayExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    const socket: Socket = host.switchToWs().getClient();
    const syncId: number = host.switchToWs().getData().sync;
    if (exception instanceof WsException) {
      const error = exception.getError();
      socket.emit('exception', {
        sync: syncId,
        code: error?.['code'] ?? ErrorCodeEnum.UNKNOWN_ERROR,
        message: error?.['message'] ?? exception.message,
      });
    } else if (exception instanceof HttpException) {
      const error = exception.getResponse();
      socket.emit('exception', {
        sync: syncId,
        code: error?.['code'] ?? ErrorCodeEnum.UNKNOWN_ERROR,
        message: error?.['message'] ?? exception.message,
      });
    } else {
      socket.emit('exception', {
        sync: syncId,
        code: exception?.['status'] ?? ErrorCodeEnum.INTERNAL_SERVER_ERROR,
        message: exception?.['message'] ?? 'INTERNAL SERVER ERROR',
      });
      this.logger.error(exception.message, exception.stack, ApplicationGatewayExceptionFilter.name);
    }
  }
}
