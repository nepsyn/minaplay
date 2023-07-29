<script setup lang="ts">
import MediaCoverFallback from '@/assets/media_cover_fallback.jpg';

const props = withDefaults(
  defineProps<{
    src: string;
    placeholder?: string;
    aspectRatio?: string | number;
    width?: string | number;
    minWidth?: string | number;
    maxWidth?: string | number;
    height?: string | number;
    minHeight?: string | number;
    maxHeight?: string | number;
  }>(),
  {
    aspectRatio: 16 / 9,
    placeholder: MediaCoverFallback,
  },
);
</script>

<template>
  <v-overlay close-on-content-click close-on-back class="align-center justify-center">
    <v-container class="d-flex align-center justify-center" style="height: 100vh; width: 100vw">
      <v-img :aspect-ratio="aspectRatio!" :src="src">
        <template #placeholder>
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </template>
      </v-img>
    </v-container>

    <template #activator="{ props }">
      <v-img
        cover
        v-bind="props"
        class="rounded"
        :aspect-ratio="aspectRatio!"
        :width="width!"
        :min-width="minWidth!"
        :max-width="maxWidth!"
        :height="height!"
        :min-height="minHeight!"
        :max-height="maxHeight!"
        :src="src"
      >
        <template #placeholder>
          <v-img :src="placeholder!"></v-img>
        </template>
      </v-img>
    </template>
  </v-overlay>
</template>

<style scoped lang="sass"></style>
