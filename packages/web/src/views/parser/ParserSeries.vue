<template>
  <div class="d-flex flex-row align-center">
    <v-btn :icon="mdiChevronLeft" variant="text" density="compact" size="x-large" @click="backToHome()"></v-btn>
    <v-toolbar-title class="ml-3 cursor-pointer" @click="backToHome()">
      {{ t('parser.backToHome') }}
    </v-toolbar-title>
  </div>
  <v-divider class="my-3"></v-divider>
  <v-expand-transition>
    <v-sheet v-if="playingEpisode?.playUrl" class="d-flex flex-column pa-4">
      <v-responsive class="rounded-lg" :aspect-ratio="16 / 9" max-height="520">
        <video-player :src="playingEpisode.playUrl ?? ''" :poster="playingEpisode.posterUrl"></video-player>
      </v-responsive>
      <div class="text-h6 mt-2 d-flex justify-space-between align-center">
        <v-btn
          variant="flat"
          size="small"
          color="info"
          :prepend-icon="mdiArrowLeft"
          @click="toEpisode(-1)"
          :disabled="!hasEpisode(-1)"
        >
          {{ t('resource.episode.previous') }}
        </v-btn>
        <span class="text-h6 px-2 text-truncate">
          {{ playingEpisode.no }}
        </span>
        <v-btn
          variant="flat"
          size="small"
          color="info"
          :append-icon="mdiArrowRight"
          @click="toEpisode(1)"
          :disabled="!hasEpisode(1)"
        >
          {{ t('resource.episode.next') }}
        </v-btn>
      </div>
      <v-divider class="mt-3"></v-divider>
    </v-sheet>
  </v-expand-transition>
  <single-item-loader class="pa-0" :loader="seriesLoader">
    <v-sheet v-if="series" class="pa-4">
      <v-row>
        <v-col cols="12" sm="9" class="d-flex flex-column">
          <div class="d-flex flex-row align-center justify-space-between">
            <div>
              <span class="text-h5 text-break">{{ series.name }}</span>
              <span v-if="series.season" class="text-body-2 text-medium-emphasis text-break ml-2">
                {{ +series.season ? t('series.seasonLabel', { season: series.season }) : series.season }}
              </span>
            </div>
          </div>
          <v-row dense class="pa-0 mt-1 flex-grow-0">
            <v-col cols="auto" v-if="parser?.features.buildRuleCodeOfSeries && parser?.features.buildSourceOfSeries">
              <v-btn
                v-if="!subscribeFetching"
                :loading="subscribeCreating"
                :disabled="subscribeCreated"
                variant="tonal"
                color="warning"
                density="comfortable"
                :prepend-icon="subscribeCreated ? mdiCheck : mdiRss"
                @click="createSubscribe"
              >
                {{ t(subscribeCreated ? 'parser.subscribeCreated' : 'parser.createSubscribe') }}
              </v-btn>
            </v-col>
            <v-col cols="auto">
              <v-btn
                v-if="!subscribeFetching"
                :loading="seriesCreating"
                :disabled="seriesCreated"
                variant="tonal"
                color="primary"
                density="comfortable"
                :prepend-icon="seriesCreated ? mdiCheck : mdiAnimationPlayOutline"
                @click="createSeries"
              >
                {{ t(seriesCreated ? 'parser.seriesAdded' : 'parser.addSeries') }}
              </v-btn>
            </v-col>
          </v-row>
          <v-row class="mt-2 flex-grow-0">
            <v-col cols="4" class="d-block d-sm-none">
              <zoom-img
                class="rounded-lg"
                :aspect-ratio="1 / 1.4"
                :src="series.posterUrl"
                :placeholder="SeriesPosterFallback"
              ></zoom-img>
            </v-col>
            <v-col cols="8" sm="12">
              <expandable-text
                ratio="0.25"
                class="text-subtitle-1"
                :content="series.description ?? t('resource.noDescription')"
              ></expandable-text>
            </v-col>
          </v-row>
          <v-divider class="my-2"></v-divider>
          <v-list slim :lines="false" class="pa-0">
            <v-list-item class="px-0 text-subtitle-2" density="compact">
              <template #prepend>
                <span class="font-weight-bold">{{ t('episode.info.count') }}</span>
              </template>
              <span class="ml-2">{{ series.count ?? t('app.unknown') }}</span>
            </v-list-item>
            <v-list-item class="px-0 text-subtitle-2" density="compact">
              <template #prepend>
                <span class="font-weight-bold">{{ t('episode.info.pubAt') }}</span>
              </template>
              <span class="ml-2">
                {{ Date.parse(series.pubAt!) ? new Date(series.pubAt!).toLocaleString(locale) : t('app.unknown') }}
              </span>
            </v-list-item>
            <v-list-item class="px-0 text-subtitle-2" density="compact">
              <template #prepend>
                <span class="font-weight-bold">{{ t('episode.info.finished') }}</span>
              </template>
              <span class="ml-2">
                {{ series.finished != undefined ? t(series.finished ? 'app.yes' : 'app.no') : t('app.unknown') }}
              </span>
            </v-list-item>
            <v-list-item class="px-0 text-subtitle-2" density="compact">
              <template #prepend>
                <span class="font-weight-bold">{{ t('episode.info.tags') }}</span>
              </template>
              <expandable-text
                v-if="series.tags && series.tags.length > 0"
                :content="(series.tags ?? []).join('  ')"
                class="ml-2"
              ></expandable-text>
              <span v-else class="ml-2">{{ t('app.none') }}</span>
            </v-list-item>
          </v-list>
        </v-col>
        <v-col class="d-none d-sm-block" cols="3">
          <zoom-img
            class="rounded-lg"
            :aspect-ratio="1 / 1.4"
            :src="series.posterUrl"
            :placeholder="SeriesPosterFallback"
          ></zoom-img>
        </v-col>
      </v-row>
    </v-sheet>
    <v-divider v-if="parser?.features.getEpisodesBySeriesId" class="my-3"></v-divider>
    <v-sheet v-if="parser?.features.getEpisodesBySeriesId" class="pa-4">
      <div class="d-flex align-center">
        <v-icon :icon="mdiViewComfy" size="large"></v-icon>
        <span class="text-h6 ml-3">{{ t('resource.episodes') }}</span>
      </div>
      <multi-items-loader class="px-0 py-3" :loader="episodesLoader" :hide-empty="episodes.length > 0">
        <v-list slim density="compact" class="py-0">
          <template v-for="(episode, index) in episodes" :key="index">
            <v-list-item link>
              <template #prepend>
                <span class="font-weight-bold">{{ episode.no }}</span>
              </template>
              <v-list-item-title class="px-4">
                {{ episode.title ?? '' }}
              </v-list-item-title>
              <template #append>
                <v-tooltip location="bottom">
                  {{ t('parser.play') }}
                  <template #activator="{ props }">
                    <v-btn
                      variant="text"
                      v-bind="props"
                      @click="switchEpisode(episode)"
                      :disabled="!episode.playUrl"
                      density="comfortable"
                      color="primary"
                      :icon="mdiPlay"
                    ></v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip location="bottom">
                  {{ t('parser.download') }}
                  <template #activator="{ props }">
                    <v-btn
                      variant="text"
                      v-bind="props"
                      :loading="downloadTaskCreating"
                      @click="episode.downloadUrl && createDownloadTask(episode.downloadUrl, episode.title)"
                      :disabled="!episode.downloadUrl"
                      density="comfortable"
                      color="secondary"
                      :icon="mdiDownload"
                    ></v-btn>
                  </template>
                </v-tooltip>
              </template>
            </v-list-item>
            <v-divider v-if="index < episodes.length - 1"></v-divider>
          </template>
        </v-list>
      </multi-items-loader>
    </v-sheet>
  </single-item-loader>
