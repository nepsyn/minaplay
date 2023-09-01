<script setup lang="ts">
import { useApp } from '@/store/app';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { computed, Ref, ref, watch } from 'vue';
import { Api } from '@/api/api';
import { EpisodeEntity, SeriesEntity } from '@/interfaces/series.interface';
import { ApiQueryDto } from '@/interfaces/common.interface';
import {
  mdiContentCopy,
  mdiDotsVertical,
  mdiMotionPlayOutline,
  mdiMultimedia,
  mdiPlaylistPlay,
  mdiViewComfy,
  mdiVlc,
} from '@mdi/js';
import SeriesCoverFallback from '@/assets/series_cover_fallback.jpg';
import ItemsProvider from '@/components/provider/ItemsProvider.vue';
import SingleItemProvider from '@/components/provider/SingleItemProvider.vue';
import VideoProvider from '@/components/provider/VideoProvider.vue';
import ActionBtn from '@/components/provider/ActionBtn.vue';
import ViewImg from '@/components/provider/ViewImg.vue';
import SeriesOverview from '@/components/resource/SeriesOverview.vue';

const app = useApp();
const route = useRoute();
const router = useRouter();
const display = useDisplay();

const episodeId = computed(() => Number(route.params.id));

const playerOptions = {
  controls: display.smAndUp.value
    ? ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'download', 'fullscreen']
    : ['play-large', 'play', 'progress', 'current-time', 'fullscreen'],
  autoplay: true,
};

const episode = ref<EpisodeEntity>(undefined as any);
const loadEpisode = async (done: any) => {
  try {
    const response = await Api.Episode.getById(episodeId.value)();
    const needReloadEpisodes = episode.value?.series?.id !== response.data.series?.id;
    episode.value = response.data;
    done('ok');

    if (needReloadEpisodes && episodesProvider.value) {
      episodesProvider.value.status = 'initial';
      episodesProvider.value.load();
    }
  } catch {
    app.toastError('获取单集信息失败');
    done('error');
  }
};

const episodesQuery: ApiQueryDto<EpisodeEntity> = {
  page: 0,
  size: 48,
  sort: 'createAt',
  order: 'ASC',
};
const episodes = ref<EpisodeEntity[]>([]);
const episodesTotal = ref(0);
const loadEpisodes = async (done: any) => {
  try {
    const response = await Api.Series.getEpisodesById(episode.value.series!.id)(episodesQuery);
    episodes.value.push(...response.data.items);
    episodesTotal.value = response.data.total;
    episodesQuery.page!++;
    done(episodes.value.length === episodesTotal.value ? 'empty' : 'ok');
  } catch {
    app.toastError('获取单集列表失败');
    done('error');
  }
};

const recommends = ref<SeriesEntity[]>([]);
const recommendsQuery: Ref<ApiQueryDto<EpisodeEntity>> = ref({
  page: 0,
  size: 12,
});
const loadRecommends = async (done: any) => {
  try {
    const response = await Api.Episode.queryUpdate(recommendsQuery.value);
    recommends.value.push(...response.data.items.map((episode) => episode.series!));
    recommendsQuery.value.page!++;
    done(recommends.value.length === response.data.total ? 'empty' : 'ok');
  } catch {
    app.toastError('获取推荐列表失败');
    done('error');
  }
};

const episodeProvider = ref(null as any);
const episodesProvider = ref(null as any);
watch(
  () => route.params,
  async (now, old) => {
    if (now?.id !== old?.id && now?.id !== undefined && route.name === 'episode') {
      if (episodeProvider.value) {
        episodeProvider.value.load();
      }
    }
  },
);

const actions = ref([
  {
    text: '复制链接',
    icon: mdiContentCopy,
    color: 'primary',
    href: undefined,
    click: () => {
      let path = Api.File.buildRawPath(episode.value.media.file!.id);
      if (path.startsWith('/')) {
        path = `${window.origin}${path}`;
      }
      app.copyContent(path, '复制链接成功', '复制链接失败');
    },
  },
  {
    text: 'VLC播放',
    icon: mdiVlc,
    color: 'warning',
    href: computed(() => {
      let path = Api.File.buildRawPath(episode.value.media.file!.id);
      if (path.startsWith('/')) {
        path = `${window.origin}${path}`;
      }
      return `vlc://${path}`;
    }),
    click: undefined,
  },
  {
    text: '一起看',
    icon: mdiMotionPlayOutline,
    color: 'secondary',
    href: undefined,
    click: undefined,
  },
]);
</script>

