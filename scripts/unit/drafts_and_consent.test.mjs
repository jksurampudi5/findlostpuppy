import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { loadModule, memoryStorage, calls } from './test_harness.mjs';

const now = Date.parse('2026-01-10T00:00:00.000Z');
class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
}
const week = 7 * 24 * 60 * 60 * 1000;
function draftFixture(initial = {}) {
  const storage = memoryStorage(initial);
  const effects = [];
  const timers = new Map();
  let nextTimer = 0;
  const window = {
    setTimeout: mock.fn((fn, _delay) => { timers.set(++nextTimer, fn); return nextTimer; }),
    clearTimeout: mock.fn((id) => timers.delete(id)),
  };
  // Capture effect setup/cleanup as the hook's boundary; no React internals or DOM are replaced.
  const react = { useRef: (value) => ({ current: value }), useEffect: (fn) => effects.push(fn) };
  const module = loadModule('src/hooks/useCrashSafeDraft.ts', {
    mocks: { react }, globals: { localStorage: storage, Date: FixedDate, window },
  });
  return { ...module, storage, effects, window, timers };
}

for (const [age, retained] of [[0, true], [week - 1, true], [week, true], [week + 1, false]]) {
  test(`draft expiration boundary: age ${age}ms`, () => {
    const value = { name: 'Synthetic Pet', details: { notes: 'draft' }, photos: ['data:image/jpeg;base64,AQID'] };
    const raw = JSON.stringify({ savedAt: new Date(now - age).toISOString(), value });
    const f = draftFixture({ draft: raw, unrelated: 'keep' });
    assert.deepEqual(f.readCrashSafeDraft('draft'), retained ? value : null);
    assert.equal(f.storage.getItem('draft'), retained ? raw : null);
    assert.equal(f.storage.getItem('unrelated'), 'keep');
  });
}

for (const raw of [undefined, '{broken', '{}', JSON.stringify({ value: { name: 'missing timestamp' } })]) {
  test(`missing or malformed drafts safely return null: ${raw}`, () => {
    const f = draftFixture(raw === undefined ? {} : { draft: raw });
    assert.equal(f.readCrashSafeDraft('draft'), null);
  });
}

test('storage read/clear failures never escape into the live form', () => {
  const f = draftFixture();
  f.storage.getItem.mock.mockImplementation(() => { throw new Error('storage denied'); });
  f.storage.removeItem.mock.mockImplementation(() => { throw new Error('storage denied'); });
  assert.equal(f.readCrashSafeDraft('draft'), null);
  assert.doesNotThrow(() => f.clearCrashSafeDraft('draft'));
});

test('draft clear removes only the selected form', () => {
  const f = draftFixture({ draft: 'one', other: 'two' });
  f.clearCrashSafeDraft('draft');
  assert.equal(f.storage.getItem('draft'), null);
  assert.equal(f.storage.getItem('other'), 'two');
});

test('draft save is deferred 250ms and persists a timestamped value', () => {
  const f = draftFixture();
  f.useCrashSafeDraft('draft', { name: 'Synthetic Pet' });
  f.effects.forEach((effect) => effect());
  assert.equal(f.storage.getItem('draft'), null);
  assert.equal(calls(f.window.setTimeout)[0][1], 250);
  [...f.timers.values()][0]();
  assert.deepEqual(JSON.parse(f.storage.getItem('draft')), { savedAt: new Date(now).toISOString(), value: { name: 'Synthetic Pet' } });
});

test('disabled drafts do not schedule writes; effect cleanup cancels stale writes', () => {
  const disabled = draftFixture();
  disabled.useCrashSafeDraft('draft', 'value', false);
  disabled.effects.forEach((effect) => effect());
  assert.equal(disabled.timers.size, 0);
  const f = draftFixture();
  f.useCrashSafeDraft('draft', 'stale');
  f.effects[0]();
  const cleanup = f.effects[1]();
  cleanup();
  assert.equal(f.timers.size, 0);
  assert.equal(f.storage.setItem.mock.callCount(), 0);
});

