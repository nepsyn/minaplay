import { NotificationServiceEnum } from '@/api/enums/notification-service.enum';
import { NotificationEventEnum } from '@/api/enums/notification-event.enum';

export interface NotificationMetaEntity {
  /** id */
  id: number;
  /** 通知类型 */
  service: NotificationServiceEnum;
  /** 是否启用 */
  enabled: boolean;
  /** 通知内容 */
  subscribes: NotificationEventEnum[];
  /** 配置信息 */
  config?: string;
  /** 创建时间 */
  createAt: Date;
  /** 修改时间 */
  updateAt: Date;
}

export interface NotificationMetaDto {
  enabled?: boolean;
  subscribes?: NotificationEventEnum[];
}

export interface EmailConfigDto {
  address: string;
}

export interface EmailBindData {
  email: string;
  key: string;
}

export interface EmailVerifyDto {
  key: string;
  code: string;
}
