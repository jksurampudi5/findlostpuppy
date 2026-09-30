import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { loadModule, memoryStorage } from './test-support.mjs';

const image = 'data:image/jpeg;base64,aGVsbG8=';
const previousUrl = 'https://res.cloudinary.com/test/image/authenticated/s--abc--/f_auto,q_auto/v123/folder/previous.jpg';
function setup({ online = true, secure = false, signedIn = true, configured = true, localStorage = memoryStorage() } = {}) {
  const events = [];
  const navigator = { onLine: online };
  const respond = async (url) => {
    if (url.endsWith('/media/authorize')) return Response.json({ cloudName: 'test', apiKey: 'test-key', timestamp: 100, folder: 'folder', public_id: 'photo', type: 'authenticated', signature: 'test-signature' });
    if (url.endsWith('/image/upload')) return Response.json({ public_id: 'folder/photo', bytes: 5, format: 'jpg' });
    return Response.json({ secureUrl: 'https://media.example.test/photo', deleted: true });
  };
  const fetch = mock.fn(respond);
  const sanitized = new Blob(['sanitized'], { type: 'image/jpeg' });
  const drawImage = mock.fn();
  const bitmap = { width: 3200, height: 800, close: mock.fn() };
  const canvas = { getContext: () => ({ drawImage }), toBlob: (callback) => callback(sanitized) };
  const uploadBytes = mock.fn(async (ref) => ({ ref }));
  const getIdToken = mock.fn(async () => 'synthetic-token');
  const exports = loadModule('src/services/storageBucketService.ts', {
    dependencies: {
      './firebaseConfig': { storage: {}, isFirebaseConfigured: () => configured, auth: { currentUser: signedIn ? { getIdToken } : null } },
      'firebase/storage': { ref: (_, path) => ({ fullPath: path }), uploadBytes, getDownloadURL: async () => 'https://storage.example.test/photo' },
    },
    globals: { localStorage, navigator, fetch, window: { dispatchEvent: (event) => events.push(event) }, document: { createElement: () => canvas }, createImageBitmap: async () => bitmap },
    env: { VITE_CLOUDINARY_SECURE_FUNCTIONS: String(secure), VITE_MEDIA_WORKER_URL: 'https://worker.example.test/' },
  });
  return { ...exports, service: exports.storageBucketService, events, localStorage, navigator, fetch, respond, canvas, bitmap, drawImage, sanitized, uploadBytes, getIdToken };
}

for (const [url, expected] of [
  [previousUrl, 'folder/previous'],
  ['https://res.cloudinary.com/test/image/authenticated/s--a-b_c--/f_auto/q_auto/folder/photo', 'folder/photo'],
  ['https://res.cloudinary.com/test/image/upload/w_200,c_fill/v123/folder/pet.photo.jpg?download=1#x', 'folder/pet.photo'],
  ['https://res.cloudinary.com/test/image/upload/v123/w_real_folder/photo.jpg', 'w_real_folder/photo'],
  ['https://example.test/photo.jpg', null], ['', null],
]) {
  test(`extracts public IDs for authenticated delivery and existing upload URLs: ${url}`, () => {
    assert.equal(setup().extractCloudinaryPublicId(url), expected);
  });
}

test('secure upload sanitizes images and sends signed form fields before finalizing', async () => {
  const h = setup({ secure: true });
  assert.equal(await h.service.uploadProfileAvatar('owner-owner-user-1', image, previousUrl), 'https://media.example.test/photo');
  assert.equal(h.canvas.width, 1600);
  assert.equal(h.canvas.height, 400);
  assert.equal(h.bitmap.close.mock.callCount(), 1);
  assert.deepEqual(h.drawImage.mock.calls[0].arguments.slice(1), [0, 0, 1600, 400]);
  const calls = h.fetch.mock.calls.map((call) => call.arguments);
  assert.equal(calls.length, 3);
  assert.equal(calls[0][0], 'https://worker.example.test/media/authorize');
  assert.deepEqual(JSON.parse(calls[0][1].body), { category: 'profile', referenceId: 'user-1' });
  assert.equal(calls[0][1].headers.Authorization, 'Bearer synthetic-token');
  const form = calls[1][1].body;
  assert.equal(await form.get('file').text(), await h.sanitized.text());
  assert.equal(form.get('file').type, 'image/jpeg');
  assert.equal(form.get('api_key'), 'test-key');
  assert.equal(form.get('type'), 'authenticated');
  assert.equal(form.get('signature'), 'test-signature');
  assert.equal(form.has('upload_preset'), false);
  assert.deepEqual(JSON.parse(calls[2][1].body), {
    publicId: 'folder/photo', category: 'profile', referenceId: 'user-1', deliveryType: 'authenticated', bytes: 5, format: 'jpg', previousPublicId: 'folder/previous',
  });
  assert.equal(h.uploadBytes.mock.callCount(), 0);
});

