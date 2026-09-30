import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { loadModule, memoryStorage, calls } from './test_harness.mjs';

const image = 'data:image/png;base64,AQID';
const oldUrl = 'https://res.cloudinary.com/unit/image/authenticated/s--abcd1234--/f_auto,q_auto/v123/folder/old.jpg';
const newUrl = 'https://media.example.invalid/new';
function fixture({ secure = true, signedIn = true, storage = memoryStorage(), online = true, width = 3200, height = 1600 } = {}) {
  const auth = { currentUser: signedIn ? { uid: 'user-a', getIdToken: mock.fn(async () => 'synthetic-token') } : null };
  const firebase = { storage: {}, auth, isFirebaseConfigured: () => true };
  const bitmap = { width, height, close: mock.fn() };
  const context = { drawImage: mock.fn() };
  const canvas = { getContext: () => context, toBlob: (callback) => callback(new Blob(['sanitized'], { type: 'image/jpeg' })) };
  const createImageBitmap = mock.fn(async () => bitmap);
  const fetch = mock.fn(async (url) => {
    if (url.endsWith('/media/authorize')) return Response.json({ apiKey: 'unit-key', cloudName: 'unit', timestamp: 123, folder: 'folder', public_id: 'new', type: 'authenticated', signature: 'synthetic-signature' });
    if (url.endsWith('/image/upload')) return Response.json({ public_id: 'folder/new', format: 'jpg', bytes: 9 });
    if (url.endsWith('/media/finalize')) return Response.json({ secureUrl: newUrl });
    return Response.json({ deleted: true });
  });
  const uploadBytes = mock.fn(async (ref) => ({ ref }));
  const deleteObject = mock.fn(async () => {});
  const window = new EventTarget();
  const dispatch = mock.fn(window.dispatchEvent.bind(window));
  window.dispatchEvent = dispatch;
  const module = loadModule('src/services/storageBucketService.ts', {
    mocks: {
      './firebaseConfig': firebase,
      'firebase/storage': {
        ref: (_storage, path) => ({ fullPath: path }), uploadBytes, deleteObject,
        getDownloadURL: async () => newUrl,
      },
    },
    globals: { localStorage: storage, navigator: { onLine: online }, window, fetch, createImageBitmap, document: { createElement: () => canvas } },
    env: { VITE_CLOUDINARY_SECURE_FUNCTIONS: String(secure), VITE_MEDIA_WORKER_URL: 'https://worker.example.invalid/' },
  });
  return { ...module, service: module.storageBucketService, auth, firebase, storage, fetch, canvas, context, bitmap, createImageBitmap, uploadBytes, deleteObject, dispatch };
}

for (const [url, expected] of [
  [oldUrl, 'folder/old'],
  ['https://res.cloudinary.com/unit/image/upload/c_fill/w_200/v123/folder/photo.png?x=1#hash', 'folder/photo'],
  ['https://res.cloudinary.com/unit/image/authenticated/s--A_b-12--/f_auto,q_auto/folder/photo', 'folder/photo'],
  ['https://res.cloudinary.com/unit/image/upload/v123/folder/name.with.dots.jpg', 'folder/name.with.dots'],
  ['https://res.cloudinary.com/unit/image/private/folder/photo.jpg', null],
  ['https://example.invalid/photo.jpg', null], ['', null], [null, null],
]) {
  test(`extracts media identifiers from signed and legacy URLs: ${url}`, () => {
    assert.equal(fixture().extractCloudinaryPublicId(url), expected);
  });
}

for (const [method, args, category, referenceId] of [
  ['uploadProfileAvatar', ['owner-owner-user-a', image, oldUrl], 'profile', 'user-a'],
  ['uploadPetPhoto', ['owner-user-a', ' pet-a ', image, 2, oldUrl], 'pet', 'pet-a'],
  ['uploadMissingReportPhoto', ['report-a', image, oldUrl], 'missing-report', 'report-a'],
  ['uploadSightingPhoto', ['sighting-a', image, oldUrl], 'sighting', 'sighting-a'],
]) {
  test(`${method} sanitizes the image and completes signed authorization, upload, and finalization`, async () => {
    const f = fixture();
    assert.equal(await f.service[method](...args), newUrl);
    const requests = calls(f.fetch);
    assert.equal(requests.length, 3);
    assert.equal(requests[0][0], 'https://worker.example.invalid/media/authorize');
    assert.equal(requests[0][1].headers.Authorization, 'Bearer synthetic-token');
    assert.deepEqual(JSON.parse(requests[0][1].body), { category, referenceId });
    const form = requests[1][1].body;
    assert.equal(form.get('file').type, 'image/jpeg');
    assert.equal(await form.get('file').text(), 'sanitized');
    assert.equal(form.get('type'), 'authenticated');
    assert.equal(form.get('api_key'), 'unit-key');
    assert.equal(form.has('upload_preset'), false);
    assert.equal(f.canvas.width, 1600);
    assert.equal(f.canvas.height, 800);
    assert.deepEqual(calls(f.context.drawImage), [[f.bitmap, 0, 0, 1600, 800]]);
    assert.equal(f.bitmap.close.mock.callCount(), 1);
    assert.deepEqual(JSON.parse(requests[2][1].body), {
      publicId: 'folder/new', category, referenceId, deliveryType: 'authenticated', bytes: 9, format: 'jpg', previousPublicId: 'folder/old',
    });
  });
}

