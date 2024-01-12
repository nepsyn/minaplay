import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ErrorCodeEnum } from '../enums/error-code.enum.js';
import { ApplicationLogger } from './application.logger.service.js';

@Catch(Error)
export class ApplicationExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new ApplicationLogger(ApplicationExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost): any {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus());

      const data = exception.getResponse();
      if (typeof data === 'object' && 'code' in data) {
        response.json(exception.getResponse());
      } else {
        response.json({
          code: ErrorCodeEnum.UNKNOWN_ERROR,
          message: exception.message,
        });
      }
    } else if (exception instanceof QueryFailedError) {
      response.status(400).json({
        code: ErrorCodeEnum.QUERY_FAILED,
        message: 'QUERY FAILED',
      });
      this.logger.error(exception.stack);
    } else {
      response.status(500).json({
        code: ErrorCodeEnum.INTERNAL_SERVER_ERROR,
        message: 'INTERNAL SERVER ERROR',
      });
      this.logger.error(exception.stack);
    }
  }
}
