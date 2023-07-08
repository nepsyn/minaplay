<script setup lang="ts">
import { onMounted, ref, Ref } from 'vue';
import { mdiEmoticonDeadOutline } from '@mdi/js';

const props = withDefaults(
  defineProps<{
    items: any[];
    loadFn: (done: typeof setStatus) => any;
    lazy?: boolean;
    hideLoadMore?: boolean;
    hideLoading?: boolean;
    hideError?: boolean;
    hideEmpty?: boolean;
  }>(),
  {
    lazy: false,
    hideLoadMore: false,
    hideLoading: false,
    hideError: false,
    hideEmpty: false,
  },
);

const status: Ref<'loading' | 'ok' | 'error' | 'empty'> = ref('ok');
const setStatus = (value: 'loading' | 'ok' | 'error' | 'empty') => {
  status.value = value;
};

const load = async () => {
  if (status.value === 'loading') return;
  setStatus('loading');
  await props.loadFn(setStatus);
};

defineExpose({ status, load });

onMounted(async () => {
  if (!props.lazy) {
    await load();
  }
});
</script>

<template>
  <v-container fluid>
    <slot :items="items"></slot>
    <slot name="loadMore" v-if="status === 'ok' && !hideLoadMore" :load="load">
      <v-container class="d-flex flex-column justify-center align-center">
        <v-btn variant="plain" color="primary" class="text-caption" @click="load">加载更多</v-btn>
      </v-container>
    </slot>
    <slot name="loading" v-if="status === 'loading' && !hideLoading">
      <v-container class="d-flex flex-column justify-center align-center">
        <v-progress-circular color="primary" indeterminate></v-progress-circular>
        <span class="text-caption mt-2">加载中，请稍候~~~</span>
      </v-container>
    </slot>
    <slot name="error" v-if="status === 'error' && !hideError" :load="load">
      <v-container class="d-flex flex-row justify-center align-center text-caption">
        <v-icon :icon="mdiEmoticonDeadOutline"></v-icon>
        <span class="mx-2">加载失败了！请尝试</span>
        <a class="text-decoration-none text-primary clickable" @click="load">重新加载</a>
      </v-container>
    </slot>
    <slot name="empty" v-if="status === 'empty' && !hideEmpty" :load="load">
      <v-container class="d-flex flex-column justify-center align-center">
        <span class="text-caption mt-2">没有更多了~~~</span>
      </v-container>
    </slot>
  </v-container>
</template>

<style lang="sass" scoped>
.clickable
  cursor: pointer
</style>
