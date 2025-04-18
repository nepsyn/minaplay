<template>
  <to-top-container class="page-height overflow-auto">
    <v-container fluid class="d-flex flex-column pa-md-12">
      <v-row>
        <v-col cols="12" md="8">
          <single-item-loader class="pa-0" :loader="isMedia ? mediaLoader : currentEpisodeLoader">
            <v-responsive class="rounded-lg" :aspect-ratio="16 / 9" max-height="520">
              <video-player
                ref="playerRef"
                :position="position && position / 1000"
                :src="media?.file && api.File.buildRawPath(media.file)"
                :poster="media?.poster && api.File.buildRawPath(media.poster)"
                :subtitles="subtitles"
                :fonts="fonts"
              ></video-player>
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
                  :disabled="!hasEpisode(-1)"
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
                <div :id="action.id" v-for="action in actions" :key="action.id">
                  <v-tooltip location="bottom">
                    {{ action.text }}
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        density="comfortable"
                        size="small"
                        :color="action.color"
                        :icon="action.icon"
                        @click="action.click?.()"
                        variant="text"
                      ></v-btn>
                    </template>
                  </v-tooltip>
                </div>
                <component
                  :is="display.smAndUp.value ? VMenu : VBottomSheet"
                  close-on-content-click
                  activator="#openInPlayer"
                  location="top center"
                >
                  <v-card>
                    <v-card-text>
                      <v-list-subheader class="font-weight-bold">
                        {{ t('resource.actions.openInPlayer') }}
                      </v-list-subheader>
                      <v-row class="pa-0" dense>
                        <v-col cols="auto" v-for="app in playerApps">
                          <v-tooltip location="top">
                            {{ app.name }}
                            <template #activator="{ props }">
                              <v-btn
                                v-bind="props"
                                variant="text"
                                size="x-small"
                                stacked
                                :href="app.buildHref(getFullUrl(api.File.buildRawPath(media!.file!)))"
                              >
                                <v-img :src="app.icon" cover width="32" height="32"></v-img>
                              </v-btn>
                            </template>
                          </v-tooltip>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
                </component>
                <v-menu activator="#live" location="top center">
                  <v-card>
                    <v-card-text>
                      <v-list-subheader class="font-weight-bold">
                        {{ t('resource.actions.play') }}
                      </v-list-subheader>
                      <v-btn
                        variant="tonal"
                        color="primary"
                        :prepend-icon="mdiVideoVintage"
                        @click="liveSelectDialog = true"
                      >
                        {{ t('app.actions.select') }} {{ t('app.entities.live') }}
                      </v-btn>
                      <v-list-subheader class="font-weight-bold">
                        {{ t('app.or') }}
                      </v-list-subheader>
                      <v-btn variant="tonal" color="success" :prepend-icon="mdiPlus" @click="createLive()">
                        {{ t('app.actions.add') }} {{ t('app.entities.live') }}
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-menu>
                <live-selector
                  owner
                  v-model="liveSelectDialog"
                  @selected="
                    (live: LiveEntity) =>
                      router.push({ path: `/live/${live.id}`, query: { ep: currentEpisode?.id, media: media?.id } })
                  "
                ></live-selector>
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
              <span class="text-h6 ms-3">{{ t('resource.recommendMedias') }}</span>
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
                <span class="text-h6 ms-3">{{ t('resource.episodes') }}</span>
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
                <span class="text-h6 ms-3">{{ t('resource.information') }}</span>
              </div>
              <single-item-loader class="px-0 py-3" :loader="currentEpisodeLoader">
                <v-row>
                  <v-col cols="4">
                    <zoom-img
                      class="rounded-lg"
                      :aspect-ratio="1 / 1.4"
                      :src="
                        currentEpisode?.series?.poster
                          ? api.File.buildRawPath(currentEpisode.series.poster)
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
                      {{
                        +currentEpisode?.series.season
                          ? t('series.seasonLabel', { season: currentEpisode?.series.season })
                          : currentEpisode?.series.season
                      }}
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
              <span class="text-h6 ms-3">{{ t('resource.recommendSeries') }}</span>
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
  mdiOpenInNew,
  mdiPlus,
  mdiVideoVintage,
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
import LiveSelector from '@/components/live/LiveSelector.vue';
import { LiveEntity } from '@/api/interfaces/live.interface';
import { useSettingsStore } from '@/store/settings';
import VlcImg from '@/assets/vlc.svg';
import PotPlayerImg from '@/assets/potplayer.webp';
import MxPlayerImg from '@/assets/mxplayer.webp';
import MxPlayerProImg from '@/assets/mxplayer-pro.webp';
import { VBottomSheet, VMenu } from 'vuetify/components';
import { useDisplay } from 'vuetify';

