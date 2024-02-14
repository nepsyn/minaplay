<template>
  <to-top-container class="page-height overflow-auto">
    <v-container fluid class="d-flex flex-column pa-md-12">
      <v-row>
        <v-col cols="12" md="8">
          <single-item-loader class="pa-0" :loader="isMedia ? mediaLoader : currentEpisodeLoader">
            <v-responsive class="rounded-lg" :aspect-ratio="16 / 9" max-height="520">
              <video-player ref="playerRef" :duration="duration" :media="media!"></video-player>
            </v-responsive>
            <v-container fluid class="pa-0 mt-4 d-flex flex-column">
              <span v-if="isMedia" class="text-h6 text-wrap">{{ media!.name }}</span>
              <div v-else class="text-h6 d-flex justify-space-between align-center">
                <v-btn
                  variant="flat"
                  size="small"
                  color="info"
                  :prepend-icon="mdiArrowLeft"
                  @click="toEpisode(-1)"
                  :disabled="!hasEpisode(1)"
                >
                  {{ t('resource.episode.previous') }}
                </v-btn>
                <span class="text-h6 px-2 text-truncate">
                  {{ currentEpisode?.no ?? currentEpisode?.title ?? media?.name }}
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
              <v-container fluid class="pa-0 mt-2 d-flex flex-row align-center">
                <span class="text-caption">
                  {{ new Date(media!.createAt).toLocaleString(locale) }}
                </span>
                <v-spacer></v-spacer>
                <div v-for="(action, index) in actions" :key="index">
                  <v-tooltip location="bottom">
                    {{ action.text }}
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        density="comfortable"
                        size="small"
                        :color="action.color"
                        :icon="action.icon"
                        @click="action.click()"
                        variant="text"
                      ></v-btn>
                    </template>
                  </v-tooltip>
                </div>
              </v-container>
              <v-divider class="my-2"></v-divider>
              <pre
                class="text-body-2 text-pre-wrap text-break bg-transparent"
                v-text="media!.description ?? t('resource.noDescription')"
              ></pre>
            </v-container>
          </single-item-loader>
        </v-col>
        <v-col cols="12" md="4">
          <div class="pb-2" v-if="isMedia">
            <div class="d-flex align-center">
              <v-icon :icon="mdiMultimedia" size="large"></v-icon>
              <span class="text-h6 ml-3">{{ t('resource.medias') }}</span>
            </div>
            <multi-items-loader class="px-0 py-3" :loader="recommendsLoader" :hide-empty="recommends.length > 0" auto>
              <template #empty>
                <v-container class="d-flex flex-column justify-center align-center text-body-2">
                  <span class="text-medium-emphasis"> {{ t('app.loader.empty') }} </span>
                </v-container>
              </template>
              <media-overview-landscape
                v-for="recommend in recommends"
                :key="recommend.id"
                @click="router.push({ path: `/media/${recommend.id}` })"
                class="mb-3"
                :media="recommend"
              ></media-overview-landscape>
            </multi-items-loader>
          </div>
          <div class="d-flex flex-column flex-sm-column-reverse">
            <div class="pb-2" v-if="!isMedia">
              <div class="d-flex align-center">
                <v-icon :icon="mdiViewComfy" size="large"></v-icon>
                <span class="text-h6 ml-3">{{ t('resource.episodes') }}</span>
              </div>
              <multi-items-loader class="px-0 py-3" :loader="episodesLoader" :hide-empty="episodes.length > 0" lazy>
                <v-row dense>
                  <v-col v-for="(item, index) in episodes" :key="item.id" cols="auto">
                    <v-btn
                      class="text-truncate"
                      variant="outlined"
                      :active="item.id === currentEpisode?.id"
                      :color="item.id === currentEpisode?.id ? 'primary' : undefined"
                      @click="router.push({ path: `/episode/${item.id}` })"
                    >
                      {{ item.no ?? index + 1 }}
                    </v-btn>
                  </v-col>
                </v-row>
              </multi-items-loader>
            </div>
            <div class="pb-2" v-if="!isMedia">
              <div class="d-flex align-center">
                <v-icon :icon="mdiInformationVariantCircleOutline" size="large"></v-icon>
                <span class="text-h6 ml-3">{{ t('resource.information') }}</span>
              </div>
              <single-item-loader class="px-0 py-3" :loader="currentEpisodeLoader">
                <v-row>
                  <v-col cols="4">
                    <zoom-img
                      class="rounded-lg"
                      :aspect-ratio="1 / 1.4"
                      :src="
                        currentEpisode?.series?.poster
                          ? api.File.buildRawPath(currentEpisode.series.poster.id, currentEpisode.series.poster.name)
                          : SeriesPosterFallback
                      "
                      :placeholder="SeriesPosterFallback"
                    ></zoom-img>
                  </v-col>
                  <v-col cols="8" class="d-flex flex-column">
                    <span
                      class="text-body-1 font-weight-bold text-break cursor-pointer series-title"
                      @click="router.push({ path: `/series/${currentEpisode?.series.id}` })"
                    >
                      {{ currentEpisode?.series.name }}
                    </span>
                    <span
                      v-if="currentEpisode?.series.season"
                      class="text-body-2 text-medium-emphasis text-break cursor-pointer"
                    >
                      {{ t('series.seasonLabel', { season: currentEpisode?.series.season }) }}
                    </span>
                    <v-divider class="my-1"></v-divider>
                    <expandable-text
                      :content="currentEpisode?.series?.description ?? t('resource.noDescription')"
                      class="text-body-2"
                    ></expandable-text>
                  </v-col>
                </v-row>
              </single-item-loader>
            </div>
          </div>
          <div class="pb-2" v-if="!isMedia">
            <div class="d-flex align-center">
              <v-icon :icon="mdiMultimedia" size="large"></v-icon>
              <span class="text-h6 ml-3">{{ t('resource.series') }}</span>
            </div>
            <multi-items-loader class="px-0 py-3" :loader="seriesLoader" :hide-empty="series.length > 0">
              <template #empty>
                <v-container class="d-flex flex-column justify-center align-center text-body-2">
                  <span class="text-medium-emphasis"> {{ t('app.loader.empty') }} </span>
                </v-container>
              </template>
              <v-row dense>
                <v-col v-for="item in series" :key="item.id" cols="4">
                  <series-overview
                    @click="router.push({ path: `/series/${item.id}` })"
                    :series="item"
                  ></series-overview>
                </v-col>
              </v-row>
            </multi-items-loader>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </to-top-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import { useApiStore } from '@/store/api';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { computed, ref } from 'vue';
