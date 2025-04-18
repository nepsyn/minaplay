<template>
  <v-container class="pa-0 pb-12">
    <span class="text-h4">{{ t('source.sections.info') }}</span>
    <single-item-loader class="px-0 py-2 mt-4" :loader="sourceLoader">
      <div class="d-flex flex-column">
        <v-text-field
          :label="t('source.entity.id')"
          variant="outlined"
          hide-details
          color="primary"
          density="compact"
          v-model.trim="edit!.id"
          readonly
          :append-inner-icon="mdiPencilLock"
        ></v-text-field>
        <v-text-field
          :label="t('source.entity.title')"
          class="mt-4"
          variant="outlined"
          color="primary"
          density="compact"
          v-model.trim="edit!.title"
          maxlength="40"
          counter="40"
          persistent-counter
        ></v-text-field>
        <v-text-field
          :label="t('source.entity.url')"
          class="mt-4"
          variant="outlined"
          color="primary"
          density="compact"
          v-model.trim="edit!.url"
          maxlength="200"
          counter="200"
          persistent-counter
        ></v-text-field>
        <v-combobox
          :label="t('source.entity.cron')"
          class="mt-4"
          variant="outlined"
          color="primary"
          density="compact"
          v-model.trim="edit!.cron"
          maxlength="40"
          counter="40"
          persistent-counter
          :items="cronExps"
          item-title="value"
          item-value="value"
          filter-keys="value"
          :return-object="false"
          :item-props="(item) => ({ density: 'comfortable', subtitle: item.name })"
        >
          <template #prepend-inner>
            <v-tooltip location="bottom">
              <pre class="text-caption">{{ nextTriggerTimes ?? t('source.wrongCronExp') }}</pre>
              <template #activator="{ props }">
                <v-icon v-bind="props" :color="nextTriggerTimes ? undefined : 'error'" :icon="mdiClockOutline"></v-icon>
              </template>
            </v-tooltip>
          </template>
        </v-combobox>
        <v-text-field
          :label="t('source.entity.remark')"
          class="mt-4"
          variant="outlined"
          color="primary"
          density="compact"
          v-model.trim="edit!.remark"
          maxlength="40"
          counter="40"
          persistent-counter
        ></v-text-field>
        <div class="d-flex flex-row mt-4">
          <v-btn
            @click="save()"
            :loading="saving"
            variant="tonal"
            color="primary"
            class="flex-grow-1"
            :prepend-icon="mdiCheck"
          >
            {{ t('app.actions.save') }}
          </v-btn>
          <v-btn @click="reset()" color="warning" variant="tonal" class="flex-grow-0 ms-2" :prepend-icon="mdiClose">
            {{ t('app.actions.reset') }}
          </v-btn>
        </div>
        <span class="text-h4 mt-12">{{ t('source.info.actions') }}</span>
        <v-sheet class="my-4" border rounded>
          <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
            <v-container class="pa-0">
              <p class="text-subtitle-1">{{ t('source.info.update') }}</p>
              <p class="text-caption">{{ t('source.info.updateDescription') }}</p>
            </v-container>
            <v-btn class="ms-4" variant="tonal" color="primary" :loading="updateRequesting" @click="requestUpdate()">
              {{ t('source.info.updateBtn') }}
            </v-btn>
          </v-container>
          <v-divider class="ms-4"></v-divider>
          <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
            <v-container class="pa-0">
              <p class="text-subtitle-1">{{ t('source.info.enabled') }}</p>
              <p class="text-caption">{{ t('source.info.enabledDescription') }}</p>
            </v-container>
            <v-switch
              class="ms-4"
              v-model="edit!.enabled"
              @change="toggleEnabled"
              :loading="enabledTogging"
              color="success"
              hide-details
              density="compact"
            ></v-switch>
          </v-container>
          <v-divider class="ms-4"></v-divider>
          <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
            <v-container class="pa-0">
              <p class="text-subtitle-1">{{ t('source.info.delete') }}</p>
              <p class="text-caption">{{ t('source.info.deleteDescription') }}</p>
            </v-container>
            <v-dialog width="auto" close-on-content-click>
              <v-card>
                <v-card-title>{{ t('app.actions.deleteTitle') }}</v-card-title>
                <v-card-text>{{ t('app.actions.deleteConfirm', { item: t('app.entities.source') }) }}</v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="primary" variant="text">
                    {{ t('app.cancel') }}
                  </v-btn>
                  <v-btn color="error" variant="plain" @click="deleteSource()">
                    {{ t('app.ok') }}
                  </v-btn>
                </v-card-actions>
              </v-card>
              <template #activator="{ props }">
                <v-btn v-bind="props" class="ms-4" variant="tonal" color="error" :loading="sourceDeleting">
                  {{ t('app.actions.delete') }}
                </v-btn>
              </template>
            </v-dialog>
          </v-container>
        </v-sheet>
      </div>
    </single-item-loader>
  </v-container>
