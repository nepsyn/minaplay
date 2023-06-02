import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SubscribeRule } from './subscribe-rule.entity';
import { SubscribeDownloadItemStatusEnum } from '../../enums/subscribe-download-item-status.enum';

/** 订阅解析元素 */
@Entity()
export class SubscribeDownloadItem {
  /** id */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 项目标题 */
  @Column({
    unique: true,
  })
  title: string;

  /** 下载链接 */
  @Column()
  url: string;

  /** 命中规则 */
  @ManyToOne(() => SubscribeRule, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  rule: SubscribeRule;

  /** 下载状态 */
  @Column({
    type: 'enum',
    enum: SubscribeDownloadItemStatusEnum,
  })
  status: SubscribeDownloadItemStatusEnum;

  /** 错误内容 */
  @Column({
    nullable: true,
  })
  error?: string;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;
}
