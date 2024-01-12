import {
  BadRequestException,
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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeriesService } from './series.service.js';
import { RequirePermissions } from '../authorization/require-permissions.decorator.js';
import { SeriesDto } from './series.dto.js';
import { RequestUser } from '../authorization/request.user.decorator.js';
import { User } from '../user/user.entity.js';
import { SeriesQueryDto } from './series-query.dto.js';
import { Series } from './series.entity.js';
import { buildException } from '../../utils/build-exception.util.js';
import { buildQueryOptions } from '../../utils/build-query-options.util.js';
import { AuthorizationGuard } from '../authorization/authorization.guard.js';
import { PermissionEnum } from '../../enums/permission.enum.js';
import { ErrorCodeEnum } from '../../enums/error-code.enum.js';
import { Between, In } from 'typeorm';
import { SeriesSubscribeDto } from './series-subscribe.dto.js';
import { SeriesSubscribeService } from './series-subscribe.service.js';
import { SeriesTagService } from './series-tag.service.js';
import { ApiPaginationResultDto } from '../../common/api.pagination.result.dto.js';

@Controller('series')
@UseGuards(AuthorizationGuard)
@ApiTags('series')
@ApiBearerAuth()
export class SeriesController {
  constructor(
    private seriesService: SeriesService,
    private seriesTagService: SeriesTagService,
    private seriesSubscribeService: SeriesSubscribeService,
  ) {}

  @Get(':id')
  @ApiOperation({
    description: '查看剧集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP, PermissionEnum.SERIES_VIEW)
  async getSeriesById(@Param('id', ParseIntPipe) id: number) {
    const series = await this.seriesService.findOneBy({ id });
    if (!series) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return series;
  }

  @Post()
  @ApiOperation({
    description: '创建剧集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP)
  async createSeries(@RequestUser() user: User, @Body() data: SeriesDto) {
    const sameNameSeries = await this.seriesService.findOneBy({ name: data.name, season: data.season });
    if (sameNameSeries) {
      throw buildException(BadRequestException, ErrorCodeEnum.DUPLICATE_SERIES);
    }

    const { id } = await this.seriesService.save({
      ...data,
      user: { id: user.id },
      poster: { id: data.posterFileId },
      tags: data.tags?.map((name) => ({ name })),
    });

    return await this.seriesService.findOneBy({ id });
  }

  @Get()
  @ApiOperation({
    description: '查询剧集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP, PermissionEnum.SERIES_VIEW)
  async querySeries(@RequestUser() user: User, @Query() query: SeriesQueryDto) {
    const { keyword, name, season, finished, userId, tag: tagName, start, end } = query;

    let idCondition = undefined;
    if (tagName) {
      const tag = await this.seriesTagService.findOneBy({ name: tagName });
      if (tag) {
        const series = await tag.series;
        idCondition = In(series.map(({ id }) => id));
      }
    }

    const [result, total] = await this.seriesService.findAndCount({
      where: buildQueryOptions<Series>({
        keyword,
        keywordProperties: (entity) => [entity.name, entity.description],
        exact: {
          id: idCondition,
          name,
          season,
          finished,
          user: { id: userId },
          createAt: start && Between(new Date(start), end ? new Date(end) : new Date()),
        },
      }),
      skip: query.page * query.size,
      take: query.size,
      order: { [query.sort]: query.order },
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }

  @Put(':id')
  @ApiOperation({
    description: '修改剧集信息',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP)
  async updateSeries(@Param('id', ParseIntPipe) id: number, @Body() data: SeriesDto) {
    const series = await this.seriesService.findOneBy({ id });
    if (!series) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const sameNameSeries = await this.seriesService.findOneBy({ name: data.name, season: data.season });
    if (sameNameSeries && sameNameSeries.id !== id) {
      throw buildException(BadRequestException, ErrorCodeEnum.DUPLICATE_SERIES);
    }

    await this.seriesService.save({
      id,
      ...data,
      poster: { id: data.posterFileId },
      tags: data.tags?.map((name) => ({ name })),
    });

    return await this.seriesService.findOneBy({ id });
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除剧集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP)
  async deleteSeries(@Param('id', ParseIntPipe) id: number) {
    await this.seriesService.delete({ id });
    return {};
  }

  @Get(':id/subscribe')
  @ApiOperation({
    description: '获取订阅信息',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP, PermissionEnum.SERIES_VIEW)
  async getSubscribeInfoBySeriesId(@RequestUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return (await this.seriesSubscribeService.findOneBy({ seriesId: id, userId: user.id })) ?? {};
  }

  @Post(':id/subscribe')
  @ApiOperation({
    description: '订阅剧集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP, PermissionEnum.SERIES_VIEW)
  async subscribeSeries(
    @RequestUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: SeriesSubscribeDto,
  ) {
    const series = await this.seriesService.findOneBy({ id });
    if (!series) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return await this.seriesSubscribeService.save({
      ...data,
      user: { id: user.id },
      series: { id },
    });
  }

  @Delete(':id/subscribe')
  @ApiOperation({
    description: '取消订阅剧集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP, PermissionEnum.SERIES_VIEW)
  async unsubscribeSeries(@RequestUser() user: User, @Param('id', ParseIntPipe) id: number) {
    const series = await this.seriesService.findOneBy({ id });
    if (!series) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.seriesSubscribeService.delete({
      user: { id: user.id },
      series: { id },
    });

    return {};
  }
}