for (const [width, height] of [[800, 600], [1, 3200]]) {
  test(`sanitization preserves small images and bounds narrow images (${width}x${height})`, async () => {
    const f = fixture({ width, height });
    await f.service.uploadProfileAvatar('user-a', image);
    assert.equal(f.canvas.width, width === 800 ? 800 : 1);
    assert.equal(f.canvas.height, width === 800 ? 600 : 1600);
  });
}

for (const stage of ['/media/authorize', '/image/upload', '/media/finalize']) {
  test(`HTTP failure at ${stage} never returns an unfinished upload URL`, async () => {
    const f = fixture();
    const handler = (url) => {
      if (url.endsWith(stage)) return Promise.resolve(new Response('', { status: 503 }));
      if (url.endsWith('/media/authorize')) return Promise.resolve(Response.json({ cloudName: 'unit', type: 'authenticated' }));
      return Promise.resolve(Response.json({ public_id: 'folder/new', secure_url: 'https://unfinished.example.invalid/photo' }));
    };
    f.fetch.mock.mockImplementation(handler);
    assert.equal(await f.service.uploadProfileAvatar('user-a', image), null);
    assert.equal(f.fetch.mock.callCount(), ['/media/authorize', '/image/upload', '/media/finalize'].indexOf(stage) + 1);
  });
}

test('invalid, oversized, undecodable, and signed-out uploads never reach a provider', async () => {
  for (const input of ['not-base64!', new Blob([new Uint8Array(5 * 1024 * 1024 + 1)])]) {
    const f = fixture();
    assert.equal(await f.service.uploadProfileAvatar('user-a', input), null);
    assert.equal(f.fetch.mock.callCount(), 0);
  }
  const f = fixture();
  f.createImageBitmap.mock.mockImplementation(async () => { throw new Error('decode failed'); });
  assert.equal(await f.service.uploadProfileAvatar('user-a', image), null);
  assert.equal(f.fetch.mock.callCount(), 0);
  const signedOut = fixture({ signedIn: false });
  assert.equal(await signedOut.service.uploadProfileAvatar('user-a', image), null);
  assert.equal(signedOut.fetch.mock.callCount(), 0);
});

test('Firebase fallback still uses owner-scoped paths when signed uploads are disabled', async () => {
  const f = fixture({ secure: false });
  assert.equal(await f.service.uploadPetPhoto('owner-user-a', 'pet-a', image, 2), newUrl);
  assert.equal(calls(f.uploadBytes)[0][0].fullPath, 'pets/user-a/pet-a/photo_2.jpg');
  assert.equal(f.fetch.mock.callCount(), 0);
});

test('queue is bounded and preserves all existing entries when full', () => {
  const f = fixture();
  for (let i = 0; i < f.MAX_MEDIA_QUEUE_SIZE; i++) {
    assert.equal(f.service.enqueueItem({ category: 'profile', referenceId: `user-${i}`, base64Data: image }), true);
  }
  const before = f.storage.getItem(f.MEDIA_QUEUE_KEY);
  assert.equal(f.service.enqueueItem({ category: 'profile', referenceId: 'overflow', base64Data: image }), false);
  assert.equal(f.storage.getItem(f.MEDIA_QUEUE_KEY), before);
  const queue = f.service.getQueue();
  assert.equal(new Set(queue.map((item) => item.id)).size, f.MAX_MEDIA_QUEUE_SIZE);
  for (const item of queue) {
    assert.equal(item.retryCount, 0);
    assert.ok(Number.isFinite(Date.parse(item.createdAt)));
  }
});

test('corrupt or unavailable storage cannot crash enqueueing', () => {
  const f = fixture();
  f.storage.setItem(f.MEDIA_QUEUE_KEY, '{');
  assert.deepEqual(f.service.getQueue(), []);
  f.storage.setItem.mock.mockImplementation(() => { throw new Error('quota'); });
  assert.equal(f.service.enqueueItem({ category: 'profile', referenceId: 'id', base64Data: image }), false);
});

test('offline flush preserves queue contents and retry counts without uploading', async () => {
  const f = fixture({ online: false });
  f.service.enqueueItem({ category: 'profile', referenceId: 'id', base64Data: image });
  const before = f.storage.getItem(f.MEDIA_QUEUE_KEY);
  assert.deepEqual(await f.service.flushQueue(), { uploaded: 0, pending: 1 });
  assert.equal(f.storage.getItem(f.MEDIA_QUEUE_KEY), before);
  assert.equal(f.fetch.mock.callCount(), 0);
});

