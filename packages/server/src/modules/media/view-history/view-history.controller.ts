import { Controller, Delete, Get, Query, UseGuards } from '@nestjs/common';
import { AuthorizationGuard } from '../../authorization/authorization.guard.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../authorization/require-permissions.decorator.js';
import { PermissionEnum } from '../../../enums/permission.enum.js';
import { RequestUser } from '../../authorization/request.user.decorator.js';
import { User } from '../../user/user.entity.js';
import { buildQueryOptions } from '../../../utils/build-query-options.util.js';
import { ViewHistory } from './view-history.entity.js';
import { ViewHistoryService } from './view-history.service.js';
import { ApiQueryDto } from '../../../common/api.query.dto.js';
import { ApiPaginationResultDto } from '../../../common/api.pagination.result.dto.js';

@Controller('media/history')
@UseGuards(AuthorizationGuard)
@ApiTags('media')
@ApiBearerAuth()
export class ViewHistoryController {
  constructor(private viewHistoryService: ViewHistoryService) {}

  @Get()
  @ApiOperation({
    description: '查询历史记录',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP, PermissionEnum.MEDIA_VIEW)
  async queryUserViewHistory(@RequestUser() user: User, @Query() query: ApiQueryDto<ViewHistory>) {
    const [result, total] = await this.viewHistoryService.findAndCount({
      where: buildQueryOptions<ViewHistory>({
        exact: {
          user: { id: user.id },
        },
      }),
      skip: query.page * query.size,
      take: query.size,
      order: { [query.sort]: query.order },
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }

  @Delete()
  @ApiOperation({
    description: '清空历史记录',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP, PermissionEnum.MEDIA_VIEW)
  async deleteUserViewHistories(@RequestUser() user: User) {
    await this.viewHistoryService.delete({
      user: { id: user.id },
    });
    return {};
  }
}
