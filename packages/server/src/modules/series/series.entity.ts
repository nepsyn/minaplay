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
import { Exclude } from 'class-transformer';
import { Rule } from '../subscribe/rule.entity';
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
    eager: true,
  })
  user: User;

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

  /** 单集 */
  @OneToMany(() => Episode, (episode) => episode.series)
  episodes: Episode[];

  /** 订阅规则 */
  @OneToMany(() => Rule, (rule) => rule.series)
  rules: Rule[];

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
}
