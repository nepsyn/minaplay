import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileController } from './file.controller.js';
import { File } from './file.entity.js';
import { FileService } from './file.service.js';

@Module({
  controllers: [FileController],
  providers: [FileService],
  imports: [TypeOrmModule.forFeature([File])],
  exports: [FileService],
})
export class FileModule {}
