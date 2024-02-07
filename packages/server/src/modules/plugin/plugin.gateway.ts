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
import { PluginControl } from './plugin-control.js';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

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
  async handleConsole(@ConnectedSocket() socket: Socket, @MessageBody('message') message: MinaPlayMessage) {
    message = parseMessage(message);
    if (!message) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    this.pluginService.handleGatewayMessage(message, socket);
  }

  @SubscribeMessage('commands')
  @RequirePermissions(PermissionEnum.ROOT_OP)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60 * 1000)
  async handleCommands() {
    const programs = new Map<string, { control: PluginControl; description: string }[]>();
    for (const control of this.pluginService.enabledPluginControls) {
      for (const [bin, command] of control.commands) {
        const desc = programs.get(bin) ?? [];
        desc.push({
          control,
          description: command.program.description(),
        });
        programs.set(bin, desc);
      }
    }
    return programs;
  }
}
