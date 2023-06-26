import { UserEntity } from './user.interface';

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthData extends UserEntity {
  token: string;
}
