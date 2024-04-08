import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthorizationGuard } from '../authorization/authorization.guard.js';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PluginService } from './plugin.service.js';
import { RequirePermissions } from '../authorization/require-permissions.decorator.js';
import { ErrorCodeEnum, PermissionEnum } from '../../enums/index.js';
import { buildException } from '../../utils/build-exception.util.js';
import { isDefined, isEmpty, isString } from 'class-validator';
import { ApiPaginationResultDto } from '../../common/api.pagination.result.dto.js';
import { PluginSourceParser } from './plugin.interface.js';

@Controller('plugins')
@UseGuards(AuthorizationGuard)
@ApiTags('plugins')
@ApiBearerAuth()
@RequirePermissions(PermissionEnum.ROOT_OP)
export class PluginController {
  constructor(private pluginService: PluginService) {}

  async invokeParser<T extends keyof PluginSourceParser>(
    pluginId: string,
    parserName: string,
    action: T,
    ...args: Parameters<PluginSourceParser[T]>
  ): Promise<ReturnType<PluginSourceParser[T]>> {
    if (!isDefined(pluginId) || !isDefined(parserName)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const control = this.pluginService.getControlById(pluginId);
    const parser = control?.parserMap.get(parserName);
    if (!control || !parser) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }
    if (!parser.features[action]) {
      throw buildException(NotImplementedException, ErrorCodeEnum.NOT_IMPLEMENTED);
    }

    const result = await this.pluginService.emitParserAction(parser.service, action, ...args);
    if (!result) {
      throw buildException(InternalServerErrorException, ErrorCodeEnum.INTERNAL_SERVER_ERROR);
    }

    return result;
  }

  @Get()
  @ApiOperation({
    description: '获取所有插件信息',
  })
  async getAllPluginControls() {
    const controls = this.pluginService.getAllControls();
    return new ApiPaginationResultDto(controls, controls.length, 0, -1);
  }

  @Get(':id/parser/:parser/calendar')
  @ApiOperation({
    description: '获取插件 parser 更新表',
  })
  async getParserCalendar(@Param('id') id: string, @Param('parser') name: string) {
    return await this.invokeParser(id, name, 'getCalendar');
  }

  @Get(':pluginId/parser/:parser/series/:seriesId')
  @ApiOperation({
    description: '获取插件 parser 剧集',
  })
  async getParserSeriesById(
    @Param('pluginId') pluginId: string,
    @Param('parser') name: string,
    @Param('seriesId') seriesId: string,
  ) {
    if (!isDefined(seriesId)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    return await this.invokeParser(pluginId, name, 'getSeriesById', seriesId);
  }

  @Get(':pluginId/parser/:parser/series/:seriesId/subscribe')
  @ApiOperation({
    description: '获取插件 parser 剧集订阅信息',
  })
  async getParserSeriesCodeBySeriesId(
    @Param('pluginId') pluginId: string,
    @Param('parser') name: string,
    @Param('seriesId') seriesId: string,
  ) {
    if (!isDefined(seriesId)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const series = await this.invokeParser(pluginId, name, 'getSeriesById', seriesId);
    const source = await this.invokeParser(pluginId, name, 'buildSourceOfSeries', series);
    const code = await this.invokeParser(pluginId, name, 'buildRuleCodeOfSeries', series);
    return { series, source, code };
  }

  @Get(':pluginId/parser/:parser/series')
  @ApiOperation({
    description: '搜索插件 parser 剧集',
  })
  @ApiQuery({
    name: 'page',
    required: false,
  })
  @ApiQuery({
    name: 'size',
    required: false,
  })
  async searchParserSeries(
    @Param('pluginId') pluginId: string,
    @Param('parser') name: string,
    @Query('keyword') keyword: string,
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('size', new DefaultValuePipe(120), ParseIntPipe) size: number,
  ) {
    if (!isString(keyword) || isEmpty(keyword)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    return await this.invokeParser(pluginId, name, 'searchSeries', keyword, page, size);
  }

  @Get(':pluginId/parser/:parser/series/:seriesId/episode')
  @ApiOperation({
    description: '搜索插件 parser 剧集',
  })
  @ApiQuery({
    name: 'page',
    required: false,
  })
  @ApiQuery({
    name: 'size',
    required: false,
  })
  async getParserEpisodes(
    @Param('pluginId') pluginId: string,
    @Param('parser') name: string,
    @Param('seriesId') seriesId: string,
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('size', new DefaultValuePipe(120), ParseIntPipe) size: number,
  ) {
    if (!isDefined(seriesId)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    return await this.invokeParser(pluginId, name, 'getEpisodesBySeriesId', seriesId, page, size);
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

    return await this.pluginService.uninstall(control);
  }
}
