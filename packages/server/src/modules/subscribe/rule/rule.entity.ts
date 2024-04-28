import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { File } from '../../file/file.entity.js';
import fs from 'fs-extra';
import { Source } from '../source/source.entity.js';
import { DownloadItem } from '../download/download-item.entity.js';

/** 订阅规则 */
@Entity()
export class Rule {
  /** id */
  @PrimaryGeneratedColumn('increment')
  id: number;

  /** Parser Meta */
  @Exclude()
  @Column({
    nullable: true,
  })
  parserMeta?: string;

  /** 备注 */
  @Column({
    nullable: true,
  })
  remark?: string;

  /** 规则代码文件 */
  @Exclude()
  @ManyToOne(() => File, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  file?: Relation<File>;

  /** 下载内容 */
  @Exclude()
  @OneToMany(() => DownloadItem, (download) => download.rule)
  downloads: Relation<Promise<DownloadItem[]>>;

  /** 订阅源 */
  @ManyToMany(() => Source, (source) => source.rules, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinTable()
  sources: Relation<Source[]>;

  @Expose()
  get code() {
    return this.file?.isExist ? fs.readFileSync(this.file.path).toString() : undefined;
  }

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updateAt: Date;
}
