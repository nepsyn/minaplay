import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Rule } from './rule.entity';

@Entity()
export class RuleErrorLog {
  /** id */
  @PrimaryGeneratedColumn('increment')
  id: number;

  /** 错误内容 */
  @Column({
    nullable: true,
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
