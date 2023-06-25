import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UserDto {
  @ApiProperty({
    description: '用户头像文件id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  avatarFileId?: string;
}
