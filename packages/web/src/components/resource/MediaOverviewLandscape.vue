<template>
  <v-container fluid class="rounded-lg pa-0 cursor-pointer media-container">
    <v-row no-gutters>
      <v-col cols="4">
        <div class="position-relative">
          <v-img
            :aspect-ratio="16 / 9"
            cover
            :src="media.poster ? api.File.buildRawPath(media.poster) : MediaCoverFallback"
            class="media-img rounded-lg"
          >
            <template #placeholder>
              <v-img :src="MediaCoverFallback" cover></v-img>
            </template>
          </v-img>

          <div
            v-if="historyDuration && media.duration"
            class="position-absolute d-flex align-end w-100 h-100 rounded-b-lg overflow-hidden progress-container"
          >
            <slot name="progress">
              <v-progress-linear
                height="4"
                color="primary-lighten-1"
                :model-value="(historyDuration / 1000 / media.duration) * 100"
              ></v-progress-linear>
            </slot>
          </div>

          <div
            v-if="media.duration != null"
            class="position-absolute text-caption font-weight-bold duration-container mb-2 mr-2 px-2 rounded"
          >
            <slot name="duration">
              <template v-if="historyDuration != null">
                <span>{{ getDurationLabel(historyDuration / 1000) }}</span>
                <span> / </span>
              </template>
              <span>{{ getDurationLabel(media.duration) }}</span>
            </slot>
          </div>
        </div>
      </v-col>
      <v-col cols="8">
        <v-container class="pa-0 d-flex flex-column h-100">
          <slot name="title">
            <span class="ml-2 px-1 media-title font-weight-bold" :title="media.name">
              {{ media.name || media.file?.name }}
            </span>
          </slot>
          <slot v-if="showChips" name="chips"></slot>
          <v-spacer></v-spacer>

          <slot name="append">
            <div class="ml-2 px-1 text-caption d-flex flex-column">
              <span>{{ t(`file.source.${media.file?.source ?? 'other'}`) }}</span>
              <span>
                {{ new Date(media.createAt).toLocaleString(locale) }}
              </span>
            </div>
          </slot>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { MediaEntity } from '@/api/interfaces/media.interface';
import MediaCoverFallback from '@/assets/banner.jpeg';
import { useApiStore } from '@/store/api';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();
const api = useApiStore();

withDefaults(
  defineProps<{
    media: MediaEntity;
    historyDuration?: number;
    showChips?: boolean;
  }>(),
  {
    showChips: true,
  },
);

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
  font-size: 0.9rem
  line-height: 1rem
  max-height: 2rem
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
