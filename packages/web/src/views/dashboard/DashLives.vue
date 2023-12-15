<template>
  <v-container class="d-flex flex-column pa-md-12">
    <v-row dense>
      <v-col cols="auto">
        <v-btn variant="flat" color="success" :prepend-icon="mdiPlus">
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
        :items-length="files?.total ?? 0"
        :items="files?.items ?? []"
        :loading="loading"
        color="primary"
        :loading-text="t('app.loader.loading')"
        :no-data-text="t('app.loader.empty')"
        :items-per-page-text="t('app.loader.itemsPerPage')"
        :page-text="t('app.loader.pageText', { page, max: Math.ceil((files?.total ?? 0) / size) })"
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
          <zoom-img
            class="rounded ma-1"
            min-width="120"
            max-width="160"
            :src="item.poster ? api.File.buildRawPath(item.poster.id, item.poster.name) : MediaPosterFallback"
          ></zoom-img>
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
        <template #item.createAt="{ item }">
          {{ new Date(item.createAt).toLocaleString(locale) }}
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
  </v-container>
</template>

<script setup lang="ts">
import { mdiCheck, mdiClose, mdiMagnify, mdiPencil, mdiPlus } from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { ref } from 'vue';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { debounce } from '@/utils/utils';
import { LiveEntity, LiveQueryDto } from '@/api/interfaces/live.interface';
import UserAvatar from '@/components/user/UserAvatar.vue';
import MediaPosterFallback from '@/assets/banner.jpeg';
import ZoomImg from '@/components/app/ZoomImg.vue';

const { t, locale } = useI18n();
const api = useApiStore();

const page = ref(1);
const size = ref(10);
const sortBy = ref<any[]>([]);
const filters = ref<LiveQueryDto>({});
const {
  pending: loading,
  request,
  data: files,
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
const useQuery = debounce(request, 1000);

const headers = ref([
  {
    title: t('live.entity.title'),
    key: 'title',
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
  },
  {
    key: 'actions',
    sortable: false,
  },
]);

const actions = [
  {
    text: t('app.actions.edit'),
    icon: mdiPencil,
    color: 'info',
    show: (item: LiveEntity) => true,
    click: (item: LiveEntity) => undefined,
  },
  {
    text: t('app.actions.close'),
    icon: mdiClose,
    color: 'error',
    show: (item: LiveEntity) => true,
    click: (item: LiveEntity) => undefined,
  },
];
</script>

<style scoped lang="sass"></style>
