<template>
  <div ref="editorRef"></div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import TypeScriptWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { onMounted, ref, watch } from 'vue';
import { useLayoutStore } from '@/store/layout';

const layout = useLayoutStore();

self.MonacoEnvironment = {
  getWorker: function (_, label) {
    switch (label) {
      case 'json':
        return new JsonWorker();
      case 'typescript':
      case 'javascript':
        return new TypeScriptWorker();
      default:
        return new EditorWorker();
    }
  },
};

const editorRef = ref<HTMLElement | undefined>(undefined);
const editor = ref<monaco.editor.IStandaloneCodeEditor | undefined>(undefined);

const props = withDefaults(
  defineProps<{
    modalValue?: string;
    language?: string;
    readonly?: boolean;
    minimap?: boolean;
    wordWrap?: boolean;
  }>(),
  {
    modalValue: '',
    readonly: false,
    minimap: false,
    wordWrap: true,
  },
);

watch(
  () => layout.darkMode,
  (value) => {
    if (editor.value) {
      monaco.editor.setTheme(value ? 'vs-dark' : 'vs');
    }
  },
);

onMounted(() => {
  editor.value = monaco.editor.create(editorRef.value!, {
    value: props.modalValue,
    language: props.language,
    readOnly: props.readonly,
    minimap: {
      enabled: props.minimap,
    },
    automaticLayout: true,
    theme: layout.darkMode ? 'vs-dark' : 'vs',
    wordWrap: props.wordWrap ? 'on' : 'off',
    scrollBeyondLastLine: false,
    tabSize: 2,
    tabCompletion: 'on',
  });
});

const emits = defineEmits<{
  (ev: 'update:modalValue', value: string): any;
}>();

defineExpose({
  editor,
});
</script>

<style scoped lang="sass"></style>
