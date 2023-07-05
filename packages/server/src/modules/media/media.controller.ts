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
import { FileService } from '../file/file.service';

@Controller('media')
@UseGuards(AuthorizationGuard)
@ApiTags('media')
@ApiBearerAuth()
export class MediaController {
  constructor(private mediaService: MediaService, private fileService: FileService) {}

  @Get(':id')
  @ApiOperation({
    description: '查看媒体',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP, PermissionEnum.MEDIA_VIEW)
  async getMediaById(@Param('id') id: string) {
    const media = await this.mediaService.findOneBy({ id });
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
  async queryMedia(@Query() query: MediaQueryDto) {
    const { keyword, start, end } = query;
    const [result, total] = await this.mediaService.findAndCount({
      where: buildQueryOptions<Media>({
        keyword,
        keywordProperties: (entity) => [entity.name, entity.description],
        exact: {
          createAt: start != null ? Between(new Date(start), end != null ? new Date(end) : new Date()) : undefined,
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
    if (!media.poster) {
      await this.mediaService.generatePosterFile(media);
    }

    return media;
  }

  @Put(':id')
  @ApiOperation({
    description: '修改媒体',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP)
  async updateMedia(@Param('id') id: string, @Body() data: MediaDto) {
    if (data.fileId !== undefined) {
      const file = await this.fileService.findOneBy({ id: data.fileId });
      if (!file) {
        throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
      }
    }

    if (data.posterFileId !== undefined) {
      const file = await this.fileService.findOneBy({ id: data.posterFileId });
      if (!file) {
        throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
      }
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
}
