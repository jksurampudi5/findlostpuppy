import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { loadModule, memoryStorage, calls } from './test_harness.mjs';

const keys = Object.fromEntries(['profiles', 'pets', 'reports', 'sightings'].map((name) => [name, `findlostpuppy_${name}_v1`]));
const securePhoto = 'https://res.cloudinary.com/unit/image/authenticated/s--signature--/photo';
const legacyPhoto = 'https://res.cloudinary.com/unit/image/upload/old.jpg';
async function fixture(seed = {}) {
  const storage = memoryStorage({ ...Object.fromEntries(Object.values(keys).map((key) => [key, '[]'])), ...seed });
  const window = new EventTarget();
  const dispatch = mock.fn(window.dispatchEvent.bind(window));
  window.dispatchEvent = dispatch;
  const sync = {
    fetchAllCloudData: mock.fn(async () => null),
    syncUserProfile: mock.fn(async () => true), syncOwnerProfile: mock.fn(async () => true),
    syncPet: mock.fn(async () => true), syncLostReport: mock.fn(async () => true), syncSighting: mock.fn(async () => true),
    deletePetAsAdmin: mock.fn(async () => true),
  };
  const media = { hardResetCloudinary: mock.fn(async () => true), clearQueue: mock.fn() };
  const interval = mock.fn();
  const service = loadModule('src/services/storageService.ts', {
    mocks: {
      './consentService': { consentService: {} }, './firebaseConfig': { isFirebaseConfigured: () => true },
      './authService': { authService: { getCurrentUser: () => null } },
      './firebaseSyncService': { firebaseSyncService: sync },
      './storageBucketService': { storageBucketService: media },
      '../utils/dogPhotoHelper': { resolveGenericMediaUrl: (url) => url, isPetPhotoUrl: () => false },
      '../assets/abullu.jpg': 'synthetic-other.jpg', '../assets/sonu.jpg': 'synthetic-memorial.jpg',
    }, globals: { localStorage: storage, window, navigator: { onLine: true }, setInterval: interval },
  }).storageService;
  // Drain the constructor's asynchronous import and initial cloud pull.
  await new Promise((resolve) => setImmediate(resolve));
  return { service, storage, sync, media, dispatch, interval };
}

test('startup pulls cloud state without pushing stale local snapshots back to Firebase', async () => {
  const f = await fixture({ [keys.profiles]: JSON.stringify([{ id: 'profile-a', userId: 'user-a', email: 'owner@example.invalid' }]) });
  assert.equal(f.sync.fetchAllCloudData.mock.callCount(), 1);
  assert.equal(f.sync.syncUserProfile.mock.callCount(), 0);
  assert.equal(f.sync.syncOwnerProfile.mock.callCount(), 0);
  assert.equal(f.sync.syncPet.mock.callCount(), 0);
  assert.equal(f.sync.syncLostReport.mock.callCount(), 0);
  assert.equal(calls(f.interval)[0][1], 20000);
});

for (const throws of [false, true]) {
  test(`cloud sync ${throws ? 'rejection' : 'empty result'} emits a recoverable failure and preserves local data`, async () => {
    const f = await fixture({ [keys.pets]: JSON.stringify([{ id: 'pet-a', name: 'Synthetic Pet', ownerId: 'user-a' }]) });
    const before = f.storage.getItem(keys.pets);
    const count = f.dispatch.mock.callCount();
    f.sync.fetchAllCloudData.mock.mockImplementation(async () => {
      if (throws) throw new Error('offline');
      return null;
    });
    assert.equal(await f.service.pullFromFirebase(), false);
    assert.deepEqual(calls(f.dispatch).slice(count).map(([event]) => event.type), ['findlostpuppy_cloud_sync_failed']);
    assert.equal(f.storage.getItem(keys.pets), before);
  });
}

test('admin reset preserves app data and upload queue when media cleanup cannot finish', async () => {
  const f = await fixture({ [keys.pets]: JSON.stringify([{ id: 'pet-a', name: 'Synthetic Pet', ownerId: 'user-a' }]) });
  const before = Object.fromEntries(Object.values(keys).map((key) => [key, f.storage.getItem(key)]));
  f.media.hardResetCloudinary.mock.mockImplementation(async () => false);
  await assert.rejects(f.service.clearAllAdminTestData(), /No application data was removed/);
  assert.deepEqual(Object.fromEntries(Object.values(keys).map((key) => [key, f.storage.getItem(key)])), before);
  assert.equal(f.media.clearQueue.mock.callCount(), 0);
  assert.equal(f.sync.deletePetAsAdmin.mock.callCount(), 0);
});

