import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Rule } from './rule.entity';

@Entity()
export class RuleErrorLog {
  /** id */
  @PrimaryGeneratedColumn('increment')
  id: number;

  /** 原始Entry */
  @Column({
    type: 'text',
    nullable: true,
  })
  entry?: string;

  /** 错误内容 */
  @Column({
    type: 'text',
  })
  error: string;

  @ManyToOne(() => Rule, {
    onDelete: 'CASCADE',
  })
  rule: Rule;

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;
}
