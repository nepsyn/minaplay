<template>
  <v-container class="pa-0 pb-12">
    <span class="text-h4">{{ t('settings.sections.app') }}</span>
    <v-sheet id="application" class="mt-6 rounded-lg border">
      <v-card-title class="py-4">{{ t('settings.app.ui') }}</v-card-title>
      <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
        <v-container class="pa-0 d-flex flex-row align-center">
          <v-icon :icon="mdiTranslate"></v-icon>
          <v-container class="pa-0 ml-3">
            <p class="text-subtitle-1">{{ t('settings.app.language') }}</p>
            <p class="text-caption">{{ t('settings.app.languageDescription') }}</p>
          </v-container>
        </v-container>
        <v-container class="pa-0">
          <v-select
            :items="languages"
            v-model="settings.locale"
            hide-details
            density="compact"
            variant="outlined"
            @update:model-value="onLanguageChanged"
          >
          </v-select>
        </v-container>
      </v-container>
      <v-divider class="ml-4"></v-divider>
      <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
        <v-container class="pa-0 d-flex flex-row align-center">
          <v-icon :icon="mdiThemeLightDark"></v-icon>
          <v-container class="pa-0 ml-3">
            <p class="text-subtitle-1">{{ t('settings.app.theme') }}</p>
            <p class="text-caption">{{ t('settings.app.themeDescription') }}</p>
          </v-container>
        </v-container>
        <v-container class="pa-0">
          <v-select
            :items="themes"
            v-model="settings.theme"
            hide-details
            density="compact"
            variant="outlined"
            @update:model-value="onThemeChanged"
          >
          </v-select>
        </v-container>
      </v-container>
    </v-sheet>
    <v-sheet id="common" class="mt-6 rounded-lg border">
      <v-card-title class="py-4">{{ t('settings.app.common') }}</v-card-title>
      <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
        <v-container class="pa-0 d-flex flex-row align-center">
          <v-icon :icon="mdiSubtitles"></v-icon>
          <v-container class="pa-0 ml-3">
            <p class="text-subtitle-1">{{ t('settings.app.subtitle') }}</p>
            <p class="text-caption">{{ t('settings.app.subtitleDescription') }}</p>
          </v-container>
        </v-container>
        <v-switch v-model="settings.showSubtitle" hide-details density="compact" color="primary"> </v-switch>
      </v-container>
      <v-divider class="ml-4"></v-divider>
      <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
        <v-container class="pa-0 d-flex flex-row align-center">
          <v-icon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="v-icon__svg"
              width="18px"
              height="18px"
              viewBox="0 0 1024 1024"
            >
              <path
                d="M853.333333 170.666667a85.333333 85.333333 0 0 1 85.333334 85.333333v512a85.333333 85.333333 0 0 1-85.333334 85.333333H170.666667a85.333333 85.333333 0 0 1-85.333334-85.333333V256a85.333333 85.333333 0 0 1 85.333334-85.333333h682.666666zM394.666667 661.333333a32 32 0 1 0 0 64 32 32 0 0 0 0-64z m362.666666 0H522.666667a32 32 0 0 0 0 64h234.666666a32 32 0 0 0 0-64zM202.666667 480a32 32 0 1 0 0 64 32 32 0 0 0 0-64z m448 0H330.666667a32 32 0 0 0 0 64h320a32 32 0 0 0 0-64zM330.666667 298.666667a32 32 0 1 0 0 64 32 32 0 0 0 0-64z m448 0H458.666667a32 32 0 0 0 0 64h320a32 32 0 0 0 0-64z"
              ></path>
            </svg>
          </v-icon>
          <v-container class="pa-0 ml-3">
            <p class="text-subtitle-1">{{ t('settings.app.danmaku') }}</p>
            <p class="text-caption">{{ t('settings.app.danmakuDescription') }}</p>
          </v-container>
        </v-container>
        <v-switch v-model="settings.showDanmaku" hide-details density="compact" color="primary"></v-switch>
      </v-container>
      <v-divider class="ml-4"></v-divider>
      <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
        <v-container class="pa-0 d-flex flex-row align-center">
          <v-icon :icon="mdiMicrophonePlus"></v-icon>
          <v-container class="pa-0 ml-3">
            <p class="text-subtitle-1">{{ t('settings.app.joinVoice') }}</p>
            <p class="text-caption">{{ t('settings.app.joinVoiceDescription') }}</p>
          </v-container>
        </v-container>
        <v-switch v-model="settings.autoJoinVoice" hide-details density="compact" color="primary"> </v-switch>
      </v-container>
      <v-divider class="ml-4"></v-divider>
      <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
        <v-container class="pa-0 d-flex flex-row align-center">
          <v-icon :icon="mdiPlayCircle"></v-icon>
          <v-container class="pa-0 ml-3">
            <p class="text-subtitle-1">{{ t('settings.app.autoContinue') }}</p>
            <p class="text-caption">{{ t('settings.app.autoContinueDescription') }}</p>
          </v-container>
        </v-container>
        <v-switch v-model="settings.autoContinue" hide-details density="compact" color="primary"> </v-switch>
      </v-container>
    </v-sheet>
    <v-sheet id="plates" class="mt-6 rounded-lg border">
      <v-card-title class="pt-4">{{ t('settings.app.homepage') }}</v-card-title>
      <v-card-subtitle>{{ t('settings.app.homepageHint') }}</v-card-subtitle>
      <v-row class="pa-4">
        <v-col cols="12" sm="6">
          <v-sheet class="rounded border h-100" min-height="100">
            <v-card-subtitle class="my-2">{{ t('settings.app.visiblePlates') }}</v-card-subtitle>
            <v-divider></v-divider>
            <vue-sortable
              :key="sortableKey"
              class="h-100"
              :list="visiblePlates"
              @end="
                (e) => onMoveEnd(e.oldIndex, e.newIndex, visiblePlates, e.from === e.to ? visiblePlates : hiddenPlates)
              "
              item-key="value"
              :options="{ group: 'shared', animation: 150 }"
            >
              <template #item="{ element }">
                <v-list-item :prepend-icon="element.icon" class="cursor-move" :key="element.value">
                  <v-list-item-title>{{ element.name }}</v-list-item-title>
                </v-list-item>
              </template>
            </vue-sortable>
          </v-sheet>
        </v-col>
        <v-col cols="12" sm="6">
          <v-sheet class="rounded border h-100" min-height="100">
            <v-card-subtitle class="my-2">{{ t('settings.app.hiddenPlates') }}</v-card-subtitle>
            <v-divider></v-divider>
            <vue-sortable
              :key="sortableKey"
              class="h-100"
              :list="hiddenPlates"
              @end="
                (e) => onMoveEnd(e.oldIndex, e.newIndex, hiddenPlates, e.from === e.to ? hiddenPlates : visiblePlates)
              "
              item-key="value"
              :options="{ group: 'shared', animation: 150 }"
            >
              <template #item="{ element }">
                <v-list-item :prepend-icon="element.icon" class="cursor-move" :key="element.value">
                  <v-list-item-title>{{ element.name }}</v-list-item-title>
                </v-list-item>
              </template>
            </vue-sortable>
          </v-sheet>
        </v-col>
      </v-row>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/store/settings';
