<template>
  <v-container class="d-flex flex-column pa-md-12">
    <v-row dense>
      <v-col cols="auto">
        <v-btn variant="flat" color="success" :prepend-icon="mdiPlus" :loading="creating" @click="createSource()">
          {{ t('app.actions.add') }}
        </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn variant="flat" color="info" :prepend-icon="mdiRefresh" :loading="loading" @click="request()">
          {{ t('app.actions.refresh') }}
        </v-btn>
      </v-col>
    </v-row>
    <v-row dense class="mt-2">
      <v-col cols="12" sm="6">
        <v-text-field
          variant="outlined"
          color="primary"
          :prepend-inner-icon="mdiMagnify"
          hide-details
          :label="t('app.input.keyword')"
          density="compact"
          v-model.trim="filters.keyword"
          clearable
          @update:model-value="useQuery"
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="6">
        <v-select
          variant="outlined"
          color="primary"
          hide-details
          :label="t('source.entity.enabled')"
          :items="enabledOptions"
          density="compact"
          v-model="filters.enabled"
          clearable
          @update:model-value="request"
        ></v-select>
      </v-col>
    </v-row>
    <v-sheet rounded border class="mt-4">
      <v-data-table-server
        v-model:items-per-page="size"
        v-model:page="page"
        v-model:sort-by="sortBy"
        :headers="headers"
        :items-length="total"
        :items="sources?.items ?? []"
        :loading="loading"
        color="primary"
        :loading-text="t('app.loader.loading')"
        :no-data-text="t('app.loader.empty')"
        :items-per-page-text="t('app.loader.itemsPerPage')"
        :page-text="t('app.loader.pageText', { page, max: Math.ceil((sources?.total ?? 0) / size) })"
        :items-per-page-options="[10, 25, 50]"
        hover
        item-value="id"
        @update:options="request()"
        density="compact"
      >
        <template #item.enabled="{ item }">
          <v-icon size="small" :icon="item.enabled ? mdiCheck : mdiClose"></v-icon>
        </template>
        <template #item.user="{ item }">
          <v-tooltip v-if="item.user">
            {{ item.user.username }}
            <template #activator="{ props }">
              <user-avatar
                v-bind="props"
                :src="item.user.avatar && api.File.buildRawPath(item.user.avatar.id)"
                size="40"
              ></user-avatar>
            </template>
          </v-tooltip>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <template v-for="(action, index) in actions" :key="index">
              <v-tooltip>
                {{ action.text }}
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    v-if="action.show(item)"
                    :color="action.color"
                    :icon="action.icon"
                    variant="text"
                    density="comfortable"
                    @click.stop="action.click(item)"
                  >
                  </v-btn>
                </template>
              </v-tooltip>
            </template>
          </div>
        </template>
      </v-data-table-server>
    </v-sheet>

    <v-dialog v-model="deleteDialog" width="auto">
      <v-card v-if="editItem">
        <v-card-title>
          {{ t('app.actions.deleteTitle') }}
        </v-card-title>
        <v-card-text class="d-flex flex-column">
          <span>{{ t('app.actions.deleteConfirm', { item: t('app.entities.source') }) }}</span>
          <span class="font-italic font-weight-bold">{{ editItem.title || editItem.remark || editItem.url }}</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="deleteDialog = false">
            {{ t('app.cancel') }}
          </v-btn>
          <v-btn variant="plain" color="error" :loading="sourceDeleting" @click="deleteSource(editItem.id)">
            {{ t('app.ok') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { mdiCheck, mdiClose, mdiDelete, mdiMagnify, mdiPencil, mdiPlus, mdiRefresh } from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { ref } from 'vue';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { debounce } from '@/utils/utils';
import { SourceEntity, SourceQueryDto } from '@/api/interfaces/subscribe.interface';
import UserAvatar from '@/components/user/UserAvatar.vue';
import { useRouter } from 'vue-router';
import { useToastStore } from '@/store/toast';

const { t, locale } = useI18n();
const api = useApiStore();
const toast = useToastStore();
const router = useRouter();

const page = ref(1);
const size = ref(10);
const sortBy = ref<any[]>([{ key: 'createAt', order: 'DESC' }]);
const total = ref(0);
const filters = ref<SourceQueryDto>({});
const {
  pending: loading,
  request,
  data: sources,
  onResolved: onSourcesLoaded,
} = useAxiosRequest(async () => {
  return await api.Source.query({
    ...Object.fromEntries(
      Object.entries(filters.value)
        .filter(([_, value]) => value != undefined && String(value).length > 0)
        .map(([key, value]) => [key, String(value)]),
    ),
    page: page.value - 1,
    size: size.value,
    sort: sortBy.value?.[0]?.key,
    order: sortBy.value[0]?.order?.toUpperCase(),
  });
});
onSourcesLoaded((data) => {
  total.value = data.total;
});
const useQuery = debounce(request, 1000);

const enabledOptions = [
  { title: t('app.on'), value: 1 },
  { title: t('app.off'), value: 0 },
];
const headers = ref([
  {
    title: t('source.entity.title'),
    key: 'title',
    value: (row: any) => row.title || t('source.unnamed'),
  },
  {
    title: t('source.entity.remark'),
    key: 'remark',
  },
  {
    title: t('source.entity.cron'),
    key: 'cron',
    sortable: false,
  },
  {
    title: t('source.entity.url'),
    key: 'url',
  },
  {
    title: t('source.entity.enabled'),
    key: 'enabled',
  },
  {
    title: t('source.entity.user'),
    key: 'user',
    sortable: false,
  },
  {
    title: t('source.entity.createAt'),
    key: 'createAt',
    value: (row: any) => new Date(row.createAt).toLocaleString(locale.value),
  },
  {
    key: 'actions',
    sortable: false,
  },
]);

const editItem = ref<SourceEntity | undefined>(undefined);

const {
  pending: creating,
  request: createSource,
  onResolved: onCreated,
  onRejected: onCreateFailed,
} = useAxiosRequest(async () => {
  return await api.Source.create({
    title: t('source.unnamed'),
    cron: '0 */30 * * * *',
    url: 'https://example.com/rss.xml',
    enabled: false,
  });
});
onCreated(async (data) => {
  await router.push({ path: `/source/${data.id}` });
});
onCreateFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const deleteDialog = ref(false);
const {
  pending: sourceDeleting,
  request: deleteSource,
  onResolved: onSourceDeleted,
  onRejected: onSourceDeleteFailed,
} = useAxiosRequest(async (id: number) => {
  return await api.Source.delete(id)();
});
onSourceDeleted(async () => {
  toast.toastSuccess(t('app.actions.deleteToast'));
  if (sources.value) {
    sources.value.items = sources.value.items.filter(({ id }) => id !== editItem.value?.id);
  }
  deleteDialog.value = false;
});
onSourceDeleteFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const actions = [
  {
    text: t('app.actions.edit'),
    icon: mdiPencil,
    color: 'info',
    show: (item: SourceEntity) => true,
    click: (item: SourceEntity) => {
      router.push({ path: `/source/${item.id}` });
    },
  },
  {
    text: t('app.actions.delete'),
    icon: mdiDelete,
    color: 'error',
    show: (item: SourceEntity) => true,
    click: (item: SourceEntity) => {
      editItem.value = item;
      deleteDialog.value = true;
    },
  },
];
</script>

<style scoped lang="sass"></style>
