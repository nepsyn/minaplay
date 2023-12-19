import { Controller, Delete, Get, Query, UseGuards } from '@nestjs/common';
import { AuthorizationGuard } from '../authorization/authorization.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeriesSubscribeService } from './series-subscribe.service';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { PermissionEnum } from '../../enums/permission.enum';
import { RequestUser } from '../authorization/request.user.decorator';
import { User } from '../user/user.entity';
import { SeriesSubscribe } from './series-subscribe.entity';
import { buildQueryOptions } from '../../utils/build-query-options.util';
import { ApiQueryDto } from '../../common/api.query.dto';
import { ApiPaginationResultDto } from '../../common/api.pagination.result.dto';

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
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP, PermissionEnum.SERIES_VIEW)
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
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP, PermissionEnum.SERIES_VIEW)
  async deleteUserSeriesSubscribes(@RequestUser() user: User) {
    await this.seriesSubscribeService.delete({
      user: { id: user.id },
    });
    return {};
  }
}
