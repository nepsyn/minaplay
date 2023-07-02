import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Rule } from './rule.entity';
import { SubscribeDownloadItemStatusEnum } from '../../enums/subscribe-download-item-status.enum';
import { Source } from './source.entity';

/** 订阅解析元素 */
@Entity()
export class DownloadItem {
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

  /** 所属订阅源 */
  @ManyToOne(() => Source, (source) => source.downloads, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  source: Source;

  /** 命中规则 */
  @ManyToOne(() => Rule, (rule) => rule.downloads, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  rule: Rule;

  /** 下载状态 */
  @Column({
    type: 'enum',
    enum: SubscribeDownloadItemStatusEnum,
  })
  status: SubscribeDownloadItemStatusEnum;

  /** 错误内容 */
  @Column({
    type: 'text',
    nullable: true,
  })
  error?: string;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;
}
