<script setup lang="ts">
import { mdiAccountCircle } from '@mdi/js';

withDefaults(
  defineProps<{
    src?: string;
    size?: string | number;
  }>(),
  {
    size: 64,
  },
);
</script>

<template>
  <v-avatar :size="size">
    <v-img :src="src" cover>
      <template #placeholder>
        <v-icon :size="size" :icon="mdiAccountCircle"></v-icon>
      </template>
    </v-img>
    <slot></slot>
  </v-avatar>
</template>

<style scoped lang="sass"></style>
