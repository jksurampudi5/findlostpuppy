import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test, mock } from 'node:test';
import { loadModule, calls } from './test_harness.mjs';

const ownId = 'findlostpuppy/private/pets/user-a/photo';
const foreignId = 'findlostpuppy/private/pets/user-ab/photo';
const env = {
  FIREBASE_PROJECT_ID: 'unit-project', ADMIN_EMAIL: 'admin@example.invalid',
  ALLOWED_ORIGINS: 'https://app.example.invalid, capacitor://localhost',
  CLOUDINARY_CLOUD_NAME: 'unit-cloud', CLOUDINARY_API_KEY: 'unit-key',
  CLOUDINARY_API_SECRET: 'synthetic-unit-secret',
};

function fixture(claims = { sub: 'user-a' }) {
  const api = {
    delete_resources_by_prefix: mock.fn(async () => ({})),
    delete_all_resources: mock.fn(async () => ({})),
  };
  const sign = mock.fn(() => 'synthetic-signature');
  const verify = mock.fn(async () => ({ payload: claims }));
  const fetch = mock.fn(async (url) => Response.json(url.includes('/resources/')
    ? { format: 'jpg', bytes: 100 } : { result: 'ok' }));
  const worker = loadModule('worker/index.ts', {
    mocks: {
      jose: { jwtVerify: verify, createRemoteJWKSet: mock.fn(() => 'unit-jwks') },
      cloudinary: { v2: { api, config: mock.fn(), utils: { api_sign_request: sign } } },
    }, globals: { fetch },
  }).default;
  const request = (path, data = {}, options = {}) => worker.fetch(new Request(`https://worker.example.invalid${path}`, {
    method: 'POST', body: JSON.stringify(data),
    ...options,
    headers: { Authorization: 'Bearer synthetic-token', Origin: 'https://app.example.invalid', ...options.headers },
  }), env);
  return { request, api, sign, verify, fetch };
}

test('preflight is unauthenticated and returns the allowed origin, methods, and headers', async () => {
  const f = fixture();
  const response = await f.request('/media/authorize', {}, { method: 'OPTIONS', body: undefined, headers: { Origin: 'capacitor://localhost' } });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'capacitor://localhost');
  assert.equal(response.headers.get('access-control-allow-methods'), 'POST,OPTIONS');
  assert.equal(response.headers.get('access-control-allow-headers'), 'authorization,content-type');
  assert.equal(response.headers.get('vary'), 'Origin');
  assert.equal(f.verify.mock.callCount(), 0);
});

test('CORS never reflects an unlisted origin', async () => {
  const response = await fixture().request('/media/authorize', {}, { method: 'OPTIONS', body: undefined, headers: { Origin: 'https://untrusted.example.invalid' } });
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://app.example.invalid');
});

for (const [category, folder] of [
  ['profile', 'private/profiles'], ['pet', 'private/pets'],
  ['missing-report', 'recovery/missing-reports'], ['sighting', 'recovery/sightings'],
]) {
  test(`authorizes ${category} with authenticated delivery in the caller's namespace`, async () => {
    const f = fixture();
    const response = await f.request('/media/authorize', { category, referenceId: 'other-user', ownerId: 'other-user' });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.folder, `findlostpuppy/${folder}/user-a`);
    assert.equal(data.type, 'authenticated');
    assert.match(data.public_id, /^media_\d+_[a-f0-9]{32}$/);
    assert.equal(data.signature, 'synthetic-signature');
    assert.deepEqual(calls(f.sign), [[{
      timestamp: data.timestamp, folder: data.folder, public_id: data.public_id, type: 'authenticated',
    }, env.CLOUDINARY_API_SECRET]]);
    assert.equal(JSON.stringify(data).includes(env.CLOUDINARY_API_SECRET), false);
    assert.deepEqual(calls(f.verify)[0], ['synthetic-token', 'unit-jwks', {
      issuer: 'https://securetoken.google.com/unit-project', audience: 'unit-project', algorithms: ['RS256'],
    }]);
  });
}

for (const data of [{}, { category: 'video', referenceId: 'id' }, { category: 'pet' }, { category: 'pet', referenceId: '' }]) {
  test(`rejects invalid authorization input ${JSON.stringify(data)}`, async () => {
    const f = fixture();
    assert.equal((await f.request('/media/authorize', data)).status, 400);
    assert.equal(f.sign.mock.callCount(), 0);
  });
}

