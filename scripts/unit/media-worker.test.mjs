import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { createHash, webcrypto } from 'node:crypto';
import { loadModule } from './test-support.mjs';

const env = {
  FIREBASE_PROJECT_ID: 'synthetic-project', ADMIN_EMAIL: 'admin@example.test',
  ALLOWED_ORIGINS: 'https://app.example.test, https://mobile.example.test',
  CLOUDINARY_CLOUD_NAME: 'test-cloud', CLOUDINARY_API_KEY: 'test-key', CLOUDINARY_API_SECRET: 'test-secret',
};
const ownId = 'findlostpuppy/private/pets/user-1/photo';
function setup({ claims = { sub: 'user-1' }, asset = { format: 'jpg', bytes: 10 } } = {}) {
  const jwtVerify = mock.fn(async () => ({ payload: claims }));
  const fetch = mock.fn(async (url) => Response.json(url.includes('/destroy') ? { result: 'ok' } : asset));
  const api = {
    delete_resources_by_prefix: mock.fn(async () => ({})),
    delete_all_resources: mock.fn(async () => ({})),
  };
  const sign = mock.fn(() => 'test-signature');
  const worker = loadModule('worker/index.ts', {
    dependencies: {
      jose: { createRemoteJWKSet: mock.fn(() => 'test-jwks'), jwtVerify },
      cloudinary: { v2: { config: mock.fn(), utils: { api_sign_request: sign }, api } },
    },
    globals: { fetch, crypto: webcrypto },
  }).default;
  const request = (path, data = {}, { method = 'POST', headers = {} } = {}) => worker.fetch(new Request(`https://worker.example.test${path}`, {
    method, headers: { Authorization: 'Bearer test-token', Origin: 'https://mobile.example.test', ...headers },
    ...(method === 'POST' ? { body: JSON.stringify(data) } : {}),
  }), env);
  return { request, fetch, jwtVerify, api, sign };
}

test('preflight returns allowed origin and does not authenticate; other methods are rejected', async () => {
  const h = setup();
  const response = await h.request('/media/authorize', {}, { method: 'OPTIONS' });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://mobile.example.test');
  assert.equal(response.headers.get('Vary'), 'Origin');
  assert.equal(h.jwtVerify.mock.callCount(), 0);
  assert.equal((await h.request('/media/authorize', {}, { method: 'GET' })).status, 404);
});

test('unknown origins are never reflected in CORS responses', async () => {
  const response = await setup().request('/media/authorize', {}, { method: 'OPTIONS', headers: { Origin: 'https://untrusted.example.test' } });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://app.example.test');
});

for (const [category, folder] of Object.entries({ profile: 'private/profiles', pet: 'private/pets', 'missing-report': 'recovery/missing-reports', sighting: 'recovery/sightings' })) {
  test(`authorizes ${category} only with authenticated delivery under the token owner's folder`, async () => {
    const h = setup();
    const response = await h.request('/media/authorize', { category, referenceId: 'pet-1', uid: 'other-user' });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.folder, `findlostpuppy/${folder}/user-1`);
    assert.equal(result.type, 'authenticated');
    assert.match(result.public_id, /^media_\d+_[a-f0-9]+$/);
    assert.equal(result.signature, 'test-signature');
    assert.deepEqual(h.jwtVerify.mock.calls[0].arguments.slice(0, 2), ['test-token', 'test-jwks']);
    assert.deepEqual(h.jwtVerify.mock.calls[0].arguments[2], {
      issuer: 'https://securetoken.google.com/synthetic-project', audience: 'synthetic-project', algorithms: ['RS256'],
    });
    assert.equal(JSON.stringify(result).includes(env.CLOUDINARY_API_SECRET), false);
    assert.equal(h.fetch.mock.callCount(), 0);
  });
}

for (const data of [{ category: 'video', referenceId: 'x' }, { category: 'pet' }, { category: 'pet', referenceId: '' }]) {
  test(`rejects invalid authorization data ${JSON.stringify(data)}`, async () => {
    const h = setup();
    assert.equal((await h.request('/media/authorize', data)).status, 400);
    assert.equal(h.sign.mock.callCount(), 0);
  });
}

test('missing credentials and tokens without an identity cannot access media', async () => {
  const h = setup();
  assert.equal((await h.request('/media/delete', { publicId: ownId }, { headers: { Authorization: '' } })).status, 401);
  assert.equal(h.jwtVerify.mock.callCount(), 0);
  assert.equal((await setup({ claims: {} }).request('/media/delete', { publicId: ownId })).status, 401);
  assert.equal(h.fetch.mock.callCount(), 0);
});

test('JWT verification failure exposes no provider details and performs no media operation', async () => {
  const h = setup();
  h.jwtVerify.mock.mockImplementation(async () => { throw new Error('synthetic private verification detail'); });
  const response = await h.request('/media/delete', { publicId: ownId });
  assert.ok(response.status >= 400);
  assert.deepEqual(await response.json(), { error: 'The image service is temporarily unavailable.' });
  assert.equal(h.fetch.mock.callCount(), 0);
});

