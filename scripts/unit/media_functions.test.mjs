import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test, mock } from 'node:test';
import { loadModule, calls, deferred } from './test_harness.mjs';

const ownId = 'findlostpuppy/private/pets/user-a/new';
const oldId = 'findlostpuppy/private/pets/user-a/old';
const assetPath = (id) => `media_assets/${createHash('sha256').update(id).digest('hex')}`;

function fixture(initial = {}) {
  const records = new Map(Object.entries(initial));
  const events = [];
  const doc = (path) => ({
    path, id: path.split('/')[1], parent: { id: path.split('/')[0] },
    get: async () => ({ exists: records.has(path), data: () => records.get(path) }),
    set: async (data) => { events.push(['set', path]); records.set(path, data); },
    delete: async () => { events.push(['delete', path]); records.delete(path); },
  });
  const snapshot = (collection, field, value, limit = Infinity) => {
    const docs = [...records].filter(([path, data]) => path.startsWith(`${collection}/`) && (!field || data[field] === value))
      .slice(0, limit).map(([path, data]) => ({ ref: doc(path), data: () => data }));
    return { docs, empty: docs.length === 0 };
  };
  const db = {
    doc,
    collection: (name) => ({
      doc: (id) => doc(`${name}/${id}`),
      where: (field, operator, value) => {
        assert.equal(operator, '==');
        return { get: async () => snapshot(name, field, value) };
      },
      limit: (size) => ({ get: async () => snapshot(name, undefined, undefined, size) }),
    }),
    batch: mock.fn(() => {
      const refs = [];
      return {
        delete: (ref) => refs.push(ref),
        commit: async () => {
          events.push(['batch', refs.map((ref) => ref.path)]);
          refs.forEach((ref) => records.delete(ref.path));
        },
      };
    }),
  };
  const firestore = () => db;
  firestore.FieldValue = { serverTimestamp: () => 'synthetic-server-time' };
  const deleteUser = mock.fn(async (uid) => { events.push(['deleteUser', uid]); });
  const cloudinary = {
    config: mock.fn(),
    utils: { api_sign_request: mock.fn(() => 'synthetic-signature') },
    api: {
      resource: mock.fn(async () => ({ format: 'jpeg', bytes: 100, resource_type: 'image' })),
      delete_all_resources: mock.fn(async () => ({})),
    },
    uploader: { destroy: mock.fn(async (id) => { events.push(['destroy', id]); return { result: 'ok' }; }) },
    url: mock.fn(() => 'https://media.example.invalid/signed-photo'),
  };
  class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code; }
  }
  const functions = loadModule('functions/index.js', { mocks: {
    'firebase-functions/v2/https': { onCall: (_options, handler) => handler, HttpsError },
    'firebase-functions/params': { defineSecret: (name) => ({ value: () => `synthetic-${name}` }) },
    'firebase-admin': { initializeApp() {}, firestore, auth: () => ({ deleteUser }) },
    cloudinary: { v2: cloudinary },
  } });
  const invoke = (name, data = {}, auth = { uid: 'user-a', token: {} }) => functions[name]({ auth, data });
  return { invoke, cloudinary, records, events, db, deleteUser };
}
const upload = (extra = {}) => ({ publicId: ownId, category: 'pet', referenceId: 'pet-a', deliveryType: 'authenticated', bytes: 100, format: 'jpg', ...extra });

for (const name of ['createMediaUploadAuthorization', 'finalizeMediaUpload', 'deleteMediaAsset', 'deleteMyAccount', 'hardResetCloudinary']) {
  test(`${name} rejects unauthenticated requests before side effects`, async () => {
    const f = fixture();
    await assert.rejects(f.invoke(name, {}, null), { code: 'unauthenticated' });
    assert.deepEqual(f.events, []);
    assert.equal(f.cloudinary.config.mock.callCount(), 0);
  });
}

