<script setup lang="ts">
import { SingleItemLoaderState } from '@/utils';
import { AxiosResponse } from 'axios';
import { ApiQueryResult } from '@/api/interfaces/common.interface';
import { mdiEmoticonDeadOutline, mdiHelpCircleOutline } from '@mdi/js';
import { computed, onMounted } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: SingleItemLoaderState;
    lazy?: boolean;
    noLoading?: boolean;
    noAppend?: boolean;
  }>(),
  {
    lazy: false,
    noLoading: false,
    noAppend: false,
  },
);

const emits = defineEmits(['update:modelValue', 'loaded', 'error']);

const state = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
  },
});

const load = async () => {
  state.value.loading = true;
  try {
    state.value.item = undefined;
    const response: AxiosResponse<ApiQueryResult<any>> = await state.value.loadFn();
    state.value.item = response.data;
    emits('loaded', state);
  } catch (error) {
    emits('error', error);
  } finally {
    state.value.first = false;
    state.value.loading = false;
  }
};

defineExpose({ load });

onMounted(async () => {
  if (!props.lazy) {
    await load();
  }
});
</script>

<template>
  <slot name="prepend" :load="load"></slot>
  <slot v-if="state.item !== undefined" :load="load"></slot>
  <slot v-else-if="state.loading && !noLoading" name="loading">
    <v-container class="fill-height d-flex flex-column justify-center align-center">
      <v-progress-circular color="primary" indeterminate></v-progress-circular>
      <span class="text-caption mt-2">加载中，请稍候~~~</span>
    </v-container>
  </slot>
  <slot v-if="!noAppend" name="append" :load="load">
    <v-container
      v-if="state.item === undefined && !state.loading"
      class="d-flex flex-column justify-center align-center"
    >
      <v-container class="d-flex flex-row justify-center align-center text-caption">
        <v-icon :icon="state.first ? mdiHelpCircleOutline : mdiEmoticonDeadOutline"></v-icon>
        <span class="mx-2">{{ state.first ? '还没有加载任何内容，请尝试' : '加载失败了！请尝试' }}</span>
        <a class="text-decoration-none text-primary clickable" @click="load">
          {{ state.first ? '立即加载' : '重新加载' }}
        </a>
      </v-container>
    </v-container>
  </slot>
</template>

<style lang="sass" scoped>
.clickable
  cursor: pointer
</style>
