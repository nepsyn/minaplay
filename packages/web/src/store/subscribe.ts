import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
import { SourceEntity } from '@/api/interfaces/subscribe.interface';
import { ApiQueryDto } from '@/api/interfaces/common.interface';
import { Api } from '@/api/api';
import { useAppStore } from '@/store/app';

export const useSubscribeStore = defineStore('subscribe', () => {
  const app = useAppStore();

  const sources: Ref<SourceEntity[]> = ref([]);
  const sourcesLoading = ref(false);
  const fetchSources = async function (query?: ApiQueryDto<SourceEntity>) {
    try {
      sourcesLoading.value = true;
      const response = await Api.SubscribeSource.query(query);
      sources.value = response.data.items;
    } catch (e) {
      app.toast('获取订阅源数据失败！', 'error');
    } finally {
      sourcesLoading.value = false;
    }
  };

  const updateSource = function (source: SourceEntity) {
    const index = sources.value.findIndex((value) => value.id === source.id);
    if (index !== -1) {
      sources.value[index] = source;
    } else {
      sources.value.push(source);
    }
  };

  const deleteSource = function (id: number) {
    sources.value = sources.value.filter((value) => value.id !== id);
  };

  return {
    sources,
    sourcesLoading,
    fetchSources,
    updateSource,
    deleteSource,
  };
});
