<template>
  <v-container v-ripple fluid class="d-flex flex-column rounded-lg pa-0 clickable media-container">
    <v-img
      :aspect-ratio="16 / 9"
      cover
      :src="media.poster ? api.File.buildRawPath(media.poster.id, media.poster.name) : MediaCoverFallback"
      class="rounded-lg"
    >
      <template #placeholder>
        <v-img :src="MediaCoverFallback" cover></v-img>
      </template>
    </v-img>

    <span class="mt-2 px-1 media-title font-weight-bold" :title="media.name">
      {{ media.name }}
    </span>

    <div class="my-1 px-1 text-caption">
      <span>{{ t(`media.source.${media.file?.source ?? 'other'}`) }}</span>
      ·
      <time-ago :time="media.createAt"></time-ago>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { MediaEntity } from '@/api/interfaces/media.interface';
import { useApiStore } from '@/store/api';
import MediaCoverFallback from '@/assets/banner.jpeg';
import TimeAgo from '@/components/app/TimeAgo.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const api = useApiStore();

const props = defineProps<{
  media: MediaEntity;
}>();
</script>

<style scoped lang="sass">
.media-title
  display: -webkit-box
  overflow: hidden
  font-size: 1rem
  line-height: 1.5rem
  max-height: 3rem
  word-break: break-all
  text-overflow: ellipsis
  -webkit-box-orient: vertical
  -webkit-line-clamp: 2
  transition: color 0.5s

.media-container:hover .media-title
  color: rgb(var(--v-theme-primary))
</style>
