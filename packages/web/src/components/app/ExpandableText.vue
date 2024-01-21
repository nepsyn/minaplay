<template>
  <div>
    <span class="text-pre-wrap text-break" v-text="displayContent"></span>
    <span v-if="content.length > Number(min)" class="text-info cursor-pointer" @click.stop="expanded = !expanded">
      {{ expanded ? t('app.actions.collapse') : t('app.actions.more') }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    content: string;
    min?: string | number;
    ratio?: string | number;
    labelClass?: string;
    contentClass?: string;
  }>(),
  {
    min: 20,
    ratio: 0.33,
  },
);

const expanded = ref(false);
const displayContent = computed(() => {
  if (props.content.length <= Number(props.min)) {
    return props.content;
  }
  return expanded.value ? props.content : props.content.slice(0, props.content.length * Number(props.ratio)) + '...';
});
</script>

<style scoped lang="sass"></style>
