<template>
  <v-container class="pa-0 pb-12">
    <span class="text-h4">{{ t('source.sections.log') }}</span>
    <v-row class="py-2 mt-3" dense>
      <v-col cols="6" sm="4">
        <v-select
          variant="outlined"
          :label="t('app.input.status')"
          density="compact"
          v-model="filters.status"
          :items="statusOptions"
          item-title="name"
          item-value="value"
          hide-details
          clearable
          @update:model-value="logsLoader.reload()"
        ></v-select>
      </v-col>
      <v-col cols="6" sm="3">
        <v-select
          variant="outlined"
          :label="t('app.input.order')"
          density="compact"
          v-model="filters.sort"
          :items="orders"
          hide-details
          clearable
          @update:model-value="logsLoader.reload()"
        ></v-select>
      </v-col>
      <v-spacer></v-spacer>
      <v-col sm="auto">
        <v-btn
          variant="flat"
          block
          color="info"
          height="40"
          :prepend-icon="mdiRefresh"
          :loading="logsLoader.pending.value"
          @click="logsLoader.reload()"
        >
          {{ t('app.actions.refresh') }}
        </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-menu location="bottom">
          <v-card>
            <v-card-title>{{ t('source.logs.clearLogsTitle') }}</v-card-title>
            <v-card-text>{{ t('source.logs.clearLogsConfirm') }}</v-card-text>
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
        <template v-for="log in logs" :key="log.id">
          <v-timeline-item v-if="log.props" :dot-color="log.props.color" size="small" width="100%">
            <v-alert density="comfortable" variant="tonal" :color="log.props.color" :icon="log.props.icon">
              <v-container class="pa-0 d-flex flex-row align-start">
                <span class="text-subtitle-1 font-weight-bold" v-text="log.props.text"></span>
                <v-spacer></v-spacer>
                <v-chip class="flex-shrink-0" variant="tonal">
                  <span class="text-subtitle-1" v-text="new Date(log.createAt).toLocaleString(locale)"></span>
                </v-chip>
              </v-container>
              <pre v-if="log.error" class="text-body-2 mt-2 overflow-x-auto" v-text="log.error"></pre>
            </v-alert>
          </v-timeline-item>
        </template>
      </v-timeline>
    </multi-items-loader>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { useRoute } from 'vue-router';
import MultiItemsLoader from '@/components/app/MultiItemsLoader.vue';
import { computed, ref } from 'vue';
import { StatusEnum } from '@/api/enums/status.enum';
import { mdiAlertCircle, mdiCheckCircle, mdiClock, mdiDelete, mdiHelpCircle, mdiRefresh } from '@mdi/js';
import { ParseLogQueryDto } from '@/api/interfaces/subscribe.interface';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { useToastStore } from '@/store/toast';

const { t, locale } = useI18n();
const api = useApiStore();
const route = useRoute();
const toast = useToastStore();

const orders = [
  {
    title: t('app.input.desc'),
    value: 'createAt:DESC',
  },
  {
    title: t('app.input.asc'),
    value: 'createAt:ASC',
  },
];

const logsLoader = useAxiosPageLoader(
  async (query: ParseLogQueryDto = {}) => {
    return await api.Source.getParseLogsById(Number(route.params.id))({
      ...query,
      status: filters.value.status,
      sort: filters.value.sort,
    });
  },
  { page: 0, size: 20 },
);
const getLogProps = (status: StatusEnum) => {
  if (status === StatusEnum.PENDING) {
    return {
      text: t(`status.${status}`),
      icon: mdiClock,
      color: 'secondary',
    };
  } else if (status === StatusEnum.SUCCESS) {
    return {
      text: t(`status.${status}`),
      icon: mdiCheckCircle,
      color: 'success',
    };
  } else if (status === StatusEnum.FAILED) {
    return {
      text: t(`status.${status}`),
      icon: mdiAlertCircle,
      color: 'error',
    };
  } else {
    return {
      text: t('status.unknown'),
      icon: mdiHelpCircle,
      color: undefined,
    };
  }
};
const logs = computed(() =>
  logsLoader.items.value.map((item) => {
    return { ...item, props: getLogProps(item.status) };
  }),
);

const filters = ref<Partial<ParseLogQueryDto>>({
  status: undefined,
  sort: 'createAt:DESC',
});

const statusOptions = [
  {
    name: t(`status.${StatusEnum.SUCCESS}`),
    value: StatusEnum.SUCCESS,
  },
  {
    name: t(`status.${StatusEnum.PENDING}`),
    value: StatusEnum.PENDING,
  },
  {
    name: t(`status.${StatusEnum.FAILED}`),
    value: StatusEnum.FAILED,
  },
];

const {
  pending: logsClearing,
  request: clearLogs,
  onResolved: onLogsCleared,
  onRejected: onLogsClearFailed,
} = useAxiosRequest(async () => {
  return await api.Source.clearParseLogsById(Number(route.params.id))();
});
onLogsCleared(() => {
  logsLoader.reset(true);
});
onLogsClearFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});
</script>

<style scoped lang="sass">
:deep(.v-timeline-item__opposite)
  display: none
</style>
