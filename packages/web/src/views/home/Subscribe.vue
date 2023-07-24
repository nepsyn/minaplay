<script lang="ts" setup>
import { computed, reactive, Ref, ref } from 'vue';
import {
  mdiDownloadCircleOutline,
  mdiEmoticonSadOutline,
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
import ItemsProvider from '@/components/provider/ItemsProvider.vue';
import ToTopContainer from '@/components/provider/ToTopContainer.vue';
import { useDisplay } from 'vuetify';
import ActionBtn from '@/components/provider/ActionBtn.vue';

const subscribe = useSubscribeStore();
const app = useApp();
const route = useRoute();
const router = useRouter();
const display = useDisplay();

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

const tabs = ref([
  {
    text: '订阅源信息',
    route: 'detail',
    icon: mdiInformationOutline,
  },
  {
    text: '规则列表',
    route: 'rules',
    icon: mdiFileTreeOutline,
  },
  {
    text: '数据查看',
    route: 'raw',
    icon: mdiRss,
  },
  {
    text: '解析日志',
    route: 'logs',
    icon: mdiTimelineClockOutline,
  },
  {
    text: '下载项目',
    route: 'downloads',
    icon: mdiDownloadCircleOutline,
  },
]);
const tabValue = ref('detail');

const providerRef: Ref<any> = ref(null);
</script>

<template>
  <v-container fluid class="pa-0 main-content d-flex flex-column">
    <v-row class="ma-0">
      <v-col
        v-if="display.smAndUp.value || isNaN(sourceId)"
        :cols="display.smAndUp.value ? 4 : 12"
        class="pa-0 fill-height"
      >
        <v-container fluid class="pa-0 d-flex flex-column align-center fill-height">
          <v-toolbar flat color="background" border="b">
            <v-toolbar-title>订阅列表 ({{ subscribe.sources.length }})</v-toolbar-title>
            <v-spacer></v-spacer>
            <action-btn
              text="刷新"
              color="primary"
              :loading="providerRef?.status === 'loading'"
              @click="resetSources() & providerRef.load()"
              :icon="mdiRefresh"
            ></action-btn>
            <action-btn
              class="ml-2"
              text="添加"
              color="warning"
              :loading="sourceCreating"
              @click="createSource()"
              :icon="mdiPlus"
            ></action-btn>
          </v-toolbar>
          <items-provider
            ref="providerRef"
            :items="subscribe.sources"
            :load-fn="loadSources"
            hide-empty
            class="pa-0 scrollable-container d-flex flex-column align-center"
          >
            <template #default="{ status }">
              <v-list class="py-0 w-100">
                <template v-for="source in subscribe.sources" :key="source.id">
                  <v-list-item
                    lines="two"
                    :to="`/subscribe/${source.id}`"
                    @click.prevent="router.push(`/subscribe/${source.id}/${tabValue}`)"
                    active-class="source-active"
                  >
                    <div class="ban"></div>
                    <template #prepend>
                      <v-icon size="x-large">
                        <v-img :src="getFaviconUrl(source.url)" aspect-ratio="1">
                          <template #placeholder>
                            <v-img :src="BlankFavicon" aspect-ratio="1"></v-img>
                          </template>
                        </v-img>
                      </v-icon>
                    </template>
                    <v-list-item-title class="py-1 text-wrap font-weight-bold">{{ source.title }}</v-list-item-title>
                    <v-list-item-subtitle class="py-1">{{ source.url }}</v-list-item-subtitle>
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
              <v-container
                v-if="status !== 'loading' && subscribe.sources.length === 0"
                class="d-flex flex-column align-center justify-center fill-height"
              >
                <v-icon size="40" :icon="mdiEmoticonSadOutline"></v-icon>
                <div class="mt-2">
                  <span class="text-caption">还没有创建任何订阅，试试</span>
                  <a
                    class="text-decoration-none text-caption text-primary ml-2"
                    style="cursor: pointer"
                    @click="createSource"
                  >
                    <v-icon size="x-small" :icon="mdiPlus"></v-icon>
                    创建新订阅
                  </a>
                </div>
              </v-container>
            </template>
          </items-provider>
        </v-container>
      </v-col>
      <v-divider v-if="display.smAndUp.value" vertical class="fill-height"></v-divider>
      <v-col :cols="display.smAndUp.value ? 8 : 12" class="pa-0 fill-height">
        <v-container v-if="sourceId" fluid class="pa-0 main-content d-flex flex-column">
          <v-toolbar flat color="background" density="compact" border="b">
            <v-tabs v-model="tabValue" color="primary" show-arrows>
              <v-tab
                v-for="tab in tabs"
                replace
                :to="`/subscribe/${sourceId}/${tab.route}`"
                :text="tab.text"
                :key="tab.route"
                :value="tab.route"
                rounded="0"
                :prepend-icon="tab.icon"
              >
              </v-tab>
            </v-tabs>
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