import {
  mdiAnimationPlayOutline,
  mdiHistory,
  mdiMicrophonePlus,
  mdiMotionPlayOutline,
  mdiMultimedia,
  mdiPlayCircle,
  mdiSubtitles,
  mdiThemeLightDark,
  mdiTranslate,
} from '@mdi/js';
import { Sortable as VueSortable } from 'sortablejs-vue3';
import { onMounted, onUpdated, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useLayoutStore } from '@/store/layout';

const { t } = useI18n();
const route = useRoute();
const layout = useLayoutStore();
const { settings } = useSettingsStore();

const languages = [
  {
    title: '简体中文',
    value: 'zh-CN',
  },
  {
    title: 'English',
    value: 'en-US',
  },
];
const onLanguageChanged = () => {
  window.location.reload();
};
const themes = [
  {
    title: t('app.auto'),
    value: 'auto',
  },
  {
    title: t('layout.light'),
    value: 'light',
  },
  {
    title: t('layout.dark'),
    value: 'dark',
  },
];
const onThemeChanged = () => {
  try {
    if (settings.theme === 'auto') {
      const themeMedia = matchMedia('(prefers-color-scheme: dark)');
      layout.toggleDarkMode(themeMedia.matches);
    } else {
      layout.toggleDarkMode(settings.theme === 'dark');
    }
  } catch {}
};
const allPlates = [
  {
    name: t('resource.seriesUpdates'),
    icon: mdiMotionPlayOutline,
    value: 'series-update',
  },
  {
    name: t('resource.histories'),
    icon: mdiHistory,
    value: 'history',
  },
  {
    name: t('resource.mediaUpdates'),
    icon: mdiMultimedia,
    value: 'media-update',
  },
  {
    name: t('resource.allSeries'),
    icon: mdiAnimationPlayOutline,
    value: 'series',
  },
];
const visiblePlates = allPlates.filter(({ value }) => settings.plates.includes(value as any));
const hiddenPlates = allPlates.filter(({ value }) => !settings.plates.includes(value as any));
const sortableKey = ref(Date.now());
onUpdated(() => {
  sortableKey.value = Date.now();
});
const onMoveEnd = (from: number, to: number, origin: any[], target: any[]) => {
  const item = origin.splice(from, 1)[0];
  target.splice(to, 0, item);
  settings.plates = visiblePlates.map(({ value }) => value);
};

onMounted(() => {
  if (route.query.anchor) {
    const el = document.getElementById(route.query.anchor as string);
    el?.scrollIntoView({
      behavior: 'smooth',
    });
  }
});
</script>

<style scoped lang="sass"></style>