for (const [method, args, category, referenceId] of [
  ['uploadPetPhoto', ['owner-user-1', 'pet-1', image], 'pet', 'pet-1'],
  ['uploadMissingReportPhoto', ['report-1', image], 'missing-report', 'report-1'],
  ['uploadSightingPhoto', ['report-1', image], 'sighting', 'report-1'],
]) {
  test(`${method} routes through the authenticated media service`, async () => {
    const h = setup({ secure: true });
    assert.ok(await h.service[method](...args));
    assert.deepEqual(JSON.parse(h.fetch.mock.calls[0].arguments[1].body), { category, referenceId });
  });
}

for (const failingStage of ['/media/authorize', '/image/upload', '/media/finalize']) {
  test(`failed ${failingStage} never returns an unfinalized URL or falls back to Firebase`, async () => {
    const h = setup({ secure: true });
    const original = h.respond;
    h.fetch.mock.mockImplementation(async (...args) => args[0].endsWith(failingStage) ? new Response(null, { status: 503 }) : original(...args));
    assert.equal(await h.service.uploadProfileAvatar('user-1', image), null);
    assert.equal(h.uploadBytes.mock.callCount(), 0);
    assert.equal(h.fetch.mock.calls.at(-1).arguments[0].endsWith(failingStage), true);
  });
}

test('secure upload refuses unauthenticated, invalid, oversized, and undecodable images', async () => {
  const anonymous = setup({ secure: true, signedIn: false });
  assert.equal(await anonymous.service.uploadProfileAvatar('user-1', image), null);
  assert.equal(anonymous.fetch.mock.callCount(), 0);
  const h = setup({ secure: true });
  for (const input of ['%%%invalid', new Blob([new Uint8Array(5 * 1024 * 1024 + 1)])]) {
    assert.equal(await h.service.uploadProfileAvatar('user-1', input), null);
  }
  h.canvas.getContext = () => null;
  assert.equal(await h.service.uploadProfileAvatar('user-1', image), null);
  assert.equal(h.fetch.mock.callCount(), 0);
});

test('queue accepts ten items, preserving existing work when the next item is rejected', () => {
  const h = setup();
  for (let i = 0; i < 10; i++) assert.equal(h.service.enqueueItem({ category: 'profile', referenceId: `user-${i}`, base64Data: image }), true);
  const before = h.localStorage.getItem(h.MEDIA_QUEUE_KEY);
  assert.equal(h.service.enqueueItem({ category: 'profile', referenceId: 'overflow', base64Data: image }), false);
  assert.equal(h.localStorage.getItem(h.MEDIA_QUEUE_KEY), before);
  assert.equal(new Set(h.service.getQueue().map((item) => item.id)).size, 10);
  assert.ok(h.service.getQueue().every((item) => item.retryCount === 0 && Number.isFinite(Date.parse(item.createdAt))));
});

test('offline flush preserves queued images and retries without making requests', async () => {
  const h = setup({ online: false });
  h.service.enqueueItem({ category: 'profile', referenceId: 'user-1', base64Data: image });
  const before = h.localStorage.getItem(h.MEDIA_QUEUE_KEY);
  assert.deepEqual(await h.service.flushQueue(), { uploaded: 0, pending: 1 });
  assert.equal(h.localStorage.getItem(h.MEDIA_QUEUE_KEY), before);
  assert.equal(h.uploadBytes.mock.callCount(), 0);
  assert.equal(h.fetch.mock.callCount(), 0);
  h.navigator.onLine = true;
  assert.deepEqual(await h.service.flushQueue(), { uploaded: 1, pending: 0 });
  assert.equal(h.events[0].type, 'findlostpuppy_media_uploaded');
  assert.equal(h.events[0].detail.referenceId, 'user-1');
  assert.equal(h.events[0].detail.publicUrl, 'https://storage.example.test/photo');
});

