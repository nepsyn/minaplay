<template>
  <v-container class="pa-0 pb-12">
    <span class="text-h4">{{ t('rule.sections.error') }}</span>
    <v-row class="py-2 mt-3" dense>
      <v-col cols="12" sm="3">
        <v-select
          variant="outlined"
          :label="t('app.input.order')"
          density="compact"
          v-model="filters.order"
          :items="orders"
          hide-details
          clearable
          @update:model-value="logsLoader.reload()"
        ></v-select>
      </v-col>
      <v-col class="flex-grow-1 text-end">
        <v-menu location="bottom">
          <v-card>
            <v-card-title>{{ t('rule.logs.clearLogsTitle') }}</v-card-title>
            <v-card-text>{{ t('rule.logs.clearLogsConfirm') }}</v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn variant="text" color="primary">{{ t('app.cancel') }}</v-btn>
              <v-btn variant="plain" color="error" @click="clearLogs()">{{ t('app.ok') }}</v-btn>
            </v-card-actions>
          </v-card>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              variant="flat"
              color="error"
              height="40"
              :prepend-icon="mdiDelete"
              :loading="logsClearing"
            >
              {{ t('app.actions.clear') }}
            </v-btn>
          </template>
        </v-menu>
      </v-col>
    </v-row>
    <v-divider class="my-2"></v-divider>
    <multi-items-loader class="px-0 py-3 mt-2" :loader="logsLoader" auto>
      <v-timeline density="comfortable" side="end">
        <v-timeline-item v-for="log in logs" :key="log.id" dot-color="error" size="small" width="100%">
          <v-alert density="comfortable" variant="tonal" color="error" :icon="mdiAlertCircle">
            <v-container class="pa-0 d-flex flex-row align-center">
              <pre class="text-body-2 overflow-x-auto" v-text="log.error"></pre>
              <v-spacer></v-spacer>
              <v-chip variant="tonal">
                <span class="text-subtitle-1" v-text="new Date(log.createAt).toLocaleString(locale)"></span>
              </v-chip>
            </v-container>
          </v-alert>
        </v-timeline-item>
      </v-timeline>
    </multi-items-loader>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { mdiAlertCircle, mdiDelete } from '@mdi/js';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import { useApiStore } from '@/store/api';
import { useRoute } from 'vue-router';
import { useToastStore } from '@/store/toast';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { RuleErrorLogEntity } from '@/api/interfaces/subscribe.interface';
import { ApiQueryDto } from '@/api/interfaces/common.interface';
import { ref } from 'vue';
import { useAxiosRequest } from '@/composables/use-axios-request';

const { t, locale } = useI18n();
const api = useApiStore();
const route = useRoute();
const toast = useToastStore();

const orders = [
  {
    title: t('app.input.desc'),
    value: 'DESC',
  },
  {
    title: t('app.input.asc'),
    value: 'ASC',
  },
];

const logsLoader = useAxiosPageLoader(
  async (query: ApiQueryDto<RuleErrorLogEntity> = {}) => {
    return await api.Rule.getErrorLogsById(Number(route.params.id))({
      ...query,
      ...filters.value,
    });
  },
  { page: 0, size: 20 },
);
const { items: logs } = logsLoader;

const filters = ref<ApiQueryDto<RuleErrorLogEntity>>({
  order: 'DESC',
});

const {
  pending: logsClearing,
  request: clearLogs,
  onResolved: onLogsCleared,
  onRejected: onLogsClearFailed,
} = useAxiosRequest(async () => {
  return await api.Rule.clearErrorLogsById(Number(route.params.id))();
});
onLogsCleared(() => {
  logsLoader.reset(true);
});
onLogsClearFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});
</script>

<style scoped lang="sass"></style>
