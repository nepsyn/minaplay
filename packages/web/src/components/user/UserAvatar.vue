<script setup lang="ts">
import { mdiAccountCircle } from '@mdi/js';

withDefaults(
  defineProps<{
    src?: string;
    size?: string | number;
    tile?: boolean;
  }>(),
  {
    size: 64,
  },
);
</script>

<template>
  <v-avatar :rounded="tile ? 0 : undefined" :size="size">
    <v-img referrerpolicy="no-referrer" :src="src" cover>
      <template #placeholder>
        <v-icon :size="size" :icon="mdiAccountCircle"></v-icon>
      </template>
    </v-img>
    <slot></slot>
  </v-avatar>
</template>

<style scoped lang="sass"></style>
