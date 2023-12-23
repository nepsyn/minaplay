import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import {
  BadRequestException,
  ClassSerializerInterceptor,
  NotFoundException,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthorizationWsGuard } from '../authorization/authorization.ws.guard';
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
import { MinaplayMessage, parseMessage } from './live-chat-message-type';
import { LiveChatService } from './live-chat.service';
import { Between } from 'typeorm';
import { RoomOwnerOnly } from './room-owner-only.ws.decorator';
import { instanceToPlain } from 'class-transformer';
import { User } from '../user/user.entity';
import { LiveVoiceService } from './live-voice.service';
import { types as MediasoupTypes } from 'mediasoup';
import { LiveStreamService } from './live-stream.service';
import { VALID_VIDEO_MIME } from '../../constants';
import { MediaService } from '../media/media.service';
import { ForbiddenException } from '@nestjs/common/exceptions/forbidden.exception';
import { compare } from 'bcrypt';
import { ApplicationGatewayInterceptor } from '../../common/application.gateway.interceptor';
import { ApplicationGatewayExceptionFilter } from '../../common/application.gateway.exception.filter';
import { isDefined } from 'class-validator';

@WebSocketGateway({
  namespace: 'live',
})
@UseGuards(AuthorizationWsGuard)
@UseFilters(ApplicationGatewayExceptionFilter)
@UseInterceptors(ApplicationGatewayInterceptor, ClassSerializerInterceptor, LiveStateWsInterceptor)
export class LiveGateway implements OnGatewayDisconnect {
  constructor(
    private liveService: LiveService,
    private liveVoiceService: LiveVoiceService,
    private liveChatService: LiveChatService,
    private liveStreamService: LiveStreamService,
    private mediaService: MediaService,
  ) {}

  @WebSocketServer()
  private readonly server: Server;

