<template>
  <div ref="editorRef"></div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor';
import { KeyCode } from 'monaco-editor';

import { onMounted, onUnmounted, ref } from 'vue';
import { useLayoutStore } from '@/store/layout';

const layout = useLayoutStore();

const editorRef = ref<HTMLElement | undefined>(undefined);
let editor: monaco.editor.IStandaloneCodeEditor | undefined = undefined;

const props = withDefaults(
  defineProps<{
    value?: string;
    language?: string;
    readonly?: boolean;
    minimap?: boolean;
    wordWrap?: boolean;
    autoFocus?: boolean;
  }>(),
  {
    value: '',
    readonly: false,
    minimap: false,
    wordWrap: true,
    autoFocus: false,
  },
);

onMounted(() => {
  editor = monaco.editor.create(editorRef.value!, {
    value: props.value,
    language: props.language,
    readOnly: props.readonly,
    minimap: {
      enabled: props.minimap,
    },
    automaticLayout: true,
    theme: layout.darkMode ? 'vs-dark' : 'vs',
    wordWrap: props.wordWrap ? 'on' : 'off',
    scrollbar: {
      alwaysConsumeMouseWheel: false,
    },
    scrollBeyondLastLine: false,
    tabSize: 2,
    tabCompletion: 'on',
  });
  editor.onDidChangeModelContent(() => {
    emits('update:value', editor?.getValue() ?? '');
  });
  editor.onKeyDown((e) => {
    if (e.ctrlKey && e.keyCode === KeyCode.KeyS) {
      e.preventDefault();
      emits('save');
    }
  });
  if (props.autoFocus) {
    editor?.focus();
  }
});

onUnmounted(() => {
  editor?.dispose();
});

const emits = defineEmits<{
  (ev: 'update:value', value: string): any;
  (ev: 'save'): any;
}>();

defineExpose({
  getEditor: () => editor,
});
</script>

<style scoped lang="sass"></style>
