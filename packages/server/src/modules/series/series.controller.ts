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
import { SeriesService } from './series.service';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { SeriesDto } from './series.dto';
import { RequestUser } from '../authorization/request.user.decorator';
import { User } from '../user/user.entity';
import { SeriesQueryDto } from './series-query.dto';
import { Series } from './series.entity';
import { ApiPaginationResultDto } from '../../utils/api.pagination.result.dto';
import { buildException } from '../../utils/build-exception.util';
import { buildQueryOptions } from '../../utils/build-query-options.util';
import { AuthorizationGuard } from '../authorization/authorization.guard';
import { PermissionEnum } from '../../enums/permission.enum';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { Between } from 'typeorm';
import { SeriesSubscribeDto } from './series-subscribe.dto';
import { SeriesSubscribeService } from './series-subscribe.service';

@Controller('series')
@UseGuards(AuthorizationGuard)
@ApiTags('series')
@ApiBearerAuth()
export class SeriesController {
  constructor(private seriesService: SeriesService, private seriesSubscribeService: SeriesSubscribeService) {}

  @Get(':id')
  @ApiOperation({
    description: '查看剧集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP, PermissionEnum.SERIES_VIEW)
  async getSeriesById(@RequestUser() user: User, @Param('id', ParseIntPipe) id: number) {
    const series = await this.seriesService.buildCompositeQuery(user.id, { id }).getOne();
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
    const sameNameSeries = await this.seriesService.findOneBy({ name: data.name });
    if (sameNameSeries) {
      throw buildException(BadRequestException, ErrorCodeEnum.DUPLICATE_SERIES_NAME);
    }

    const { id } = await this.seriesService.save({
      ...data,
      user: { id: user.id },
      poster: { id: data.posterFileId },
      tags: data.tags?.map((name) => ({ name })),
    });

    return await this.seriesService.buildCompositeQuery(user.id, { id }).getOne();
  }

  @Get()
  @ApiOperation({
    description: '查询剧集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP, PermissionEnum.SERIES_VIEW)
  async querySeries(@RequestUser() user: User, @Query() query: SeriesQueryDto) {
    const { keyword, id, name, season, finished, subscribed, userId, tags, start, end } = query;
    const qb = this.seriesService
      .buildCompositeQuery(
        user.id,
        buildQueryOptions<Series>({
          keyword,
          keywordProperties: (entity) => [entity.name, entity.description],
          exact: {
            id,
            name,
            season,
            finished,
            user: { id: userId },
            createAt: start && Between(new Date(start), end ? new Date(end) : new Date()),
          },
        }),
      )
      .andWhere(subscribed ? `subscribe.seriesId IS ${subscribed ? 'NOT NULL' : 'NULL'}` : {});

    if (tags && tags.length > 0) {
      qb.andWhere(
        'series.id IN ' +
          qb
            .subQuery()
            .from(Series, 's1')
            .leftJoinAndSelect('s1.tags', 't1')
            .where('t1.name IN (:tags)', { tags })
            .select('s1.id')
            .groupBy('s1.id')
            .having('COUNT(DISTINCT t1.name) = :tagsCount', { tagsCount: tags.length })
            .getQuery(),
      );
    }

    const [result, total] = await qb
      .skip(query.page * query.size)
      .take(query.size)
      .orderBy(`series.${query.sort}`, query.order)
      .getManyAndCount();

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }

  @Put(':id')
  @ApiOperation({
    description: '修改剧集信息',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP)
  async updateSeries(@RequestUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() data: SeriesDto) {
    const series = await this.seriesService.findOneBy({ id });
    if (!series) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const sameNameSeries = await this.seriesService.findOneBy({ name: data.name });
    if (sameNameSeries && sameNameSeries.id !== id) {
      throw buildException(BadRequestException, ErrorCodeEnum.DUPLICATE_SERIES_NAME);
    }

    await this.seriesService.save({
      id,
      ...data,
      poster: { id: data.posterFileId },
      tags: data.tags?.map((name) => ({ name })),
    });

    return await this.seriesService.buildCompositeQuery(user.id, { id }).getOne();
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

    const subscribe = await this.seriesSubscribeService.save({
      ...data,
      user: { id: user.id },
      series: { id },
    });

    return { notify: subscribe.notify };
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
