import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebaseConfig';
import { auth } from './firebaseConfig';

export const PET_MEDIA_BUCKET = 'pet-media';
export const MEDIA_QUEUE_KEY = 'findlostpuppy_media_queue_v1';
export const MAX_MEDIA_QUEUE_SIZE = 10;

const SECURE_CLOUDINARY_FUNCTIONS = import.meta.env.VITE_CLOUDINARY_SECURE_FUNCTIONS === 'true';
const MEDIA_WORKER_URL = String(import.meta.env.VITE_MEDIA_WORKER_URL || '').replace(/\/$/, '');

/** Re-encodes an image as JPEG with a maximum dimension of 1600 pixels, removing source metadata; returns null on failure. */
async function sanitizePublicImage(blob: Blob): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(blob);
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.84));
  } catch {
    return null;
  }
}

export interface QueuedMediaItem {
  id: string;
  category: 'profile' | 'pet' | 'missing-report' | 'sighting';
  referenceId: string; // userId, petId, or reportId
  ownerId?: string; // required for pet photos
  index?: number;
  base64Data: string;
  previousUrl?: string;
  createdAt: string;
  retryCount: number;
}

const generateRandomSuffix = (): string => Math.random().toString(36).substring(2, 9);

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

    // Skip signed-delivery signature, transformations, and version segment.
    while (segments.length > 0) {
      const seg = segments[0];
      if (/^v\d+$/.test(seg)) {
        segments.shift();
        break; // after version, everything remaining is public_id
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

    let path = segments.join('/');
    // Remove file extension
    path = path.replace(/\.[a-zA-Z0-9]+$/, '');
    return path;
  } catch {
    return null;
  }
}

/**
 * Converts a Base64 or Data URL string into a native Blob with MIME type.
 */
export function base64ToBlob(base64Data: string): { blob: Blob; mimeType: string } | null {
  try {
    let cleanBase64 = base64Data.trim();
    let mimeType = 'image/jpeg';

    if (cleanBase64.startsWith('data:')) {
      const parts = cleanBase64.split(',');
      const match = parts[0].match(/:(.*?);/);
      if (match && match[1]) {
        mimeType = match[1];
      }
      cleanBase64 = parts[1] || '';
    }

    if (!cleanBase64) return null;

    const byteCharacters = atob(cleanBase64);
    const arrayBuffer = new ArrayBuffer(byteCharacters.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteCharacters.length; i++) {
      uint8Array[i] = byteCharacters.charCodeAt(i);
    }

    return {
      blob: new Blob([arrayBuffer], { type: mimeType }),
      mimeType,
    };
  } catch (err) {
    console.warn('[storageBucketService] Failed to convert base64 to Blob:', err);
    return null;
  }
}

/**
 * Normalizes File, Blob, or Base64 string into a Blob.
 */
async function toBlob(input: File | Blob | string): Promise<{ blob: Blob; mimeType: string } | null> {
  if (typeof input === 'string') {
    return base64ToBlob(input);
  }
  if (input instanceof Blob) {
    return {
      blob: input,
      mimeType: input.type || 'image/jpeg',
    };
  }
  return null;
}

