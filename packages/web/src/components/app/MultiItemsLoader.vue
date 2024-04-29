<template>
  <v-container>
    <template v-if="loaded">
      <slot></slot>
      <template v-if="error">
        <slot name="error" v-if="!hideError">
          <v-container class="d-flex flex-row justify-center align-center text-body-2">
            <v-icon :icon="mdiEmoticonDeadOutline"></v-icon>
            <span class="mx-2">{{ t('app.loader.error') }}</span>
            <a class="text-decoration-none text-primary cursor-pointer" @click="request()">
              {{ t('app.loader.retryBtn') }}
            </a>
          </v-container>
        </slot>
      </template>
      <template v-else-if="canLoadMore">
        <slot name="more" v-if="!hideLoadMore">
          <v-container
            class="d-flex flex-column justify-center align-center text-body-2"
            v-intersect="(isIntersecting: boolean) => isIntersecting && auto && request()"
          >
            <v-btn variant="plain" color="primary" :prepend-icon="mdiArrowDown" @click="request()">
              {{ t('app.loader.moreBtn') }}
            </v-btn>
          </v-container>
        </slot>
      </template>
      <template v-else-if="!canLoadMore">
        <slot name="empty" v-if="!hideEmpty">
          <v-container class="d-flex flex-column justify-center align-center text-body-2">
            <span class="text-medium-emphasis">
              {{ items.length > 0 ? t('app.loader.all') : t('app.loader.empty') }}
            </span>
          </v-container>
        </slot>
      </template>
    </template>
    <template v-if="pending">
      <slot name="loading" v-if="!hideLoading">
        <v-container class="d-flex flex-column justify-center align-center text-body-2">
          <v-progress-circular color="primary" indeterminate></v-progress-circular>
          <span class="mt-2 text-medium-emphasis">{{ t('app.loader.loading') }}</span>
        </v-container>
      </slot>
    </template>
    <template v-else-if="!loaded">
      <slot name="load" v-if="!hideLoad">
        <v-container class="d-flex flex-row justify-center align-center text-body-2">
          <v-icon :icon="mdiHelpCircleOutline"></v-icon>
          <span class="mx-2">{{ t('app.loader.notLoaded') }}</span>
          <a class="text-decoration-none text-primary cursor-pointer" @click="request()">
            {{ t('app.loader.loadBtn') }}
          </a>
        </v-container>
      </slot>
    </template>
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
  }>(),
  {
    hideLoadMore: false,
    hideLoading: false,
    hideLoad: false,
    hideError: false,
    hideEmpty: false,
    auto: false,
    lazy: false,
  },
);

const { reload, items, total, error, request, pending, loaded } = props.loader;
const canLoadMore = computed(() => total.value > items.value.length);

onMounted(async () => {
  if (!props.lazy) {
    await reload();
  }
});
</script>

<style scoped lang="sass"></style>
