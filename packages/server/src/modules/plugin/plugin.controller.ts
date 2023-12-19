import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthorizationGuard } from '../authorization/authorization.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PluginService } from './plugin.service';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { PermissionEnum } from '../../enums/permission.enum';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { isDefined } from 'class-validator';

@Controller('plugins')
@UseGuards(AuthorizationGuard)
@ApiTags('plugins')
@ApiBearerAuth()
@RequirePermissions(PermissionEnum.ROOT_OP)
export class PluginController {
  constructor(private pluginService: PluginService) {}

  @Get()
  @ApiOperation({
    description: '获取所有插件信息',
  })
  async getAllPluginControls() {
    return this.pluginService.getAllControls();
  }

  @Post(':id/enable')
  @ApiOperation({
    description: '启用插件',
  })
  @HttpCode(200)
  async enablePlugin(@Param('id') id: string) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const control = await this.pluginService.toggleEnabled(id, true);
    if (!control) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return control;
  }

  @Post(':id/disable')
  @ApiOperation({
    description: '停用插件',
  })
  @HttpCode(200)
  async disablePlugin(@Param('id') id: string) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const control = await this.pluginService.toggleEnabled(id, false);
    if (!control) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return control;
  }
}
