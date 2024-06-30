import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthorizationGuard } from '../../authorization/authorization.guard.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../authorization/require-permissions.decorator.js';
import { ErrorCodeEnum, PermissionEnum, StatusEnum } from '../../../enums/index.js';
import { buildException } from '../../../utils/build-exception.util.js';
import { DownloadItemQueryDto } from './download-item-query.dto.js';
import { buildQueryOptions } from '../../../utils/build-query-options.util.js';
import { DownloadItem } from './download-item.entity.js';
import { Between, In } from 'typeorm';
import { ApiPaginationResultDto } from '../../../common/api.pagination.result.dto.js';
import { isDefined } from 'class-validator';
import { DownloadService } from './download.service.js';
import { DownloadItemDto } from './download-item.dto.js';
import { generateMD5 } from '../../../utils/generate-md5.util.js';

@Controller('subscribe/download')
@UseGuards(AuthorizationGuard)
@ApiTags('subscribe')
@ApiBearerAuth()
export class DownloadItemController {
  constructor(private downloadService: DownloadService) {}

  @Post()
  @ApiOperation({
    description: '添加下载任务',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async createDownloadTask(@Body() data: DownloadItemDto) {
    const sameHashItem = await this.downloadService.findOneBy({
      hash: await generateMD5(data.url),
    });
    if (sameHashItem) {
      throw buildException(BadRequestException, ErrorCodeEnum.DUPLICATED_DOWNLOAD_ITEM);
    }

    const { id } = await this.downloadService.createAutoDownloadTask(
      {
        id: data.name,
        title: data.name ?? data.url,
        enclosure: {
          url: data.url,
        },
      },
      {
        source: data.sourceId && { id: data.sourceId },
      },
    );

    return await this.downloadService.findOneBy({ id });
  }

  @Get(':id')
  @ApiOperation({
    description: '获取下载任务信息',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async getDownloadItemById(@Param('id') id: string) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const item = await this.downloadService.findOneBy({ id });
    if (!item) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return item;
  }

  @Post(':id/retry')
  @ApiOperation({
    description: '重试下载任务',
  })
  @HttpCode(200)
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async retryDownloadTask(@Param('id') id: string) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const item = await this.downloadService.findOneBy({ id });
    if (!item) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }
    if (item.status !== StatusEnum.FAILED || !item.entry) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const { id: itemId } = await this.downloadService.createAutoDownloadTask(JSON.parse(item.entry), {
      item,
      rule: item.rule,
      source: item.source,
      log: item.log,
    });

    return await this.downloadService.findOneBy({ id: itemId });
  }

  @Post(':id/pause')
  @ApiOperation({
    description: '暂停下载任务',
  })
  @HttpCode(200)
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async pauseDownloadTask(@Param('id') id: string) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const item = await this.downloadService.findOneBy({
      id,
      status: StatusEnum.PENDING,
    });
    if (!item) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const task = await this.downloadService.getTask(item.id);
    if (task) {
      await task.pause();
      return await this.downloadService.findOneBy({ id: item.id });
    } else {
      await this.downloadService.delete({ id: item.id });
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }
  }

  @Post(':id/unpause')
  @ApiOperation({
    description: '继续下载任务',
  })
  @HttpCode(200)
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async unpauseDownloadTask(@Param('id') id: string) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const item = await this.downloadService.findOneBy({
      id,
      status: StatusEnum.PAUSED,
    });
    if (!item) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const task = await this.downloadService.getTask(item.id);
    if (task) {
      await task.unpause();
      return await this.downloadService.findOneBy({ id: item.id });
    } else {
      await this.downloadService.delete({ id: item.id });
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }
  }

  @Post(':id/cancel')
  @ApiOperation({
    description: '取消下载任务',
  })
  @HttpCode(200)
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async cancelDownloadTask(@Param('id') id: string) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const item = await this.downloadService.findOneBy({
      id,
      status: In([StatusEnum.PENDING, StatusEnum.PAUSED]),
    });
    if (!item) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const task = await this.downloadService.getTask(item.id);
    if (task) {
      await task.remove();
      return await this.downloadService.findOneBy({ id: item.id });
    } else {
      await this.downloadService.delete({ id: item.id });
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }
  }

  @Get()
  @ApiOperation({
    description: '查询下载任务',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async queryDownloadItem(@Query() query: DownloadItemQueryDto) {
    const { keyword, url, sourceId, ruleId, logId, start, end, status } = query;
    const [result, total] = await this.downloadService.findAndCount({
      where: buildQueryOptions<DownloadItem>({
        keyword,
        keywordProperties: (entity) => [entity.name, entity.url],
        exact: {
          url,
          source: { id: sourceId },
          rule: { id: ruleId },
          log: { id: logId },
          status,
          createAt: start && Between(new Date(start), end ? new Date(end) : new Date()),
        },
      }),
      skip: query.page * query.size,
      take: query.size,
      order: { [query.sort]: query.order },
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除下载任务',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async deleteDownloadItem(@Param('id') id: string) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    await this.downloadService.delete({ id });
    return {};
  }
}
