import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import TypeScriptWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import RuleDeclarationCode from '@/api/templates/rule.d.ts?raw';

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

monaco.languages.typescript.typescriptDefaults.setExtraLibs([
  { content: RuleDeclarationCode, filePath: 'ts:rule.d.ts' },
]);
monaco.editor.createModel(RuleDeclarationCode, 'typescript', monaco.Uri.parse('ts:rule.d.ts'));
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
