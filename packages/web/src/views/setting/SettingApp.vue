<template>
  <v-container class="pa-0 pb-12">
    <span class="text-h4">{{ t('settings.sections.app') }}</span>
    <v-sheet class="mt-6 rounded-lg border">
      <v-card-title class="py-4">{{ t('settings.app.ui') }}</v-card-title>
      <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
        <v-container class="pa-0 d-flex flex-row align-center">
          <v-icon :icon="mdiTranslate"></v-icon>
          <v-container class="pa-0 ml-3">
            <p class="text-subtitle-1">{{ t('settings.app.language') }}</p>
            <p class="text-caption">{{ t('settings.app.languageDescription') }}</p>
          </v-container>
        </v-container>
        <v-combobox
          :items="languages"
          v-model="settings.locale"
          hide-details
          density="compact"
          variant="outlined"
          :return-object="false"
        >
        </v-combobox>
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
        <v-combobox
          :items="themes"
          v-model="settings.theme"
          hide-details
          density="compact"
          variant="outlined"
          :return-object="false"
        >
        </v-combobox>
      </v-container>
    </v-sheet>
    <v-sheet class="mt-6 rounded-lg border">
      <v-card-title class="py-4">{{ t('settings.app.common') }}</v-card-title>
      <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
        <v-container class="pa-0">
          <p class="text-subtitle-1">{{ t('settings.app.subtitle') }}</p>
          <p class="text-caption">{{ t('settings.app.subtitleDescription') }}</p>
        </v-container>
        <v-switch v-model="settings.showSubtitle" hide-details density="compact" color="primary"> </v-switch>
      </v-container>
      <v-divider class="ml-4"></v-divider>
      <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
        <v-container class="pa-0">
          <p class="text-subtitle-1">{{ t('settings.app.danmaku') }}</p>
          <p class="text-caption">{{ t('settings.app.danmakuDescription') }}</p>
        </v-container>
        <v-switch v-model="settings.showDanmaku" hide-details density="compact" color="primary"> </v-switch>
      </v-container>
      <v-divider class="ml-4"></v-divider>
      <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
        <v-container class="pa-0">
          <p class="text-subtitle-1">{{ t('settings.app.joinVoice') }}</p>
          <p class="text-caption">{{ t('settings.app.joinVoiceDescription') }}</p>
        </v-container>
        <v-switch v-model="settings.autoJoinVoice" hide-details density="compact" color="primary"> </v-switch>
      </v-container>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/store/settings';
import { mdiThemeLightDark, mdiTranslate } from '@mdi/js';

const { t } = useI18n();
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
</script>

<style scoped lang="sass"></style>
