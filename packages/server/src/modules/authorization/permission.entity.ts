import { Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Exclude } from 'class-transformer';
import { PermissionEnum } from '../../enums/permission.enum';

@Entity()
export class Permission {
  /** 名称 */
  @PrimaryColumn({
    type: 'enum',
    enum: PermissionEnum,
  })
  name: PermissionEnum;

  /** 用户 */
  @Exclude()
  @ManyToOne(() => User, (user) => user.permissions, {
    onDelete: 'CASCADE',
  })
  user: User;

  @PrimaryColumn()
  userId: number;
}
