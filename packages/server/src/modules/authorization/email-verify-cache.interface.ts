export interface EmailVerifyCache {
  userId: number;
  email: string;
  code: string;
  lastSendTimestamp: number;
  secureTimes: number;
}
