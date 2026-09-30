import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { loadModule, calls } from './test_harness.mjs';

const snapshot = (id, data) => ({ id, exists: () => data !== undefined, data: () => data });
function fixture({ signedIn = true, configured = true } = {}) {
  const firestore = {
    doc: (_db, collection, id) => ({ collection, id }),
    collection: (_db, name) => ({ collection: name }),
    where: (field, operator, value) => ({ field, operator, value }),
    query: (collection, ...filters) => ({ ...collection, filters }),
    getDoc: mock.fn(async (ref) => snapshot(ref.id)),
    getDocs: mock.fn(async () => ({ docs: [] })),
    setDoc: mock.fn(async () => {}),
  };
  const uploadMedia = mock.fn(async () => ({ publicUrl: 'https://media.example.invalid/photo' }));
  const service = loadModule('src/services/firebaseSyncService.ts', {
    mocks: {
      'firebase/firestore': firestore, 'firebase/storage': {},
      './firebaseConfig': { db: {}, storage: null, isFirebaseConfigured: () => configured,
        auth: { currentUser: signedIn ? { uid: 'user-a', email: 'owner@example.invalid' } : null } },
      './storageBucketService': { storageBucketService: { uploadMedia } },
      '../utils/dogPhotoHelper': { isPetPhotoUrl: () => false },
    }, globals: { navigator: { onLine: true } },
  }).firebaseSyncService;
  return { service, firestore, uploadMedia };
}

const report = () => ({
  id: 'report-a', ownerId: 'owner-user-a', dogId: 'pet-a', status: 'LOST',
  dog: { name: 'Synthetic Pet', primaryPhoto: 'data:image/jpeg;base64,AQID' },
  lastKnownLatitude: 1.25, lastKnownLongitude: 2.5, lastKnownLocation: 'Synthetic Village',
  contactMechanism: { showPhone: false, showEmail: false, safeContactPhone: '9000000000', safeContactEmail: 'owner@example.invalid', contactNote: 'private-note' },
});
const sighting = () => ({
  id: 'sighting-a', reportId: 'report-a', reporterUserId: 'owner-user-a',
  photo: 'data:image/jpeg;base64,AQID', latitude: 1.25, longitude: 2.5,
  reporterName: 'Synthetic Reporter', reporterPhone: '9000000000', reporterEmail: 'reporter@example.invalid',
  location: 'Synthetic Village', state: 'Synthetic State', district: 'Synthetic District',
});

for (const status of ['LOST', 'SAFE']) {
  test(`${status} report writes remove private coordinates and contact details`, async () => {
    const f = fixture();
    const input = { ...report(), status };
    assert.equal(await f.service.syncLostReport(input), true);
    const [ref, data, options] = calls(f.firestore.setDoc)[0];
    assert.deepEqual(ref, { collection: 'missing_reports', id: 'user-a' });
    assert.equal(data.status, status);
    assert.equal(data.lastKnownLatitude, null);
    assert.equal(data.lastKnownLongitude, null);
    assert.deepEqual(data.contactMechanism, { showPhone: false, showEmail: false, safeContactPhone: '', safeContactEmail: '', contactNote: '' });
    assert.equal(data.lastKnownLocation, 'Synthetic Village');
    assert.equal(data.petPhoto, 'https://media.example.invalid/photo');
    assert.deepEqual(options, { merge: true });
    assert.deepEqual(calls(f.uploadMedia), [['missing-reports/user-a/report-a/photo.jpg', 'data:image/jpeg;base64,AQID']]);
    assert.equal(input.lastKnownLatitude, 1.25);
    assert.equal(input.contactMechanism.safeContactEmail, 'owner@example.invalid');
  });
}

test('sighting writes preserve recovery context while removing reporter identity and coordinates', async () => {
  const f = fixture();
  const input = sighting();
  assert.equal(await f.service.syncSighting(input), true);
  const [ref, data] = calls(f.firestore.setDoc)[0];
  assert.deepEqual(ref, { collection: 'sightings', id: 'sighting-a' });
  assert.deepEqual([data.latitude, data.longitude, data.reporterPhone, data.reporterEmail], [null, null, null, null]);
  assert.equal(data.reporterName, 'Community member');
  assert.equal(data.reporterUserId, 'owner-user-a');
  assert.equal(data.location, 'Synthetic Village');
  assert.equal(data.reportId, 'report-a');
  assert.deepEqual(calls(f.uploadMedia), [['sightings/user-a/report-a/sighting-a.jpg', 'data:image/jpeg;base64,AQID']]);
  assert.equal(input.reporterName, 'Synthetic Reporter');
  assert.equal(input.latitude, 1.25);
});

