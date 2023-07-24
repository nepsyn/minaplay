<script setup lang="ts">
import { useDisplay } from 'vuetify';

const display = useDisplay();

const props = withDefaults(
  defineProps<{
    text?: string;
    color?: string;
    icon?: string;
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);
</script>

<template>
  <v-btn
    :variant="display.smAndUp.value ? 'outlined' : 'text'"
    :text="text!"
    :color="color!"
    :loading="loading!"
    :icon="display.smAndUp.value ? undefined : icon as any"
    :prepend-icon="icon!"
  >
  </v-btn>
</template>

<style scoped lang="sass"></style>
