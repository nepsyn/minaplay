<template>
  <video autoplay ref="videoRef" :src="src" :poster="poster" crossorigin="anonymous">
    <div ref="controlsRef">
      <div class="plyr__controls">
        <div class="plyr__controls__item d-flex align-center">
          <button class="plyr__controls__item plyr__control" type="button" data-plyr="play" aria-label="Play">
            <svg class="icon--pressed" aria-hidden="true" focusable="false">
              <use xlink:href="#plyr-pause"></use>
            </svg>
            <svg class="icon--not-pressed" aria-hidden="true" focusable="false">
              <use xlink:href="#plyr-play"></use>
            </svg>
          </button>
          <button v-if="live" @click="refresh()" type="button" class="plyr__control" data-plyr="restart">
            <svg role="presentation" style="scale: 1.2">
              <use xlink:href="#plyr-restart"></use>
            </svg>
          </button>
          <span v-if="live" class="plyr__controls__item ml-2"> LIVE </span>
        </div>
        <div v-if="!live" class="plyr__controls__item plyr__progress__container">
          <div class="plyr__progress">
            <input data-plyr="seek" type="range" min="0" max="100" step="0.01" value="0" aria-label="Seek" />
            <progress class="plyr__progress__buffer" min="0" max="100" value="0" role="progressbar" aria-hidden="true">
              % buffered
            </progress>
            <span role="tooltip" class="plyr__tooltip">00:00</span>
          </div>
        </div>
        <div
          v-if="!live"
          class="plyr__controls__item plyr__time--current plyr__time"
          aria-label="Current time"
          role="timer"
        >
          00:00
        </div>
        <div
          v-if="!live"
          class="plyr__controls__item plyr__time--duration plyr__time"
          aria-label="Duration"
          role="timer"
        >
          00:00
        </div>
        <v-menu
          location="top center"
          open-on-hover
          :open-on-click="false"
          scroll-strategy="close"
          class="text-center position-fixed"
          open-delay="0"
          close-delay="0"
          :attach="controlsRef"
        >
          <v-list class="rounded py-0" density="compact">
            <v-list-item
              v-for="(subtitle, index) in subtitleFiles"
              :key="index"
              :active="currentSubtitle?.id === subtitle.id"
              :color="currentSubtitle?.id === subtitle.id ? 'primary' : undefined"
              link
              density="compact"
              @click="renderSubtitle(index)"
            >
              {{ getSubtitleName(subtitle) }}
            </v-list-item>
            <v-list-item
              :active="!currentSubtitle"
              :color="!currentSubtitle ? 'primary' : undefined"
              link
              density="compact"
              @click="renderSubtitle(-1)"
            >
              {{ t('app.actions.close') }}
            </v-list-item>
          </v-list>
          <template #activator="{ props }">
            <button
              v-bind="props"
              v-if="!live && subtitleFiles.length > 0"
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
            </button>
          </template>
        </v-menu>

        <v-menu
          min-width="240px"
          location="top center"
          open-on-hover
          :open-on-click="false"
          :close-on-content-click="false"
          scroll-strategy="close"
          class="text-center position-fixed"
          open-delay="0"
          close-delay="0"
          :attach="controlsRef"
          v-model="danmakuMenu"
          @mouseleave="(e: any) => !e.toElement.classList.contains('danmaku-btn') && (danmakuMenu = false)"
        >
          <v-list class="rounded py-0">
            <v-list-subheader>
              {{ t('app.player.danmaku.settings') }}
            </v-list-subheader>
            <v-list-item density="compact">
              <template #prepend>
                <span style="width: 64px" class="text-caption font-weight-bold text-left">
                  {{ t('app.player.danmaku.fontSize') }}
                </span>
              </template>
              <v-slider
                class="px-2"
                color="warning"
                thumb-size="16"
                step="1"
                v-model="danmakuStyle.fontSize"
                min="12"
                max="32"
                hide-details
                density="compact"
              ></v-slider>
              <template #append>
                <span style="width: 24px" class="text-caption font-weight-bold text-right">
                  {{ danmakuStyle.fontSize }}px
                </span>
              </template>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <span style="width: 64px" class="text-caption font-weight-bold text-left">
                  {{ t('app.player.danmaku.opacity') }}
                </span>
              </template>
              <v-slider
                class="px-2"
                color="warning"
                thumb-size="16"
                style="width: 120px"
                step="1"
                v-model="danmakuStyle.opacity"
                min="30"
                max="100"
                hide-details
                density="compact"
              ></v-slider>
              <template #append>
                <span style="width: 24px" class="text-caption font-weight-bold text-right">
                  {{ danmakuStyle.opacity }}%
                </span>
              </template>
            </v-list-item>
            <v-list-item>
              <v-checkbox color="primary" hide-details density="compact" v-model="danmakuStyle.shadow">
                <template #prepend>
                  <span class="text-caption font-weight-bold text-right">
                    {{ t('app.player.danmaku.shadow') }}
                  </span>
                </template>
              </v-checkbox>
            </v-list-item>
          </v-list>
          <template #activator="{ props }">
            <button
              v-if="live"
              class="plyr__controls__item plyr__control danmaku-btn"
              type="button"
              v-bind="props"
              @click="toggleDanmaku(!danmakuShow)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                style="scale: 1.2"
                width="18px"
                height="18px"
                viewBox="0 0 1024 1024"
              >
                <g fill-rule="evenodd" :fill-opacity="danmakuShow ? 1 : 0.5">
                  <path
                    d="M853.333333 170.666667a85.333333 85.333333 0 0 1 85.333334 85.333333v512a85.333333 85.333333 0 0 1-85.333334 85.333333H170.666667a85.333333 85.333333 0 0 1-85.333334-85.333333V256a85.333333 85.333333 0 0 1 85.333334-85.333333h682.666666zM394.666667 661.333333a32 32 0 1 0 0 64 32 32 0 0 0 0-64z m362.666666 0H522.666667a32 32 0 0 0 0 64h234.666666a32 32 0 0 0 0-64zM202.666667 480a32 32 0 1 0 0 64 32 32 0 0 0 0-64z m448 0H330.666667a32 32 0 0 0 0 64h320a32 32 0 0 0 0-64zM330.666667 298.666667a32 32 0 1 0 0 64 32 32 0 0 0 0-64z m448 0H458.666667a32 32 0 0 0 0 64h320a32 32 0 0 0 0-64z"
                  ></path>
                </g>
              </svg>
            </button>
          </template>
        </v-menu>

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
          v-if="!live && media?.file"
          class="plyr__controls__item plyr__control d-none d-sm-flex"
          :href="api.File.buildDownloadPath(media.file.id, media.file.name)"
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
          <svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" style="scale: 1.2" viewBox="0 0 24 24">
            <path :d="pageFullscreen ? mdiArrowCollapseAll : mdiStretchToPageOutline" />
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
import { mdiArrowCollapseAll, mdiStretchToPageOutline } from '@mdi/js';
import { LiveStream } from '@/api/interfaces/live.interface';
import MpegTs from 'mpegts.js';
import Hls from 'hls.js';
// @ts-ignore
import DanmuJs from 'danmu.js';

