<script setup lang="ts">
import { useSubscribeStore } from '@/store/subscribe';
import { computed, Ref, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { FetchLogEntity, RuleEntity, SourceEntity } from '@/api/interfaces/subscribe.interface';
import { useAppStore } from '@/store/app';
import {
  mdiAlertCircle,
  mdiCheck,
  mdiCheckCircle,
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

const app = useAppStore();
const subscribe = useSubscribeStore();
const route = useRoute();
const router = useRouter();
const theme = useTheme();

const routes = ['#info', '#rules', '#raw', '#log', '#download'];
const tab = ref(routes.includes(String(route.hash)) ? routes.indexOf(String(route.hash)) : 0);

const sourceLoading = ref(true);
const source: Ref<SourceEntity> = ref(undefined as any);
const loadSource = async (id: number) => {
  sourceLoading.value = true;
  try {
    const response = await Api.SubscribeSource.getById(id)();
    source.value = response.data;
  } catch (error: any) {
    if (error.response?.data?.code === ErrorCodeEnum.INVALID_SUBSCRIBE_SOURCE_FORMAT) {
      app.toast('订阅源格式错误，请检查订阅源URL！', 'error');
    } else {
      app.toast('获取订阅源信息失败！', 'error');
    }
  } finally {
    sourceLoading.value = false;
  }
};

const sourceDeleting = ref(false);
const deleteSource = async () => {
  sourceDeleting.value = true;
  try {
    await Api.SubscribeSource.delete(source.value.id)();
    subscribe.deleteSource(source.value.id);
    await router.replace({ name: 'subscribe' });
    app.toast('订阅源已成功删除', 'success');
  } catch {
    app.toast('删除订阅源失败！', 'error');
  } finally {
    sourceDeleting.value = false;
  }
};

const rulesLoading = ref(false);
const rules: Ref<RuleEntity[]> = ref(undefined as any);
const loadRules = async () => {
  rulesLoading.value = true;
  try {
    rules.value = undefined as any;
    const response = await Api.SubscribeSource.getRulesById(source.value.id)();
    rules.value = response.data;
  } catch {
    app.toast('获取订阅规则列表失败！', 'error');
  } finally {
    rulesLoading.value = false;
  }
};

const rawDataLoading = ref(false);
const rawData: Ref<string> = ref(undefined as any);
const rawDataEditorExtensions = computed(() => {
  return theme.global.name.value === 'dark' ? [json(), javascript(), oneDark] : [json(), javascript()];
});
const loadRawData = _.throttle(
  async () => {
    rawDataLoading.value = true;
    try {
      rawData.value = undefined as any;
      const response = await Api.SubscribeSource.fetchRawData(Number(route.params.id))();
      rawData.value = JSON.stringify(response.data, null, 2);
    } catch (error: any) {
      if (error.response?.data?.code === ErrorCodeEnum.INVALID_SUBSCRIBE_SOURCE_FORMAT) {
        app.toast('订阅源格式错误，请检查订阅源URL！', 'error');
      } else {
        app.toast('获取订阅源数据失败！', 'error');
      }
    } finally {
      rawDataLoading.value = false;
    }
  },
  2000,
  { leading: true, trailing: false },
);

const fetchLogLoading = ref(false);
const fetchLogs: Ref<FetchLogEntity[]> = ref(undefined as any);
const loadFetchLogs = async () => {
  fetchLogLoading.value = true;
  try {
    fetchLogs.value = undefined as any;
    const response = await Api.SubscribeSource.getFetchLogsById(source.value.id)({
      size: 10,
    });
    fetchLogs.value = response.data.items;
  } catch (error: any) {
    if (error.response?.data?.code !== ErrorCodeEnum.NOT_FOUND) {
      app.toast('查询日志失败！', 'error');
    }
  } finally {
    fetchLogLoading.value = false;
  }
};

const runFetchJobLoading = ref(false);
const runFetchJob = _.throttle(async () => {
  runFetchJobLoading.value = true;
  try {
    await Api.SubscribeSource.invokeFetchJobById(source.value.id)();
    app.toast('请求更新成功', 'success');
  } catch {
    app.toast('请求更新失败！', 'error');
  } finally {
    runFetchJobLoading.value = false;
  }
}, 5000);

const sourceSaving = ref(false);
const saveSource = async () => {
  sourceSaving.value = true;
  try {
    const { id, user, enabled, createAt, updateAt, ...data } = source.value;
    const response = await Api.SubscribeSource.update(source.value.id)(data);
    source.value = response.data;
    subscribe.updateSource(source.value);
    app.toast('订阅源信息已保存', 'success');
  } catch {
    app.toast('保存订阅源信息失败！', 'error');
  } finally {
    sourceSaving.value = false;
  }
};

const enabledSwitching = ref(false);
const toggleEnabled = async () => {
  try {
    const response = await Api.SubscribeSource.update(source.value.id)({
      enabled: source.value.enabled,
    });
    source.value = {
      ...source.value,
      ...response.data,
    };
    subscribe.updateSource(source.value);
  } catch {
    app.toast('更改订阅源启用状态失败！', 'error');
  } finally {
    sourceSaving.value = false;
  }
};

watch(
  () => route.params,
  async () => {
    const id = Number(route.params.id);
    if (route.params.id != null && !isNaN(id)) {
      rawData.value = '';
      await loadSource(id);
    }

    switch (tab.value) {
      case 1:
        await loadRules();
        break;
      case 2:
        await loadRawData();
        break;
      case 3:
        await loadFetchLogs();
        break;
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
    <v-container fluid class="pa-0 scrollable-container">
      <v-container class="d-flex flex-column align-center justify-center fill-height" v-if="sourceLoading">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <span class="text-body-2 mt-4">数据加载中~~~</span>
      </v-container>
      <v-window v-else v-model="tab" class="pa-6">
        <v-window-item class="fill-height" :value="0">
          <v-container>
            <v-container class="pa-0 d-flex flex-row align-center">
              <span class="text-h6">基本信息</span>
              <v-spacer></v-spacer>
              <v-btn variant="outlined" color="primary" :prepend-icon="mdiRefresh" @click="loadSource(source.id)"
                >刷新
              </v-btn>
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
                <v-btn class="ml-4" variant="tonal" color="warning" :loading="runFetchJobLoading" @click="runFetchJob">
                  更新
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
                  :loading="enabledSwitching"
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
                  <template v-slot:activator="{ props }">
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
        <v-window-item
          class="fill-height"
          :value="1"
          @group:selected="(val) => val && !rules && !rulesLoading && loadRules()"
        >
          <v-container>
            <v-container class="pa-0 d-flex flex-row align-center">
              <span class="text-h6">订阅源规则</span>
              <v-spacer></v-spacer>
              <v-btn
                variant="outlined"
                color="primary"
                :loading="rulesLoading"
                :prepend-icon="mdiRefresh"
                @click="loadRules"
              >
                刷新
              </v-btn>
              <v-btn class="ml-2" variant="outlined" color="warning" :prepend-icon="mdiPlus">添加</v-btn>
            </v-container>
            <v-divider class="my-4"></v-divider>
          </v-container>
        </v-window-item>
        <v-window-item
          class="fill-height"
          :value="2"
          @group:selected="(val) => val && !rawData && !rawDataLoading && loadRawData()"
        >
          <v-container>
            <v-container class="pa-0 d-flex flex-row align-center">
              <span class="text-h6">数据查看</span>
              <v-spacer></v-spacer>
              <v-btn
                variant="outlined"
                color="primary"
                :prepend-icon="mdiRefresh"
                :loading="rawDataLoading"
                @click="loadRawData"
              >
                刷新
              </v-btn>
            </v-container>
            <v-divider class="my-4"></v-divider>
            <v-container v-if="!rawDataLoading" class="pa-0">
              <codemirror v-if="rawData" v-model="rawData" disabled :extensions="rawDataEditorExtensions"></codemirror>
            </v-container>
          </v-container>
        </v-window-item>
        <v-window-item
          class="fill-height"
          :value="3"
          @group:selected="(val) => val && !fetchLogs && !fetchLogLoading && loadFetchLogs()"
        >
          <v-container>
            <v-container class="pa-0 d-flex flex-row align-center">
              <span class="text-h6">解析日志</span>
              <v-spacer></v-spacer>
              <v-btn
                variant="outlined"
                color="primary"
                :loading="fetchLogLoading"
                :prepend-icon="mdiRefresh"
                @click="loadFetchLogs"
              >
                刷新
              </v-btn>
            </v-container>
            <v-divider class="my-4"></v-divider>
            <v-container v-if="!fetchLogLoading" class="pa-0">
              <v-timeline v-if="fetchLogs" side="end">
                <v-timeline-item
                  v-for="log in fetchLogs"
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
                      <span class="text-subtitle-1">{{ log.success ? '解析成功' : '解析失败' }}</span>
                      <v-spacer></v-spacer>
                      <span class="text-subtitle-1">{{ new Date(log.createAt).toLocaleString() }}</span>
                    </v-container>
                    <pre v-if="!log.success" class="text-body-2 mt-2 overflow-x-auto">{{ log.error }}</pre>
                  </v-alert>
                </v-timeline-item>
              </v-timeline>
            </v-container>
          </v-container>
        </v-window-item>
        <v-window-item class="fill-height" :value="4">
          <v-container>
            <v-container class="pa-0 d-flex flex-row align-center">
              <span class="text-h6">下载项目</span>
            </v-container>
            <v-divider class="my-4"></v-divider>
          </v-container>
        </v-window-item>
      </v-window>
    </v-container>
  </v-container>
</template>

<style lang="sass" scoped>
::v-deep(.v-timeline-item__body)
  width: 100%
</style>