</template>

<script setup lang="ts">
import { computed, ComputedRef, inject, nextTick, ref } from 'vue';
import { MinaPlayParserMetadata, MinaPlayPluginSourceEpisode, PluginControl } from '@/api/interfaces/plugin.interface';
import { useRoute, useRouter } from 'vue-router';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { useApiStore } from '@/store/api';
import SingleItemLoader from '@/components/app/SingleItemLoader.vue';
import {
  mdiAnimationPlayOutline,
  mdiArrowLeft,
  mdiArrowRight,
  mdiCheck,
  mdiChevronLeft,
  mdiDownload,
  mdiPlay,
  mdiRss,
  mdiViewComfy,
} from '@mdi/js';
import { useI18n } from 'vue-i18n';
import SeriesPosterFallback from '@/assets/banner-portrait.jpeg';
import ExpandableText from '@/components/app/ExpandableText.vue';
import ZoomImg from '@/components/app/ZoomImg.vue';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { useToastStore } from '@/store/toast';
import VideoPlayer from '@/components/app/VideoPlayer.vue';

const { t, locale } = useI18n();
const api = useApiStore();
const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const backToHome = async () => {
  await router.replace({ path: `/parser/${parser.value!.plugin.id}/${parser.value!.name}` });
};

const parsers = inject<ComputedRef<(MinaPlayParserMetadata & { plugin: PluginControl })[]>>('parsers');
const parser = computed(() => {
  return (parsers?.value ?? []).find(
    ({ name, plugin }) => name === route.params.parserId && plugin.id === route.params.pluginId,
  );
});

