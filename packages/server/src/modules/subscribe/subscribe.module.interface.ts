export interface SubscribeModuleOptions {
  rpcHost: string;
  rpcPort: number;
  rpcPath: string;
  rpcSecret?: string;

  trackerAutoUpdate?: boolean;
  trackerUpdateUrl?: string;
  httpProxy?: string;
}
