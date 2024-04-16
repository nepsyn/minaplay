<template>
  <v-container class="d-flex flex-column pa-md-12">
    <v-row dense>
      <v-col sm="auto">
        <v-btn variant="flat" block color="info" :prepend-icon="mdiRefresh" :loading="loading" @click="request()">
          {{ t('app.actions.refresh') }}
        </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn variant="flat" color="success" :prepend-icon="mdiPlus" @click="createLive()">
          {{ t('app.actions.add') }}
        </v-btn>
      </v-col>
    </v-row>
    <v-row dense class="mt-2">
      <v-col cols="12">
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
    </v-row>
    <v-sheet rounded border class="mt-4">
      <v-data-table-server
        v-model:items-per-page="size"
        v-model:page="page"
        v-model:sort-by="sortBy"
        :headers="headers"
        :items-length="total"
        :items="lives?.items ?? []"
        :loading="loading"
        color="primary"
        :loading-text="t('app.loader.loading')"
        :no-data-text="t('app.loader.empty')"
        :items-per-page-text="t('app.loader.itemsPerPage')"
        :page-text="t('app.loader.pageText', { page, max: Math.ceil((lives?.total ?? 0) / size) })"
        :items-per-page-options="[10, 25, 50]"
        hover
        item-value="id"
        @update:options="request()"
        density="compact"
      >
        <template #item.hasPassword="{ item }">
          <v-icon size="small" :icon="item.hasPassword ? mdiCheck : mdiClose"></v-icon>
        </template>
        <template #item.poster="{ item }">
          <div class="d-block">
            <zoom-img
              class="rounded ma-1"
              :aspect-ratio="16 / 9"
              min-width="120"
              max-width="160"
              :src="item.poster ? api.File.buildRawPath(item.poster) : LivePosterFallback"
            ></zoom-img>
          </div>
        </template>
        <template #item.user="{ item }">
          <v-tooltip v-if="item.user">
            {{ item.user.username }}
            <template #activator="{ props }">
              <user-avatar
                v-bind="props"
                :src="item.user.avatar && api.File.buildRawPath(item.user.avatar)"
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
          <span>{{ t('app.actions.deleteConfirm', { item: t('app.entities.live') }) }}</span>
          <span class="font-italic font-weight-bold">{{ editItem.title || t('live.unnamed') }}</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="deleteDialog = false">
            {{ t('app.cancel') }}
          </v-btn>
          <v-btn variant="plain" color="error" :loading="liveClosing" @click="closeLive(editItem.id)">
            {{ t('app.ok') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { mdiCheck, mdiClose, mdiMagnify, mdiPlus, mdiRefresh, mdiShare } from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { ref } from 'vue';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { debounce } from '@/utils/utils';
import { LiveEntity, LiveQueryDto } from '@/api/interfaces/live.interface';
import UserAvatar from '@/components/user/UserAvatar.vue';
import LivePosterFallback from '@/assets/live-poster-fallback.png';
import ZoomImg from '@/components/app/ZoomImg.vue';
import { useRouter } from 'vue-router';
import { useToastStore } from '@/store/toast';

const { t, locale } = useI18n();
const api = useApiStore();
const router = useRouter();
const toast = useToastStore();

const page = ref(1);
const size = ref(10);
const sortBy = ref<any[]>([]);
const total = ref(0);
const filters = ref<LiveQueryDto>({});
const {
  pending: loading,
  request,
  data: lives,
  onResolved: onLivesLoaded,
} = useAxiosRequest(async () => {
  return await api.Live.query({
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
onLivesLoaded((data) => {
  total.value = data.total;
});
const useQuery = debounce(request, 1000);

const headers = ref([
  {
    title: t('live.entity.title'),
    key: 'title',
    value: (row: any) => row.title || t('live.unnamed'),
  },
  {
    title: t('live.entity.hasPassword'),
    key: 'hasPassword',
    sortable: false,
  },
  {
    title: t('live.entity.poster'),
    key: 'poster',
    sortable: false,
  },
  {
    title: t('live.entity.user'),
    key: 'user',
    sortable: false,
  },
  {
    title: t('live.entity.createAt'),
    key: 'createAt',
    value: (row: any) => new Date(row.createAt).toLocaleString(locale.value),
  },
  {
    key: 'actions',
    sortable: false,
  },
]);

const editItem = ref<LiveEntity | undefined>(undefined);

const deleteDialog = ref(false);
const {
  pending: liveClosing,
  request: closeLive,
  onResolved: onLiveClosed,
  onRejected: onLiveCloseFailed,
} = useAxiosRequest(async (id: string) => {
  return await api.Live.delete(id)();
});
onLiveClosed(async () => {
  toast.toastSuccess(t('app.actions.deleteToast'));
  if (lives.value) {
    lives.value.items = lives.value.items.filter(({ id }) => id !== editItem.value?.id);
  }
  deleteDialog.value = false;
});
onLiveCloseFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const {
  pending: creating,
  request: createLive,
  onResolved: onCreated,
  onRejected: onCreateFailed,
} = useAxiosRequest(async () => {
  return await api.Live.create({
    title: t('live.unnamed'),
  });
});
onCreated(async (data) => {
  await router.push({ path: `/live/${data.id}` });
});
onCreateFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const actions = [
  {
    text: t('app.actions.view'),
    icon: mdiShare,
    color: 'info',
    show: (item: LiveEntity) => true,
    click: (item: LiveEntity) => {
      router.push({ path: `/live/${item.id}` });
    },
  },
  {
    text: t('app.actions.close'),
    icon: mdiClose,
    color: 'error',
    show: (item: LiveEntity) => true,
    click: (item: LiveEntity) => {
      editItem.value = item;
      deleteDialog.value = true;
    },
  },
];
</script>

<style scoped lang="sass"></style>
