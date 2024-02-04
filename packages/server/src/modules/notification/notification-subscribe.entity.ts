import { CreateDateColumn, Entity, ManyToOne, PrimaryColumn, Relation, UpdateDateColumn } from 'typeorm';
import { NotificationMeta } from './notification-meta.entity.js';
import { NotificationEventEnum } from '../../enums/notification-event.enum.js';

/** 通知内容配置 */
@Entity()
export class NotificationSubscribe {
  /** 通知类型 */
  @PrimaryColumn({
    type: 'enum',
    enum: NotificationEventEnum,
  })
  name: NotificationEventEnum;

  @PrimaryColumn()
  metaId: number;

  /** 通知服务配置 */
  @ManyToOne(() => NotificationMeta, {
    onDelete: 'CASCADE',
  })
  meta: Promise<Relation<NotificationMeta>>;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 修改时间 */
  @UpdateDateColumn()
  updateAt: Date;
}
