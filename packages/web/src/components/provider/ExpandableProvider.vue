<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    content: string;
    throttle: string | number;
    ratio?: string | number;
    labelClass?: string;
    contentClass?: string;
  }>(),
  {
    throttle: 20,
    ratio: 0.33,
    labelClass: 'text-primary',
  },
);

const expanded = ref(false);
const displayContent = computed(() => {
  if (props.content.length <= props.throttle) {
    return props.content;
  }
  return expanded.value ? props.content : props.content.slice(0, props.content.length * Number(props.ratio));
});
</script>

<template>
  <div>
    <pre :class="contentClass" v-text="displayContent"></pre>
    <span
      v-if="content.length > throttle"
      class="text-info clickable"
      :class="labelClass"
      @click.stop="expanded = !expanded"
    >
      {{ expanded ? '收起' : '展开' }}
    </span>
  </div>
</template>

<style scoped lang="sass"></style>
