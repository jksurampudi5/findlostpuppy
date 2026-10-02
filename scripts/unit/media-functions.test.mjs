import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import crypto from 'node:crypto';
import { loadModule } from './test-support.mjs';

const uid = 'user-1';
const publicId = `findlostpuppy/private/pets/${uid}/photo`;
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
class HttpsError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
function setup() {
  const records = new Map();
  const deleted = [];
  const batches = [];
  const order = [];
  const ref = (path) => ({
    path, id: path.split('/').at(-1), parent: { id: path.split('/')[0] },
    get: async () => ({ exists: records.has(path), data: () => records.get(path) }),
    set: async (data) => { records.set(path, data); order.push('save'); },
    delete: async () => { deleted.push(path); records.delete(path); },
  });
  const collection = (name) => ({
    doc: (id) => ref(`${name}/${id}`),
    where: (field, operator, value) => {
      assert.equal(operator, '==');
      return { get: async () => ({ docs: [...records].filter(([path, data]) => path.startsWith(`${name}/`) && data[field] === value).map(([path, data]) => ({ ref: ref(path), data: () => data })) }) };
    },
    limit: (limit) => ({ get: async () => {
      const docs = [...records.keys()].filter((path) => path.startsWith(`${name}/`)).slice(0, limit).map((path) => ({ ref: ref(path) }));
      return { empty: !docs.length, docs };
    } }),
  });
  const commit = mock.fn(async (paths) => { batches.push(paths); for (const path of paths) { records.delete(path); deleted.push(path); } order.push('commit'); });
  const db = { collection, doc: ref, batch: () => {
    const paths = [];
    return { delete: (ref) => paths.push(ref.path), commit: () => commit(paths) };
  } };
  const deleteUser = mock.fn(async () => { order.push('delete-user'); });
  const firestore = Object.assign(() => db, { FieldValue: { serverTimestamp: () => 'server-time' } });
  const resource = mock.fn(async () => ({ format: 'jpg', bytes: 10, resource_type: 'image' }));
  const destroy = mock.fn(async () => { order.push('destroy'); return { result: 'ok' }; });
  const deleteAll = mock.fn(async () => ({}));
  const sign = mock.fn(() => 'synthetic-signature');
  const url = mock.fn(() => 'https://media.example.test/signed-photo');
  const functions = loadModule('functions/index.js', {
    dependencies: {
      'firebase-functions/v2/https': { onCall: (_, callback) => callback, HttpsError },
      'firebase-functions/params': { defineSecret: (name) => ({ value: () => `synthetic-${name}` }) },
      'firebase-admin': { initializeApp() {}, firestore, auth: () => ({ deleteUser }) },
      'node:crypto': crypto,
      cloudinary: { v2: { config() {}, utils: { api_sign_request: sign }, api: { resource, delete_all_resources: deleteAll }, uploader: { destroy }, url } },
    },
  });
  const call = (name, data = {}, auth = { uid, token: { email: 'owner@example.test' } }) => functions[name]({ data, auth });
  return { functions, call, records, deleted, batches, order, commit, deleteUser, resource, destroy, deleteAll, sign, url };
}

for (const name of ['createMediaUploadAuthorization', 'finalizeMediaUpload', 'deleteMediaAsset', 'deleteMyAccount', 'hardResetCloudinary']) {
  test(`${name} rejects unauthenticated callers before any provider mutation`, async () => {
    const h = setup();
    await assert.rejects(h.call(name, {}, null), { code: 'unauthenticated' });
    assert.equal(h.destroy.mock.callCount() + h.resource.mock.callCount() + h.deleteAll.mock.callCount() + h.sign.mock.callCount(), 0);
    assert.equal(h.records.size, 0);
  });
}

for (const [category, folder] of Object.entries({ profile: 'private/profiles', pet: 'private/pets', 'missing-report': 'public-alerts/missing-reports', sighting: 'public-alerts/sightings' })) {
  test(`callable authorizes authenticated ${category} uploads for the caller only`, async () => {
    const h = setup();
    const result = await h.call('createMediaUploadAuthorization', { category, referenceId: 'a/'.repeat(100), uid: 'foreign-user' });
    assert.equal(result.folder, `findlostpuppy/${folder}/${uid}`);
    assert.equal(result.type, 'authenticated');
    assert.equal(result.referenceId.length, 120);
    assert.match(result.referenceId, /^[a-zA-Z0-9_-]+$/);
    assert.equal(result.signature, 'synthetic-signature');
    assert.equal(h.sign.mock.calls[0].arguments[0].type, 'authenticated');
  });
}

