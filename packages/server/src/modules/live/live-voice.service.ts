import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { LIVE_MODULE_OPTIONS_TOKEN } from './live.module-definition.js';
import { LiveModuleOptions } from './live.module.interface.js';
import { createWorker, types as MediasoupTypes, version as MEDIASOUP_VERSION } from 'mediasoup';
import { Interval } from '@nestjs/schedule';
import { ApplicationLogger } from '../../common/application.logger.service.js';

interface Peer {
  transports: Map<string, MediasoupTypes.Transport>;
  consumers: Map<string, MediasoupTypes.Consumer>;
  producers: Map<string, MediasoupTypes.Producer>;
}

interface VoiceGroup {
  router: MediasoupTypes.Router;
  peers: Map<number, Peer>;
}

@Injectable()
export class LiveVoiceService implements OnModuleInit {
  private workers: MediasoupTypes.Worker[] = [];
  private nextWorkerIndex = -1;
  private readonly groups = new Map<string, VoiceGroup>();

  private logger = new ApplicationLogger(LiveVoiceService.name);

  constructor(@Inject(LIVE_MODULE_OPTIONS_TOKEN) private options: LiveModuleOptions) {}

  async onModuleInit() {
    try {
      for (let i = 0; i < this.options.mediasoupWorkerNum; i++) {
        const worker = await createWorker({
          logLevel: 'none',
        });
        worker.on('died', (error: Error) => {
          this.workers = this.workers.filter((value) => value !== worker);
          this.logger.error(`Mediasoup worker(${i}) died`, error.stack, LiveVoiceService.name);
        });
        this.workers.push(worker);
      }
      this.logger.log(`LiveVoice service is running, mediasoup version=${MEDIASOUP_VERSION}`);
    } catch (error) {
      this.logger.error(
        `LiveVoice service init failed, mediasoup version=${MEDIASOUP_VERSION}`,
        error?.stack,
        LiveVoiceService.name,
      );
    }
  }

  @Interval('mediasoup-workers-status', /* 1 day */ 24 * 60 * 60 * 1000)
  async logWorkersStatus() {
    for (const [index, worker] of this.workers.entries()) {
      const usage = await worker.getResourceUsage();
      this.logger.debug(
        `Mediasoup worker(${index})[pid:${worker.pid}] CPU time usage: {user: ${usage.ru_utime}, system: ${usage.ru_stime}}`,
      );
    }
  }

  async getVoiceGroup(groupId: string) {
    if (!this.groups.has(groupId)) {
      this.groups.set(groupId, {
        router: await this.createRouter(),
        peers: new Map(),
      });
    }
    return this.groups.get(groupId);
  }

  private async createRouter() {
    if (this.workers.length === 0) {
      throw new Error('Mediasoup service not available');
    }

    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
    const worker = this.workers[this.nextWorkerIndex];
    return await worker.createRouter({
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: this.options.mediasoupAudioClockRate,
          channels: this.options.mediasoupAudioChannel,
        },
      ],
    });
  }

  async createWebRtcTransport(groupId: string, peerId: number) {
    const group = await this.getVoiceGroup(groupId);
    const transport = await group.router.createWebRtcTransport({
      listenInfos: [
        {
          protocol: 'udp',
          ip: '0.0.0.0',
          announcedAddress: this.options.mediasoupAnnouncedAddress,
          portRange: {
            min: this.options.mediasoupRtcMinPort,
            max: this.options.mediasoupRtcMaxPort,
          },
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });
    await transport.setMaxIncomingBitrate(this.options.mediasoupMaxIncomeBitrate);

    transport.on('dtlsstatechange', (dtlsState: string) => {
      if (dtlsState === 'closed') transport.close();
    });

    group.peers.get(peerId).transports.set(transport.id, transport);

    return transport;
  }

  async connectTransport(
    groupId: string,
    peerId: number,
    transportId: string,
    dtlsParameters: MediasoupTypes.DtlsParameters,
  ) {
    const group = await this.getVoiceGroup(groupId);
    const peer = group.peers.get(peerId);
    const transport = peer.transports.get(transportId);

    await transport.connect({ dtlsParameters });
  }

  async createProducer(
    groupId: string,
    peerId: number,
    transportId: string,
    rtpParameters: MediasoupTypes.RtpParameters,
  ) {
    const group = await this.getVoiceGroup(groupId);
    const peer = group.peers.get(peerId);
    const transport = peer.transports.get(transportId);

    if (!transport) {
      return undefined;
    }

    const producer = await transport.produce({
      kind: 'audio',
      rtpParameters,
    });
    producer.on('transportclose', () => {
      producer.close();
      peer.producers.delete(producer.id);
    });
    peer.producers.set(producer.id, producer);

    return producer;
  }

  async createConsumer(
    groupId: string,
    peerId: number,
    transportId: string,
    producerId: string,
    rtpCapabilities: MediasoupTypes.RtpCapabilities,
  ) {
    const group = await this.getVoiceGroup(groupId);
    const peer = group.peers.get(peerId);
    const transport = peer.transports.get(transportId);

    if (!transport) {
      return undefined;
    }

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: false,
    });

    consumer.on('transportclose', () => {
      peer.consumers.delete(consumer.id);
    });
    consumer.on('producerclose', () => {
      peer.consumers.delete(consumer.id);
    });
    peer.consumers.set(consumer.id, consumer);

    return consumer;
  }

  async removePeer(groupId: string, peerId: number) {
    const group = this.groups.get(groupId);
    const peer = group?.peers.get(peerId);

    if (peer) {
      for (const producer of peer.producers.values()) producer.close();
      for (const consumer of peer.consumers.values()) consumer.close();
      for (const transport of peer.transports.values()) transport.close();

      group.peers.delete(peerId);
    }
  }

  async removeGroup(groupId: string) {
    const group = this.groups.get(groupId);

    if (group) {
      for (const peerId of group.peers.keys()) {
        await this.removePeer(groupId, peerId);
      }

      this.groups.delete(groupId);
    }
  }
}
