import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthorizationGuard } from '../authorization/authorization.guard.js';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PluginService } from './plugin.service.js';
import { RequirePermissions } from '../authorization/require-permissions.decorator.js';
import { ErrorCodeEnum, FileSourceEnum, PermissionEnum } from '../../enums/index.js';
import { buildException } from '../../utils/build-exception.util.js';
import { isDefined, isEmpty, isString } from 'class-validator';
import { ApiPaginationResultDto } from '../../common/api.pagination.result.dto.js';
import { PluginSourceParser } from './plugin.interface.js';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { SourceService } from '../subscribe/source/source.service.js';
import { RuleService } from '../subscribe/rule/rule.service.js';
import { SeriesService } from '../media/series/series.service.js';
import { RequestUser } from '../../common/request.user.decorator.js';
import { User } from '../user/user.entity.js';
import { SeriesTagService } from '../media/series/series-tag.service.js';
import { FileService } from '../file/file.service.js';
import path from 'node:path';
import { generateMD5 } from '../../utils/generate-md5.util.js';
import { RequestTimeout } from '../../common/request.timeout.decorator.js';

@Controller('plugins')
@UseGuards(AuthorizationGuard)
@ApiTags('plugins')
@ApiBearerAuth()
@RequirePermissions(PermissionEnum.ROOT_OP)
@RequestTimeout(30 * 1000)
export class PluginController {
  constructor(
    private pluginService: PluginService,
    private seriesService: SeriesService,
    private sourceService: SourceService,
    private ruleService: RuleService,
    private seriesTagService: SeriesTagService,
    private fileService: FileService,
  ) {}

  async buildSeriesSourceMeta(pluginId: string, parserName: string, url: string) {
    const hash = await generateMD5(url);
    return `${pluginId}-${parserName}-${hash}`;
  }

  buildSeriesRuleMeta(pluginId: string, parserName: string, seriesId: string | number) {
    return `${pluginId}-${parserName}-${seriesId}`;
  }

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

  @Get(':pluginId/parser/:parser/calendar')
  @ApiOperation({
    description: '获取插件 parser 更新表',
  })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60 * 60 * 1000)
  async getParserCalendar(@Param('pluginId') pluginId: string, @Param('parser') name: string) {
    return await this.invokeParser(pluginId, name, 'getCalendar');
  }

  @Get(':pluginId/parser/:parser/series/:seriesId')
  @ApiOperation({
    description: '获取插件 parser 剧集',
  })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30 * 60 * 1000)
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
  async getParserSeriesSubscribe(
    @Param('pluginId') pluginId: string,
    @Param('parser') name: string,
    @Param('seriesId') seriesId: string,
  ) {
    if (!isDefined(seriesId)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const parserSeries = await this.invokeParser(pluginId, name, 'getSeriesById', seriesId);
    const series = await this.seriesService.findOneBy({ name: parserSeries.name, season: parserSeries.season });

    let source = undefined;
    try {
      const parserSource = await this.invokeParser(pluginId, name, 'buildSourceOfSeries', parserSeries);
      source = await this.sourceService.findOneBy({
        parserMeta: await this.buildSeriesSourceMeta(pluginId, name, parserSource.url),
      });
    } catch {}

    const rule = await this.ruleService.findOneBy({
      parserMeta: this.buildSeriesRuleMeta(pluginId, name, seriesId),
    });

    return { series, source, rule };
  }

  @Post(':pluginId/parser/:parser/series/:seriesId/subscribe')
  @ApiOperation({
    description: '添加插件 parser 剧集订阅',
  })
  async createParserSeriesSubscribe(
    @RequestUser() user: User,
    @Param('pluginId') pluginId: string,
    @Param('parser') name: string,
    @Param('seriesId') seriesId: string,
    @Body('seriesOnly', new DefaultValuePipe(false), ParseBoolPipe) seriesOnly: boolean,
  ) {
    const parserSeries = await this.invokeParser(pluginId, name, 'getSeriesById', seriesId);
    let series = await this.seriesService.findOneBy({ name: parserSeries.name, season: parserSeries.season });
    if (!series) {
      const tags = (parserSeries.tags ?? []).map((name) => ({ name }));
      await this.seriesTagService.save(tags);
      const poster =
        parserSeries.posterUrl &&
        (await this.fileService.save({
          name: path.basename(parserSeries.posterUrl),
          source: FileSourceEnum.NETWORK,
          path: parserSeries.posterUrl,
        }));

      series = await this.seriesService.save({
        name: parserSeries.name,
        season: parserSeries.season,
        description: parserSeries.description,
        pubAt: parserSeries.pubAt && new Date(parserSeries.pubAt),
        finished: parserSeries.finished,
        count: parserSeries.count,
        poster,
        tags,
        user: { id: user.id },
      });
    }

    if (seriesOnly) {
      return { series };
    }

    const parserSource = await this.invokeParser(pluginId, name, 'buildSourceOfSeries', parserSeries);
    const sourceMeta = await this.buildSeriesSourceMeta(pluginId, name, parserSource.url);
    let source = await this.sourceService.findOneBy({ parserMeta: sourceMeta });
    if (!source) {
      source = await this.sourceService.save({
        title: parserSource.name,
        url: parserSource.url,
        remark: parserSource.site,
        parserMeta: sourceMeta,
        user: { id: user.id },
      });
    }

    const parserCode = await this.invokeParser(pluginId, name, 'buildRuleCodeOfSeries', parserSeries);
    const ruleMeta = this.buildSeriesRuleMeta(pluginId, name, seriesId);
    let rule = await this.ruleService.findOneBy({ parserMeta: ruleMeta });
    if (!rule) {
      const file = await this.ruleService.createCodeFile(parserCode, user);
      rule = await this.ruleService.save({
        remark: `${parserSeries.name}${parserSeries.season ? ' ' + parserSeries.season : ''}`,
        parserMeta: ruleMeta,
        sources: [{ id: source.id }],
        file: { id: file.id },
      });
    }

    await this.sourceService.deleteFetchSubscribeDataJob(source.id);
    await this.sourceService.addFetchSubscribeDataJob(source);

    return { series, source, rule };
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
