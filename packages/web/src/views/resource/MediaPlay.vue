<template>
  <to-top-container class="page-height overflow-auto">
    <v-container class="d-flex flex-column py-md-12">
      <v-row>
        <v-col cols="12" md="8">
          <single-item-loader class="pa-0" :loader="isMedia ? mediaLoader : currentEpisodeLoader">
            <v-responsive class="rounded-lg" :aspect-ratio="16 / 9" max-height="520">
              <video-player :media="media!"></video-player>
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
                <div v-for="(action, index) in actions" :key="index">
                  <v-btn
                    density="comfortable"
                    size="small"
                    :color="action.color"
                    :icon="action.icon"
                    @click="action.click()"
                    variant="text"
                  ></v-btn>
                  <v-tooltip location="bottom" activator="parent">{{ action.text }}</v-tooltip>
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
              <template v-for="recommend in recommends" :key="recommend.id">
                <media-overview-landscape
                  @click="router.push({ path: `/media/${recommend.id}` })"
                  v-if="recommend.id !== route.params.mediaId"
                  class="mb-3"
                  :media="recommend"
                ></media-overview-landscape>
              </template>
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
                      class="text-body-1 font-weight-bold text-break clickable series-title"
                      @click="router.push({ path: `/series/${currentEpisode?.series.id}` })"
                    >
                      {{ `${currentEpisode?.series.name} ${currentEpisode?.series.season ?? ''}`.trim() }}
                    </span>
                    <div>
                      <v-chip
                        color="primary"
                        class="mb-2 mt-1"
                        size="x-small"
                        v-for="(tag, index) in currentEpisode?.series?.tags ?? []"
                        :key="index"
                        label
                        :text="tag.name"
                      ></v-chip>
                    </div>
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
              <v-row>
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
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
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
  mdiVlc,
} from '@mdi/js';
import MediaOverviewLandscape from '@/components/resource/MediaOverviewLandscape.vue';
import SeriesPosterFallback from '@/assets/banner-portrait.jpeg';
import { copyContent } from '@/utils/utils';
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
const recommends = computed(() => recommendsLoader.items.value);

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
const episodes = computed<EpisodeEntity[]>(() => episodesLoader.items.value);
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
const series = computed(() => seriesLoader.items.value);

const actions = [
  {
    text: t('resource.actions.copy'),
    icon: mdiContentCopy,
    color: 'info',
    click: () => {
      if (media.value) {
        copyContent(api.File.buildRawPath(media.value.file!.id, media.value.file!.name))
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
    icon: mdiVlc,
    color: 'warning',
    click: () => {
      if (media.value) {
        let path = api.File.buildRawPath(media.value.file!.id, media.value.file!.name);
        if (path.startsWith('/')) {
          path = `${window.origin}${path}`;
        }
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