const SUBTITLE_EXTENSIONS = ['.ass', '.ssa'];
const FONT_EXTENSIONS = ['.otf', '.ttf', '.woff'];

const { t } = useI18n();
const api = useApiStore();

const props = withDefaults(
  defineProps<{
    media?: MediaEntity;
    live?: boolean;
    stream?: LiveStream;
  }>(),
  {
    live: false,
  },
);

const src = ref('');
const poster = ref('');

const initLive = (url: string) => {
  if (!URL.canParse(url)) {
    return;
  }

  const { pathname } = new URL(url);
  if (videoRef.value) {
    if (pathname.endsWith('.flv')) {
      livePlayer = MpegTs.createPlayer({
        type: 'flv',
        isLive: true,
        url,
      });
      livePlayer.attachMediaElement(videoRef.value);
      livePlayer.load();
      player?.play();
    } else if (pathname.endsWith('.m3u8')) {
      livePlayer = new Hls();
      livePlayer.loadSource(url);
      livePlayer.attachMedia(videoRef.value);
      player?.play();
    }
  }
};
const loadResource = () => {
  if (player) {
    player.stop();
    if (livePlayer) {
      livePlayer.destroy();
      livePlayer = undefined;
    }

    src.value = '';
    poster.value = '';
  }

  if (props.media && !props.live) {
    src.value = api.File.buildRawPath(props.media.file!.id, props.media.file!.name);
    poster.value = props.media.poster
      ? api.File.buildRawPath(props.media.poster.id, props.media.poster.name)
      : MediaPosterFallback;
  }

  if (props.stream && props.live) {
    if (props.stream.type === 'server-push') {
      initLive(api.Live.buildStreamPath(props.stream.url));
    } else if (props.stream.type === 'live-stream') {
      initLive(props.stream.url);
    }
  }
};
watch(
  () => [props.media, props.stream],
  () => {
    loadResource();
  },
);

