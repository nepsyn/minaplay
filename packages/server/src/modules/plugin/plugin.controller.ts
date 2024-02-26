import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthorizationGuard } from '../authorization/authorization.guard.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PluginService } from './plugin.service.js';
import { RequirePermissions } from '../authorization/require-permissions.decorator.js';
import { ErrorCodeEnum, PermissionEnum } from '../../enums/index.js';
import { buildException } from '../../utils/build-exception.util.js';
import { isDefined } from 'class-validator';
import { ApiPaginationResultDto } from '../../common/api.pagination.result.dto.js';

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
    const controls = this.pluginService.getAllControls();
    return new ApiPaginationResultDto(controls, controls.length, 0, -1);
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

    const control = this.pluginService.getControlById(id);
    if (!control) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.pluginService.toggleEnabled(control, true);
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

    const control = this.pluginService.getControlById(id);
    if (!control) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.pluginService.toggleEnabled(control, false);
    return control;
  }

  @Delete(':id')
  @ApiOperation({
    description: '卸载插件',
  })
  async uninstallPlugin(@Param('id') id: string) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const control = this.pluginService.getControlById(id);
    if (!control) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }
    if (control.isBuiltin) {
      throw buildException(BadRequestException, ErrorCodeEnum.BUILTIN_PLUGIN_NOT_UNINSTALLABLE);
    }

    await this.pluginService.uninstall(control);
    return {};
  }
}
