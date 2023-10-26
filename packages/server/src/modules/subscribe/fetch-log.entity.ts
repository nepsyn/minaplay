import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Source } from './source.entity';
import { Exclude } from 'class-transformer';
import { DownloadItem } from './download-item.entity';
import { StatusEnum } from '../../enums/status.enum';

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
  source: Source;

  /** 下载项目 */
  @Exclude()
  @OneToMany(() => DownloadItem, (download) => download.log)
  downloads: DownloadItem[];

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
