export interface SystemStatus {
  startAt: Date;
  version: string;
  memory: {
    total: number;
    free: number;
    used: number;
  };
  disk: {
    disk: string;
    total: number;
    free: number;
    used: number;
  };
}
