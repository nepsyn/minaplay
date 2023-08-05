<script lang="ts" setup>
import { ref } from 'vue';
import {
  mdiAccountMultiple,
  mdiChevronDown,
  mdiDownloadCircle,
  mdiFileMultiple,
  mdiFileVideo,
  mdiGaugeFull,
  mdiMultimedia,
  mdiRssBox,
} from '@mdi/js';
import ToTopContainer from '@/components/provider/ToTopContainer.vue';
import { useRouter } from 'vue-router';
import { PermissionEnum } from '@/api/enums/permission.enum';
import { useApp } from '@/store/app';

const app = useApp();
const router = useRouter();

const tabs = ref([
  {
    text: '总览',
    route: '/admin/overview',
    icon: mdiGaugeFull,
    permission: [PermissionEnum.ROOT_OP],
  },
  {
    text: '用户',
    route: '/admin/user',
    icon: mdiAccountMultiple,
    permission: [PermissionEnum.ROOT_OP, PermissionEnum.USER_OP],
  },
  {
    text: '订阅',
    route: '/admin/subscribe',
    icon: mdiRssBox,
    permission: [PermissionEnum.ROOT_OP, PermissionEnum.SUBSCRIBE_OP],
  },
  {
    text: '媒体文件',
    route: '/admin/media',
    icon: mdiFileVideo,
    permission: [PermissionEnum.ROOT_OP, PermissionEnum.MEDIA_OP],
  },
  {
    text: '剧集',
    route: '/admin/series',
    icon: mdiMultimedia,
    permission: [PermissionEnum.ROOT_OP, PermissionEnum.SERIES_OP],
  },
  {
    text: '文件',
    route: '/admin/file',
    icon: mdiFileMultiple,
    permission: [PermissionEnum.ROOT_OP, PermissionEnum.FILE_OP],
  },
  {
    text: '下载内容',
    route: '/admin/download',
    icon: mdiDownloadCircle,
    permission: [PermissionEnum.ROOT_OP],
  },
]);
</script>

<template>
  <v-container fluid class="pa-0 main-content d-flex flex-column">
    <v-toolbar border="b" color="background" density="compact">
      <v-container fluid class="pa-0 d-flex flex-row align-center">
        <v-tabs color="primary" density="compact" show-arrows>
          <template v-for="(tab, index) in tabs" :key="index">
            <v-tab
              v-if="app.hasPermission(...tab.permission)"
              rounded="0"
              :to="tab.route"
              :text="tab.text"
              :prepend-icon="tab.icon"
            ></v-tab>
          </template>
        </v-tabs>
        <v-spacer></v-spacer>
        <v-menu location="bottom">
          <template #activator="{ props }">
            <v-btn :icon="mdiChevronDown" class="d-flex d-sm-none" v-bind="props"></v-btn>
          </template>
          <v-card>
            <v-list class="pa-0" density="compact">
              <template v-for="(tab, index) in tabs" :key="index">
                <v-list-item
                  v-if="app.hasPermission(...tab.permission)"
                  :prepend-icon="tab.icon"
                  @click="router.push(tab.route)"
                >
                  {{ tab.text }}
                </v-list-item>
              </template>
            </v-list>
          </v-card>
        </v-menu>
      </v-container>
    </v-toolbar>
    <to-top-container class="scrollable-container">
      <router-view v-slot="{ Component }">
        <v-scroll-x-reverse-transition leave-absolute>
          <component :is="Component"></component>
        </v-scroll-x-reverse-transition>
      </router-view>
    </to-top-container>
  </v-container>
</template>

<style scoped></style>
