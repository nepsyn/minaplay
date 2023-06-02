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

@Controller('subscribe')
@UseGuards(AuthorizationGuard)
@ApiTags('subscribe')
@ApiBearerAuth()
export class SubscribeRuleController {
  constructor(
    private subscribeSourceService: SubscribeSourceService,
    private subscribeRuleService: SubscribeRuleService,
    private fileService: FileService,
  ) {}

  @Post(':sourceId/rule')
  @ApiOperation({
    description: '添加订阅源规则',
  })
  @RequirePermissions(PermissionEnum.MANAGE_SUBSCRIBE)
  async createSubscribeRule(
    @RequestUser() user: User,
    @Param('sourceId') sourceId: number,
    @Body() data: SubscribeRuleDto,
  ) {
    const source = await this.subscribeSourceService.findOneBy({ id: sourceId });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    if (!data.code) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
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

    return this.subscribeRuleService.save({
      ...data,
      source: { id: sourceId },
      series: { id: data.seriesId },
      codeFile: file,
    });
  }

  @Get(':sourceId/rule')
  @ApiOperation({
    description: '获取订阅源规则列表',
  })
  @RequirePermissions(PermissionEnum.MANAGE_SUBSCRIBE)
  async getSubscribeRulesBySourceId(@Param('sourceId') sourceId: number) {
    const source = await this.subscribeSourceService.findOneBy({ id: sourceId });
    if (!source) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const [rules] = await this.subscribeRuleService.findAndCount({
      where: {
        source: { id: sourceId },
      },
    });

    return rules;
  }

  @Put('rule/:id')
  @ApiOperation({
    description: '修改订阅源规则',
  })
  @RequirePermissions(PermissionEnum.MANAGE_SUBSCRIBE)
  async updateSubscribeRule(@Param('id') id: number, @Body() data: SubscribeRuleDto) {
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

    return this.subscribeRuleService.save({
      id,
      ...data,
      series: { id: data.seriesId },
    });
  }

  @Delete('rule/:id')
  @ApiOperation({
    description: '删除订阅规则',
  })
  @RequirePermissions(PermissionEnum.MANAGE_SUBSCRIBE)
  async deleteSubscribeRule(@Param('id') id: number) {
    await this.subscribeRuleService.delete({ id });
    return {};
  }
}
