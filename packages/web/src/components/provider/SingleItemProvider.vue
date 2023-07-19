<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { mdiEmoticonDeadOutline, mdiHelpCircleOutline } from '@mdi/js';

const props = withDefaults(
  defineProps<{
    item: any;
    loadFn: (done: typeof setStatus) => any;
    lazy?: boolean;
    hideLoading?: boolean;
    hideError?: boolean;
    hideInitial?: boolean;
  }>(),
  {
    lazy: false,
    hideLoading: false,
    hideError: false,
    hideInitial: false,
  },
);

const status = ref<'loading' | 'ok' | 'error' | 'initial'>('initial');
const setStatus = (value: 'loading' | 'ok' | 'error') => {
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
    <slot name="loading" v-if="status === 'loading' && !hideLoading">
      <v-container class="d-flex flex-column justify-center align-center">
        <v-progress-circular color="primary" indeterminate></v-progress-circular>
        <span class="text-caption mt-2">加载中，请稍候~~~</span>
      </v-container>
    </slot>
    <slot name="error" v-else-if="status === 'error' && !hideError" :load="load">
      <v-container class="d-flex flex-row justify-center align-center text-caption">
        <v-icon :icon="mdiEmoticonDeadOutline"></v-icon>
        <span class="mx-2">加载失败了！请尝试</span>
        <a class="text-decoration-none text-primary clickable" @click="load">重新加载</a>
      </v-container>
    </slot>
    <slot name="initial" v-else-if="status === 'initial' && !hideError" :load="load">
      <v-container class="d-flex flex-row justify-center align-center text-caption">
        <v-icon :icon="mdiHelpCircleOutline"></v-icon>
        <span class="mx-2">还没有加载内容，请尝试</span>
        <a class="text-decoration-none text-primary clickable" @click="load">立即加载</a>
      </v-container>
    </slot>
    <slot v-else :item="item" :load="load"></slot>
  </v-container>
</template>

<style lang="sass" scoped>
.clickable
  cursor: pointer
</style>
