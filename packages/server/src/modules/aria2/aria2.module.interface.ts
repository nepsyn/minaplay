export interface Aria2ModuleOptions {
  rpcHost: string;
  rpcPort: number;
  rpcPath: string;
  rpcSecret?: string;
  autoUpdateTracker?: boolean;
  trackerListUrl?: string;
  httpProxy?: string;
}
