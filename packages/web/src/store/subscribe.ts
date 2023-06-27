import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
import { SubscribeSourceEntity } from '@/api/interfaces/subscribe.interface';
import { ApiQueryDto } from '@/api/interfaces/common.interface';
import { Api } from '@/api/api';
import { useAppStore } from '@/store/app';

export const useSubscribeStore = defineStore('subscribe', () => {
  const app = useAppStore();

  const sources: Ref<SubscribeSourceEntity[]> = ref([]);
  const sourcesLoading = ref(false);
  const fetchSources = async function (query?: ApiQueryDto<SubscribeSourceEntity>) {
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

  return {
    sources,
    sourcesLoading,
    fetchSources,
  };
});
