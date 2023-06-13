import {
  BaseWsExceptionFilter,
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { ClassSerializerInterceptor, NotFoundException, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthorizationWsGuard } from '../authorization/authorization.ws.guard';
import { ApplicationGatewayInterceptor } from '../../utils/application.gateway.interceptor';
import { LiveService } from './live.service';
import { LiveStateWsInterceptor } from './live-state.ws.interceptor';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { PermissionEnum } from '../../enums/permission.enum';
import { RemoteSocket, Server, Socket } from 'socket.io';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { LiveAudienceWsGuard } from './live-audience.ws.guard.service';
import { WsLiveState } from './live-state.ws.decorator';
import { LiveState } from './live.state';
import { MinaplayMessage, parseMessage } from '../../utils/message-type';
import { LiveChatService } from './live-chat.service';
import { Between } from 'typeorm';
import { RequireAdmin } from './require-admin.ws.decorator';
import { instanceToPlain } from 'class-transformer';
import { User } from '../user/user.entity';

@WebSocketGateway()
@UseGuards(AuthorizationWsGuard)
@UseFilters(BaseWsExceptionFilter)
@UseInterceptors(ApplicationGatewayInterceptor, ClassSerializerInterceptor, LiveStateWsInterceptor)
export class LiveGateway implements OnGatewayDisconnect {
  constructor(private liveService: LiveService, private liveChatService: LiveChatService) {}

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
      user: instanceToPlain(socket.data.user),
    });

    const state = await this.liveService.createLiveState(live.id);
    state.users.push(instanceToPlain(socket.data.user) as User);
    await this.liveService.updateLiveState(state);

    return state;
  }

  @SubscribeMessage('state')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  @UseGuards(LiveAudienceWsGuard)
  async handleState(@WsLiveState() state: LiveState) {
    return state;
  }

  @SubscribeMessage('members')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  @UseGuards(LiveAudienceWsGuard)
  async handleMembers(@WsLiveState() state: LiveState) {
    return state.users;
  }

  @SubscribeMessage('chat')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  @UseGuards(LiveAudienceWsGuard)
  async handleChat(
    @ConnectedSocket() socket: Socket,
    @WsLiveState() state: LiveState,
    @MessageBody('message') message: MinaplayMessage,
  ) {
    if (state.muted.chat.includes(socket.data.user.id)) {
      throw buildException(WsException, ErrorCodeEnum.USER_CHAT_MUTED);
    }

    message = parseMessage(message);
    if (!message) {
      throw buildException(WsException, ErrorCodeEnum.BAD_REQUEST);
    }

    const chat = await this.liveChatService.save({
      live: { id: socket.data.live.id },
      user: { id: socket.data.user.id },
      type: message.type,
      content: JSON.stringify(message),
    });

    this.server.to(socket.data.live.id).emit('member-chat', {
      id: chat.id,
      user: instanceToPlain(socket.data.user),
      message,
      createAt: chat.createAt,
    });
  }

  @SubscribeMessage('messages')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  @UseGuards(LiveAudienceWsGuard)
  async handleMessages(
    @ConnectedSocket() socket: Socket,
    @MessageBody('start') startTime: Date,
    @MessageBody('end') endTime?: Date,
  ) {
    if (!startTime) {
      throw buildException(WsException, ErrorCodeEnum.BAD_REQUEST);
    }

    const [result] = await this.liveChatService.findAndCount({
      where: {
        live: { id: socket.data.live.id },
        createAt: Between(new Date(startTime), endTime ? new Date(endTime) : new Date()),
      },
      order: { createAt: 'ASC' },
    });

    return result;
  }

  @SubscribeMessage('revoke')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP)
  @UseGuards(LiveAudienceWsGuard)
  @RequireAdmin()
  async handleRevoke(@ConnectedSocket() socket: Socket, @MessageBody('id') id: string) {
    if (!id) {
      throw buildException(WsException, ErrorCodeEnum.BAD_REQUEST);
    }

    await this.liveChatService.delete({ id });
    this.server.to(socket.data.live.id).emit('member-chat-revoke', { id });
  }

  @SubscribeMessage('mute-chat')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP)
  @UseGuards(LiveAudienceWsGuard)
  @RequireAdmin()
  async handleMute(@ConnectedSocket() socket: Socket, @WsLiveState() state: LiveState, @MessageBody('id') id: number) {
    if (!id) {
      throw buildException(WsException, ErrorCodeEnum.BAD_REQUEST);
    }

    if (!state.muted.chat.includes(id)) {
      state.muted.chat.push(id);
      this.server.to(socket.data.live.id).emit('member-mute-chat', {
        id,
      });
    }
  }

  @SubscribeMessage('unmute-chat')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP)
  @UseGuards(LiveAudienceWsGuard)
  @RequireAdmin()
  async handleUnmute(
    @ConnectedSocket() socket: Socket,
    @WsLiveState() state: LiveState,
    @MessageBody('id') id: number,
  ) {
    if (!id) {
      throw buildException(WsException, ErrorCodeEnum.BAD_REQUEST);
    }

    state.muted.chat = state.muted.chat.filter((userId) => userId !== id);
    this.server.to(socket.data.live.id).emit('member-unmute-chat', {
      id,
    });
  }

  @SubscribeMessage('quit')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  @UseGuards(LiveAudienceWsGuard)
  async handleQuit(@ConnectedSocket() socket: Socket, @WsLiveState() state: LiveState) {
    this.server.to(socket.data.live.id).emit('member-quit', {
      user: instanceToPlain(socket.data.user),
    });

    await this.makeClientLeaveCurrentRoom(socket);
  }

  @SubscribeMessage('kick')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP)
  @UseGuards(LiveAudienceWsGuard)
  @RequireAdmin()
  async handleKick(@ConnectedSocket() socket: Socket, @WsLiveState() state: LiveState, @MessageBody('id') id: number) {
    if (!id || id === socket.data.user.id) {
      throw buildException(WsException, ErrorCodeEnum.BAD_REQUEST);
    }

    const sockets = await this.server.to(socket.data.live.id).fetchSockets();
    const client = sockets.find((client) => client.data.user.id === id);
    if (client) {
      this.server.to(socket.data.roomId).emit('member-kick', {
        user: instanceToPlain(client.data.user),
      });
      await this.makeClientLeaveCurrentRoom(client);
    }
  }

  private async makeClientLeaveCurrentRoom(socket: Socket | RemoteSocket<any, any>) {
    if (socket.data.live) {
      // 退出房间
      socket.leave(socket.data.live.id);
      // 更新房间用户
      socket.data.state.users = socket.data.state.users.filter((user) => user.id !== socket.data.user.id);
      await this.liveService.updateLiveState(socket.data.state);
      // 清除数据
      socket.data.live = undefined;
      socket.data.state = undefined;
    }
  }

  async handleDisconnect(socket: Socket) {
    if (socket.data.live) {
      this.server.to(socket.data.live.id).emit('member-quit', {
        user: instanceToPlain(socket.data.user),
      });
    }
    
    await this.makeClientLeaveCurrentRoom(socket);
  }
}
