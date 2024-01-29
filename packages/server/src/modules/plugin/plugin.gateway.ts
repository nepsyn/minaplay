import {
  BadRequestException,
  ClassSerializerInterceptor,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { AuthorizationWsGuard } from '../authorization/authorization.ws.guard.js';
import { ApplicationGatewayExceptionFilter } from '../../common/application.gateway.exception.filter.js';
import { MinaPlayMessage, parseMessage } from '../../common/application.message.js';
import { buildException } from '../../utils/build-exception.util.js';
import { ErrorCodeEnum } from '../../enums/error-code.enum.js';
import { PluginService } from './plugin.service.js';
import { RequirePermissions } from '../authorization/require-permissions.decorator.js';
import { PermissionEnum } from '../../enums/permission.enum.js';
import { Socket } from 'socket.io';
import { ApplicationGatewayInterceptor } from '../../common/application.gateway.interceptor.js';

@WebSocketGateway({
  namespace: 'plugin',
})
@UseGuards(AuthorizationWsGuard)
@UseFilters(ApplicationGatewayExceptionFilter)
@UseInterceptors(ApplicationGatewayInterceptor, ClassSerializerInterceptor)
export class PluginGateway {
  constructor(private pluginService: PluginService) {}

  @SubscribeMessage('console')
  @RequirePermissions(PermissionEnum.ROOT_OP)
  async handleCommand(@ConnectedSocket() socket: Socket, @MessageBody() body: MinaPlayMessage) {
    const message = parseMessage(body);
    if (!message) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    this.pluginService.handleGatewayMessage(message, socket);
  }
}
