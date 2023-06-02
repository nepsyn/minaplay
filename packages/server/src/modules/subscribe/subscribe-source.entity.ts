import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { SubscribeRule } from './subscribe-rule.entity';
import { User } from '../user/user.entity';

/** 订阅源 */
@Entity()
export class SubscribeSource {
  /** id */
  @PrimaryGeneratedColumn('increment')
  id: number;

  /** url */
  @Column()
  url: string;

  /** 备注 */
  @Column({
    nullable: true,
  })
  remark?: string;

  /** 标题 */
  @Column({
    nullable: true,
  })
  title?: string;

  /** 更新周期 cron 表达式 */
  @Column({
    default: '0 */30 * * * *',
  })
  cron: string;

  /** 是否启用 */
  @Column({
    default: true,
  })
  enabled: boolean;

  /** 订阅规则 */
  @OneToMany(() => SubscribeRule, (rule) => rule.source)
  rules: SubscribeRule[];

  /** 创建用户 */
  @ManyToOne(() => User, (user) => user.sources, {
    eager: true,
  })
  user: User;

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
