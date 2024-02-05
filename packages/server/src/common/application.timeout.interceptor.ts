import { CallHandler, ExecutionContext, Injectable, NestInterceptor, RequestTimeoutException } from '@nestjs/common';
import { catchError, Observable, throwError, timeout, TimeoutError } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { REQUEST_TIMEOUT_KEY } from './request.timeout.decorator.js';
import { buildException } from '../utils/build-exception.util.js';
import { ErrorCodeEnum } from '../enums/error-code.enum.js';

@Injectable()
export class ApplicationTimeoutInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const ms =
      this.reflector.getAllAndOverride<number>(REQUEST_TIMEOUT_KEY, [context.getHandler(), context.getClass()]) ?? 5000;

    if (ms > 0) {
      return next.handle().pipe(
        timeout(ms),
        catchError((error) => {
          if (error instanceof TimeoutError) {
            return throwError(() => buildException(RequestTimeoutException, ErrorCodeEnum.TIMEOUT));
          }
          return throwError(() => error);
        }),
      );
    } else {
      return next.handle();
    }
  }
}
