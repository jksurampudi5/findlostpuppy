import { readFileSync } from 'node:fs';
import { compileFunction } from 'node:vm';
import ts from 'typescript';

// Use the installed compiler so these Node tests need no new runner or dependencies.
// Evaluate the real module with explicit dependency doubles; an unmocked import fails closed.
export function loadModule(path, { dependencies = {}, globals = {}, env = {} } = {}) {
  const filename = new URL(`../../${path}`, import.meta.url);
  const source = readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    fileName: filename.pathname,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
    transformers: { before: [(context) => {
      const visit = (node) => ts.isMetaProperty(node) && node.keywordToken === ts.SyntaxKind.ImportKeyword
        ? ts.factory.createIdentifier('__importMeta')
        : ts.visitEachChild(node, visit, context);
      return (node) => ts.visitNode(node, visit);
    }] },
  });
  const module = { exports: {} };
  const require = (name) => {
    if (!Object.hasOwn(dependencies, name)) throw new Error(`Missing test double for ${name} in ${path}`);
    return dependencies[name];
  };
  compileFunction(outputText, ['require', 'module', 'exports', '__importMeta'], {
    filename: filename.pathname,
    contextExtensions: [{
      console: { log() {}, warn() {}, error() {} },
      fetch() { throw new Error('Unexpected network request'); },
      ...globals,
    }],
  })(require, module, module.exports, { env });
  return module.exports;
}

export function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}
