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
import { MediaService } from './media.service.js';
import { AuthorizationGuard } from '../authorization/authorization.guard.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../authorization/require-permissions.decorator.js';
import { PermissionEnum } from '../../enums/permission.enum.js';
import { buildException } from '../../utils/build-exception.util.js';
import { ErrorCodeEnum } from '../../enums/error-code.enum.js';
import { MediaQueryDto } from './media-query.dto.js';
import { buildQueryOptions } from '../../utils/build-query-options.util.js';
import { Between } from 'typeorm';
import { Media } from './media.entity.js';
import { MediaDto } from './media.dto.js';
import { MediaFileService } from './media-file.service.js';
import { RequestUser } from '../../common/request.user.decorator.js';
import { User } from '../user/user.entity.js';
import { ViewHistoryDto } from './view-history/view-history.dto.js';
import { ViewHistoryService } from './view-history/view-history.service.js';
import { ApiPaginationResultDto } from '../../common/api.pagination.result.dto.js';
import { isDefined } from 'class-validator';
import { RequestTimeout } from '../../common/request.timeout.decorator.js';

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
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

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
    const { keyword, start, end } = query;
    const [result, total] = await this.mediaService.findAndCount({
      where: buildQueryOptions<Media>({
        keyword,
        keywordProperties: (entity) => [entity.name, entity.description],
        exact: {
          createAt: start && Between(new Date(start), end ? new Date(end) : new Date()),
          isPublic: user.hasOneOf(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP) ? undefined : true,
        },
      }),
      skip: query.page * query.size,
      take: query.size,
      order: query.sortBy,
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }

  @Post()
  @ApiOperation({
    description: '创建媒体',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP)
  @RequestTimeout(30 * 1000)
  async createMedia(@Body() data: MediaDto) {
    if (!isDefined(data.name) || !isDefined(data.fileId)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const { id } = await this.mediaService.save({
      ...data,
      file: { id: data.fileId },
    });

    const media = await this.mediaService.findOneBy({ id });
    if (media.file?.isExist && !media.metadata) {
      await this.mediaFileService.generateMediaFiles(media);
    }

    return await this.mediaService.findOneBy({ id });
  }

  @Put(':id')
  @ApiOperation({
    description: '修改媒体',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP)
  async updateMedia(@Param('id') id: string, @Body() data: MediaDto) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

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
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    await this.mediaService.delete({ id });
    return {};
  }

  @Get(':id/history')
  @ApiOperation({
    description: '获取播放记录',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP, PermissionEnum.MEDIA_VIEW)
  async getViewHistoryByMediaId(@RequestUser() user: User, @Param('id') id: string) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

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
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

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
      episode: { id: data.episodeId },
      user: { id: user.id },
    });
  }

  @Delete(':id/history')
  @ApiOperation({
    description: '删除播放记录',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP, PermissionEnum.MEDIA_VIEW)
  async deleteViewHistory(@RequestUser() user: User, @Param('id') id: string) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    await this.viewHistoryService.delete({
      media: { id },
      user: { id: user.id },
    });
    return {};
  }
}
