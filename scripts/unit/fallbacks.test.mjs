import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadModule, memoryStorage, calls } from './test_harness.mjs';

const { FallbackShell } = loadModule('src/components/fallbacks/FallbackShell.tsx', {
  mocks: { '../../assets/app_logo.png': 'synthetic-logo.png' },
});
const loadFallback = (name, options = {}) => loadModule(`src/components/fallbacks/${name}.tsx`, {
  ...options, mocks: { './FallbackShell': { FallbackShell }, ...options.mocks },
})[name];

// Walk returned React elements to exercise public action callbacks without a DOM.
function buttons(element) {
  const found = [];
  function visit(node) {
    if (!React.isValidElement(node)) return;
    if (node.type === 'button') found.push(node);
    React.Children.forEach(node.props.children, visit);
  }
  visit(element);
  return found;
}

for (const loading of [true, false]) {
  test(`fallback shell announces ${loading ? 'loading status' : 'recoverable errors'} accessibly`, () => {
    const markup = renderToStaticMarkup(React.createElement(FallbackShell, { title: '<Synthetic title>', message: 'Saved forms remain available.', loading, fullScreen: true }));
    assert.match(markup, loading ? /role="status"/ : /role="alert"/);
    assert.match(markup, /aria-live="polite"/);
    assert.match(markup, new RegExp(`aria-busy="${loading}"`));
    assert.match(markup, /fallback-shell--fullscreen/);
    assert.match(markup, /&lt;Synthetic title&gt;/);
    assert.doesNotMatch(markup, /fallback-actions/);
  });
}

for (const type of ['camera', 'location']) {
  test(`${type} permission fallback provides retry and a working alternative`, () => {
    const PermissionFallback = loadFallback('PermissionFallback');
    const onRetry = mock.fn(); const onAlternative = mock.fn(); const onOpenSettings = mock.fn();
    const tree = PermissionFallback({ type, onRetry, onAlternative, onOpenSettings });
    const markup = renderToStaticMarkup(tree);
    assert.match(markup, type === 'camera' ? /Upload from Gallery/ : /Enter Location Manually/);
    const actions = buttons(tree);
    assert.equal(actions.length, 3);
    actions.forEach((action) => { assert.equal(action.props.type, 'button'); action.props.onClick(); });
    for (const callback of [onRetry, onAlternative, onOpenSettings]) assert.equal(callback.mock.callCount(), 1);
  });
}

test('permission fallback omits unavailable settings and supports a custom alternative', () => {
  const PermissionFallback = loadFallback('PermissionFallback');
  const tree = PermissionFallback({ type: 'camera', onRetry() {}, onAlternative() {}, alternativeLabel: 'Choose saved photo', compact: true });
  assert.equal(buttons(tree).length, 2);
  const markup = renderToStaticMarkup(tree);
  assert.match(markup, /Choose saved photo/);
  assert.match(markup, /permission-fallback-compact/);
  assert.doesNotMatch(markup, /Open Settings/);
});

test('offline fallback explains persistence and exposes the retry callback', () => {
  const OfflineFallback = loadFallback('OfflineFallback');
  const onRetry = mock.fn();
  const tree = OfflineFallback({ onRetry });
  assert.match(renderToStaticMarkup(tree), /saved forms and images remain on this device/);
  buttons(tree)[0].props.onClick();
  assert.equal(onRetry.mock.callCount(), 1);
});

test('empty state displays its optional action without requiring a message', () => {
  const EmptyState = loadFallback('EmptyState');
  const tree = EmptyState({ title: 'No matching pets', action: React.createElement('button', null, 'Reset filters') });
  const markup = renderToStaticMarkup(tree);
  assert.match(markup, /role="status"/);
  assert.match(markup, /Reset filters/);
  assert.doesNotMatch(markup, /<p>/);
});

test('error boundary preserves healthy children and only records a crash timestamp in production', () => {
  const storage = memoryStorage();
  const console = { error: mock.fn() };
  const Boundary = loadFallback('AppErrorBoundary', { globals: { sessionStorage: storage, console } });
  const children = React.createElement('p', null, 'Healthy content');
  const boundary = new Boundary({ children });
  assert.equal(boundary.render(), children);
  boundary.state = Boundary.getDerivedStateFromError();
  boundary.componentDidCatch(new Error('private form details'), { componentStack: 'private component details' });
  assert.equal(console.error.mock.callCount(), 0);
  const saved = calls(storage.setItem);
  assert.equal(saved.length, 1);
  assert.equal(saved[0][0], 'findlostpuppy_last_crash');
  assert.ok(Number.isFinite(Date.parse(saved[0][1])));
  const markup = renderToStaticMarkup(boundary.render());
  assert.match(markup, /Retry/);
  assert.match(markup, /Go to Home/);
  assert.doesNotMatch(markup, /private form|private component/);
});

for (const [base, destination] of [['/', '/homepage'], ['/nested/', '/nested/homepage']]) {
  test(`error boundary home action respects base ${base} and retry reloads`, () => {
    const location = { reload: mock.fn(), assign: mock.fn() };
    const storage = memoryStorage();
    storage.setItem.mock.mockImplementation(() => { throw new Error('storage denied'); });
    const Boundary = loadFallback('AppErrorBoundary', { globals: { sessionStorage: storage, window: { location } }, env: { BASE_URL: base } });
    const boundary = new Boundary({ children: null });
    boundary.state = Boundary.getDerivedStateFromError();
    boundary.setState = mock.fn();
    assert.doesNotThrow(() => boundary.componentDidCatch(new Error('crash'), {}));
    const actions = buttons(boundary.render());
    actions[0].props.onClick();
    assert.deepEqual(calls(boundary.setState), [[{ hasError: false }]]);
    assert.equal(location.reload.mock.callCount(), 1);
    actions[1].props.onClick();
    assert.deepEqual(calls(location.assign), [[destination]]);
  });
}

test('online hook subscribes to both events and cleans up both listeners', () => {
  const window = new EventTarget();
  const setOnline = mock.fn();
  let effect;
  const { useOnlineStatus } = loadModule('src/hooks/useOnlineStatus.ts', {
    mocks: { react: { useState: (initial) => [initial(), setOnline], useEffect: (setup) => { effect = setup; } } },
    globals: { window, navigator: { onLine: false } },
  });
  assert.equal(useOnlineStatus(), false);
  const cleanup = effect();
  window.dispatchEvent(new Event('online'));
  window.dispatchEvent(new Event('offline'));
  assert.deepEqual(calls(setOnline), [[true], [false]]);
  cleanup();
  window.dispatchEvent(new Event('online'));
  assert.equal(setOnline.mock.callCount(), 2);
});
