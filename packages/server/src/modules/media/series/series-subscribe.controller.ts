import { Controller, Delete, Get, Query, UseGuards } from '@nestjs/common';
import { AuthorizationGuard } from '../../authorization/authorization.guard.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeriesSubscribeService } from './series-subscribe.service.js';
import { RequirePermissions } from '../../authorization/require-permissions.decorator.js';
import { PermissionEnum } from '../../../enums/permission.enum.js';
import { RequestUser } from '../../../common/request.user.decorator.js';
import { User } from '../../user/user.entity.js';
import { SeriesSubscribe } from './series-subscribe.entity.js';
import { buildQueryOptions } from '../../../utils/build-query-options.util.js';
import { ApiQueryDto } from '../../../common/api.query.dto.js';
import { ApiPaginationResultDto } from '../../../common/api.pagination.result.dto.js';

@Controller('series/subscribe')
@UseGuards(AuthorizationGuard)
@ApiTags('series')
@ApiBearerAuth()
export class SeriesSubscribeController {
  constructor(private seriesSubscribeService: SeriesSubscribeService) {}

  @Get()
  @ApiOperation({
    description: '查询剧集订阅',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP, PermissionEnum.MEDIA_VIEW)
  async querySeriesSubscribes(@RequestUser() user: User, @Query() query: ApiQueryDto<SeriesSubscribe>) {
    const [result, total] = await this.seriesSubscribeService.findAndCount({
      where: buildQueryOptions<SeriesSubscribe>({
        exact: {
          user: { id: user.id },
        },
      }),
      relations: {
        series: true,
      },
      skip: query.page * query.size,
      take: query.size,
      order: { [query.sort]: query.order },
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }

  @Delete()
  @ApiOperation({
    description: '清空剧集订阅',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP, PermissionEnum.MEDIA_VIEW)
  async deleteUserSeriesSubscribes(@RequestUser() user: User) {
    await this.seriesSubscribeService.delete({
      user: { id: user.id },
    });
    return {};
  }
}
