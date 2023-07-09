<script setup lang="ts">
import { useApp } from '@/store/app';
import { useRoute } from 'vue-router';
import { computed, ref, Ref } from 'vue';
import SingleItemProvider from '@/components/provider/SingleItemProvider.vue';
import { MediaEntity } from '@/interfaces/media.interface';
import { Api } from '@/api/api';
import ToTopContainer from '@/components/provider/ToTopContainer.vue';
import { mdiMotionPlayOutline } from '@mdi/js';
import VideoProvider from '@/components/provider/VideoProvider.vue';
import Plyr from 'plyr';
import MediaCoverFallback from '@/assets/media_cover_fallback.jpg';

const app = useApp();
const route = useRoute();

const mediaId = computed(() => String(route.params.id));

const media: Ref<MediaEntity> = ref(undefined as any);
const playerOptions: Plyr.Options = {
  controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
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
</script>

<template>
  <v-container fluid class="pa-0 main-content d-flex flex-column">
    <to-top-container class="scrollable-container">
      <v-container fluid class="py-4 px-6">
        <v-row>
          <v-col cols="8">
            <single-item-provider :item="media" :load-fn="loadMedia">
              <v-responsive :aspect-ratio="16 / 9" max-height="520">
                <video-provider
                  :src="Api.File.buildRawPath(media.file!.id)"
                  :poster="media.poster ? Api.File.buildRawPath(media.poster!.id) : MediaCoverFallback"
                  :options="playerOptions"
                ></video-provider>
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
        </v-row>
      </v-container>
    </to-top-container>
  </v-container>
</template>

<style scoped lang="sass"></style>
