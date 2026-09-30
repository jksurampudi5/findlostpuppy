// Shared unit-test fixtures. Run: node --test scripts/unit/*.test.mjs
// No service, browser, credentials, or generated JavaScript files are required.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { compileFunction } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { mock } from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = new URL('../../', import.meta.url);
const compiled = new Map();

export function loadModule(path, { mocks = {}, globals = {}, env = {} } = {}) {
  const filename = fileURLToPath(new URL(path, root));
  if (!compiled.has(filename)) {
    const source = readFileSync(filename, 'utf8');
    const output = ts.transpileModule(source, {
      fileName: filename,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
      transformers: { before: [(context) => {
        const visit = (node) => {
          if (ts.isMetaProperty(node) && node.keywordToken === ts.SyntaxKind.ImportKeyword) {
            return ts.factory.createIdentifier('__testImportMeta');
          }
          return ts.visitEachChild(node, visit, context);
        };
        return (node) => ts.visitNode(node, visit);
      }] },
    });
    compiled.set(filename, output.outputText);
  }
  const scope = {
    __testImportMeta: { env: { DEV: false, ...env } },
    console: { log: mock.fn(), warn: mock.fn(), error: mock.fn() },
    // Unexpected network calls fail immediately instead of reaching a provider.
    fetch: mock.fn(() => { throw new Error('Unexpected network request in unit test'); }),
    ...globals,
  };
  const module = { exports: {} };
  const resolve = (specifier) => {
    if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
    if (['react', 'react/jsx-runtime', 'lucide-react', 'node:crypto'].includes(specifier)) {
      return require(specifier);
    }
    throw new Error(`Unmocked dependency ${specifier} in ${path}`);
  };
  compileFunction(compiled.get(filename), ['require', 'module', 'exports', ...Object.keys(scope)], {
    filename,
  })(resolve, module, module.exports, ...Object.values(scope));
  return module.exports;
}

export function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: mock.fn((key) => values.get(key) ?? null),
    setItem: mock.fn((key, value) => values.set(key, String(value))),
    removeItem: mock.fn((key) => values.delete(key)),
  };
}

export function calls(fn) {
  return fn.mock.calls.map((call) => call.arguments);
}

export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