for (const publicId of ['findlostpuppy/private/pets/user-10/photo', 'findlostpuppy/private/pets/other/photo', 'outside/photo', '']) {
  test(`rejects a foreign or invalid media path: ${publicId}`, async () => {
    const h = setup();
    for (const route of ['/media/finalize', '/media/delete']) assert.equal((await h.request(route, { publicId })).status, 403);
    assert.equal(h.fetch.mock.callCount(), 0);
  });
}

test('finalization verifies the server asset, accepts the size boundary, and returns a signed delivery URL', async () => {
  const h = setup({ asset: { format: 'JPEG', bytes: 5 * 1024 * 1024 } });
  const response = await h.request('/media/finalize', { publicId: ownId, bytes: 1, format: 'png' });
  assert.equal(response.status, 200);
  const signature = createHash('sha1').update(`f_auto,q_auto/${ownId}${env.CLOUDINARY_API_SECRET}`).digest('base64url').slice(0, 8);
  assert.deepEqual(await response.json(), { publicId: ownId, secureUrl: `https://res.cloudinary.com/test-cloud/image/authenticated/s--${signature}--/f_auto,q_auto/${ownId}` });
  assert.match(h.fetch.mock.calls[0].arguments[0], /resources\/image\/authenticated\/findlostpuppy%2F/);
});

for (const asset of [{ format: 'png', bytes: 10 }, { format: 'jpg', bytes: 5 * 1024 * 1024 + 1 }]) {
  test(`invalid server asset is removed before rejection: ${JSON.stringify(asset)}`, async () => {
    const h = setup({ asset });
    assert.equal((await h.request('/media/finalize', { publicId: ownId, format: 'jpg', bytes: 1 })).status, 400);
    const deletes = h.fetch.mock.calls.slice(1).map(({ arguments: [, options] }) => options.body);
    assert.deepEqual(deletes.map((form) => form.get('type')), ['authenticated', 'upload', 'private']);
    assert.ok(deletes.every((form) => form.get('public_id') === ownId && form.get('invalidate') === 'true'));
  });
}

for (const [previous, expectedDeletes] of [[ownId, 0], ['findlostpuppy/private/pets/other/photo', 0], [`${ownId}-old`, 3]]) {
  test(`replacement cleanup respects ownership and preserves the current image: ${previous}`, async () => {
    const h = setup();
    assert.equal((await h.request('/media/finalize', { publicId: ownId, previousPublicId: previous })).status, 200);
    assert.equal(h.fetch.mock.callCount(), 1 + expectedDeletes);
    for (const call of h.fetch.mock.calls.slice(1)) assert.equal(call.arguments[1].body.get('public_id'), previous);
  });
}

test('verification and deletion failures cannot be reported as successful', async () => {
  for (const route of ['/media/finalize', '/media/delete']) {
    const h = setup();
    h.fetch.mock.mockImplementation(async () => Response.json({ result: 'error' }, { status: 503 }));
    const response = await h.request(route, { publicId: ownId });
    assert.equal(response.status, 500);
    assert.equal(h.fetch.mock.callCount(), 1);
  }
});

test('account cleanup requires confirmation and confines deletion to all four owner prefixes', async () => {
  const h = setup();
  assert.equal((await h.request('/account/media-cleanup', {})).status, 400);
  assert.equal(h.api.delete_resources_by_prefix.mock.callCount(), 0);
  assert.equal((await h.request('/account/media-cleanup', { confirmation: 'DELETE' })).status, 200);
  assert.deepEqual(h.api.delete_resources_by_prefix.mock.calls.map((call) => call.arguments),
    ['private/profiles', 'private/pets', 'recovery/missing-reports', 'recovery/sightings'].map((folder) => [
      `findlostpuppy/${folder}/user-1/`, { resource_type: 'image', type: 'authenticated', invalidate: true },
    ]));
});

test('reset requires administrator and exact confirmation, then follows pagination for every delivery type', async () => {
  const data = { confirmation: 'DELETE ALL FINDLOSTPUPPY MEDIA' };
  const nonAdmin = setup();
  assert.equal((await nonAdmin.request('/media/reset', data)).status, 403);
  assert.equal(nonAdmin.api.delete_all_resources.mock.callCount(), 0);
  for (const claims of [{ sub: 'user-1', admin: true }, { sub: 'user-1', email: 'ADMIN@EXAMPLE.TEST' }]) {
    const h = setup({ claims });
    assert.equal((await h.request('/media/reset', { confirmation: 'DELETE' })).status, 403);
    assert.equal(h.api.delete_all_resources.mock.callCount(), 0);
    h.api.delete_all_resources.mock.mockImplementation(async (options) => options.next_cursor ? {} : { next_cursor: 'page-2' });
    assert.equal((await h.request('/media/reset', data)).status, 200);
    assert.deepEqual(h.api.delete_all_resources.mock.calls.map((call) => [call.arguments[0].type, call.arguments[0].next_cursor]),
      ['upload', 'authenticated', 'private'].flatMap((type) => [[type, undefined], [type, 'page-2']]));
  }
});
