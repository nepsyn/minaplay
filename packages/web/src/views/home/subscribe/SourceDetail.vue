<script setup lang="ts">
import { mdiCheck, mdiPencilLock, mdiRefresh } from '@mdi/js';
import { useApp } from '@/store/app';
import { useSubscribeStore } from '@/store/subscribe';
import { computed, Ref, ref, watch } from 'vue';
import { Api } from '@/api/api';
import { useRoute, useRouter } from 'vue-router';
import _ from 'lodash';
import { SourceEntity } from '@/interfaces/subscribe.interface';
import SingleItemProvider from '@/components/SingleItemProvider.vue';

const app = useApp();
const route = useRoute();
const router = useRouter();
const subscribe = useSubscribeStore();

const sourceId = computed(() => Number(route.params.id));

const source: Ref<SourceEntity | undefined> = ref(undefined);
const loadSource = async (done: any) => {
  try {
    const response = await Api.SubscribeSource.getById(sourceId.value)();
    source.value = response.data;
    done('ok');
  } catch {
    source.value = undefined;
    app.toastError('加载订阅源失败');
    done('error');
  }
};

const runFetchJobLoading = ref(false);
const runFetchJob = _.throttle(
  async () => {
    if (runFetchJobLoading.value) return;

    runFetchJobLoading.value = true;
    try {
      await Api.SubscribeSource.invokeFetchJobById(sourceId.value)();
      app.toastSuccess('请求更新成功');
    } catch {
      app.toastError('请求更新失败');
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
    const { id, user, enabled, createAt, updateAt, ...data } = source.value!;
    const response = await Api.SubscribeSource.update(sourceId.value)(data);
    source.value = response.data;
    subscribe.updateSource(response.data);
    app.toastSuccess('保存订阅源信息成功');
  } catch {
    app.toastError('保存订阅源信息失败');
  } finally {
    sourceSaving.value = false;
  }
};

const enabledToggling = ref(false);
const toggleEnabled = async () => {
  enabledToggling.value = true;
  try {
    const response = await Api.SubscribeSource.update(sourceId.value)({
      enabled: source.value!.enabled,
    });
    subscribe.updateSource(response.data);
  } catch {
    app.toastError('更改订阅源启用状态失败');
  } finally {
    enabledToggling.value = false;
  }
};

const sourceDeleting = ref(false);
const deleteSource = async () => {
  sourceDeleting.value = true;
  try {
    await Api.SubscribeSource.delete(sourceId.value)();
    subscribe.deleteSource(sourceId.value);
    await router.replace('/subscribe');
    app.toastSuccess('订阅源已成功删除');
  } catch {
    app.toastError('删除订阅源失败！');
  } finally {
    sourceDeleting.value = false;
  }
};

const providerRef: Ref<any> = ref(null);
watch(
  () => route.params,
  async (old, now) => {
    if (old.id !== now?.id && !isNaN(Number(route.params.id))) {
      runFetchJob.cancel();

      if (providerRef.value) {
        providerRef.value.load();
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <v-container>
    <single-item-provider ref="providerRef" :item="source" :load-fn="loadSource">
      <v-container class="pa-0 d-flex flex-row align-center">
        <span class="text-h6">基本信息</span>
        <v-spacer></v-spacer>
        <v-btn variant="outlined" color="primary" :prepend-icon="mdiRefresh" @click="providerRef.load()">刷新</v-btn>
      </v-container>
      <v-divider class="my-4"></v-divider>
      <v-container class="my-4 pa-0">
        <span class="text-body-1">ID</span>
        <v-text-field
          class="mt-2"
          variant="outlined"
          hide-details
          color="primary"
          density="compact"
          v-model="source!.id"
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
          v-model="source!.url"
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
          v-model="source!.cron"
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
          v-model="source!.title"
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
          v-model="source!.remark"
          maxlength="40"
        ></v-text-field>
      </v-container>
      <v-container class="my-4 pa-0">
        <v-btn block variant="tonal" color="info" :prepend-icon="mdiCheck" :loading="sourceSaving" @click="saveSource"
          >保存修改
        </v-btn>
      </v-container>
      <v-container class="pa-0 mt-12">
        <span class="text-h6">其它操作</span>
      </v-container>
      <v-sheet class="my-4" border rounded>
        <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
          <v-container class="pa-0">
            <p class="text-subtitle-1">立即更新</p>
            <p class="text-caption">立即更新并解析当前订阅源的资源内容。</p>
          </v-container>
          <v-btn class="ml-4" variant="tonal" color="warning" :loading="runFetchJobLoading" @click="runFetchJob"
            >立即更新
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
            v-model="source!.enabled"
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
      </v-sheet>
    </single-item-provider>
  </v-container>
</template>

<style scoped lang="sass"></style>
