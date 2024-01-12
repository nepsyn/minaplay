import { File } from './file.entity.js';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';
import { FileSourceEnum } from '../../enums/file-source.enum.js';
import { Transform } from 'class-transformer';
import { ApiQueryDto } from '../../common/api.query.dto.js';

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
    description: '文件来源',
    required: false,
  })
  @IsOptional()
  @IsString()
  source?: FileSourceEnum;

  @ApiProperty({
    description: '上传用户id',
    required: false,
  })
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsInt()
  userId?: number;

  @ApiProperty({
    description: '开始时间',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  start?: string;

  @ApiProperty({
    description: '结束时间',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  end?: string;
}
