<template>
  <video ref="videoRef" :src="src" :poster="poster" crossorigin="anonymous">
    <div ref="controlsRef">
      <div class="plyr__controls">
        <button class="plyr__controls__item plyr__control" type="button" data-plyr="play" aria-label="Play">
          <svg class="icon--pressed" aria-hidden="true" focusable="false">
            <use xlink:href="#plyr-pause"></use>
          </svg>
          <svg class="icon--not-pressed" aria-hidden="true" focusable="false">
            <use xlink:href="#plyr-play"></use>
          </svg>
        </button>
        <div class="plyr__controls__item plyr__progress__container">
          <div class="plyr__progress">
            <input data-plyr="seek" type="range" min="0" max="100" step="0.01" value="0" aria-label="Seek" />
            <progress class="plyr__progress__buffer" min="0" max="100" value="0" role="progressbar" aria-hidden="true">
              % buffered
            </progress>
            <span role="tooltip" class="plyr__tooltip">00:00</span>
          </div>
        </div>
        <div class="plyr__controls__item plyr__time--current plyr__time" aria-label="Current time" role="timer">
          00:00
        </div>
        <div class="plyr__controls__item plyr__time--duration plyr__time" aria-label="Duration" role="timer">00:00</div>
        <button
          v-if="subtitleFiles.length > 0"
          class="plyr__controls__item plyr__control"
          :class="{ 'plyr__control--pressed': renderer !== undefined }"
          type="button"
        >
          <svg class="icon--pressed" aria-hidden="true" focusable="false">
            <use xlink:href="#plyr-captions-on"></use>
          </svg>
          <svg class="icon--not-pressed" aria-hidden="true" focusable="false">
            <use xlink:href="#plyr-captions-off"></use>
          </svg>
          <v-menu
            activator="parent"
            location="top center"
            open-on-hover
            class="text-center"
            open-delay="0"
            close-delay="0"
            :attach="controlsRef"
          >
            <v-list class="rounded py-0" density="compact">
              <v-list-item
                v-for="(subtitle, index) in subtitleFiles"
                :key="index"
                link
                density="compact"
                @click="renderSubtitle(index)"
              >
                {{ getSubtitleName(subtitle) }}
              </v-list-item>
              <v-list-item link density="compact" @click="renderSubtitle(-1)">
                {{ t('app.actions.close') }}
              </v-list-item>
            </v-list>
          </v-menu>
        </button>
        <div class="plyr__controls__item plyr__volume d-none d-sm-flex">
          <button type="button" class="plyr__control" data-plyr="mute">
            <svg class="icon--pressed" aria-hidden="true" focusable="false">
              <use xlink:href="#plyr-muted"></use>
            </svg>
            <svg class="icon--not-pressed" aria-hidden="true" focusable="false">
              <use xlink:href="#plyr-volume"></use>
            </svg>
          </button>
          <input
            data-plyr="volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value="1"
            autocomplete="off"
            aria-label="Volume"
          />
        </div>
        <a
          class="plyr__controls__item plyr__control d-none d-sm-flex"
          :href="api.File.buildDownloadPath(media.file!.id, media.file!.name)"
          target="_blank"
          download
          data-plyr="download"
        >
          <svg aria-hidden="true" focusable="false">
            <use xlink:href="#plyr-download"></use>
          </svg>
        </a>
        <button
          class="plyr__controls__item plyr__control d-none d-sm-flex"
          type="button"
          @click="pageFullscreen = !pageFullscreen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path :d="mdiApplicationOutline" />
          </svg>
        </button>
        <button class="plyr__controls__item plyr__control" type="button" data-plyr="fullscreen">
          <svg class="icon--pressed" aria-hidden="true" focusable="false">
            <use xlink:href="#plyr-exit-fullscreen"></use>
          </svg>
          <svg class="icon--not-pressed" aria-hidden="true" focusable="false">
            <use xlink:href="#plyr-enter-fullscreen"></use>
          </svg>
        </button>
      </div>
      <button type="button" class="plyr__control plyr__control--overlaid" data-plyr="play" aria-label="Play">
        <svg aria-hidden="true" focusable="false">
          <use xlink:href="#plyr-play"></use>
        </svg>
      </button>
    </div>
  </video>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import MediaPosterFallback from '@/assets/banner.jpeg';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { MediaEntity } from '@/api/interfaces/media.interface';