const { t, locale } = useI18n();
const api = useApiStore();
const route = useRoute();
const router = useRouter();
const display = useDisplay();
const toast = useToastStore();
const { settings } = useSettingsStore();

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
const subtitles = computed(() => {
  return (media.value?.attachments ?? [])
    .filter(({ name }) => {
      const ext = name.slice(name.lastIndexOf('.'), name.length).toLowerCase();
      return ['.ass', '.ssa'].includes(ext);
    })
    .map((file) => {
      const lastIndex = file.name.lastIndexOf('.');
      const title = file.name.slice(0, lastIndex > -1 ? lastIndex : file.name.length);
      return {
        title,
        url: api.File.buildRawPath(file),
      };
    });
});
const fonts = computed(() => {
  return (media.value?.attachments ?? [])
    .filter(({ name }) => {
      const ext = name.slice(name.lastIndexOf('.'), name.length).toLowerCase();
      return ['.otf', '.ttf', '.woff'].includes(ext);
    })
    .map((file) => api.File.buildRawPath(file));
});
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
      sort: 'createAt:DESC',
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
      sort: ['pubAt:ASC', 'no:ASC'],
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

const playerRef = ref<typeof VideoPlayer>();
const position = ref<number>();
const watchTimeStart = ref(0);
const onResourceReady = async () => {
  if (!settings.autoContinue) {
    return;
  }

  watchTimeStart.value = Date.now();
  try {
    if (media.value) {
      const { data } = await api.Media.findHistory(media.value.id)();
      if (data.progress) {
        if (
          media.value.duration &&
          data.progress / 1000 > media.value.duration * 0.1 &&
          data.progress / 1000 < media.value.duration * 0.9
        ) {
          position.value = data.progress;
          toast.toastSuccess(t('resource.continuePlay'));
        }
      }
    }
  } catch {}
};
mediaLoader.onResolved(onResourceReady);
currentEpisodeLoader.onResolved(onResourceReady);
onBeforeRouteLeave(async () => {
  if ((Date.now() - watchTimeStart.value) / 1000 >= 10) {
    try {
      const progress = playerRef.value?.player?.currentTime;
      await api.Media.addHistory(media.value!.id)({
        progress: progress && Math.round(progress * 1000),
        episodeId: currentEpisode.value?.id ?? null,
      });
    } catch {}
  }
});

const actions = [
  {
    id: 'copy',
    text: t('resource.actions.copy'),
    icon: mdiContentCopy,
    color: 'info',
    click: () => {
      if (media.value) {
        let path = getFullUrl(api.File.buildRawPath(media.value.file!));
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
    id: 'openInPlayer',
    text: t('resource.actions.openInPlayer'),
    icon: mdiOpenInNew,
    color: 'warning',
  },
  {
    id: 'live',
    text: t('resource.actions.play'),
    icon: mdiMotionPlayOutline,
    color: 'secondary',
  },
];
const playerApps = [
  {
    name: 'Pot Player',
    icon: PotPlayerImg,
    buildHref: (src: string) => `potplayer://${src}`,
    color: '#F9A825',
  },
  {
    name: 'VLC',
    icon: VlcImg,
    buildHref: (src: string) => `vlc://${src}`,
    color: 'warning',
  },
  {
    name: 'MX Player',
    icon: MxPlayerImg,
    buildHref: (src: string) =>
      `intent:${src}#Intent;package=com.mxtech.videoplayer.ad;S.title=${media.value?.file?.name};end`,
    color: 'primary',
  },
  {
    name: 'MX Player Pro',
    icon: MxPlayerProImg,
    buildHref: (src: string) =>
      `intent:${src}#Intent;package=com.mxtech.videoplayer.pro;S.title=${media.value?.file?.name};end`,
    color: 'primary',
  },
];

const liveSelectDialog = ref(false);
const {
  request: createLive,
  onResolved: onCreated,
  onRejected: onCreateFailed,
} = useAxiosRequest(async () => {
  return await api.Live.create({
    title: t('live.unnamed'),
  });
});
onCreated(async (data) => {
  await router.push({ path: `/live/${data.id}`, query: { ep: currentEpisode.value?.id, media: media.value?.id } });
});
onCreateFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});
</script>

<style scoped lang="sass">
.series-title
  transition: color 0.5s

.series-title:hover
  color: rgb(var(--v-theme-primary))
</style>
