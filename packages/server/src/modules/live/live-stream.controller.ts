import { Controller, Get, Inject, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import http from 'node:http';
import { LIVE_MODULE_OPTIONS_TOKEN } from './live.module-definition.js';
import { LiveModuleOptions } from './live.module.interface.js';

@Controller('live')
@ApiTags('live')
export class LiveStreamController {
  constructor(@Inject(LIVE_MODULE_OPTIONS_TOKEN) private options: LiveModuleOptions) {}

  @Get(':id/stream.flv')
  @ApiOperation({
    description: '获取直播间直播流',
  })
  async getLiveStreamById(@Param('id') id: string, @Res() res: Response) {
    const req = http.request(`http://127.0.0.1:${this.options.streamHttpPort}/live/${id}.flv`, (streamRes) => {
      streamRes.pipe(res);
    });
    req.on('error', (error) => {
      res.writeHead(500);
      res.write(error?.message);
      res.end();
    });
    req.end();
  }
}
