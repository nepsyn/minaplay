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

@Controller('series')
@UseGuards(AuthorizationGuard)
@ApiTags('series')
@ApiBearerAuth()
export class SeriesController {
  constructor(private seriesService: SeriesService) {}

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
    const sameNameSeries = await this.seriesService.findOneBy({ name: data.name });
    if (sameNameSeries) {
      throw buildException(BadRequestException, ErrorCodeEnum.DUPLICATE_SERIES_NAME);
    }

    const { id } = await this.seriesService.save({
      ...data,
      user: { id: user.id },
      poster: { id: data.posterFileId },
      posterLandscape: { id: data.posterLandscapeFileId },
      tags: data.tagIds?.map((id) => ({ id })),
    });

    return await this.seriesService.findOneBy({ id });
  }

  @Get()
  @ApiOperation({
    description: '查询剧集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP)
  async querySeries(@Query() query: SeriesQueryDto) {
    const { keyword, name } = query;
    const [result, total] = await this.seriesService.findAndCount({
      where: buildQueryOptions<Series>({
        keyword,
        keywordProperties: (entity) => [entity.name, entity.description],
        exact: { name },
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

    const sameNameSeries = await this.seriesService.findOneBy({ name: data.name });
    if (sameNameSeries) {
      throw buildException(BadRequestException, ErrorCodeEnum.DUPLICATE_SERIES_NAME);
    }

    await this.seriesService.save({
      id,
      ...data,
      poster: { id: data.posterFileId },
      posterLandscape: { id: data.posterLandscapeFileId },
      tags: data.tagIds?.map((id) => ({ id })),
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
}