test('callable authorization rejects missing references and unsupported categories', async () => {
  const h = setup();
  for (const data of [{}, { category: 'video', referenceId: 'pet-1' }, { category: 'pet', referenceId: '' }]) {
    await assert.rejects(h.call('createMediaUploadAuthorization', data), { code: 'invalid-argument' });
  }
  assert.equal(h.sign.mock.callCount(), 0);
});

const finalize = { publicId, category: 'pet', referenceId: 'pet-1', deliveryType: 'authenticated', bytes: 10, format: 'jpg' };
for (const [change, code] of [
  [{ category: 'video' }, 'invalid-argument'], [{ referenceId: '' }, 'invalid-argument'],
  [{ publicId: 'findlostpuppy/private/pets/user-10/photo' }, 'permission-denied'],
  [{ format: 'png' }, 'invalid-argument'], [{ bytes: 0 }, 'invalid-argument'],
  [{ bytes: 5 * 1024 * 1024 + 1 }, 'invalid-argument'], [{ deliveryType: 'upload' }, 'invalid-argument'],
]) {
  test(`finalization rejects invalid client metadata ${JSON.stringify(change)}`, async () => {
    const h = setup();
    await assert.rejects(h.call('finalizeMediaUpload', { ...finalize, ...change }), { code });
    assert.equal(h.resource.mock.callCount(), 0);
    assert.equal(h.records.size, 0);
  });
}

for (const asset of [{ format: 'png', bytes: 10, resource_type: 'image' }, { format: 'jpg', bytes: 0, resource_type: 'image' }, { format: 'jpg', bytes: 5 * 1024 * 1024 + 1, resource_type: 'image' }, { format: 'jpg', bytes: 10, resource_type: 'video' }]) {
  test(`finalization validates provider metadata and deletes invalid assets: ${JSON.stringify(asset)}`, async () => {
    const h = setup();
    h.resource.mock.mockImplementation(async () => asset);
    await assert.rejects(h.call('finalizeMediaUpload', finalize), { code: 'invalid-argument' });
    assert.deepEqual(h.destroy.mock.calls[0].arguments, [publicId, { type: 'authenticated', invalidate: true }]);
    assert.equal(h.records.size, 0);
  });
}

test('provider lookup failure cannot persist or sign unverified media', async () => {
  const h = setup();
  h.resource.mock.mockImplementation(async () => { throw new Error('missing'); });
  await assert.rejects(h.call('finalizeMediaUpload', finalize), { code: 'not-found' });
  assert.equal(h.records.size, 0);
  assert.equal(h.url.mock.callCount(), 0);
});

test('valid boundary-sized JPEG creates an ownership record and a signed authenticated URL', async () => {
  const h = setup();
  h.resource.mock.mockImplementation(async () => ({ format: 'JPEG', bytes: 5 * 1024 * 1024, resource_type: 'image' }));
  assert.deepEqual(await h.call('finalizeMediaUpload', { ...finalize, bytes: 5 * 1024 * 1024 }), { publicId, secureUrl: 'https://media.example.test/signed-photo' });
  assert.deepEqual(h.records.get(`media_assets/${hash(publicId)}`), { publicId, ownerId: uid, category: 'pet', referenceId: 'pet-1', deliveryType: 'authenticated', createdAt: 'server-time' });
  assert.equal(h.url.mock.calls[0].arguments[1].sign_url, true);
  assert.equal(h.url.mock.calls[0].arguments[1].type, 'authenticated');
});

for (const ownerId of [uid, 'other-user']) {
  test(`replacement cleanup respects stored asset ownership: ${ownerId}`, async () => {
    const h = setup();
    const previousPublicId = `${publicId}-old`;
    const path = `media_assets/${hash(previousPublicId)}`;
    h.records.set(path, { ownerId, deliveryType: 'authenticated' });
    await h.call('finalizeMediaUpload', { ...finalize, previousPublicId });
    assert.equal(h.destroy.mock.callCount(), ownerId === uid ? 1 : 0);
    assert.equal(h.records.has(path), ownerId !== uid);
  });
}

