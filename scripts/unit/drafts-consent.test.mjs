import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { loadModule, memoryStorage } from './test-support.mjs';

const now = Date.parse('2026-09-30T12:00:00Z');
class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
}
function drafts(storage = memoryStorage()) {
  const effects = [];
  const timers = new Map();
  let timerId = 0;
  const window = {
    setTimeout: (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; },
    clearTimeout: (id) => timers.delete(id),
  };
  const api = loadModule('src/hooks/useCrashSafeDraft.ts', {
    dependencies: { react: { useRef: (current) => ({ current }), useEffect: (effect) => effects.push(effect) } },
    globals: { localStorage: storage, Date: FixedDate, window },
  });
  // Exercise effect scheduling and cleanup without adding a DOM/React test dependency.
  const mount = (...args) => { api.useCrashSafeDraft(...args); return effects.splice(0).map((effect) => effect()).filter(Boolean); };
  const tick = () => { for (const [id, timer] of timers) { timers.delete(id); timer.callback(); } };
  return { ...api, storage, timers, mount, tick };
}

test('draft reader restores values through exactly seven days and removes expired drafts', () => {
  const h = drafts();
  for (const [age, valid] of [[0, true], [7 * 86400000, true], [7 * 86400000 + 1, false]]) {
    h.storage.setItem('draft', JSON.stringify({ savedAt: new Date(now - age).toISOString(), value: { notes: 'Synthetic draft', photos: [] } }));
    assert.deepEqual(h.readCrashSafeDraft('draft'), valid ? { notes: 'Synthetic draft', photos: [] } : null);
    if (!valid) assert.equal(h.storage.getItem('draft'), null);
  }
});

test('missing, malformed, and untimestamped drafts do not crash recovery', () => {
  const h = drafts();
  assert.equal(h.readCrashSafeDraft('missing'), null);
  for (const raw of ['{broken', 'null', '{}', '{"value":"old"}']) {
    h.storage.setItem('draft', raw);
    assert.equal(h.readCrashSafeDraft('draft'), null);
  }
});

test('draft save is debounced and cleanup cancels stale pending saves', () => {
  const h = drafts();
  const cleanups = h.mount('draft', { notes: 'old' });
  assert.equal(h.storage.getItem('draft'), null);
  assert.equal([...h.timers.values()][0].delay, 250);
  cleanups.forEach((cleanup) => cleanup());
  h.tick();
  assert.equal(h.storage.getItem('draft'), null);
  h.mount('draft', { notes: 'latest' });
  h.tick();
  assert.deepEqual(JSON.parse(h.storage.getItem('draft')), { savedAt: new Date(now).toISOString(), value: { notes: 'latest' } });
});

test('disabled drafts never schedule a save', () => {
  const h = drafts();
  h.mount('draft', { notes: 'do not save' }, false);
  assert.equal(h.timers.size, 0);
  assert.equal(h.storage.getItem('draft'), null);
});

test('draft size limit counts UTF-8 bytes and preserves the last recoverable value on overflow', () => {
  const h = drafts();
  const overhead = new Blob([JSON.stringify({ savedAt: new Date(now).toISOString(), value: '' })]).size;
  const exact = 'a'.repeat(4 * 1024 * 1024 - overhead);
  h.mount('draft', exact);
  h.tick();
  assert.equal(h.readCrashSafeDraft('draft'), exact);
  for (const value of [exact + 'a', 'é'.repeat(2 * 1024 * 1024)]) {
    h.mount('draft', value);
    h.tick();
    assert.equal(h.readCrashSafeDraft('draft'), exact);
  }
});

test('unavailable or full storage and circular form values do not break the live form', () => {
  const h = drafts({ getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('blocked'); } });
  assert.equal(h.readCrashSafeDraft('draft'), null);
  assert.doesNotThrow(() => h.clearCrashSafeDraft('draft'));
  h.mount('draft', { notes: 'test' });
  assert.doesNotThrow(h.tick);
  const circular = {}; circular.self = circular;
  h.mount('draft', circular);
  assert.doesNotThrow(h.tick);
});

test('clearing a submitted draft leaves other forms intact', () => {
  const h = drafts(memoryStorage({ first: 'value', second: 'keep' }));
  h.clearCrashSafeDraft('first');
  assert.equal(h.storage.getItem('first'), null);
  assert.equal(h.storage.getItem('second'), 'keep');
});

for (const version of ['consentVersion', 'termsVersion', 'privacyVersion']) {
  test(`the new ${version} requires renewed acceptance of older legal terms`, () => {
    const storage = memoryStorage();
    const { consentService } = loadModule('src/services/consentService.ts', { globals: { localStorage: storage, window: undefined } });
    const record = consentService.recordConsent('user-1');
    assert.equal(record[version], '1.1');
    assert.equal(consentService.hasAcceptedCurrentConsent(), true);
    storage.setItem('findlostpuppy_consent_v1', JSON.stringify({ ...record, [version]: '1.0' }));
    assert.equal(consentService.hasAcceptedCurrentConsent(), false);
    consentService.recordConsent('user-1');
    assert.equal(consentService.hasAcceptedCurrentConsent(), true);
  });
}

test('online status follows browser events and removes listeners on unmount', () => {
  const effects = [];
  const listeners = new Map();
  const setState = mock.fn();
  const window = { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name, fn) => { assert.equal(listeners.get(name), fn); listeners.delete(name); } };
  const { useOnlineStatus } = loadModule('src/hooks/useOnlineStatus.ts', {
    dependencies: { react: { useState: (initial) => [initial(), setState], useEffect: (effect) => effects.push(effect) } },
    globals: { window, navigator: { onLine: false } },
  });
  assert.equal(useOnlineStatus(), false);
  const cleanup = effects[0]();
  listeners.get('online')();
  listeners.get('offline')();
  assert.deepEqual(setState.mock.calls.map((call) => call.arguments), [[true], [false]]);
  cleanup();
  assert.equal(listeners.size, 0);
});
