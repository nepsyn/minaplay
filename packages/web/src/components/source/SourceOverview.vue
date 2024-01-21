<template>
  <v-card flat border>
    <v-card-title class="d-flex flex-row align-center">
      <v-icon size="large">
        <v-img cover :src="getFaviconUrl(source.url)" aspect-ratio="1">
          <template #placeholder>
            <v-img :src="BlankFavicon" aspect-ratio="1"></v-img>
          </template>
        </v-img>
      </v-icon>
      <span class="ml-2 text-wrap text-break cursor-pointer" @click="router.push({ path: `/source/${source.id}` })">
        {{ source.title || t('source.unnamed') }}
      </span>
      <v-spacer></v-spacer>
      <div>
        <v-tooltip location="bottom">
          {{ source.enabled ? t('source.working') : t('source.paused') }}
          <template #activator="{ props }">
            <v-switch
              v-bind="props"
              v-model="editEnabled"
              :loading="enabledChanging"
              class="ml-2"
              :false-icon="mdiPause"
              :true-icon="mdiProgressCheck"
              density="comfortable"
              color="success"
              hide-details
              @change="changeEnabled"
            ></v-switch>
          </template>
        </v-tooltip>
      </div>
    </v-card-title>
    <v-card-subtitle class="text-break text-wrap">{{ source.url }}</v-card-subtitle>
    <v-card-text class="py-1">
      <div class="d-flex align-center">
        <span class="text-subtitle-1">{{ source.cron }}</span>
        <div v-if="source.enabled" class="ml-2 d-flex align-center">
          <v-tooltip location="bottom">
            <pre class="text-caption">{{ nextTriggerTimes ?? t('source.wrongCronExp') }}</pre>
            <template #activator="{ props }">
              <v-icon
                v-bind="props"
                :color="nextTriggerTimes ? undefined : 'error'"
                size="small"
                :icon="mdiClockOutline"
              ></v-icon>
            </template>
          </v-tooltip>
        </div>
      </div>
    </v-card-text>
    <v-card-actions class="d-flex align-center">
      <v-spacer></v-spacer>
      <v-btn variant="text" color="primary" @click="router.push({ path: `/source/${source.id}` })">
        {{ t('app.actions.edit') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { SourceEntity } from '@/api/interfaces/subscribe.interface';
import { useI18n } from 'vue-i18n';
import BlankFavicon from '@/assets/blank-favicon.png';
import { mdiClockOutline, mdiPause, mdiProgressCheck } from '@mdi/js';
import { computed, ref } from 'vue';
import { parseExpression } from 'cron-parser';
import { useRouter } from 'vue-router';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { useApiStore } from '@/store/api';
import { useToastStore } from '@/store/toast';

const { t, locale } = useI18n();
const router = useRouter();
const api = useApiStore();
const toast = useToastStore();

const props = defineProps<{
  source: SourceEntity;
}>();
const emits = defineEmits<{
  (ev: 'update', source: SourceEntity): any;
}>();

const editEnabled = ref(props.source.enabled);
const {
  pending: enabledChanging,
  request: changeEnabled,
  onResolved: onEnabledChanged,
  onRejected: onEnabledChangeFailed,
} = useAxiosRequest(async () => {
  return await api.Source.update(props.source.id)({
    enabled: editEnabled.value,
  });
});
onEnabledChanged((data) => {
  emits('update', data);
});
onEnabledChangeFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
  editEnabled.value = props.source.enabled;
});

const getFaviconUrl = (url: string) => {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/favicon.ico`;
  } catch {
    return '://favicon.ico';
  }
};

const nextTriggerTimes = computed(() => {
  try {
    const interval = parseExpression(props.source.cron);
    return (
      `${t('source.nextTriggerTimes')}\n` +
      Array.from({ length: 3 })
        .map(() => (interval.hasNext() ? interval.next().toDate().toLocaleString(locale.value) : ''))
        .join('\n')
        .trim()
    );
  } catch {
    return undefined;
  }
});
</script>

<style scoped lang="sass"></style>
