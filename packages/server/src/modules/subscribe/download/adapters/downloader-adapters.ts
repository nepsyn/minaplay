import { WebtorrentAdapter } from './webtorrent.adapter.js';
import { DownloaderAdapter } from '../downloader-adapter.interface.js';
import { Type } from '@nestjs/common';
import { Aria2Adapter } from './aria2.adapter.js';

export const DOWNLOADER_ADAPTERS: Record<string, Type<DownloaderAdapter>> = {
  webtorrent: WebtorrentAdapter,
  aria2: Aria2Adapter,
};
