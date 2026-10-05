import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebaseConfig';
import { auth } from './firebaseConfig';

export const PET_MEDIA_BUCKET = 'pet-media';
export const MEDIA_QUEUE_KEY = 'findlostpuppy_media_queue_v1';
export const MAX_MEDIA_QUEUE_SIZE = 10;
const MAX_MEDIA_RETRY_COUNT = 3;
let queueFlushPromise: Promise<{ uploaded: number; pending: number }> | null = null;

// Purge any legacy offline base64 queues — images go directly to Cloudinary
if (typeof localStorage !== 'undefined') {
  try { localStorage.removeItem(MEDIA_QUEUE_KEY); } catch {}
}

const SECURE_CLOUDINARY_FUNCTIONS = import.meta.env.VITE_CLOUDINARY_SECURE_FUNCTIONS === 'true';
const MEDIA_WORKER_URL = String(import.meta.env.VITE_MEDIA_WORKER_URL || '').replace(/\/$/, '');
const CLOUDINARY_CLOUD_NAME = String(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();

// =============================================================================
// Canonical Cloudinary folder layout
// =============================================================================
// findlostpuppy/
//   owner_profile/{userId}/photo        ← owner profile picture
//   pet_profile/{userId}/{petId}/photo  ← pet profile picture
//   missing_pets/{reportId}/photo       ← missing-pet report photo
//   sightings_pets/{reportId}/photo     ← community sighting photo
// =============================================================================
const CF = 'findlostpuppy'; // root folder — never changes

/** Returns the canonical Cloudinary public_id for an owner profile photo. */
export function ownerProfilePublicId(userId: string): string {
  return `${CF}/owner_profile/${userId}/photo`;
}

/** Returns the canonical Cloudinary public_id for a pet profile photo. */
export function petProfilePublicId(userId: string, petId: string, index = 0): string {
  const suffix = index > 0 ? `photo_${index}` : 'photo';
  return `${CF}/pet_profile/${userId}/${petId}/${suffix}`;
}

/** Returns the canonical Cloudinary public_id for a missing-pet report photo. */
export function missingPetPublicId(reportId: string, index = 0): string {
  const suffix = index > 0 ? `photo_${index}` : 'photo';
  return `${CF}/missing_pets/${reportId}/${suffix}`;
}

/** Returns the canonical Cloudinary public_id for a sighting photo. */
export function sightingPublicId(reportId: string, index = 0): string {
  const suffix = index > 0 ? `photo_${index}` : 'photo';
  return `${CF}/sightings_pets/${reportId}/${suffix}`;
}

// =============================================================================
// Internal helpers
// =============================================================================

/** Re-encodes an image as JPEG ≤1600 px, strips all metadata. */
async function sanitizePublicImage(blob: Blob): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(blob);
    const max = 1600;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width  = Math.max(1, Math.round(bitmap.width  * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.84));
  } catch {
    return null;
  }
}

export interface QueuedMediaItem {
  id: string;
  category: 'profile' | 'pet' | 'missing-report' | 'sighting';
  referenceId: string;
  recordId?: string;
  ownerId?: string;
  index?: number;
  base64Data: string;
  previousUrl?: string;
  uploadedUrl?: string;
  createdAt: string;
  retryCount: number;
}

function persistQueuedMediaUrl(_item: QueuedMediaItem, _publicUrl: string): boolean {
  return false;
}

/**
 * Returns true if the URL points to a hosted Cloudinary image.
 */
export function isCloudinaryUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

/**
 * Returns true if an existing photo string should be uploaded/migrated to Cloudinary.
 * True for base64 data URLs, blob URLs, or non-Cloudinary cloud storage URLs (e.g. Firebase).
 * Excludes internal mock/static asset paths and empty/null strings.
 */
export function isUploadablePhoto(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (isCloudinaryUrl(trimmed)) return false;
  // Exclude static SVG or UI asset icons
  if (
    trimmed.startsWith('/splash_') ||
    trimmed.startsWith('/dog_') ||
    trimmed.startsWith('/app-') ||
    trimmed.startsWith('/logo') ||
    trimmed.endsWith('.svg')
  ) {
    return false;
  }
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.includes('firebasestorage.googleapis.com') ||
    trimmed.includes('storage.googleapis.com')
  );
}