/** Calls a mapped media Worker endpoint with a Firebase ID token; returns null when unavailable or unsuccessful. */
async function callMediaFunction<T>(name: string, data: Record<string, unknown>): Promise<T | null> {
  if (!auth?.currentUser || !SECURE_CLOUDINARY_FUNCTIONS || !MEDIA_WORKER_URL) return null;
  try {
    const paths: Record<string, string> = {
      createMediaUploadAuthorization: '/media/authorize',
      finalizeMediaUpload: '/media/finalize',
      deleteMediaAsset: '/media/delete',
      hardResetCloudinary: '/media/reset',
      deleteMyAccount: '/account/media-cleanup',
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
  } catch (error) {
    if (import.meta.env.DEV) console.warn(`[media] ${name} failed`, error);
    return null;
  }
}

/** Sanitizes and uploads an image with server authorization, then finalizes it; returns its URL or null, and may reject on network errors. */
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
    const apiName = key === 'apiKey' ? 'api_key' : key;
    form.append(apiName, String(authorization[key]));
  }
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${authorization.cloudName}/image/upload`,
    { method: 'POST', body: form },
  );
  if (!response.ok) return null;
  const uploaded = await response.json();
  const finalized = await callMediaFunction<{ secureUrl: string }>('finalizeMediaUpload', {
    publicId: uploaded.public_id,
    category,
    referenceId,
    deliveryType: authorization.type,
    bytes: uploaded.bytes,
    format: uploaded.format,
    previousPublicId: extractCloudinaryPublicId(previousUrl || ''),
  });
  return finalized?.secureUrl || null;
}

export const storageBucketService = {
  /**
   * Generates a public HTTPS URL for an object stored in pet-media
   */
  getPublicUrl(path: string): string {
    return path;
  },

  /**
   * Core upload handler. Enforces:
   * - 5 MB size limit
   * - Allowed MIME types (JPEG, JPG, PNG, WebP)
   * - Unique paths with upsert: false
   */
  async uploadMedia(
    storagePath: string,
    fileOrBlob: File | Blob | string,
    expectedMime = 'image/jpeg'
  ): Promise<{ publicUrl: string; path: string } | null> {
    const blobData = await toBlob(fileOrBlob);
    if (!blobData || !blobData.blob) {
      console.warn('[storageBucketService] Invalid image data provided for upload.');
      return null;
    }

    const { blob, mimeType } = blobData;
    const finalMime = mimeType || expectedMime;

    // Strict path validation
    const allowedPrefixes = ['profiles/', 'pets/', 'missing-reports/', 'sightings/'];
    if (!allowedPrefixes.some(prefix => storagePath.startsWith(prefix))) {
      console.error(`[storageBucketService] Upload blocked. Path '${storagePath}' is unauthorized.`);
      return null;
    }

    // Validate MIME type
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validMimes.includes(finalMime.toLowerCase())) {
      console.error(`[storageBucketService] Disallowed MIME type: ${finalMime}. Only JPEG, PNG, and WebP are supported.`);
      return null;
    }

    // Client-side 5MB enforcement
    if (blob.size > 5 * 1024 * 1024) {
      console.error(`[storageBucketService] File exceeds 5MB limit (${(blob.size / 1024 / 1024).toFixed(2)} MB).`);
      return null;
    }

    if (!storage || !isFirebaseConfigured()) {
      console.warn('[storageBucketService] No cloud image storage is configured. Cannot upload media.');
      return null;
    }

    try {
      const targetRef = storageRef(storage, storagePath);
      const uploadResult = await uploadBytes(targetRef, blob, { contentType: finalMime });
      const publicUrl = await getDownloadURL(uploadResult.ref);
      return { publicUrl, path: uploadResult.ref.fullPath };
    } catch (err: any) {
      console.error('[storageBucketService] Upload exception:', err);
      return null;
    }
  },

  /**
   * Uploads user profile avatar to:
   * profiles/{user_id}/avatar.jpg
   */
  async uploadProfileAvatar(
    userId: string,
    image: File | Blob | string,
    previousUrl?: string,
  ): Promise<string | null> {
    const cleanUserId = userId.replace(/^(owner-)+/, '').trim();
    if (!cleanUserId) {
      console.error('[storageBucketService] Missing userId for profile avatar upload');
      return null;
    }

    if (SECURE_CLOUDINARY_FUNCTIONS) {
      return secureCloudinaryUpload('profile', cleanUserId, image, previousUrl);
    }
    const storagePath = `profiles/${cleanUserId}/avatar.jpg`;

    const result = await this.uploadMedia(storagePath, image);
    return result ? result.publicUrl : null;
  },

  /**
   * Uploads pet primary or gallery photo to:
   * pets/{user_id}/{pet_id}/photo_{index}.jpg
   */
  async uploadPetPhoto(
    userId: string,
    petId: string,
    image: File | Blob | string,
    index = 0,
    previousUrl?: string,
  ): Promise<string | null> {
    const cleanUserId = userId.replace(/^(owner-)+/, '').trim();
    const cleanPetId = petId.trim();

    if (!cleanUserId || !cleanPetId) {
      console.error('[storageBucketService] Missing userId or petId for pet photo upload');
      return null;
    }

    if (SECURE_CLOUDINARY_FUNCTIONS) {
      return secureCloudinaryUpload('pet', cleanPetId, image, previousUrl);
    }
    const storagePath = `pets/${cleanUserId}/${cleanPetId}/photo_${index}.jpg`;

    const result = await this.uploadMedia(storagePath, image);
    return result ? result.publicUrl : null;
  },

  /**
   * Uploads missing report photo to:
   * missing-reports/{report_id}/photo.jpg
   * (Report must exist in public.missing_reports to satisfy Storage RLS)
   */
  async uploadMissingReportPhoto(
    reportId: string,
    image: File | Blob | string,
    previousUrl?: string,
  ): Promise<string | null> {
    const cleanReportId = reportId.trim();
    if (!cleanReportId) {
      console.error('[storageBucketService] Missing reportId for missing report photo upload');
      return null;
    }

    if (SECURE_CLOUDINARY_FUNCTIONS) {
      return secureCloudinaryUpload('missing-report', cleanReportId, image, previousUrl);
    }
    const storagePath = `missing-reports/${cleanReportId}/photo.jpg`;

    const result = await this.uploadMedia(storagePath, image);
    return result ? result.publicUrl : null;
  },

  /**
   * Uploads guest or community sighting photo to:
   * sightings/{report_id}/sighting.jpg
   * (Works unauthenticated; {report_id} must exist in public.missing_reports)
   */
  async uploadSightingPhoto(
    reportId: string,
    image: File | Blob | string,
    previousUrl?: string,
  ): Promise<string | null> {
    const cleanReportId = reportId.trim();
    if (!cleanReportId) {
      console.error('[storageBucketService] Missing reportId for sighting photo upload');
      return null;
    }

    if (SECURE_CLOUDINARY_FUNCTIONS) {
      return secureCloudinaryUpload('sighting', cleanReportId, image, previousUrl);
    }
    const storagePath = `sightings/${cleanReportId}/sighting.jpg`;

    const result = await this.uploadMedia(storagePath, image);
    return result ? result.publicUrl : null;
  },

  // =========================================================================
  // BOUNDED OFFLINE / RETRY QUEUE
  // =========================================================================

  getQueue(): QueuedMediaItem[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(MEDIA_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  enqueueItem(item: Omit<QueuedMediaItem, 'id' | 'createdAt' | 'retryCount'>): boolean {
    if (typeof localStorage === 'undefined') return false;
    try {
      const queue = this.getQueue();
      if (queue.length >= MAX_MEDIA_QUEUE_SIZE) {
        console.warn(`[storageBucketService] Offline media queue is full (${MAX_MEDIA_QUEUE_SIZE} items). Preserving existing queue.`);
        return false;
      }

      const newItem: QueuedMediaItem = {
        ...item,
        id: `queue-${Date.now()}-${generateRandomSuffix()}`,
        createdAt: new Date().toISOString(),
        retryCount: 0,
      };

      queue.push(newItem);
      localStorage.setItem(MEDIA_QUEUE_KEY, JSON.stringify(queue));
      return true;
    } catch (err) {
      console.warn('[storageBucketService] Failed to enqueue media item:', err);
      return false;
    }
  },

  removeFromQueue(id: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const queue = this.getQueue().filter((item) => item.id !== id);
      localStorage.setItem(MEDIA_QUEUE_KEY, JSON.stringify(queue));
    } catch {}
  },

  /** Removes the persisted media retry queue when local storage is available. */
  clearQueue(): void {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(MEDIA_QUEUE_KEY);
  },

  /** Retries queued media, emits an event for each successful upload, and retains failures; returns uploaded and pending counts. */
  async flushQueue(): Promise<{ uploaded: number; pending: number }> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { uploaded: 0, pending: this.getQueue().length };
    }

    let uploaded = 0;
    const queue = this.getQueue();
    const pending: QueuedMediaItem[] = [];

    for (const item of queue) {
      let publicUrl: string | null = null;
      try {
        if (item.category === 'profile') {
          publicUrl = await this.uploadProfileAvatar(item.referenceId, item.base64Data, item.previousUrl);
        } else if (item.category === 'pet' && item.ownerId) {
          publicUrl = await this.uploadPetPhoto(item.ownerId, item.referenceId, item.base64Data, item.index || 0);
        } else if (item.category === 'missing-report') {
          publicUrl = await this.uploadMissingReportPhoto(item.referenceId, item.base64Data);
        } else if (item.category === 'sighting') {
          publicUrl = await this.uploadSightingPhoto(item.referenceId, item.base64Data);
        }
      } catch {}

      if (publicUrl) {
        uploaded += 1;
        window.dispatchEvent(new CustomEvent('findlostpuppy_media_uploaded', {
          detail: { ...item, publicUrl },
        }));
      } else {
        pending.push({ ...item, retryCount: item.retryCount + 1 });
      }
    }

    try {
      localStorage.setItem(MEDIA_QUEUE_KEY, JSON.stringify(pending));
    } catch {}
    return { uploaded, pending: pending.length };
  },

  /**
   * Deletes Firebase-managed media. Cloudinary deletion must be performed by an
   * authenticated server because its API secret must never ship in this client.
   */
  async deleteMedia(urlOrPath: string): Promise<boolean> {
    if (!urlOrPath) return false;

    if (urlOrPath.includes('cloudinary.com')) {
      const publicId = extractCloudinaryPublicId(urlOrPath);
      if (!publicId) return false;
      const result = await callMediaFunction<{ deleted: boolean }>('deleteMediaAsset', { publicId });
      return result?.deleted === true;
    }

    if (
      storage &&
      isFirebaseConfigured() &&
      (urlOrPath.includes('firebasestorage') || (!urlOrPath.startsWith('http') && !urlOrPath.startsWith('data:')))
    ) {
      try {
        const { ref, deleteObject } = await import('firebase/storage');
        const fileRef = ref(storage, urlOrPath);
        await deleteObject(fileRef);
        return true;
      } catch (e) {
        console.warn('[storageBucketService] Firebase Storage delete notice:', e);
      }
    }

    return false;
  },

  /** Requests an administrator-only Cloudinary reset with the required confirmation and returns whether it succeeded. */
  async hardResetCloudinary(): Promise<boolean> {
    const result = await callMediaFunction<{ deleted: boolean }>('hardResetCloudinary', {
      confirmation: 'DELETE ALL FINDLOSTPUPPY MEDIA',
    });
    return result?.deleted === true;
  },

  /** Requests hosted-media cleanup for the current account and returns whether the server confirmed deletion. */
  async deleteMyAccountData(): Promise<boolean> {
    const result = await callMediaFunction<{ deleted: boolean }>('deleteMyAccount', {
      confirmation: 'DELETE',
    });
    return result?.deleted === true;
  },
};