for (const [category, folder] of [['profile', 'private/profiles'], ['pet', 'private/pets'], ['missing-report', 'public-alerts/missing-reports'], ['sighting', 'public-alerts/sightings']]) {
  test(`function authorization signs ${category} for the authenticated owner`, async () => {
    const f = fixture();
    const result = await f.invoke('createMediaUploadAuthorization', { category, referenceId: 'bad/ref with spaces', uid: 'foreign' });
    assert.equal(result.folder, `findlostpuppy/${folder}/user-a`);
    assert.equal(result.type, 'authenticated');
    assert.equal(result.referenceId, 'bad_ref_with_spaces');
    assert.match(result.public_id, /^media_\d+_[a-f0-9]{16}$/);
    assert.deepEqual(calls(f.cloudinary.utils.api_sign_request)[0][0], {
      timestamp: result.timestamp, folder: result.folder, public_id: result.public_id, type: 'authenticated',
    });
  });
}

for (const data of [{}, { category: 'video', referenceId: 'id' }, { category: 'pet', referenceId: '' }]) {
  test(`function rejects invalid authorization ${JSON.stringify(data)}`, async () => {
    await assert.rejects(fixture().invoke('createMediaUploadAuthorization', data), { code: 'invalid-argument' });
  });
}

test('authorization bounds reference identifiers to 120 characters', async () => {
  const result = await fixture().invoke('createMediaUploadAuthorization', { category: 'pet', referenceId: 'x'.repeat(121) });
  assert.equal(result.referenceId, 'x'.repeat(120));
});

for (const extra of [{ bytes: 0 }, { bytes: -1 }, { bytes: 5 * 1024 * 1024 + 1 }, { format: 'png' }, { deliveryType: 'upload' }, { category: 'video' }, { referenceId: '' }]) {
  test(`finalize rejects invalid upload claims ${JSON.stringify(extra)}`, async () => {
    const f = fixture();
    await assert.rejects(f.invoke('finalizeMediaUpload', upload(extra)), { code: 'invalid-argument' });
    assert.equal(f.cloudinary.api.resource.mock.callCount(), 0);
    assert.equal(f.records.size, 0);
  });
}

test('finalize rejects a user-id prefix collision', async () => {
  const f = fixture();
  await assert.rejects(f.invoke('finalizeMediaUpload', upload({ publicId: ownId.replace('user-a/', 'user-ab/') })), { code: 'permission-denied' });
  assert.equal(f.cloudinary.api.resource.mock.callCount(), 0);
});

test('finalize verifies the asset, records ownership, and returns signed authenticated delivery', async () => {
  const f = fixture();
  f.cloudinary.api.resource.mock.mockImplementation(async () => ({ format: 'JPEG', bytes: 5 * 1024 * 1024, resource_type: 'image' }));
  assert.deepEqual(await f.invoke('finalizeMediaUpload', upload({ bytes: 5 * 1024 * 1024 })), {
    secureUrl: 'https://media.example.invalid/signed-photo', publicId: ownId,
  });
  assert.deepEqual(calls(f.cloudinary.api.resource), [[ownId, { resource_type: 'image', type: 'authenticated' }]]);
  assert.deepEqual(f.records.get(assetPath(ownId)), {
    publicId: ownId, ownerId: 'user-a', category: 'pet', referenceId: 'pet-a', deliveryType: 'authenticated', createdAt: 'synthetic-server-time',
  });
  assert.deepEqual(calls(f.cloudinary.url), [[ownId, { secure: true, type: 'authenticated', sign_url: true, transformation: [{ fetch_format: 'auto', quality: 'auto' }] }]]);
});

for (const asset of [{ format: 'png', bytes: 100, resource_type: 'image' }, { format: 'jpg', bytes: 0, resource_type: 'image' }, { format: 'jpg', bytes: 5 * 1024 * 1024 + 1, resource_type: 'image' }, { format: 'jpg', bytes: 100, resource_type: 'video' }]) {
  test(`finalize destroys server-rejected media ${JSON.stringify(asset)}`, async () => {
    const f = fixture();
    f.cloudinary.api.resource.mock.mockImplementation(async () => asset);
    await assert.rejects(f.invoke('finalizeMediaUpload', upload()), { code: 'invalid-argument' });
    assert.deepEqual(calls(f.cloudinary.uploader.destroy), [[ownId, { type: 'authenticated', invalidate: true }]]);
    assert.equal(f.records.size, 0);
  });
}

