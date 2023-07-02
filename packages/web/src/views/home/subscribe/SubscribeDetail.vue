<script setup lang="ts">
import { useSourceStore } from '@/store/source';
import { computed, Ref, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { DownloadItemEntity, FetchLogEntity, RuleEntity, SourceEntity } from '@/api/interfaces/subscribe.interface';
import { useApp } from '@/store/app';
import {
  mdiAlertCircle,
  mdiCheck,
  mdiCheckCircle,
  mdiDownloadCircle,
  mdiDownloadCircleOutline,
  mdiFileTreeOutline,
  mdiInformationOutline,
  mdiPencilLock,
  mdiPlus,
  mdiRefresh,
  mdiRss,
  mdiTimelineClockOutline,
} from '@mdi/js';
import { Api } from '@/api/api';
import { Codemirror } from 'vue-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { useTheme } from 'vuetify';
import { javascript } from '@codemirror/lang-javascript';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import _ from 'lodash';
import ItemsLoader from '@/components/ItemsLoader.vue';
import { createItemsLoaderState, createSingleItemLoaderState } from '@/utils';
import SingleItemLoader from '@/components/SingleItemLoader.vue';
import ToTopContainer from '@/components/ToTopContainer.vue';

const app = useApp();
const sourceStore = useSourceStore();
const route = useRoute();
const router = useRouter();
const theme = useTheme();

const routes = ['#info', '#rules', '#raw', '#log', '#download'];
const tab = ref(routes.includes(String(route.hash)) ? routes.indexOf(String(route.hash)) : 0);

const sourceLoaderRef: Ref<any> = ref(null);
const sourceState = createSingleItemLoaderState<SourceEntity>({
  loadFn: async () => await Api.SubscribeSource.getById(Number(route.params.id))(),
});
const source = computed({
  get() {
    return sourceState.item as SourceEntity;
  },
  set(value) {
    sourceState.item = value;
  },
});

const runFetchJobLoading = ref(false);
const runFetchJob = _.throttle(
  async () => {
    runFetchJobLoading.value = true;
    try {
      await Api.SubscribeSource.invokeFetchJobById(source.value.id)();
      app.toast('请求更新成功', 'success');
    } catch {
      app.toast('请求更新失败！', 'error');
    } finally {
      runFetchJobLoading.value = false;
    }
  },
  4000,
  { trailing: false },
);

const sourceSaving = ref(false);
const saveSource = async () => {
  sourceSaving.value = true;
  try {
    const { id, user, enabled, createAt, updateAt, ...data } = source.value;
    const response = await Api.SubscribeSource.update(source.value.id)(data);
    source.value = response.data;
    sourceStore.update(source.value);
    app.toast('订阅源信息已保存', 'success');
  } catch {
    app.toast('保存订阅源信息失败！', 'error');
  } finally {
    sourceSaving.value = false;
  }
};

const enabledToggling = ref(false);
const toggleEnabled = async () => {
  enabledToggling.value = true;
  try {
    const response = await Api.SubscribeSource.update(source.value.id)({
      enabled: source.value.enabled,
    });
    source.value = {
      ...source.value,
      ...response.data,
    };
    sourceStore.update(source.value);
  } catch {
    app.toast('更改订阅源启用状态失败！', 'error');
  } finally {
    enabledToggling.value = false;
  }
};

const sourceDeleting = ref(false);
const deleteSource = async () => {
  sourceDeleting.value = true;
  try {
    await Api.SubscribeSource.delete(source.value.id)();
    sourceStore.delete(source.value.id);
    await router.replace({ name: 'subscribe' });
    app.toast('订阅源已成功删除', 'success');
  } catch {
    app.toast('删除订阅源失败！', 'error');
  } finally {
    sourceDeleting.value = false;
  }
};

const rulesExpanded: Ref<number[]> = ref([]);
const onRulesLoaded = () => {
  rulesExpanded.value = rulesState.items.map((v) => v.id);
};
const ruleCodeEditorExtensions = computed(() =>
  theme.global.name.value === 'dark' ? [javascript(), oneDark] : [javascript()],
);
const rulesState = createItemsLoaderState<RuleEntity>({
  loadFn: async (option: { page: number; size: number }) =>
    await Api.SubscribeSource.getRulesById(source.value.id)({
      page: option.page,
      size: option.size,
    }),
});
const editRuleId: Ref<number | undefined> = ref(undefined);
const saveRuleCode = _.throttle(
  async (id: number, code?: string) => {
    editRuleId.value = id;
    try {
      await Api.SubscribeRule.update(id)({ code });
      app.toastSuccess('保存规则代码成功');
    } catch {
      app.toastError('保存规则代码失败！');
    } finally {
      editRuleId.value = undefined;
    }
  },
  3000,
  { trailing: false },
);

const rawDataState = createSingleItemLoaderState<object>({
  loadFn: _.throttle(async () => await Api.SubscribeSource.fetchRawData(source.value.id)(), 4000, { trailing: false }),
});
const rawData = computed(() => JSON.stringify(rawDataState.item, null, 2));
const rawDataViewerExtensions = computed(() => (theme.global.name.value === 'dark' ? [json(), oneDark] : [json()]));
const onRawDataError = (error: any) => {
  if (error.response?.data?.code === ErrorCodeEnum.INVALID_SUBSCRIBE_SOURCE_FORMAT) {
    app.toast('订阅源格式错误，请检查订阅源URL！', 'error');
  } else {
    app.toast('获取订阅源数据失败！', 'error');
  }
};

const fetchLogsState = createItemsLoaderState<FetchLogEntity>({
  size: 5,
  loadFn: async (option: { page: number; size: number }) =>
    await Api.SubscribeSource.getFetchLogsById(source.value.id)({
      page: option.page,
      size: option.size,
    }),
});

const getDownloadItemColor = (item: DownloadItemEntity) => {
  return item.status === 'DOWNLOADED' ? 'success' : item.status === 'DOWNLOADING' ? 'secondary-lighten-1' : 'error';
};
const getDownloadItemIcon = (item: DownloadItemEntity) => {
  return item.status === 'DOWNLOADED'
    ? mdiCheckCircle
    : item.status === 'DOWNLOADING'
    ? mdiDownloadCircle
    : mdiAlertCircle;
};
const getDownloadItemStatusText = (item: DownloadItemEntity) => {
  return item.status === 'DOWNLOADED' ? '下载完成' : item.status === 'DOWNLOADING' ? '正在下载' : '下载失败';
};
const downloadItemsState = createItemsLoaderState<DownloadItemEntity>({
  loadFn: async (option: { page: number; size: number }) =>
    await Api.SubscribeSource.getDownloadItemsById(source.value.id)({
      page: option.page,
      size: option.size,
    }),
});

watch(
  () => route.params,
  async () => {
    const id = Number(route.params.id);
    if ((route.params.id as any) !== undefined && !isNaN(id)) {
      // reset states
      rulesState.reset();
      rawDataState.reset();
      fetchLogsState.reset();
      sourceState.reset();
      downloadItemsState.reset();

      // cancel throttled
      (rawDataState.loadFn as _.DebouncedFunc<any>).cancel();
      runFetchJob.cancel();
      saveRuleCode.cancel();

      if (sourceLoaderRef.value !== null) {
        await sourceLoaderRef.value.load();
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <v-container fluid class="pa-0 main-content d-flex flex-column">
    <v-toolbar flat color="background" density="compact" border="b">
      <v-tabs v-model="tab" color="primary">
        <v-tab :value="0" :prepend-icon="mdiInformationOutline">订阅源信息</v-tab>
        <v-tab :value="1" :prepend-icon="mdiFileTreeOutline">规则列表</v-tab>
        <v-tab :value="2" :prepend-icon="mdiRss">数据查看</v-tab>
        <v-tab :value="3" :prepend-icon="mdiTimelineClockOutline">解析日志</v-tab>
        <v-tab :value="4" :prepend-icon="mdiDownloadCircleOutline">下载项目</v-tab>
      </v-tabs>
    </v-toolbar>
    <to-top-container class="scrollable-container">
      <single-item-loader ref="sourceLoaderRef" v-model="sourceState" @error="app.toastError('获取订阅源数据失败！')">
        <template #default="{ load }">
          <v-window v-model="tab" class="pa-6">
            <v-window-item class="fill-height" :value="0">
              <v-container>
                <v-container class="pa-0 d-flex flex-row align-center">
                  <span class="text-h6">基本信息</span>
                  <v-spacer></v-spacer>
                  <v-btn variant="outlined" color="primary" :prepend-icon="mdiRefresh" @click="load">刷新</v-btn>
                </v-container>
                <v-divider class="my-4"></v-divider>
                <v-container v-if="source" class="my-4 pa-0">
                  <span class="text-body-1">ID</span>
                  <v-text-field
                    class="mt-2"
                    variant="outlined"
                    hide-details
                    color="primary"
                    density="compact"
                    v-model="source.id"
                    readonly
                    :append-inner-icon="mdiPencilLock"
                  ></v-text-field>
                </v-container>
                <v-container class="my-4 pa-0">
                  <span class="text-body-1">订阅地址</span>
                  <v-text-field
                    class="mt-2"
                    variant="outlined"
                    hide-details
                    color="primary"
                    density="compact"
                    v-model="source.url"
                    maxlength="256"
                  ></v-text-field>
                </v-container>
                <v-container class="my-4 pa-0">
                  <span class="text-subtitle-1">CRON表达式</span>
                  <v-text-field
                    class="mt-2"
                    variant="outlined"
                    hide-details
                    color="primary"
                    density="compact"
                    v-model="source.cron"
                    maxlength="60"
                  ></v-text-field>
                </v-container>
                <v-container class="my-4 pa-0">
                  <span class="text-subtitle-1">标题</span>
                  <v-text-field
                    class="mt-2"
                    variant="outlined"
                    hide-details
                    color="primary"
                    density="compact"
                    v-model="source.title"
                    maxlength="100"
                  ></v-text-field>
                </v-container>
                <v-container class="my-4 pa-0">
                  <span class="text-subtitle-1">备注</span>
                  <v-text-field
                    class="mt-2"
                    variant="outlined"
                    hide-details
                    color="primary"
                    density="compact"
                    v-model="source.remark"
                    maxlength="40"
                  ></v-text-field>
                </v-container>
                <v-container class="my-4 pa-0">
                  <v-btn
                    block
                    variant="tonal"
                    color="info"
                    :prepend-icon="mdiCheck"
                    :loading="sourceSaving"
                    @click="saveSource"
                  >
                    保存修改
                  </v-btn>
                </v-container>
                <v-container class="pa-0 mt-12">
                  <span class="text-h6">其它操作</span>
                </v-container>
                <v-card class="my-4" variant="outlined">
                  <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
                    <v-container class="pa-0">
                      <p class="text-subtitle-1">立即更新</p>
                      <p class="text-caption">立即更新并解析当前订阅源的资源内容。</p>
                    </v-container>
                    <v-btn
                      class="ml-4"
                      variant="tonal"
                      color="warning"
                      :loading="runFetchJobLoading"
                      @click="runFetchJob"
                    >
                      立即更新
                    </v-btn>
                  </v-container>
                  <v-divider></v-divider>
                  <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
                    <v-container class="pa-0">
                      <p class="text-subtitle-1">是否启用</p>
                      <p class="text-caption">
                        当订阅源未启用时，Minaplay不会根据CRON表达式对该订阅源内容进行定时检索，该订阅源中的最新资料将不会同步到Minaplay中。
                      </p>
                    </v-container>
                    <v-switch
                      class="ml-4"
                      v-model="source.enabled"
                      color="secondary"
                      hide-details
                      density="compact"
                      :loading="enabledToggling"
                      @change="toggleEnabled"
                    ></v-switch>
                  </v-container>
                  <v-divider></v-divider>
                  <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
                    <v-container class="pa-0">
                      <p class="text-subtitle-1">删除订阅源</p>
                      <p class="text-caption">一旦删除此订阅源，Minaplay将不再接收该订阅源中的任何更新，请谨慎操作。</p>
                    </v-container>
                    <v-menu location="left">
                      <template #activator="{ props }">
                        <v-btn class="ml-4" variant="tonal" color="error" v-bind="props" :loading="sourceDeleting">
                          删除订阅源
                        </v-btn>
                      </template>
                      <v-card>
                        <v-card-title>删除确认</v-card-title>
                        <v-card-text>确定要删除订阅源吗？该操作不可撤销！</v-card-text>
                        <v-card-actions>
                          <v-spacer></v-spacer>
                          <v-btn color="primary" variant="text">取消</v-btn>
                          <v-btn color="error" variant="plain" @click="deleteSource">确认</v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-menu>
                  </v-container>
                </v-card>
              </v-container>
            </v-window-item>
            <v-window-item class="fill-height" :value="1">
              <v-container>
                <items-loader
                  v-model="rulesState"
                  @loaded="onRulesLoaded"
                  @error="app.toastError('查询规则列表失败！')"
                >
                  <template #prepend="{ load }">
                    <v-container class="pa-0 d-flex flex-row align-center">
                      <span class="text-h6">订阅源规则 ({{ rulesState.total }})</span>
                      <v-spacer></v-spacer>
                      <v-btn
                        variant="outlined"
                        color="primary"
                        :loading="rulesState.loading"
                        :prepend-icon="mdiRefresh"
                        @click="rulesState.reset() & load()"
                      >
                        重新加载
                      </v-btn>
                      <v-btn class="ml-2" variant="outlined" color="warning" :prepend-icon="mdiPlus">添加</v-btn>
                    </v-container>
                    <v-divider class="my-4"></v-divider>
                  </template>
                  <v-card variant="outlined">
                    <v-expansion-panels multiple variant="accordion" v-model="rulesExpanded">
                      <v-expansion-panel elevation="0" v-for="rule in rulesState.items" :value="rule.id" :key="rule.id">
                        <v-expansion-panel-title>
                          <span class="text-subtitle-1 font-weight-bold">{{ rule.remark || '未命名规则' }}</span>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <codemirror v-model="rule.code" :extensions="ruleCodeEditorExtensions"></codemirror>
                          <v-divider class="my-2"></v-divider>
                          <v-container fluid="" class="pa-0 d-flex flex-row justify-end">
                            <v-btn
                              variant="tonal"
                              color="info"
                              :prepend-icon="mdiCheck"
                              @click="saveRuleCode(rule.id, rule.code)"
                              :loading="editRuleId === rule.id"
                              :disabled="editRuleId !== undefined && editRuleId !== rule.id"
                            >
                              保存代码
                            </v-btn>
                          </v-container>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </v-card>
                </items-loader>
              </v-container>
            </v-window-item>
            <v-window-item class="fill-height" :value="2">
              <v-container>
                <single-item-loader lazy v-model="rawDataState" @error="onRawDataError">
                  <template #prepend="{ load }">
                    <v-container class="pa-0 d-flex flex-row align-center">
                      <span class="text-h6">数据查看</span>
                      <v-spacer></v-spacer>
                      <v-btn
                        variant="outlined"
                        color="primary"
                        :prepend-icon="mdiRefresh"
                        :loading="rawDataState.loading"
                        @click="load"
                      >
                        刷新
                      </v-btn>
                    </v-container>
                    <v-divider class="my-4"></v-divider>
                  </template>
                  <codemirror v-model="rawData" disabled :extensions="rawDataViewerExtensions"></codemirror>
                </single-item-loader>
              </v-container>
            </v-window-item>
            <v-window-item class="fill-height" :value="3">
              <v-container>
                <items-loader v-model="fetchLogsState" @error="app.toastError('获取解析日志失败！')">
                  <template #prepend="{ load }">
                    <v-container class="pa-0 d-flex flex-row align-center">
                      <span class="text-h6">解析日志 ({{ fetchLogsState.total }})</span>
                      <v-spacer></v-spacer>
                      <v-btn
                        variant="outlined"
                        color="primary"
                        :loading="fetchLogsState.loading"
                        :prepend-icon="mdiRefresh"
                        @click="fetchLogsState.reset() & load()"
                      >
                        重新加载
                      </v-btn>
                    </v-container>
                    <v-divider class="my-4"></v-divider>
                  </template>
                  <v-timeline side="end">
                    <v-timeline-item
                      hide-opposite
                      width="100%"
                      v-for="log in fetchLogsState.items"
                      :key="log.id"
                      :dot-color="log.success ? 'success' : 'error'"
                      size="small"
                    >
                      <v-alert
                        variant="tonal"
                        :color="log.success ? 'success' : 'error'"
                        :icon="log.success ? mdiCheckCircle : mdiAlertCircle"
                      >
                        <v-container class="pa-0 d-flex flex-row align-center">
                          <span
                            class="text-subtitle-1 font-weight-bold"
                            v-text="log.success ? '解析成功' : '解析失败'"
                          ></span>
                          <v-spacer></v-spacer>
                          <span
                            class="text-subtitle-1 font-weight-bold"
                            v-text="new Date(log.createAt).toLocaleString()"
                          ></span>
                        </v-container>
                        <pre v-if="!log.success" class="text-body-2 mt-2 overflow-x-auto">{{ log.error }}</pre>
                      </v-alert>
                    </v-timeline-item>
                  </v-timeline>
                </items-loader>
              </v-container>
            </v-window-item>
            <v-window-item class="fill-height" :value="4">
              <v-container>
                <items-loader v-model="downloadItemsState" @error="app.toastError('查询下载任务失败！')">
                  <template #prepend="{ load }">
                    <v-container class="pa-0 d-flex flex-row justify-space-between align-center">
                      <span class="text-h6">下载项目 ({{ downloadItemsState.total }})</span>
                      <v-btn
                        variant="outlined"
                        color="primary"
                        :loading="downloadItemsState.loading"
                        :prepend-icon="mdiRefresh"
                        @click="downloadItemsState.reset() & load()"
                      >
                        重新加载
                      </v-btn>
                    </v-container>
                    <v-divider class="my-4"></v-divider>
                  </template>
                  <v-alert
                    v-for="item in downloadItemsState.items"
                    :key="item.id"
                    class="my-2"
                    variant="tonal"
                    :color="getDownloadItemColor(item)"
                    :icon="getDownloadItemIcon(item)"
                  >
                    <p class="text-subtitle-1 font-weight-bold" v-text="item.title"></p>
                    <p class="text-caption" v-text="item.url"></p>
                    <p class="text-caption">
                      任务创建于 {{ new Date(item.createAt).toLocaleString() }} - {{ getDownloadItemStatusText(item) }}
                    </p>
                  </v-alert>
                </items-loader>
              </v-container>
            </v-window-item>
          </v-window>
        </template>
      </single-item-loader>
    </to-top-container>
  </v-container>
</template>

<style lang="sass" scoped></style>
