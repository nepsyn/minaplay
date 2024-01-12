import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { Source } from './source.entity.js';
import { Exclude } from 'class-transformer';
import { DownloadItem } from './download-item.entity.js';
import { StatusEnum } from '../../enums/status.enum.js';

/** 订阅解析日志 */
@Entity()
export class FetchLog {
  /** id */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 订阅源 */
  @ManyToOne(() => Source, (source) => source.logs, {
    onDelete: 'CASCADE',
  })
  source: Relation<Source>;

  /** 下载项目 */
  @Exclude()
  @OneToMany(() => DownloadItem, (download) => download.log)
  downloads: Relation<DownloadItem[]>;

  /** 状态 */
  @Column({
    type: 'enum',
    enum: StatusEnum,
  })
  status: StatusEnum;

  /** 错误内容 */
  @Column({
    nullable: true,
    type: 'text',
  })
  error?: string;

  /** 创建日期 */
  @CreateDateColumn()
  createAt: Date;
}
