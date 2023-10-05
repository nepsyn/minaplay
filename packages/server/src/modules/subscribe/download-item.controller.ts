import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
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
import { EpisodeService } from '../series/episode.service';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { StatusEnum } from '../../enums/status.enum';
import { RuleFileDescriber, RuleFileDescriptor } from './rule.interface';
import { RuleService } from './rule.service';
import { RuleErrorLogService } from './rule-error-log.service';
import { DownloadItemQueryDto } from './download-item-query.dto';
import { buildQueryOptions } from '../../utils/build-query-options.util';
import { DownloadItem } from './download-item.entity';
import { Between } from 'typeorm';
import { ApiPaginationResultDto } from '../../utils/api.pagination.result.dto';

@Controller('subscribe/download')
@UseGuards(AuthorizationGuard)
@ApiTags('subscribe')
@ApiBearerAuth()
export class DownloadItemController {
  constructor(
    private mediaService: MediaService,
    private mediaFileService: MediaFileService,
    private episodeService: EpisodeService,
    private downloadItemService: DownloadItemService,
    private ruleService: RuleService,
    private ruleErrorLogService: RuleErrorLogService,
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
        }
      }
    });

    return item;
  }

  @Post(':id/retry')
  @ApiOperation({
    description: '重试下载任务',
  })
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

    const [task] = await this.downloadItemService.addDownloadItemTask(item.url, {
      id: item.id,
    });
    task.on('complete', async (files) => {
      const entry = Object.freeze(JSON.parse(item.entry));
      for (const file of files) {
        if (VALID_VIDEO_MIME.includes(file.mimetype)) {
          const copy = Object.freeze(Object.assign({}, file));

          let descriptor: RuleFileDescriptor;
          try {
            descriptor = (await describe?.(entry, copy)) ?? {};
          } catch (error) {
            await this.ruleErrorLogService.save({
              rule: { id: item.rule.id },
              error: error.toString(),
            });
            continue;
          }

          const { id } = await this.mediaService.save({
            name: descriptor.name ?? file.name,
            description: descriptor.description,
            download: { id: item.id },
            isPublic: descriptor.isPublic ?? true,
            file: { id: file.id },
          });
          const media = await this.mediaService.findOneBy({ id });
          await this.mediaFileService.generateMediaFiles(media);

          if (item.rule.series) {
            await this.episodeService.save({
              title: descriptor.title,
              no: descriptor.no,
              media: { id: media.id },
              series: { id: item.rule.series.id },
            });
          }
        }
      }
    });

    return item;
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
          createAt: start != null ? Between(new Date(start), end != null ? new Date(end) : new Date()) : undefined,
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