test('missing authentication or user identity cannot authorize uploads', async () => {
  const f = fixture();
  assert.equal((await f.request('/media/authorize', {}, { headers: { Authorization: '' } })).status, 401);
  assert.equal(f.verify.mock.callCount(), 0);
  assert.equal((await fixture({}).request('/media/authorize')).status, 401);
});

test('token verification failures do not call Cloudinary or leak provider details', async () => {
  const f = fixture();
  f.verify.mock.mockImplementation(async () => { throw new Error('synthetic-sensitive-verification-detail'); });
  const response = await f.request('/media/authorize', { category: 'pet', referenceId: 'id' });
  assert.ok(response.status >= 400);
  assert.doesNotMatch(await response.text(), /synthetic-sensitive/);
  assert.equal(f.sign.mock.callCount(), 0);
  assert.equal(f.fetch.mock.callCount(), 0);
});

test('rejects oversized declared bodies before provider operations', async () => {
  const f = fixture();
  assert.equal((await f.request('/media/authorize', {}, { headers: { 'content-length': '16385' } })).status, 400);
  assert.equal(f.sign.mock.callCount(), 0);
});

for (const path of ['/media/finalize', '/media/delete']) {
  for (const publicId of [foreignId, 'findlostpuppy/private/pets/user-a', '', 'unrelated/photo']) {
    test(`${path} rejects non-owned or incomplete asset path ${publicId}`, async () => {
      const f = fixture();
      assert.equal((await f.request(path, { publicId })).status, 403);
      assert.equal(f.fetch.mock.callCount(), 0);
    });
  }
}

test('finalization validates provider metadata and signs delivery at the exact 5 MiB boundary', async () => {
  const f = fixture();
  f.fetch.mock.mockImplementation(async () => Response.json({ format: 'JPEG', bytes: 5 * 1024 * 1024 }));
  const response = await f.request('/media/finalize', { publicId: ownId, format: 'png', bytes: 99_000_000 });
  assert.equal(response.status, 200);
  const signature = createHash('sha1').update(`f_auto,q_auto/${ownId}${env.CLOUDINARY_API_SECRET}`).digest('base64url').slice(0, 8);
  assert.deepEqual(await response.json(), {
    publicId: ownId,
    secureUrl: `https://res.cloudinary.com/unit-cloud/image/authenticated/s--${signature}--/f_auto,q_auto/${ownId}`,
  });
  assert.equal(calls(f.fetch)[0][0], `https://api.cloudinary.com/v1_1/unit-cloud/resources/image/authenticated/${encodeURIComponent(ownId)}`);
  assert.equal(calls(f.fetch)[0][1].headers.Authorization, `Basic ${btoa('unit-key:synthetic-unit-secret')}`);
});

for (const asset of [{ format: 'png', bytes: 100 }, { format: 'jpg', bytes: 5 * 1024 * 1024 + 1 }]) {
  test(`finalization deletes invalid provider asset ${JSON.stringify(asset)} despite valid client claims`, async () => {
    const f = fixture();
    f.fetch.mock.mockImplementation(async (url) => Response.json(url.includes('/resources/') ? asset : { result: 'ok' }));
    assert.equal((await f.request('/media/finalize', { publicId: ownId, format: 'jpg', bytes: 1 })).status, 400);
    assert.deepEqual(calls(f.fetch).slice(1).map(([, options]) => options.body.get('type')), ['authenticated', 'upload', 'private']);
  });
}

for (const [previousPublicId, deletes] of [[`${ownId}-old`, 3], [ownId, 0], [foreignId, 0], ['', 0]]) {
  test(`finalization only removes a distinct owned previous asset: ${previousPublicId}`, async () => {
    const f = fixture();
    assert.equal((await f.request('/media/finalize', { publicId: ownId, previousPublicId })).status, 200);
    const requests = calls(f.fetch).slice(1);
    assert.equal(requests.length, deletes);
    for (const [, options] of requests) assert.equal(options.body.get('public_id'), previousPublicId);
  });
}

test('verification outage cannot finalize or delete the previous image', async () => {
  const f = fixture();
  f.fetch.mock.mockImplementation(async () => new Response('', { status: 503 }));
  const response = await f.request('/media/finalize', { publicId: ownId, previousPublicId: `${ownId}-old` });
  assert.equal(response.status, 500);
  assert.equal(f.fetch.mock.callCount(), 1);
});

