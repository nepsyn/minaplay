import { UserEntity } from './user.interface';

export interface AuthData extends UserEntity {
  token: string;
}
