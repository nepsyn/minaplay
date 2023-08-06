<script setup lang="ts">
import { useApp } from '@/store/app';
import { useRoute } from 'vue-router';
import { computed, Ref, ref, watch } from 'vue';
import { ApiQueryDto } from '@/interfaces/common.interface';
import { DownloadItemEntity } from '@/interfaces/subscribe.interface';
import { Api } from '@/api/api';
import { mdiAlertCircle, mdiCheckCircle, mdiContentCopy, mdiDelete, mdiDownloadCircle, mdiRefresh } from '@mdi/js';
import ItemsProvider from '@/components/provider/ItemsProvider.vue';
import ActionBtn from '@/components/provider/ActionBtn.vue';
import { SubscribeDownloadItemStatusEnum } from '@/api/enums/subscribe-download-item-status.enum';

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

const getDownloadItemColor = (status: SubscribeDownloadItemStatusEnum) => {
  switch (status) {
    case SubscribeDownloadItemStatusEnum.DOWNLOADED:
      return 'success';
    case SubscribeDownloadItemStatusEnum.DOWNLOADING:
      return 'secondary-lighten-1';
    case SubscribeDownloadItemStatusEnum.FAILED:
      return 'error';
  }
};
const getDownloadItemIcon = (status: SubscribeDownloadItemStatusEnum) => {
  switch (status) {
    case SubscribeDownloadItemStatusEnum.DOWNLOADED:
      return mdiCheckCircle;
    case SubscribeDownloadItemStatusEnum.DOWNLOADING:
      return mdiDownloadCircle;
    case SubscribeDownloadItemStatusEnum.FAILED:
      return mdiAlertCircle;
  }
};
const getDownloadItemStatusText = (status: SubscribeDownloadItemStatusEnum) => {
  switch (status) {
    case SubscribeDownloadItemStatusEnum.DOWNLOADED:
      return '下载完成';
    case SubscribeDownloadItemStatusEnum.DOWNLOADING:
      return '正在下载';
    case SubscribeDownloadItemStatusEnum.FAILED:
      return '下载失败';
  }
};

const downloadsClearing = ref(false);
const clearDownloads = async () => {
  downloadsClearing.value = true;
  try {
    await Api.SubscribeSource.clearDownloadItemsById(sourceId.value)();
    downloadsTotal.value = 0;
    downloads.value = [];
    if (providerRef.value) {
      providerRef.value.status = 'empty';
    }
  } catch {
    app.toastError('删除已结束项目失败');
  } finally {
    downloadsClearing.value = false;
  }
};

const copyDownloadUrl = async (url: string) => app.copyContent(url, '下载链接已复制到剪切板', '复制下载链接失败');

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
        <v-menu location="bottom">
          <template #activator="{ props }">
            <action-btn
              text="删除已结束项目"
              color="error"
              :disabled="providerRef?.status === 'loading'"
              :loading="downloadsClearing"
              :icon="mdiDelete"
              v-bind="props"
            ></action-btn>
          </template>
          <v-card>
            <v-card-title>删除确认</v-card-title>
            <v-card-text>确定要删除已结束的下载项目吗？该操作可能导致订阅源中资源的重复下载。</v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn variant="text" color="primary">取消</v-btn>
              <v-btn variant="plain" color="error" @click="clearDownloads">确认</v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
        <action-btn
          class="ms-1"
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
          :color="getDownloadItemColor(item.status)"
          :icon="getDownloadItemIcon(item.status)"
        >
          <p class="text-subtitle-1 font-weight-bold" v-text="item.title"></p>
          <div v-if="item.url" class="d-flex flex-row justify-space-between align-center">
            <span class="text-caption text-truncate" v-text="item.url"></span>
            <v-btn :icon="mdiContentCopy" variant="text" size="x-small" @click="copyDownloadUrl(item.url)"></v-btn>
          </div>
          <p class="text-caption">
            任务创建于 {{ new Date(item.createAt).toLocaleString() }} -
            {{ getDownloadItemStatusText(item.status) }}
          </p>
          <pre v-if="item.status === 'FAILED'" class="text-body-2 mt-2 overflow-x-auto" v-text="item.error"></pre>
        </v-alert>
      </items-provider>
    </v-container>
  </v-container>
</template>

<style scoped lang="sass"></style>
