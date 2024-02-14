import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { File } from '../file/file.entity.js';
import { DownloadItem } from '../subscribe/download/download-item.entity.js';
import { MediaMetadata } from '../../interfaces/media.metadata.js';

@Entity()
export class Media {
  /** id */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 标题 */
  @Column()
  name: string;

  /** 简介 */
  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  /** 是否公开 */
  @Column({
    default: true,
  })
  isPublic: boolean;

  /** 下载项目 */
  @Exclude()
  @ManyToOne(() => DownloadItem, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  download?: Relation<DownloadItem>;

  /** 封面图片 */
  @ManyToOne(() => File, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  poster?: Relation<File>;

  /**对应文件 */
  @ManyToOne(() => File, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  file?: Relation<File>;

  /** Duration(s) */
  @Expose()
  get duration() {
    try {
      const metadata: MediaMetadata = JSON.parse(this.metadata);
      const duration: string = metadata.streams?.[0]?.duration ?? metadata.streams?.[0]?.tags?.DURATION;
      if (duration) {
        const groups = duration.match(/^(\d+):(\d+):([\d.]+)$/);
        if (groups) {
          return Number(groups[1]) * 3600 + Number(groups[2]) * 60 + Number(groups[3]);
        } else {
          return Number(duration);
        }
      } else {
        return undefined;
      }
    } catch {
      return undefined;
    }
  }

  /** 元数据 */
  @Exclude()
  @Column({
    nullable: true,
    type: 'text',
  })
  metadata?: string;

  /** 附件 */
  @ManyToMany(() => File, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinTable({
    name: 'media_attachment_files',
  })
  attachments: Relation<File[]>;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updateAt: Date;
}