import SingleItemLoader from '@/components/app/SingleItemLoader.vue';
import VideoPlayer from '@/components/app/VideoPlayer.vue';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import {
  mdiArrowLeft,
  mdiArrowRight,
  mdiContentCopy,
  mdiInformationVariantCircleOutline,
  mdiMotionPlayOutline,
  mdiMultimedia,
  mdiViewComfy,
} from '@mdi/js';
import MediaOverviewLandscape from '@/components/resource/MediaOverviewLandscape.vue';
import SeriesPosterFallback from '@/assets/banner-portrait.jpeg';
import { copyContent, getFullUrl } from '@/utils/utils';
import { useToastStore } from '@/store/toast';
import { EpisodeEntity, SeriesQueryDto } from '@/api/interfaces/series.interface';
import { MediaEntity } from '@/api/interfaces/media.interface';
import ZoomImg from '@/components/app/ZoomImg.vue';
import ExpandableText from '@/components/app/ExpandableText.vue';
import SeriesOverview from '@/components/resource/SeriesOverview.vue';

const { t, locale } = useI18n();
const api = useApiStore();
const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const isMedia = computed(() => route.name === 'media');
const mediaLoader = useAxiosRequest(async (id?: string) => {
  return await api.Media.getById(id ?? String(route.params.mediaId))();
});
const currentEpisodeLoader = useAxiosRequest(async (id?: number) => {
  return await api.Episode.getById(id ?? Number(route.params.episodeId))();
});
const media = computed<MediaEntity | undefined>(() =>
  isMedia.value ? mediaLoader.data.value : currentEpisodeLoader.data.value?.media,
);
const currentEpisode = computed<EpisodeEntity | undefined>(() => currentEpisodeLoader.data.value);
onBeforeRouteUpdate(async (to, from) => {
  if (to.name === 'media' && to.params.mediaId !== from.params.mediaId) {
    await mediaLoader.request(String(to.params.mediaId));
  } else if (to.name === 'episode' && to.params.episodeId !== from.params.episodeId) {
    await currentEpisodeLoader.request(Number(to.params.episodeId));
  }
});

