<script setup lang="ts">
import { useApp } from '@/store/app';
import { useRoute } from 'vue-router';
import { computed, onMounted, ref, Ref, shallowRef } from 'vue';
import SingleItemProvider from '@/components/provider/SingleItemProvider.vue';
import { MediaEntity } from '@/interfaces/media.interface';
import { Api } from '@/api/api';
import Plyr from 'plyr';
import ToTopContainer from '@/components/provider/ToTopContainer.vue';

const app = useApp();
const route = useRoute();

const mediaId = computed(() => String(route.params.id));

const media: Ref<MediaEntity> = ref(undefined as any);
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

const player: Ref<Plyr> = shallowRef(null as any);
onMounted(() => {
  player.value = new Plyr('#video');
});
</script>

<template>
  <v-container fluid class="pa-0 main-content d-flex flex-column">
    <to-top-container class="scrollable-container">
      <v-container class="py-4 px-6">
        <v-row>
          <v-col cols="8">
            <single-item-provider :item="media" :load-fn="loadMedia">
              <v-container fluid class="pa-0 d-flex flex-column flex-wrap">
                <span :title="media.name" class="text-h5 text-truncate">{{ media.name }}</span>
                <span class="mt-1 text-caption">{{ new Date(media.createAt).toLocaleString() }}</span>
              </v-container>
              <v-responsive class="mt-4" :aspect-ratio="16 / 9" max-height="520">
                <video id="video" autoplay controls preload="auto" class="w-100">
                  <source :src="Api.File.buildRawPath(media.file!.id)" />
                </video>
              </v-responsive>
              <v-container fluid class="pa-0 mt-4 d-flex flex-column flex-wrap">
                <span class="text-body-1">{{ media.description ?? '暂无无媒体描述' }}</span>
              </v-container>
            </single-item-provider>
          </v-col>
        </v-row>
      </v-container>
    </to-top-container>
  </v-container>
</template>

<style scoped lang="sass"></style>
