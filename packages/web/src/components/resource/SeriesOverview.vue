<template>
  <v-container
    fluid
    class="pa-0 d-flex flex-column justify-center position-relative rounded-lg cursor-pointer series-container"
  >
    <div class="position-relative">
      <v-img
        :aspect-ratio="1 / 1.4"
        cover
        :src="series.poster ? api.File.buildRawPath(series.poster) : SeriesCoverFallback"
        class="series-img rounded-lg"
      >
        <template #placeholder>
          <v-img :src="SeriesCoverFallback" cover></v-img>
        </template>
      </v-img>

      <div
        v-if="label"
        class="position-absolute d-flex justify-end pa-1 text-caption bg-error rounded-te-lg rounded-bs text-break text-wrap text-center cursor-pointer label-container"
      >
        {{ label }}
      </div>

      <div
        v-if="note"
        class="position-absolute d-flex w-100 justify-center align-center pa-1 text-caption font-weight-bold rounded-b-lg text-break text-wrap text-center note-container cursor-pointer"
      >
        {{ note }}
      </div>
    </div>

    <div class="mt-2 mb-1 px-1 cursor-pointer d-flex flex-column">
      <span class="series-title font-weight-bold text-truncate" :title="series.name">
        {{ series.name }}
      </span>
      <span v-if="series.season" class="text-caption text-medium-emphasis">
        {{ +series.season ? t('series.seasonLabel', { season: series.season }) : series.season }}
      </span>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { SeriesEntity } from '@/api/interfaces/series.interface';
import { useApiStore } from '@/store/api';
import SeriesCoverFallback from '@/assets/banner-portrait.jpeg';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const api = useApiStore();

defineProps<{
  series: SeriesEntity;
  label?: string;
  note?: string;
}>();
</script>

<style scoped lang="sass">
.series-title
  overflow: hidden
  font-size: 1rem
  line-height: 1.2rem
  transition: color 0.5s

.series-container:hover .series-title
  color: rgb(var(--v-theme-primary))

.note-container
  bottom: 0
  left: 0
  background: linear-gradient(to bottom, transparent 0%, rgb(0, 0, 0, 0.6) 100%)
  color: white
  min-height: 15%

.label-container
  top: 0
  right: 0
  max-width: 75%

.series-img
  transition: box-shadow 0.3s

.series-container:hover .series-img
  box-shadow: 0 4px 10px #888888
</style>
