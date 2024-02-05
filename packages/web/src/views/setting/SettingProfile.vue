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
        <v-container class="pa-0">
          <p class="text-subtitle-1">{{ t('settings.profile.avatar') }}</p>
          <v-btn
            density="compact"
            color="primary"
            variant="outlined"
            :prepend-icon="mdiUpload"
            :loading="avatarUploading || profileUpdating"
            @click="selectAndUploadAvatar()"
          >
            {{ t('settings.profile.uploadAvatar') }}
          </v-btn>
        </v-container>
        <user-avatar
          :src="api.user?.avatar && api.File.buildRawPath(api.user.avatar.id, api.user.avatar.name)"
          size="52"
        ></user-avatar>
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
          :loading="profileUpdating"
          @update:model-value="updateProfile({ notify: api.user?.notify })"
        ></v-switch>
      </v-container>
    </v-sheet>
    <v-sheet class="mt-6 rounded-lg border">
      <v-card-title class="py-6">{{ t('settings.profile.notification') }}</v-card-title>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { useApiStore } from '@/store/api';
import { ref } from 'vue';
import UserAvatar from '@/components/user/UserAvatar.vue';
import { mdiUpload } from '@mdi/js';
import { UserDto } from '@/api/interfaces/user.interface';
import { useToastStore } from '@/store/toast';
import { selectFile } from '@/utils/utils';
import { TimeoutError } from '@/composables/use-socket-io-connection';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';
import axios from 'axios';

const { t } = useI18n();
const api = useApiStore();
const toast = useToastStore();

const {
  pending: profileUpdating,
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
        await updateProfile({ avatarFileId: uploadFile.data.id });
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
</script>

<style scoped lang="sass"></style>
