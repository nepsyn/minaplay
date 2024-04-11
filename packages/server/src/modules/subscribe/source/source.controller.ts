import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SourceService } from './source.service.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthorizationGuard } from '../../authorization/authorization.guard.js';
import { RequirePermissions } from '../../authorization/require-permissions.decorator.js';
import { ErrorCodeEnum, PermissionEnum } from '../../../enums/index.js';
import { SourceDto } from './source.dto.js';
import { buildException } from '../../../utils/build-exception.util.js';
import { RequestUser } from '../../../common/request.user.decorator.js';
import { User } from '../../user/user.entity.js';
import { SourceQueryDto } from './source-query.dto.js';
import { buildQueryOptions } from '../../../utils/build-query-options.util.js';
import { Source } from './source.entity.js';
import { Between } from 'typeorm';
import { ApiPaginationResultDto } from '../../../common/api.pagination.result.dto.js';
import { isDefined } from 'class-validator';
import { CronTime } from 'cron';
import { ParseLogService } from '../parse-log/parse-log.service.js';
import { DownloadService } from '../download/download.service.js';
import { ParseLog } from '../parse-log/parse-log.entity.js';
import { DownloadItemQueryDto } from '../download/download-item-query.dto.js';
import { DownloadItem } from '../download/download-item.entity.js';
import { ParseLogQueryDto } from '../parse-log/parse-log-query.dto.js';

@Controller('subscribe/source')
@UseGuards(AuthorizationGuard)
@ApiTags('subscribe')
@ApiBearerAuth()
export class SourceController {
  constructor(
    private sourceService: SourceService,
    private parseLogService: ParseLogService,
    private downloadService: DownloadService,
  ) {}

  @Post()
  @ApiOperation({
    description: '添加新订阅',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async createSource(@RequestUser() user: User, @Body() data: SourceDto) {
    if (!isDefined(data.url) || !isDefined(data.enabled) || !isDefined(data.cron)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    try {
      new CronTime(data.cron);
    } catch {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const { id } = await this.sourceService.save({
      ...data,
      user: { id: user.id },
    });
    const source = await this.sourceService.findOneBy({ id });
    if (source.enabled) {
      await this.sourceService.addFetchSubscribeDataJob(source);
    }

    return source;
  }

  @Get(':id')
  @ApiOperation({
    description: '获取订阅源信息',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP, PermissionEnum.SUBSCRIBE_VIEW)
  async getSourceById(@Param('id', ParseIntPipe) id: number) {
    const source = await this.sourceService.findOneBy({ id });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return source;
  }

  @Get()
  @ApiOperation({
    description: '查询订阅源',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP, PermissionEnum.SUBSCRIBE_VIEW)
  async querySource(@Query() query: SourceQueryDto) {
    const { keyword, enabled, userId } = query;
    const [result, total] = await this.sourceService.findAndCount({
      where: buildQueryOptions<Source>({
        keyword,
        keywordProperties: (entity) => [entity.title, entity.url, entity.remark],
        exact: {
          enabled,
          user: { id: userId },
        },
      }),
      skip: query.page * query.size,
      take: query.size,
      order: { [query.sort]: query.order },
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }

  @Put(':id')
  @ApiOperation({
    description: '修改订阅源信息',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async updateSource(@Param('id', ParseIntPipe) id: number, @Body() data: SourceDto) {
    if (data.cron) {
      try {
        new CronTime(data.cron);
      } catch {
        throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
      }
    }

    let source = await this.sourceService.findOneBy({ id });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.sourceService.save({
      id,
      ...data,
    });
    source = await this.sourceService.findOneBy({ id });

    await this.sourceService.deleteFetchSubscribeDataJob(source.id);
    if (source.enabled === true) {
      await this.sourceService.addFetchSubscribeDataJob(source);
    }

    return source;
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除订阅源',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async deleteSource(@Param('id', ParseIntPipe) id: number) {
    await this.sourceService.deleteFetchSubscribeDataJob(id);
    await this.sourceService.delete({ id });
    return {};
  }

  @Get(':id/raw')
  @ApiOperation({
    description: '获取订阅源原始数据',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async fetchRawDataBySourceId(@Param('id', ParseIntPipe) id: number) {
    const source = await this.sourceService.findOneBy({ id });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    try {
      return await this.sourceService.readSource(source.url);
    } catch {
      throw buildException(BadRequestException, ErrorCodeEnum.INVALID_SUBSCRIBE_SOURCE_FORMAT);
    }
  }

  @Post(':id/run')
  @ApiOperation({
    description: '立即执行更新订阅源操作',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async invokeFetchJobBySourceId(@Param('id', ParseIntPipe) id: number) {
    const source = await this.sourceService.findOneBy({ id });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.sourceService.runFetchSubscribeDataJob(source);
    return source;
  }

  @Get(':id/log')
  @ApiOperation({
    description: '获取订阅源解析日志',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async getParseLogsBySourceId(@Param('id', ParseIntPipe) id: number, @Query() query: ParseLogQueryDto) {
    const source = await this.sourceService.findOneBy({ id });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const { status, start, end } = query;
    const [result, total] = await this.parseLogService.findAndCount({
      where: buildQueryOptions<ParseLog>({
        exact: {
          source: { id },
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

  @Delete(':id/log')
  @ApiOperation({
    description: '删除所有订阅源解析日志',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async deleteParseLogsBySourceId(@Param('id', ParseIntPipe) id: number) {
    const source = await this.sourceService.findOneBy({ id });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.parseLogService.delete({
      source: { id },
    });
    return {};
  }

  @Get(':id/download')
  @ApiOperation({
    description: '获取订阅源下载项目',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async getDownloadItemsBySourceId(@Param('id', ParseIntPipe) id: number, @Query() query: DownloadItemQueryDto) {
    const source = await this.sourceService.findOneBy({ id });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const { keyword, url, ruleId, logId, start, end, status } = query;
    const [result, total] = await this.downloadService.findAndCount({
      where: buildQueryOptions<DownloadItem>({
        keyword,
        keywordProperties: (entity) => [entity.name, entity.url],
        exact: {
          url,
          source: { id },
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
}
