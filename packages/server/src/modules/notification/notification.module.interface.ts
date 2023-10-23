export interface NotificationModuleOptions {
  smtpHost: string;
  smtpPort: number;
  smtpSecure?: boolean;
  smtpUser: string;
  smtpPassword: string;

  emailOrigin?: string;
  emailSubject?: string;

  appEnv: 'dev' | 'prod';
}
