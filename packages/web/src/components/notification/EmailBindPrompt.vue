<template>
  <v-dialog width="auto" v-model="dialog" scrollable close-on-back>
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
            v-model="edit.address"
            @keydown.enter="sendCode()"
          >
          </v-text-field>
          <v-btn
            class="mt-2"
            variant="tonal"
            color="primary"
            block
            :prepend-icon="mdiEmailArrowRightOutline"
            :loading="codeSending"
            @click="sendCode()"
            :disabled="timeout > 0"
          >
            <template v-if="timeout > 0">
              {{ t('settings.profile.email.resend', { timeout }) }}
            </template>
            <template v-else>
              {{ t('settings.profile.email.sendCode') }}
            </template>
          </v-btn>
        </v-container>
        <v-container class="mt-4 mb-2 pa-0">
          <span class="text-body-1 font-weight-bold">{{ t('settings.profile.email.verifyCode') }}</span>
          <v-otp-input
            base-color="primary"
            density="compact"
            v-model="edit.verifyCode"
            @keydown.enter="verifyCode()"
          ></v-otp-input>
          <v-btn
            variant="tonal"
            color="warning"
            block
            :prepend-icon="mdiKeyVariant"
            :loading="codeVerifying"
            @click="verifyCode()"
          >
            {{ t('settings.profile.email.verify') }}
          </v-btn>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { mdiClose, mdiEmailArrowRightOutline, mdiKeyVariant } from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/store/api';
import { useToastStore } from '@/store/toast';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { NotificationServiceEnum } from '@/api/enums/notification-service.enum';
import { NotificationMetaEntity } from '@/api/interfaces/notification.interface';

const { t } = useI18n();
const api = useApiStore();
const toast = useToastStore();

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
  verifyCode: '',
  key: '',
});

let interval: ReturnType<typeof setInterval> | undefined = undefined;
const timeout = ref(0);
const {
  pending: codeSending,
  request: sendCode,
  onResolved: onCodeSent,
  onRejected: onCodeSendFailed,
} = useAxiosRequest(async () => {
  return await api.Notification.bindEmail({
    email: edit.value.address,
  });
});
onCodeSent((data) => {
  edit.value.key = data.key;
  clearInterval(interval);
  timeout.value = 60;
  interval = setInterval(() => {
    timeout.value--;
    if (timeout.value <= 0) {
      clearInterval(interval);
    }
  }, 1000);
});
onCodeSendFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const {
  pending: codeVerifying,
  request: verifyCode,
  onResolved: onCodeVerified,
  onRejected: onCodeVerifyFailed,
} = useAxiosRequest(async () => {
  return await api.Notification.verifyEmail({
    key: edit.value.key,
    code: edit.value.verifyCode,
  });
});
onCodeVerified((data) => {
  if (api.user?.metas) {
    api.user.metas.push(data);
  }
  edit.value = {
    address: '',
    verifyCode: '',
    key: '',
  };
  emits('success', data);
  dialog.value = false;
});
onCodeVerifyFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});
</script>

<style scoped lang="sass">
:deep(.v-otp-input__content)
  padding-left: 0
  padding-right: 0
</style>
