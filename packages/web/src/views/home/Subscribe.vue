<script lang="ts" setup>
import { computed, reactive, Ref, ref } from 'vue';
import {
  mdiDownloadCircleOutline,
  mdiFileTreeOutline,
  mdiInformationOutline,
  mdiPlus,
  mdiProgressCheck,
  mdiProgressClose,
  mdiRefresh,
  mdiRss,
  mdiTimelineClockOutline,
} from '@mdi/js';
import { useSubscribeStore } from '@/store/subscribe';
import { useApp } from '@/store/app';
import { Api } from '@/api/api';
import { useRoute, useRouter } from 'vue-router';
import BlankFavicon from '@/assets/blank_favicon.png';
import { ApiQueryDto } from '@/interfaces/common.interface';
import { SourceEntity } from '@/interfaces/subscribe.interface';
import ItemsProvider from '@/components/ItemsProvider.vue';
import ToTopContainer from '@/components/ToTopContainer.vue';

const subscribe = useSubscribeStore();
const app = useApp();
const route = useRoute();
const router = useRouter();

const sourceId = computed(() => Number(route.params.id));

const sourcesQuery: ApiQueryDto<SourceEntity> = reactive({
  page: 0,
  size: 1024,
  sort: 'createAt',
  order: 'DESC',
});
const loadSources = async (done: any) => {
  try {
    const response = await Api.SubscribeSource.query(sourcesQuery);
    sourcesQuery.page!++;
    response.data.items.forEach((v) => subscribe.updateSource(v));
    done(subscribe.sources.length === response.data.total ? 'empty' : 'ok');
  } catch {
    app.toastError('加载订阅源列表失败');
    done('error');
  }
};
const resetSources = async () => {
  subscribe.clearSource();
  sourcesQuery.page = 0;
};

const sourceCreating = ref(false);
const createSource = async () => {
  if (sourceCreating.value) return;

  sourceCreating.value = true;
  try {
    const response = await Api.SubscribeSource.create({
      url: 'https://lorem-rss.herokuapp.com/feed',
      title: '订阅源标题',
      cron: '0 */30 * * * *',
      enabled: false,
    });
    subscribe.updateSource(response.data);
    await router.push(`/subscribe/${response.data.id}/detail`);
    app.toastSuccess('创建新订阅成功');
  } catch {
    app.toastError('创建新订阅失败');
  } finally {
    sourceCreating.value = false;
  }
};

const getFaviconUrl = (url: string) => {
  const u = new URL(url);
  return `${u.protocol}//${u.host}/favicon.ico`;
};

const tab = ref('detail');

const providerRef: Ref<any> = ref(null);
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
              @click="resetSources() & providerRef.load()"
              variant="outlined"
              color="primary"
              :loading="providerRef?.status === 'loading'"
              :prepend-icon="mdiRefresh"
              >刷新
            </v-btn>
            <v-btn
              class="ml-2"
              variant="outlined"
              color="warning"
              :prepend-icon="mdiPlus"
              :loading="sourceCreating"
              @click="createSource()"
              >添加
            </v-btn>
          </v-toolbar>
          <items-provider
            ref="providerRef"
            :items="subscribe.sources"
            :load-fn="loadSources"
            hide-empty
            class="pa-0 scrollable-container d-flex flex-column align-center"
          >
            <v-list class="py-0 w-100">
              <template v-for="source in subscribe.sources" :key="source.id">
                <v-list-item lines="two" :to="`/subscribe/${source.id}/${tab}`" active-class="source-active">
                  <div class="ban"></div>
                  <template #prepend>
                    <v-icon size="x-large">
                      <v-img :src="getFaviconUrl(source.url)">
                        <template v-slot:placeholder>
                          <v-img :src="BlankFavicon"></v-img>
                        </template>
                      </v-img>
                    </v-icon>
                  </template>
                  <v-list-item-title class="py-1 text-wrap font-weight-bold" v-text="source.title"></v-list-item-title>
                  <v-list-item-subtitle class="py-1" v-text="source.url"></v-list-item-subtitle>
                  <template #append>
                    <v-icon
                      :color="source.enabled ? 'success' : 'warning'"
                      :icon="source.enabled ? mdiProgressCheck : mdiProgressClose"
                    ></v-icon>
                  </template>
                </v-list-item>
                <v-divider class="py-0"></v-divider>
              </template>
            </v-list>
          </items-provider>
        </v-container>
      </v-col>
      <v-divider vertical class="fill-height"></v-divider>
      <v-col cols="8" class="pa-0">
        <v-container v-if="sourceId" fluid class="pa-0 main-content d-flex flex-column">
          <v-toolbar flat color="background" density="compact" border="b">
            <v-tabs v-model="tab" color="primary">
              <v-tab value="detail" :to="`/subscribe/${sourceId}/detail`" :prepend-icon="mdiInformationOutline">
                订阅源信息
              </v-tab>
              <v-tab value="rules" :to="`/subscribe/${sourceId}/rules`" :prepend-icon="mdiFileTreeOutline"
                >规则列表
              </v-tab>
              <v-tab value="raw" :to="`/subscribe/${sourceId}/raw`" :prepend-icon="mdiRss">数据查看</v-tab>
              <v-tab value="logs" :to="`/subscribe/${sourceId}/logs`" :prepend-icon="mdiTimelineClockOutline"
                >解析日志
              </v-tab>
              <v-tab value="downloads" :to="`/subscribe/${sourceId}/downloads`" :prepend-icon="mdiDownloadCircleOutline"
                >下载项目
              </v-tab>
            </v-tabs>
          </v-toolbar>
          <to-top-container class="scrollable-container">
            <router-view></router-view>
          </to-top-container>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="sass" scoped>
.ban
  position: absolute
  top: 0
  right: 0
  height: 100%

.source-active .ban
  border-left: 4px solid rgb(var(--v-theme-primary-lighten-1))
</style>
