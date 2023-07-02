<script lang="ts" setup>
import { ref } from 'vue';
import { mdiPlus, mdiRefresh } from '@mdi/js';
import { useSourceStore } from '@/store/source';
import { useApp } from '@/store/app';
import { Api } from '@/api/api';
import { useRouter } from 'vue-router';
import ItemsLoader from '@/components/ItemsLoader.vue';
import BlankFavicon from '@/assets/blank_favicon.png';

const sourceStore = useSourceStore();
const app = useApp();
const router = useRouter();

const sourceCreating = ref(false);
const createSource = async () => {
  sourceCreating.value = true;
  try {
    const response = await Api.SubscribeSource.create({
      url: 'https://lorem-rss.herokuapp.com/feed',
      title: '订阅源标题',
      cron: '0 */30 * * * *',
      enabled: false,
    });
    sourceStore.items.push(response.data);
    await router.push({ name: 'subscribe-detail', params: { id: response.data.id } });
  } catch {
    app.toast('创建新订阅失败！', 'error');
  } finally {
    sourceCreating.value = false;
  }
};

const getFaviconUrl = (url: string) => {
  const u = new URL(url);
  return `${u.protocol}//${u.host}/favicon.ico`;
};
</script>

<template>
  <v-container fluid class="pa-0 main-content d-flex flex-row">
    <v-row class="ma-0">
      <v-col cols="4" class="pa-0">
        <v-container fluid class="pa-0 d-flex flex-column align-center fill-height">
          <items-loader v-model="sourceStore.state" @error="app.toastError('获取订阅源数据失败！')" no-append>
            <template #prepend="{ load }">
              <v-toolbar flat color="background" border="b">
                <v-toolbar-title>订阅列表 ({{ sourceStore.items.length }})</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn
                  @click="sourceStore.state.reset() & load()"
                  variant="outlined"
                  color="primary"
                  :loading="sourceStore.state.loading"
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
            </template>
            <template #loading>
              <v-container class="d-flex my-4 justify-center align-center">
                <v-progress-circular color="primary" indeterminate></v-progress-circular>
              </v-container>
            </template>
            <v-container fluid class="pa-0 scrollable-container d-flex flex-column align-center">
              <v-list class="py-0 w-100">
                <template v-for="source in sourceStore.items" :key="source.id">
                  <v-list-item lines="two" :to="`/subscribe/${source.id}`" active-class="source-active">
                    <template #prepend>
                      <v-icon size="x-large">
                        <v-img :src="getFaviconUrl(source.url)">
                          <template v-slot:placeholder>
                            <v-img :src="BlankFavicon"></v-img>
                          </template>
                        </v-img>
                      </v-icon>
                    </template>
                    <v-list-item-title class="py-1 text-wrap" v-text="source.title"></v-list-item-title>
                    <v-list-item-subtitle class="py-1" v-text="source.url"></v-list-item-subtitle>
                  </v-list-item>
                  <v-divider class="py-0"></v-divider>
                </template>
              </v-list>
            </v-container>
          </items-loader>
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
