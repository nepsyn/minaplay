<script setup lang="ts">
import { computed, ref } from 'vue';
import { mdiCheck, mdiPencil } from '@mdi/js';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    maxlength?: string | number;
    saveFn: Function;
  }>(),
  {
    modelValue: undefined,
    maxlength: 1024,
  },
);

const emits = defineEmits(['update:modelValue', 'saved', 'error']);

const value = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
  },
});

const editing = ref(false);
const saving = ref(false);
const save = async () => {
  saving.value = true;
  try {
    const response = await props.saveFn(props.modelValue);
    emits('saved', response);
    editing.value = false;
  } catch (error) {
    emits('error', error);
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="d-flex flex-row align-center flex-grow-1">
    <slot v-if="!editing"></slot>
    <slot v-else name="editing">
      <v-text-field
        hide-details
        autofocus
        placeholder="备注"
        v-model="value"
        @change="(e) => emits('update:modelValue', e.target.value)"
        density="compact"
        variant="underlined"
        color="primary"
        :maxlength="Number(maxlength)"
        @keydown.enter="save"
      ></v-text-field>
    </slot>
    <slot name="activator" :editing="editing" :save="save">
      <v-btn
        v-if="editing"
        class="ml-2"
        variant="plain"
        size="x-small"
        :icon="mdiCheck"
        :loading="saving"
        @click="save"
      ></v-btn>
      <v-btn v-else class="ml-2" variant="plain" size="x-small" :icon="mdiPencil" @click="editing = !editing"></v-btn>
    </slot>
  </div>
</template>

<style lang="sass" scoped>
::v-deep(.v-field__input)
  padding-top: 0
</style>
