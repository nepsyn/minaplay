<script lang="ts" setup>
import { mdiFileVideo, mdiMultimedia } from '@mdi/js';
import ToTopContainer from '@/components/provider/ToTopContainer.vue';
import { ref } from 'vue';

const tabs = ref([
  {
    text: '剧集',
    route: 'series',
    icon: mdiMultimedia,
  },
  {
    text: '媒体文件',
    route: 'media',
    icon: mdiFileVideo,
  },
]);
</script>

<template>
  <v-container fluid class="pa-0 main-content d-flex flex-column">
    <v-toolbar border="b" color="background" density="compact">
      <v-container fluid class="pa-0 d-flex flex-row align-center">
        <v-tabs color="primary" density="compact">
          <v-tab
            v-for="tab in tabs"
            :key="tab.route"
            rounded="0"
            :to="`/${tab.route}`"
            :text="tab.text"
            :prepend-icon="tab.icon"
          ></v-tab>
        </v-tabs>
      </v-container>
    </v-toolbar>
    <to-top-container class="scrollable-container">
      <router-view v-slot="{ Component }">
        <v-scroll-x-reverse-transition leave-absolute>
          <keep-alive>
            <component :is="Component"></component>
          </keep-alive>
        </v-scroll-x-reverse-transition>
      </router-view>
    </to-top-container>
  </v-container>
</template>

<style lang="sass" scoped></style>
