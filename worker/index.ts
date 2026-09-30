import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { v2 as cloudinary } from 'cloudinary';

type WorkerEnv = {
  FIREBASE_PROJECT_ID: string;
  ADMIN_EMAIL: string;
  ALLOWED_ORIGINS: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
};

type FirebaseClaims = JWTPayload & { email?: string; admin?: boolean; user_id?: string };
const categories = new Set(['profile', 'pet', 'missing-report', 'sighting']);

/** Builds JSON and CORS headers, selecting the request origin when allowed or the first configured origin otherwise. */
function corsHeaders(request: Request, env: WorkerEnv): HeadersInit {
  const origin = request.headers.get('Origin') || '';
  const allowed = env.ALLOWED_ORIGINS.split(',').map((item) => item.trim());
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Headers': 'authorization,content-type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  };
}

/** Serializes a response body as JSON with the supplied status and configured CORS headers. */
function json(request: Request, env: WorkerEnv, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request, env) });
}

/** Verifies a bearer token against Firebase's signing keys, issuer, and audience; returns claims or rejects. */
async function authenticate(request: Request, env: WorkerEnv): Promise<FirebaseClaims> {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('UNAUTHENTICATED');
  const issuer = `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`;
  const jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
  const verified = await jwtVerify<FirebaseClaims>(token, jwks, {
    issuer,
    audience: env.FIREBASE_PROJECT_ID,
    algorithms: ['RS256'],
  });
  return verified.payload;
}

/** Returns the Firebase user ID from verified claims, throwing UNAUTHENTICATED when absent. */
function uidOf(claims: FirebaseClaims): string {
  const uid = String(claims.user_id || claims.sub || '');
  if (!uid) throw new Error('UNAUTHENTICATED');
  return uid;
}

/** Checks verified claims for the admin flag or configured administrator email. */
function isAdmin(claims: FirebaseClaims, env: WorkerEnv): boolean {
  return claims.admin === true || claims.email?.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
}

/** Converts a value to an identifier with only letters, digits, underscores, and hyphens, capped at 120 characters. */
function clean(value: unknown): string {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

/** Returns the user-scoped media folder for a validated category, defaulting to sightings. */
function folderFor(category: string, uid: string): string {
  if (category === 'profile') return `findlostpuppy/private/profiles/${uid}`;
  if (category === 'pet') return `findlostpuppy/private/pets/${uid}`;
  if (category === 'missing-report') return `findlostpuppy/recovery/missing-reports/${uid}`;
  return `findlostpuppy/recovery/sightings/${uid}`;
}

/** Checks whether a public ID belongs to one of the user's permitted media-folder prefixes. */
function ownedBy(publicId: string, uid: string): boolean {
  return publicId.startsWith(`findlostpuppy/private/profiles/${uid}/`) ||
    publicId.startsWith(`findlostpuppy/private/pets/${uid}/`) ||
    publicId.startsWith(`findlostpuppy/recovery/missing-reports/${uid}/`) ||
    publicId.startsWith(`findlostpuppy/recovery/sightings/${uid}/`);
}

/** Configures the Cloudinary SDK with the Worker's server-side credentials. */
function configure(env: WorkerEnv): void {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/** Fetches authenticated image metadata from Cloudinary, rejecting unsuccessful verification requests. */
async function getAuthenticatedImage(publicId: string, env: WorkerEnv): Promise<{ format: string; bytes: number }> {
  const credentials = btoa(`${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`);
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/resources/image/authenticated/${encodeURIComponent(publicId)}`,
    { headers: { Authorization: `Basic ${credentials}` } },
  );
  if (!response.ok) throw new Error('ASSET_VERIFICATION_FAILED');
  return response.json<{ format: string; bytes: number }>();
}

/** Builds a signed authenticated-delivery URL with automatic image format and quality transformations. */
async function signedAuthenticatedImageUrl(publicId: string, env: WorkerEnv): Promise<string> {
  const transformation = 'f_auto,q_auto';
  const signatureInput = `${transformation}/${publicId}${env.CLOUDINARY_API_SECRET}`;
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(signatureInput));
  const signature = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '').slice(0, 8);
  const encodedPublicId = publicId.split('/').map(encodeURIComponent).join('/');
  return `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/authenticated/s--${signature}--/${transformation}/${encodedPublicId}`;
}

/** Parses JSON after rejecting a declared Content-Length above 16 KiB; rejects invalid JSON. */
async function body(request: Request): Promise<Record<string, unknown>> {
  if (Number(request.headers.get('content-length') || 0) > 16_384) throw new Error('INVALID');
  return request.json<Record<string, unknown>>();
}

/** Deletes an image across supported delivery types with cache invalidation, throwing if any deletion fails. */
async function deleteAsset(publicId: string, env: WorkerEnv): Promise<void> {
  for (const type of ['authenticated', 'upload', 'private']) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signedParams = { public_id: publicId, timestamp, type, invalidate: true };
    const form = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      type,
      invalidate: 'true',
      api_key: env.CLOUDINARY_API_KEY,
      signature: cloudinary.utils.api_sign_request(signedParams, env.CLOUDINARY_API_SECRET),
    });
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`,
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form },
    );
    const result = await response.json<{ result?: string }>();
    if (!response.ok || !['ok', 'not found'].includes(String(result.result))) {
      console.error(JSON.stringify({
        message: 'cloudinary deletion rejected',
        status: response.status,
        deliveryType: type,
        result: result.result || '',
      }));
      throw new Error('DELETE_FAILED');
    }
  }
}

