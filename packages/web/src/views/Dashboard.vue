<template>
  <v-layout class="page-height">
    <v-navigation-drawer class="d-none d-md-flex" mobile-breakpoint="md" location="right">
      <v-list :lines="false" density="compact" nav>
        <template v-for="(section, index) in sections" :key="index">
          <v-list-subheader>{{ section.nav }}</v-list-subheader>
          <v-list-item
            v-for="(tab, index) in section.tabs"
            :key="index"
            color="primary"
            :prepend-icon="tab.icon"
            :title="tab.text"
            :to="tab.to"
            replace
          ></v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <v-container class="pa-0 d-flex flex-column page-height">
        <nav-tabs class="d-flex d-md-none" :tabs="tabs"></nav-tabs>
        <to-top-container class="scrollable-container">
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </to-top-container>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import { useI18n } from 'vue-i18n';
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

const systemTabs = [
  {
    to: '/dashboard/system',
    icon: mdiGaugeFull,
    text: t('dashboard.system'),
  },
];
const moduleTabs = [
  {
    to: '/dashboard/user',
    icon: mdiAccountMultiple,
    text: t('dashboard.user'),
  },
  {
    to: '/dashboard/source',
    icon: mdiRss,
    text: t('dashboard.source'),
  },
  {
    to: '/dashboard/rule',
    icon: mdiCodeBraces,
    text: t('dashboard.rule'),
  },
  {
    to: '/dashboard/media',
    icon: mdiMultimedia,
    text: t('dashboard.media'),
  },
  {
    to: '/dashboard/series',
    icon: mdiAnimationPlayOutline,
    text: t('dashboard.series'),
  },
  {
    to: '/dashboard/episode',
    icon: mdiViewComfy,
    text: t('dashboard.episode'),
  },
  {
    to: '/dashboard/live',
    icon: mdiVideoVintage,
    text: t('dashboard.live'),
  },
  {
    to: '/dashboard/file',
    icon: mdiFileMultipleOutline,
    text: t('dashboard.file'),
  },
];
const tabs = [...systemTabs, ...moduleTabs];

const sections = [
  {
    nav: t('dashboard.nav.application'),
    tabs: systemTabs,
  },
  {
    nav: t('dashboard.nav.module'),
    tabs: moduleTabs,
  },
];
</script>

<style scoped lang="sass"></style>
