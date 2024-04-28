import { ref } from 'vue';

export function useAsyncTask<T extends (...args: any[]) => Promise<any>, R = Awaited<ReturnType<T>>>(task: T) {
  const pending = ref(false);
  const error = ref<any>();
  const data = ref<R>();

  const resolved: ((data: R) => any)[] = [];
  const onResolved = (handler: (data: R) => any) => {
    resolved.push(handler);
  };

  const rejected: ((error: any) => any)[] = [];
  const onRejected = (handler: (error: any) => any) => {
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
      const response = await task(...args);
      data.value = response;
      for (const handler of resolved) {
        await handler?.(response);
      }
    } catch (e) {
      error.value = e;
      for (const handler of rejected) {
        await handler?.(e);
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
