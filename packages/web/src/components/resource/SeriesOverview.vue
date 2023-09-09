<script setup lang="ts">
import { SeriesEntity } from '@/interfaces/series.interface';
import { Api } from '@/api/api';
import SeriesCoverFallback from '@/assets/series_cover_fallback.jpg';

const props = defineProps<{
  series: SeriesEntity;
  label?: string;
  note?: string;
}>();

const emits = defineEmits(['click:content']);
</script>

<template>
  <v-container v-bind="props" fluid class="pa-0 d-flex flex-column justify-center position-relative">
    <div class="position-relative">
      <v-img
        :aspect-ratio="1 / 1.4"
        cover
        :src="series.poster ? Api.File.buildRawPath(series.poster!.id) : SeriesCoverFallback"
        class="rounded-lg clickable"
        @click="(e) => emits('click:content', e)"
      >
        <template #placeholder>
          <v-img :src="SeriesCoverFallback" cover></v-img>
        </template>
      </v-img>
      <div
        v-if="note"
        @click.stop="(e) => emits('click:content', e)"
        class="position-absolute d-flex w-100 justify-center align-center pa-1 text-caption font-weight-bold rounded-b-lg text-break text-wrap note-container clickable"
      >
        更新至{{ note }}
      </div>
    </div>

    <span
      @click="(e) => emits('click:content', e)"
      class="mt-2 clickable series-title font-weight-bold text-truncate text-center"
      :title="series.name"
    >
      {{ series.name }}
    </span>

    <div
      v-if="label"
      @click.stop="(e) => emits('click:content', e)"
      class="position-absolute d-flex justify-end ma-2 pa-1 text-caption bg-error rounded-te-lg rounded-bs clickable label-container"
    >
      {{ label }}
    </div>
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

.note-container
  bottom: 0
  left: 0
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.4) 100%)
  color: white
  min-height: 15%

.label-container
  top: 0
  right: 0
</style>
