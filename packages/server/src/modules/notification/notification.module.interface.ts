export interface NotificationModuleOptions {
  // ws
  wsEnabled: boolean;

  // email
  emailEnabled: boolean;
  emailSmtpHost?: string;
  emailSmtpPort?: number;
  emailSmtpSecure?: boolean;
  emailSmtpUser?: string;
  emailSmtpPassword?: string;
  emailOrigin?: string;
  emailSubject?: string;

  // server-chan
  serverChanEnabled: boolean;

  // telegram
  telegramEnabled: boolean;

  appEnv: 'dev' | 'prod';
  httpProxy?: string;
}
