<template>
  <video ref="videoRef" :src="src" :poster="poster"></video>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import MediaPosterFallback from '@/assets/banner.jpeg';
import Plyr from 'plyr';
import { useDisplay } from 'vuetify';
import 'plyr/dist/plyr.css';

const display = useDisplay();

withDefaults(
  defineProps<{
    src: string;
    poster?: string;
  }>(),
  {
    poster: MediaPosterFallback,
  },
);

const videoRef = ref<HTMLElement | undefined>(undefined);
let player: Plyr | undefined = undefined;
onMounted(async () => {
  if (videoRef.value) {
    player = new Plyr(videoRef.value, {
      controls: display.smAndUp.value
        ? ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'download', 'fullscreen']
        : ['play-large', 'play', 'progress', 'current-time', 'fullscreen'],
      autoplay: true,
      keyboard: {
        global: true,
      },
    });
  }
});
onUnmounted(() => {
  if (player) {
    player.destroy();
  }
});
</script>

<style scoped lang="sass"></style>
