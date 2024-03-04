<template>
  <v-alert variant="tonal" :color="downloadItemProps.color" :icon="downloadItemProps.icon">
    <p class="text-subtitle-1 font-weight-bold" v-text="item.name"></p>
    <div v-if="item.url" class="d-flex flex-row align-center">
      <span class="text-caption text-truncate" v-text="item.url"></span>
      <v-tooltip>
        {{ t('common.download.copyLink') }}
        <template #activator="{ props }">
          <v-btn v-bind="props" :icon="mdiContentCopy" variant="text" size="x-small" @click="copyLink()"></v-btn>
        </template>
      </v-tooltip>
    </div>
    <p class="text-caption">
      {{ t('common.download.createAt') }}
      {{ new Date(item.createAt).toLocaleString(locale) }}
      -
      {{ downloadItemProps.text }}
      {{ item.state ? `${(Number(item.state.downloadSpeed) / 1024 / 1024).toFixed(2)} MB/s` : '' }}
    </p>
    <v-progress-linear
      v-if="item.status === StatusEnum.PENDING && item.state"
      :model-value="(Number(item.state.completedLength) / Number(item.state.totalLength)) * 100"
      color="secondary"
      height="6"
      striped
    ></v-progress-linear>
    <pre v-if="item.error" class="text-body-2 mt-2 overflow-x-auto" v-text="item.error"></pre>
    <div class="mt-2 d-flex flex-row align-center">
      <template v-for="(action, index) in actions" :key="index">
        <v-chip
          class="mr-2"
          density="comfortable"
          :prepend-icon="action.icon"
          v-if="action.show"
          link
          @click="action.click()"
          :disabled="action.loading"
        >
          {{ action.text }}
        </v-chip>
      </template>
      <v-menu location="bottom">
        <v-card>
          <v-card-title>{{ t('app.actions.deleteTitle') }}</v-card-title>
          <v-card-text>
            {{ t('common.download.deleteConfirm') }}
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" color="primary">{{ t('app.cancel') }}</v-btn>
            <v-btn variant="plain" color="error" @click="deleteItem()">{{ t('app.ok') }}</v-btn>
          </v-card-actions>
        </v-card>
        <template #activator="{ props }">
          <v-chip v-bind="props" density="comfortable" :prepend-icon="mdiDelete" link :disabled="deleting">
            {{ t('app.actions.delete') }}
          </v-chip>
        </template>
      </v-menu>
    </div>
  </v-alert>
</template>

<script setup lang="ts">
import { DownloadItemEntity } from '@/api/interfaces/subscribe.interface';
import { StatusEnum } from '@/api/enums/status.enum';
import {
  mdiAlertCircle,
  mdiCheckCircle,
  mdiClock,
  mdiClose,
  mdiContentCopy,
  mdiDelete,
  mdiHelpCircle,
  mdiPause,
  mdiPauseCircle,
  mdiPlay,
  mdiRefresh,
} from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useToastStore } from '@/store/toast';
import { copyContent } from '@/utils/utils';
import { useAxiosRequest } from '@/composables/use-axios-request';

const { t, locale } = useI18n();
const api = useApiStore();
const toast = useToastStore();

const props = defineProps<{
  item: DownloadItemEntity;
}>();

const emits = defineEmits<{
  (ev: 'updated', item: DownloadItemEntity): any;
  (ev: 'deleted', item: DownloadItemEntity): any;
}>();

const downloadItemProps = computed(() => {
  if (props.item.status === StatusEnum.PENDING) {
    return {
      text: t(`status.${props.item.status}`),
      icon: mdiClock,
      color: 'secondary',
    };
  } else if (props.item.status === StatusEnum.SUCCESS) {
    return {
      text: t(`status.${props.item.status}`),
      icon: mdiCheckCircle,
      color: 'success',
    };
  } else if (props.item.status === StatusEnum.PAUSED) {
    return {
      text: t(`status.${props.item.status}`),
      icon: mdiPauseCircle,
      color: 'warning',
    };
  } else if (props.item.status === StatusEnum.FAILED) {
    return {
      text: t(`status.${props.item.status}`),
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
});

const copyLink = () => {
  copyContent(props.item.url)
    .then(() => {
      toast.toastSuccess(t('common.download.linkCopied'));
    })
    .catch(() => {
      toast.toastError(t('common.download.linkCopyFailed'));
    });
};

let interval: ReturnType<typeof setInterval> | undefined = undefined;
const { request: updateState, onResolved: onUpdated } = useAxiosRequest(async () => {
  return await api.Download.getById(props.item.id)();
});
onUpdated((data) => {
  emits('updated', data);
  if (data.status !== StatusEnum.PENDING) {
    clearInterval(interval);
  }
});
onMounted(() => {
  if (props.item.status === StatusEnum.PENDING) {
    interval = setInterval(() => updateState(), 3000);
  }
});
onUnmounted(() => {
  clearInterval(interval);
});

const {
  pending: retrying,
  request: retry,
  onResolved: onRetried,
  onRejected: onRetryFailed,
} = useAxiosRequest(async () => {
  return await api.Download.retry(props.item.id)();
});
onRetried((data) => {
  emits('updated', data);
  clearInterval(interval);
  interval = setInterval(() => updateState(), 3000);
});
onRetryFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const {
  pending: pausing,
  request: pause,
  onResolved: onPaused,
  onRejected: onPauseFailed,
} = useAxiosRequest(async () => {
  return await api.Download.pause(props.item.id)();
});
onPaused((data) => {
  emits('updated', data);
  clearInterval(interval);
});
onPauseFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const {
  pending: unpausing,
  request: unpause,
  onResolved: onUnpaused,
  onRejected: onUnpauseFailed,
} = useAxiosRequest(async () => {
  return await api.Download.unpause(props.item.id)();
});
onUnpaused((data) => {
  emits('updated', data);
  clearInterval(interval);
  interval = setInterval(() => updateState(), 3000);
});
onUnpauseFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const {
  pending: canceling,
  request: cancel,
  onResolved: onCanceled,
  onRejected: onCancelFailed,
} = useAxiosRequest(async () => {
  return await api.Download.cancel(props.item.id)();
});
onCanceled((data) => {
  emits('updated', data);
  clearInterval(interval);
});
onCancelFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const {
  pending: deleting,
  request: deleteItem,
  onResolved: onDeleted,
  onRejected: onDeleteFailed,
} = useAxiosRequest(async () => {
  return await api.Download.delete(props.item.id)();
});
onDeleted(() => {
  emits('deleted', props.item);
  clearInterval(interval);
});
onDeleteFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const actions = ref([
  {
    show: computed(() => props.item.status === StatusEnum.FAILED),
    text: t('app.actions.retry'),
    icon: mdiRefresh,
    click: retry,
    loading: computed(() => retrying.value),
  },
  {
    show: computed(() => props.item.status === StatusEnum.PENDING),
    text: t('app.actions.pause'),
    icon: mdiPause,
    click: pause,
    loading: computed(() => pausing.value),
  },
  {
    show: computed(() => props.item.status === StatusEnum.PAUSED),
    text: t('app.actions.unpause'),
    icon: mdiPlay,
    click: unpause,
    loading: computed(() => unpausing.value),
  },
  {
    show: computed(() => [StatusEnum.PENDING, StatusEnum.PAUSED].includes(props.item.status)),
    text: t('app.actions.cancel'),
    icon: mdiClose,
    click: cancel,
    loading: computed(() => canceling.value),
  },
]);
</script>

<style scoped lang="sass"></style>
