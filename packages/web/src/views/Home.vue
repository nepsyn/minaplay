<script lang="ts" setup>
import {
  mdiAccountCircle,
  mdiCloudUploadOutline,
  mdiCog,
  mdiGithub,
  mdiMovieOpenPlay,
  mdiPencil,
  mdiRssBox,
  mdiVideoVintage,
  mdiViewDashboard,
  mdiWeatherNight,
  mdiWeatherSunny,
} from '@mdi/js';
import { ref } from 'vue';
import { useTheme } from 'vuetify';
import { vuetify } from '@/main';
import { useApp } from '@/store/app';
import { Api } from '@/api/api';
import { useRoute, useRouter } from 'vue-router';

const app = useApp();
const theme = useTheme();
const router = useRouter();
const route = useRoute();

const drawerWidth = ref(108);
const drawer = ref(vuetify.display.mdAndUp.value);

const darkMode = ref(false);
const toggleDarkMode = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark';
  darkMode.value = !darkMode.value;
};

const openGitHubLink = () => {
  window.open('https://github.com/nepsyn/minaplay');
};

const logoutConfirmDialog = ref(false);
const logout = () => {
  logoutConfirmDialog.value = false;

  app.setUser(undefined);
  Api.setToken(null);
  localStorage.removeItem('minaplay-token');
  app.toastSuccess('已注销登录');
  router.replace({
    path: '/login',
    query: {
      redirect_url: route.fullPath,
    },
  });
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
  <v-app-bar order="1" border="b" color="background" flat>
    <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
    <v-toolbar-title>MinaPlay</v-toolbar-title>
    <template v-slot:append>
      <div class="d-flex flex-row align-center">
        <v-tooltip text="媒体文件上传" location="bottom" open-delay="500">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" @click="app.uploadDrawer = !app.uploadDrawer">
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
        <v-divider class="mx-2" inset vertical></v-divider>
        <v-menu>
          <template #activator="{ props }">
            <v-avatar v-bind="props" style="cursor: pointer" size="40">
              <v-img>
                <template #placeholder>
                  <v-icon size="40" :icon="mdiAccountCircle"></v-icon>
                </template>
              </v-img>
            </v-avatar>
          </template>
          <v-card width="360" class="overflow-x-hidden">
            <v-container fluid class="d-flex flex-row align-center">
              <v-avatar size="64">
                <v-img>
                  <template #placeholder>
                    <v-icon size="64" :icon="mdiAccountCircle"></v-icon>
                  </template>
                </v-img>
              </v-avatar>
              <v-container fluid class="py-0 d-flex flex-column">
                <span class="text-h6 text-truncate">{{ app.user!.username }}</span>
                <v-container fluid class="pa-0">
                  <v-btn variant="tonal" color="primary" size="x-small" :prepend-icon="mdiPencil">编辑资料</v-btn>
                </v-container>
              </v-container>
            </v-container>
            <v-divider></v-divider>
            <v-dialog v-model="logoutConfirmDialog" width="auto" min-width="480">
              <template v-slot:activator="{ props: dialogProps }">
                <v-btn variant="plain" block color="error" v-bind="dialogProps">注销登录</v-btn>
              </template>
              <v-card>
                <v-card-title>注销确认</v-card-title>
                <v-card-text>确定要退出登录吗？</v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="primary" variant="text" @click="logoutConfirmDialog = false">取消</v-btn>
                  <v-btn color="error" variant="plain" @click="logout">确定</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-card>
        </v-menu>
      </div>
    </template>
  </v-app-bar>

  <v-navigation-drawer order="1" v-model="drawer" :width="drawerWidth" elevation="0">
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
