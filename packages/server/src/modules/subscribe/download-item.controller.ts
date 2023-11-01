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
import { VALID_VIDEO_MIME } from '../../constants';
import { MediaService } from '../media/media.service';
import { MediaFileService } from '../media/media-file.service';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { StatusEnum } from '../../enums/status.enum';
import { RuleFileDescriber } from './rule.interface';
import { RuleService } from './rule.service';
import { RuleErrorLogService } from './rule-error-log.service';
import { DownloadItemQueryDto } from './download-item-query.dto';
import { buildQueryOptions } from '../../utils/build-query-options.util';
import { DownloadItem } from './download-item.entity';
import { Between, IsNull, Not } from 'typeorm';
import { ApiPaginationResultDto } from '../../utils/api.pagination.result.dto';
import { Aria2Service } from '../aria2/aria2.service';
import { PluginService } from '../plugin/plugin.service';

@Controller('subscribe/download')
@UseGuards(AuthorizationGuard)
@ApiTags('subscribe')
@ApiBearerAuth()
export class DownloadItemController {
  constructor(
    private mediaService: MediaService,
    private mediaFileService: MediaFileService,
    private downloadItemService: DownloadItemService,
    private ruleService: RuleService,
    private ruleErrorLogService: RuleErrorLogService,
    private aria2Service: Aria2Service,
    private pluginService: PluginService,
  ) {}

  @Post()
  @ApiOperation({
    description: '添加下载任务',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async createDownloadTask(@Body() data: DownloadTaskDto) {
    const [task, item] = await this.downloadItemService.addDownloadItemTask(data.url, {
      url: data.url,
    });
    task.on('complete', async (files) => {
      for (const file of files) {
        if (VALID_VIDEO_MIME.includes(file.mimetype)) {
          const { id } = await this.mediaService.save({
            name: file.name,
            download: { id: item.id },
            isPublic: true,
            file: { id: file.id },
          });
          const media = await this.mediaService.findOneBy({ id });
          await this.mediaFileService.generateMediaFiles(media);
          await this.pluginService.emitAllEnabled('onNewMedia', media.id);
        }
      }
    });

    return item;
  }

  @Post(':id/retry')
  @ApiOperation({
    description: '重试下载任务',
  })
  @HttpCode(200)
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async retryDownloadTask(@Param('id') id: string) {
    const item = await this.downloadItemService.findOneBy({ id });
    if (!item) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }
    if (item.status !== StatusEnum.FAILED || !item.rule || !item.rule.codeFile.isExist) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    let describe: RuleFileDescriber;
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

    await this.downloadItemService.addAutoDownloadItemTask(
      Object.freeze(JSON.parse(item.entry)),
      item.rule,
      item.log,
      describe,
    );

    return item;
  }

  @Post(':id/pause')
  @ApiOperation({
    description: '暂停下载任务',
  })
  @HttpCode(200)
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async pauseDownloadTask(@Param('id') id: string) {
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
    return { id: item.id, gid: item.gid, status: StatusEnum.PAUSED };
  }

  @Post(':id/unpause')
  @ApiOperation({
    description: '继续下载任务',
  })
  @HttpCode(200)
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async unpauseDownloadTask(@Param('id') id: string) {
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
    return { id: item.id, gid: item.gid, status: StatusEnum.PENDING };
  }

  @Post(':id/cancel')
  @ApiOperation({
    description: '取消下载任务',
  })
  @HttpCode(200)
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async cancelDownloadTask(@Param('id') id: string) {
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
      status: StatusEnum.FAILED,
      error: 'User canceled',
    });

    await this.aria2Service.removeBy(item.gid);
    return { id: item.id, gid: item.gid, status: StatusEnum.FAILED };
  }

  @Get()
  @ApiOperation({
    description: '查询下载任务',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async queryDownloadItem(@Query() query: DownloadItemQueryDto) {
    const { keyword, id, url, sourceId, ruleId, logId, start, end, status } = query;
    const [result, total] = await this.downloadItemService.findAndCount({
      where: buildQueryOptions<DownloadItem>({
        keyword,
        keywordProperties: (entity) => [entity.title, entity.url],
        exact: {
          id,
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
    await this.downloadItemService.delete({ id });
    return {};
  }
}
