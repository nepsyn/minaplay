<template>
  <v-dialog
    :width="display.smAndUp.value ? 'auto' : '100%'"
    min-width="400"
    :fullscreen="!display.smAndUp.value"
    v-model="dialog"
    scrollable
    close-on-back
  >
    <v-card>
      <v-toolbar color="primary">
        <v-btn :icon="mdiClose" @click="dialog = false"></v-btn>
        <v-toolbar-title>
          {{ t('app.actions.add') }}
          {{ t(`settings.profile.adapters.${NotificationServiceEnum.SERVER_CHAN}`) }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <v-container class="pa-0 mb-2">
          <span class="text-body-1 font-weight-bold">{{ t('settings.profile.serverChan.token') }}</span>
          <v-text-field
            class="mt-2"
            variant="outlined"
            hide-details
            color="primary"
            density="compact"
            maxlength="256"
            v-model.trim="edit.token"
            @keydown.enter="edit.token?.length > 0 && bindServerChan()"
            autofocus
          >
          </v-text-field>
          <v-btn
            class="mt-2"
            variant="tonal"
            color="secondary"
            block
            :loading="testing"
            :prepend-icon="mdiMessageBadgeOutline"
            :disabled="edit.token?.length <= 0"
            @click="test()"
          >
            {{ t('notification.test') }}
          </v-btn>
          <v-btn
            class="mt-2"
            variant="tonal"
            color="warning"
            block
            :loading="binding"
            :prepend-icon="mdiCheck"
            :disabled="edit.token?.length <= 0"
            @click="bindServerChan()"
          >
            {{ t('app.ok') }}
          </v-btn>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { mdiCheck, mdiClose, mdiMessageBadgeOutline } from '@mdi/js';
import { NotificationServiceEnum } from '@/api/enums/notification-service.enum';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useToastStore } from '@/store/toast';
import { computed, ref } from 'vue';
import { NotificationMetaEntity } from '@/api/interfaces/notification.interface';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { useDisplay } from 'vuetify';

const { t } = useI18n();
const api = useApiStore();
const toast = useToastStore();
const display = useDisplay();

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
  }>(),
  {
    modelValue: false,
  },
);

const dialog = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
  },
});

const emits = defineEmits<{
  (e: 'success', value: NotificationMetaEntity): any;
  (e: 'update:modelValue', value: boolean): any;
}>();

const edit = ref({
  token: '',
});

const {
  pending: testing,
  request: test,
  onResolved: onTested,
  onRejected: onTestFailed,
} = useAxiosRequest(async () => {
  return await api.Notification.test({
    service: NotificationServiceEnum.SERVER_CHAN,
    config: edit.value,
  });
});
onTested(() => {
  toast.toastSuccess(t('notification.testSent'));
});
onTestFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const {
  pending: binding,
  request: bindServerChan,
  onResolved: onServerChanBound,
  onRejected: onServerChanBandFailed,
} = useAxiosRequest(async () => {
  return await api.Notification.bind({
    service: NotificationServiceEnum.SERVER_CHAN,
    config: edit.value,
  });
});
onServerChanBound((data) => {
  if (api.user?.metas) {
    api.user.metas.push(data);
  }
  edit.value = {
    token: '',
  };
  emits('success', data);
  dialog.value = false;
});
onServerChanBandFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});
</script>

<style scoped lang="sass"></style>
