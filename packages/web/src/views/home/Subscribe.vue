<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { mdiPlus, mdiRefresh } from '@mdi/js';
import { useSubscribeStore } from '@/store/subscribe';
import { useAppStore } from '@/store/app';
import { Api } from '@/api/api';
import { useRouter } from 'vue-router';

const subscribe = useSubscribeStore();
const app = useAppStore();
const router = useRouter();

const sourceCreating = ref(false);
const createSource = async () => {
  sourceCreating.value = true;
  try {
    const response = await Api.SubscribeSource.create({
      url: 'https://example.com/feed',
      title: '订阅源标题',
      cron: '0 */30 * * * *',
      enabled: false,
    });
    subscribe.updateSource(response.data);
    await router.push({ name: 'subscribe-detail', params: { id: response.data.id } });
  } catch {
    app.toast('创建新订阅失败！', 'error');
  } finally {
    sourceCreating.value = false;
  }
};

onMounted(async () => {
  await subscribe.fetchSources({ size: 1024 });
});
</script>

<template>
  <v-container fluid class="pa-0 main-content d-flex flex-row">
    <v-row class="ma-0">
      <v-col cols="4" class="pa-0">
        <v-container fluid class="pa-0 d-flex flex-column align-center fill-height">
          <v-toolbar flat color="background" border="b">
            <v-toolbar-title>订阅列表 ({{ subscribe.sources.length }})</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn
              @click="subscribe.fetchSources({ size: 1024 })"
              variant="outlined"
              color="primary"
              :prepend-icon="mdiRefresh"
            >
              刷新
            </v-btn>
            <v-btn
              class="ml-2"
              variant="outlined"
              color="warning"
              :prepend-icon="mdiPlus"
              :loading="sourceCreating"
              @click="createSource"
            >
              添加
            </v-btn>
          </v-toolbar>
          <v-progress-circular
            color="primary"
            v-if="subscribe.sourcesLoading"
            indeterminate
            class="my-4"
          ></v-progress-circular>
          <v-container v-else fluid class="pa-0 scrollable-container d-flex flex-column align-center">
            <v-list v-if="subscribe.sources.length > 0" class="py-0 fill-width">
              <template v-for="source in subscribe.sources" :key="source.id">
                <v-list-item :to="`/subscribe/${source.id}`" active-class="source-active">
                  <v-list-item-title class="py-1" v-text="source.url"></v-list-item-title>
                  <v-list-item-subtitle class="py-1" v-text="source.remark || '无备注'"></v-list-item-subtitle>
                </v-list-item>
                <v-divider class="py-0"></v-divider>
              </template>
            </v-list>
            <span v-else class="text-body-2 my-4">还没有任何订阅~</span>
          </v-container>
        </v-container>
      </v-col>
      <v-divider vertical class="fill-height"></v-divider>
      <v-col cols="8" class="pa-0">
        <router-view></router-view>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="sass" scoped>
.source-active
  border-right: 4px solid rgb(var(--v-theme-primary-lighten-1))
</style>
