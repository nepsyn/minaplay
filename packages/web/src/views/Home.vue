<script lang="ts" setup>
import {
  mdiCloudUploadOutline,
  mdiCog,
  mdiGithub,
  mdiMovieOpenPlay,
  mdiRssBox,
  mdiVideoVintage,
  mdiViewDashboard,
  mdiWeatherNight,
  mdiWeatherSunny,
} from '@mdi/js';
import { ref } from 'vue';
import { useTheme } from 'vuetify';
import { vuetify } from '@/main';

const drawerWidth = ref(108);
const drawer = ref(vuetify.display.mdAndUp.value);

const darkMode = ref(false);
const theme = useTheme();
const toggleDarkMode = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark';
  darkMode.value = !darkMode.value;
};

const openGitHubLink = () => {
  window.open('https://github.com/nepsyn/minaplay');
};

const navs = [
  {
    name: '内容库',
    icon: mdiMovieOpenPlay,
    route: '/resource',
  },
  {
    name: '一起看',
    icon: mdiVideoVintage,
    route: '/live',
  },
  {
    name: '订阅',
    icon: mdiRssBox,
    route: '/subscribe',
  },
  {
    name: '控制台',
    icon: mdiViewDashboard,
    route: '/admin',
  },
  {
    name: '设置',
    icon: mdiCog,
    route: '/setting',
  },
];
</script>

<template>
  <v-layout class="overflow-hidden">
    <v-app-bar border="b" color="background" flat>
      <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>MinaPlay</v-toolbar-title>
      <template v-slot:append>
        <div class="d-flex flex-row align-center">
          <v-tooltip text="媒体文件上传" location="bottom" open-delay="500">
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props">
                <v-icon :icon="mdiCloudUploadOutline" size="large"></v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-divider class="mx-2" inset vertical></v-divider>
          <v-tooltip :text="darkMode ? '白天模式' : '夜间模式'" location="bottom" open-delay="500">
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props" @click="toggleDarkMode">
                <v-icon :icon="darkMode ? mdiWeatherSunny : mdiWeatherNight" size="large"></v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-tooltip location="bottom" open-delay="500" text="GitHub仓库">
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props" @click="openGitHubLink">
                <v-icon :icon="mdiGithub" size="large"></v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </template>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" :width="drawerWidth" elevation="0">
      <v-list class="py-0" density="compact">
        <template v-for="({ icon, name, route }, index) in navs" :key="index">
          <v-list-item
            :ripple="false"
            :style="{ height: `${drawerWidth - 20}px` }"
            :to="route"
            active-class="nav-active"
            color="primary"
            draggable="false"
            link
          >
            <div class="ban"></div>
            <div class="d-flex flex-column align-center">
              <v-icon :icon="icon" size="large"></v-icon>
              <span class="text-caption mt-2">{{ name }}</span>
            </div>
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>
  </v-layout>
</template>

<style lang="sass" scoped>
.ban
  position: absolute
  top: 0
  left: 0
  height: 100%

.nav-active .ban
  border-left: 4px solid rgb(var(--v-theme-primary-lighten-1))
</style>