const subtitleFiles = computed(
  () =>
    props.media?.attachments?.filter(({ name }) => {
      const ext = name.slice(name.lastIndexOf('.'), name.length).toLowerCase();
      return SUBTITLE_EXTENSIONS.includes(ext);
    }) ?? [],
);
const getSubtitleName = (subtitle: FileEntity) => {
  const lastIndex = subtitle.name.lastIndexOf('.');
  return subtitle.name.slice(0, lastIndex > -1 ? lastIndex : subtitle.name.length);
};
const fontFiles = computed(
  () =>
    props.media?.attachments?.filter(({ name }) => {
      const ext = name.slice(name.lastIndexOf('.'), name.length).toLowerCase();
      return FONT_EXTENSIONS.includes(ext);
    }) ?? [],
);

const videoRef = ref<HTMLVideoElement | undefined>(undefined);
const controlsRef = ref<HTMLElement | undefined>(undefined);
let player: Plyr | undefined = undefined;
let livePlayer: MpegTs.Player | Hls | undefined = undefined;
let danmakuPlayer: DanmuJs | undefined = undefined;
let renderer = shallowRef<JASSUB | undefined>(undefined);
const currentSubtitle = ref<FileEntity | undefined>(undefined);
const renderSubtitle = (index: number) => {
  if (renderer.value) {
    renderer.value.destroy();
    renderer.value = undefined;
  }

  const subtitle = subtitleFiles.value[index];
  currentSubtitle.value = subtitle;
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
onMounted(async () => {
  if (videoRef.value) {
    player = new Plyr(videoRef.value, {
      controls: controlsRef.value,
      autoplay: true,
      ratio: '16:9',
      clickToPlay: !props.live,
      keyboard: {
        global: true,
      },
    });
    player.on('exitfullscreen', () => {
      if (player) {
        pageFullscreen.value = false;
      }
    });
    player.on('pause', () => {
      danmakuPlayer?.pause();
    });
    player.on('play', () => {
      danmakuPlayer?.play();
    });

    loadResource();

    if (subtitleFiles.value) {
      renderSubtitle(0);
    }

    const danmakuEl = document.createElement('div');
    danmakuEl.className = 'danmaku-container';
    player.elements.container?.appendChild(danmakuEl);
    danmakuPlayer = new DanmuJs({
      container: danmakuEl,
      channelSize: 40,
    });
  }
});
onUnmounted(() => {
  if (renderer.value) {
    renderer.value.destroy();
  }
  if (livePlayer) {
    livePlayer.destroy();
  }
  if (danmakuPlayer) {
    danmakuPlayer.destroy();
  }
  if (player) {
    player.destroy();
  }
});

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

const refresh = () => {
  loadResource();
};

const danmakuStyle = ref({
  fontSize: 24,
  opacity: 100,
  shadow: true,
});
const danmakuShow = ref(true);
const danmakuMenu = ref(false);
const toggleDanmaku = (value: boolean) => {
  danmakuShow.value = value;
  danmakuMenu.value = false;
  if (value) {
    danmakuPlayer?.setOpacity(1);
  } else {
    danmakuPlayer?.setOpacity(0);
  }
};
const emitDanmaku = (content: string) => {
  if (danmakuPlayer) {
    danmakuPlayer.sendComment({
      id: Date.now().toString(),
      mode: 'scroll',
      start: 0,
      prior: false,
      txt: content,
      duration: 11000 * Math.max(0.7, content.length / 20),
      style: {
        color: '#fff',
        fontSize: `${danmakuStyle.value.fontSize}px`,
        opacity: (danmakuStyle.value.opacity / 100).toFixed(2),
        textShadow: danmakuStyle.value.shadow ? '-1px -1px #000, -1px 1px #000, 1px -1px #000, 1px 1px #000' : 'none',
      },
    });
  }
};

defineExpose({
  refresh,
  emitDanmaku,
});
</script>

<style lang="sass">
.page-fullscreen
  position: fixed !important
  top: 0
  left: 0
  width: 100dvw
  height: 100dvh
  z-index: 10007 !important
  background-color: black

.danmaku-container
  position: absolute
  width: 100%
  height: 100%
</style>
