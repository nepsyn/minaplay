<script setup lang="ts">
import { mdiAccountCircle } from '@mdi/js';

const props = withDefaults(
  defineProps<{
    url?: string;
    size?: string | number;
  }>(),
  {
    size: 64,
  },
);
</script>

<template>
  <v-avatar :size="size!">
    <v-img :src="url!">
      <template #placeholder>
        <v-icon :size="size!" :icon="mdiAccountCircle"></v-icon>
      </template>
    </v-img>
  </v-avatar>
</template>

<style scoped lang="sass"></style>
