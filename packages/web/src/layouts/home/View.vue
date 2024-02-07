<template>
  <v-app-bar order="1" border="b" color="background" flat>
    <v-app-bar-nav-icon variant="text" @click.stop="layout.navDrawer = !layout.navDrawer"></v-app-bar-nav-icon>

    <v-badge color="info" content="alpha">
      <v-toolbar-title>
        <router-link to="/" class="title-link" active-class="title-link">
          {{ t('app.name') }}
        </router-link>
      </v-toolbar-title>
    </v-badge>
    <template v-slot:append>
      <div class="d-flex flex-row align-center">
        <div class="d-none d-sm-flex">
          <v-tooltip v-for="(action, index) in actions" :key="index" location="bottom" open-delay="500">
            {{ action.text }}
            <template #activator="{ props }">
              <v-btn v-if="action.show" v-bind="props" icon @click="action.click()">
                <v-icon :icon="action.icon" size="large"></v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </div>
        <v-menu>
          <v-card max-width="360" class="overflow-x-hidden">
            <v-list density="compact" class="pa-0">
              <template v-for="(action, index) in actions" :key="index">
                <v-list-item
                  link
                  v-if="action.show"
                  @click="action.click()"
                  :title="action.text"
                  :prepend-icon="action.icon"
                ></v-list-item>
              </template>
            </v-list>
          </v-card>
          <template #activator="{ props }">
            <v-btn v-bind="props" class="d-flex d-sm-none" icon>
              <v-icon :icon="mdiDotsVertical" size="large"></v-icon>
            </v-btn>
          </template>
        </v-menu>
        <v-divider v-if="api.user" class="mx-2" inset vertical></v-divider>
        <v-menu v-if="api.user">
          <v-card min-width="240" max-width="360" class="overflow-x-hidden">
            <v-container fluid class="d-flex flex-row align-center">
              <user-avatar
                :src="api.user.avatar && api.File.buildRawPath(api.user.avatar.id, api.user.avatar.name)"
                size="64"
              ></user-avatar>
              <v-container fluid class="py-0 d-flex flex-column">
                <span class="text-h6 text-truncate">{{ api.user!.username }}</span>
                <v-container fluid class="pa-0">
                  <v-btn
                    variant="tonal"
                    color="primary"
                    size="x-small"
                    :prepend-icon="mdiPencil"
                    @click="router.push({ path: '/setting/profile' })"
                  >
                    {{ t('layout.user.edit') }}
                  </v-btn>
                </v-container>
              </v-container>
            </v-container>
            <v-divider></v-divider>
            <v-dialog width="auto">
              <template #default="{ isActive }">
                <v-card>
                  <v-card-title>{{ t('layout.user.logout.title') }}</v-card-title>
                  <v-card-text>{{ t('layout.user.logout.confirm') }}</v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" variant="text" @click="isActive.value = false">
                      {{ t('app.cancel') }}
                    </v-btn>
                    <v-btn color="error" variant="plain" @click="logout()" :loading="logoutPending">
                      {{ t('app.ok') }}
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </template>
              <template #activator="{ props }">
                <v-btn v-bind="props" variant="plain" block color="error">
                  {{ t('layout.user.logout.btn') }}
                </v-btn>
              </template>
            </v-dialog>
          </v-card>
          <template #activator="{ props }">
            <user-avatar
              v-bind="props"
              v-if="api.user"
              class="cursor-pointer"
              :src="api.user.avatar && api.File.buildRawPath(api.user?.avatar?.id, api.user?.avatar?.name)"
              size="40"
            >
            </user-avatar>
          </template>
        </v-menu>
      </div>
    </template>
  </v-app-bar>

  <v-navigation-drawer order="1" v-model="layout.navDrawer" :width="navDrawerWidth" elevation="0">
    <v-list class="py-0" density="compact">
      <template v-for="(nav, index) in navs" :key="index">
        <v-list-item
          :ripple="false"
          :style="{ height: `${navDrawerWidth * 0.85}px` }"
          :to="nav.route"
          active-class="nav-active"
          color="primary"
          draggable="false"
          link
        >
          <div class="ban position-absolute h-100"></div>
          <div class="d-flex flex-column align-center text-center">
            <v-icon :icon="nav.icon" size="large"></v-icon>
            <span class="text-caption mt-2">{{ nav.name }}</span>
          </div>
        </v-list-item>
      </template>
    </v-list>
  </v-navigation-drawer>

  <plugin-console></plugin-console>

  <v-main>
    <authed-router-view match="^/[^/]+$" />
  </v-main>
