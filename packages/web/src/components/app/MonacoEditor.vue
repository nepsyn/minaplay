<template>
  <div class="editor" ref="editorRef"></div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor';
import RuleDeclarationCode from '@/api/templates/rule.d.ts?raw';
import { onMounted, onUnmounted, ref } from 'vue';
import { useLayoutStore } from '@/store/layout';

monaco.languages.typescript.typescriptDefaults.setExtraLibs([
  { content: RuleDeclarationCode, filePath: 'ts:rule.d.ts' },
]);
// monaco.editor.createModel(RuleDeclarationCode, 'typescript', monaco.Uri.parse('ts:rule.d.ts'));

const layout = useLayoutStore();

const editorRef = ref<HTMLElement>();
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
    model: monaco.editor.createModel(props.value, props.language),
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
    fixedOverflowWidgets: true,
  });
  editor.onDidChangeModelContent(() => {
    emits('update:value', editor?.getValue() ?? '');
  });
  editor.onKeyDown((e) => {
    if (e.ctrlKey && e.keyCode === monaco.KeyCode.KeyS) {
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

<style scoped lang="sass">
.editor
  resize: vertical
  overflow: auto
</style>
