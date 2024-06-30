<template>
  <v-container class="pa-0 pb-12">
    <span class="text-h4">{{ t('settings.sections.profile') }}</span>
    <v-sheet class="mt-6 rounded-lg border">
      <v-card-title class="py-6">{{ t('settings.profile.basic') }}</v-card-title>
      <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
        <v-container class="pa-0">
          <p class="text-subtitle-1">{{ t('settings.profile.username') }}</p>
        </v-container>
        <span class="text-h6">{{ api.user?.username }}</span>
      </v-container>
      <v-divider class="ml-4"></v-divider>
      <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
        <p class="text-subtitle-1">{{ t('settings.profile.avatar') }}</p>
        <div class="d-flex flex-column align-end">
          <user-avatar tile :src="api.user?.avatar && api.File.buildRawPath(api.user.avatar)" size="52"></user-avatar>
          <v-btn
            density="comfortable"
            class="mt-2"
            color="primary"
            variant="tonal"
            :prepend-icon="mdiUpload"
            :loading="avatarUploading || avatarUpdating"
            @click="selectAndUploadAvatar()"
          >
            {{ t('settings.profile.uploadAvatar') }}
          </v-btn>
        </div>
      </v-container>
      <v-divider class="ml-4"></v-divider>
      <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
        <v-container class="pa-0">
          <p class="text-subtitle-1">{{ t('settings.profile.globalNotification') }}</p>
        </v-container>
        <v-switch
          hide-details
          density="comfortable"
          color="primary"
          v-model="api.user!.notify"
          :loading="notifyUpdating"
          @update:model-value="updateNotify({ notify: api.user?.notify })"
        ></v-switch>
      </v-container>
      <v-divider class="ml-4"></v-divider>
      <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
        <v-container class="pa-0">
          <p class="text-subtitle-1">{{ t('settings.profile.password') }}</p>
        </v-container>
        <v-btn
          variant="tonal"
          density="comfortable"
          :prepend-icon="mdiKeyVariant"
          color="warning"
          @click="openPasswordDialog()"
        >
          {{ t('settings.profile.changePassword') }}
        </v-btn>
      </v-container>
    </v-sheet>
    <v-sheet class="mt-6 rounded-lg border">
      <email-bind-prompt v-model="emailBindDialog"></email-bind-prompt>
      <server-chan-bind-prompt v-model="serverChanBindDialog"></server-chan-bind-prompt>
      <telegram-bind-prompt v-model="telegramBindDialog"></telegram-bind-prompt>
      <v-card-title class="py-6 d-flex align-center">
        <span>{{ t('settings.profile.notification') }}</span>
        <v-spacer></v-spacer>
        <v-menu location="left bottom">
          <v-list class="rounded py-0" density="compact">
            <v-list-subheader>
              {{ t('settings.profile.availableAdapters') }}
            </v-list-subheader>
            <v-list-item
              v-for="adapter in availableAdapters"
              :key="adapter.id"
              :prepend-icon="adapter.icon"
              :title="adapter.name"
              link
              @click="adapter.click()"
            >
            </v-list-item>
          </v-list>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              v-if="adaptersLoader.data.value"
              variant="tonal"
              color="success"
              :prepend-icon="mdiPlus"
              :disabled="availableAdapters.length === 0"
            >
              {{ t('app.actions.add') }}
            </v-btn>
          </template>
        </v-menu>
      </v-card-title>
      <single-item-loader class="pa-0" :loader="adaptersLoader">
        <v-card-subtitle class="py-3" v-if="api.user?.metas.length === 0">
          {{ t('app.loader.empty') }}
        </v-card-subtitle>
        <template v-for="(meta, index) in api.user!.metas ?? []" :key="meta.id">
          <v-list-item v-if="enabledAdapters.includes(meta.service)">
            <template #prepend>
              <v-switch
                hide-details
                density="comfortable"
                :model-value="meta.enabled"
                color="success"
                :loading="metaUpdating && editItem?.id === meta.id"
                :false-icon="mdiClose"
                :true-icon="mdiCheck"
                @click.prevent="
                  editItem = meta;
                  updateMeta({ enabled: !meta.enabled });
                "
              ></v-switch>
            </template>
            <v-list-item-title class="px-4">
              {{ t(`settings.profile.adapters.${meta.service}`) }}
            </v-list-item-title>
            <v-list-item-subtitle v-if="getNotificationMetaConfigLabel(meta)" class="px-4">
              {{ getNotificationMetaConfigLabel(meta) }}
            </v-list-item-subtitle>
            <template #append>
              <v-btn
                density="comfortable"
                variant="text"
                :icon="mdiBellCog"
                color="primary"
                @click="
                  editItem = meta;
                  editSubscriptions = meta.subscribes.concat();
                  editSubscriptionsSheet = true;
                "
              ></v-btn>
              <v-btn
                density="comfortable"
                variant="plain"
                :icon="mdiDelete"
                color="error"
                @click="
                  editItem = meta;
                  deleteDialog = true;
                "
              ></v-btn>
            </template>
          </v-list-item>
          <v-divider v-if="index < api.user!.metas.length - 1" class="ml-4"></v-divider>
        </template>
      </single-item-loader>
    </v-sheet>

    <v-dialog
      :class="display.smAndUp.value ? 'w-75' : 'w-100'"
      close-on-back
      :fullscreen="!display.smAndUp.value"
      v-model="editPasswordDialog"
      scrollable
    >
      <v-card v-if="api.user">
        <v-toolbar color="primary">
          <v-btn :icon="mdiClose" @click="editPasswordDialog = false"></v-btn>
          <v-toolbar-title>
            {{ t('app.actions.edit') }}
            {{ t('app.entities.user') }}
          </v-toolbar-title>
          <v-btn variant="text" :prepend-icon="mdiCheck" :loading="passwordChanging" @click="changePassword()">
            {{ t('app.actions.save') }}
          </v-btn>
        </v-toolbar>
        <v-card-text class="py-6">
          <v-container class="pa-0">
            <span class="text-body-1 font-weight-bold">{{ t('user.entity.username') }}</span>
            <v-text-field
              class="mt-2"
              variant="outlined"
              disabled
              hide-details
              color="primary"
              density="compact"
              v-model.trim="api.user.username"
            ></v-text-field>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1 font-weight-bold">{{ t('settings.profile.oldPassword') }}</span>
            <v-text-field
              class="mt-2"
              variant="outlined"
              :rules="passwordRule"
              validate-on="input"
              color="primary"
              density="compact"
              autocomplete="one-time-code"
              v-model.trim="passwordEdit.old"
              :type="passwordEdit.oldView ? 'text' : 'password'"
              :append-inner-icon="passwordEdit.oldView ? mdiEyeOff : mdiEye"
              @click:append-inner="passwordEdit.oldView = !passwordEdit.oldView"
            ></v-text-field>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1 font-weight-bold">{{ t('settings.profile.newPassword') }}</span>
            <v-text-field
              class="mt-2"
              variant="outlined"
              :rules="passwordRule"
              validate-on="input"
              color="primary"
              density="compact"
              autocomplete="one-time-code"
              v-model.trim="passwordEdit.current"
              :type="passwordEdit.currentView ? 'text' : 'password'"
              :append-inner-icon="passwordEdit.currentView ? mdiEyeOff : mdiEye"
              @click:append-inner="passwordEdit.currentView = !passwordEdit.currentView"
            ></v-text-field>
          </v-container>
          <v-container class="mt-4 pa-0">
            <span class="text-body-1 font-weight-bold">{{ t('settings.profile.passwordConfirm') }}</span>
            <v-text-field
              class="mt-2"
              variant="outlined"
              :rules="passwordRule"
              validate-on="input"
              color="primary"
              density="compact"
              autocomplete="one-time-code"
              v-model.trim="passwordEdit.confirm"
              :type="passwordEdit.confirmView ? 'text' : 'password'"
              :append-inner-icon="passwordEdit.confirmView ? mdiEyeOff : mdiEye"
              @click:append-inner="passwordEdit.confirmView = !passwordEdit.confirmView"
              @keydown.enter="changePassword()"
            ></v-text-field>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-bottom-sheet inset v-model="editSubscriptionsSheet">
      <v-card>
        <v-card-title>
          <span class="text-subtitle-2 text-medium-emphasis font-weight-bold">
            {{ t('settings.profile.editSubscriptions') }}
          </span>
        </v-card-title>
        <v-card-text class="px-4 py-0">
          <v-chip-group column multiple v-model="editSubscriptions">
            <v-chip filter variant="outlined" v-for="event of subscriptions" :key="event" :value="event">
              {{ t(`settings.profile.subscriptions.${event}`) }}
            </v-chip>
          </v-chip-group>
        </v-card-text>
        <v-card-actions class="px-4">
          <v-row dense>
            <v-col cols="auto">
              <v-btn
                variant="text"
                color="primary"
                :prepend-icon="mdiCheckAll"
                @click="editSubscriptions = subscriptions.concat()"
              >
                {{ t('app.actions.selectAll') }}
              </v-btn>
              <v-btn variant="text" color="warning" :prepend-icon="mdiSelectionRemove" @click="editSubscriptions = []">
                {{ t('app.actions.unselectAll') }}
              </v-btn>
              <v-btn
                variant="text"
                color="secondary"
                :loading="testing"
                :prepend-icon="mdiMessageBadgeOutline"
                @click="test()"
              >
                {{ t('notification.test') }}
              </v-btn>
            </v-col>
            <v-spacer></v-spacer>
            <v-col cols="auto">
              <v-btn variant="text" @click="editSubscriptionsSheet = false">
                {{ t('app.cancel') }}
              </v-btn>
              <v-btn
                variant="text"
                color="primary"
                :loading="metaUpdating"
                @click="updateMeta({ subscribes: editSubscriptions })"
              >
                {{ t('app.ok') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-bottom-sheet>

    <v-dialog v-model="deleteDialog" width="auto">
      <v-card v-if="editItem">
        <v-card-title>
          {{ t('app.actions.deleteTitle') }}
        </v-card-title>
        <v-card-text class="d-flex flex-column">
          <span>{{ t('app.actions.deleteConfirm', { item: t('app.entities.notificationMeta') }) }}</span>
          <span class="font-italic font-weight-bold">{{ t(`settings.profile.adapters.${editItem.service}`) }}</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="deleteDialog = false">
            {{ t('app.cancel') }}
          </v-btn>
          <v-btn variant="plain" color="error" :loading="metaDeleting" @click="deleteMeta(editItem.id)">
            {{ t('app.ok') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { useApiStore } from '@/store/api';
import { computed, ref } from 'vue';
import UserAvatar from '@/components/user/UserAvatar.vue';
import {
  mdiAlphaSBox,
  mdiBellCog,
  mdiCheck,
  mdiCheckAll,
  mdiClose,
  mdiDelete,
  mdiEmailFastOutline,
  mdiEye,
  mdiEyeOff,
  mdiKeyVariant,
  mdiMessageBadgeOutline,
  mdiPlus,
  mdiSelectionRemove,
  mdiSquareRoundedBadgeOutline,
  mdiUpload,
} from '@mdi/js';
import { UserDto } from '@/api/interfaces/user.interface';
import { useToastStore } from '@/store/toast';
import { selectFile } from '@/utils/utils';
import { TimeoutError } from '@/composables/use-socket-io-connection';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import axios from 'axios';
import { useAsyncTask } from '@/composables/use-async-task';
import { NotificationServiceEnum } from '@/api/enums/notification-service.enum';
import SingleItemLoader from '@/components/app/SingleItemLoader.vue';
import { NotificationMetaDto, NotificationMetaEntity } from '@/api/interfaces/notification.interface';
import { useDisplay } from 'vuetify';
import { useRouter } from 'vue-router';
import { NotificationEventEnum } from '@/api/enums/notification-event.enum';
import EmailBindPrompt from '@/components/notification/EmailBindPrompt.vue';
import ServerChanBindPrompt from '@/components/notification/ServerChanBindPrompt.vue';
import TelegramBindPrompt from '@/components/notification/TelegramBindPrompt.vue';

const { t } = useI18n();
const display = useDisplay();
const api = useApiStore();
const toast = useToastStore();
const router = useRouter();

const {
  request: updateProfile,
  onResolved: onProfileUpdated,
  onRejected: onProfileUpdateFailed,
} = useAxiosRequest(async (data: UserDto) => {
  return await api.User.modifyProfileById(api.user!.id)(data);
});
onProfileUpdated((profile) => {
  api.user = profile;
});
onProfileUpdateFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const { pending: avatarUpdating, request: updateAvatar } = useAsyncTask(updateProfile);
const avatarUploading = ref(false);
const selectAndUploadAvatar = async () => {
  selectFile('image/*', false, async (files) => {
    const file = files[0];
    if (file) {
      avatarUploading.value = true;
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort(new TimeoutError());
      }, 5000);
      try {
        const uploadFile = await api.File.uploadImage(file, undefined, controller.signal);
        await updateAvatar({ avatarFileId: uploadFile.data.id });
      } catch (error: any) {
        if (error instanceof TimeoutError) {
          toast.toastError(t(`error.${ErrorCodeEnum.TIMEOUT}`));
        } else if (axios.isAxiosError(error)) {
          toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
        } else {
          toast.toastError(t(`error.${error?.code ?? 'other'}`));
        }
      } finally {
        avatarUploading.value = false;
        clearTimeout(timeout);
      }
    }
  });
};

const { pending: notifyUpdating, request: updateNotify } = useAsyncTask(updateProfile);

const adaptersLoader = useAxiosRequest(async () => {
  return await api.Notification.getEnabledAdapters();
});
const enabledAdapters = computed(() => {
  return adaptersLoader.data.value?.adapters ?? [];
});
const availableAdapters = computed(() => {
  return [
    {
      id: NotificationServiceEnum.WS,
      name: t(`settings.profile.adapters.${NotificationServiceEnum.WS}`),
      icon: mdiSquareRoundedBadgeOutline,
      click: () => bindWs(),
    },
    {
      id: NotificationServiceEnum.EMAIL,
      name: t(`settings.profile.adapters.${NotificationServiceEnum.EMAIL}`),
      icon: mdiEmailFastOutline,
      click: () => {
        emailBindDialog.value = true;
      },
    },
    {
      id: NotificationServiceEnum.SERVER_CHAN,
      name: t(`settings.profile.adapters.${NotificationServiceEnum.SERVER_CHAN}`),
      icon: mdiAlphaSBox,
      click: () => {
        serverChanBindDialog.value = true;
      },
    },
    {
      id: NotificationServiceEnum.TELEGRAM,
      name: t(`settings.profile.adapters.${NotificationServiceEnum.TELEGRAM}`),
      icon: 'm9.45782,19.57309l0.31901,-4.81932l8.74997,-7.88409c0.38737,-0.35319 -0.07975,-0.52409 -0.59245,-0.21647l-10.80075,6.82452l-4.67121,-1.48112c-1.0026,-0.28483 -1.01399,-0.97981 0.22786,-1.48112l18.19493,-7.01821c0.8317,-0.37598 1.62923,0.20508 1.31022,1.48112l-3.09895,14.59468c-0.21647,1.03678 -0.8431,1.28743 -1.70898,0.80892l-4.71678,-3.48632l-2.26725,2.19889c-0.26204,0.26204 -0.47851,0.47851 -0.94564,0.47851z',
      click: () => {
        telegramBindDialog.value = true;
      },
    },
  ].filter(
    ({ id }) =>
      adaptersLoader.data.value?.adapters?.includes(id) &&
      api.user &&
      !api.user.metas.find(({ service }) => service === id),
  );
});
const subscriptions = [...Object.values(NotificationEventEnum)];
const emailBindDialog = ref(false);
const serverChanBindDialog = ref(false);
const telegramBindDialog = ref(false);

const editItem = ref<NotificationMetaEntity>();

const {
  pending: metaUpdating,
  request: updateMeta,
  onResolved: onMetaUpdated,
  onRejected: onMetaUpdateFailed,
} = useAxiosRequest(async (data: NotificationMetaDto) => {
  return await api.Notification.update(editItem.value!.id)(data);
});
onMetaUpdated(async (meta) => {
  if (api.user) {
    const index = api.user.metas.findIndex(({ id }) => id === meta.id);
    if (index >= 0) {
      api.user.metas[index] = meta;
    }
  }
  editSubscriptionsSheet.value = false;
  deleteDialog.value = false;
});
onMetaUpdateFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const deleteDialog = ref(false);
const {
  pending: metaDeleting,
  request: deleteMeta,
  onResolved: onMetaDeleted,
  onRejected: onMetaDeleteFailed,
} = useAxiosRequest(async (id: number) => {
  return await api.Notification.delete(id)();
});
onMetaDeleted(async () => {
  toast.toastSuccess(t('app.actions.deleteToast'));
  if (api.user) {
    api.user.metas = api.user.metas.filter(({ id }) => id !== editItem.value?.id);
  }
  deleteDialog.value = false;
});
onMetaDeleteFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const editPasswordDialog = ref(false);
const passwordRule = [
  (value: string) => (value && value.length >= 6 && value.length <= 40) || t('settings.profile.passwordLength'),
];
const passwordEdit = ref({
  old: '',
  oldView: false,
  current: '',
  currentView: false,
  confirm: '',
  confirmView: false,
});
const openPasswordDialog = () => {
  passwordEdit.value = {
    old: '',
    oldView: false,
    current: '',
    currentView: false,
    confirm: '',
    confirmView: false,
  };
  editPasswordDialog.value = true;
};
const {
  pending: passwordChanging,
  request: _changePassword,
  onResolved: onPasswordChanged,
  onRejected: onPasswordChangeFailed,
} = useAxiosRequest(async () => {
  return await api.Auth.changePassword({
    old: passwordEdit.value.old,
    current: passwordEdit.value.current,
  });
});
const changePassword = () => {
  if (passwordEdit.value.current !== passwordEdit.value.confirm) {
    toast.toastError(t('settings.profile.passwordMismatch'));
  } else {
    return _changePassword();
  }
};
onPasswordChanged(async () => {
  toast.toastSuccess(t('settings.profile.passwordChanged'));
  api.setToken(undefined);
  await router.push({ path: '/login' });
});
onPasswordChangeFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const editSubscriptionsSheet = ref(false);
const editSubscriptions = ref<NotificationEventEnum[]>([]);

const {
  pending: testing,
  request: test,
  onResolved: onTested,
  onRejected: onTestFailed,
} = useAxiosRequest(async () => {
  return await api.Notification.test({
    service: editItem.value?.service,
    config: JSON.parse(editItem.value?.config ?? '{}'),
  });
});
onTested(() => {
  toast.toastSuccess(t('notification.testSent'));
});
onTestFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const {
  request: bindWs,
  onResolved: onWsBound,
  onRejected: onWsBindFailed,
} = useAxiosRequest(async () => {
  return await api.Notification.bind({
    service: NotificationServiceEnum.WS,
    config: {},
  });
});
onWsBound((meta) => {
  if (api.user?.metas) {
    api.user.metas.push(meta);
  }
});
onWsBindFailed((error: any) => {
  toast.toastError(t(`error.${error.response?.data?.code ?? 'other'}`));
});

const generateTokenView = (token: string = '') => {
  if (token.length <= 8) {
    return '*'.repeat(token.length);
  } else {
    return token.slice(0, 4) + '*'.repeat(8) + token.slice(token.length - 4, token.length);
  }
};
const getNotificationMetaConfigLabel = (meta: NotificationMetaEntity) => {
  try {
    const config = JSON.parse(meta.config as string);
    switch (meta.service) {
      case NotificationServiceEnum.EMAIL:
        return config.address;
      case NotificationServiceEnum.SERVER_CHAN:
      case NotificationServiceEnum.TELEGRAM:
        return `Token: ${generateTokenView(config.token)}`;
      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
};
</script>

<style scoped lang="sass"></style>
