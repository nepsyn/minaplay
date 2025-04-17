<template>
  <component :is="standalone ? ToTopContainer : 'div'" :class="standalone ? 'page-height overflow-auto' : undefined">
    <v-container :class="standalone ? 'd-flex flex-column py-md-12' : 'pa-0 pb-12'">
      <span class="text-h4">{{ t('download.title') }}</span>
      <v-row class="py-2 mt-3" dense>
        <v-col cols="12" sm="4">
          <v-text-field
            variant="outlined"
            :label="t('app.input.keyword')"
            :placeholder="t('app.input.placeholder', { item: t('download.item') })"
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
            v-model="filters.sort"
            :items="orders"
            hide-details
            clearable
            @update:model-value="downloadsLoader.reload()"
          ></v-select>
        </v-col>
        <v-col sm="auto">
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
        <v-col cols="auto" v-if="standalone">
          <component
            :is="display.smAndUp.value ? VMenu : VBottomSheet"
            :close-on-content-click="false"
            v-model="newTaskModel"
            @update:model-value="
              editTask.url = '';
              editTask.name = '';
            "
          >
            <v-card min-width="320">
              <v-card-text>
                <v-list-subheader class="font-weight-bold">
                  {{ t('download.create') }}
                </v-list-subheader>
                <v-text-field
                  hide-details
                  density="compact"
                  variant="outlined"
                  color="primary"
                  :label="t('download.url')"
                  autofocus
                  v-model="editTask.url"
                ></v-text-field>
                <v-text-field
                  class="mt-3"
                  hide-details
                  density="compact"
                  variant="outlined"
                  color="primary"
                  :label="t('download.name')"
                  v-model="editTask.name"
                ></v-text-field>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn variant="text" color="primary" @click="newTaskModel = false">
                  {{ t('app.cancel') }}
                </v-btn>
                <v-btn
                  variant="text"
                  color="primary"
                  :loading="taskCreating"
                  :disabled="editTask.url.trim().length <= 0"
                  @click="createTask()"
                >
                  {{ t('app.ok') }}
                </v-btn>
              </v-card-actions>
            </v-card>
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                height="40"
                color="success"
                variant="flat"
                :loading="taskCreating"
                :prepend-icon="mdiPlus"
                block
              >
                {{ t('app.actions.add') }}
              </v-btn>
            </template>
          </component>
        </v-col>
      </v-row>
      <v-divider class="my-2"></v-divider>
      <multi-items-loader class="px-0 py-3 mt-2" :loader="downloadsLoader" auto>
        <download-item-overview
          class="mb-3"
          v-for="item in downloads"
          :key="item.id"
          :item="item"
          @updated="onItemUpdated"
          @deleted="onItemDeleted"
        ></download-item-overview>
      </multi-items-loader>
    </v-container>
  </component>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useRoute } from 'vue-router';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { DownloadItemDto, DownloadItemEntity, DownloadItemQueryDto } from '@/api/interfaces/subscribe.interface';
import { ref } from 'vue';
import { debounce } from '@/utils/utils';
import { StatusEnum } from '@/api/enums/status.enum';
import { mdiPlus, mdiRefresh } from '@mdi/js';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import DownloadItemOverview from '@/components/source/DownloadItemOverview.vue';
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import { VBottomSheet, VMenu } from 'vuetify/components';
import { useDisplay } from 'vuetify';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { useToastStore } from '@/store/toast';

const { t } = useI18n();
const api = useApiStore();
const route = useRoute();
const toast = useToastStore();
const display = useDisplay();

const props = defineProps<{
  standalone?: boolean;
}>();

const orders = [
  {
    title: t('app.input.desc'),
    value: 'createAt:DESC',
  },
  {
    title: t('app.input.asc'),
    value: 'createAt:ASC',
  },
];

const downloadsLoader = useAxiosPageLoader(
  async (query: DownloadItemQueryDto = {}) => {
    const option = props.standalone
      ? {}
      : { [route.name === 'source-download' ? 'sourceId' : 'ruleId']: Number(route.params.id) };
    return await api.Download.query({
      ...query,
      ...option,
      keyword: filters.value.keyword,
      status: filters.value.status,
      sort: filters.value.sort,
    });
  },
  { page: 0, size: 20 },
);
const { items: downloads } = downloadsLoader;

const filters = ref<Partial<DownloadItemQueryDto>>({
  keyword: '',
  status: undefined,
  sort: 'createAt:DESC',
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

const newTaskModel = ref(false);
const editTask = ref<DownloadItemDto>({
  url: '',
  name: '',
});
const {
  pending: taskCreating,
  onResolved: onTaskCreated,
  onRejected: onTaskCreateFailed,
  request: createTask,
} = useAxiosRequest(async () => {
  return api.Download.create(editTask.value);
});
onTaskCreated((data) => {
  downloads.value.unshift(data);
  toast.toastSuccess(t('source.raw.downloadCreated'));
  newTaskModel.value = false;
});
onTaskCreateFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

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
