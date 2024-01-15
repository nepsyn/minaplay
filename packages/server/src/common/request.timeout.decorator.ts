import { SetMetadata } from '@nestjs/common';

export const REQUEST_TIMEOUT_KEY = 'REQUEST_TIMEOUT';

/**
 * 接口超时时间
 * @param timeout 超时时间（ms）
 */
export const RequestTimeout = (timeout: number) => SetMetadata(REQUEST_TIMEOUT_KEY, timeout);
