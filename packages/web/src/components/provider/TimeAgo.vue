<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import { format } from 'timeago.js';

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

const ago = ref(format(new Date(props.time), 'zh_CN'));

const interval = setInterval(() => {
  ago.value = format(new Date(props.time), 'zh_CN');
}, Number(props.interval));

onUnmounted(() => {
  clearInterval(interval);
});
</script>

<template>
  <span>{{ ago }}{{ label }}</span>
</template>

<style scoped lang="sass"></style>
