import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import fs from 'fs-extra';
import { diskStorage } from 'multer';
import path from 'path';
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
import { Between } from 'typeorm';
import { Response } from 'express';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';
import { ApiFile } from '../../common/api.file.decorator';
import { ApiPaginationResultDto } from '../../common/api.pagination.result.dto';
import { isDefined } from 'class-validator';
import { ApplicationLogger } from '../../common/application.logger.service';

@Controller('file')
@ApiTags('file')
@ApiBearerAuth()
export class FileController {
  private readonly logger = new ApplicationLogger(FileController.name);

  constructor(private fileService: FileService, @Inject(CACHE_MANAGER) private cacheStore: CacheStore) {}

  @Post('image')
  @HttpCode(200)
  @UseGuards(AuthorizationGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination(req, file, callback) {
          fs.ensureDirSync(USER_UPLOAD_IMAGE_DIR);
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
        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
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
      const { id } = await this.fileService.save({
        user: { id: user.id },
        filename: file.filename,
        name: file.originalname,
        size: file.size,
        md5: await generateMD5(fs.createReadStream(file.path)),
        mimetype: file.mimetype,
        source: FileSourceEnum.USER_UPLOAD,
        path: file.path,
      });

      return await this.fileService.findOneBy({ id });
    } else {
      throw buildException(BadRequestException, ErrorCodeEnum.INVALID_FILE);
    }
  }

  @Post('video')
  @HttpCode(200)
  @UseGuards(AuthorizationGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination(req, file, callback) {
          fs.ensureDirSync(USER_UPLOAD_VIDEO_DIR);
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
        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
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
        const md5 = await generateMD5(fs.createReadStream(file.path));
        const { id } = await this.fileService.save({
          user: { id: user.id },
          filename: file.filename,
          name: file.originalname,
          size: file.size,
          md5,
          mimetype: file.mimetype,
          source: FileSourceEnum.USER_UPLOAD,
          path: file.path,
        });

        return await this.fileService.findOneBy({ id });
      } catch (error) {
        this.logger.error(error.stack);
        throw buildException(BadRequestException, ErrorCodeEnum.INVALID_FILE);
      }
    } else {
      throw buildException(BadRequestException, ErrorCodeEnum.INVALID_FILE);
    }
  }

  async getFilePathById(id: string) {
    const key = `file-path:${id}`;
    let path = await this.cacheStore.get<string>(key);
    if (!path) {
      const file = await this.fileService.findOneBy({ id });
      if (!file || !file.isExist) {
        throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
      }
      path = file.path;
      await this.cacheStore.set(key, path, 60 * 60 * 1000);
    }

    return path;
  }

  @Get(':id')
  @ApiOperation({
    description: '查看文件',
  })
  @UseGuards(AuthorizationGuard)
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.FILE_OP)
  async getFileById(@Param('id') id: string) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    const file = await this.fileService.findOneBy({ id });
    if (!file) {
      throw buildException(NotFoundException, ErrorCodeEnum.NOT_FOUND);
    }

    return file;
  }

  @Get([':id/raw', ':id/raw/:name'])
  @ApiOperation({
    description: '原始文件数据',
  })
  async getRawFileById(@Param('id') id: string, @Res() res: Response) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    res.sendFile(await this.getFilePathById(id));
  }

  @Get([':id/download', ':id/download/:name'])
  @ApiOperation({
    description: '下载文件',
  })
  async downloadFileById(@Param('id') id: string, @Res() res: Response, @Param('name') name?: string) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    res.download(await this.getFilePathById(id), name);
  }

  @Get()
  @ApiOperation({
    description: '查询文件',
  })
  @UseGuards(AuthorizationGuard)
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.FILE_OP)
  async queryFile(@Query() query: FileQueryDto) {
    const { keyword, md5, source, userId, start, end } = query;
    const [result, total] = await this.fileService.findAndCount({
      where: buildQueryOptions<File>({
        keyword,
        keywordProperties: (entity) => [entity.name, entity.mimetype],
        exact: {
          md5,
          source,
          user: { id: userId },
          createAt: start && Between(new Date(start), end ? new Date(end) : new Date()),
        },
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
  @UseGuards(AuthorizationGuard)
  @RequirePermissions(PermissionEnum.ROOT_OP, PermissionEnum.FILE_OP)
  async deleteFile(@Param('id') id: string) {
    if (!isDefined(id)) {
      throw buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST);
    }

    await this.fileService.delete({ id });
    return {};
  }
}
