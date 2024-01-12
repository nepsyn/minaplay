import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthorizationGuard } from '../../authorization/authorization.guard.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeriesTagService } from './series-tag.service.js';
import { RequirePermissions } from '../../authorization/require-permissions.decorator.js';
import { PermissionEnum } from '../../../enums/permission.enum.js';
import { SeriesTagDto } from './series-tag.dto.js';
import { SeriesTagQueryDto } from './series-tag-query.dto.js';
import { buildQueryOptions } from '../../../utils/build-query-options.util.js';
import { SeriesTag } from './series-tag.entity.js';
import { ApiPaginationResultDto } from '../../../common/api.pagination.result.dto.js';

@Controller('series/tag')
@UseGuards(AuthorizationGuard)
@ApiTags('series')
@ApiBearerAuth()
export class SeriesTagController {
  constructor(private seriesTagService: SeriesTagService) {}

  @Post()
  @ApiOperation({
    description: '新增剧集标签',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP)
  async createSeriesTag(@Body() data: SeriesTagDto) {
    const sameNameSeriesTag = await this.seriesTagService.findOneBy({ name: data.name });
    if (sameNameSeriesTag) {
      return sameNameSeriesTag;
    }

    return await this.seriesTagService.save(data);
  }

  @Get()
  @ApiOperation({
    description: '查询剧集标签',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP)
  async querySeriesTag(@Query() query: SeriesTagQueryDto) {
    const { keyword } = query;
    const [result, total] = await this.seriesTagService.findAndCount({
      where: buildQueryOptions<SeriesTag>({
        keyword,
        keywordProperties: (entity) => [entity.name],
      }),
      skip: query.page * query.size,
      take: query.size,
      order: { [query.sort]: query.order },
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }

  @Delete()
  @ApiOperation({
    description: '删除剧集标签',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP)
  async deleteSeriesTag(@Body() data: SeriesTagDto) {
    await this.seriesTagService.delete({ name: data.name });
    return {};
  }
}
