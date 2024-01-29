<template>
  <v-container class="pa-0 pb-12">
    <span class="text-h4">{{ t('settings.sections.profile') }}</span>
    <single-item-loader class="pa-0" :loader="profileLoader">
      <v-sheet class="mt-6 rounded-lg border">
        <v-card-title class="py-6">{{ t('settings.profile.basic') }}</v-card-title>
        <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
          <v-container class="pa-0">
            <p class="text-subtitle-1">{{ t('settings.profile.username') }}</p>
          </v-container>
          <span class="text-h6">{{ profile.username }}</span>
        </v-container>
        <v-divider class="ml-4"></v-divider>
        <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
          <v-container class="pa-0">
            <p class="text-subtitle-1">{{ t('settings.profile.avatar') }}</p>
            <v-btn density="compact" color="primary" variant="outlined" :prepend-icon="mdiUpload">
              {{ t('settings.profile.uploadAvatar') }}
            </v-btn>
          </v-container>
          <user-avatar
            :src="profile.avatar && api.File.buildRawPath(profile.avatar.id, profile.avatar.name)"
            size="48"
          ></user-avatar>
        </v-container>
        <v-divider class="ml-4"></v-divider>
        <v-container class="pa-4 d-flex flex-row align-center justify-space-between">
          <v-container class="pa-0">
            <p class="text-subtitle-1">{{ t('settings.profile.email') }}</p>
          </v-container>
          <span class="text-h6">{{ profile.email ?? t('app.none') }}</span>
        </v-container>
      </v-sheet>
    </single-item-loader>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { useApiStore } from '@/store/api';
import SingleItemLoader from '@/components/app/SingleItemLoader.vue';
import { computed } from 'vue';
import UserAvatar from '@/components/user/UserAvatar.vue';
import { mdiUpload } from '@mdi/js';

const { t } = useI18n();
const api = useApiStore();

const profileLoader = useAxiosRequest(async () => {
  return await api.User.getProfileById(api.user?.id)();
});
const profile = computed(() => profileLoader.data.value);
</script>

<style scoped lang="sass"></style>
