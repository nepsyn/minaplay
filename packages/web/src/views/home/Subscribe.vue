<script lang="ts" setup>
import { onMounted } from 'vue';
import { mdiPlus } from '@mdi/js';
import { useSubscribeStore } from '@/store/subscribe';

const subscribe = useSubscribeStore();

onMounted(async () => {
  await subscribe.fetchSources({ size: 1024 });
});
</script>

<template>
  <v-container fluid class="pa-0 main-content d-flex flex-row">
    <v-row class="ma-0">
      <v-col cols="4" class="pa-0">
        <v-container fluid class="pa-0 d-flex flex-column align-center">
          <v-toolbar flat color="background" border="b">
            <v-toolbar-title>订阅列表 ({{ subscribe.sources.length }})</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn variant="outlined" color="primary" :prepend-icon="mdiPlus"> 添加新订阅</v-btn>
          </v-toolbar>
          <v-progress-circular
            color="primary"
            v-if="subscribe.sourcesLoading"
            indeterminate
            class="my-4"
          ></v-progress-circular>
          <template v-else>
            <v-list v-if="subscribe.sources.length > 0" class="py-0 fill-width">
              <v-list-item
                :to="`/subscribe/${source.id}`"
                active-class="source-active"
                v-for="source in subscribe.sources"
                :key="source.id"
              >
                <v-list-item-title class="py-1" v-text="source.url"></v-list-item-title>
                <v-list-item-subtitle class="py-1" v-text="source.remark || '无备注'"></v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <span v-else class="text-caption my-4">还没有任何订阅~</span>
          </template>
        </v-container>
      </v-col>
      <v-divider vertical class="fill-height"></v-divider>
      <v-col class="pa-0">
        <router-view></router-view>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="sass" scoped>
.source-active
  border-right: 4px solid rgb(var(--v-theme-primary-lighten-1))
</style>
