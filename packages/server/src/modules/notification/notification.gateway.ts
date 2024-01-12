import { ClassSerializerInterceptor, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { AuthorizationWsGuard } from '../authorization/authorization.ws.guard.js';
import { Server, Socket } from 'socket.io';
import { NotificationEventMap, NotificationEventType } from './notification-events.interface.js';
import { ApplicationGatewayExceptionFilter } from '../../common/application.gateway.exception.filter.js';
import { ApplicationGatewayInterceptor } from '../../common/application.gateway.interceptor.js';

@WebSocketGateway({
  namespace: 'notification',
})
@UseGuards(AuthorizationWsGuard)
@UseFilters(ApplicationGatewayExceptionFilter)
@UseInterceptors(ApplicationGatewayInterceptor, ClassSerializerInterceptor)
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server;

  async notify<T extends NotificationEventType>(event: T, data: NotificationEventMap[T], room?: string | string[]) {
    if (room) {
      this.server.to(room).emit(event, data);
    } else {
      this.server.emit(event, data);
    }
  }

  async handleConnection(socket: Socket) {
    socket.join(socket.data.user.id.toString());
  }
}