test('mixed queue continues after exceptions, retains failures, and emits only successful uploads', async () => {
  const h = setup();
  const items = [
    { category: 'profile', referenceId: 'user-1', previousUrl },
    { category: 'pet', referenceId: 'pet-1', ownerId: 'user-1', index: 2 },
    { category: 'missing-report', referenceId: 'report-1' },
    { category: 'sighting', referenceId: 'report-2' },
    { category: 'pet', referenceId: 'pet-without-owner' },
  ];
  items.forEach((item) => h.service.enqueueItem({ ...item, base64Data: image }));
  h.service.uploadProfileAvatar = mock.fn(async () => 'https://media.example.test/avatar');
  h.service.uploadPetPhoto = mock.fn(async () => { throw new Error('offline'); });
  h.service.uploadMissingReportPhoto = mock.fn(async () => null);
  h.service.uploadSightingPhoto = mock.fn(async () => 'https://media.example.test/sighting');
  assert.deepEqual(await h.service.flushQueue(), { uploaded: 2, pending: 3 });
  assert.deepEqual(h.service.uploadProfileAvatar.mock.calls[0].arguments, ['user-1', image, previousUrl]);
  assert.deepEqual(h.service.uploadPetPhoto.mock.calls[0].arguments, ['user-1', 'pet-1', image, 2]);
  assert.deepEqual(h.service.getQueue().map((item) => [item.referenceId, item.retryCount]), [['pet-1', 1], ['report-1', 1], ['pet-without-owner', 1]]);
  assert.deepEqual(h.events.map((event) => event.detail.referenceId), ['user-1', 'report-2']);
  assert.deepEqual(await h.service.flushQueue(), { uploaded: 0, pending: 3 });
  assert.ok(h.service.getQueue().every((item) => item.retryCount === 2));
});

test('queue tolerates corrupted or unavailable storage and removes only the requested item', () => {
  const h = setup();
  h.localStorage.setItem(h.MEDIA_QUEUE_KEY, '{broken');
  assert.deepEqual(h.service.getQueue(), []);
  h.service.enqueueItem({ category: 'profile', referenceId: 'one', base64Data: image });
  h.service.enqueueItem({ category: 'profile', referenceId: 'two', base64Data: image });
  h.service.removeFromQueue(h.service.getQueue()[0].id);
  assert.equal(h.service.getQueue()[0].referenceId, 'two');
  h.localStorage.setItem('unrelated', 'keep');
  h.service.clearQueue();
  assert.deepEqual(h.service.getQueue(), []);
  assert.equal(h.localStorage.getItem('unrelated'), 'keep');
  const unavailable = setup({ localStorage: { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } } });
  assert.deepEqual(unavailable.service.getQueue(), []);
  assert.equal(unavailable.service.enqueueItem({ category: 'profile', referenceId: 'one', base64Data: image }), false);
});

test('authenticated deletion and account cleanup return true only for confirmed server success', async () => {
  const h = setup({ secure: true });
  assert.equal(await h.service.deleteMedia(previousUrl), true);
  assert.deepEqual(JSON.parse(h.fetch.mock.calls[0].arguments[1].body), { publicId: 'folder/previous' });
  assert.equal(await h.service.deleteMyAccountData(), true);
  assert.equal(h.fetch.mock.calls[1].arguments[0], 'https://worker.example.test/account/media-cleanup');
  assert.deepEqual(JSON.parse(h.fetch.mock.calls[1].arguments[1].body), { confirmation: 'DELETE' });
  assert.equal(await h.service.hardResetCloudinary(), true);
  assert.deepEqual(JSON.parse(h.fetch.mock.calls[2].arguments[1].body), { confirmation: 'DELETE ALL FINDLOSTPUPPY MEDIA' });
  for (const result of [false, 'true', undefined]) {
    h.fetch.mock.mockImplementation(async () => Response.json({ deleted: result }));
    assert.equal(await h.service.deleteMyAccountData(), false);
  }
  h.fetch.mock.mockImplementation(async () => { throw new Error('offline'); });
  assert.equal(await h.service.deleteMedia(previousUrl), false);
});