test('successful media cleanup lets admin reset clear the queue and preserve the memorial pet', async () => {
  const f = await fixture();
  assert.equal(await f.service.clearAllAdminTestData(), true);
  assert.equal(f.media.hardResetCloudinary.mock.callCount(), 1);
  assert.equal(f.media.clearQueue.mock.callCount(), 1);
  const pets = JSON.parse(f.storage.getItem(keys.pets));
  assert.equal(pets.length, 1);
  assert.equal(pets[0].name, 'SONU');
  assert.equal(pets[0].primaryPhoto, 'synthetic-memorial.jpg');
  assert.equal(JSON.parse(f.storage.getItem(keys.reports))[0].id, 'LOST-1788885000505');
  assert.deepEqual(JSON.parse(f.storage.getItem(keys.profiles)), []);
  assert.deepEqual(JSON.parse(f.storage.getItem(keys.sightings)), []);
});

test('legacy media cleanup preserves signed media and memorial assets across all record types', async () => {
  const f = await fixture({
    [keys.profiles]: JSON.stringify([{ id: 'profile-a', userId: 'user-a', photo: legacyPhoto }, { id: 'profile-b', userId: 'user-b', photo: securePhoto }]),
    [keys.pets]: JSON.stringify([
      { id: 'pet-a', ownerId: 'user-a', primaryPhoto: legacyPhoto, photos: [legacyPhoto, securePhoto] },
      { id: '1788885000505', ownerId: 'memorial-owner', primaryPhoto: 'synthetic-memorial.jpg', photos: ['synthetic-memorial.jpg'] },
    ]),
    [keys.reports]: JSON.stringify([{ id: 'report-a', ownerId: 'user-c', status: 'LOST', dog: { id: 'pet-c', primaryPhoto: legacyPhoto, photos: [legacyPhoto, securePhoto] } }]),
    [keys.sightings]: JSON.stringify([{ id: 'sighting-a', reportId: 'report-a', photo: legacyPhoto, photos: [securePhoto, legacyPhoto] }]),
    findlostpuppy_active_user: JSON.stringify({ id: 'user-a', avatar: legacyPhoto }),
  });
  assert.equal(await f.service.clearLegacyMediaReferences(), 8);
  const profiles = JSON.parse(f.storage.getItem(keys.profiles));
  assert.equal(profiles[0].photo, undefined);
  assert.equal(profiles[1].photo, securePhoto);
  const pets = JSON.parse(f.storage.getItem(keys.pets));
  assert.equal(pets.find((pet) => pet.id === 'pet-a').primaryPhoto, '');
  assert.deepEqual(pets.find((pet) => pet.id === 'pet-a').photos, [securePhoto]);
  assert.equal(pets.find((pet) => pet.id === '1788885000505').primaryPhoto, 'synthetic-memorial.jpg');
  const report = JSON.parse(f.storage.getItem(keys.reports))[0];
  // Reports retain the repository's bundled fallback after removing legacy media.
  assert.equal(report.dog.primaryPhoto, 'synthetic-other.jpg');
  assert.deepEqual(report.dog.photos, [securePhoto]);
  const sighting = JSON.parse(f.storage.getItem(keys.sightings))[0];
  assert.equal(sighting.photo, undefined);
  assert.deepEqual(sighting.photos, [securePhoto]);
  assert.equal(JSON.parse(f.storage.getItem('findlostpuppy_active_user')).avatar, undefined);
  assert.equal(f.sync.syncOwnerProfile.mock.callCount(), 2);
});


test('legacy cleanup does not count or rewrite already authenticated images', async () => {
  const f = await fixture({
    [keys.profiles]: JSON.stringify([{ id: 'profile-a', userId: 'user-a', photo: securePhoto }]),
    [keys.pets]: JSON.stringify([{ id: 'pet-a', ownerId: 'user-a', primaryPhoto: securePhoto, photos: [securePhoto] }]),
    findlostpuppy_active_user: JSON.stringify({ id: 'user-a', avatar: securePhoto }),
  });
  assert.equal(await f.service.clearLegacyMediaReferences(), 0);
  assert.equal(JSON.parse(f.storage.getItem(keys.profiles))[0].photo, securePhoto);
  assert.equal(JSON.parse(f.storage.getItem('findlostpuppy_active_user')).avatar, securePhoto);
});

test('legacy cleanup preserves the memorial pet using its actual baseline pet ID', async () => {
  const f = await fixture();
  await f.service.clearAllAdminTestData();
  const before = JSON.parse(f.storage.getItem(keys.pets))[0];
  await f.service.clearLegacyMediaReferences();
  const after = JSON.parse(f.storage.getItem(keys.pets))[0];
  assert.equal(after.primaryPhoto, before.primaryPhoto);
  assert.deepEqual(after.photos, before.photos);
});
