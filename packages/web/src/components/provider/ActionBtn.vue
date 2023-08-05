<script setup lang="ts">
import { useDisplay } from 'vuetify';

const display = useDisplay();

const props = withDefaults(
  defineProps<{
    text?: string;
    color?: string;
    icon?: string;
    loading?: boolean;
    size?: string;
    variant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain';
    disabled?: boolean;
  }>(),
  {
    loading: false,
    variant: 'outlined',
  },
);
</script>

<template>
  <v-btn
    :variant="display.smAndUp.value ? variant! : 'text'"
    :text="text!"
    :color="color!"
    :size="size!"
    :loading="loading!"
    :icon="display.smAndUp.value ? undefined : icon as any"
    :prepend-icon="icon!"
    :disabled="disabled!"
  >
  </v-btn>
</template>

<style scoped lang="sass"></style>
