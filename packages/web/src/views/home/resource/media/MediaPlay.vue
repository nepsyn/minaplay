<script setup lang="ts">
import { useApp } from '@/store/app';
import { useRoute, useRouter } from 'vue-router';
import { computed, ref, Ref, watch } from 'vue';
import SingleItemProvider from '@/components/provider/SingleItemProvider.vue';
import { MediaEntity, MediaQueryDto } from '@/interfaces/media.interface';
import { Api } from '@/api/api';
import ToTopContainer from '@/components/provider/ToTopContainer.vue';
import { mdiInformationVariantCircleOutline, mdiMotionPlayOutline, mdiPlaylistPlay } from '@mdi/js';
import VideoProvider from '@/components/provider/VideoProvider.vue';
import Plyr from 'plyr';
import { useDisplay } from 'vuetify';
import MediaOverviewLandscape from '@/components/resource/MediaOverviewLandscape.vue';
import ItemsProvider from '@/components/provider/ItemsProvider.vue';

const app = useApp();
const route = useRoute();
const router = useRouter();
const display = useDisplay();

const mediaId = computed(() => String(route.params.id));

const media: Ref<MediaEntity> = ref(undefined as any);
const playerOptions: Plyr.Options = {
  controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'download', 'fullscreen'],
  autoplay: true,
};
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

const tab = ref(0);

const recommends = ref<MediaEntity[]>([]);
const recommendsWithOutCurrent = computed(() => {
  return recommends.value.filter(({ id }) => id !== media.value?.id);
});
const recommendsQuery: Ref<MediaQueryDto> = ref({
  page: 0,
  size: 10,
  sort: 'createAt',
  order: 'DESC',
});
const resetRecommends = () => {
  recommends.value = [];
  recommendsQuery.value.page = 0;
};
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
    if (old?.id !== now.id && now.id !== undefined) {
      resetRecommends();

      if (mediaProvider.value) {
        mediaProvider.value.status = 'initial';
        mediaProvider.value.load();
      }
      if (recommendProvider.value) {
        recommendProvider.value.load();
      }
    }
  },
);
</script>

<template>
  <v-container fluid class="pa-0 main-content d-flex flex-column">
    <to-top-container class="scrollable-container">
      <v-container fluid class="py-4 px-6">
        <v-row>
          <v-col :cols="display.smAndUp.value ? 8 : 12">
            <single-item-provider ref="mediaProvider" :item="media" :load-fn="loadMedia">
              <v-responsive :aspect-ratio="16 / 9" max-height="520">
                <video-provider :media="media" :options="playerOptions"></video-provider>
              </v-responsive>
              <v-container fluid class="pa-0 mt-4 d-flex flex-column">
                <span class="text-h5 text-wrap">{{ media.name }}</span>
                <v-container fluid class="pa-0 d-flex flex-row align-center">
                  <span class="mt-1 text-caption">上传于 {{ new Date(media.createAt).toLocaleString() }}</span>
                  <v-spacer></v-spacer>
                  <v-btn :prepend-icon="mdiMotionPlayOutline" variant="text" color="secondary">一起看</v-btn>
                </v-container>
                <v-divider class="my-2"></v-divider>
                <pre class="text-subtitle-2 font-weight-light">{{ media.description ?? '暂无无媒体描述' }}</pre>
              </v-container>
            </single-item-provider>
          </v-col>
          <v-col :cols="display.smAndUp.value ? 4 : 12">
            <v-container fluid class="pa-0 mt-2">
              <v-divider class="py-0"></v-divider>
              <v-tabs v-model="tab" fixed-tabs color="primary">
                <v-tab value="0" :prepend-icon="mdiPlaylistPlay">播放列表</v-tab>
                <v-tab value="1" :prepend-icon="mdiInformationVariantCircleOutline">媒体信息</v-tab>
              </v-tabs>
              <v-divider class="py-0"></v-divider>
              <v-window v-model="tab" class="pb-6">
                <v-window-item value="0">
                  <items-provider ref="recommendProvider" class="pa-0" :load-fn="loadRecommends" :items="recommends">
                    <media-overview-landscape
                      v-for="recommend in recommendsWithOutCurrent"
                      class="pa-2"
                      v-ripple
                      :media="recommend"
                      @click:content="router.push(`/media/${recommend.id}`)"
                      @click.right.prevent
                    ></media-overview-landscape>
                  </items-provider>
                </v-window-item>
                <v-window-item value="1">info</v-window-item>
              </v-window>
            </v-container>
          </v-col>
        </v-row>
      </v-container>
    </to-top-container>
  </v-container>
</template>

<style scoped lang="sass"></style>
