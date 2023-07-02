import { defineStore } from 'pinia';
import { SourceEntity } from '@/api/interfaces/subscribe.interface';
import { createItemsLoaderState } from '@/utils';
import { Api } from '@/api/api';
import { computed } from 'vue';

export const useSourceStore = defineStore('source', () => {
  const state = createItemsLoaderState<SourceEntity>({
    loadFn: Api.SubscribeSource.query,
    size: 1024,
  });
  const items = computed(() => state.items);

  const update = (source: SourceEntity) => {
    const index = state.items.findIndex((v) => v.id === source.id);
    if (index > -1) {
      state.items[index] = Object.assign({}, source);
    } else {
      state.items.push(Object.assign({}, source));
    }
  };

  const _delete = (id: number) => {
    state.items = state.items.filter((v) => v.id !== id);
  };

  return {
    state,
    items,
    update,
    delete: _delete,
  };
});
