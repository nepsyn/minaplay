import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { StatusEnum } from '../../../enums/status.enum.js';
import { Rule } from '../rule/rule.entity.js';
import { ParseLog } from '../parse-log/parse-log.entity.js';
import { Source } from '../source/source.entity.js';
import { Media } from '../../media/media.entity.js';
import { Exclude, Expose } from 'class-transformer';
import { DownloadItemState } from './download-item-state.interface.js';

@Entity()
export class DownloadItem {
  /** id */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 项目标题 */
  @Column({
    nullable: true,
  })
  name?: string;

  /** 下载链接 */
  @Column({
    type: 'text',
  })
  url: string;

  /** 下载链接哈希 */
  @Index({
    unique: true,
  })
  @Column()
  hash: string;

  /** 下载状态 */
  @Column()
  status?: StatusEnum;

  /** 错误内容 */
  @Column({
    type: 'text',
    nullable: true,
  })
  error?: string;

  /** 命中规则 */
  @ManyToOne(() => Rule, (rule) => rule.downloads, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  rule?: Relation<Rule>;

  /** 所属订阅源 */
  @ManyToOne(() => Source, (source) => source.downloads, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  source?: Relation<Source>;

  /** 解析记录 */
  @ManyToOne(() => ParseLog, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  log?: Relation<ParseLog>;

  /** 对应文件列表 */
  @OneToMany(() => Media, (media) => media.download)
  medias: Relation<Promise<Media[]>>;

  /** 订阅项目 */
  @Column({
    type: 'text',
    nullable: true,
  })
  @Exclude()
  entry?: string;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 下载状态 */
  @Expose()
  state: DownloadItemState;
}
