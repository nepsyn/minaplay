import { ref } from 'vue';
import { AxiosError, AxiosResponse } from 'axios';
import { ApiError } from '@/api/interfaces/common.interface';

export function useAxiosRequest<
  T extends (...args: any[]) => Promise<AxiosResponse>,
  R = Awaited<ReturnType<T>>['data'],
>(api: T) {
  const pending = ref(false);
  const error = ref<AxiosError<ApiError> | Error>();
  const data = ref<R>();

  const resolved: ((data: R) => any)[] = [];
  const onResolved = (handler: (data: R) => any) => {
    resolved.push(handler);
  };

  const rejected: ((error: AxiosError<ApiError> | Error) => any)[] = [];
  const onRejected = (handler: (error: AxiosError<ApiError> | Error) => any) => {
    rejected.push(handler);
  };

  const request = async (...args: Parameters<T>) => {
    if (pending.value) {
      return;
    }

    error.value = undefined;
    data.value = undefined;

    pending.value = true;
    try {
      const response = await api(...args);
      data.value = response.data;
      for (const handler of resolved) {
        await handler?.(response.data);
      }
    } catch (e) {
      error.value = e as AxiosError<ApiError> | Error;
      for (const handler of rejected) {
        await handler?.(error.value);
      }
    } finally {
      pending.value = false;
    }
  };

  return {
    pending,
    error,
    data,
    onResolved,
    onRejected,
    request,
  };
}
