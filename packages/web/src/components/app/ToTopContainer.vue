<template>
  <div ref="containerRef" @scroll="onScroll">
    <slot></slot>
    <slot name="activator" :to-top="toTop">
      <v-layout-item
        order="1"
        :model-value="showToTop"
        position="bottom"
        class="text-end pointer-events-none"
        size="80"
      >
        <v-btn
          class="me-8 pointer-events-initial"
          :size="size!"
          color="primary"
          elevation="8"
          :icon="mdiChevronUp"
          @click="toTop()"
        ></v-btn>
      </v-layout-item>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { provide, ref } from 'vue';
import { mdiChevronUp } from '@mdi/js';

const props = withDefaults(
  defineProps<{
    threshold?: string | number;
    size?: string | number;
    alwaysShow?: boolean;
  }>(),
  {
    threshold: 120,
    size: 'small',
    alwaysShow: false,
  },
);

const showToTop = ref(false);
let timeout: ReturnType<typeof setTimeout> | undefined = undefined;

const onScroll = (e: any) => {
  showToTop.value = e.target.scrollTop >= Number(props.threshold);
  if (!props.alwaysShow && showToTop.value) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      showToTop.value = false;
    }, 2000);
  }
};

const containerRef = ref<HTMLElement>();
const toTop = () => {
  if (containerRef.value) {
    containerRef.value.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
};
provide('toTop', toTop);

defineExpose({
  toTop,
});
</script>

<style lang="sass" scoped></style>
