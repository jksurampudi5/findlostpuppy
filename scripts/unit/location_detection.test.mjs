import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { loadModule, deferred } from './test_harness.mjs';

// Exercise the actual hook across commits with a small deterministic hook scheduler.
// Native calls remain pending until the test resolves them, exposing re-render races.
function fixture() {
  const slots = [];
  let cursor = 0;
  let effects = [];
  let api;
  let listener;
  const timers = new Map();
  let timerId = 0;
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useState(initial) {
      const i = cursor++;
      slots[i] ??= { value: initial };
      return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }];
    },
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
    useCallback(fn, deps) {
      const i = cursor++;
      if (!slots[i] || !same(slots[i].deps, deps)) slots[i] = { fn, deps };
      return slots[i].fn;
    },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!slots[i] || !same(slots[i].deps, deps)) {
        const old = slots[i];
        slots[i] = { deps };
        effects.push(() => { old?.cleanup?.(); slots[i].cleanup = fn(); });
      }
    },
  };
  const remove = mock.fn();
  const settings = {
    isDeviceLocationEnabled: mock.fn(async () => true),
    checkAppLocationPermission: mock.fn(async () => 'granted'),
    requestAppLocationPermission: mock.fn(async () => 'granted'),
    promptEnableDeviceLocation: mock.fn(async () => ({ enabled: true })),
    openDeviceLocationSettings: mock.fn(async () => true),
    openAppPermissionSettings: mock.fn(async () => true),
  };
  const detect = mock.fn(async () => result);
  const success = mock.fn();
  const toast = mock.fn();
  const useLocationDetection = loadModule('src/hooks/useLocationDetection.ts', {
    mocks: {
      react,
      '@capacitor/core': { Capacitor: { isNativePlatform: () => true } },
      '@capacitor/app': { App: { addListener: async (_name, fn) => { listener = fn; return { remove }; } } },
      '../services/nativeSettingsService': settings,
      '../utils/geolocationHelper': { detectResilientLocation: detect, NativeLocationError: class extends Error {} },
      '../services/locationService': { locationService: { matchLocation: async () => null } },
      '../context/ToastContext': { useToast: () => ({ showToast: toast }) },
    },
    globals: {
      setTimeout: fn => { timers.set(++timerId, fn); return timerId; },
      clearTimeout: id => timers.delete(id),
    },
  }).useLocationDetection;
  const render = (onSuccess = success) => {
    cursor = 0;
    api = useLocationDetection({ onSuccess, onClearFieldsForNewDetection: () => {} });
    const pending = effects;
    effects = [];
    pending.forEach(fn => fn());
    return api;
  };
  render();
  return { render, settings, detect, success, remove, timers,
    resume: () => listener({ isActive: true }),
    unmount: () => slots.forEach(slot => slot?.cleanup?.()),
    get api() { return api; } };
}

const result = { state: 'Synthetic State', district: 'Synthetic District', mandal: 'Synthetic Mandal',
  city: 'Synthetic Village', source: 'gps', permissionStatus: 'fine', accuracyMeters: 10 };
const flush = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };

test('native permission wait survives a render and delivers all four fields to the latest callback', async () => {
  const f = fixture();
  const permission = deferred();
  f.settings.isDeviceLocationEnabled.mock.mockImplementation(() => permission.promise);
  const task = f.api.triggerDetectLocation();
  const latest = mock.fn();
  f.render(latest);
  permission.resolve(true);
  await task;
  assert.equal(f.remove.mock.callCount(), 0);
  assert.equal(f.success.mock.callCount(), 0);
  assert.equal(latest.mock.callCount(), 1);
  const value = latest.mock.calls[0].arguments[0];
  assert.deepEqual([value.detectedState, value.detectedDistrict, value.detectedMandal, value.detectedCity],
    ['Synthetic State', 'Synthetic District', 'Synthetic Mandal', 'Synthetic Village']);
  assert.equal(f.render().detecting, false);
});

test('native geocoding survives changing callbacks and an ordinary render', async () => {
  const f = fixture();
  const geo = deferred();
  f.detect.mock.mockImplementation(() => geo.promise);
  const task = f.api.triggerDetectLocation();
  await flush();
  f.render();
  geo.resolve(result);
  await task;
  assert.equal(f.success.mock.callCount(), 1);
  assert.equal(f.remove.mock.callCount(), 0);
});

test('Reset discards the old result without clearing a newer attempt loading state', async () => {
  const f = fixture();
  const first = deferred();
  const second = deferred();
  let attempt = 0;
  f.detect.mock.mockImplementation(() => attempt++ === 0 ? first.promise : second.promise);
  const oldTask = f.api.triggerDetectLocation();
  await flush();
  f.api.cancelDetection();
  const newTask = f.api.triggerDetectLocation();
  await flush();
  first.resolve({ ...result, city: 'Stale Village' });
  await oldTask;
  assert.equal(f.render().detecting, true);
  assert.equal(f.success.mock.callCount(), 0);
  second.resolve(result);
  await newTask;
  assert.equal(f.render().detecting, false);
  assert.equal(f.success.mock.calls[0].arguments[0].detectedCity, 'Synthetic Village');
});

test('permission settings return survives renders and uses app settings rather than the GPS switch', async () => {
  const f = fixture();
  await f.api.handleOpenAppSettings();
  f.render();
  f.resume();
  await flush();
  assert.equal(f.settings.openAppPermissionSettings.mock.callCount(), 1);
  assert.equal(f.settings.openDeviceLocationSettings.mock.callCount(), 0);
  assert.equal(f.success.mock.callCount(), 1);
});

test('unmount discards pending geocoding instead of saving a departed screen', async () => {
  const f = fixture();
  const geo = deferred();
  f.detect.mock.mockImplementation(() => geo.promise);
  const task = f.api.triggerDetectLocation();
  await flush();
  f.unmount();
  geo.resolve(result);
  await task;
  assert.equal(f.success.mock.callCount(), 0);
  assert.equal(f.remove.mock.callCount(), 1);
});

test('whole-resolver timeout ends loading and delivers fallback cards while ignoring late provider results', async () => {
  const f = fixture();
  const geo = deferred();
  f.detect.mock.mockImplementation(() => geo.promise);
  const task = f.api.triggerDetectLocation();
  await flush();
  [...f.timers.values()].forEach(fn => fn());
  await task;
  assert.equal(f.render().detecting, false);
  assert.equal(f.success.mock.callCount(), 1);
  assert.equal(f.success.mock.calls[0].arguments[0].detectedState, 'Andhra Pradesh');
  assert.equal(f.success.mock.calls[0].arguments[0].detectedDistrict, 'East Godavari');
  assert.equal(f.success.mock.calls[0].arguments[0].detectedMandal, 'Undrajavaram');
  assert.equal(f.success.mock.calls[0].arguments[0].detectedCity, 'Palangi');
  geo.resolve(result);
  await flush();
  assert.equal(f.success.mock.callCount(), 1);
});
