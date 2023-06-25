import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { createReadStream, ensureDirSync } from 'fs-extra';
import { diskStorage } from 'multer';
import * as path from 'path';
import { ApiFile } from '../../utils/api.file.decorator';
import { User } from '../user/user.entity';
import { FileService } from './file.service';
import { AuthorizationGuard } from '../authorization/authorization.guard';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { RequestUser } from '../authorization/request.user.decorator';
import { buildException } from '../../utils/build-exception.util';
import { generateMD5 } from '../../utils/generate-md5.util';
import { ErrorCodeEnum } from '../../enums/error-code.enum';
import { PermissionEnum } from '../../enums/permission.enum';
import { FileSourceEnum } from '../../enums/file-source.enum';
import { USER_UPLOAD_IMAGE_DIR, USER_UPLOAD_VIDEO_DIR, VALID_IMAGE_MIME, VALID_VIDEO_MIME } from '../../constants';
import { FileQueryDto } from './file-query.dto';
import { buildQueryOptions } from '../../utils/build-query-options.util';
import { File } from './file.entity';
import { MoreThanOrEqual } from 'typeorm';
import { ApiPaginationResultDto } from '../../utils/api.pagination.result.dto';

@Controller('file')
@UseGuards(AuthorizationGuard)
@ApiTags('file')
@ApiBearerAuth()
export class FileController {
  private readonly logger = new Logger(FileController.name);

  constructor(private fileService: FileService) {}

  @Post('image')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination(req, file, callback) {
          ensureDirSync(USER_UPLOAD_IMAGE_DIR);
          callback(null, USER_UPLOAD_IMAGE_DIR);
        },
        filename(req, file, callback) {
          callback(null, randomUUID().replace(/-/g, '') + path.extname(file.originalname));
        },
      }),
      limits: {
        fileSize: 10485760, // 10MB
      },
      fileFilter(req, file, callback) {
        if (VALID_IMAGE_MIME.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(buildException(BadRequestException, ErrorCodeEnum.INVALID_IMAGE_FILE_TYPE), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    description: '上传图片资源文件',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.FILE_OP, PermissionEnum.FILE_UPLOAD_IMAGE)
  @ApiFile('file', '图片文件')
  async uploadImageFile(@RequestUser() user: User, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      return await this.fileService.save({
        user: { id: user.id },
        filename: file.filename,
        name: file.originalname,
        size: file.size,
        md5: await generateMD5(createReadStream(file.path)),
        mimetype: file.mimetype,
        source: FileSourceEnum.USER_UPLOAD,
        path: file.path,
      });
    } else {
      throw buildException(BadRequestException, ErrorCodeEnum.INVALID_FILE);
    }
  }

  @Post('video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination(req, file, callback) {
          ensureDirSync(USER_UPLOAD_VIDEO_DIR);
          callback(null, USER_UPLOAD_VIDEO_DIR);
        },
        filename(req, file, callback) {
          callback(null, randomUUID().replace(/-/g, '') + path.extname(file.originalname));
        },
      }),
      limits: {
        fileSize: 4294967296, // 10GB
      },
      fileFilter(req, file, callback) {
        if (VALID_VIDEO_MIME.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(buildException(BadRequestException, ErrorCodeEnum.INVALID_VIDEO_FILE_TYPE), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    description: '上传视频资源',
  })
  @ApiFile('file', '视频资源文件')
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.FILE_OP, PermissionEnum.FILE_UPLOAD_VIDEO)
  async uploadMediaFile(@RequestUser() user: User, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      try {
        // 计算视频文件 md5
        const md5 = await generateMD5(createReadStream(file.path));
        // 检查是否已上传过
        return await this.fileService.save({
          user: { id: user.id },
          filename: file.filename,
          name: file.originalname,
          size: file.size,
          md5,
          mimetype: file.mimetype,
          source: FileSourceEnum.USER_UPLOAD,
          path: file.path,
        });
      } catch (error) {
        this.logger.error(error);
        throw buildException(BadRequestException, ErrorCodeEnum.INVALID_FILE);
      }
    } else {
      throw buildException(BadRequestException, ErrorCodeEnum.INVALID_FILE);
    }
  }

  @Get(':id')
  @ApiOperation({
    description: '查看文件',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.FILE_OP)
  async getFileById(@Param('id') id: string) {
    const file = await this.fileService.findOneBy({ id });
    if (!file) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return file;
  }

  @Get()
  @ApiOperation({
    description: '查询文件',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.FILE_OP)
  async queryFile(@Query() query: FileQueryDto) {
    const { keyword, id, md5, expired, userId } = query;
    const [result, total] = await this.fileService.findAndCount({
      where: buildQueryOptions<File>({
        keyword,
        keywordProperties: (entity) => [entity.name, entity.mimetype],
        exact: { id, md5, expireAt: expired ? MoreThanOrEqual(new Date()) : undefined, user: { id: userId } },
      }),
      skip: query.page * query.size,
      take: query.size,
      order: { [query.sort]: query.order },
    });

    return new ApiPaginationResultDto(result, total, query.page, query.size);
  }

  @Delete(':id')
  @ApiOperation({
    description: '删除文件',
  })
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.FILE_OP)
  async deleteFile(@Param('id') id: string) {
    await this.fileService.delete({ id });
    return {};
  }
}
