import { ApiQueryDto } from '../../utils/api.query.dto';
import { File } from './file.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class FileQueryDto extends ApiQueryDto<File> {
  @ApiProperty({
    description: '查询关键字',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: '文件md5',
    required: false,
  })
  @IsOptional()
  @IsString()
  md5?: string;

  @ApiProperty({
    description: '文件是否过期',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  expired?: boolean;

  @ApiProperty({
    description: '上传用户id',
    required: false,
  })
  @IsOptional()
  @IsInt()
  userId?: number;
}
