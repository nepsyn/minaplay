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
import { SourceService } from './source.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthorizationGuard } from '../authorization/authorization.guard';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { PermissionEnum } from '../../enums/permission.enum';
import { SourceDto } from './source.dto';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { RequestUser } from '../authorization/request.user.decorator';
import { User } from '../user/user.entity';
import { SourceQueryDto } from './source-query.dto';
import { buildQueryOptions } from '../../utils/build-query-options.util';
import { ApiPaginationResultDto } from '../../utils/api.pagination.result.dto';
import { Source } from './source.entity';
import { RuleService } from './rule.service';
import { FetchLogService } from './fetch-log.service';
import { FetchLogQueryDto } from './fetch-log-query.dto';
import { FetchLog } from './fetch-log.entity';
import { Between } from 'typeorm';
import { DownloadItemQueryDto } from './download-item-query.dto';
import { DownloadItemService } from './download-item.service';
import { DownloadItem } from './download-item.entity';

@Controller('subscribe')
@UseGuards(AuthorizationGuard)
@ApiTags('subscribe')
@ApiBearerAuth()
export class SourceController {
  constructor(
    private sourceService: SourceService,
    private ruleService: RuleService,
    private fetchLogService: FetchLogService,
    private downloadItemService: DownloadItemService,
  ) {}

  @Post()
  @ApiOperation({
    description: '添加新订阅',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async createSource(@RequestUser() user: User, @Body() data: SourceDto) {
    if (data.url == null || data.enabled == null) {
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
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
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
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async querySource(@Query() query: SourceQueryDto) {
    const { keyword, id, url, userId } = query;
    const [result, total] = await this.sourceService.findAndCount({
      where: buildQueryOptions<Source>({
        keyword,
        keywordProperties: (entity) => [entity.title, entity.url, entity.remark],
        exact: { id, url, user: { id: userId } },
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
    const source = await this.sourceService.findOneBy({ id });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.sourceService.save({
      id,
      ...data,
    });

    if (data.enabled !== undefined) {
      await this.sourceService.deleteFetchSubscribeDataJob(id);
      if (data.enabled === true) {
        await this.sourceService.addFetchSubscribeDataJob(source);
      }
    }

    return await this.sourceService.findOneBy({ id });
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

  @Get(':id/rule')
  @ApiOperation({
    description: '获取订阅源规则列表',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async getRulesBySourceId(@Param('id', ParseIntPipe) id: number) {
    const source = await this.sourceService.findOneBy({ id });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const [rules] = await this.ruleService.findAndCount({
      where: {
        source: { id },
      },
    });

    return rules;
  }

  @Get(':id/log')
  @ApiOperation({
    description: '获取订阅源解析日志',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async getFetchLogsBySourceId(@Param('id', ParseIntPipe) id: number, @Query() query: FetchLogQueryDto) {
    const source = await this.sourceService.findOneBy({ id });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const { start, end } = query;
    const [result, total] = await this.fetchLogService.findAndCount({
      where: buildQueryOptions<FetchLog>({
        exact: {
          source: { id },
          createAt: start != null ? Between(new Date(start), end != null ? new Date(end) : new Date()) : undefined,
        },
      }),
      skip: query.page * query.size,
      take: query.size,
      order: { [query.sort]: query.order },
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
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

    const { keyword, start, end, status } = query;
    const [result, total] = await this.downloadItemService.findAndCount({
      where: buildQueryOptions<DownloadItem>({
        keyword,
        keywordProperties: (entity) => [entity.title, entity.url],
        exact: {
          source: { id },
          status,
          createAt: start != null ? Between(new Date(start), end != null ? new Date(end) : new Date()) : undefined,
        },
      }),
      skip: query.page * query.size,
      take: query.size,
      order: { [query.sort]: query.order },
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }
}
