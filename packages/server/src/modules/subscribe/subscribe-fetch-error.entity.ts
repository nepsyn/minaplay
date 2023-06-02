import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SubscribeSource } from './subscribe-source.entity';

/** 订阅解析日志 */
@Entity()
export class SubscribeFetchError {
  /** id */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 订阅源 */
  @ManyToOne(() => SubscribeSource, {
    eager: true,
  })
  source: SubscribeSource;

  /** 错误内容 */
  @Column()
  error: string;

  /** 创建日期 */
  @CreateDateColumn()
  createAt: Date;
}
