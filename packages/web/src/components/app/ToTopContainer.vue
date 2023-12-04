<script setup lang="ts">
import { ref } from 'vue';
import { mdiChevronUp } from '@mdi/js';

const props = withDefaults(
  defineProps<{
    threshold?: string | number;
    size?: string | number;
  }>(),
  {
    threshold: 120,
    size: 'small',
  },
);

const showToTop = ref(false);

const onScroll = (e: any) => {
  showToTop.value = e.target.scrollTop >= Number(props.threshold);
};

const containerRef = ref<any>(null);
const toTop = () => {
  if (containerRef.value) {
    containerRef.value.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
};

defineExpose({
  toTop,
});
</script>

<template>
  <div ref="containerRef" class="pa-0" @scroll="onScroll">
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

<style lang="sass" scoped>
.pointer-events-none
  pointer-events: none

.pointer-events-initial
  pointer-events: initial
</style>
