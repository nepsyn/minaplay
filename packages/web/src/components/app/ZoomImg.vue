<template>
  <v-img
    cover
    :aspect-ratio="aspectRatio"
    :width="width"
    :min-width="minWidth"
    :max-width="maxWidth"
    :height="height"
    :min-height="minHeight"
    :max-height="maxHeight"
    :src="src"
  >
    <template #placeholder>
      <slot name="placeholder">
        <v-img cover :src="placeholder"></v-img>
      </slot>
    </template>
    <v-overlay activator="parent" close-on-content-click close-on-back class="align-center justify-center">
      <v-container class="d-flex align-center justify-center" style="width: 100dvw; height: 100dvh">
        <v-img :aspect-ratio="aspectRatio!" :src="src">
          <template #placeholder>
            <v-container fluid class="d-flex h-100 w-100 align-center justify-center">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </v-container>
          </template>
        </v-img>
      </v-container>
    </v-overlay>
    <slot></slot>
  </v-img>
</template>

<script setup lang="ts">
import MediaPosterFallback from '@/assets/banner.jpeg';

withDefaults(
  defineProps<{
    src?: string;
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
    placeholder: MediaPosterFallback,
  },
);
</script>

<style scoped lang="sass"></style>
