import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LiveService } from './live.service.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../authorization/require-permissions.decorator.js';
import { PermissionEnum } from '../../enums/permission.enum.js';
import { buildException } from '../../utils/build-exception.util.js';
import { ErrorCodeEnum } from '../../enums/error-code.enum.js';
import { LiveDto } from './live.dto.js';
import { RequestUser } from '../authorization/request.user.decorator.js';
import { User } from '../user/user.entity.js';
import { AuthorizationGuard } from '../authorization/authorization.guard.js';
import { LiveGateway } from './live.gateway.js';
import { encryptPassword } from '../../utils/encrypt-password.util.js';
import { LiveQueryDto } from './live-query.dto.js';
import { buildQueryOptions } from '../../utils/build-query-options.util.js';
import { Live } from './live.entity.js';
import { ApiPaginationResultDto } from '../../common/api.pagination.result.dto.js';
import { isDefined } from 'class-validator';
import { instanceToPlain } from 'class-transformer';
import { LiveStreamService } from './live-stream.service.js';

@Controller('live')
@UseGuards(AuthorizationGuard)
@ApiTags('live')
@ApiBearerAuth()
export class LiveController {
  constructor(
    private liveService: LiveService,
    private liveStreamService: LiveStreamService,
    private liveGateway: LiveGateway,
  ) {}

  @Get(':id')
  @ApiOperation({
    description: '查看直播间',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  async getLiveById(@Param('id') id: string) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const live = await this.liveService.findOneBy({ id });
    if (!live) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return live;
  }

  @Get()
  @ApiOperation({
    description: '查询直播间',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  async queryLive(@Query() query: LiveQueryDto) {
    const { keyword, userId } = query;
    const [result, total] = await this.liveService.findAndCount({
      where: buildQueryOptions<Live>({
        keyword,
        keywordProperties: (entity) => [entity.title],
        exact: {
          user: { id: userId },
        },
      }),
      skip: query.page * query.size,
      take: query.size,
      order: { [query.sort]: query.order },
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }

  @Post()
  @ApiOperation({
    description: '创建直播间',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP)
  async createLive(@Body() data: LiveDto, @RequestUser() user: User) {
    const { id } = await this.liveService.save({
      ...data,
      password: data.password && (await encryptPassword(data.password)),
      poster: { id: data.posterFileId },
      user: { id: user.id },
    });
    await this.liveService.createOrGetLiveState(id);

    return await this.liveService.findOneBy({ id });
  }

  @Put(':id')
  @ApiOperation({
    description: '修改直播间信息',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP)
  async updateLive(@Param('id') id: string, @Body() data: LiveDto) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    let live = await this.liveService.findOneBy({ id });
    if (!live) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.liveService.save({
      id,
      ...data,
      password: data.password && (await encryptPassword(data.password)),
      poster: { id: data.posterFileId },
    });
    live = await this.liveService.findOneBy({ id });

    const state = await this.liveService.createOrGetLiveState(id);
    state.live = instanceToPlain(live) as Live;
    await this.liveService.updateLiveState(state);

    return live;
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除直播间',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP)
  async deleteLive(@Param('id') id: string) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const live = await this.liveService.findOneBy({ id });
    if (live) {
      await this.liveService.delete({ id });
      await this.liveGateway.dispose(id);
      await this.liveStreamService.stopPublish(id);
      await this.liveService.deleteLiveState(id);
    }

    return {};
  }
}