</template>

<script lang="ts" setup>
import { useLayoutStore } from '@/store/layout';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import {
  mdiCloudUploadOutline,
  mdiCodeBracesBox,
  mdiCog,
  mdiDotsVertical,
  mdiMovieOpenPlay,
  mdiPencil,
  mdiRssBox,
  mdiVideoVintage,
  mdiViewDashboard,
  mdiWeatherNight,
  mdiWeatherSunny,
} from '@mdi/js';
import { MessageSchema } from '@/lang';
import { useApiStore } from '@/store/api';
import UserAvatar from '@/components/user/UserAvatar.vue';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { useRoute, useRouter } from 'vue-router';
import { useToastStore } from '@/store/toast';
import { PermissionEnum } from '@/api/enums/permission.enum';
import PluginConsole from '@/components/plugin/PluginConsole.vue';
import AuthedRouterView from '@/components/app/AuthedRouterView.vue';

const { t } = useI18n<{ message: MessageSchema }>();
const layout = useLayoutStore();
const api = useApiStore();
const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const navDrawerWidth = ref(108);

const {
  request: logout,
  onResolved: onLogoutResolved,
  onRejected: onLogoutRejected,
  pending: logoutPending,
} = useAxiosRequest(async () => {
  return await api.Auth.logout();
});
onLogoutResolved(async () => {
  api.setToken(undefined);
  api.user = undefined;
  await router.replace({
    path: '/login',
    query: {
      redirectUrl: route.fullPath,
    },
  });
});
onLogoutRejected((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const actions = ref([
  {
    text: t('layout.actions.upload'),
    icon: mdiCloudUploadOutline,
    click: () => {
      layout.uploadDrawer = !layout.uploadDrawer;
    },
    show: computed(() =>
      api.hasPermission(PermissionEnum.ROOT_OP, PermissionEnum.FILE_OP, PermissionEnum.FILE_UPLOAD_VIDEO),
    ),
  },
  {
    text: computed(() => (layout.darkMode ? t('layout.light') : t('layout.dark'))),
    icon: computed(() => (layout.darkMode ? mdiWeatherSunny : mdiWeatherNight)),
    click: () => {
      layout.toggleDarkMode(!layout.darkMode);
    },
    show: true,
  },
]);

const navs = [
  {
    name: t('layout.navs.resource'),
    icon: mdiMovieOpenPlay,
    route: '/resource',
  },
  {
    name: t('layout.navs.live'),
    icon: mdiVideoVintage,
    route: '/live',
  },
  {
    name: t('layout.navs.source'),
    icon: mdiRssBox,
    route: '/source',
  },
  {
    name: t('layout.navs.rule'),
    icon: mdiCodeBracesBox,
    route: '/rule',
  },
  {
    name: t('layout.navs.dashboard'),
    icon: mdiViewDashboard,
    route: '/dashboard',
  },
  {
    name: t('layout.navs.setting'),
    icon: mdiCog,
    route: '/setting',
  },
];
</script>

<style lang="sass" scoped>
.ban
  left: 0
  top: 0

.nav-active .ban
  border-left: 4px solid rgb(var(--v-theme-primary-lighten-1))

.title-link
  color: rgb(var(--v-theme-on-background))
  text-decoration: none
</style>
