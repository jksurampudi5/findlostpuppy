import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { loadModule, memoryStorage } from './test-support.mjs';

function setup() {
  const localStorage = memoryStorage({
    findlostpuppy_reports_v1: '[]', findlostpuppy_pets_v1: '[]',
    findlostpuppy_profiles_v1: JSON.stringify([{ id: 'user-1', fullName: 'Synthetic owner', photo: 'https://old.example.test/avatar' }]),
    findlostpuppy_active_user: JSON.stringify({ id: 'user-1', avatar: 'https://old.example.test/avatar' }),
  });
  const events = [];
  const fetchAllCloudData = mock.fn(async () => null);
  const syncOwnerProfile = mock.fn(async () => true);
  const hardResetCloudinary = mock.fn(async () => false);
  const clearQueue = mock.fn();
  const service = loadModule('src/services/storageService.ts', {
    dependencies: {
      './consentService': { consentService: {} }, './firebaseConfig': { isFirebaseConfigured: () => true },
      './authService': { authService: {} },
      '../utils/dogPhotoHelper': { resolveGenericMediaUrl: (url) => url, isPetPhotoUrl: () => false },
      './storageBucketService': { storageBucketService: { hardResetCloudinary, clearQueue } },
      './firebaseSyncService': { firebaseSyncService: { fetchAllCloudData, syncOwnerProfile, deletePetAsAdmin: async () => true } },
      '../assets/abullu.jpg': '/test-default.jpg', '../assets/sonu.jpg': '/test-sonu.jpg',
    },
    globals: { localStorage, window: { addEventListener() {}, dispatchEvent: (event) => events.push(event) }, navigator: { onLine: true }, setInterval() {} },
  }).storageService;
  return { service, localStorage, events, fetchAllCloudData, syncOwnerProfile, hardResetCloudinary, clearQueue };
}

test('startup pulls cloud data without uploading stale cached profiles', async () => {
  const h = setup();
  // Drain the asynchronous constructor pull without a real timer or background service.
  await new Promise(setImmediate);
  assert.equal(h.fetchAllCloudData.mock.callCount(), 1);
  assert.equal(h.syncOwnerProfile.mock.callCount(), 0);
  assert.equal(h.service.getAllOwnerProfiles()[0].id, 'user-1');
});

test('null and failed cloud pulls notify recovery UI without losing saved data', async () => {
  const h = setup();
  await new Promise(setImmediate);
  for (const fetch of [async () => null, async () => { throw new Error('offline'); }]) {
    h.events.length = 0;
    h.fetchAllCloudData.mock.mockImplementation(fetch);
    const before = h.localStorage.getItem('findlostpuppy_profiles_v1');
    assert.equal(await h.service.pullFromFirebase(), false);
    assert.deepEqual(h.events.map((event) => event.type), ['findlostpuppy_cloud_sync_failed']);
    assert.equal(h.localStorage.getItem('findlostpuppy_profiles_v1'), before);
  }
});

test('failed cloud image reset leaves local records and upload retries intact', async () => {
  const h = setup();
  const before = h.localStorage.getItem('findlostpuppy_profiles_v1');
  await assert.rejects(h.service.clearAllAdminTestData(), /No application data was removed/);
  assert.equal(h.clearQueue.mock.callCount(), 0);
  assert.equal(h.localStorage.getItem('findlostpuppy_profiles_v1'), before);
  assert.equal(h.service.getAllOwnerProfiles()[0].id, 'user-1');
});

test('successful cloud image reset clears the retry queue and local records while preserving Sonu', async () => {
  const h = setup();
  h.hardResetCloudinary.mock.mockImplementation(async () => true);
  assert.equal(await h.service.clearAllAdminTestData(), true);
  assert.equal(h.clearQueue.mock.callCount(), 1);
  assert.deepEqual(h.service.getAllOwnerProfiles(), []);
  const reports = h.service.getAllReports();
  assert.equal(reports.length, 1);
  assert.equal(reports[0].id, 'LOST-1788885000505');
  assert.equal(reports[0].dog.primaryPhoto, '/test-sonu.jpg');
});

test('legacy avatar cleanup removes public URLs from profiles and session and persists the sanitized profile', async () => {
  const h = setup();
  assert.equal(await h.service.clearLegacyMediaReferences(), 2);
  assert.equal(h.service.getAllOwnerProfiles()[0].photo, undefined);
  assert.equal(JSON.parse(h.localStorage.getItem('findlostpuppy_active_user')).avatar, undefined);
  assert.equal(h.syncOwnerProfile.mock.callCount(), 1);
  assert.equal(h.syncOwnerProfile.mock.calls[0].arguments[0].photo, undefined);
  assert.equal(await h.service.clearLegacyMediaReferences(), 0);
});
