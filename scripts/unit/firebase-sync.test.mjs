import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { loadModule } from './test-support.mjs';

function snapshot(id, value) {
  return { id, exists: () => value !== undefined, data: () => value };
}
function setup({ signedIn = true, configured = true } = {}) {
  const own = { profiles: snapshot('user-1', { name: 'Synthetic owner' }), pets: snapshot('user-1'), missing_reports: snapshot('user-1', { status: 'SAFE' }) };
  const shared = { missing_reports: [snapshot('user-2', { status: 'LOST' }), snapshot('user-1', { status: 'LOST' })], sightings: [snapshot('sighting-1', { reportId: 'user-2' })] };
  const getDoc = mock.fn(async (ref) => own[ref.collection]);
  const getDocs = mock.fn(async (query) => ({ docs: shared[query.collection] || [] }));
  const setDoc = mock.fn(async () => {});
  const service = loadModule('src/services/firebaseSyncService.ts', {
    dependencies: {
      './firebaseConfig': { db: {}, storage: null, isFirebaseConfigured: () => configured, auth: { currentUser: signedIn ? { uid: 'user-1', email: 'owner@example.test' } : null } },
      './storageBucketService': { storageBucketService: { uploadMedia: async () => null } },
      '../utils/dogPhotoHelper': { isPetPhotoUrl: () => false },
      'firebase/storage': {},
      'firebase/firestore': {
        doc: (_, collection, id) => ({ collection, id }), collection: (_, collection) => ({ collection }),
        where: (field, operator, value) => ({ field, operator, value }),
        query: (collection, ...filters) => ({ ...collection, filters }), getDoc, getDocs, setDoc,
      },
    }, globals: { navigator: { onLine: true } },
  }).firebaseSyncService;
  return { service, own, shared, getDoc, getDocs, setDoc };
}

test('normal users fetch only their own private documents and privacy-filtered shared collections', async () => {
  const h = setup();
  const result = await h.service.fetchAllCloudData();
  assert.deepEqual(h.getDoc.mock.calls.map((call) => call.arguments[0]), ['profiles', 'pets', 'missing_reports'].map((collection) => ({ collection, id: 'user-1' })));
  assert.deepEqual(h.getDocs.mock.calls.map((call) => call.arguments[0]), [
    { collection: 'missing_reports', filters: [
      ['status', 'LOST'], ['contactMechanism.safeContactPhone', ''], ['contactMechanism.safeContactEmail', ''], ['contactMechanism.contactNote', ''], ['lastKnownLatitude', null], ['lastKnownLongitude', null],
    ].map(([field, value]) => ({ field, operator: '==', value })) },
    { collection: 'sightings', filters: ['reporterPhone', 'reporterEmail', 'latitude', 'longitude'].map((field) => ({ field, operator: '==', value: null })) },
  ]);
  assert.deepEqual(result.profiles, [{ id: 'user-1', name: 'Synthetic owner' }]);
  assert.deepEqual(result.pets, []);
  assert.deepEqual(result.reports, [{ id: 'user-2', status: 'LOST' }, { id: 'user-1', status: 'SAFE' }]);
  assert.deepEqual(result.sightings, [{ id: 'sighting-1', reportId: 'user-2' }]);
  const status = h.service.getStatus();
  assert.equal(status.syncedReportsCount, 2);
  assert.equal(status.syncedMembersCount, 1);
  assert.equal(status.syncedPetsCount, 0);
  assert.equal(status.syncedSightingsCount, 1);
  assert.ok(Number.isFinite(Date.parse(status.lastSyncTime)));
});

test('no authentication or configuration means no cloud reads or writes', async () => {
  for (const options of [{ signedIn: false }, { configured: false }]) {
    const h = setup(options);
    assert.equal(await h.service.fetchAllCloudData(), null);
    assert.equal(await h.service.updatePetSafetyStatus('pet-1', true), false);
    assert.equal(h.getDoc.mock.callCount() + h.getDocs.mock.callCount() + h.setDoc.mock.callCount(), 0);
  }
});

