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
import { AuthorizationGuard } from '../authorization/authorization.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscribeRuleService } from './subscribe-rule.service';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { PermissionEnum } from '../../enums/permission.enum';
import { RequestUser } from '../authorization/request.user.decorator';
import { User } from '../user/user.entity';
import { SubscribeRuleDto } from './subscribe-rule.dto';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { randomUUID } from 'crypto';
import path from 'path';
import { SUBSCRIBE_RULE_SOURCE_DIR } from '../../constants';
import { ensureDir, stat, writeFile } from 'fs-extra';
import { generateMD5 } from '../../utils/generate-md5.util';
import { FileSourceEnum } from '../../enums/file-source.enum';
import { FileService } from '../file/file.service';
import { SubscribeSourceService } from './subscribe-source.service';
import { SubscribeRuleQueryDto } from './subscribe-rule-query.dto';
import { buildQueryOptions } from '../../utils/build-query-options.util';
import { SubscribeRule } from './subscribe-rule.entity';
import { ApiPaginationResultDto } from '../../utils/api.pagination.result.dto';

@Controller('rule')
@UseGuards(AuthorizationGuard)
@ApiTags('subscribe')
@ApiBearerAuth()
export class SubscribeRuleController {
  constructor(
    private subscribeSourceService: SubscribeSourceService,
    private subscribeRuleService: SubscribeRuleService,
    private fileService: FileService,
  ) {}

  @Post()
  @ApiOperation({
    description: '添加订阅源规则',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async createSubscribeRule(@RequestUser() user: User, @Body() data: SubscribeRuleDto) {
    if (data.sourceId == null || data.code == null) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const source = await this.subscribeSourceService.findOneBy({ id: data.sourceId });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const filename = randomUUID().replace(/-/g, '') + '.js';
    const filepath = path.join(SUBSCRIBE_RULE_SOURCE_DIR, filename);
    await ensureDir(SUBSCRIBE_RULE_SOURCE_DIR);
    await writeFile(filepath, data.code);
    const fileStat = await stat(filepath);
    const file = await this.fileService.save({
      user: { id: user.id },
      filename: filename,
      name: filename,
      size: fileStat.size,
      md5: await generateMD5(data.code),
      source: FileSourceEnum.USER_UPLOAD,
      path: filepath,
    });

    const { id } = await this.subscribeRuleService.save({
      ...data,
      source: { id: data.sourceId },
      series: { id: data.seriesId },
      codeFile: file,
    });
    return await this.subscribeRuleService.findOneBy({ id });
  }

  @Get()
  @ApiOperation({
    description: '查询订阅规则',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async querySubscribeRule(@Query() query: SubscribeRuleQueryDto) {
    const { keyword, id, sourceId, seriesId } = query;
    const [result, total] = await this.subscribeRuleService.findAndCount({
      where: buildQueryOptions<SubscribeRule>({
        keyword,
        keywordProperties: (entity) => [entity.remark],
        exact: { id, source: { id: sourceId }, series: { id: seriesId } },
      }),
      skip: query.page * query.size,
      take: query.size,
      order: { [query.sort]: query.order },
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }

  @Put(':id')
  @ApiOperation({
    description: '修改订阅源规则',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async updateSubscribeRule(@Param('id', ParseIntPipe) id: number, @Body() data: SubscribeRuleDto) {
    const rule = await this.subscribeRuleService.findOneBy({ id });
    if (!rule) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    if (data.code) {
      const file = rule.codeFile;
      await ensureDir(SUBSCRIBE_RULE_SOURCE_DIR);
      await writeFile(file.path, data.code);
      const fileStat = await stat(file.path);
      await this.fileService.save({
        id: file.id,
        size: fileStat.size,
        md5: await generateMD5(data.code),
      });
    }

    await this.subscribeRuleService.save({
      id,
      ...data,
      source: { id: data.sourceId },
      series: { id: data.seriesId },
    });

    return await this.subscribeRuleService.findOneBy({ id });
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除订阅规则',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async deleteSubscribeRule(@Param('id', ParseIntPipe) id: number) {
    await this.subscribeRuleService.delete({ id });
    return {};
  }
}
