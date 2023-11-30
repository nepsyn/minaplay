<template>
  <v-container fluid class="rounded-lg pa-0 clickable media-container">
    <v-row no-gutters class="pa-0">
      <v-col cols="4">
        <v-img
          :aspect-ratio="16 / 9"
          cover
          :src="media.poster ? api.File.buildRawPath(media.poster.id, media.poster.name) : MediaCoverFallback"
          class="media-img rounded-lg"
        >
          <template #placeholder>
            <v-img :src="MediaCoverFallback" cover></v-img>
          </template>
        </v-img>
      </v-col>
      <v-col cols="8">
        <v-container class="pa-0 d-flex flex-column h-100">
          <span class="ml-2 px-1 media-title font-weight-bold" :title="media.name">
            {{ media.name }}
          </span>
          <v-spacer></v-spacer>
          <div class="ml-2 px-1 text-caption">
            <span>{{ t(`media.source.${media.file?.source ?? 'other'}`) }}</span>
            ·
            <time-ago :time="media.createAt"></time-ago>
          </div>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { MediaEntity } from '@/api/interfaces/media.interface';
import MediaCoverFallback from '@/assets/banner.jpeg';
import TimeAgo from '@/components/app/TimeAgo.vue';
import { useApiStore } from '@/store/api';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const api = useApiStore();

withDefaults(
  defineProps<{
    media: MediaEntity;
    showChips?: boolean;
  }>(),
  {
    showChips: true,
  },
);
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
</style>
