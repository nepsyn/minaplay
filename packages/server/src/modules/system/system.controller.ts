import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthorizationGuard } from '../authorization/authorization.guard.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../authorization/require-permissions.decorator.js';
import { PermissionEnum } from '../../enums/index.js';
import { SystemService } from './system.service.js';
import { MINAPLAY_VERSION } from '../../constants.js';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApplicationLogger } from '../../common/application.logger.service.js';
import { RequestTimeout } from '../../common/request.timeout.decorator.js';

@Controller('system')
@UseGuards(AuthorizationGuard)
@ApiTags('system')
@ApiBearerAuth()
@RequirePermissions(PermissionEnum.ROOT_OP)
export class SystemController {
  constructor(private systemService: SystemService) {}

  @Get('status')
  @ApiOperation({
    description: '查看系统运行状态',
  })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60 * 1000)
  @RequestTimeout(30000)
  async getStatus() {
    return {
      startAt: this.systemService.startAt,
      memory: await this.systemService.getMemoryUsage(),
      disk: await this.systemService.getDiskUsage(),
      version: MINAPLAY_VERSION,
    };
  }

  @Get('logs')
  @ApiOperation({
    description: '获取程序日志',
  })
  async getApplicationLogs() {
    return {
      logs: ApplicationLogger.getHistoryMessages().join(''),
    };
  }
}
