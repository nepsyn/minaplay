import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { EpisodeService } from './episode.service.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../authorization/require-permissions.decorator.js';
import { ErrorCodeEnum, PermissionEnum } from '../../../enums/index.js';
import { buildException } from '../../../utils/build-exception.util.js';
import { EpisodeDto } from './episode.dto.js';
import { AuthorizationGuard } from '../../authorization/authorization.guard.js';
import { SeriesService } from '../series/series.service.js';
import { Episode } from './episode.entity.js';
import { buildQueryOptions } from '../../../utils/build-query-options.util.js';
import { Between } from 'typeorm';
import { EpisodeQueryDto } from './episode-query.dto.js';
import { ApiPaginationResultDto } from '../../../common/api.pagination.result.dto.js';
import { EpisodeUpdateQueryDto } from './episode-update-query.dto.js';

@Controller('series/episode')
@UseGuards(AuthorizationGuard)
@ApiTags('series')
@ApiBearerAuth()
export class EpisodeController {
  constructor(private seriesService: SeriesService, private episodeService: EpisodeService) {}

  @Get()
  @ApiOperation({
    description: '查询单集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP, PermissionEnum.MEDIA_VIEW)
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
      order: query.sortBy,
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }

  @Get('update')
  @ApiOperation({
    description: '查询更新单集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP, PermissionEnum.MEDIA_VIEW)
  async queryUpdateEpisodes(@Query() query: EpisodeUpdateQueryDto) {
    const [result, total] = await this.episodeService.findUpdateAndCount(query);

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }

  @Get(':id')
  @ApiOperation({
    description: '查看单集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP, PermissionEnum.MEDIA_VIEW)
  async getEpisodeById(@Param('id') id: number) {
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
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP)
  async createEpisode(@Body() data: EpisodeDto) {
    const series = await this.seriesService.findOneBy({ id: data.seriesId });
    if (!series) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const { id } = await this.episodeService.save({
      ...data,
      pubAt: data.pubAt ? new Date(data.pubAt) : null,
      series: { id: data.seriesId },
      media: { id: data.mediaId },
    });

    return await this.episodeService.findOneBy({ id });
  }

  @Put(':id')
  @ApiOperation({
    description: '修改单集信息',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP)
  async updateEpisode(@Param('id') id: number, @Body() data: EpisodeDto) {
    const episode = await this.episodeService.findOneBy({ id });
    if (!episode) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.episodeService.save({
      id,
      ...data,
      pubAt: data.pubAt && new Date(data.pubAt),
      series: { id: data.seriesId },
      media: { id: data.mediaId },
    });

    return await this.episodeService.findOneBy({ id });
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除单集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP)
  async deleteEpisode(@Param('id') id: number) {
    await this.episodeService.delete({ id });
    return {};
  }
}
