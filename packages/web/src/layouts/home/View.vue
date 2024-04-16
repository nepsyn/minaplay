<template>
  <v-app-bar order="1" border="b" color="background" flat>
    <v-app-bar-nav-icon variant="text" @click.stop="layout.navDrawer = !layout.navDrawer"></v-app-bar-nav-icon>

    <v-toolbar-title>
      <router-link to="/" class="title-link" active-class="title-link">
        {{ t('app.name') }}
      </router-link>
    </v-toolbar-title>
    <template v-slot:append>
      <div class="d-flex flex-row align-center">
        <div class="d-none d-sm-flex">
          <v-tooltip v-for="(action, index) in actions" :key="index" location="bottom" open-delay="500">
            {{ action.text }}
            <template #activator="{ props }">
              <v-btn v-if="action.show" v-bind="props" :icon="action.icon" @click="action.click()"> </v-btn>
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
        <v-menu v-if="api.user">
          <v-card min-width="240" max-width="360" class="overflow-x-hidden">
            <v-container fluid class="d-flex flex-row align-center">
              <user-avatar :src="api.user.avatar && api.File.buildRawPath(api.user.avatar)" size="64"></user-avatar>
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
            <v-list density="compact">
              <v-list-item color="primary" @click="layout.notificationWindow = true">
                <template #prepend>
                  <v-icon :icon="mdiBell"></v-icon>
                </template>
                {{ t('layout.user.notification.title') }}
                <template #append>
                  <v-badge
                    inline
                    v-if="notification.unread.length > 0"
                    color="error-darken-1"
                    :content="notification.unread.length"
                  ></v-badge>
                </template>
              </v-list-item>
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
                  <v-list-item :prepend-icon="mdiLogout" v-bind="props" variant="plain" base-color="error">
                    {{ t('layout.user.logout.btn') }}
                  </v-list-item>
                </template>
              </v-dialog>
            </v-list>
          </v-card>
          <template #activator="{ props }">
            <v-badge
              color="error-darken-1"
              :model-value="notification.unread.length > 0"
              offset-x="4"
              offset-y="4"
              :content="notification.unread.length"
            >
              <user-avatar
                v-bind="props"
                v-if="api.user"
                class="cursor-pointer ml-2"
                :src="api.user.avatar && api.File.buildRawPath(api.user?.avatar)"
                size="40"
              >
              </user-avatar>
            </v-badge>
          </template>
        </v-menu>
      </div>
    </template>
  </v-app-bar>

  <v-navigation-drawer order="1" v-model="layout.navDrawer" elevation="0">
    <v-list nav slim density="comfortable" :lines="false">
      <template v-for="(nav, index) in navs" :key="index">
        <v-list-group v-if="nav.children">
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" :prepend-icon="nav.icon" :title="nav.name" draggable="false"></v-list-item>
          </template>
          <template v-for="(subNav, subIndex) in nav.children" :item="subIndex">
            <v-list-subheader v-if="subNav.isHeader" class="font-weight-black text-high-emphasis">
              {{ subNav.name }}
            </v-list-subheader>
            <v-divider class="my-3 ml-10" v-else-if="subNav.isDivider"></v-divider>
            <v-list-item
              v-else
              :to="subNav.route"
              :prepend-icon="subNav.icon"
              exact
              color="primary"
              :title="subNav.name"
              draggable="false"
            >
            </v-list-item>
          </template>
        </v-list-group>
        <v-list-item
          v-else
          :to="nav.route"
          exact
          color="primary"
          :prepend-icon="nav.icon"
          :title="nav.name"
          draggable="false"
        >
        </v-list-item>
      </template>
    </v-list>
  </v-navigation-drawer>

  <plugin-console v-if="api.hasPermission(PermissionEnum.ROOT_OP)"></plugin-console>
  <notification-window></notification-window>

  <v-main>
    <authed-router-view match="^/[^/]+$" />
  </v-main>
</template>

