import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { SubscribeRule } from '../subscribe/subscribe-rule.entity';
import { SeriesTag } from './series-tag.entity';
import { File } from '../file/file.entity';
import { User } from '../user/user.entity';
import { Episode } from './episode.entity';

/** 剧集 */
@Entity()
export class Series {
  /** id */
  @PrimaryGeneratedColumn('increment')
  id: number;

  /** 剧集名称 */
  @Column({
    unique: true,
  })
  name: string;

  /** 创建用户 */
  @ManyToOne(() => User, (user) => user.series, {
    eager: true,
  })
  user: User;

  /** 海报图 */
  @Exclude()
  @ManyToOne(() => File, {
    eager: true,
    nullable: true,
  })
  poster?: File;

  /** 标签 */
  @ManyToMany(() => SeriesTag, (tag) => tag.series, {
    eager: true,
  })
  @JoinTable()
  tags: SeriesTag[];

  /** 单集 */
  @OneToMany(() => Episode, (episode) => episode.series)
  episodes: Episode[];

  /** 剧集描述 */
  @Column({
    nullable: true,
  })
  description: string;

  /** 订阅规则 */
  @OneToMany(() => SubscribeRule, (rule) => rule.series)
  rules: SubscribeRule[];

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 修改时间 */
  @UpdateDateColumn()
  updateAt: Date;

  /** 删除时间 */
  @Exclude()
  @DeleteDateColumn()
  deleteAt: Date;

  /** 海报文件 id */
  @Expose()
  get posterFileId() {
    return this.poster?.id;
  }
}
