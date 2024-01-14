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
import { Exclude } from 'class-transformer';
import { File } from '../file/file.entity.js';
import { DownloadItem } from '../subscribe/download/download-item.entity.js';

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