test('provider verification failure leaves old media intact', async () => {
  const f = fixture();
  f.cloudinary.api.resource.mock.mockImplementation(async () => { throw new Error('offline'); });
  await assert.rejects(f.invoke('finalizeMediaUpload', upload({ previousPublicId: oldId })), { code: 'not-found' });
  assert.equal(f.cloudinary.uploader.destroy.mock.callCount(), 0);
  assert.equal(f.records.size, 0);
});

for (const [ownerId, expectedDeletes] of [['user-a', 1], ['other-user', 0]]) {
  test(`replacement respects stored ownership (${ownerId})`, async () => {
    const f = fixture({ [assetPath(oldId)]: { ownerId, deliveryType: 'authenticated' } });
    await f.invoke('finalizeMediaUpload', upload({ previousPublicId: oldId }));
    assert.equal(f.cloudinary.uploader.destroy.mock.callCount(), expectedDeletes);
    assert.equal(f.records.has(assetPath(oldId)), expectedDeletes === 0);
    assert.equal(f.events[0][0], 'set');
  });
}

for (const [result, succeeds] of [['ok', true], ['not found', true], ['error', false]]) {
  test(`asset deletion ${result} removes metadata only after provider confirmation`, async () => {
    const f = fixture({ [assetPath(ownId)]: { ownerId: 'user-a', deliveryType: 'authenticated' } });
    f.cloudinary.uploader.destroy.mock.mockImplementation(async () => ({ result }));
    if (succeeds) assert.deepEqual(await f.invoke('deleteMediaAsset', { publicId: ownId }), { deleted: true });
    else await assert.rejects(f.invoke('deleteMediaAsset', { publicId: ownId }), { code: 'internal' });
    assert.equal(f.records.has(assetPath(ownId)), !succeeds);
  });
}

test('asset deletion rejects missing and foreign records, but permits admin claims', async () => {
  const f = fixture({ [assetPath(ownId)]: { ownerId: 'other-user' } });
  await assert.rejects(f.invoke('deleteMediaAsset', {}), { code: 'invalid-argument' });
  await assert.rejects(f.invoke('deleteMediaAsset', { publicId: oldId }), { code: 'not-found' });
  await assert.rejects(f.invoke('deleteMediaAsset', { publicId: ownId }), { code: 'permission-denied' });
  assert.equal(f.cloudinary.uploader.destroy.mock.callCount(), 0);
  await f.invoke('deleteMediaAsset', { publicId: ownId }, { uid: 'admin', token: { admin: true } });
  assert.deepEqual(calls(f.cloudinary.uploader.destroy), [[ownId, { type: 'upload', invalidate: true }]]);
});

test('account deletion requires exact confirmation before any cleanup', async () => {
  const f = fixture();
  await assert.rejects(f.invoke('deleteMyAccount', { confirmation: 'delete' }), { code: 'failed-precondition' });
  assert.deepEqual(f.events, []);
});

test('failed media cleanup preserves account and all documents', async () => {
  const initial = { [assetPath(ownId)]: { ownerId: 'user-a', publicId: ownId }, 'profiles/user-a': {} };
  const f = fixture(initial);
  f.cloudinary.uploader.destroy.mock.mockImplementation(async () => ({ result: 'error' }));
  await assert.rejects(f.invoke('deleteMyAccount', { confirmation: 'DELETE' }), { code: 'internal' });
  assert.deepEqual(Object.fromEntries(f.records), initial);
  assert.equal(f.deleteUser.mock.callCount(), 0);
  assert.equal(f.db.batch.mock.callCount(), 0);
});

