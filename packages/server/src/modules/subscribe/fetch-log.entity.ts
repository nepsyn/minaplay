import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Source } from './source.entity';

/** 订阅解析日志 */
@Entity()
export class FetchLog {
  /** id */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 订阅源 */
  @ManyToOne(() => Source, {
    eager: true,
  })
  source: Source;

  /** 是否成功 */
  @Column()
  success: boolean;

  /** 原始数据 */
  @Column({
    nullable: true,
    type: 'text',
  })
  data?: string;

  /** 错误内容 */
  @Column({
    nullable: true,
    type: 'text',
  })
  error?: string;

  /** 创建日期 */
  @CreateDateColumn()
  createAt: Date;
}
