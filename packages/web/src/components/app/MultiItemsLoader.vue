<template>
  <v-container>
    <slot v-if="!waitData || loader.loaded.value"></slot>
    <slot name="loading" v-if="loader.pending.value && !hideLoading">
      <v-container class="d-flex flex-column justify-center align-center text-body-2">
        <v-progress-circular color="primary" indeterminate></v-progress-circular>
        <span class="mt-2 text-medium-emphasis">{{ t('app.loader.loading') }}</span>
      </v-container>
    </slot>
    <slot name="load" v-else-if="!loader.loaded.value && !hideLoad">
      <v-container class="d-flex flex-row justify-center align-center text-body-2">
        <v-icon :icon="mdiHelpCircleOutline"></v-icon>
        <span class="mx-2">{{ t('app.loader.notLoaded') }}</span>
        <a class="text-decoration-none text-primary cursor-pointer" @click="loader.request()">
          {{ t('app.loader.loadBtn') }}
        </a>
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
    <slot name="more" v-else-if="canLoadMore && !hideLoadMore">
      <v-container
        class="d-flex flex-column justify-center align-center text-body-2"
        v-intersect="(isIntersecting: boolean) => isIntersecting && auto && loader.request()"
      >
        <v-btn variant="plain" color="primary" :prepend-icon="mdiArrowDown" @click="loader.request()">
          {{ t('app.loader.moreBtn') }}
        </v-btn>
      </v-container>
    </slot>
    <slot name="empty" v-else-if="!canLoadMore && !hideEmpty">
      <v-container class="d-flex flex-column justify-center align-center text-body-2">
        <span class="text-medium-emphasis">
          {{ loader.items.value.length > 0 ? t('app.loader.all') : t('app.loader.empty') }}
        </span>
      </v-container>
    </slot>
  </v-container>
</template>

<script setup lang="ts">
import { useAxiosPageLoader } from '@/composables/use-axios-page-loader';
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { MessageSchema } from '@/lang';
import { mdiArrowDown, mdiEmoticonDeadOutline, mdiHelpCircleOutline } from '@mdi/js';

const { t } = useI18n<{ message: MessageSchema }>();

const props = withDefaults(
  defineProps<{
    loader: ReturnType<typeof useAxiosPageLoader>;
    hideLoadMore?: boolean;
    hideLoading?: boolean;
    hideLoad?: boolean;
    hideError?: boolean;
    hideEmpty?: boolean;
    auto?: boolean;
    lazy?: boolean;
    waitData?: boolean;
  }>(),
  {
    hideLoadMore: false,
    hideLoading: false,
    hideLoad: false,
    hideError: false,
    hideEmpty: false,
    auto: false,
    lazy: false,
    waitData: false,
  },
);

const canLoadMore = computed(() => props.loader.total.value > props.loader.items.value.length);

onMounted(async () => {
  if (!props.lazy) {
    await props.loader.request();
  }
});
</script>

<style scoped lang="sass"></style>
