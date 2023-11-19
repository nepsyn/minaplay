import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { Series } from '../series/series.entity';
import { File } from '../file/file.entity';
import { DownloadItem } from './download-item.entity';
import fs from 'fs-extra';

/** 订阅规则 */
@Entity()
export class Rule {
  /** id */
  @PrimaryGeneratedColumn('increment')
  id: number;

  /** 备注 */
  @Column({
    nullable: true,
  })
  remark?: string;

  /** 验证代码文件 */
  @Exclude()
  @ManyToOne(() => File, {
    eager: true,
  })
  codeFile: File;

  /** 下载内容 */
  @Exclude()
  @OneToMany(() => DownloadItem, (download) => download.rule)
  downloads: DownloadItem[];

  /** 剧集 */
  @ManyToOne(() => Series, (series) => series.rules, {
    onDelete: 'SET NULL',
    eager: true,
    nullable: true,
  })
  series: Series;

  @Expose()
  get code() {
    return this.codeFile.isExist ? fs.readFileSync(this.codeFile.path).toString() : undefined;
  }

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updateAt: Date;
}
