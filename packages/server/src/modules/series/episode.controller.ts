import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EpisodeService } from './episode.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { PermissionEnum } from '../../enums/permission.enum';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { EpisodeDto } from './episode.dto';
import { AuthorizationGuard } from '../authorization/authorization.guard';
import { SeriesService } from './series.service';
import { Episode } from './episode.entity';
import { ApiPaginationResultDto } from '../../utils/api.pagination.result.dto';
import { buildQueryOptions } from '../../utils/build-query-options.util';
import { Between } from 'typeorm';
import { EpisodeQueryDto } from './episode-query.dto';
import { RequestUser } from '../authorization/request.user.decorator';
import { User } from '../user/user.entity';
import { ViewHistoryDto } from '../media/view-history.dto';
import { ViewHistoryService } from '../media/view-history.service';
import { PluginService } from '../plugin/plugin.service';

@Controller('series/episode')
@UseGuards(AuthorizationGuard)
@ApiTags('series')
@ApiBearerAuth()
export class EpisodeController {
  constructor(
    private seriesService: SeriesService,
    private viewHistoryService: ViewHistoryService,
    private episodeService: EpisodeService,
    private pluginService: PluginService,
  ) {}

  @Get()
  @ApiOperation({
    description: '查询单集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP, PermissionEnum.SERIES_VIEW)
  async queryEpisodes(@Query() query: EpisodeQueryDto) {
    const { keyword, seriesId, start, end } = query;
    const [result, total] = await this.episodeService.findAndCount({
      where: buildQueryOptions<Episode>({
        keyword,
        keywordProperties: (entity) => [entity.title],
        exact: {
          series: { id: seriesId },
          createAt: start && Between(new Date(start), end ? new Date(end) : new Date()),
        },
      }),
      skip: query.page * query.size,
      take: query.size,
      order: { [query.sort]: query.order },
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }

  @Get(':id')
  @ApiOperation({
    description: '查看单集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP, PermissionEnum.SERIES_VIEW)
  async getEpisodeById(@Param('id', ParseIntPipe) id: number) {
    const episode = await this.episodeService.findOneBy({ id });
    if (!episode) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return episode;
  }

  @Post()
  @ApiOperation({
    description: '创建单集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP)
  async createEpisode(@Body() data: EpisodeDto) {
    const series = await this.seriesService.findOneBy({ id: data.seriesId });
    if (!series) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const { id } = await this.episodeService.save({
      ...data,
      series: { id: data.seriesId },
      media: { id: data.mediaId },
    });

    return await this.episodeService.findOneBy({ id });
  }

  @Put(':id')
  @ApiOperation({
    description: '修改单集信息',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP)
  async updateEpisode(@Param('id', ParseIntPipe) id: number, @Body() data: EpisodeDto) {
    const episode = await this.episodeService.findOneBy({ id });
    if (!episode) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.episodeService.save({
      id,
      ...data,
      series: { id: data.seriesId },
      media: { id: data.mediaId },
    });

    return await this.episodeService.findOneBy({ id });
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除单集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP)
  async deleteEpisode(@Param('id', ParseIntPipe) id: number) {
    await this.episodeService.delete({ id });
    return {};
  }

  @Post(':id/history')
  @ApiOperation({
    description: '添加历史记录',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP, PermissionEnum.SERIES_VIEW)
  async createEpisodeHistory(
    @RequestUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ViewHistoryDto,
  ) {
    const episode = await this.episodeService.findOneBy({ id });
    if (!episode) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const history = await this.viewHistoryService.findOneBy({
      media: { id: episode.media.id },
    });
    return await this.viewHistoryService.save({
      id: history?.id,
      ...data,
      episode: { id },
      media: { id: episode.media.id },
      user: { id: user.id },
    });
  }

  @Delete(':id/history')
  @ApiOperation({
    description: '删除历史记录',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP, PermissionEnum.SERIES_VIEW)
  async deleteEpisodeHistory(@RequestUser() user: User, @Param('id', ParseIntPipe) id: number) {
    await this.viewHistoryService.delete({
      episode: { id },
      user: { id: user.id },
    });
    return {};
  }
}