test('asset deletion enforces ownership and retains the record if provider deletion fails', async () => {
  const h = setup();
  const path = `media_assets/${hash(publicId)}`;
  await assert.rejects(h.call('deleteMediaAsset', { publicId }), { code: 'not-found' });
  h.records.set(path, { ownerId: 'other-user' });
  await assert.rejects(h.call('deleteMediaAsset', { publicId }), { code: 'permission-denied' });
  assert.equal(h.destroy.mock.callCount(), 0);
  h.records.set(path, { ownerId: uid, deliveryType: 'authenticated' });
  h.destroy.mock.mockImplementation(async () => ({ result: 'error' }));
  await assert.rejects(h.call('deleteMediaAsset', { publicId }), { code: 'internal' });
  assert.equal(h.records.has(path), true);
  h.destroy.mock.mockImplementation(async () => ({ result: 'not found' }));
  assert.deepEqual(await h.call('deleteMediaAsset', { publicId }), { deleted: true });
  assert.equal(h.records.has(path), false);
});

test('account deletion requires confirmation and stops before deleting data or identity when images fail', async () => {
  const h = setup();
  await assert.rejects(h.call('deleteMyAccount', { confirmation: 'delete' }), { code: 'failed-precondition' });
  h.records.set('media_assets/photo', { ownerId: uid, publicId });
  h.destroy.mock.mockImplementation(async () => ({ result: 'error' }));
  await assert.rejects(h.call('deleteMyAccount', { confirmation: 'DELETE' }), { code: 'internal' });
  assert.equal(h.records.size, 1);
  assert.equal(h.commit.mock.callCount(), 0);
  assert.equal(h.deleteUser.mock.callCount(), 0);
});

test('account deletion deduplicates related data, batches below Firestore limits, and deletes identity last', async () => {
  const h = setup();
  h.records.set('media_assets/photo', { ownerId: uid, publicId, deliveryType: 'authenticated' });
  h.records.set('missing_reports/report-1', { ownerId: `owner-${uid}` });
  h.records.set('sightings/own', { reporterUserId: uid, reporterEmail: 'owner@example.test', reportId: 'report-1' });
  h.records.set('sightings/related', { reporterUserId: 'other-user', reportId: 'report-1' });
  h.records.set('sightings/unrelated', { reporterUserId: 'other-user', reportId: 'report-2' });
  for (let i = 0; i < 401; i++) h.records.set(`pets/pet-${i}`, { ownerId: uid });
  assert.deepEqual(await h.call('deleteMyAccount', { confirmation: 'DELETE' }), { deleted: true });
  assert.deepEqual(h.batches.map((batch) => batch.length), [400, 7]);
  assert.equal(new Set(h.deleted).size, h.deleted.length);
  assert.deepEqual([...h.records.keys()], ['sightings/unrelated']);
  assert.deepEqual(h.order, ['destroy', 'commit', 'commit', 'delete-user']);
  assert.deepEqual(h.deleteUser.mock.calls[0].arguments, [uid]);
});

test('failed database cleanup preserves the authentication account for retry', async () => {
  const h = setup();
  h.commit.mock.mockImplementation(async () => { throw new Error('database unavailable'); });
  await assert.rejects(h.call('deleteMyAccount', { confirmation: 'DELETE' }), /database unavailable/);
  assert.equal(h.deleteUser.mock.callCount(), 0);
});

test('administrator reset requires exact confirmation and drains provider pages and database batches', async () => {
  const h = setup();
  const data = { confirmation: 'DELETE ALL FINDLOSTPUPPY MEDIA' };
  await assert.rejects(h.call('hardResetCloudinary', data), { code: 'permission-denied' });
  const admin = { uid, token: { admin: true } };
  await assert.rejects(h.call('hardResetCloudinary', { confirmation: 'DELETE' }, admin), { code: 'failed-precondition' });
  assert.equal(h.deleteAll.mock.callCount(), 0);
  for (let i = 0; i < 401; i++) h.records.set(`media_assets/${i}`, {});
  h.deleteAll.mock.mockImplementation(async ({ next_cursor }) => next_cursor ? {} : { next_cursor: 'page-2' });
  assert.deepEqual(await h.call('hardResetCloudinary', data, admin), { deleted: true });
  assert.deepEqual(h.deleteAll.mock.calls.map((call) => [call.arguments[0].type, call.arguments[0].next_cursor]), ['upload', 'authenticated', 'private'].flatMap((type) => [[type, undefined], [type, 'page-2']]));
  assert.deepEqual(h.batches.map((batch) => batch.length), [400, 1]);
  assert.equal(h.records.size, 0);
});
