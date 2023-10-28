import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, UseGuards } from '@nestjs/common';
import { LiveService } from './live.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { PermissionEnum } from '../../enums/permission.enum';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { LiveDto } from './live.dto';
import { RequestUser } from '../authorization/request.user.decorator';
import { User } from '../user/user.entity';
import { AuthorizationGuard } from '../authorization/authorization.guard';
import { LiveGateway } from './live.gateway';
import { encryptPassword } from '../../utils/encrypt-password.util';

@Controller('live')
@UseGuards(AuthorizationGuard)
@ApiTags('live')
@ApiBearerAuth()
export class LiveController {
  constructor(private liveService: LiveService, private liveGateway: LiveGateway) {}

  @Get(':id')
  @ApiOperation({
    description: '查看直播间',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP, PermissionEnum.LIVE_VIEW)
  async getLiveById(@Param('id') id: string) {
    const live = await this.liveService.findOneBy({ id });
    if (!live) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return live;
  }

  @Post()
  @ApiOperation({
    description: '创建直播间',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP)
  async createLive(@Body() data: LiveDto, @RequestUser() user: User) {
    const { id } = await this.liveService.save({
      ...data,
      password: data.password != null ? await encryptPassword(data.password) : undefined,
      poster: { id: data.posterFileId },
      user: { id: user.id },
    });
    await this.liveService.createLiveState(id);

    return await this.liveService.findOneBy({ id });
  }

  @Put(':id')
  @ApiOperation({
    description: '修改直播间信息',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP)
  async updateLive(@Param('id') id: string, @Body() data: LiveDto) {
    const live = await this.liveService.findOneBy({ id });
    if (!live) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.liveService.save({
      id,
      ...data,
      password: data.password != null ? await encryptPassword(data.password) : undefined,
      poster: { id: data.posterFileId },
    });
    await this.liveService.createLiveState(id, true);

    return await this.liveService.findOneBy({ id });
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除直播间',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.LIVE_OP)
  async deleteLive(@Param('id') id: string) {
    await this.liveService.delete({ id });
    await this.liveGateway.dispose(id);
    return {};
  }
}
