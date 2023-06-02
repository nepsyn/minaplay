import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put } from '@nestjs/common';
import { LiveService } from './live.service';
import { ApiOperation } from '@nestjs/swagger';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { PermissionEnum } from '../../enums/permission.enum';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { LiveDto } from './live.dto';
import { RequestUser } from '../authorization/request.user.decorator';
import { User } from '../user/user.entity';

@Controller()
export class LiveController {
  constructor(private liveService: LiveService) {}

  @Get(':id')
  @ApiOperation({
    description: '查看直播间',
  })
  @RequirePermissions(PermissionEnum.FETCH_LIVE)
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
  @RequirePermissions(PermissionEnum.MANAGE_LIVE)
  async createLive(@Body() data: LiveDto, @RequestUser() user: User) {
    return await this.liveService.save({
      ...data,
      poster: { id: data.posterFileId },
      user: { id: user.id },
    });
  }

  @Put(':id')
  @ApiOperation({
    description: '修改直播间信息',
  })
  @RequirePermissions(PermissionEnum.MANAGE_LIVE)
  async updateLive(@Param('id') id: string, @Body() data: LiveDto) {
    const live = await this.liveService.findOneBy({ id });
    if (!live) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return await this.liveService.save({
      id,
      ...data,
      poster: { id: data.posterFileId },
    });
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除直播间',
  })
  @RequirePermissions(PermissionEnum.MANAGE_LIVE)
  async deleteLive(@Param('id') id: string) {
    await this.liveService.delete({ id });
    return {};
  }
}
