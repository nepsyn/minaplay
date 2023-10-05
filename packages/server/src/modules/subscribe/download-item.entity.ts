import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Rule } from './rule.entity';
import { StatusEnum } from '../../enums/status.enum';
import { Source } from './source.entity';
import { FetchLog } from './fetch-log.entity';
import { Media } from '../media/media.entity';
import { Exclude } from 'class-transformer';

/** 订阅解析元素 */
@Entity()
export class DownloadItem {
  /** id */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 项目标题 */
  @Column({
    nullable: true,
  })
  title?: string;

  /** 下载链接 */
  @Column({
    type: 'text',
  })
  url: string;

  /** Aria2 GID */
  @Column({
    nullable: true,
  })
  gid: string;

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

  /** 解析记录 */
  @ManyToOne(() => FetchLog, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  log?: FetchLog;

  /** 对应文件列表 */
  @OneToMany(() => Media, (media) => media.download)
  medias: Media[];

  /** 下载状态 */
  @Column({
    type: 'enum',
    enum: StatusEnum,
  })
  status: StatusEnum;

  /** 错误内容 */
  @Column({
    type: 'text',
    nullable: true,
  })
  error?: string;

  /** entry数据 */
  @Exclude()
  @Column({
    type: 'text',
    nullable: true,
  })
  entry?: string;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;
}
