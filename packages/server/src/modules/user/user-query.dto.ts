import { User } from './user.entity.js';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiQueryDto } from '../../common/api.query.dto.js';

export class UserQueryDto extends ApiQueryDto<User> {
  @ApiProperty({
    description: '查询关键字',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: '用户id',
    required: false,
  })
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({
    description: '用户名',
    required: false,
  })
  @IsOptional()
  @IsString()
  username?: string;
}
