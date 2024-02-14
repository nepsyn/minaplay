<template>
  <v-container fluid class="d-flex flex-column rounded-lg pa-0 cursor-pointer media-container">
    <div class="position-relative">
      <v-img
        :aspect-ratio="16 / 9"
        cover
        :src="media.poster ? api.File.buildRawPath(media.poster.id, media.poster.name) : MediaPosterFallback"
        class="media-img rounded-lg"
      >
        <template #placeholder>
          <v-img :src="MediaPosterFallback" cover></v-img>
        </template>
      </v-img>

      <div
        v-if="historyDuration && media.duration"
        class="position-absolute d-flex align-end w-100 h-100 rounded-b-lg overflow-hidden progress-container"
      >
        <v-progress-linear
          height="4"
          color="primary-lighten-1"
          :model-value="(historyDuration / 1000 / media.duration) * 100"
        ></v-progress-linear>
      </div>

      <div
        v-if="media.duration != null"
        class="position-absolute text-caption font-weight-bold duration-container mb-3 mr-3 px-2 rounded"
      >
        <template v-if="historyDuration != null">
          <span>{{ getDurationLabel(historyDuration / 1000) }}</span>
          <span> / </span>
        </template>
        <span>{{ getDurationLabel(media.duration) }}</span>
      </div>
    </div>

    <span class="mt-2 px-1 media-title font-weight-bold" :title="media.name">
      {{ media.name || media.file?.name }}
    </span>

    <div class="my-1 px-1 text-caption">
      <span>{{ t(`file.source.${media.file?.source ?? 'other'}`) }}</span>
      ·
      <time-ago :time="media.createAt"></time-ago>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { MediaEntity } from '@/api/interfaces/media.interface';
import { useApiStore } from '@/store/api';
import MediaPosterFallback from '@/assets/banner.jpeg';
import TimeAgo from '@/components/app/TimeAgo.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const api = useApiStore();

defineProps<{
  media: MediaEntity;
  historyDuration?: number;
}>();

const getDurationLabel = (duration?: number) => {
  if (duration == null) {
    return '--:--';
  }
  const minutes = `${Math.floor(duration / 60)}`.padStart(2, '0');
  const seconds = `${Math.floor(duration % 60)}`.padStart(2, '0');
  return `${minutes}:${seconds}`;
};
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

.media-img
  transition: box-shadow 0.3s

.media-container:hover .media-img
  box-shadow: 0 4px 10px #888888

.progress-container
  top: 0

.duration-container
  bottom: 0
  right: 0
  color: rgb(var(--v-theme-background))
  background-color: rgb(var(--v-theme-on-background), 0.6)
</style>