  @SubscribeMessage('info')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  async handleInfo(@MessageBody('id') id: string) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const live = await this.liveService.findOneBy({ id });
    if (!live) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return live;
  }

  @SubscribeMessage('join')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  async handleJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody('id') id: string,
    @MessageBody('password') password: string,
  ) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const live = await this.liveService.findOneBy({ id });
    if (!live) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    if (live.hasPassword && live.user?.id !== socket.data.user.id) {
      const valid = isDefined(password) ? await compare(password, live.password) : false;
      if (!valid) {
        throw buildException(ForbiddenException, ErrorCodeEnum.WRONG_LIVE_PASSWORD);
      }
    }

    const clients = await this.server.fetchSockets();
    const client = clients.find(
      (client) => client.id !== socket.id && client.data.user && client.data.user.id === socket.data.user.id,
    );
    if (client) {
      throw buildException(ForbiddenException, ErrorCodeEnum.DUPLICATED_CONNECTION);
    }

    await this.makeClientLeaveCurrentRoom(socket);
    socket.join(live.id);
    socket.data.live = live;

    this.server.to(live.id).emit('member-join', {
      user: instanceToPlain(socket.data.user),
    });

    const group = await this.liveVoiceService.getVoiceGroup(id);
    group.peers.set(socket.data.user.id, {
      transports: new Map(),
      producers: new Map(),
      consumers: new Map(),
    });

    const state = await this.liveService.createOrGetLiveState(live.id);
    if (!state.users.find((user) => user.id === socket.data.user.id)) {
      state.users.push(instanceToPlain(socket.data.user) as User);
    }
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
    if (!isDefined(startTime)) {
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
  @RoomOwnerOnly()
  async handleRevoke(@ConnectedSocket() socket: Socket, @MessageBody('id') id: string) {
    if (!isDefined(id)) {
      throw buildException(WsException, ErrorCodeEnum.BAD_REQUEST);
    }

    await this.liveChatService.delete({ id });
    this.server.to(socket.data.live.id).emit('member-chat-revoke', { id });
  }

  @SubscribeMessage('mute-chat')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP)
  @UseGuards(LiveAudienceWsGuard)
  @RoomOwnerOnly()
  async handleMute(@ConnectedSocket() socket: Socket, @WsLiveState() state: LiveState, @MessageBody('id') id: number) {
    if (!isDefined(id)) {
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
  @RoomOwnerOnly()
  async handleUnmute(
    @ConnectedSocket() socket: Socket,
    @WsLiveState() state: LiveState,
    @MessageBody('id') id: number,
  ) {
    if (!isDefined(id)) {
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
  async handleQuit(@ConnectedSocket() socket: Socket) {
    this.server.to(socket.data.live.id).emit('member-quit', {
      user: instanceToPlain(socket.data.user),
    });

    await this.makeClientLeaveCurrentRoom(socket);
  }

  @SubscribeMessage('kick')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP)
  @UseGuards(LiveAudienceWsGuard)
  @RoomOwnerOnly()
  async handleKick(@ConnectedSocket() socket: Socket, @MessageBody('id') id: number) {
    if (!isDefined(id) || id === socket.data.user.id) {
      throw buildException(WsException, ErrorCodeEnum.BAD_REQUEST);
    }

    const sockets = await this.server.to(socket.data.live.id).fetchSockets();
    const client = sockets.find((client) => client.data.user.id === id);
    if (client) {
      this.server.to(socket.data.live.id).emit('member-kick', {
        user: instanceToPlain(client.data.user),
      });
      await this.makeClientLeaveCurrentRoom(client);
    }
  }

  @SubscribeMessage('stream-media')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP)
  @UseGuards(LiveAudienceWsGuard)
  @RoomOwnerOnly()
  async handleStreamFile(
    @ConnectedSocket() socket: Socket,
    @WsLiveState() state: LiveState,
    @MessageBody('id') id: string,
  ) {
    if (!isDefined(id)) {
      throw buildException(WsException, ErrorCodeEnum.BAD_REQUEST);
    }

    const media = await this.mediaService.findOneBy({ id });
    if (!(media && media.file?.isExist)) {
      throw buildException(WsException, ErrorCodeEnum.NOT_FOUND);
    }
    if (!VALID_VIDEO_MIME.includes(media.file.mimetype)) {
      throw buildException(WsException, ErrorCodeEnum.INVALID_VIDEO_FILE_TYPE);
    }

    const url = await this.liveStreamService.publishVideoFile(socket.data.live.id, media.file.path);
    state.stream = {
      type: 'server-push',
      media: {
        title: media.name,
        url,
      },
      updateAt: new Date(),
    };

    this.server.to(socket.data.live.id).emit('stream', {
      stream: state.stream,
    });
  }

  @SubscribeMessage('stop-stream-media')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP)
  @UseGuards(LiveAudienceWsGuard)
  @RoomOwnerOnly()
  async handleStopStreamFile(@ConnectedSocket() socket: Socket, @WsLiveState() state: LiveState) {
    await this.liveStreamService.stopPublish(socket.data.live.id);
    state.stream = undefined;

    this.server.to(socket.data.live.id).emit('stream', {
      stream: state.stream,
    });
  }

  @SubscribeMessage('voice-rtp-capabilities')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  @UseGuards(LiveAudienceWsGuard)
  async handleVoiceRtpCapabilities(@ConnectedSocket() socket: Socket) {
    const group = await this.liveVoiceService.getVoiceGroup(socket.data.live.id);
    return group.router.rtpCapabilities;
  }

  @SubscribeMessage('voice-get-producers')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  @UseGuards(LiveAudienceWsGuard)
  async handleVoiceGetProducers(@ConnectedSocket() socket: Socket) {
    const group = await this.liveVoiceService.getVoiceGroup(socket.data.live.id);
    const maps: { userId: number; producerId: string }[] = [];
    for (const [peerId, peer] of group.peers) {
      for (const producer of peer.producers.values()) {
        maps.push({
          userId: peerId,
          producerId: producer.id,
        });
      }
    }
    return maps;
  }

  @SubscribeMessage('voice-create-webrtc-transport')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  @UseGuards(LiveAudienceWsGuard)
  async handleVoiceCreateWebrtcTransport(@ConnectedSocket() socket: Socket) {
    const transport = await this.liveVoiceService.createWebRtcTransport(socket.data.live.id, socket.data.user.id);

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  @SubscribeMessage('voice-connect-webrtc-transport')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  @UseGuards(LiveAudienceWsGuard)
  async handleVoiceConnectWebrtcTransport(
    @ConnectedSocket() socket: Socket,
    @MessageBody('transportId') transportId: string,
    @MessageBody('dtlsParameters') dtlsParameters: MediasoupTypes.DtlsParameters,
  ) {
    if (!isDefined(transportId)) {
      throw buildException(WsException, ErrorCodeEnum.BAD_REQUEST);
    }

    await this.liveVoiceService.connectTransport(socket.data.live.id, socket.data.user.id, transportId, dtlsParameters);
  }

  @SubscribeMessage('voice-create-producer')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  @UseGuards(LiveAudienceWsGuard)
  async handleVoiceCreateProducer(
    @ConnectedSocket() socket: Socket,
    @MessageBody('transportId') transportId: string,
    @MessageBody('rtpParameters') rtpParameters: MediasoupTypes.RtpParameters,
  ) {
    if (!isDefined(transportId)) {
      throw buildException(WsException, ErrorCodeEnum.BAD_REQUEST);
    }

    const producer = await this.liveVoiceService.createProducer(
      socket.data.live.id,
      socket.data.user.id,
      transportId,
      rtpParameters,
    );

    if (!producer) {
      throw buildException(WsException, ErrorCodeEnum.VOICE_SERVICE_ESTABLISH_FAILED);
    }

    producer.on('transportclose', () => {
      this.server.to(socket.data.live.id).emit('voice-closed-producer', {
        userId: socket.data.user.id,
        producerId: producer.id,
      });
    });

    // 通知
    this.server.to(socket.data.live.id).emit('voice-new-producer', {
      userId: socket.data.user.id,
      producerId: producer.id,
    });

    return {
      producerId: producer.id,
    };
  }

  @SubscribeMessage('voice-create-consumer')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  @UseGuards(LiveAudienceWsGuard)
  async handleVoiceCreateConsumer(
    @ConnectedSocket() socket: Socket,
    @MessageBody('transportId') transportId: string,
    @MessageBody('producerId') producerId: string,
    @MessageBody('rtpCapabilities') rtpCapabilities: MediasoupTypes.RtpCapabilities,
  ) {
    if (!isDefined(transportId) || !isDefined(producerId)) {
      throw buildException(WsException, ErrorCodeEnum.BAD_REQUEST);
    }

    const consumer = await this.liveVoiceService.createConsumer(
      socket.data.live.id,
      socket.data.user.id,
      transportId,
      producerId,
      rtpCapabilities,
    );

    if (!consumer) {
      throw buildException(WsException, ErrorCodeEnum.VOICE_SERVICE_ESTABLISH_FAILED);
    }

    consumer.on('transportclose', () => {
      this.server.to(socket.data.live.id).emit('voice-closed-consumer', {
        userId: socket.data.user.id,
        consumer: consumer.id,
      });
    });

    return {
      consumerId: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
      producerPaused: consumer.producerPaused,
    };
  }

  async dispose(liveId: string) {
    // 发送关闭广播
    this.server.to(liveId).emit('live-dispose');
    // 清除数据
    for (const socket of await this.server.to(liveId).fetchSockets()) {
      socket.data.live = undefined;
      socket.data.state = undefined;
    }
    // 使用户退出房间
    this.server.to(liveId).socketsLeave(liveId);
    // 关闭房间语音服务
    await this.liveVoiceService.removeGroup(liveId);
  }

  private async makeClientLeaveCurrentRoom(socket: Socket | RemoteSocket<any, any>) {
    if (socket.data.live) {
      // 退出房间
      socket.leave(socket.data.live.id);

      // 更新用户
      const state = await this.liveService.createOrGetLiveState(socket.data.live.id);
      state.users = state.users.filter((user: User) => user.id !== socket.data.user?.id);
      await this.liveService.updateLiveState(state);

      // 退出语音
      await this.liveVoiceService.removePeer(socket.data.live.id, socket.data.user?.id);

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
