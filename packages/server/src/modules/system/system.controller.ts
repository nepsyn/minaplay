import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthorizationGuard } from '../authorization/authorization.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { PermissionEnum } from '../../enums/permission.enum';
import { SystemService } from './system.service';
import { ConfigService } from '@nestjs/config';

@Controller('system')
@UseGuards(AuthorizationGuard)
@ApiTags('system')
@ApiBearerAuth()
@RequirePermissions(PermissionEnum.ROOT_OP)
export class SystemController {
  constructor(private configService: ConfigService, private systemService: SystemService) {}

  @Get('status')
  @ApiOperation({
    description: '查看系统运行状态',
  })
  async getStatus() {
    return {
      startAt: this.systemService.startAt,
      memory: await this.systemService.getMemoryUsage(),
      disk: await this.systemService.getDiskUsage(),
    };
  }
}
