import { io, ManagerOptions, SocketOptions } from 'socket.io-client';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import { useApiStore } from '@/store/api';

export class TimeoutError extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export function useSocketIOConnection<EventMap extends Record<string, (...args: any[]) => any> = {}>(
  url: string,
  options: Partial<ManagerOptions & SocketOptions> = {},
) {
  const api = useApiStore();

  let socket = io(url, options);

  let _sync = 0;
  const getSyncId = () => {
    _sync = (_sync + 1) % 256;
    return _sync;
  };

  const request = <Ev extends keyof EventMap>(
    ev: Ev,
    args?: Parameters<EventMap[Ev]>[0],
  ): Promise<ReturnType<EventMap[Ev]>> => {
    return new Promise((resolve, reject) => {
      const sync = getSyncId();

      const unregister = () => {
        clearTimeout(timeout);
        socket.off('response', responseHandler);
        socket.off('exception', exceptionHandler);
      };

      const timeout = setTimeout(() => {
        unregister();
        reject(new TimeoutError());
      }, 5000);

      const responseHandler = (resp: { sync: number; data: ReturnType<EventMap[Ev]> }) => {
        if (resp.sync === sync) {
          unregister();
          resolve(resp.data);
        }
      };
      socket.on('response', responseHandler);

      const exceptionHandler = (error: { sync: number; code: ErrorCodeEnum; message?: string }) => {
        if (error.sync === sync) {
          if (error?.code === ErrorCodeEnum.INVALID_TOKEN) {
            socket.removeAllListeners();
            socket.disconnect();
            socket = io(url, {
              ...options,
              extraHeaders: {
                ...options.extraHeaders,
                Authorization: api.getToken() as string,
              },
            });
          }
          socket.connect();

          unregister();
          reject(error);
        }
      };
      socket.on('exception', exceptionHandler);

      socket.emit(ev as string, {
        ...args,
        sync,
      });
    });
  };

  return {
    socket,
    request,
  };
}
