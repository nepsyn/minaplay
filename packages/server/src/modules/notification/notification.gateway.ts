import { ClassSerializerInterceptor, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { AuthorizationWsGuard } from '../authorization/authorization.ws.guard';
import { ApplicationGatewayExceptionFilter } from '../../utils/application.gateway.exception.filter';
import { ApplicationGatewayInterceptor } from '../../utils/application.gateway.interceptor';
import { Server, Socket } from 'socket.io';
import { NotificationEventMap, NotificationEventType } from './notification-events.interface';

@WebSocketGateway({
  namespace: 'notification',
})
@UseGuards(AuthorizationWsGuard)
@UseFilters(ApplicationGatewayExceptionFilter)
@UseInterceptors(ApplicationGatewayInterceptor, ClassSerializerInterceptor)
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server;

  async notify<T extends NotificationEventType>(event: T, data: NotificationEventMap[T], room: string | string[]) {
    this.server.to(room).emit(event, data);
  }

  async handleConnection(socket: Socket) {
    socket.join(socket.data.user.id.toString());
  }
}
