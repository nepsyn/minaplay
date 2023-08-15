import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { EpisodeService } from './episode.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { PermissionEnum } from '../../enums/permission.enum';
import { buildException } from '../../utils/build-exception.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { EpisodeDto } from './episode.dto';
import { AuthorizationGuard } from '../authorization/authorization.guard';
import { SeriesService } from './series.service';

@Controller('series/-/episode')
@UseGuards(AuthorizationGuard)
@ApiTags('series')
@ApiBearerAuth()
export class EpisodeController {
  constructor(private seriesService: SeriesService, private episodeService: EpisodeService) {}

  @Get(':id')
  @ApiOperation({
    description: '查看单集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP, PermissionEnum.SERIES_VIEW)
  async getEpisodeById(@Param('id', ParseIntPipe) id: number) {
    const episode = await this.episodeService.findOneBy({ id });
    if (!episode) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return episode;
  }

  @Post()
  @ApiOperation({
    description: '创建单集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP)
  async createEpisode(@Body() data: EpisodeDto) {
    const series = await this.seriesService.findOneBy({ id: data.seriesId });
    if (!series) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    const { id } = await this.episodeService.save({
      ...data,
      series: { id: data.seriesId },
      media: { id: data.mediaId },
    });

    return await this.episodeService.findOneBy({ id });
  }

  @Put(':id')
  @ApiOperation({
    description: '修改单集信息',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP)
  async updateEpisode(@Param('id', ParseIntPipe) id: number, @Body() data: EpisodeDto) {
    const episode = await this.episodeService.findOneBy({ id });
    if (!episode) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    if (data.seriesId !== undefined) {
      const series = await this.seriesService.findOneBy({ id: data.seriesId });
      if (!series) {
        throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
      }
    }

    await this.episodeService.save({
      id,
      ...data,
      series: { id: data.seriesId },
      media: { id: data.mediaId },
    });

    return await this.episodeService.findOneBy({ id });
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除单集',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP)
  async deleteEpisode(@Param('id', ParseIntPipe) id: number) {
    await this.episodeService.delete({ id });
    return {};
  }
}
