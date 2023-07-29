import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthorizationGuard } from '../authorization/authorization.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeriesTagService } from './series-tag.service';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { PermissionEnum } from '../../enums/permission.enum';
import { SeriesTagDto } from './series-tag.dto';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';

@Controller('series/tag')
@UseGuards(AuthorizationGuard)
@ApiTags('series')
@ApiBearerAuth()
export class SeriesTagController {
  constructor(private seriesTagService: SeriesTagService) {}

  @Post()
  @ApiOperation({
    description: '新增剧集标签',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP)
  async createSeriesTag(@Body() data: SeriesTagDto) {
    const sameNameSeriesTag = await this.seriesTagService.findOneBy({ name: data.name });
    if (sameNameSeriesTag) {
      return sameNameSeriesTag;
    }

    const { id } = await this.seriesTagService.save(data);

    return await this.seriesTagService.findOneBy({ id });
  }

  @Put(':id')
  @ApiOperation({
    description: '修改剧集标签',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP)
  async updateSeriesTag(@Param('id', ParseIntPipe) id: number, @Body() data: SeriesTagDto) {
    const seriesTag = await this.seriesTagService.findOneBy({ id });
    if (!seriesTag) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const sameNameSeriesTag = await this.seriesTagService.findOneBy({ name: data.name });
    if (sameNameSeriesTag && sameNameSeriesTag.id !== id) {
      throw buildException(BadRequestException, ErrorCodeEnum.DUPLICATE_SERIES_TAG_NAME);
    }

    await this.seriesTagService.save({
      id,
      ...data,
    });

    return await this.seriesTagService.findOneBy({ id });
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除剧集标签',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP)
  async deleteSeriesTag(@Param('id', ParseIntPipe) id: number) {
    await this.seriesTagService.delete({ id });
    return {};
  }
}