for (const result of ['ok', 'not found']) {
  test(`deletion accepts ${result} and invalidates every delivery type`, async () => {
    const f = fixture();
    f.fetch.mock.mockImplementation(async () => Response.json({ result }));
    const response = await f.request('/media/delete', { publicId: ownId });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { deleted: true });
    assert.deepEqual(calls(f.fetch).map(([, options]) => options.body.get('type')), ['authenticated', 'upload', 'private']);
    for (const [, options] of calls(f.fetch)) {
      assert.equal(options.method, 'POST');
      assert.equal(options.body.get('invalidate'), 'true');
      assert.equal(options.body.get('public_id'), ownId);
      assert.equal(options.body.get('signature'), 'synthetic-signature');
    }
  });
}

test('provider deletion rejection stops the operation and never reports success', async () => {
  const f = fixture();
  f.fetch.mock.mockImplementation(async () => Response.json({ result: 'error' }));
  const response = await f.request('/media/delete', { publicId: ownId });
  assert.equal(response.status, 500);
  assert.equal(f.fetch.mock.callCount(), 1);
  assert.deepEqual(await response.json(), { error: 'The image service is temporarily unavailable.' });
});

test('administrator claim can delete a foreign asset', async () => {
  assert.equal((await fixture({ sub: 'admin-user', admin: true }).request('/media/delete', { publicId: foreignId })).status, 200);
});

test('account cleanup requires exact confirmation and uses only the authenticated user prefixes', async () => {
  const f = fixture();
  assert.equal((await f.request('/account/media-cleanup', { confirmation: 'delete' })).status, 400);
  assert.equal(f.api.delete_resources_by_prefix.mock.callCount(), 0);
  assert.equal((await f.request('/account/media-cleanup', { confirmation: 'DELETE', uid: 'other-user' })).status, 200);
  assert.deepEqual(calls(f.api.delete_resources_by_prefix), [
    'private/profiles', 'private/pets', 'recovery/missing-reports', 'recovery/sightings',
  ].map((folder) => [`findlostpuppy/${folder}/user-a/`, { resource_type: 'image', type: 'authenticated', invalidate: true }]));
});

for (const [claims, confirmation] of [[{ sub: 'user-a' }, 'DELETE ALL FINDLOSTPUPPY MEDIA'], [{ sub: 'admin', admin: true }, 'DELETE']]) {
  test(`reset requires both admin and exact confirmation: ${JSON.stringify(claims)}`, async () => {
    const f = fixture(claims);
    assert.equal((await f.request('/media/reset', { confirmation })).status, 403);
    assert.equal(f.api.delete_all_resources.mock.callCount(), 0);
  });
}

test('admin reset follows pagination separately for every delivery type', async () => {
  const f = fixture({ sub: 'admin', admin: true });
  f.api.delete_all_resources.mock.mockImplementation(async (options) => options.next_cursor ? {} : { next_cursor: `${options.type}-page-2` });
  assert.equal((await f.request('/media/reset', { confirmation: 'DELETE ALL FINDLOSTPUPPY MEDIA' })).status, 200);
  assert.deepEqual(calls(f.api.delete_all_resources), ['upload', 'authenticated', 'private'].flatMap((type) => [
    [{ resource_type: 'image', type, invalidate: true }],
    [{ resource_type: 'image', type, invalidate: true, next_cursor: `${type}-page-2` }],
  ]));
});

test('cleanup provider failure returns a safe error and stops further deletions', async () => {
  const f = fixture();
  f.api.delete_resources_by_prefix.mock.mockImplementation(async () => { throw new Error('synthetic provider detail'); });
  const response = await f.request('/account/media-cleanup', { confirmation: 'DELETE' });
  assert.equal(response.status, 500);
  assert.equal(f.api.delete_resources_by_prefix.mock.callCount(), 1);
  assert.doesNotMatch(await response.text(), /synthetic provider detail/);
});

test('unknown paths and unsupported methods return 404 without asset operations', async () => {
  const f = fixture();
  assert.equal((await f.request('/unknown')).status, 404);
  assert.equal((await f.request('/media/delete', {}, { method: 'GET', body: undefined })).status, 404);
  assert.equal(f.fetch.mock.callCount(), 0);
});

test('finalization rejects and deletes a zero-byte provider asset', async () => {
  const f = fixture();
  f.fetch.mock.mockImplementation(async (url) => Response.json(url.includes('/resources/')
    ? { format: 'jpg', bytes: 0 } : { result: 'ok' }));
  assert.equal((await f.request('/media/finalize', { publicId: ownId })).status, 400);
  assert.equal(f.fetch.mock.callCount(), 4);
});
