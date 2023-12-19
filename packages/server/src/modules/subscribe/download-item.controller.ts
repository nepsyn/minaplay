import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthorizationGuard } from '../authorization/authorization.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DownloadItemService } from './download-item.service';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { PermissionEnum } from '../../enums/permission.enum';
import { DownloadTaskDto } from './download-task.dto';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { StatusEnum } from '../../enums/status.enum';
import { RuleFileDescriber } from './rule.interface';
import { RuleService } from './rule.service';
import { RuleErrorLogService } from './rule-error-log.service';
import { DownloadItemQueryDto } from './download-item-query.dto';
import { buildQueryOptions } from '../../utils/build-query-options.util';
import { DownloadItem } from './download-item.entity';
import { Between, In, IsNull, Not } from 'typeorm';
import { Aria2Service } from '../aria2/aria2.service';
import { SourceService } from './source.service';
import { ApiPaginationResultDto } from '../../common/api.pagination.result.dto';
import { isDefined } from 'class-validator';

@Controller('subscribe/download')
@UseGuards(AuthorizationGuard)
@ApiTags('subscribe')
@ApiBearerAuth()
export class DownloadItemController {
  constructor(
    private downloadItemService: DownloadItemService,
    private sourceService: SourceService,
    private ruleService: RuleService,
    private ruleErrorLogService: RuleErrorLogService,
    private aria2Service: Aria2Service,
  ) {}

  @Post()
  @ApiOperation({
    description: '添加下载任务',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async createDownloadTask(@Body() data: DownloadTaskDto) {
    const [, item] = await this.downloadItemService.addAutoDownloadItemTask(
      {
        id: data.title,
        title: data.title ?? data.url,
        enclosure: {
          url: data.url,
        },
      },
      {
        source: data.sourceId && { id: data.sourceId },
      },
    );

    return await this.downloadItemService.findOneBy({ id: item.id });
  }

  @Get(':id')
  @ApiOperation({
    description: '获取下载任务信息',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP)
  async getDownloadItemById(@Param('id') id: string) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const item = await this.downloadItemService.findOneBy({ id });
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

    const item = await this.downloadItemService.findOneBy({ id });
    if (!item) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }
    if (item.status !== StatusEnum.FAILED || !item.entry) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    let describe: RuleFileDescriber | undefined = undefined;
    if (item.rule) {
      try {
        const vm = await this.ruleService.createRuleVm(item.rule.code);
        describe = vm.hooks?.describe;
      } catch (error) {
        await this.ruleErrorLogService.save({
          rule: { id: item.rule.id },
          error: error.toString(),
        });
        throw buildException(InternalServerErrorException, ErrorCodeEnum.UNKNOWN_ERROR);
      }
    }

    const [, { id: itemId }] = await this.downloadItemService.addAutoDownloadItemTask(JSON.parse(item.entry), {
      item,
      describeFn: describe,
      rule: item.rule,
      source: item.source,
      log: item.log,
    });

    return await this.downloadItemService.findOneBy({ id: itemId });
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

    const item = await this.downloadItemService.findOneBy({
      id,
      gid: Not(IsNull()),
      status: StatusEnum.PENDING,
    });
    if (!item) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.downloadItemService.save({
      id: item.id,
      status: StatusEnum.PAUSED,
    });
    await this.aria2Service.pauseBy(item.gid);

    return await this.downloadItemService.findOneBy({ id: item.id });
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

    const item = await this.downloadItemService.findOneBy({
      id,
      gid: Not(IsNull()),
      status: StatusEnum.PAUSED,
    });
    if (!item) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.downloadItemService.save({
      id: item.id,
      status: StatusEnum.PENDING,
    });
    await this.aria2Service.unpauseBy(item.gid);

    return await this.downloadItemService.findOneBy({ id: item.id });
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

    const item = await this.downloadItemService.findOneBy({
      id,
      gid: Not(IsNull()),
      status: In([StatusEnum.PENDING, StatusEnum.PAUSED]),
    });
    if (!item) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.downloadItemService.save({
      id: item.id,
      status: StatusEnum.FAILED,
      error: 'User canceled',
    });
    await this.aria2Service.removeBy(item.gid);

    return await this.downloadItemService.findOneBy({ id: item.id });
  }

  @Get()
  @ApiOperation({
    description: '查询下载任务',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async queryDownloadItem(@Query() query: DownloadItemQueryDto) {
    const { keyword, url, sourceId, ruleId, logId, start, end, status } = query;
    const [result, total] = await this.downloadItemService.findAndCount({
      where: buildQueryOptions<DownloadItem>({
        keyword,
        keywordProperties: (entity) => [entity.title, entity.url],
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

    await this.downloadItemService.delete({ id });
    return {};
  }
}
