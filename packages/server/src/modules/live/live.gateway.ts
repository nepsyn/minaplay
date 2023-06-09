import {
  BaseWsExceptionFilter,
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ClassSerializerInterceptor, NotFoundException, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthorizationWsGuard } from '../authorization/authorization.ws.guard';
import { ApplicationGatewayInterceptor } from '../../utils/application.gateway.interceptor';
import { LiveService } from './live.service';
import { LiveCacheWsInterceptor } from './live-cache.ws.interceptor';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { PermissionEnum } from '../../enums/permission.enum';
import { Server, Socket } from 'socket.io';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { LiveAudienceWsGuard } from './live-audience.ws.guard.service';
import { WsLiveCache } from './live-cache.ws.decorator';
import { LiveCache } from './live.cache';

@WebSocketGateway()
@UseGuards(AuthorizationWsGuard)
@UseFilters(BaseWsExceptionFilter)
@UseInterceptors(ApplicationGatewayInterceptor, ClassSerializerInterceptor, LiveCacheWsInterceptor)
export class LiveGateway implements OnGatewayDisconnect {
  constructor(private liveService: LiveService) {}

  @WebSocketServer()
  private readonly server: Server;

  @SubscribeMessage('join')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  async handleJoin(@ConnectedSocket() socket: Socket, @MessageBody('id') id: string) {
    const live = await this.liveService.findOneBy({ id });
    if (!live) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.makeClientLeaveCurrentRoom(socket);
    socket.join(live.id);
    socket.data.live = live;

    this.server.to(live.id).emit('member-join', {
      user: socket.data.user,
    });

    return await this.liveService.getLiveCache(live.id);
  }

  @SubscribeMessage('state')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  @UseGuards(LiveAudienceWsGuard)
  async handleState(@WsLiveCache() cache: LiveCache) {
    return cache;
  }

  @SubscribeMessage('quit')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  @UseGuards(LiveAudienceWsGuard)
  async handleQuit(@ConnectedSocket() socket: Socket, @WsLiveCache() cache: LiveCache) {
    this.server.to(socket.data.live.id).emit('member-quit', {
      user: socket.data.user,
    });
    await this.makeClientLeaveCurrentRoom(socket);
    cache.users = cache.users.filter((user) => user.id !== socket.data.user.id);
  }

  private async makeClientLeaveCurrentRoom(socket: Socket) {
    const id = socket.data.live?.id;
    if (id) {
      // 退出房间
      socket.leave(id);
      // 清除数据
      socket.data.live = undefined;
      socket.data.cache = undefined;
    }
  }

  async handleDisconnect(socket: Socket) {
    if (socket.data.live) {
      this.server.to(socket.data.live.id).emit('member-quit', {
        user: socket.data.user,
      });
      await this.makeClientLeaveCurrentRoom(socket);
    }
  }
}
