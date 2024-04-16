<template>
  <div class="h-100 overflow-auto d-flex flex-column align-center justify-center py-6">
    <v-icon :icon="mdiEmoticonDeadOutline" size="128"></v-icon>
    <span class="text-h6 font-italic font-weight-bold mt-4">{{ t('layout.error.noPermission') }}</span>
    <v-btn class="mt-2" variant="outlined" :prepend-icon="mdiArrowLeft" @click="router.back()">
      {{ t('layout.error.back') }}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { mdiArrowLeft, mdiEmoticonDeadOutline } from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();
</script>

<style scoped lang="sass"></style>
