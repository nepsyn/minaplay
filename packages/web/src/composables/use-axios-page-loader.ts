import { AxiosResponse } from 'axios';
import { ApiQueryDto, ApiQueryResult } from '@/api/interfaces/common.interface';
import { computed, ref } from 'vue';
import { useAxiosRequest } from '@/composables/use-axios-request';

export function useAxiosPageLoader<
  T extends (query?: ApiQueryDto<R>) => Promise<AxiosResponse<ApiQueryResult>>,
  R = Awaited<ReturnType<T>>['data']['items'][number],
>(api: T, init = { page: 0, size: 15 }) {
  const items = ref<R[]>([]);
  const page = ref(init.page);
  const size = ref(init.size);
  const total = ref(0);

  const load = async (query?: Omit<Parameters<T>[0], 'page' | 'size'>) => {
    return await api({
      ...query,
      page: page.value,
      size: size.value,
    });
  };
  const { pending, onResolved, onRejected, request, data, error } = useAxiosRequest(load);
  onResolved((resp) => {
    items.value.push(...resp.items);
    total.value = resp.total;
    page.value++;
  });

  const loaded = computed(() => data.value !== undefined || error.value !== undefined);

  const reset = (soft = false) => {
    page.value = init.page;
    size.value = init.size;
    total.value = 0;
    items.value = [];

    if (!soft) {
      data.value = undefined;
      error.value = undefined;
    }
  };

  const setTotal = (total: number) => {
    if (data.value) {
      data.value.total = total;
    }
  };

  return {
    items,
    page,
    size,
    pending,
    onResolved,
    onRejected,
    request,
    error,
    loaded,
    total,
    reset,
    setTotal,
  };
}
