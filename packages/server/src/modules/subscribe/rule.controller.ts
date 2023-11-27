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
import { RuleService } from './rule.service';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { PermissionEnum } from '../../enums/permission.enum';
import { RequestUser } from '../authorization/request.user.decorator';
import { User } from '../user/user.entity';
import { RuleDto } from './rule.dto';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { randomUUID } from 'crypto';
import path from 'path';
import { SUBSCRIBE_RULE_SOURCE_DIR } from '../../constants';
import fs from 'fs-extra';
import { generateMD5 } from '../../utils/generate-md5.util';
import { FileSourceEnum } from '../../enums/file-source.enum';
import { FileService } from '../file/file.service';
import { RuleQueryDto } from './rule-query.dto';
import { buildQueryOptions } from '../../utils/build-query-options.util';
import { Rule } from './rule.entity';
import { ApiPaginationResultDto } from '../../utils/api.pagination.result.dto';
import { ApiQueryDto } from '../../utils/api.query.dto';
import { RuleErrorLog } from './rule-error-log.entity';
import { RuleErrorLogService } from './rule-error-log.service';
import { SourceService } from './source.service';
import { In } from 'typeorm';

@Controller('subscribe/rule')
@UseGuards(AuthorizationGuard)
@ApiTags('subscribe')
@ApiBearerAuth()
export class RuleController {
  constructor(
    private ruleService: RuleService,
    private ruleErrorLogService: RuleErrorLogService,
    private sourceService: SourceService,
    private fileService: FileService,
  ) {}

  @Post()
  @ApiOperation({
    description: '添加订阅源规则',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async createSubscribeRule(@RequestUser() user: User, @Body() data: RuleDto) {
    if (data.code == null) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const filename = randomUUID().replace(/-/g, '') + '.ts';
    const filepath = path.join(SUBSCRIBE_RULE_SOURCE_DIR, filename);
    await fs.ensureDir(SUBSCRIBE_RULE_SOURCE_DIR);
    await fs.writeFile(filepath, data.code);
    const fileStat = await fs.stat(filepath);
    const file = await this.fileService.save({
      user: { id: user.id },
      filename: filename,
      name: filename,
      size: fileStat.size,
      md5: await generateMD5(data.code),
      source: FileSourceEnum.USER_UPLOAD,
      path: filepath,
    });

    const { id } = await this.ruleService.save({
      ...data,
      sources: data.sourceIds?.map((id) => ({ id })),
      file,
    });
    return await this.ruleService.findOneBy({ id });
  }

  @Get(':id')
  @ApiOperation({
    description: '获取规则信息',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP, PermissionEnum.SUBSCRIBE_VIEW)
  async getSubscribeRuleById(@Param('id', ParseIntPipe) id: number) {
    const rule = await this.ruleService.findOneBy({ id });
    if (!rule) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return rule;
  }

  @Get()
  @ApiOperation({
    description: '查询订阅规则',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async querySubscribeRule(@Query() query: RuleQueryDto) {
    const { keyword, sourceId } = query;

    let idCondition = undefined;
    if (sourceId) {
      const source = await this.sourceService.findOneBy({ id: sourceId });
      if (source) {
        const rules = await source.rules;
        idCondition = In(rules.map(({ id }) => id));
      }
    }

    const [result, total] = await this.ruleService.findAndCount({
      where: buildQueryOptions<Rule>({
        keyword,
        keywordProperties: (entity) => [entity.remark],
        exact: {
          id: idCondition,
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
    description: '修改订阅源规则',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async updateSubscribeRule(@Param('id', ParseIntPipe) id: number, @Body() data: RuleDto) {
    const rule = await this.ruleService.findOneBy({ id });
    if (!rule) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    if (data.code) {
      await fs.ensureDir(SUBSCRIBE_RULE_SOURCE_DIR);
      await fs.writeFile(rule.file.path, data.code);
      const fileStat = await fs.stat(rule.file.path);
      await this.fileService.save({
        id: rule.file.id,
        size: fileStat.size,
        md5: await generateMD5(data.code),
      });
    }

    await this.ruleService.save({
      id,
      ...data,
      sources: data.sourceIds?.map((id) => ({ id })),
    });

    return await this.ruleService.findOneBy({ id });
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除订阅规则',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async deleteSubscribeRule(@Param('id', ParseIntPipe) id: number) {
    await this.ruleService.delete({ id });
    return {};
  }

  @Get(':id/log')
  @ApiOperation({
    description: '查询订阅规则错误日志',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async getErrorLogsByRuleId(@Param('id', ParseIntPipe) id: number, @Query() query: ApiQueryDto<RuleErrorLog>) {
    const rule = await this.ruleService.findOneBy({ id });
    if (!rule) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const [result, total] = await this.ruleErrorLogService.findAndCount({
      where: buildQueryOptions<RuleErrorLog>({
        exact: { rule: { id } },
      }),
      skip: query.page * query.size,
      take: query.size,
      order: { [query.sort]: query.order },
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }

  @Delete(':id/log')
  @ApiOperation({
    description: '删除所有订阅规则错误日志',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP)
  async deleteErrorLogsByRuleId(@Param('id', ParseIntPipe) id: number) {
    const rule = await this.ruleService.findOneBy({ id });
    if (!rule) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    await this.ruleErrorLogService.delete({
      rule: { id },
    });
    return {};
  }
}
