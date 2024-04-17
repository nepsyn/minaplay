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
          {{ t(`settings.profile.adapters.${NotificationServiceEnum.TELEGRAM}`) }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <v-container class="pa-0 mb-2 d-flex flex-column">
          <span class="text-body-1 font-weight-bold">{{ t('settings.profile.telegram.token') }}</span>
          <v-text-field
            class="mt-2"
            variant="outlined"
            hide-details
            color="primary"
            density="compact"
            maxlength="256"
            v-model="edit.token"
          >
          </v-text-field>
          <span class="text-body-1 font-weight-bold mt-3">{{ t('settings.profile.telegram.chatId') }}</span>
          <v-text-field
            class="mt-2"
            variant="outlined"
            hide-details
            color="primary"
            density="compact"
            maxlength="256"
            v-model="edit.chatId"
            @keydown.enter="edit.token.trim().length > 0 && edit.chatId.trim().length > 0 && bindTelegram()"
          >
          </v-text-field>
          <v-btn
            class="mt-2"
            variant="tonal"
            color="warning"
            block
            :loading="binding"
            :prepend-icon="mdiCheck"
            :disabled="edit.token.trim().length <= 0 || edit.chatId.trim().length <= 0"
            @click="bindTelegram()"
          >
            {{ t('app.ok') }}
          </v-btn>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { mdiCheck, mdiClose } from '@mdi/js';
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
  chatId: '',
});

const {
  pending: binding,
  request: bindTelegram,
  onResolved: onTelegramBound,
  onRejected: onTelegramBindFailed,
} = useAxiosRequest(async () => {
  return await api.Notification.bindTelegram({
    token: edit.value.token,
    chatId: edit.value.chatId,
  });
});
onTelegramBound((data) => {
  if (api.user?.metas) {
    api.user.metas.push(data);
  }
  edit.value = {
    token: '',
    chatId: '',
  };
  emits('success', data);
  dialog.value = false;
});
onTelegramBindFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});
</script>

<style scoped lang="sass"></style>
