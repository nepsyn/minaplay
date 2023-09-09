<script setup lang="ts">
import { useApp } from '@/store/app';
import { useRoute, useRouter } from 'vue-router';
import { computed, ref, Ref, watch } from 'vue';
import SingleItemProvider from '@/components/provider/SingleItemProvider.vue';
import { MediaEntity, MediaQueryDto } from '@/interfaces/media.interface';
import { Api } from '@/api/api';
import { mdiContentCopy, mdiMotionPlayOutline, mdiPlaylistPlay, mdiVlc } from '@mdi/js';
import VideoProvider from '@/components/provider/VideoProvider.vue';
import MediaOverviewLandscape from '@/components/resource/MediaOverviewLandscape.vue';
import ItemsProvider from '@/components/provider/ItemsProvider.vue';
import { useDisplay } from 'vuetify';
import MenuProvider from '@/components/provider/MenuProvider.vue';

const app = useApp();
const route = useRoute();
const router = useRouter();
const display = useDisplay();

const mediaId = computed(() => String(route.params.id));

const playerOptions = {
  controls: display.smAndUp.value
    ? ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'download', 'fullscreen']
    : ['play-large', 'play', 'progress', 'current-time', 'fullscreen'],
  autoplay: true,
};

const media = ref<MediaEntity>(undefined as any);
const loadMedia = async (done: any) => {
  try {
    const response = await Api.Media.getById(mediaId.value)();
    media.value = response.data;
    done('ok');
  } catch {
    app.toastError('获取媒体文件失败');
    done('error');
  }
};

const recommends = ref<MediaEntity[]>([]);
const recommendsQuery: Ref<MediaQueryDto> = ref({
  page: 0,
  size: 10,
  sort: 'createAt',
  order: 'DESC',
});
const loadRecommends = async (done: any) => {
  try {
    const response = await Api.Media.query(recommendsQuery.value);
    recommends.value.push(...response.data.items);
    recommendsQuery.value.page!++;
    done(recommends.value.length === response.data.total ? 'empty' : 'ok');
  } catch {
    app.toastError('获取推荐列表失败');
    done('error');
  }
};

const mediaProvider = ref(null as any);
const recommendProvider = ref(null as any);
watch(
  () => route.params,
  async (now, old) => {
    if (old?.id !== now.id && now.id !== undefined && route.name === 'media') {
      if (mediaProvider.value) {
        mediaProvider.value.load();
      }
    }
  },
);

const actions = [
  {
    text: '复制链接',
    icon: mdiContentCopy,
    color: 'primary',
    menu: undefined,
    show: (item: any) => true,
    click: () => {
      let path = Api.File.buildRawPath(media.value.file!.id);
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
    menu: undefined,
    show: (item: any) => true,
    click: () => {
      let path = Api.File.buildRawPath(media.value.file!.id);
      if (path.startsWith('/')) {
        path = `${window.origin}${path}`;
      }
      const a = document.createElement('a');
      a.href = `vlc://${path}`;
      a.click();
    },
  },
  {
    text: '一起看',
    icon: mdiMotionPlayOutline,
    color: 'secondary',
    menu: undefined,
    show: (item: any) => true,
    click: undefined,
  },
];
</script>

<template>
  <v-container fluid class="py-4 px-6 main-content">
    <v-row>
      <v-col cols="12" md="8">
        <single-item-provider ref="mediaProvider" :item="media" :load-fn="loadMedia">
          <v-responsive :aspect-ratio="16 / 9" max-height="520">
            <video-provider :media="media" :options="playerOptions"></video-provider>
          </v-responsive>
          <v-container fluid class="pa-0 mt-4 d-flex flex-column">
            <span class="text-h5 text-wrap">{{ media.name }}</span>
            <v-container fluid class="pa-0 mt-1 d-flex flex-row align-center">
              <span class="mt-1 text-caption">上传于 {{ new Date(media.createAt).toLocaleString() }}</span>
              <v-spacer></v-spacer>
              <menu-provider :actions="actions" :item="media" :boxed="display.smAndDown.value"></menu-provider>
            </v-container>
            <v-divider class="my-2"></v-divider>
            <pre
              style="min-height: 100px"
              class="text-subtitle-2 font-weight-light text-pre-wrap text-break bg-transparent"
              v-text="media.description ?? '暂无媒体描述'"
            ></pre>
          </v-container>
        </single-item-provider>
      </v-col>
      <v-col cols="12" md="4">
        <v-container fluid class="pa-0 mt-2">
          <items-provider ref="recommendProvider" class="pa-0" :load-fn="loadRecommends" :items="recommends">
            <div class="pa-2 d-flex align-center">
              <v-icon :icon="mdiPlaylistPlay" size="large"></v-icon>
              <span class="ms-2 text-h6">媒体列表</span>
            </div>
            <template v-for="recommend in recommends" :key="recommend.id">
              <media-overview-landscape
                v-if="mediaId !== recommend.id"
                class="pa-2"
                v-ripple
                :media="recommend"
                @click:content="router.push(`/media/${recommend.id}`)"
                @click.right.prevent
              ></media-overview-landscape>
            </template>
          </items-provider>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="sass"></style>