<script lang="ts" setup>
import { useLayoutStore } from '@/store/layout';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import {
  mdiAccountCog,
  mdiAccountMultipleOutline,
  mdiAnimationPlayOutline,
  mdiBell,
  mdiCloudUploadOutline,
  mdiCodeBraces,
  mdiCog,
  mdiConsole,
  mdiCookieCog,
  mdiDotsVertical,
  mdiDownload,
  mdiFileMultipleOutline,
  mdiGaugeFull,
  mdiHome,
  mdiInformation,
  mdiLogout,
  mdiMagnify,
  mdiMovieOpenPlay,
  mdiMultimedia,
  mdiPencil,
  mdiPuzzleOutline,
  mdiRss,
  mdiRssBox,
  mdiScriptTextOutline,
  mdiShieldKeyOutline,
  mdiVideoVintage,
  mdiViewComfy,
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
import NotificationWindow from '@/components/notification/NotificationWindow.vue';
import { useNotificationStore } from '@/store/notification';

const { t } = useI18n<{ message: MessageSchema }>();
const layout = useLayoutStore();
const api = useApiStore();
const route = useRoute();
const router = useRouter();
const notification = useNotificationStore();
const toast = useToastStore();

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
onLogoutRejected(async (error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
  await router.replace({
    path: '/login',
    query: {
      redirectUrl: route.fullPath,
    },
  });
});

const actions = ref([
  {
    text: t('layout.actions.pluginConsole'),
    icon: mdiConsole,
    click: () => {
      layout.pluginConsoleSheet = !layout.pluginConsoleSheet;
    },
    show: computed(() => api.hasPermission(PermissionEnum.ROOT_OP)),
  },
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
    children: [
      {
        route: '/resource',
        icon: mdiHome,
        name: t('layout.navs.home'),
      },
      {
        route: '/resource/search',
        icon: mdiMagnify,
        name: t('layout.navs.search'),
      },
    ],
  },
  {
    name: t('layout.navs.live'),
    icon: mdiVideoVintage,
    route: '/live',
  },
  {
    name: t('layout.navs.subscribe'),
    icon: mdiRssBox,
    children: [
      {
        icon: mdiRss,
        route: '/source',
        name: t('layout.navs.source'),
      },
      {
        route: '/rule',
        icon: mdiCodeBraces,
        name: t('layout.navs.rule'),
      },
      {
        route: '/download',
        icon: mdiDownload,
        name: t('layout.navs.download'),
      },
    ],
  },
  {
    name: t('layout.navs.dashboard'),
    icon: mdiViewDashboard,
    children: [
      {
        isHeader: true,
        name: t('dashboard.nav.application'),
      },
      {
        route: '/dashboard/system',
        icon: mdiGaugeFull,
        name: t('dashboard.system'),
      },
      {
        route: '/dashboard/logs',
        icon: mdiScriptTextOutline,
        name: t('dashboard.logs'),
      },
      {
        route: '/dashboard/action-logs',
        icon: mdiShieldKeyOutline,
        name: t('dashboard.actionLogs'),
      },
      {
        route: '/dashboard/plugins',
        icon: mdiPuzzleOutline,
        name: t('dashboard.plugins'),
      },
      {
        isDivider: true,
      },
      {
        isHeader: true,
        name: t('dashboard.nav.module'),
      },
      {
        route: '/dashboard/user',
        icon: mdiAccountMultipleOutline,
        name: t('dashboard.user'),
      },
      {
        route: '/dashboard/source',
        icon: mdiRss,
        name: t('dashboard.source'),
      },
      {
        route: '/dashboard/rule',
        icon: mdiCodeBraces,
        name: t('dashboard.rule'),
      },
      {
        route: '/dashboard/media',
        icon: mdiMultimedia,
        name: t('dashboard.media'),
      },
      {
        route: '/dashboard/series',
        icon: mdiAnimationPlayOutline,
        name: t('dashboard.series'),
      },
      {
        route: '/dashboard/episode',
        icon: mdiViewComfy,
        name: t('dashboard.episode'),
      },
      {
        route: '/dashboard/live',
        icon: mdiVideoVintage,
        name: t('dashboard.live'),
      },
      {
        route: '/dashboard/file',
        icon: mdiFileMultipleOutline,
        name: t('dashboard.file'),
      },
    ],
  },
  {
    name: t('layout.navs.setting'),
    icon: mdiCog,
    children: [
      {
        route: '/setting/app',
        icon: mdiCookieCog,
        name: t('settings.sections.app'),
      },
      {
        route: '/setting/profile',
        icon: mdiAccountCog,
        name: t('settings.sections.profile'),
      },
    ],
  },
  {
    name: t('layout.navs.about'),
    icon: mdiInformation,
    route: '/about',
  },
];
</script>

<style lang="sass" scoped>
.title-link
  color: rgb(var(--v-theme-on-background))
  text-decoration: none
</style>