/**
 * Extracts the Cloudinary public_id from any Cloudinary URL,
 * stripping transformations, versions, and file extensions.
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('res.cloudinary.com') && !url.includes('cloudinary.com')) return null;
  try {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const uploadMatch = cleanUrl.match(/\/(?:upload|authenticated)\//);
    const uploadIndex = uploadMatch?.index ?? -1;
    if (uploadIndex === -1) return null;
    const afterUpload = cleanUrl.substring(uploadIndex + uploadMatch![0].length);
    const segments = afterUpload.split('/');
    while (segments.length > 0) {
      const seg = segments[0];
      if (/^v\d+$/.test(seg)) {
        segments.shift();
        break;
      } else if (
        /^s--[A-Za-z0-9_-]+--$/.test(seg) ||
        seg.includes(',') ||
        /^(c|w|h|q|f|e|b|dpr|ar|g|fl|co|cs|o|z|pg)_/i.test(seg)
      ) {
        segments.shift();
      } else {
        break;
      }
    }
    if (segments.length === 0) return null;
    return segments.join('/').replace(/\.[a-zA-Z0-9]+$/, '');
  } catch {
    return null;
  }
}

/** Converts a Base64 / Data URL into a native Blob. */
export function base64ToBlob(base64Data: string): { blob: Blob; mimeType: string } | null {
  try {
    let clean = base64Data.trim();
    let mimeType = 'image/jpeg';
    if (clean.startsWith('data:')) {
      const parts = clean.split(',');
      const match = parts[0].match(/:(.*?);/);
      if (match?.[1]) mimeType = match[1];
      clean = parts[1] || '';
    }
    if (!clean) return null;
    const chars = atob(clean);
    const buf = new ArrayBuffer(chars.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < chars.length; i++) view[i] = chars.charCodeAt(i);
    return { blob: new Blob([buf], { type: mimeType }), mimeType };
  } catch {
    return null;
  }
}

/** Normalizes File, Blob, Base64 string, or remote image URL into a Blob. */
async function toBlob(input: File | Blob | string): Promise<{ blob: Blob; mimeType: string } | null> {
  if (input instanceof Blob) return { blob: input, mimeType: input.type || 'image/jpeg' };
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.startsWith('data:')) {
      return base64ToBlob(trimmed);
    }
    if (trimmed.startsWith('blob:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const res = await fetch(trimmed);
        if (res.ok) {
          const blob = await res.blob();
          return { blob, mimeType: blob.type || 'image/jpeg' };
        }
      } catch (err) {
        console.warn('[storageBucketService] Failed to fetch remote image into Blob:', err);
      }
    }
  }
  return null;
}

// =============================================================================
// Optional server-side media worker (VITE_CLOUDINARY_SECURE_FUNCTIONS=true)
// =============================================================================

