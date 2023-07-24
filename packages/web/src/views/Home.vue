<script lang="ts" setup>
import {
  mdiCloudUploadOutline,
  mdiCog,
  mdiDotsVertical,
  mdiGithub,
  mdiMovieOpenPlay,
  mdiPencil,
  mdiRssBox,
  mdiVideoVintage,
  mdiViewDashboard,
  mdiWeatherNight,
  mdiWeatherSunny,
} from '@mdi/js';
import { computed, ref } from 'vue';
import { useTheme } from 'vuetify';
import { vuetify } from '@/main';
import { useApp } from '@/store/app';
import { Api } from '@/api/api';
import { useRoute, useRouter } from 'vue-router';
import UserAvatar from '@/components/provider/UserAvatar.vue';

const app = useApp();
const theme = useTheme();
const router = useRouter();
const route = useRoute();

const drawerWidth = ref(108);
const drawer = ref(vuetify.display.mdAndUp.value);

const toggleDarkMode = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark';
  app.darkMode = !app.darkMode;
};

const openGitHubLink = () => {
  window.open('https://github.com/nepsyn/minaplay');
};

const logoutConfirmDialog = ref(false);
const logout = () => {
  logoutConfirmDialog.value = false;

  Api.setToken(null);
  app.setUser(undefined);
  app.toastSuccess('已注销登录');
  router.replace({
    path: '/login',
    query: {
      redirect_url: route.fullPath,
    },
  });
};

const actions = ref([
  {
    text: '媒体文件上传',
    icon: mdiCloudUploadOutline,
    click: () => {
      app.uploadDrawer = !app.uploadDrawer;
    },
  },
  {
    text: computed(() => '切换' + (app.darkMode ? '白天模式' : '夜间模式')),
    icon: computed(() => (app.darkMode ? mdiWeatherSunny : mdiWeatherNight)),
    click: toggleDarkMode,
  },
  {
    text: 'GitHub仓库',
    icon: mdiGithub,
    click: openGitHubLink,
  },
]);

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

    <v-badge color="info" content="alpha">
      <v-toolbar-title>MinaPlay</v-toolbar-title>
    </v-badge>
    <template v-slot:append>
      <div class="d-flex flex-row align-center">
        <div class="d-none d-sm-flex">
          <v-tooltip
            v-for="(action, index) in actions"
            :key="index"
            :text="action.text"
            location="bottom"
            open-delay="500"
          >
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props" @click="action.click">
                <v-icon :icon="action.icon" size="large"></v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </div>
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn class="d-flex d-sm-none" icon v-bind="props">
              <v-icon :icon="mdiDotsVertical" size="large"></v-icon>
            </v-btn>
          </template>
          <v-card max-width="360" class="overflow-x-hidden">
            <v-list density="compact" class="pa-0">
              <v-list-item
                link
                v-for="(action, index) in actions"
                :key="index"
                @click="action.click"
                :title="action.text"
                :prepend-icon="action.icon"
              >
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
        <v-divider v-if="app.user" class="mx-2" inset vertical></v-divider>
        <v-menu v-if="app.user">
          <template #activator="{ props }">
            <user-avatar
              :url="app.user.avatar && Api.File.buildRawPath(app.user.avatar.id)"
              v-bind="props"
              style="cursor: pointer"
              size="40"
            ></user-avatar>
          </template>
          <v-card min-width="240" max-width="360" class="overflow-x-hidden">
            <v-container fluid class="d-flex flex-row align-center">
              <user-avatar :url="app.user.avatar && Api.File.buildRawPath(app.user.avatar.id)" size="64"></user-avatar>
              <v-container fluid class="py-0 d-flex flex-column">
                <span class="text-h6 text-truncate">{{ app.user?.username }}</span>
                <v-container fluid class="pa-0">
                  <v-btn variant="tonal" color="primary" size="x-small" :prepend-icon="mdiPencil">编辑个人设置</v-btn>
                </v-container>
              </v-container>
            </v-container>
            <v-divider></v-divider>
            <v-dialog v-model="logoutConfirmDialog" width="auto">
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