const seriesLoader = useAxiosRequest(async () => {
  return api.Plugin.getParserSeries(parser.value!.plugin.id, parser.value!.name, route.params.seriesId as string)();
});
const { data: series, onResolved: onSeriesLoaded, onRejected: onSeriesLoadFailed } = seriesLoader;
onSeriesLoaded(async (data) => {
  if (!data.name || !data.id) {
    await router.replace({ path: '/404' });
  }

  await getSubscribe();
});
onSeriesLoadFailed(async () => {
  await router.replace({ path: '/404' });
});

const {
  data: subscribe,
  request: getSubscribe,
  pending: subscribeFetching,
  onResolved: onSubscribeFetched,
} = useAxiosRequest(async () => {
  return await api.Plugin.getParserSeriesSubscribe(
    parser.value!.plugin.id,
    parser.value!.name,
    route.params.seriesId as string,
  )();
});
onSubscribeFetched((data) => {
  seriesCreated.value = data.series != undefined;
  subscribeCreated.value = data.source != undefined && data.rule != undefined;
});

const subscribeCreated = ref(false);
const {
  request: createSubscribe,
  pending: subscribeCreating,
  onResolved: onSubscribeCreated,
  onRejected: onSubscribeCreateFailed,
} = useAxiosRequest(async () => {
  return api.Plugin.createParserSeriesSubscribe(
    parser.value!.plugin.id,
    parser.value!.name,
    route.params.seriesId as string,
  )();
});
onSubscribeCreated((data) => {
  subscribeCreated.value = true;
  seriesCreated.value = true;
  subscribe.value = data;
});
onSubscribeCreateFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const seriesCreated = ref(false);
const {
  request: createSeries,
  pending: seriesCreating,
  onResolved: onSeriesCreated,
  onRejected: onSeriesCreateFailed,
} = useAxiosRequest(async () => {
  return api.Plugin.createParserSeriesSubscribe(
    parser.value!.plugin.id,
    parser.value!.name,
    route.params.seriesId as string,
  )({ seriesOnly: true });
});
onSeriesCreated(() => {
  seriesCreated.value = true;
});
onSeriesCreateFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const episodesLoader = useAxiosPageLoader(
  async (query) => {
    return api.Plugin.queryParserSeriesEpisode(
      parser.value!.plugin.id,
      parser.value!.name,
      route.params.seriesId as string,
    )(query);
  },
  { page: 0, size: 60 },
);
const { items: episodes } = episodesLoader;

const playingEpisode = ref<MinaPlayPluginSourceEpisode>();
const hasEpisode = (offset: number) => {
  const currentIndex = episodes.value.findIndex((value) => value === playingEpisode.value);
  return currentIndex === -1 ? false : currentIndex + offset in episodes.value;
};
const toEpisode = async (offset: number) => {
  const currentIndex = episodes.value.findIndex((value) => value === playingEpisode.value);
  if (currentIndex + offset in episodes.value) {
    playingEpisode.value = episodes.value[currentIndex + offset];
  }
};
const toTop = inject<Function>('toTop');
const switchEpisode = (episode: MinaPlayPluginSourceEpisode) => {
  playingEpisode.value = episode;
  nextTick(() => {
    toTop?.();
  });
};

const {
  request: createDownloadTask,
  pending: downloadTaskCreating,
  onResolved: onDownloadTaskCreated,
  onRejected: onDownloadTaskCreateFailed,
} = useAxiosRequest(async (url: string, name?: string) => {
  return await api.Download.create({
    url,
    name,
    ...(subscribe.value?.source ? { sourceId: subscribe.value.source.id } : {}),
  });
});
onDownloadTaskCreated(() => {
  toast.toastSuccess(t('source.raw.downloadCreated'));
});
onDownloadTaskCreateFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});
</script>

<style scoped lang="sass"></style>
