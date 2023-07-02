<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { AxiosResponse } from 'axios';
import { ApiQueryResult } from '@/api/interfaces/common.interface';
import { ItemsLoaderState } from '@/utils';

const props = withDefaults(
  defineProps<{
    modelValue: ItemsLoaderState;
    lazy?: boolean;
    noLoading?: boolean;
    noAppend?: boolean;
    loadingText?: string;
    noItemText?: string;
    noMoreText?: string;
  }>(),
  {
    lazy: false,
    noLoading: false,
    noAppend: false,
    loadingText: '加载中，请稍候~~~',
    noItemText: '没有找到任何数据~~~',
    noMoreText: '已经到底了~~~',
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
    const response: AxiosResponse<ApiQueryResult<any>> = await state.value.loadFn({
      page: state.value.page,
      size: state.value.size,
    });
    state.value.items.push(...response.data.items);
    state.value.page++;
    state.value.total = response.data.total;
    state.value.all = state.value.items.length === response.data.total;
    emits('loaded', state);
  } catch (error) {
    emits('error', error);
  } finally {
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
  <slot v-if="state.items && state.items.length > 0" :load="load"></slot>
  <slot v-else-if="state.loading && !noLoading" name="loading" :first="!state.all && state.page === 0">
    <v-container class="fill-height d-flex flex-column justify-center align-center">
      <v-progress-circular color="primary" indeterminate></v-progress-circular>
      <span class="text-caption mt-2" v-text="loadingText"></span>
    </v-container>
  </slot>
  <slot v-if="!noAppend" name="append" :load="load">
    <v-container v-if="!state.loading" class="d-flex flex-column justify-center align-center">
      <template v-if="state.all">
        <span class="text-caption" v-if="state.total == 0" v-text="noItemText"></span>
        <span class="text-caption" v-else v-text="noMoreText"></span>
      </template>
      <template v-else>
        <v-btn variant="plain" color="primary" class="text-caption" @click="load" :loading="state.loading">
          加载更多
        </v-btn>
      </template>
    </v-container>
  </slot>
</template>

<style scoped></style>
