export interface SubscribeModuleOptions {
  downloader?: 'aria2' | 'webtorrent';
  trackerAutoUpdate?: boolean;
  trackerUpdateUrl?: string;
  httpProxy?: string;

  aria2RpcHost?: string;
  aria2RpcPort?: number;
  aria2RpcPath?: string;
  aria2RpcSecret?: string;
}
