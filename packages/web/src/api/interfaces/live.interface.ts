import { UserEntity } from '@/api/interfaces/user.interface';
import { FileEntity } from '@/api/interfaces/file.interface';
import { ApiQueryDto } from '@/api/interfaces/common.interface';

export interface LiveEntity {
  id: string;
  title?: string;
  hasPassword: boolean;
  poster?: FileEntity;
  user?: UserEntity;
  createAt: Date;
  updateAt: Date;
}

export interface LiveDto {
  title?: string;
  password?: string;
  posterFileId?: string;
}

export interface LiveQueryDto extends ApiQueryDto<LiveEntity> {
  keyword?: string;
  userId?: number;
}
