<script setup lang="ts">
import { useApp } from '@/store/app';
import { useRoute } from 'vue-router';
import { computed, Ref, ref, watch } from 'vue';
import { ApiQueryDto } from '@/interfaces/common.interface';
import { DownloadItemEntity } from '@/interfaces/subscribe.interface';
import { Api } from '@/api/api';
import { mdiAlertCircle, mdiCheckCircle, mdiContentCopy, mdiDownloadCircle, mdiRefresh } from '@mdi/js';
import ItemsProvider from '@/components/provider/ItemsProvider.vue';
import ActionBtn from '@/components/provider/ActionBtn.vue';

const app = useApp();
const route = useRoute();

const sourceId = computed(() => Number(route.params.id));

const downloadsQuery: ApiQueryDto<DownloadItemEntity> = {
  page: 0,
  size: 5,
  sort: 'createAt',
  order: 'DESC',
};
const downloadsTotal = ref(0);
const downloads: Ref<DownloadItemEntity[]> = ref([]);
const loadDownloads = async (done: any) => {
  try {
    const response = await Api.SubscribeSource.getDownloadItemsById(sourceId.value)(downloadsQuery);
    downloads.value.push(...response.data.items);
    downloadsTotal.value = response.data.total;
    downloadsQuery.page!++;
    done(downloads.value.length === response.data.total ? 'empty' : 'ok');
  } catch {
    app.toastError('获取下载任务列表失败');
    done('error');
  }
};
const resetDownloads = () => {
  downloads.value = [];
  downloadsQuery.page = 0;
};

const getDownloadItemColor = (item: DownloadItemEntity) => {
  return item.status === 'DOWNLOADED' ? 'success' : item.status === 'DOWNLOADING' ? 'secondary-lighten-1' : 'error';
};
const getDownloadItemIcon = (item: DownloadItemEntity) => {
  return item.status === 'DOWNLOADED'
    ? mdiCheckCircle
    : item.status === 'DOWNLOADING'
    ? mdiDownloadCircle
    : mdiAlertCircle;
};
const getDownloadItemStatusText = (item: DownloadItemEntity) => {
  return item.status === 'DOWNLOADED' ? '下载完成' : item.status === 'DOWNLOADING' ? '正在下载' : '下载失败';
};

const copyDownloadUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url);
    app.toastSuccess('下载链接已复制到剪切板');
  } catch {
    app.toastError('复制下载链接失败');
  }
};

const providerRef: Ref<any> = ref(null);
watch(
  () => route.params,
  async (now, old) => {
    if (old?.id !== now.id && !isNaN(Number(now.id))) {
      resetDownloads();

      if (providerRef.value) {
        providerRef.value.load();
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <v-container>
    <v-container fluid>
      <v-container class="pa-0 d-flex flex-row align-center">
        <span class="text-h6">下载项目 ({{ downloadsTotal }})</span>
        <v-spacer></v-spacer>
        <action-btn
          text="重新加载"
          color="primary"
          :loading="providerRef?.status === 'loading'"
          :icon="mdiRefresh"
          @click="resetDownloads() & providerRef?.load()"
        ></action-btn>
      </v-container>
      <v-divider class="my-4"></v-divider>
      <items-provider ref="providerRef" class="pa-0" :load-fn="loadDownloads" :items="downloads" auto-load>
        <v-alert
          v-for="item in downloads"
          :key="item.id"
          class="my-4"
          variant="tonal"
          :color="getDownloadItemColor(item)"
          :icon="getDownloadItemIcon(item)"
        >
          <p class="text-subtitle-1 font-weight-bold" v-text="item.title"></p>
          <div v-if="item.url" class="d-flex flex-row justify-space-between align-center">
            <span class="text-caption text-truncate" v-text="item.url"></span>
            <v-btn :icon="mdiContentCopy" variant="text" size="x-small" @click="copyDownloadUrl(item.url)"></v-btn>
          </div>
          <p class="text-caption">
            任务创建于 {{ new Date(item.createAt).toLocaleString() }} -
            {{ getDownloadItemStatusText(item) }}
          </p>
          <pre v-if="item.status === 'FAILED'" class="text-body-2 mt-2 overflow-x-auto" v-text="item.error"></pre>
        </v-alert>
      </items-provider>
    </v-container>
  </v-container>
</template>

<style scoped lang="sass"></style>