test('empty private records do not create phantom profiles, pets, or reports', async () => {
  const h = setup();
  Object.keys(h.own).forEach((key) => { h.own[key] = snapshot('user-1'); });
  Object.keys(h.shared).forEach((key) => { h.shared[key] = []; });
  assert.deepEqual(await h.service.fetchAllCloudData(), { profiles: [], pets: [], reports: [], sightings: [] });
});

test('failed fetch returns no partial data, and successful retry clears the error', async () => {
  const h = setup();
  h.getDocs.mock.mockImplementationOnce(async () => { throw new Error('permission-denied'); });
  assert.equal(await h.service.fetchAllCloudData(), null);
  assert.equal(h.service.getStatus().errorMessage, 'permission-denied');
  assert.equal(h.service.getStatus().lastSyncTime, null);
  assert.ok(await h.service.fetchAllCloudData());
  assert.equal(h.service.getStatus().errorMessage, null);
});

for (const status of ['LOST', 'SAFE']) {
  test(`${status} report writes remove contact details and precise coordinates`, async () => {
    const h = setup();
    const report = {
      id: 'report-1', ownerId: 'owner-user-1', status, dog: { id: 'pet-1', name: 'Test pet' },
      lastKnownLatitude: 12.345, lastKnownLongitude: 67.89, lastKnownLocation: 'Test district',
      contactMechanism: { showPhone: false, showEmail: true, safeContactPhone: '0000000000', safeContactEmail: 'owner@example.test', contactNote: 'private note' },
    };
    const original = structuredClone(report);
    assert.equal(await h.service.syncLostReport(report), true);
    const [ref, payload, options] = h.setDoc.mock.calls[0].arguments;
    assert.deepEqual(ref, { collection: 'missing_reports', id: 'user-1' });
    assert.equal(payload.status, status);
    assert.equal(payload.lastKnownLatitude, null);
    assert.equal(payload.lastKnownLongitude, null);
    assert.equal(payload.lastKnownLocation, 'Test district');
    assert.deepEqual(payload.contactMechanism, { showPhone: false, showEmail: true, safeContactPhone: '', safeContactEmail: '', contactNote: '' });
    assert.deepEqual(options, { merge: true });
    assert.deepEqual(report, original);
  });
}

test('sighting writes retain recovery information while removing reporter contact and exact location', async () => {
  const h = setup();
  assert.equal(await h.service.syncSighting({ id: 'sighting-1', reportId: 'report-1', location: 'Test village', reporterUserId: 'user-1', reporterName: 'Private name', reporterPhone: '0000000000', reporterEmail: 'owner@example.test', latitude: 12.345, longitude: 67.89 }), true);
  const [ref, payload] = h.setDoc.mock.calls[0].arguments;
  assert.deepEqual(ref, { collection: 'sightings', id: 'sighting-1' });
  for (const field of ['reporterPhone', 'reporterEmail', 'latitude', 'longitude']) assert.equal(payload[field], null);
  assert.equal(payload.reporterName, 'Community member');
  assert.equal(payload.reporterUserId, 'user-1');
  assert.equal(payload.reportId, 'report-1');
  assert.equal(payload.location, 'Test village');
});

for (const isLost of [true, false]) {
  test(`safety update ${isLost} writes only the authenticated owner's report`, async () => {
    const h = setup();
    assert.equal(await h.service.updatePetSafetyStatus('untrusted-pet-id', isLost), true);
    const [ref, payload, options] = h.setDoc.mock.calls[0].arguments;
    assert.deepEqual(ref, { collection: 'missing_reports', id: 'user-1' });
    assert.equal(payload.status, isLost ? 'LOST' : 'SAFE');
    assert.ok(Number.isFinite(Date.parse(payload.updatedAt)));
    assert.deepEqual(options, { merge: true });
    assert.equal(h.getDocs.mock.callCount(), 0);
  });
}

test('failed report, sighting, and safety writes are not reported as successful', async () => {
  const h = setup();
  h.setDoc.mock.mockImplementation(async () => { throw new Error('write denied'); });
  assert.equal(await h.service.syncLostReport({ id: 'report-1' }), false);
  assert.equal(await h.service.syncSighting({ id: 'sighting-1' }), false);
  assert.equal(await h.service.updatePetSafetyStatus('pet-1', false), false);
});
