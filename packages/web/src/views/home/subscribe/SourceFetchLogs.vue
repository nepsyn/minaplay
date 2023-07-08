<script setup lang="ts">
import { ApiQueryDto } from '@/interfaces/common.interface';
import { FetchLogEntity } from '@/interfaces/subscribe.interface';
import { computed, Ref, ref, watch } from 'vue';
import { useApp } from '@/store/app';
import { Api } from '@/api/api';
import { useRoute } from 'vue-router';
import { mdiAlertCircle, mdiCheckCircle, mdiRefresh } from '@mdi/js';
import ItemsProvider from '@/components/provider/ItemsProvider.vue';

const app = useApp();
const route = useRoute();

const sourceId = computed(() => Number(route.params.id));

const logsQuery: ApiQueryDto<FetchLogEntity> = {
  page: 0,
  size: 5,
  sort: 'createAt',
  order: 'DESC',
};
const logsTotal = ref(0);
const logs: Ref<FetchLogEntity[]> = ref([]);
const loadLogs = async (done: any) => {
  try {
    const response = await Api.SubscribeSource.getFetchLogsById(sourceId.value)(logsQuery);
    logs.value.push(...response.data.items);
    logsTotal.value = response.data.total;
    logsQuery.page!++;
    done(logs.value.length === response.data.total ? 'empty' : 'ok');
  } catch {
    app.toastError('获取解析日志失败');
    done('error');
  }
};
const resetLogs = () => {
  logs.value = [];
  logsQuery.page = 0;
};

const providerRef: Ref<any> = ref(null);
watch(
  () => route.params,
  async (old, now) => {
    if (old.id !== now?.id && !isNaN(Number(route.params.id))) {
      resetLogs();

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
    <v-container fluid>
      <v-container class="pa-0 d-flex flex-row align-center">
        <span class="text-h6">解析日志 ({{ logsTotal }})</span>
        <v-spacer></v-spacer>
        <v-btn
          variant="outlined"
          color="primary"
          :loading="providerRef?.status === 'loading'"
          :prepend-icon="mdiRefresh"
          @click="resetLogs() & providerRef?.load()"
          >重新加载
        </v-btn>
      </v-container>
      <v-divider class="my-4"></v-divider>
      <items-provider ref="providerRef" class="pa-0" :load-fn="loadLogs" :items="logs">
        <v-alert
          class="my-4"
          v-for="log in logs"
          :key="log.id"
          variant="tonal"
          :color="log.success ? 'success' : 'error'"
          :icon="log.success ? mdiCheckCircle : mdiAlertCircle"
        >
          <v-container class="pa-0 d-flex flex-row align-center">
            <span class="text-subtitle-1 font-weight-bold" v-text="log.success ? '解析成功' : '解析失败'"></span>
            <v-spacer></v-spacer>
            <v-chip>
              <span class="text-subtitle-1 font-weight-thin" v-text="new Date(log.createAt).toLocaleString()"></span>
            </v-chip>
          </v-container>
          <pre v-if="!log.success" class="text-body-2 mt-2 overflow-x-auto" v-text="log.error"></pre>
        </v-alert>
      </items-provider>
    </v-container>
  </v-container>
</template>

<style scoped lang="sass"></style>
