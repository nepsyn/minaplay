import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity.js';
import { Exclude, plainToInstance } from 'class-transformer';
import { NotificationServiceEnum } from '../../enums/notification-service.enum.js';
import { Type } from '@nestjs/common';
import { NotificationSubscribe } from './notification-subscribe.entity.js';
import { isObject } from 'class-validator';

/** 通知服务配置 */
@Entity()
export class NotificationMeta {
  /** id */
  @PrimaryGeneratedColumn('increment')
  id: number;

  /** 用户 */
  @ManyToOne(() => User, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @Exclude()
  user: Relation<User>;

  /** 通知类型 */
  @Column({
    type: 'enum',
    enum: NotificationServiceEnum,
  })
  service: NotificationServiceEnum;

  /** 通知内容 */
  @OneToMany(() => NotificationSubscribe, (content) => content.meta, {
    eager: true,
  })
  subscribes: Relation<NotificationSubscribe[]>;

  /** 是否启用 */
  @Column({
    default: false,
  })
  enabled: boolean;

  /** 配置信息 */
  @Column({
    type: 'text',
    nullable: true,
  })
  config?: string;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 修改时间 */
  @UpdateDateColumn()
  updateAt: Date;

  getConfig<T>(type: Type<T>): T | undefined {
    try {
      const config = JSON.parse(this.config);
      return plainToInstance(type, isObject(config) ? config : {});
    } catch {
      return undefined;
    }
  }
}
