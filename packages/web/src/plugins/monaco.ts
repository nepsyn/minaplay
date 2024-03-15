import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';

self.MonacoEnvironment = {
  getWorker: async function (_, label) {
    let worker: { default: any };

    switch (label) {
      case 'json':
        worker = await import('monaco-editor/esm/vs/language/json/json.worker?worker');
        break;
      case 'typescript':
      case 'javascript':
        worker = await import('monaco-editor/esm/vs/language/typescript/ts.worker?worker');
        break;
      default:
        worker = await import('monaco-editor/esm/vs/editor/editor.worker?worker');
    }

    return new worker.default();
  },
};

monaco.editor.addEditorAction({
  id: 'Find Definition',
  label: 'Find Definition',
  keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.F12],
  precondition: undefined,
  keybindingContext: undefined,
  run(editor: editor.ICodeEditor, ...args) {
    editor.trigger('source', 'editor.action.peekDefinition', args);
  },
});
monaco.editor.onDidCreateEditor((editor) => {
  editor.onMouseDown((e) => {
    if (e.event.ctrlKey && e.event.leftButton) {
      e.event.preventDefault();
      editor.trigger('source', 'editor.action.peekDefinition', null);
    }
  });
});
monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
  ...monaco.languages.typescript.javascriptDefaults.getDiagnosticsOptions(),
  noSemanticValidation: false,
  noSuggestionDiagnostics: false,
  noSyntaxValidation: false,
});
monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
  ...monaco.languages.typescript.javascriptDefaults.getCompilerOptions(),
  checkJs: true,
});
