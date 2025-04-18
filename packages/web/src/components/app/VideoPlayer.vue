<template>
  <teleport to="body" :disabled="!pageFullscreen">
    <div class="w-100 h-100">
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
              <span v-if="live" class="plyr__controls__item ms-2"> LIVE </span>
            </div>
            <div v-if="!live" class="plyr__controls__item plyr__progress__container">
              <div class="plyr__progress">
                <input data-plyr="seek" type="range" min="0" max="100" step="0.01" value="0" aria-label="Seek" />
                <progress
                  class="plyr__progress__buffer"
                  min="0"
                  max="100"
                  value="0"
                  role="progressbar"
                  aria-hidden="true"
                >
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
              :attach="controlsRef"
            >
              <v-list class="rounded py-0" density="compact">
                <v-list-item
                  v-for="(subtitle, index) in subtitles"
                  :key="index"
                  :active="currentSubtitle?.title === subtitle.title"
                  :color="currentSubtitle?.title === subtitle.title ? 'primary' : undefined"
                  link
                  density="compact"
                  @click="renderSubtitle(index)"
                >
                  {{ subtitle.title }}
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
                  v-if="!live && subtitles && subtitles.length > 0"
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
              v-if="!live"
              class="plyr__controls__item plyr__control d-none d-sm-flex"
              :href="src"
              target="_blank"
              download
              data-plyr="download"
            >
              <svg aria-hidden="true" focusable="false">
                <use xlink:href="#plyr-download"></use>
              </svg>
            </a>
            <button
              class="plyr__controls__item plyr__control d-none d-sm-flex page-fullscreen-btn"
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
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import JASSUB from 'jassub';
import jassubWorkerUrl from 'jassub/dist/jassub-worker.js?url';
import jassubWasmUrl from 'jassub/dist/jassub-worker.wasm?url';
import { useI18n } from 'vue-i18n';
import { mdiArrowCollapseAll, mdiStretchToPageOutline } from '@mdi/js';
import MpegTs from 'mpegts.js';
import Hls from 'hls.js';
// @ts-ignore
import DanmuJs from 'danmu.js';
import { useSettingsStore } from '@/store/settings';

const { t } = useI18n();
const { settings } = useSettingsStore();

const props = withDefaults(
  defineProps<{
    src?: string;
    poster?: string;
    subtitles?: { title: string; url: string }[];
    fonts?: string[];
    position?: number;
    live?: boolean;
    ratio?: string;
  }>(),
  {
    live: false,
    ratio: '16:9',
    subtitles: [] as any,
    fonts: [] as any,
  },
);

const src = ref<string | undefined>('');
const poster = ref<string | undefined>('');
const loadResource = () => {
  if (!props.src || !player.value) {
    return;
  }

  player.value.stop();
  if (livePlayer) {
    livePlayer.destroy();
    livePlayer = undefined;
  }

  if (props.live) {
    if (!videoRef.value) {
      return;
    }
    if (!URL.canParse(props.src)) {
      return;
    }
    const { pathname } = new URL(props.src);

    if (pathname.endsWith('.flv')) {
      livePlayer = MpegTs.createPlayer({
        type: 'flv',
        isLive: true,
        url: props.src,
      });
      livePlayer.attachMediaElement(videoRef.value);
      livePlayer.load();
      player.value?.play();
    } else if (pathname.endsWith('.m3u8')) {
      livePlayer = new Hls();
      livePlayer.loadSource(props.src);
      livePlayer.attachMedia(videoRef.value);
      player.value?.play();
    } else {
      src.value = props.src;
      if (videoRef.value) {
        videoRef.value.src = src.value;
      }

      if (props.position) {
        player.value.once('canplay', () => {
          player.value!.currentTime = props.position!;
        });
      }
    }
  } else {
    src.value = props.src;
    poster.value = props.poster;

    if (props.position) {
      player.value.once('canplay', () => {
        player.value!.currentTime = props.position!;
      });
    }
  }
};
watch(
  () => props.src,
  () => {
    loadResource();
  },
);
watch(
  () => props.poster,
  () => {
    if (player.value) {
      player.value.poster = props.poster ?? '';
    }
  },
);

const videoRef = ref<HTMLVideoElement>();
const controlsRef = ref<HTMLElement>();
const player = shallowRef<Plyr>();
let livePlayer: MpegTs.Player | Hls | undefined = undefined;
let danmakuPlayer: DanmuJs | undefined = undefined;
let renderer = shallowRef<JASSUB>();
const currentSubtitle = ref<{ title: string; url: string }>();
const renderSubtitle = (index: number) => {
  if (renderer.value) {
    renderer.value.destroy();
    renderer.value = undefined;
  }

  const subtitle = props.subtitles![index];
  currentSubtitle.value = subtitle;
  if (subtitle && videoRef.value) {
    renderer.value = new JASSUB({
      video: videoRef.value,
      subUrl: subtitle.url,
      fonts: props.fonts!,
      onDemandRender: false,
      workerUrl: jassubWorkerUrl,
      wasmUrl: jassubWasmUrl,
    });
  }
};
onMounted(async () => {
  if (videoRef.value) {
    player.value = new Plyr(videoRef.value, {
      controls: controlsRef.value,
      autoplay: true,
      ratio: props.ratio,
      clickToPlay: !props.live,
      keyboard: {
        global: true,
      },
    });
    player.value.on('exitfullscreen', () => {
      pageFullscreen.value = false;
    });
    player.value.on('pause', () => {
      danmakuPlayer?.pause();
    });
    player.value.on('play', () => {
      danmakuPlayer?.play();
    });

    loadResource();

    if (props.subtitles!.length > 0 && settings.showSubtitle) {
      renderSubtitle(0);
    }

    const danmakuEl = document.createElement('div');
    danmakuEl.className = 'danmaku-container';
    player.value?.elements.container?.appendChild(danmakuEl);
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
  if (player.value) {
    player.value.destroy();
  }
});

const pageFullscreen = ref(false);
watch(
  () => pageFullscreen.value,
  (value) => {
    if (player.value) {
      if (value) {
        player.value.elements.container?.classList.add('page-fullscreen');
      } else {
        player.value.elements.container?.classList.remove('page-fullscreen');
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
const danmakuShow = ref(settings.showDanmaku);
const danmakuMenu = ref(false);
const toggleDanmaku = (value: boolean) => {
  danmakuShow.value = value;
  danmakuMenu.value = false;
  if (value) {
    danmakuPlayer?.setOpacity('1');
  } else {
    danmakuPlayer?.setOpacity('0');
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
  player,
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

.plyr:fullscreen .page-fullscreen-btn
  display: none !important
</style>