for (const [method, input, field, empty] of [
  ['syncLostReport', report, 'petPhoto', ''], ['syncSighting', sighting, 'photo', null],
]) {
  test(`${method} can publish sanitized recovery data after an image upload failure`, async () => {
    const f = fixture();
    f.uploadMedia.mock.mockImplementation(async () => { throw new Error('offline'); });
    assert.equal(await f.service[method](input()), true);
    assert.equal(calls(f.firestore.setDoc)[0][1][field], empty);
    assert.doesNotMatch(JSON.stringify(calls(f.firestore.setDoc)), /data:image|9000000000|@example.invalid|private-note/);
  });
  test(`${method} returns false and records a database failure`, async () => {
    const f = fixture();
    f.firestore.setDoc.mock.mockImplementation(async () => { throw new Error('database unavailable'); });
    assert.equal(await f.service[method](input()), false);
    assert.equal(f.service.getStatus().errorMessage, 'database unavailable');
  });
}

test('normal users fetch only their private documents and explicitly sanitized community queries', async () => {
  const f = fixture();
  assert.deepEqual(await f.service.fetchAllCloudData(), { profiles: [], pets: [], reports: [], sightings: [] });
  assert.deepEqual(calls(f.firestore.getDoc), ['profiles', 'pets', 'missing_reports'].map((collection) => [{ collection, id: 'user-a' }]));
  assert.deepEqual(calls(f.firestore.getDocs), [
    [{ collection: 'missing_reports', filters: [
      ['status', 'LOST'], ['contactMechanism.safeContactPhone', ''], ['contactMechanism.safeContactEmail', ''],
      ['contactMechanism.contactNote', ''], ['lastKnownLatitude', null], ['lastKnownLongitude', null],
    ].map(([field, value]) => ({ field, operator: '==', value })) }],
    [{ collection: 'sightings', filters: [
      'reporterPhone', 'reporterEmail', 'latitude', 'longitude',
    ].map((field) => ({ field, operator: '==', value: null })) }],
  ]);
});

test('private report overrides the same public report without duplicates and updates sync counts', async () => {
  const f = fixture();
  f.firestore.getDoc.mock.mockImplementation(async (ref) => snapshot(ref.id,
    ref.collection === 'missing_reports' ? { status: 'SAFE', reportId: 'own-report' } : { name: ref.collection }));
  f.firestore.getDocs.mock.mockImplementation(async (ref) => ({ docs: ref.collection === 'missing_reports'
    ? [snapshot('user-a', { status: 'LOST' }), snapshot('other', { status: 'LOST' })]
    : [snapshot('sighting-a', { reportId: 'other' })] }));
  const data = await f.service.fetchAllCloudData();
  assert.deepEqual(data.reports, [{ id: 'user-a', status: 'SAFE', reportId: 'own-report' }, { id: 'other', status: 'LOST' }]);
  const status = f.service.getStatus();
  assert.deepEqual([status.syncedMembersCount, status.syncedPetsCount, status.syncedReportsCount, status.syncedSightingsCount], [1, 1, 2, 1]);
  assert.ok(Number.isFinite(Date.parse(status.lastSyncTime)));
  assert.equal(status.errorMessage, null);
});

for (const options of [{ signedIn: false }, { configured: false }]) {
  test(`unavailable Firebase/auth cannot fetch or change safety status: ${JSON.stringify(options)}`, async () => {
    const f = fixture(options);
    assert.equal(await f.service.fetchAllCloudData(), null);
    assert.equal(await f.service.updatePetSafetyStatus('pet-a', true), false);
    assert.equal(f.firestore.getDoc.mock.callCount(), 0);
    assert.equal(f.firestore.getDocs.mock.callCount(), 0);
    assert.equal(f.firestore.setDoc.mock.callCount(), 0);
  });
}

test('fetch failure returns no partial dataset and a later success clears the error', async () => {
  const f = fixture();
  f.firestore.getDoc.mock.mockImplementation(async () => { throw new Error('permission-denied'); });
  assert.equal(await f.service.fetchAllCloudData(), null);
  assert.equal(f.service.getStatus().errorMessage, 'permission-denied');
  assert.equal(f.service.getStatus().lastSyncTime, null);
  f.firestore.getDoc.mock.mockImplementation(async (ref) => snapshot(ref.id));
  await f.service.fetchAllCloudData();
  assert.equal(f.service.getStatus().errorMessage, null);
});

for (const [isLost, expected] of [[true, 'LOST'], [false, 'SAFE']]) {
  test(`normal-user safety update writes ${expected} only to their own report`, async () => {
    const f = fixture();
    assert.equal(await f.service.updatePetSafetyStatus('foreign-pet', isLost), true);
    const [ref, data, options] = calls(f.firestore.setDoc)[0];
    assert.deepEqual(ref, { collection: 'missing_reports', id: 'user-a' });
    assert.equal(data.status, expected);
    assert.ok(Number.isFinite(Date.parse(data.updatedAt)));
    assert.deepEqual(options, { merge: true });
    assert.equal(f.firestore.getDocs.mock.callCount(), 0);
  });
}