const hasEpisode = (offset: number) => {
  const currentIndex = episodes.value.findIndex((value) => value.id === currentEpisode.value?.id);
  return currentIndex === -1 ? false : currentIndex + offset in episodes.value;
};
const toEpisode = async (offset: number) => {
  const currentIndex = episodes.value.findIndex((value) => value.id === currentEpisode.value?.id);
  if (currentIndex + offset in episodes.value) {
    await router.push({ path: `/episode/${episodes.value[currentIndex + offset].id}` });
  }
};

const recommendsLoader = useAxiosPageLoader(
  async (query = {}) => {
    return await api.Media.query({
      ...query,
      sort: 'createAt',
      order: 'DESC',
    });
  },
  { page: 0, size: 12 },
);
const recommends = computed(() => {
  return (recommendsLoader.items.value ?? []).filter((media) => media.id !== route.params.mediaId);
});

const episodesLoader = useAxiosPageLoader(
  async (query = {}) => {
    return await api.Episode.query({
      ...query,
      seriesId: currentEpisode.value?.series.id,
      sort: 'pubAt',
      order: 'ASC',
    });
  },
  { page: 0, size: 24 },
);
const { items: episodes } = episodesLoader;
currentEpisodeLoader.onResolved(() => {
  if (!episodesLoader.loaded.value) {
    episodesLoader.request();
  }
});

const seriesLoader = useAxiosPageLoader(
  async (query: SeriesQueryDto = {}) => {
    return await api.Series.query(query);
  },
  { page: 0, size: 12 },
);
const series = computed(() => {
  return (seriesLoader.items.value ?? []).filter((series) => series.id !== currentEpisode.value?.series?.id);
});

const playerRef = ref<typeof VideoPlayer | undefined>(undefined);
const duration = ref<number | undefined>(undefined);
const onResourceReady = async () => {
  try {
    if (media.value) {
      const { data } = await api.Media.findHistory(media.value.id)();
      if (data.progress) {
        duration.value = data.progress;
        toast.toastSuccess(t('resource.continuePlay'));
      }
    }
  } catch {}
};
mediaLoader.onResolved(onResourceReady);
currentEpisodeLoader.onResolved(onResourceReady);
onBeforeRouteLeave(async () => {
  try {
    const progress = playerRef.value?.player?.currentTime;
    await api.Media.addHistory(media.value!.id)({
      progress: progress && Math.round(progress * 1000),
      episodeId: currentEpisode.value?.id ?? null,
    });
  } catch {}
});

const actions = [
  {
    text: t('resource.actions.copy'),
    icon: mdiContentCopy,
    color: 'info',
    click: () => {
      if (media.value) {
        let path = getFullUrl(api.File.buildRawPath(media.value.file!.id, media.value.file!.name));
        copyContent(path)
          .then(() => {
            toast.toastSuccess(t('utils.copied'));
          })
          .catch(() => {
            toast.toastError(t('utils.copyFailed'));
          });
      }
    },
  },
  {
    text: t('resource.actions.openInVLC'),
    icon: 'M12,1C11.58,1 11.19,1.23 11,1.75L9.88,4.88C10.36,5.4 11.28,5.5 12,5.5C12.72,5.5 13.64,5.4 14.13,4.88L13,1.75C12.82,1.25 12.42,1 12,1M8.44,8.91L7,12.91C8.07,14.27 10.26,14.5 12,14.5C13.74,14.5 15.93,14.27 17,12.91L15.56,8.91C14.76,9.83 13.24,10 12,10C10.76,10 9.24,9.83 8.44,8.91M5.44,15C4.62,15 3.76,15.65 3.53,16.44L2.06,21.56C1.84,22.35 2.3,23 3.13,23H20.88C21.7,23 22.16,22.35 21.94,21.56L20.47,16.44C20.24,15.65 19.38,15 18.56,15H17.75L18.09,15.97C18.21,16.29 18.29,16.69 18.09,16.97C16.84,18.7 14.14,19 12,19C9.86,19 7.16,18.7 5.91,16.97C5.71,16.69 5.79,16.29 5.91,15.97L6.25,15H5.44Z',
    color: 'warning',
    click: () => {
      if (media.value) {
        let path = getFullUrl(api.File.buildRawPath(media.value.file!.id, media.value.file!.name));
        const a = document.createElement('a');
        a.href = `vlc://${path}`;
        a.click();
      }
    },
  },
  {
    text: t('resource.actions.play'),
    icon: mdiMotionPlayOutline,
    color: 'secondary',
    click: () => {
      //
    },
  },
];
</script>

<style scoped lang="sass">
.series-title
  transition: color 0.5s

.series-title:hover
  color: rgb(var(--v-theme-primary))
</style>
