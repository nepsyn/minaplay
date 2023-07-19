<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue';
import 'plyr/dist/plyr.css';
import Plyr from 'plyr';
import JASSUB from 'jassub';
import workerUrl from 'jassub/dist/jassub-worker.js?url';
import wasmUrl from 'jassub/dist/jassub-worker.wasm?url';
import { Api } from '@/api/api';
import { MediaEntity } from '@/interfaces/media.interface';
import MediaCoverFallback from '@/assets/media_cover_fallback.jpg';

const props = defineProps<{
  media: MediaEntity;
  options?: Plyr.Options;
}>();

const poster = computed(() => {
  return props.media.poster ? Api.File.buildRawPath(props.media.poster!.id) : MediaCoverFallback;
});
const subtitles = computed(() => {
  return props.media.subtitles ?? [];
});
const attachments = computed(() => {
  return props.media.attachments ?? [];
});

const videoRef = ref<HTMLVideoElement | null>(null);
const renderer = shallowRef<JASSUB>(null as any);
const player = shallowRef<Plyr>(null as any);
onMounted(async () => {
  player.value = new Plyr(videoRef.value!, props.options);

  if (subtitles.value.length > 0) {
    renderer.value = new JASSUB({
      video: videoRef.value!,
      subUrl: Api.File.buildRawPath(subtitles.value[0].id),
      fonts: attachments.value
        .filter(({ mimetype }) => mimetype?.startsWith('font/'))
        .map(({ id }) => Api.File.buildRawPath(id)),
      workerUrl,
      wasmUrl,
    });
  }
});
</script>

<template>
  <video ref="videoRef" :poster="poster" :src="Api.File.buildRawPath(media.file!.id)" class="w-100"></video>
</template>

<style scoped lang="sass"></style>
