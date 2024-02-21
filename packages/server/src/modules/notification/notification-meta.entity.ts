import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity.js';
import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { NotificationEventEnum, NotificationServiceEnum } from '../../enums/index.js';
import { Type } from '@nestjs/common';
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
  @Column()
  service: NotificationServiceEnum;

  /** 通知内容 */
  @Exclude()
  @Column({
    nullable: true,
    type: 'text',
  })
  events?: string;

  @Expose()
  get subscribes(): NotificationEventEnum[] {
    const events = Object.values(NotificationEventEnum);
    return (this.events ?? '')
      .split(',')
      .filter((value: NotificationEventEnum) => events.includes(value)) as NotificationEventEnum[];
  }

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

  getConfig<T>(type: Type<T>): T | undefined {
    try {
      const config = JSON.parse(this.config);
      return plainToInstance(type, isObject(config) ? config : {});
    } catch {
      return undefined;
    }
  }

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 修改时间 */
  @UpdateDateColumn()
  updateAt: Date;
}
