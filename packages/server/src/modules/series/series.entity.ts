import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { SeriesTag } from './series-tag.entity';
import { File } from '../file/file.entity';
import { User } from '../user/user.entity';
import { Episode } from './episode.entity';
import { SeriesSubscribe } from './series-subscribe.entity';

/** 剧集 */
@Entity()
export class Series {
  /** id */
  @PrimaryGeneratedColumn('increment')
  id: number;

  /** 剧集名称 */
  @Column()
  name: string;

  /** 剧集季度 */
  @Column({
    nullable: true,
  })
  season?: string;

  /** 剧集是否已完结 */
  @Column({
    default: false,
    nullable: true,
  })
  finished?: boolean;

  /** 完整剧集单集数量 */
  @Column({
    nullable: true,
  })
  count?: number;

  /** 剧描述称 */
  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  /** 创建用户 */
  @ManyToOne(() => User, (user) => user.series, {
    onDelete: 'SET NULL',
    eager: true,
    nullable: true,
  })
  user?: User;

  /** 纵向海报图 */
  @ManyToOne(() => File, {
    onDelete: 'SET NULL',
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

  /** 订阅 */
  @Exclude()
  @OneToMany(() => SeriesSubscribe, (subscribe) => subscribe.series)
  subscribes: SeriesSubscribe[];

  @Expose()
  get subscribe() {
    return this.subscribes?.[0];
  }

  /** 单集 */
  @OneToMany(() => Episode, (episode) => episode.series)
  episodes: Episode[];

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;

  /** 修改时间 */
  @UpdateDateColumn()
  updateAt: Date;
}
