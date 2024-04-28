<template>
  <v-container class="d-flex flex-column pa-md-12 h-100">
    <v-row dense class="flex-grow-0">
      <v-col sm="auto">
        <v-btn
          variant="flat"
          block
          color="info"
          :prepend-icon="mdiRefresh"
          :loading="logsLoader.pending.value"
          @click="logsLoader.request()"
        >
          {{ t('app.actions.refresh') }}
        </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-menu location="bottom">
          <v-card>
            <v-card-title>{{ t('logs.clearTitle') }}</v-card-title>
            <v-card-text>{{ t('logs.clearConfirm') }}</v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn variant="text" color="primary">{{ t('app.cancel') }}</v-btn>
              <v-btn variant="plain" color="error" @click="clearLogs()">{{ t('app.ok') }}</v-btn>
            </v-card-actions>
          </v-card>
          <template #activator="{ props }">
            <v-btn variant="flat" v-bind="props" color="error" :prepend-icon="mdiDelete" :loading="logsClearing">
              {{ t('app.actions.clear') }}
            </v-btn>
          </template>
        </v-menu>
      </v-col>
    </v-row>

    <single-item-loader
      ref="logsContainerRef"
      class="pa-0 mt-3 scrollable-container overflow-x-hidden border rounded"
      :loader="logsLoader"
      v-mutate.child="onMutated"
    >
      <v-sheet class="pa-2 bg-black" min-height="100%">
        <pre class="text-pre-wrap" v-html="ansi_up.ansi_to_html(logs ?? '')"></pre>
      </v-sheet>
    </single-item-loader>
  </v-container>
</template>

<script setup lang="ts">
import { mdiDelete, mdiRefresh } from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useToastStore } from '@/store/toast';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { computed, onUpdated, ref } from 'vue';
import { AnsiUp } from 'ansi_up';
import SingleItemLoader from '@/components/app/SingleItemLoader.vue';

const { t } = useI18n();
const api = useApiStore();
const toast = useToastStore();

const ansi_up = new AnsiUp();

const logsLoader = useAxiosRequest(async () => {
  return await api.System.getLogs();
});
const logs = computed(() => logsLoader.data.value?.logs);
logsLoader.onRejected((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const {
  pending: logsClearing,
  request: clearLogs,
  onResolved: onLogsCleared,
  onRejected: onLogsClearFailed,
} = useAxiosRequest(async () => {
  return await api.System.clearLogs();
});
onLogsCleared(() => {
  if (logsLoader.data.value) {
    logsLoader.data.value.logs = '';
  }
});
onLogsClearFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const logsContainerRef = ref<{ $el: HTMLElement }>();
const onMutated = () => {
  if (logsContainerRef.value) {
    const el = logsContainerRef.value.$el;
    el.scrollTo({ top: el.scrollHeight });
  }
};
onUpdated(() => {
  onMutated();
});
</script>

<style scoped lang="sass"></style>
