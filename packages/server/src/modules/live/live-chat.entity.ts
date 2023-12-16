import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { Live } from './live.entity';
import { User } from '../user/user.entity';
import { MinaplayMessage, MinaplayMessageType, parseMessage } from '../../utils/message-type';

@Entity()
export class LiveChat {
  /** id */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 直播 */
  @ManyToOne(() => Live, {
    onDelete: 'CASCADE',
    eager: true,
  })
  live: Live;

  /** 发送用户 */
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    eager: true,
  })
  user: User;

  /** 消息类型 */
  @Exclude()
  @Column()
  type: MinaplayMessageType;

  /** 消息内容 */
  @Exclude()
  @Column()
  content: string;

  /** 消息实体 */
  @Expose()
  get message(): MinaplayMessage {
    return parseMessage(JSON.parse(this.content));
  }

  /** 创建时间 */
  @CreateDateColumn()
  createAt: Date;
}
