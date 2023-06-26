<script lang="ts" setup>
import { onMounted, Ref, ref } from 'vue';
import { SubscribeSourceEntity } from '@/api/interfaces/subscribe.interface';
import { ApiQueryDto } from '@/api/interfaces/common.interface';
import { Api } from '@/api/api';
import { useAppStore } from '@/store/app';

const app = useAppStore();

const sources: Ref<SubscribeSourceEntity[]> = ref([]);
const fetchSources = async function (query?: ApiQueryDto<SubscribeSourceEntity>) {
  try {
    const response = await Api.Subscribe.querySource(query);
    sources.value.push(...response.data);
  } catch (e) {
    app.toast('获取订阅源数据失败！', 'error');
  }
};

onMounted(async () => {
  await fetchSources();
});
</script>

<template>
  <div>{{ sources.length }}</div>
</template>

<style scoped></style>
