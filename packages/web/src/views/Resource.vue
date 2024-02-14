<template>
  <to-top-container class="page-height overflow-auto">
    <v-container class="d-flex flex-column py-md-12">
      <series-updates-plate></series-updates-plate>
      <history-plate></history-plate>
      <media-updates-plate></media-updates-plate>
    </v-container>
  </to-top-container>
</template>

<script lang="ts" setup>
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import SeriesUpdatesPlate from '@/components/resource/SeriesUpdatesPlate.vue';
import MediaUpdatesPlate from '@/components/resource/MediaUpdatesPlate.vue';
import HistoryPlate from '@/components/resource/HistoryPlate.vue';
</script>