test('flush routes all categories, removes successful entries, and emits their resulting URLs', async () => {
  const f = fixture();
  for (const category of ['profile', 'pet', 'missing-report', 'sighting']) {
    f.service.enqueueItem({ category, referenceId: category, ownerId: 'user-a', index: 2, base64Data: image, previousUrl: oldUrl });
  }
  for (const method of ['uploadProfileAvatar', 'uploadPetPhoto', 'uploadMissingReportPhoto', 'uploadSightingPhoto']) {
    f.service[method] = mock.fn(async () => newUrl);
  }
  const items = f.service.getQueue();
  assert.deepEqual(await f.service.flushQueue(), { uploaded: 4, pending: 0 });
  assert.deepEqual(f.service.getQueue(), []);
  assert.deepEqual(calls(f.service.uploadProfileAvatar), [['profile', image, oldUrl]]);
  assert.deepEqual(calls(f.service.uploadPetPhoto)[0].slice(0, 4), ['user-a', 'pet', image, 2]);
  assert.deepEqual(calls(f.service.uploadMissingReportPhoto)[0].slice(0, 2), ['missing-report', image]);
  assert.deepEqual(calls(f.service.uploadSightingPhoto)[0].slice(0, 2), ['sighting', image]);
  assert.deepEqual(calls(f.dispatch).map(([event]) => ({ type: event.type, detail: event.detail })),
    items.map((item) => ({ type: 'findlostpuppy_media_uploaded', detail: { ...item, publicUrl: newUrl } })));
});

test('failed uploads and pet entries lacking an owner remain retryable while later items succeed', async () => {
  const f = fixture();
  for (const category of ['profile', 'pet', 'missing-report', 'sighting']) {
    f.service.enqueueItem({ category, referenceId: category, base64Data: image });
  }
  f.service.uploadProfileAvatar = mock.fn(async () => { throw new Error('offline'); });
  f.service.uploadPetPhoto = mock.fn();
  f.service.uploadMissingReportPhoto = mock.fn(async () => null);
  f.service.uploadSightingPhoto = mock.fn(async () => newUrl);
  assert.deepEqual(await f.service.flushQueue(), { uploaded: 1, pending: 3 });
  assert.equal(f.service.uploadPetPhoto.mock.callCount(), 0);
  assert.deepEqual(f.service.getQueue().map(({ category, retryCount }) => ({ category, retryCount })),
    ['profile', 'pet', 'missing-report'].map((category) => ({ category, retryCount: 1 })));
  f.service.uploadProfileAvatar = mock.fn(async () => newUrl);
  assert.deepEqual(await f.service.flushQueue(), { uploaded: 1, pending: 2 });
  assert.deepEqual(f.service.getQueue().map((item) => item.retryCount), [2, 2]);
});

test('queue removal only removes the selected entry; clearing preserves unrelated storage', () => {
  const f = fixture();
  f.storage.setItem('unrelated', 'keep');
  for (const referenceId of ['first', 'second']) f.service.enqueueItem({ category: 'profile', referenceId, base64Data: image });
  const [first, second] = f.service.getQueue();
  f.service.removeFromQueue(first.id);
  assert.deepEqual(f.service.getQueue(), [second]);
  f.service.clearQueue();
  assert.deepEqual(f.service.getQueue(), []);
  assert.equal(f.storage.getItem('unrelated'), 'keep');
});

for (const [method, args, path, data] of [
  ['deleteMedia', [oldUrl], '/media/delete', { publicId: 'folder/old' }],
  ['hardResetCloudinary', [], '/media/reset', { confirmation: 'DELETE ALL FINDLOSTPUPPY MEDIA' }],
  ['deleteMyAccountData', [], '/account/media-cleanup', { confirmation: 'DELETE' }],
]) {
  test(`${method} uses authenticated worker confirmation and fails closed`, async () => {
    const f = fixture();
    assert.equal(await f.service[method](...args), true);
    assert.equal(calls(f.fetch)[0][0], `https://worker.example.invalid${path}`);
    assert.deepEqual(JSON.parse(calls(f.fetch)[0][1].body), data);
    assert.equal(calls(f.fetch)[0][1].headers.Authorization, 'Bearer synthetic-token');
    for (const response of [{ deleted: false }, {}, { deleted: 'true' }]) {
      f.fetch.mock.mockImplementation(async () => Response.json(response));
      assert.equal(await f.service[method](...args), false);
    }
    f.fetch.mock.mockImplementation(async () => { throw new Error('network failed'); });
    assert.equal(await f.service[method](...args), false);
    assert.equal(await fixture({ signedIn: false }).service[method](...args), false);
  });
}

for (const [category, method, expected] of [
  ['pet', 'uploadPetPhoto', ['user-a', 'record-a', image, 2, oldUrl]],
  ['missing-report', 'uploadMissingReportPhoto', ['record-a', image, oldUrl]],
  ['sighting', 'uploadSightingPhoto', ['record-a', image, oldUrl]],
]) {
  test(`retrying ${category} preserves previousUrl so replaced media can be deleted`, async () => {
    const f = fixture();
    f.service.enqueueItem({ category, referenceId: 'record-a', ownerId: 'user-a', index: 2, base64Data: image, previousUrl: oldUrl });
    f.service[method] = mock.fn(async () => newUrl);
    await f.service.flushQueue();
    assert.deepEqual(calls(f.service[method]), [expected]);
  });
}