import { useApiStore } from '@/store/api';
import JASSUB from 'jassub';
import jassubWorkerUrl from 'jassub/dist/jassub-worker.js?url';
import jassubWasmUrl from 'jassub/dist/jassub-worker.wasm?url';
import { useI18n } from 'vue-i18n';
import { FileEntity } from '@/api/interfaces/file.interface';
import { mdiApplicationOutline } from '@mdi/js';

const SUBTITLE_EXTENSIONS = ['.ass', '.ssa'];
const FONT_EXTENSIONS = ['.otf', '.ttf', '.woff'];

const { t } = useI18n();
const api = useApiStore();

const props = defineProps<{
  media: MediaEntity;
}>();
const src = computed(() => api.File.buildRawPath(props.media.file!.id, props.media.file!.name));
const poster = computed(() =>
  props.media.poster ? api.File.buildRawPath(props.media.poster.id, props.media.poster.name) : MediaPosterFallback,
);
const subtitleFiles = computed(() =>
  props.media.attachments.filter(({ name }) => {
    const ext = name.slice(name.lastIndexOf('.'), name.length).toLowerCase();
    return SUBTITLE_EXTENSIONS.includes(ext);
  }),
);
const getSubtitleName = (subtitle: FileEntity) => {
  const lastIndex = subtitle.name.lastIndexOf('.');
  return subtitle.name.slice(0, lastIndex > -1 ? lastIndex : subtitle.name.length);
};
const fontFiles = computed(() =>
  props.media.attachments.filter(({ name }) => {
    const ext = name.slice(name.lastIndexOf('.'), name.length).toLowerCase();
    return FONT_EXTENSIONS.includes(ext);
  }),
);

const videoRef = ref<HTMLVideoElement | undefined>(undefined);
const controlsRef = ref<HTMLElement | undefined>(undefined);
let player: Plyr | undefined = undefined;
let renderer = shallowRef<JASSUB | undefined>(undefined);
const renderSubtitle = (index: number) => {
  if (renderer.value) {
    renderer.value.destroy();
    renderer.value = undefined;
  }

  const subtitle = subtitleFiles.value[index];
  if (subtitle && videoRef.value) {
    renderer.value = new JASSUB({
      video: videoRef.value,
      subUrl: api.File.buildRawPath(subtitle.id, subtitle.name),
      fonts: fontFiles.value.map(({ id, name }) => api.File.buildRawPath(id, name)),
      onDemandRender: false,
      workerUrl: jassubWorkerUrl,
      wasmUrl: jassubWasmUrl,
    });
  }
};

const pageFullscreen = ref(false);
watch(
  () => pageFullscreen.value,
  (value) => {
    if (player) {
      if (value) {
        player.elements.container?.classList.add('page-fullscreen');
      } else {
        player.elements.container?.classList.remove('page-fullscreen');
      }
    }
  },
);

onMounted(async () => {
  if (videoRef.value) {
    player = new Plyr(videoRef.value, {
      controls: controlsRef.value,
      autoplay: true,
      ratio: '16:9',
      keyboard: {
        global: true,
      },
    });

    player.on('exitfullscreen', () => {
      if (player) {
        pageFullscreen.value = false;
      }
    });

    if (subtitleFiles.value) {
      renderSubtitle(0);
    }
  }
});
onUnmounted(() => {
  if (renderer.value) {
    renderer.value.destroy();
  }
  if (player) {
    player.destroy();
  }
});
</script>

<style lang="sass">
.page-fullscreen
  position: fixed !important
  top: 0
  left: 0
  width: 100vw
  height: 100vh
  z-index: 10007 !important
  background-color: black
</style>
