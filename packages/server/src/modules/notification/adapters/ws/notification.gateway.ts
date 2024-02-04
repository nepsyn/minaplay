import { ClassSerializerInterceptor, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { AuthorizationWsGuard } from '../../../authorization/authorization.ws.guard.js';
import { Server, Socket } from 'socket.io';
import { ApplicationGatewayExceptionFilter } from '../../../../common/application.gateway.exception.filter.js';
import { ApplicationGatewayInterceptor } from '../../../../common/application.gateway.interceptor.js';
import { AuthorizationService } from '../../../authorization/authorization.service.js';
import { ErrorCodeEnum } from '../../../../enums/error-code.enum.js';
import { UserService } from '../../../user/user.service.js';
import { User } from '../../../user/user.entity.js';

@WebSocketGateway({
  namespace: 'notification',
})
@UseGuards(AuthorizationWsGuard)
@UseFilters(ApplicationGatewayExceptionFilter)
@UseInterceptors(ApplicationGatewayInterceptor, ClassSerializerInterceptor)
export class NotificationGateway implements OnGatewayConnection {
  constructor(private authorizationService: AuthorizationService, private userService: UserService) {}

  @WebSocketServer()
  readonly server: Server;

  async handleConnection(socket: Socket) {
    try {
      const token: string = socket.handshake?.headers?.authorization;
      const payload: Pick<User, 'id' | 'ticket'> = await this.authorizationService.verifyToken(token);
      const user = await this.userService.findOneBy({ id: payload.id });
      if (!user || user.ticket !== payload.ticket) {
        socket.emit('exception', {
          sync: null,
          code: ErrorCodeEnum.INVALID_TOKEN,
          message: 'INVALID TOKEN',
        });
        socket.disconnect(true);
      } else {
        socket.join(user.id.toString());
      }
    } catch {
      socket.emit('exception', {
        sync: null,
        code: ErrorCodeEnum.INVALID_TOKEN,
        message: 'INVALID TOKEN',
      });
      socket.disconnect(true);
    }
  }
}
