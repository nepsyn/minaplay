import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { SubscribeSource } from './subscribe-source.entity';
import { Series } from '../series/series.entity';
import { File } from '../file/file.entity';

/** 订阅规则 */
@Entity()
export class SubscribeRule {
  /** id */
  @PrimaryGeneratedColumn('increment')
  id: number;

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

  /** 订阅源 */
  @ManyToOne(() => SubscribeSource, (source) => source.rules, {
    eager: true,
  })
  source: SubscribeSource;

  /** 剧集 */
  @ManyToOne(() => Series, (series) => series.rules, {
    eager: true,
    nullable: true,
  })
  series: Series;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updateAt: Date;

  /** 删除时间 */
  @Exclude()
  @DeleteDateColumn()
  deleteAt: Date;
}
