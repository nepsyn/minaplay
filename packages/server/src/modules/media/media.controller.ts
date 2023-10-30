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
import { MediaService } from './media.service';
import { AuthorizationGuard } from '../authorization/authorization.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { PermissionEnum } from '../../enums/permission.enum';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { MediaQueryDto } from './media-query.dto';
import { buildQueryOptions } from '../../utils/build-query-options.util';
import { Between } from 'typeorm';
import { Media } from './media.entity';
import { ApiPaginationResultDto } from '../../utils/api.pagination.result.dto';
import { MediaDto } from './media.dto';
import { MediaFileService } from './media-file.service';
import { RequestUser } from '../authorization/request.user.decorator';
import { User } from '../user/user.entity';
import { ViewHistoryDto } from './view-history.dto';
import { ViewHistoryService } from './view-history.service';

@Controller('media')
@UseGuards(AuthorizationGuard)
@ApiTags('media')
@ApiBearerAuth()
export class MediaController {
  constructor(
    private mediaService: MediaService,
    private viewHistoryService: ViewHistoryService,
    private mediaFileService: MediaFileService,
  ) {}

  @Get(':id')
  @ApiOperation({
    description: '查看媒体',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP, PermissionEnum.MEDIA_VIEW)
  async getMediaById(@Param('id') id: string, @RequestUser() user: User) {
    const media = await this.mediaService.findOneBy({
      id,
      ...(user.hasOneOf(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP) ? {} : { isPublic: true }),
    });
    if (!media) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return media;
  }

  @Get()
  @ApiOperation({
    description: '查询媒体',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP, PermissionEnum.MEDIA_VIEW)
  async queryMedia(@Query() query: MediaQueryDto, @RequestUser() user: User) {
    const { keyword, id, start, end } = query;
    const [result, total] = await this.mediaService.findAndCount({
      where: buildQueryOptions<Media>({
        keyword,
        keywordProperties: (entity) => [entity.name, entity.description],
        exact: {
          id,
          createAt: start && Between(new Date(start), end ? new Date(end) : new Date()),
          isPublic: user.hasOneOf(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP) ? undefined : true,
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
    description: '创建媒体',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP)
  async createMedia(@Body() data: MediaDto) {
    if (data.name == null || data.fileId == null) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const { id } = await this.mediaService.save({
      ...data,
      file: { id: data.fileId },
      poster: { id: data.posterFileId },
    });

    const media = await this.mediaService.findOneBy({ id });
    if (media.file?.isExist && !media.metadata) {
      await this.mediaFileService.generateMediaFiles(media);
    }

    return media;
  }

  @Put(':id')
  @ApiOperation({
    description: '修改媒体',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP)
  async updateMedia(@Param('id') id: string, @Body() data: MediaDto) {
    const media = await this.mediaService.findOneBy({ id });
    if (!media) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.mediaService.save({
      id,
      ...data,
      file: { id: data.fileId },
      poster: { id: data.posterFileId },
    });

    return await this.mediaService.findOneBy({ id });
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除媒体',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP)
  async deleteMedia(@Param('id') id: string) {
    await this.mediaService.delete({ id });
    return {};
  }

  @Get(':id/history')
  @ApiOperation({
    description: '获取播放记录',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP, PermissionEnum.MEDIA_VIEW)
  async getViewHistoryByMediaId(@RequestUser() user: User, @Param('id') id: string) {
    const history = await this.viewHistoryService.findOneBy({
      user: { id: user.id },
      media: { id },
    });
    if (!history) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return history;
  }

  @Post(':id/history')
  @ApiOperation({
    description: '添加播放记录',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP, PermissionEnum.MEDIA_VIEW)
  async createViewHistory(@RequestUser() user: User, @Param('id') id: string, @Body() data: ViewHistoryDto) {
    const media = await this.mediaService.findOneBy({ id });
    if (!media) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const history = await this.viewHistoryService.findOneBy({
      media: { id },
    });
    return await this.viewHistoryService.save({
      id: history?.id,
      ...data,
      media: { id },
      user: { id: user.id },
    });
  }

  @Delete(':id/history')
  @ApiOperation({
    description: '删除播放记录',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP, PermissionEnum.MEDIA_VIEW)
  async deleteViewHistory(@RequestUser() user: User, @Param('id') id: string) {
    await this.viewHistoryService.delete({
      media: { id },
      user: { id: user.id },
    });
    return {};
  }
}