for (const extraBytes of [0, 1]) {
  test(`serialized draft size ${extraBytes ? 'above' : 'at'} 4 MiB is enforced including metadata`, () => {
    const f = draftFixture({ draft: 'previous' });
    const overhead = Buffer.byteLength(JSON.stringify({ savedAt: new Date(now).toISOString(), value: '' }));
    const value = 'a'.repeat(4 * 1024 * 1024 - overhead + extraBytes);
    f.useCrashSafeDraft('draft', value);
    f.effects.forEach((effect) => effect());
    [...f.timers.values()][0]();
    if (extraBytes) assert.equal(f.storage.getItem('draft'), 'previous');
    else assert.equal(Buffer.byteLength(f.storage.getItem('draft')), 4 * 1024 * 1024);
  });
}

test('draft size uses UTF-8 bytes rather than character count', () => {
  const f = draftFixture({ draft: 'previous' });
  f.useCrashSafeDraft('draft', '€'.repeat(1_500_000));
  f.effects.forEach((effect) => effect());
  [...f.timers.values()][0]();
  assert.equal(f.storage.getItem('draft'), 'previous');
});

test('quota failures and cyclic form values do not throw from the deferred save', () => {
  const cyclic = {}; cyclic.self = cyclic;
  for (const value of ['normal value', cyclic]) {
    const f = draftFixture();
    f.storage.setItem.mock.mockImplementation(() => { throw new Error('quota exceeded'); });
    f.useCrashSafeDraft('draft', value);
    f.effects.forEach((effect) => effect());
    assert.doesNotThrow(() => [...f.timers.values()][0]());
  }
});

function consentFixture() {
  const storage = memoryStorage();
  const module = loadModule('src/services/consentService.ts', { globals: { localStorage: storage, window: new EventTarget() } });
  return { service: module.consentService, storage };
}

test('new consent records use the bumped versions and are accepted after reload', () => {
  const f = consentFixture();
  assert.equal(f.service.hasAcceptedCurrentConsent(), false);
  const record = f.service.recordConsent('user-a');
  assert.equal(record.consentVersion, '1.1');
  assert.equal(record.termsVersion, '1.1');
  assert.equal(record.privacyVersion, '1.1');
  assert.equal(record.guidelinesVersion, '1.0');
  assert.equal(f.service.hasAcceptedCurrentConsent(), true);
});

for (const field of ['consentVersion', 'termsVersion', 'privacyVersion', 'disclaimerVersion', 'guidelinesVersion']) {
  for (const stale of [undefined, 'outdated']) {
    test(`requires renewed consent for ${stale ?? 'missing'} ${field}`, () => {
      const f = consentFixture();
      const record = f.service.recordConsent('user-a');
      f.storage.setItem('findlostpuppy_consent_v1', JSON.stringify({ ...record, [field]: stale }));
      assert.equal(f.service.hasAcceptedCurrentConsent(), false);
    });
  }
}

test('legacy 1.0 consent is rejected even with current guidelines', () => {
  const f = consentFixture();
  const record = f.service.recordConsent('user-a');
  f.storage.setItem('findlostpuppy_consent_v1', JSON.stringify({ ...record, consentVersion: '1.0', termsVersion: '1.0', privacyVersion: '1.0' }));
  assert.equal(f.service.hasAcceptedCurrentConsent(), false);
});

test('current versions without an affirmative timestamp or valid stored JSON are rejected', () => {
  const f = consentFixture();
  const record = f.service.recordConsent('user-a');
  for (const value of [JSON.stringify({ ...record, agreedAt: '' }), '{bad', 'null']) {
    f.storage.setItem('findlostpuppy_consent_v1', value);
    assert.equal(f.service.hasAcceptedCurrentConsent(), false);
  }
});

test('a draft with an invalid savedAt value is discarded rather than restored indefinitely', () => {
  const f = draftFixture({ draft: JSON.stringify({ savedAt: 'not-a-date', value: 'stale private draft' }) });
  assert.equal(f.readCrashSafeDraft('draft'), null);
  assert.equal(f.storage.getItem('draft'), null);
});
