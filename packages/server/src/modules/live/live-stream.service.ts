import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { LIVE_MODULE_OPTIONS_TOKEN } from './live.module-definition.js';
import { LiveModuleOptions } from './live.module.interface.js';
import NodeMediaServer from 'node-media-server';
import { LIVE_STREAM_DIR } from '../../constants.js';
import { generateMD5 } from '../../utils/generate-md5.util.js';
import { ApplicationLogger } from '../../common/application.logger.service.js';
import type { ExecaChildProcess } from 'execa';
import { execa } from 'execa';

@Injectable()
export class LiveStreamService implements OnModuleInit {
  private server: NodeMediaServer;
  private streams: Map<string, ExecaChildProcess> = new Map();

  private logger = new ApplicationLogger(LiveStreamService.name);

  constructor(@Inject(LIVE_MODULE_OPTIONS_TOKEN) private options: LiveModuleOptions) {}

  async onModuleInit() {
    this.server = new NodeMediaServer({
      rtmp: {
        port: this.options.streamRtmpPort,
        chunk_size: this.options.streamChunkSize,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60,
      },
      http: {
        mediaroot: LIVE_STREAM_DIR,
        port: this.options.streamHttpPort,
        allow_origin: '*',
      },
      auth: {
        publish: true,
        secret: this.options.streamPublishKey,
      },
      logType: 0,
    });
    this.server.run();

    this.logger.log(`LiveStream service is running`);
  }

  getLiveStreamPath(liveId: string) {
    return {
      flv: `/live/${liveId}/stream.flv`,
      hls: `/live/${liveId}/stream.m3u8`,
    };
  }

  private async generateSign(streamId: string) {
    const time = new Date();
    time.setDate(time.getDate() + 7);
    const timestamp = Math.floor(time.getTime() / 1000);
    const hash = await generateMD5(`/live/${streamId}-${timestamp}-${this.options.streamPublishKey}`);
    return `${timestamp}-${hash}`;
  }

  async publishVideoFile(liveId: string, path: string) {
    await this.stopPublish(liveId);

    const sign = await this.generateSign(liveId);
    const cp = execa(
      this.options.streamFfmpegPath,
      [
        '-re',
        '-i',
        path,
        '-c',
        'copy',
        '-f',
        'flv',
        `rtmp://127.0.0.1:${this.options.streamRtmpPort}/live/${liveId}?sign=${sign}`,
      ],
      {
        cleanup: true,
      },
    );
    this.streams.set(liveId, cp);
    cp.catch((error) => {
      if (cp.signalCode !== 'SIGTERM') {
        this.logger.error('Server push stream error', error.stack, LiveStreamService.name);
      }
    });

    return this.getLiveStreamPath(liveId);
  }

  async stopPublish(liveId: string) {
    if (this.streams.has(liveId)) {
      const cp = this.streams.get(liveId);
      if (cp && !cp.killed) {
        cp.kill('SIGTERM');
      }
    }
  }
}
