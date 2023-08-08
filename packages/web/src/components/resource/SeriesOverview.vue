<script setup lang="ts">
import { SeriesEntity } from '@/interfaces/series.interface';
import { Api } from '@/api/api';
import SeriesCoverFallback from '@/assets/series_cover_fallback.jpg';

const props = defineProps<{
  series: SeriesEntity;
}>();

const emits = defineEmits(['click:content']);
</script>

<template>
  <v-container v-bind="props" fluid class="pa-0 d-flex flex-column justify-center">
    <v-img
      :aspect-ratio="1 / 1.4"
      cover
      :src="series.poster ? Api.File.buildRawPath(series.poster!.id) : SeriesCoverFallback"
      class="rounded-lg clickable"
      @click="(e) => emits('click:content', e)"
    >
      <template #placeholder>
        <v-img :src="SeriesCoverFallback"></v-img>
      </template>
    </v-img>

    <span
      @click="(e) => emits('click:content', e)"
      class="mt-2 clickable series-title font-weight-bold text-truncate text-center"
      :title="series.name"
    >
      {{ series.name }}
    </span>
  </v-container>
</template>

<style scoped lang="sass">
.series-title
  overflow: hidden
  font-size: 1rem
  line-height: 1.5rem
  transition: color 0.5s

.series-title:hover
  color: rgb(var(--v-theme-primary))
</style>
