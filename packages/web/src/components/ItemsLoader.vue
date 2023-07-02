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
      <span class="text-caption mt-2">加载中，请稍候~~~</span>
    </v-container>
  </slot>
  <slot v-if="!noAppend" name="append" :load="load">
    <v-container class="d-flex flex-column justify-center align-center">
      <template v-if="state.all">
        <span class="text-caption" v-if="state.total == 0">没有找到任何数据~~~</span>
        <span class="text-caption" v-else>已经到底了~~~</span>
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
