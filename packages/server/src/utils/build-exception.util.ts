import { HttpException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ErrorCodeEnum } from '../enums/error-code.enum';

type NestJsExceptionConstructor = {
  new (errorObject: object): HttpException | WsException;
};

export function buildException(ctor: NestJsExceptionConstructor, code: ErrorCodeEnum, message?: string) {
  return new ctor({
    code,
    message: message || ErrorCodeEnum[code].replace(/_/g, ' ').toUpperCase(),
  });
}
