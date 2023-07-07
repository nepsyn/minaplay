<script setup lang="ts">
import MediaPlate from '@/components/MediaPlate.vue';
import { mdiHistory } from '@mdi/js';
</script>

<template>
  <v-container fluid class="px-6">
    <media-plate title="最近更新" :icon="mdiHistory" icon-color="primary"></media-plate>
  </v-container>
</template>

<style scoped lang="sass"></style>
