import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { LIVE_MODULE_OPTIONS_TOKEN } from './live.module-definition';
import { LiveModuleOptions } from './live.module.interface';
import NodeMediaServer from 'node-media-server';
import { ChildProcess, spawn } from 'child_process';
import { generateMD5 } from '../../utils/generate-md5.util';
import { LIVE_STREAM_DIR } from 'src/constants';
import { ApplicationLogger } from '../../common/application.logger.service';

@Injectable()
export class LiveStreamService implements OnModuleInit {
  private server: NodeMediaServer;
  private streams: Map<string, ChildProcess> = new Map();

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

  private async generateSign(streamId: string) {
    const time = new Date();
    time.setDate(time.getDate() + 7);
    const timestamp = Math.floor(time.getTime() / 1000);
    const hash = await generateMD5(`/live/${streamId}-${timestamp}-${this.options.streamPublishKey}`);
    return `${timestamp}-${hash}`;
  }

  private escapePath(path: string) {
    return path.replace(/\\/g, '\\\\');
  }

  async publishVideoFile(streamId: string, path: string) {
    await this.stopPublish(streamId);

    const sign = await this.generateSign(streamId);
    const cp = spawn(
      `"${this.escapePath(this.options.streamFfmpegPath)}"`,
      [
        '-re',
        `-i "${this.escapePath(path)}"`,
        '-c copy',
        '-f flv',
        `rtmp://127.0.0.1:${this.options.streamRtmpPort}/live/${streamId}?sign=${sign}`,
      ],
      {
        shell: true,
      },
    );
    this.streams.set(streamId, cp);

    return {
      rtmp: {
        port: this.options.streamRtmpPort,
        path: `/live/${streamId}`,
      },
      http: {
        port: this.options.streamHttpPort,
        path: `/live/${streamId}/stream.flv`,
      },
      ws: {
        port: this.options.streamHttpPort,
        path: `/live/${streamId}/stream.flv`,
      },
    };
  }

  async stopPublish(streamId: string) {
    if (this.streams.has(streamId)) {
      const cp = this.streams.get(streamId);
      if (cp && !cp.killed) {
        cp.kill();
      }
    }
  }
}
