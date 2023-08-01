<script lang="ts" setup>
import { ref } from 'vue';
import { mdiAccountMultiple, mdiDownloadCircle, mdiFileVideo, mdiGaugeFull, mdiMultimedia, mdiRssBox } from '@mdi/js';
import ToTopContainer from '@/components/provider/ToTopContainer.vue';

const tabs = ref([
  {
    text: '总览',
    route: '/admin/overview',
    icon: mdiGaugeFull,
  },
  {
    text: '用户',
    route: '/admin/user',
    icon: mdiAccountMultiple,
  },
  {
    text: '订阅',
    route: '/admin/subscribe',
    icon: mdiRssBox,
  },
  {
    text: '媒体文件',
    route: '/admin/media',
    icon: mdiFileVideo,
  },
  {
    text: '剧集',
    route: '/admin/series',
    icon: mdiMultimedia,
  },
  {
    text: '下载内容',
    route: '/admin/download',
    icon: mdiDownloadCircle,
  },
]);
</script>

<template>
  <v-container fluid class="pa-0 main-content d-flex flex-column">
    <v-toolbar border="b" color="background" density="compact">
      <v-container fluid class="pa-0 d-flex flex-row align-center">
        <v-tabs color="primary" density="compact" show-arrows>
          <v-tab
            v-for="tab in tabs"
            :key="tab.route"
            rounded="0"
            :to="tab.route"
            :text="tab.text"
            :prepend-icon="tab.icon"
          ></v-tab>
        </v-tabs>
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
