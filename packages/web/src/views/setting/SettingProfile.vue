<template>
  <v-container class="pa-0 pb-12">
    <span class="text-h4">{{ t('settings.sections.profile') }}</span>
    <single-item-loader class="pa-0" :loader="profileLoader">
      <v-sheet class="mt-6 rounded-lg border">
        <v-card-title>{{ t('settings.profile.basic') }}</v-card-title>
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

const { t } = useI18n();
const api = useApiStore();

const profileLoader = useAxiosRequest(async () => {
  return await api.User.getProfileById(api.user?.id)();
});
const profile = computed(() => profileLoader.data.value);
</script>

<style scoped lang="sass"></style>
