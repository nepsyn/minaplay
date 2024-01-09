<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import { format } from 'timeago.js';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

const props = withDefaults(
  defineProps<{
    time: string | Date;
    label?: string;
    interval?: string | number;
  }>(),
  {
    label: '',
    interval: 5000,
  },
);

const ago = ref(format(new Date(props.time), locale.value.replace(/-/, '_')));

const interval = setInterval(() => {
  ago.value = format(new Date(props.time), locale.value.replace(/-/, '_'));
}, Number(props.interval));

onUnmounted(() => {
  clearInterval(interval);
});
</script>

<template>
  <span>{{ ago }}{{ label }}</span>
</template>

<style scoped lang="sass"></style>
