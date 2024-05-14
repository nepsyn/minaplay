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
          {{ t(`settings.profile.adapters.${NotificationServiceEnum.EMAIL}`) }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <v-container class="pa-0">
          <span class="text-body-1 font-weight-bold">{{ t('settings.profile.email.address') }}</span>
          <v-text-field
            class="mt-2"
            variant="outlined"
            hide-details
            color="primary"
            density="compact"
            type="email"
            maxlength="40"
            v-model.trim="edit.address"
            @keydown.enter="bind()"
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
            :disabled="edit.address?.length <= 0"
            @click="test()"
          >
            {{ t('notification.test') }}
          </v-btn>
          <v-btn
            class="mt-2"
            variant="tonal"
            color="warning"
            block
            :prepend-icon="mdiCheck"
            :loading="binding"
            @click="bind()"
            :disabled="edit.address?.length <= 0"
          >
            {{ t('app.ok') }}
          </v-btn>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { mdiCheck, mdiClose, mdiMessageBadgeOutline } from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useToastStore } from '@/store/toast';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { NotificationServiceEnum } from '@/api/enums/notification-service.enum';
import { NotificationMetaEntity } from '@/api/interfaces/notification.interface';
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
  address: '',
});

const {
  pending: testing,
  request: test,
  onResolved: onTested,
  onRejected: onTestFailed,
} = useAxiosRequest(async () => {
  return await api.Notification.test({
    service: NotificationServiceEnum.EMAIL,
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
  request: bind,
  onResolved: onBound,
  onRejected: onBindFailed,
} = useAxiosRequest(async () => {
  return await api.Notification.bind({
    service: NotificationServiceEnum.EMAIL,
    config: edit.value,
  });
});
onBound((data) => {
  if (api.user?.metas) {
    api.user.metas.push(data);
  }
  edit.value = {
    address: '',
  };
  emits('success', data);
  dialog.value = false;
});
onBindFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});
</script>

<style scoped lang="sass">
:deep(.v-otp-input__content)
  padding-left: 0
  padding-right: 0
</style>
