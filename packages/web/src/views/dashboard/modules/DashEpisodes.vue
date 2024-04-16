<template>
  <v-container class="d-flex flex-column pa-md-12">
    <v-row dense>
      <v-col sm="auto">
        <v-btn variant="flat" block color="info" :prepend-icon="mdiRefresh" :loading="loading" @click="request()">
          {{ t('app.actions.refresh') }}
        </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn variant="flat" color="success" :prepend-icon="mdiPlus" @click="createNew()">
          {{ t('app.actions.add') }}
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
        <v-autocomplete
          variant="outlined"
          color="primary"
          hide-details
          :label="t('app.entities.series')"
          :items="seriesItems ?? []"
          item-title="name"
          item-value="id"
          :no-data-text="t('app.loader.empty')"
          density="compact"
          :loading="seriesLoading"
          v-model.number="filters.seriesId"
          v-model:search="seriesKeyword"
          clearable
          :item-props="
            (item) => ({
              density: 'comfortable',
              subtitle: item.season && (+item.season ? t('series.seasonLabel', { season: item.season }) : item.season),
            })
          "
          @focus.once="loadSeries()"
          @update:model-value="request()"
          @update:search="!filters.seriesId && useSeriesQuery(seriesKeyword)"
        ></v-autocomplete>
      </v-col>
    </v-row>
    <v-sheet rounded border class="mt-4">
      <v-data-table-server
        v-model:items-per-page="size"
        v-model:page="page"
        v-model:sort-by="sortBy"
        :headers="headers"
        :items-length="total"
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
          <div class="d-block">
            <zoom-img
              class="rounded ma-1"
              :aspect-ratio="3 / 4"
              min-width="60"
              max-width="100"
              :src="item.series?.poster ? api.File.buildRawPath(item.series.poster) : SeriesPosterFallback"
            ></zoom-img>
          </div>
        </template>
        <template #item.media="{ item }">
          <div class="d-block">
            <zoom-img
              class="rounded ma-1"
              :aspect-ratio="16 / 9"
              min-width="120"
              max-width="160"
              :src="item.media?.poster ? api.File.buildRawPath(item.media.poster) : MediaPosterFallback"
            ></zoom-img>
          </div>
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

    <v-dialog
      :class="display.smAndUp.value ? 'w-75' : 'w-100'"
      close-on-back
      :fullscreen="!display.smAndUp.value"
      v-model="editDialog"
      scrollable
    >
      <v-card v-if="editItem">
        <v-toolbar color="primary">
          <v-btn :icon="mdiClose" @click="editDialog = false"></v-btn>
          <v-toolbar-title>
            {{ editItem?.id ? t('app.actions.edit') : t('app.actions.add') }}
            {{ t('app.entities.episode') }}
          </v-toolbar-title>
          <v-btn
            variant="text"
            :disabled="!editItem.series || !editItem.media"
            :prepend-icon="mdiCheck"
            :loading="episodeSaving"
            @click="saveEpisode(editItem)"
          >
            {{ t('app.actions.save') }}
          </v-btn>
        </v-toolbar>
        <v-card-text class="py-6">
          <v-container class="pa-0">
            <span class="text-body-1 font-weight-bold">{{ t('episode.entity.title') }}</span>
            <v-text-field
              class="mt-2"
              variant="outlined"
              hide-details
              color="primary"
              density="compact"
              v-model="editItem.title"
            ></v-text-field>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1 font-weight-bold">{{ t('episode.entity.no') }}</span>
            <v-text-field
              class="mt-2"
              variant="outlined"
              hide-details
              color="primary"
              density="compact"
              v-model="editItem.no"
            ></v-text-field>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1 font-weight-bold">{{ t('episode.entity.pubAt') }}</span>
            <v-text-field
              class="mt-2"
              variant="outlined"
              hide-details
              color="primary"
              density="compact"
              v-model="editItem.pubAt"
            ></v-text-field>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1 font-weight-bold">{{ t('episode.entity.series') }}</span>
            <v-autocomplete
              class="mt-2"
              variant="outlined"
              color="primary"
              hide-details
              :items="seriesItems ?? []"
              item-title="name"
              return-object
              :no-data-text="t('app.loader.empty')"
              density="compact"
              :loading="seriesLoading"
              v-model="editItem.series"
              v-model:search="editSeriesKeyword"
              clearable
              :item-props="
                (item) => ({
                  density: 'comfortable',
                  subtitle:
                    item.season && (+item.season ? t('series.seasonLabel', { season: item.season }) : item.season),
                })
              "
              @focus.once="loadSeries()"
              @update:search="!editItem.series && useSeriesQuery(editSeriesKeyword)"
            ></v-autocomplete>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1 font-weight-bold">{{ t('episode.entity.media') }}</span>
            <v-autocomplete
              class="mt-2"
              variant="outlined"
              color="primary"
              hide-details
              :items="mediaItems ?? []"
              :item-title="(item) => item.name || item.file?.name"
              return-object
              :no-data-text="t('app.loader.empty')"
              density="compact"
              :loading="mediasLoading"
              v-model="editItem.media"
              v-model:search="editMediaKeyword"
              clearable
              :item-props="() => ({ density: 'comfortable' })"
              @focus.once="loadMedias()"
              @update:search="!editItem.media && useMediasQuery(editMediaKeyword)"
            ></v-autocomplete>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" width="auto">
      <v-card v-if="editItem">
        <v-card-title>
          {{ t('app.actions.deleteTitle') }}
        </v-card-title>
        <v-card-text class="d-flex flex-column">
          <span>{{ t('app.actions.deleteConfirm', { item: t('app.entities.episode') }) }}</span>
          <span class="font-italic font-weight-bold">{{ editItem.title || editItem.media?.name }}</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="deleteDialog = false">
            {{ t('app.cancel') }}
          </v-btn>
          <v-btn variant="plain" color="error" :loading="episodeDeleting" @click="deleteEpisode(editItem!.id)">
            {{ t('app.ok') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { mdiCheck, mdiClose, mdiDelete, mdiMagnify, mdiPencil, mdiPlus, mdiRefresh, mdiShare } from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { ref } from 'vue';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { debounce } from '@/utils/utils';
import ZoomImg from '@/components/app/ZoomImg.vue';
import { EpisodeEntity, EpisodeQueryDto, SeriesQueryDto } from '@/api/interfaces/series.interface';
import SeriesPosterFallback from '@/assets/banner-portrait.jpeg';
import MediaPosterFallback from '@/assets/banner.jpeg';
import { useRouter } from 'vue-router';
import { useToastStore } from '@/store/toast';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { useDisplay } from 'vuetify';
import { MediaQueryDto } from '@/api/interfaces/media.interface';

const { t, locale } = useI18n();
const api = useApiStore();
const router = useRouter();
const toast = useToastStore();
const display = useDisplay();

const page = ref(1);
const size = ref(10);
const sortBy = ref<any[]>([{ key: 'createAt', order: 'DESC' }]);
const total = ref(0);
const filters = ref<EpisodeQueryDto>({});
const {
  pending: loading,
  request,
  data: episodes,
  onResolved: onEpisodesLoaded,
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
onEpisodesLoaded((data) => {
  total.value = data.total;
});
const useQuery = debounce(request, 1000);

const seriesKeyword = ref('');
const {
  pending: seriesLoading,
  request: loadSeries,
  items: seriesItems,
  reset: resetSeries,
  onRejected: onSeriesLoadFailed,
} = useAxiosPageLoader(
  async (query?: SeriesQueryDto) => {
    return await api.Series.query(query);
  },
  { page: 0, size: 24 },
);
const useSeriesQuery = debounce(
  async (keyword: string) => {
    resetSeries();
    await loadSeries({
      keyword,
      sort: 'createAt',
      order: 'DESC',
    });
  },
  500,
  false,
);
onSeriesLoadFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

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

const editItem = ref<EpisodeEntity | undefined>(undefined);
const editSeriesKeyword = ref('');
const editMediaKeyword = ref('');
const {
  pending: mediasLoading,
  request: loadMedias,
  items: mediaItems,
  reset: resetMedias,
  onRejected: onMediasLoadFailed,
} = useAxiosPageLoader(
  async (query?: MediaQueryDto) => {
    return await api.Media.query(query);
  },
  { page: 0, size: 24 },
);
const useMediasQuery = debounce(
  async (keyword: string) => {
    resetMedias();
    await loadMedias({
      keyword,
      sort: 'createAt',
      order: 'DESC',
    });
  },
  500,
  false,
);
onMediasLoadFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const editDialog = ref(false);
const createNew = () => {
  editItem.value = {} as any;
  editDialog.value = true;
};
const {
  pending: episodeSaving,
  request: saveEpisode,
  onResolved: onEpisodeSaved,
  onRejected: onEpisodeSaveFailed,
} = useAxiosRequest(async (episode: EpisodeEntity) => {
  const handler = episode.id ? api.Episode.update(episode.id) : api.Episode.create;
  return handler({
    title: episode.title,
    no: episode.no,
    pubAt: episode.pubAt,
    seriesId: episode.series?.id,
    mediaId: episode.media?.id,
  });
});
onEpisodeSaved((data) => {
  if (episodes.value) {
    const index = episodes.value?.items.findIndex(({ id }) => id === data.id) ?? -1;
    if (index > -1) {
      episodes.value.items[index] = data;
    } else {
      episodes.value.items.unshift(data);
    }
  }

  editDialog.value = false;
});
onEpisodeSaveFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const deleteDialog = ref(false);
const {
  pending: episodeDeleting,
  request: deleteEpisode,
  onResolved: onEpisodeDeleted,
  onRejected: onEpisodeDeleteFailed,
} = useAxiosRequest(async (id: number) => {
  return await api.Episode.delete(id)();
});
onEpisodeDeleted(async () => {
  toast.toastSuccess(t('app.actions.deleteToast'));
  if (episodes.value) {
    episodes.value.items = episodes.value.items.filter(({ id }) => id !== editItem.value?.id);
  }
  deleteDialog.value = false;
});
onEpisodeDeleteFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const actions = [
  {
    text: t('app.actions.view'),
    icon: mdiShare,
    color: 'info',
    show: (item: EpisodeEntity) => true,
    click: (item: EpisodeEntity) => {
      router.push({ path: `/episode/${item.id}` });
    },
  },
  {
    text: t('app.actions.edit'),
    icon: mdiPencil,
    color: 'info',
    show: (item: EpisodeEntity) => true,
    click: (item: EpisodeEntity) => {
      editItem.value = Object.assign({}, item);
      editDialog.value = true;
    },
  },
  {
    text: t('app.actions.delete'),
    icon: mdiDelete,
    color: 'error',
    show: (item: EpisodeEntity) => true,
    click: (item: EpisodeEntity) => {
      editItem.value = item;
      deleteDialog.value = true;
    },
  },
];
</script>

<style scoped lang="sass"></style>
