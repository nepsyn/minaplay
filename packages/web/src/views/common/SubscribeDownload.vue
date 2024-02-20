<template>
  <v-container class="pa-0 pb-12">
    <span class="text-h4">{{ t('common.download.title') }}</span>
    <v-row class="py-2 mt-3" dense>
      <v-col cols="12" sm="4">
        <v-text-field
          variant="outlined"
          :label="t('app.input.keyword')"
          :placeholder="t('app.input.placeholder', { item: t('common.download.item') })"
          density="compact"
          v-model="filters.keyword"
          hide-details
          clearable
          @update:model-value="useQuery"
        ></v-text-field>
      </v-col>
      <v-col cols="6" sm="4">
        <v-select
          variant="outlined"
          :label="t('app.input.status')"
          density="compact"
          v-model="filters.status"
          :items="statusOptions"
          item-title="name"
          item-value="value"
          hide-details
          clearable
          @update:model-value="downloadsLoader.reload()"
        ></v-select>
      </v-col>
      <v-col cols="6" sm="4">
        <v-select
          variant="outlined"
          :label="t('app.input.order')"
          density="compact"
          v-model="filters.order"
          :items="orders"
          hide-details
          clearable
          @update:model-value="downloadsLoader.reload()"
        ></v-select>
      </v-col>
      <v-col cols="12" sm="auto" class="text-end">
        <v-btn
          variant="flat"
          block
          color="info"
          height="40"
          :prepend-icon="mdiRefresh"
          :loading="downloadsLoader.pending.value"
          @click="downloadsLoader.reload()"
        >
          {{ t('app.actions.refresh') }}
        </v-btn>
      </v-col>
    </v-row>
    <v-divider class="my-2"></v-divider>
    <multi-items-loader class="px-0 py-3 mt-2" :loader="downloadsLoader" auto>
      <download-item-overview
        class="mb-3"
        v-for="item in downloads"
        :key="item.id"
        :item="item"
        @update="onItemUpdated"
        @delete="onItemDeleted"
      ></download-item-overview>
    </multi-items-loader>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useRoute } from 'vue-router';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { DownloadItemEntity, DownloadItemQueryDto } from '@/api/interfaces/subscribe.interface';
import { ref } from 'vue';
import { debounce } from '@/utils/utils';
import { StatusEnum } from '@/api/enums/status.enum';
import { mdiRefresh } from '@mdi/js';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import DownloadItemOverview from '@/components/source/DownloadItemOverview.vue';

const { t } = useI18n();
const api = useApiStore();
const route = useRoute();

const orders = [
  {
    title: t('app.input.desc'),
    value: 'DESC',
  },
  {
    title: t('app.input.asc'),
    value: 'ASC',
  },
];

const downloadsLoader = useAxiosPageLoader(
  async (query: DownloadItemQueryDto = {}) => {
    return await api.Download.query({
      ...query,
      [route.name === 'source-download' ? 'sourceId' : 'ruleId']: Number(route.params.id),
      keyword: filters.value.keyword,
      status: filters.value.status,
      order: filters.value.order,
    });
  },
  { page: 0, size: 20 },
);
const { items: downloads } = downloadsLoader;

const filters = ref<Partial<DownloadItemQueryDto>>({
  keyword: '',
  status: undefined,
  sort: undefined,
  order: 'DESC',
});
const useQuery = debounce(downloadsLoader.reload, 1000);

const statusOptions = [
  {
    name: t(`status.${StatusEnum.SUCCESS}`),
    value: StatusEnum.SUCCESS,
  },
  {
    name: t(`status.${StatusEnum.PENDING}`),
    value: StatusEnum.PENDING,
  },
  {
    name: t(`status.${StatusEnum.PAUSED}`),
    value: StatusEnum.PAUSED,
  },
  {
    name: t(`status.${StatusEnum.FAILED}`),
    value: StatusEnum.FAILED,
  },
];

const onItemUpdated = (item: DownloadItemEntity) => {
  const index = downloads.value.findIndex(({ id }) => id === item.id);
  if (index > -1) {
    downloads.value[index] = item;
  }
};
const onItemDeleted = (item: DownloadItemEntity) => {
  const index = downloads.value.findIndex(({ id }) => id === item.id);
  if (index > -1) {
    downloads.value.splice(index, 1);
    downloadsLoader.setTotal(downloadsLoader.total.value - 1);
  }
};
</script>

<style scoped lang="sass"></style>
