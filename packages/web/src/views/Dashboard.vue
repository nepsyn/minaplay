<template>
  <v-layout class="page-height">
    <v-navigation-drawer class="d-none d-md-flex" mobile-breakpoint="md" location="right">
      <v-list :lines="false" density="compact" nav>
        <v-list-subheader class="font-weight-black">{{ t('layout.sections') }}</v-list-subheader>
        <v-list-item
          v-for="(tab, index) in tabs"
          :key="index"
          color="primary"
          :prepend-icon="tab.icon"
          :title="tab.text"
          :to="tab.to"
          replace
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main class="d-flex flex-column page-height">
      <nav-tabs class="d-flex d-md-none" :tabs="tabs"></nav-tabs>
      <to-top-container class="scrollable-container">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </to-top-container>
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import {
  mdiAccountMultiple,
  mdiAnimationPlayOutline,
  mdiCodeBraces,
  mdiFileMultipleOutline,
  mdiGaugeFull,
  mdiMultimedia,
  mdiRss,
  mdiVideoVintage,
  mdiViewComfy,
} from '@mdi/js';
import NavTabs from '@/components/app/NavTabs.vue';

const { t } = useI18n();

const tabs = computed(() => [
  {
    to: '/dashboard/system',
    icon: mdiGaugeFull,
    text: t('dashboard.sections.system'),
  },
  {
    to: '/dashboard/user',
    icon: mdiAccountMultiple,
    text: t('dashboard.sections.user'),
  },
  {
    to: '/dashboard/source',
    icon: mdiRss,
    text: t('dashboard.sections.source'),
  },
  {
    to: '/dashboard/rule',
    icon: mdiCodeBraces,
    text: t('dashboard.sections.rule'),
  },
  {
    to: '/dashboard/media',
    icon: mdiMultimedia,
    text: t('dashboard.sections.media'),
  },
  {
    to: '/dashboard/series',
    icon: mdiAnimationPlayOutline,
    text: t('dashboard.sections.series'),
  },
  {
    to: '/dashboard/episode',
    icon: mdiViewComfy,
    text: t('dashboard.sections.episode'),
  },
  {
    to: '/dashboard/live',
    icon: mdiVideoVintage,
    text: t('dashboard.sections.live'),
  },
  {
    to: '/dashboard/file',
    icon: mdiFileMultipleOutline,
    text: t('dashboard.sections.file'),
  },
]);
</script>

<style scoped lang="sass"></style>
