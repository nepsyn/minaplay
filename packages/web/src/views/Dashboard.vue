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
        <nav-tabs class="d-flex d-md-none" :tabs="tabs">
          <template #append>
            <v-bottom-sheet close-on-content-click scrollable>
              <v-card>
                <v-card-text>
                  <template v-for="(section, index) in sections" :key="index">
                    <v-list-subheader>{{ section.nav }}</v-list-subheader>
                    <v-row no-gutters>
                      <v-col cols="3" v-for="(tab, index) in section.tabs" :key="index">
                        <v-btn
                          class="w-100 text-caption text-center"
                          variant="text"
                          :color="route.path === tab.to ? 'primary' : undefined"
                          :prepend-icon="tab.icon"
                          stacked
                          :to="tab.to"
                          replace
                        >
                          {{ tab.text }}
                        </v-btn>
                      </v-col>
                    </v-row>
                  </template>
                </v-card-text>
              </v-card>
              <template #activator="{ props }">
                <v-btn variant="text" :icon="mdiApps" v-bind="props"></v-btn>
              </template>
            </v-bottom-sheet>
          </template>
        </nav-tabs>
        <to-top-container class="scrollable-container">
          <authed-router-view match="^/dashboard/[^/]+$" v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </authed-router-view>
        </to-top-container>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import ToTopContainer from '@/components/app/ToTopContainer.vue';
import { useI18n } from 'vue-i18n';
import {
  mdiAccountMultipleOutline,
  mdiAnimationPlayOutline,
  mdiApps,
  mdiCodeBraces,
  mdiFileMultipleOutline,
  mdiGaugeFull,
  mdiMultimedia,
  mdiPuzzleOutline,
  mdiRss,
  mdiScriptTextOutline,
  mdiShieldKeyOutline,
  mdiVideoVintage,
  mdiViewComfy,
} from '@mdi/js';
import NavTabs from '@/components/app/NavTabs.vue';
import { useRoute } from 'vue-router';
import AuthedRouterView from '@/components/app/AuthedRouterView.vue';

const { t } = useI18n();
const route = useRoute();

const systemTabs = [
  {
    to: '/dashboard/system',
    icon: mdiGaugeFull,
    text: t('dashboard.system'),
  },
  {
    to: '/dashboard/logs',
    icon: mdiScriptTextOutline,
    text: t('dashboard.logs'),
  },
  {
    to: '/dashboard/action-logs',
    icon: mdiShieldKeyOutline,
    text: t('dashboard.actionLogs'),
  },
  {
    to: '/dashboard/plugins',
    icon: mdiPuzzleOutline,
    text: t('dashboard.plugins'),
  },
];
const moduleTabs = [
  {
    to: '/dashboard/user',
    icon: mdiAccountMultipleOutline,
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