</template>

<script setup lang="ts">
import { useApiStore } from '@/store/api';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { useRoute, useRouter } from 'vue-router';
import SingleItemLoader from '@/components/app/SingleItemLoader.vue';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { mdiCheck, mdiClockOutline, mdiClose, mdiPencilLock } from '@mdi/js';
import { CronExpressionParser } from 'cron-parser';
import { useToastStore } from '@/store/toast';

const api = useApiStore();
const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const toast = useToastStore();

const sourceLoader = useAxiosRequest(async () => {
  return await api.Source.getById(Number(route.params.id))();
});
sourceLoader.onResolved((data) => {
  edit.value = { ...data };
});
const { data: source } = sourceLoader;
const edit = ref(source.value);

const {
  pending: saving,
  request: save,
  onResolved: onSaved,
  onRejected: onSaveFailed,
} = useAxiosRequest(async () => {
  return await api.Source.update(Number(route.params.id))({
    url: edit.value?.url,
    cron: edit.value?.cron,
    title: edit.value?.title,
    remark: edit.value?.remark,
  });
});
onSaved((data) => {
  toast.toastSuccess(t('app.actions.saveToast'));
  sourceLoader.data.value = data;
});
onSaveFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const cronExps = [
  {
    name: t('source.info.cronExps.every10Minutes'),
    value: '0 */10 * * * *',
  },
  {
    name: t('source.info.cronExps.every30Minutes'),
    value: '0 */30 * * * *',
  },
  {
    name: t('source.info.cronExps.everyHour'),
    value: '0 0 * * * *',
  },
  {
    name: t('source.info.cronExps.every6Hours'),
    value: '0 0 */6 * * *',
  },
  {
    name: t('source.info.cronExps.everyDay'),
    value: '0 0 0 * * *',
  },
];

const {
  pending: updateRequesting,
  request: requestUpdate,
  onResolved: onUpdateRequested,
  onRejected: onUpdateRequestFailed,
} = useAxiosRequest(async () => {
  return await api.Source.invokeFetchJobById(Number(route.params.id))();
});
onUpdateRequested(() => {
  toast.toastSuccess(t('source.info.updateToast'));
});
onUpdateRequestFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const {
  pending: enabledTogging,
  request: toggleEnabled,
  onResolved: onEnabledToggled,
  onRejected: onEnabledToggleFailed,
} = useAxiosRequest(async () => {
  return await api.Source.update(Number(route.params.id))({ enabled: edit.value!.enabled });
});
onEnabledToggled((data) => {
  sourceLoader.data.value = data;
});
onEnabledToggleFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
  edit.value!.enabled = source.value!.enabled;
});

const {
  pending: sourceDeleting,
  request: deleteSource,
  onResolved: onSourceDeleted,
  onRejected: onSourceDeleteFailed,
} = useAxiosRequest(async () => {
  return await api.Source.delete(Number(route.params.id))();
});
onSourceDeleted(async () => {
  toast.toastSuccess(t('app.actions.deleteToast'));
  await router.replace({ path: '/source' });
});
onSourceDeleteFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const reset = () => {
  edit.value = { ...source.value! };
};

const nextTriggerTimes = computed(() => {
  try {
    const interval = CronExpressionParser.parse(edit.value!.cron);
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
