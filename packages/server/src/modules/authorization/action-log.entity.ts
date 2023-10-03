import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { AuthActionEnum } from '../../enums/auth-action.enum';

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
  @Column({
    type: 'enum',
    enum: AuthActionEnum,
  })
  action: AuthActionEnum;

  /** 操作人 */
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    eager: true,
  })
  operator: User;

  /** 目标用户 */
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    eager: true,
  })
  target: User;

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