async function callMediaFunction<T>(name: string, data: Record<string, unknown>): Promise<T | null> {
  if (!auth?.currentUser || !SECURE_CLOUDINARY_FUNCTIONS || !MEDIA_WORKER_URL) return null;
  try {
    const paths: Record<string, string> = {
      createMediaUploadAuthorization: '/media/authorize',
      finalizeMediaUpload:            '/media/finalize',
      deleteMediaAsset:               '/media/delete',
      hardResetCloudinary:            '/media/reset',
      deleteMyAccount:                '/account/media-cleanup',
    };
    const path = paths[name];
    if (!path) return null;
    const token = await auth.currentUser.getIdToken();
    const response = await fetch(`${MEDIA_WORKER_URL}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch (err) {
    if (import.meta.env.DEV) console.warn(`[media] ${name} failed`, err);
    return null;
  }
}

async function secureCloudinaryUpload(
  category: QueuedMediaItem['category'],
  referenceId: string,
  input: File | Blob | string,
  previousUrl?: string,
): Promise<string | null> {
  const blobData = await toBlob(input);
  if (!blobData || blobData.blob.size > 5 * 1024 * 1024) return null;
  const sanitized = await sanitizePublicImage(blobData.blob);
  if (!sanitized) return null;
  const authorization = await callMediaFunction<any>('createMediaUploadAuthorization', { category, referenceId });
  if (!authorization) return null;
  const form = new FormData();
  form.append('file', sanitized, 'media.jpg');
  for (const key of ['apiKey', 'timestamp', 'folder', 'public_id', 'type', 'signature']) {
    form.append(key === 'apiKey' ? 'api_key' : key, String(authorization[key]));
  }
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${authorization.cloudName}/image/upload`,
    { method: 'POST', body: form },
  );
  if (!response.ok) return null;
  const uploaded = await response.json();
  const previousPublicId = previousUrl ? extractCloudinaryPublicId(previousUrl) || undefined : undefined;
  const finalized = await callMediaFunction<{ secureUrl: string }>('finalizeMediaUpload', {
    publicId: uploaded.public_id,
    category,
    referenceId,
    deliveryType: authorization.type,
    bytes: uploaded.bytes,
    format: uploaded.format,
    ...(previousPublicId ? { previousPublicId } : {}),
  });
  return finalized?.secureUrl || null;
}

// =============================================================================
// Cloudinary delete-token store (localStorage)
// =============================================================================

const CLOUDINARY_TOKENS_KEY = 'findlostpuppy_cloudinary_tokens_v1';

function getCloudinaryDeleteToken(urlOrPublicId: string): string | null {
  if (typeof localStorage === 'undefined' || !urlOrPublicId) return null;
  try {
    const raw = localStorage.getItem(CLOUDINARY_TOKENS_KEY);
    if (!raw) return null;
    const tokens: Record<string, string> = JSON.parse(raw);
    const cleanUrl = urlOrPublicId.split('?')[0];
    const pubId = extractCloudinaryPublicId(urlOrPublicId);
    return tokens[urlOrPublicId] || tokens[cleanUrl] || (pubId ? tokens[pubId] : null) || null;
  } catch { return null; }
}

function removeCloudinaryDeleteToken(urlOrPublicId: string): void {
  if (typeof localStorage === 'undefined' || !urlOrPublicId) return;
  try {
    const raw = localStorage.getItem(CLOUDINARY_TOKENS_KEY);
    if (!raw) return;
    const tokens: Record<string, string> = JSON.parse(raw);
    delete tokens[urlOrPublicId];
    delete tokens[urlOrPublicId.split('?')[0]];
    const pubId = extractCloudinaryPublicId(urlOrPublicId);
    if (pubId) delete tokens[pubId];
    localStorage.setItem(CLOUDINARY_TOKENS_KEY, JSON.stringify(tokens));
  } catch {}
}

// =============================================================================
// Cloudinary upload
// =============================================================================
//
// Cloudinary writes must go through the authenticated media worker. The client
// must not expose or use unsigned upload presets because copied presets can be
// abused outside the app. If the worker is unavailable, upload helpers fall back
// to Firebase Storage instead of direct Cloudinary upload.
// =============================================================================

// =============================================================================
// Cloudinary delete
// =============================================================================

async function deleteFromCloudinary(urlOrPublicId: string): Promise<boolean> {
  if (!urlOrPublicId) return false;

  const publicId = urlOrPublicId.startsWith('http')
    ? extractCloudinaryPublicId(urlOrPublicId)
    : urlOrPublicId;

  const deleteToken =
    getCloudinaryDeleteToken(urlOrPublicId) ||
    (publicId ? getCloudinaryDeleteToken(publicId) : null);

  // 1. delete_by_token (client-side, works ~10 min after upload)
  if (deleteToken && CLOUDINARY_CLOUD_NAME) {
    try {
      const form = new FormData();
      form.append('token', deleteToken);
      const res  = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/delete_by_token`,
        { method: 'POST', body: form },
      );
      const body = await res.json().catch(() => ({}));
      console.log('[storageBucketService] delete_by_token:', res.status, body);
      if (res.ok && (body as any)?.result === 'ok') {
        removeCloudinaryDeleteToken(urlOrPublicId);
        if (publicId) removeCloudinaryDeleteToken(publicId);
        return true;
      }
    } catch (e) {
      console.warn('[storageBucketService] delete_by_token error:', e);
    }
  }

  // 2. Server-side worker (requires VITE_CLOUDINARY_SECURE_FUNCTIONS=true)
  if (publicId && SECURE_CLOUDINARY_FUNCTIONS && MEDIA_WORKER_URL) {
    const result = await callMediaFunction<{ deleted: boolean }>('deleteMediaAsset', { publicId });
    if (result?.deleted === true) {
      removeCloudinaryDeleteToken(urlOrPublicId);
      return true;
    }
  }

  if (!deleteToken) {
    console.warn(
      '[storageBucketService] No delete token for:', publicId || urlOrPublicId,
      '— uploading a new photo to the same path overwrites automatically.',
    );
  }
  return false;
}

// =============================================================================
// Public API
// =============================================================================

export const storageBucketService = {
  extractPublicId: extractCloudinaryPublicId,

  getPublicUrl(path: string): string { return path; },

  // ---------------------------------------------------------------------------
  // Upload helpers — each one writes to a fixed, predictable path.
  // Uploading again automatically OVERWRITES the previous image (no duplicates).
  // ---------------------------------------------------------------------------

  /**
   * Owner profile photo → findlostpuppy/owner_profile/{userId}/photo
   */
  async uploadProfileAvatar(
    userId: string,
    image: File | Blob | string,
    previousUrl?: string,
  ): Promise<string | null> {
    const uid = userId.replace(/^(owner-)+/, '').trim();
    if (!uid) { console.error('[storageBucketService] Missing userId'); return null; }

    const cloudinaryUrl = await secureCloudinaryUpload('profile', uid, image, previousUrl);
    if (cloudinaryUrl) return cloudinaryUrl;

    const fb = await this.uploadMedia(`profiles/${uid}/avatar.jpg`, image);
    return fb ? fb.publicUrl : null;
  },

  /**
   * Pet profile photo → findlostpuppy/pet_profile/{userId}/{petId}/photo
   */
  async uploadPetPhoto(
    userId: string,
    petId: string,
    image: File | Blob | string,
    index = 0,
    previousUrl?: string,
  ): Promise<string | null> {
    const uid = userId.replace(/^(owner-)+/, '').trim();
    const pid = petId.trim();
    if (!uid || !pid) { console.error('[storageBucketService] Missing userId or petId'); return null; }

    const cloudinaryUrl = await secureCloudinaryUpload('pet', pid, image, previousUrl);
    if (cloudinaryUrl) return cloudinaryUrl;

    const fb = await this.uploadMedia(`pets/${uid}/${pid}/${index > 0 ? `photo_${index}.jpg` : 'photo.jpg'}`, image);
    return fb ? fb.publicUrl : null;
  },

  /**
   * Missing-pet report photo → findlostpuppy/missing_pets/{reportId}/photo
   */
  async uploadMissingReportPhoto(
    reportId: string,
    image: File | Blob | string,
    index = 0,
    previousUrl?: string,
  ): Promise<string | null> {
    const rid = reportId.trim();
    if (!rid) { console.error('[storageBucketService] Missing reportId'); return null; }

    const cloudinaryUrl = await secureCloudinaryUpload('missing-report', rid, image, previousUrl);
    if (cloudinaryUrl) return cloudinaryUrl;

    const fb = await this.uploadMedia(`missing-reports/${rid}/${index > 0 ? `photo_${index}.jpg` : 'photo.jpg'}`, image);
    return fb ? fb.publicUrl : null;
  },

  /**
   * Community sighting photo → findlostpuppy/sightings_pets/{reportId}/photo
   */
  async uploadSightingPhoto(
    reportId: string,
    image: File | Blob | string,
    index = 0,
    previousUrl?: string,
  ): Promise<string | null> {
    const rid = reportId.trim();
    if (!rid) { console.error('[storageBucketService] Missing reportId'); return null; }

    const cloudinaryUrl = await secureCloudinaryUpload('sighting', rid, image, previousUrl);
    if (cloudinaryUrl) return cloudinaryUrl;

    const fb = await this.uploadMedia(`sightings/${rid}/${index > 0 ? `sighting_${index}.jpg` : 'sighting.jpg'}`, image);
    return fb ? fb.publicUrl : null;
  },

  // ---------------------------------------------------------------------------
  // Low-level upload (Firebase Storage fallback)
  // ---------------------------------------------------------------------------

  async uploadMedia(
    storagePath: string,
    fileOrBlob: File | Blob | string,
    expectedMime = 'image/jpeg',
  ): Promise<{ publicUrl: string; path: string } | null> {
    const blobData = await toBlob(fileOrBlob);
    if (!blobData?.blob) { console.warn('[storageBucketService] Invalid image data.'); return null; }

    const { blob, mimeType } = blobData;
    const allowed = ['profiles/', 'pets/', 'missing-reports/', 'sightings/'];
    if (!allowed.some((p) => storagePath.startsWith(p))) {
      console.error('[storageBucketService] Blocked path:', storagePath);
      return null;
    }

    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validMimes.includes((mimeType || expectedMime).toLowerCase())) {
      console.error('[storageBucketService] Invalid MIME:', mimeType);
      return null;
    }

    if (blob.size > 5 * 1024 * 1024) {
      console.error('[storageBucketService] Exceeds 5 MB.');
      return null;
    }

    if (storage && isFirebaseConfigured()) {
      try {
        const targetRef  = storageRef(storage, storagePath);
        const uploaded   = await uploadBytes(targetRef, blob, { contentType: mimeType || expectedMime });
        const publicUrl  = await getDownloadURL(uploaded.ref);
        return { publicUrl, path: uploaded.ref.fullPath };
      } catch (err) {
        console.error('[storageBucketService] Firebase Storage error:', err);
      }
    }

    console.warn('[storageBucketService] No storage backend available.');
    return null;
  },

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  /**
   * Deletes a Cloudinary or Firebase Storage asset.
   *
   * NOTE: when a user uploads a NEW photo, the old one is automatically replaced
   * via overwrite=1. You only need to call deleteMedia when removing a photo
   * entirely (no replacement).
   */
  async deleteMedia(urlOrPath: string): Promise<boolean> {
    if (!urlOrPath) return false;

    if (urlOrPath.includes('cloudinary.com') || urlOrPath.includes('res.cloudinary.com')) {
      return deleteFromCloudinary(urlOrPath);
    }

    if (
      storage &&
      isFirebaseConfigured() &&
      (urlOrPath.includes('firebasestorage') ||
        (!urlOrPath.startsWith('http') && !urlOrPath.startsWith('data:')))
    ) {
      try {
        const { ref, deleteObject } = await import('firebase/storage');
        await deleteObject(ref(storage, urlOrPath));
        return true;
      } catch (e) {
        console.warn('[storageBucketService] Firebase delete error:', e);
      }
    }

    return false;
  },

  // ---------------------------------------------------------------------------
  // Offline retry queue (no-op — all uploads are synchronous to Cloudinary)
  // ---------------------------------------------------------------------------

  getQueue(): QueuedMediaItem[] { return []; },
  enqueueItem(_item: Omit<QueuedMediaItem, 'id' | 'createdAt' | 'retryCount'>): boolean { return false; },
  removeFromQueue(_id: string): void {},
  clearQueue(): void { try { localStorage.removeItem(MEDIA_QUEUE_KEY); } catch {} },

  async flushQueue(): Promise<{ uploaded: number; pending: number }> {
    if (queueFlushPromise) return queueFlushPromise;
    queueFlushPromise = (async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return { uploaded: 0, pending: 0 };
      let uploaded = 0;
      const queue   = this.getQueue();
      const pending: QueuedMediaItem[] = [];
      for (const item of queue) {
        let publicUrl: string | null = item.uploadedUrl || null;
        try {
          if (!publicUrl && item.category === 'profile') {
            publicUrl = await this.uploadProfileAvatar(item.referenceId, item.base64Data, item.previousUrl);
          } else if (!publicUrl && item.category === 'pet' && item.ownerId) {
            publicUrl = await this.uploadPetPhoto(item.ownerId, item.referenceId, item.base64Data, item.index || 0, item.previousUrl);
          } else if (!publicUrl && item.category === 'missing-report') {
            publicUrl = await this.uploadMissingReportPhoto(item.referenceId, item.base64Data, item.index || 0, item.previousUrl);
          } else if (!publicUrl && item.category === 'sighting') {
            publicUrl = await this.uploadSightingPhoto(item.referenceId, item.base64Data, item.index || 0, item.previousUrl);
          }
        } catch {}
        if (publicUrl) {
          try { persistQueuedMediaUrl(item, publicUrl); } catch {}
          uploaded += 1;
          if (item.previousUrl) await this.deleteMedia(item.previousUrl).catch(() => false);
          window.dispatchEvent(new CustomEvent('findlostpuppy_media_uploaded', { detail: { ...item, publicUrl } }));
        } else if (item.retryCount + 1 < MAX_MEDIA_RETRY_COUNT) {
          pending.push({ ...item, retryCount: item.retryCount + 1 });
        }
      }
      return { uploaded, pending: pending.length };
    })();
    try { return await queueFlushPromise; } finally { queueFlushPromise = null; }
  },

  // ---------------------------------------------------------------------------
  // Admin helpers
  // ---------------------------------------------------------------------------

  async hardResetCloudinary(): Promise<boolean> {
    const result = await callMediaFunction<{ deleted: boolean }>('hardResetCloudinary', {
      confirmation: 'DELETE ALL FINDLOSTPUPPY MEDIA',
    });
    return result?.deleted === true;
  },

  async deleteMyAccountData(): Promise<boolean> {
    const result = await callMediaFunction<{ deleted: boolean }>('deleteMyAccount', {
      confirmation: 'DELETE',
    });
    return result?.deleted === true;
  },
};
