<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue';
import 'plyr/dist/plyr.css';
import Plyr from 'plyr';

const props = defineProps<{
  src: string;
  poster?: string;
  options?: Plyr.Options;
}>();

const videoRef = ref<HTMLElement | null>(null);
const player = shallowRef<Plyr>(null as any);
onMounted(() => {
  player.value = new Plyr(videoRef.value!, props.options);
});
</script>

<template>
  <video ref="videoRef" :poster="poster" :src="src" class="w-100"></video>
</template>

<style scoped lang="sass"></style>
