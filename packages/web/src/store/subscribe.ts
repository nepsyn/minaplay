import { defineStore } from 'pinia';
import { SourceEntity } from '@/interfaces/subscribe.interface';
import { Ref, ref } from 'vue';

export const useSubscribeStore = defineStore('subscribe', () => {
  const sources: Ref<SourceEntity[]> = ref([]);
  const updateSource = (source: SourceEntity, unshift = true) => {
    const index = sources.value.findIndex((v) => v.id === source.id);
    const item = Object.assign({}, source);
    if (index > -1) {
      sources.value[index] = item;
    } else {
      if (unshift) {
        sources.value.unshift(item);
      } else {
        sources.value.push(item);
      }
    }
  };
  const deleteSource = (id: number) => {
    sources.value = sources.value.filter((v) => v.id !== id);
  };
  const clearSource = () => {
    sources.value = [];
  };

  return {
    sources,
    updateSource,
    deleteSource,
    clearSource,
  };
});
