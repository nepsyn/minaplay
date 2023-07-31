import { ApiQueryDto } from '../../utils/api.query.dto';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

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
