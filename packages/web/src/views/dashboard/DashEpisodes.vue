<template>
  <v-container class="d-flex flex-column pa-md-12">
    <v-row dense>
      <v-col cols="auto">
        <v-btn variant="flat" color="success" :prepend-icon="mdiPlus">
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
        :items-length="episodes?.total ?? 0"
        :items="episodes?.items ?? []"
        :loading="loading"
        color="primary"
        :loading-text="t('app.loader.loading')"
        :no-data-text="t('app.loader.empty')"
        :items-per-page-text="t('app.loader.itemsPerPage')"
        :page-text="t('app.loader.pageText', { page, max: Math.ceil((episodes?.total ?? 0) / size) })"
        :items-per-page-options="[10, 25, 50]"
        hover
        item-value="id"
        @update:options="request()"
        density="compact"
      >
        <template #item.series="{ item }">
          <zoom-img
            class="rounded ma-1"
            :aspect-ratio="3 / 4"
            min-width="60"
            max-width="100"
            :src="
              item.series.poster
                ? api.File.buildRawPath(item.series.poster.id, item.series.poster.name)
                : SeriesPosterFallback
            "
          ></zoom-img>
        </template>
        <template #item.media="{ item }">
          <zoom-img
            class="rounded ma-1"
            :aspect-ratio="16 / 9"
            min-width="120"
            max-width="160"
            :src="
              item.media.poster
                ? api.File.buildRawPath(item.media.poster.id, item.media.poster.name)
                : MediaPosterFallback
            "
          ></zoom-img>
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
import { mdiDelete, mdiMagnify, mdiPencil, mdiPlus, mdiRefresh, mdiShare } from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { ref } from 'vue';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { debounce } from '@/utils/utils';
import ZoomImg from '@/components/app/ZoomImg.vue';
import { EpisodeEntity, EpisodeQueryDto } from '@/api/interfaces/series.interface';
import SeriesPosterFallback from '@/assets/banner-portrait.jpeg';
import MediaPosterFallback from '@/assets/banner.jpeg';

const { t, locale } = useI18n();
const api = useApiStore();

const page = ref(1);
const size = ref(10);
const sortBy = ref<any[]>([]);
const filters = ref<EpisodeQueryDto>({});
const {
  pending: loading,
  request,
  data: episodes,
} = useAxiosRequest(async () => {
  return await api.Episode.query({
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
    title: t('episode.entity.title'),
    key: 'title',
  },
  {
    title: t('episode.entity.no'),
    key: 'no',
  },
  {
    title: t('episode.entity.series'),
    key: 'series',
    sortable: false,
  },
  {
    title: t('episode.entity.media'),
    key: 'media',
    sortable: false,
  },
  {
    title: t('episode.entity.pubAt'),
    key: 'pubAt',
    value: (row: any) => new Date(row.pubAt).toLocaleString(locale.value),
  },
  {
    title: t('episode.entity.createAt'),
    key: 'createAt',
    value: (row: any) => new Date(row.createAt).toLocaleString(locale.value),
  },
  {
    key: 'actions',
    sortable: false,
  },
]);

const actions = [
  {
    text: t('app.actions.view'),
    icon: mdiShare,
    color: 'info',
    show: (item: EpisodeEntity) => true,
    click: (item: EpisodeEntity) => undefined,
  },
  {
    text: t('app.actions.edit'),
    icon: mdiPencil,
    color: 'info',
    show: (item: EpisodeEntity) => true,
    click: (item: EpisodeEntity) => undefined,
  },
  {
    text: t('app.actions.delete'),
    icon: mdiDelete,
    color: 'error',
    show: (item: EpisodeEntity) => true,
    click: (item: EpisodeEntity) => undefined,
  },
];
</script>

<style scoped lang="sass"></style>
