<template>
  <to-top-container class="page-height overflow-auto">
    <no-plates v-if="settings.plates.length === 0"></no-plates>
    <v-container v-else class="d-flex flex-column py-md-12">
      <template v-for="(plate, index) in settings.plates" :key="index">
        <component :is="plateMap.get(plate)!"></component>
      </template>
    </v-container>
  </to-top-container>
</template>

<script lang="ts" setup>
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import SeriesUpdatesPlate from '@/components/resource/plates/SeriesUpdatesPlate.vue';
import MediaUpdatesPlate from '@/components/resource/plates/MediaUpdatesPlate.vue';
import HistoryPlate from '@/components/resource/plates/HistoryPlate.vue';
import { useSettingsStore } from '@/store/settings';
import NoPlates from '@/views/error/NoPlates.vue';

const { settings } = useSettingsStore();

const plateMap = new Map(
  Object.entries({
    'series-update': SeriesUpdatesPlate,
    history: HistoryPlate,
    'media-update': MediaUpdatesPlate,
  }),
);
</script>