test('account deletion waits for images, deduplicates related records, chunks at 400, and deletes auth last', async () => {
  const initial = {
    [assetPath(ownId)]: { ownerId: 'user-a', publicId: ownId },
    'profiles/user-a': { email: 'owner@example.invalid' }, 'profiles/owner-user-a': {},
    'missing_reports/report-a': { ownerId: 'owner-user-a' },
    'sightings/related': { reportId: 'report-a', reporterUserId: 'user-a', reporterEmail: 'owner@example.invalid' },
    'sightings/email-only': { reporterEmail: 'owner@example.invalid' },
    'app_suggestions/own': { userId: 'user-a' },
    'profiles/other': { email: 'other@example.invalid' }, 'pets/other': { ownerId: 'other' },
  };
  for (let i = 0; i < 801; i++) initial[`pets/pet-${i}`] = { ownerId: i % 2 ? 'user-a' : 'owner-user-a' };
  const f = fixture(initial);
  const gate = deferred();
  f.cloudinary.uploader.destroy.mock.mockImplementation(() => gate.promise);
  const operation = f.invoke('deleteMyAccount', { confirmation: 'DELETE' }, { uid: 'user-a', token: { email: 'OWNER@EXAMPLE.INVALID' } });
  await Promise.resolve();
  assert.equal(f.db.batch.mock.callCount(), 0);
  assert.equal(f.deleteUser.mock.callCount(), 0);
  gate.resolve({ result: 'ok' });
  assert.deepEqual(await operation, { deleted: true });
  const batches = f.events.filter(([type]) => type === 'batch').map(([, paths]) => paths);
  assert.deepEqual(batches.map((paths) => paths.length), [400, 400, 8]);
  assert.equal(new Set(batches.flat()).size, 808);
  assert.deepEqual([...f.records.keys()].sort(), ['pets/other', 'profiles/other']);
  assert.deepEqual(f.events.at(-1), ['deleteUser', 'user-a']);
});

test('Firestore failure prevents auth deletion after image cleanup', async () => {
  const f = fixture();
  f.db.batch.mock.mockImplementation(() => ({ delete() {}, commit: async () => { throw new Error('database unavailable'); } }));
  await assert.rejects(f.invoke('deleteMyAccount', { confirmation: 'DELETE' }), /database unavailable/);
  assert.equal(f.deleteUser.mock.callCount(), 0);
});

test('hard reset requires admin and exact confirmation', async () => {
  const f = fixture();
  await assert.rejects(f.invoke('hardResetCloudinary', { confirmation: 'DELETE ALL FINDLOSTPUPPY MEDIA' }), { code: 'permission-denied' });
  await assert.rejects(f.invoke('hardResetCloudinary', { confirmation: 'DELETE' }, { uid: 'admin', token: { admin: true } }), { code: 'failed-precondition' });
  assert.equal(f.cloudinary.api.delete_all_resources.mock.callCount(), 0);
});

test('hard reset paginates media and drains asset metadata in bounded batches', async () => {
  const initial = Object.fromEntries(Array.from({ length: 401 }, (_, i) => [`media_assets/${i}`, {}]));
  const f = fixture({ ...initial, 'profiles/keep': {} });
  f.cloudinary.api.delete_all_resources.mock.mockImplementation(async (options) => options.next_cursor ? {} : { next_cursor: `${options.type}-next` });
  await f.invoke('hardResetCloudinary', { confirmation: 'DELETE ALL FINDLOSTPUPPY MEDIA' }, { uid: 'admin', token: { admin: true } });
  assert.deepEqual(calls(f.cloudinary.api.delete_all_resources).map(([options]) => [options.type, options.next_cursor]),
    ['upload', 'authenticated', 'private'].flatMap((type) => [[type, undefined], [type, `${type}-next`]]));
  assert.deepEqual(f.events.filter(([type]) => type === 'batch').map(([, paths]) => paths.length), [400, 1]);
  assert.deepEqual([...f.records.keys()], ['profiles/keep']);
});

test('replacement keeps the old asset record when Cloudinary rejects its deletion', async () => {
  const f = fixture({ [assetPath(oldId)]: { ownerId: 'user-a', deliveryType: 'authenticated' } });
  f.cloudinary.uploader.destroy.mock.mockImplementation(async () => ({ result: 'error' }));
  await assert.rejects(f.invoke('finalizeMediaUpload', upload({ previousPublicId: oldId })));
  assert.equal(f.records.has(assetPath(oldId)), true);
});
