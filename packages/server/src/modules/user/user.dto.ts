import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class UserDto {
  @ApiProperty({
    description: '用户头像文件id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  avatarFileId?: string;

  @ApiProperty({
    description: '是否允许通知',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  notify?: boolean;
}
