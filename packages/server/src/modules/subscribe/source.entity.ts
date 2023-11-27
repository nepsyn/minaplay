import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from '../user/user.entity';
import { FetchLog } from './fetch-log.entity';
import { DownloadItem } from './download-item.entity';
import { Rule } from './rule.entity';

/** 订阅源 */
@Entity()
export class Source {
  /** id */
  @PrimaryGeneratedColumn('increment')
  id: number;

  /** url */
  @Column({
    type: 'text',
  })
  url: string;

  /** 备注 */
  @Column({
    nullable: true,
  })
  remark?: string;

  /** 标题 */
  @Column({
    nullable: true,
  })
  title?: string;

  /** 更新周期 cron 表达式 */
  @Column({
    default: '0 */30 * * * *',
  })
  cron: string;

  /** 是否启用 */
  @Column({
    default: true,
  })
  enabled: boolean;

  /** 规则 */
  @ManyToMany(() => Rule, (rule) => rule.sources, {
    onDelete: 'CASCADE',
  })
  rules: Promise<Rule[]>;

  /** 更新记录 */
  @Exclude()
  @OneToMany(() => FetchLog, (log) => log.source)
  logs: Promise<FetchLog[]>;

  /** 下载内容 */
  @Exclude()
  @OneToMany(() => DownloadItem, (download) => download.source)
  downloads: Promise<DownloadItem[]>;

  /** 创建用户 */
  @ManyToOne(() => User, (user) => user.sources, {
    onDelete: 'SET NULL',
    eager: true,
    nullable: true,
  })
  user?: User;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updateAt: Date;
}
