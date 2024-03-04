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
import { ErrorCodeEnum, PermissionEnum } from '../../enums/index.js';
import { PluginService } from './plugin.service.js';
import { RequirePermissions } from '../authorization/require-permissions.decorator.js';
import { Socket } from 'socket.io';
import { ApplicationGatewayInterceptor } from '../../common/application.gateway.interceptor.js';
import { PluginControl } from './plugin-control.js';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { buildPluginCommand } from '../../utils/build-plugin-command.js';

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
  async handleConsole(
    @ConnectedSocket() socket: Socket,
    @MessageBody('message') message: MinaPlayMessage,
    @MessageBody('locale') locale?: string,
  ) {
    message = parseMessage(message);
    if (!message) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    this.pluginService.handleGatewayMessage(message, socket, locale).catch();
  }

  @SubscribeMessage('commands')
  @RequirePermissions(PermissionEnum.ROOT_OP)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60 * 1000)
  async handleCommands() {
    const programs: { program: string; control: PluginControl; description: string }[] = [];
    for (const control of this.pluginService.enabledPluginControls) {
      for (const metadata of control.commands) {
        programs.push({
          program: metadata.bin,
          control,
          description: buildPluginCommand(metadata).description(),
        });
      }
    }
    return programs;
  }
}
