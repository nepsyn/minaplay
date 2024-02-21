import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { User } from '../user/user.entity.js';
import { AuthActionEnum } from '../../enums/index.js';

/** 操作日志 */
@Entity()
export class ActionLog {
  /** id */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 操作者ip */
  @Column()
  ip?: string;

  /** 操作类型 */
  @Column()
  action: AuthActionEnum;

  /** 操作人 */
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    eager: true,
  })
  operator: Relation<User>;

  /** 目标用户 */
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    eager: true,
  })
  target: Relation<User>;

  /** 额外参数 */
  @Column({
    type: 'text',
    nullable: true,
  })
  extra?: string;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;
}