/** Routes media requests, verifying Firebase identity and operation-specific ownership or admin permissions. */
async function handle(request: Request, env: WorkerEnv): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  if (request.method !== 'POST') return json(request, env, { error: 'Not found.' }, 404);
  const claims = await authenticate(request, env);
  const uid = uidOf(claims);
  const data = await body(request);
  configure(env);
  const path = new URL(request.url).pathname;

  if (path === '/media/authorize') {
    const category = String(data.category || '');
    const referenceId = clean(data.referenceId);
    if (!categories.has(category) || !referenceId) throw new Error('INVALID');
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = folderFor(category, uid);
    const publicId = `media_${Date.now()}_${crypto.randomUUID().replaceAll('-', '')}`;
    const params = { timestamp, folder, public_id: publicId, type: 'authenticated' };
    return json(request, env, {
      ...params,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      signature: cloudinary.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET),
    });
  }

  if (path === '/media/finalize') {
    const publicId = String(data.publicId || '');
    if (!ownedBy(publicId, uid)) throw new Error('FORBIDDEN');
    const asset = await getAuthenticatedImage(publicId, env);
    if (!['jpg', 'jpeg'].includes(String(asset.format).toLowerCase()) || asset.bytes > 5 * 1024 * 1024) {
      await deleteAsset(publicId, env);
      throw new Error('INVALID');
    }
    const previous = String(data.previousPublicId || '');
    if (previous && previous !== publicId && ownedBy(previous, uid)) await deleteAsset(previous, env);
    return json(request, env, {
      secureUrl: await signedAuthenticatedImageUrl(publicId, env),
      publicId,
    });
  }

  if (path === '/media/delete') {
    const publicId = String(data.publicId || '');
    if (!ownedBy(publicId, uid) && !isAdmin(claims, env)) throw new Error('FORBIDDEN');
    await deleteAsset(publicId, env);
    return json(request, env, { deleted: true });
  }

  if (path === '/account/media-cleanup') {
    if (data.confirmation !== 'DELETE') throw new Error('INVALID');
    const prefixes = [
      `findlostpuppy/private/profiles/${uid}/`,
      `findlostpuppy/private/pets/${uid}/`,
      `findlostpuppy/recovery/missing-reports/${uid}/`,
      `findlostpuppy/recovery/sightings/${uid}/`,
    ];
    for (const prefix of prefixes) {
      let nextCursor: string | undefined;
      do {
        const result = await cloudinary.api.delete_resources_by_prefix(prefix, {
          resource_type: 'image', type: 'authenticated', invalidate: true,
          ...(nextCursor ? { next_cursor: nextCursor } : {}),
        });
        nextCursor = result.next_cursor;
      } while (nextCursor);
    }
    return json(request, env, { deleted: true });
  }

  if (path === '/media/reset') {
    if (!isAdmin(claims, env) || data.confirmation !== 'DELETE ALL FINDLOSTPUPPY MEDIA') throw new Error('FORBIDDEN');
    for (const type of ['upload', 'authenticated', 'private']) {
      let nextCursor: string | undefined;
      do {
        const result = await cloudinary.api.delete_all_resources({
          resource_type: 'image', type, invalidate: true,
          ...(nextCursor ? { next_cursor: nextCursor } : {}),
        });
        nextCursor = result.next_cursor;
      } while (nextCursor);
    }
    return json(request, env, { deleted: true });
  }

  return json(request, env, { error: 'Not found.' }, 404);
}

export default {
  /** Handles Worker requests and translates failures into JSON responses with CORS headers and mapped status codes. */
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    try {
      return await handle(request, env);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'FAILED';
      const status = code === 'UNAUTHENTICATED' ? 401 : code === 'FORBIDDEN' ? 403 : code === 'INVALID' ? 400 : 500;
      console.error(JSON.stringify({ message: 'media request failed', path: new URL(request.url).pathname, code }));
      return json(request, env, { error: status >= 500 ? 'The image service is temporarily unavailable.' : 'The request could not be completed.' }, status);
    }
  },
} satisfies ExportedHandler<WorkerEnv>;
