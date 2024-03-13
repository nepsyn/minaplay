import { Controller, Get, Inject, Param, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import http from 'node:http';
import { LIVE_MODULE_OPTIONS_TOKEN } from './live.module-definition.js';
import { LiveModuleOptions } from './live.module.interface.js';

@Controller('live')
@ApiTags('live')
export class LiveStreamController {
  constructor(@Inject(LIVE_MODULE_OPTIONS_TOKEN) private options: LiveModuleOptions) {}

  @Get(':id/stream.flv')
  @ApiOperation({
    description: '获取直播间 FLV 直播流',
  })
  async getFlvLiveStreamById(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    http
      .request(
        `http://127.0.0.1:${this.options.streamHttpPort}/live/${id}.flv`,
        { headers: req.headers },
        (streamRes) => {
          streamRes.pipe(res);
        },
      )
      .end();
  }

  @Get(':id/stream.m3u8')
  @ApiOperation({
    description: '获取直播间 M3U8 直播流',
  })
  async getHlsLiveStreamById(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    http
      .request(
        `http://127.0.0.1:${this.options.streamHttpPort}/live/${id}.m3u8`,
        { headers: req.headers },
        (streamRes) => {
          streamRes.pipe(res);
        },
      )
      .end();
  }
}
