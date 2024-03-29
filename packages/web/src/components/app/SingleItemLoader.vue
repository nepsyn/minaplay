<template>
  <v-container>
    <slot name="loading" v-if="loader.pending.value && !hideLoading">
      <v-container class="d-flex flex-column justify-center align-center text-body-2">
        <v-progress-circular color="primary" indeterminate></v-progress-circular>
        <span class="mt-2 text-medium-emphasis">{{ t('app.loader.loading') }}</span>
      </v-container>
    </slot>
    <slot name="error" v-else-if="loader.error.value && !hideError">
      <v-container class="d-flex flex-row justify-center align-center text-body-2">
        <v-icon :icon="mdiEmoticonDeadOutline"></v-icon>
        <span class="mx-2">{{ t('app.loader.error') }}</span>
        <a class="text-decoration-none text-primary cursor-pointer" @click="loader.request()">
          {{ t('app.loader.retryBtn') }}
        </a>
      </v-container>
    </slot>
    <slot name="load" v-else-if="!loader.data.value">
      <v-container class="d-flex flex-row justify-center align-center text-body-2">
        <v-icon :icon="mdiHelpCircleOutline"></v-icon>
        <span class="mx-2">{{ t('app.loader.notLoaded') }}</span>
        <a class="text-decoration-none text-primary cursor-pointer" @click="loader.request()">
          {{ t('app.loader.loadBtn') }}
        </a>
      </v-container>
    </slot>
    <slot v-else-if="loader.data.value"></slot>
  </v-container>
</template>

<script setup lang="ts">
import { mdiEmoticonDeadOutline, mdiHelpCircleOutline } from '@mdi/js';
import { useI18n } from 'vue-i18n';
import { MessageSchema } from '@/lang';
import { useAxiosRequest } from '@/composables/use-axios-request';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ErrorCodeEnum } from '@/api/enums/error-code.enum';

const { t } = useI18n<{ message: MessageSchema }>();
const router = useRouter();

const props = withDefaults(
  defineProps<{
    loader: ReturnType<typeof useAxiosRequest>;
    hideLoading?: boolean;
    hideError?: boolean;
    lazy?: boolean;
    redirectOnNotFound?: boolean;
  }>(),
  {
    hideLoading: false,
    hideError: false,
    lazy: false,
    redirectOnNotFound: true,
  },
);

onMounted(async () => {
  props.loader.onRejected(async (error: any) => {
    if (error.response?.data?.code === ErrorCodeEnum.NOT_FOUND) {
      await router.replace({ path: '/404' });
    }
  });

  if (!props.lazy) {
    await props.loader.request();
  }
});
</script>

<style scoped lang="sass"></style>