<template>
  <v-container fluid class="py-4 px-6 main-content">
    <v-row>
      <v-col cols="12" md="8">
        <single-item-provider ref="episodeProvider" :item="episode" :load-fn="loadEpisode">
          <v-responsive :aspect-ratio="16 / 9" max-height="520">
            <video-provider :media="episode.media" :options="playerOptions"></video-provider>
          </v-responsive>
          <v-container fluid class="pa-0 mt-4 d-flex flex-column">
            <span class="text-h5 text-wrap">{{ episode.title ?? episode.media.name }}</span>
            <v-container fluid class="pa-0 mt-1 d-flex flex-row align-center">
              <span class="mt-1 text-caption">上传于 {{ new Date(episode.createAt).toLocaleString() }}</span>
              <v-spacer></v-spacer>
              <div class="d-none d-sm-flex">
                <action-btn
                  v-for="(action, index) in actions"
                  :key="index"
                  :text="action.text"
                  :icon="action.icon"
                  :color="action.color"
                  variant="text"
                  size="small"
                  :href="action.href"
                  @click="action.click?.()"
                ></action-btn>
              </div>
              <v-menu location="bottom">
                <template #activator="{ props }">
                  <v-btn
                    variant="text"
                    class="d-flex d-sm-none"
                    :icon="mdiDotsVertical"
                    size="small"
                    v-bind="props"
                  ></v-btn>
                </template>
                <v-card>
                  <v-list class="pa-0" density="compact">
                    <v-list-item
                      v-for="(action, index) in actions"
                      :key="index"
                      :prepend-icon="action.icon"
                      :base-color="action.color"
                      :href="action.href!"
                      @click="action.click?.()"
                    >
                      {{ action.text }}
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-menu>
            </v-container>
            <v-divider class="my-2"></v-divider>
            <pre
              style="min-height: 100px"
              class="text-subtitle-2 font-weight-light text-pre-wrap text-break bg-transparent"
              v-text="episode.media.description ?? '暂无媒体描述'"
            ></pre>
          </v-container>
        </single-item-provider>
      </v-col>
      <v-col cols="12" md="4">
        <v-container fluid class="pa-0 mt-2" v-if="episode">
          <v-container fluid class="pa-0">
            <div class="pa-2 d-flex align-center">
              <v-icon :icon="mdiMultimedia" size="large"></v-icon>
              <span class="ms-2 text-h6">剧集详情</span>
            </div>
            <v-row class="px-2">
              <v-col cols="4" class="mt-1">
                <view-img
                  class="rounded"
                  :aspect-ratio="1 / 1.4"
                  :src="episode.series?.poster ? Api.File.buildRawPath(episode.series.poster.id) : SeriesCoverFallback"
                  :placeholder="SeriesCoverFallback"
                ></view-img>
              </v-col>
              <v-col sm="8" class="d-flex flex-column">
                <v-container fluid class="pa-0">
                  <span
                    class="py-0 text-h6 font-weight-bold text-break clickable series-title"
                    @click="router.push(`/series/${episode.series?.id}`)"
                  >
                    {{ episode.series.name }}
                  </span>
                  <div>
                    <v-chip
                      color="primary"
                      class="me-2 mt-1"
                      size="x-small"
                      v-for="(tag, index) in episode.series?.tags ?? []"
                      :key="index"
                      label
                      :text="tag.name"
                    ></v-chip>
                  </div>
                  <v-divider class="my-1"></v-divider>
                  <pre
                    style="min-height: 100px"
                    class="text-caption text-pre-wrap text-break bg-transparent"
                    v-text="episode.series?.description ?? '暂无剧集描述'"
                  ></pre>
                </v-container>
              </v-col>
            </v-row>
          </v-container>
        </v-container>
        <v-container fluid class="pa-0 mt-2">
          <items-provider
            ref="episodesProvider"
            class="pa-0"
            :load-fn="loadEpisodes"
            :items="episodes"
            :hide-empty="episodes.length > 0"
            lazy
          >
            <div class="pa-2 d-flex align-center">
              <v-icon :icon="mdiViewComfy" size="large"></v-icon>
              <span class="ms-2 text-h6">分集</span>
            </div>
            <v-container fluid class="pa-0 px-2">
              <v-btn
                v-for="(item, index) in episodes"
                :key="index"
                class="me-2 mt-1"
                variant="outlined"
                :color="episodeId === item.id ? 'primary' : undefined as any"
                :active="episodeId === item.id"
                :text="item.no || item.media.name"
                @click="router.push({ path: `/ep/${item.id}` })"
              ></v-btn>
            </v-container>
          </items-provider>
        </v-container>
        <v-container fluid class="pa-0 mt-2">
          <items-provider ref="recommendProvider" class="pa-0" :load-fn="loadRecommends" :items="recommends">
            <div class="pa-2 d-flex align-center">
              <v-icon :icon="mdiPlaylistPlay" size="large"></v-icon>
              <span class="ms-2 text-h6">播放列表</span>
            </div>
            <v-row no-gutters>
              <template v-for="recommend in recommends" :key="recommend.id">
                <v-col cols="4" v-if="episode.series?.id !== recommend.id">
                  <series-overview
                    class="pa-2"
                    v-ripple
                    @click:content="router.push(`/series/${recommend.id}`)"
                    @click.right.prevent
                    :series="recommend"
                  ></series-overview>
                </v-col>
              </template>
            </v-row>
          </items-provider>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="sass">
.series-title
  transition: color 0.5s

.series-title:hover
  color: rgb(var(--v-theme-primary))
</style>
