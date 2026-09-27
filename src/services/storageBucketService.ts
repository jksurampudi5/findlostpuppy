import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebaseConfig';

export const PET_MEDIA_BUCKET = 'pet-media';
export const MEDIA_QUEUE_KEY = 'findlostpuppy_media_queue_v1';
export const MAX_MEDIA_QUEUE_SIZE = 10;

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
const CLOUDINARY_FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || 'findlostpuppy';
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY || '675289426463557';
const CLOUDINARY_API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET || 'RwlakSEuC9sDDQ0bcCpbxiuzl7Q';

export const isCloudImageStorageConfigured = (): boolean =>
  Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);

export interface QueuedMediaItem {
  id: string;
  category: 'profile' | 'pet' | 'missing-report' | 'sighting';
  referenceId: string; // userId, petId, or reportId
  ownerId?: string; // required for pet photos
  index?: number;
  base64Data: string;
  createdAt: string;
  retryCount: number;
}

const generateRandomSuffix = (): string => Math.random().toString(36).substring(2, 9);

const cleanCloudPath = (path: string): string =>
  path
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-zA-Z0-9/_-]/g, '_')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '');

async function sha1Hex(message: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return '';
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
    const uploadIndex = cleanUrl.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    const afterUpload = cleanUrl.substring(uploadIndex + '/upload/'.length);
    const segments = afterUpload.split('/');

    // Skip transformation segments and version segment (v12345678)
    while (segments.length > 0) {
      const seg = segments[0];
      if (/^v\d+$/.test(seg)) {
        segments.shift();
        break; // after version, everything remaining is public_id
      } else if (
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

    if (isCloudImageStorageConfigured()) {
      try {
        const formData = new FormData();
        const cloudPath = cleanCloudPath(storagePath);
        const fileName = `${cloudPath.split('/').pop() || 'image'}_${Date.now()}.jpg`;
        const folderPrefix = cleanCloudPath(CLOUDINARY_FOLDER);
        const folder = `${folderPrefix}/${cloudPath.split('/').slice(0, -1).join('/')}`.replace(/\/+$/g, '');
        // Append Date.now() to publicId to ensure it is unique. Cloudinary unsigned uploads 
        // without 'overwrite' permission will otherwise ignore the new image and return the old one.
        const baseName = cloudPath.split('/').pop() || 'image';
        const publicId = `${baseName}_${Date.now()}`;

        formData.append('file', blob, fileName);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        if (folder) formData.append('folder', folder);
        formData.append('public_id', publicId);
        formData.append('tags', 'findlostpuppy,user-generated');

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn('[storageBucketService] Cloudinary upload failed:', errorText);
          return null;
        }

        const result = await response.json();
        const publicUrl = result.secure_url || result.url;
        if (!publicUrl) {
          console.warn('[storageBucketService] Cloudinary upload did not return a URL.');
          return null;
        }

        return {
          publicUrl: `${publicUrl}?t=${Date.now()}`,
          path: result.public_id || cloudPath,
        };
      } catch (err: any) {
        console.error('[storageBucketService] Cloudinary upload exception:', err);
        return null;
      }
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
    image: File | Blob | string
  ): Promise<string | null> {
    const cleanUserId = userId.replace(/^(owner-)+/, '').trim();
    if (!cleanUserId) {
      console.error('[storageBucketService] Missing userId for profile avatar upload');
      return null;
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
    index = 0
  ): Promise<string | null> {
    const cleanUserId = userId.replace(/^(owner-)+/, '').trim();
    const cleanPetId = petId.trim();

    if (!cleanUserId || !cleanPetId) {
      console.error('[storageBucketService] Missing userId or petId for pet photo upload');
      return null;
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
    image: File | Blob | string
  ): Promise<string | null> {
    const cleanReportId = reportId.trim();
    if (!cleanReportId) {
      console.error('[storageBucketService] Missing reportId for missing report photo upload');
      return null;
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
    image: File | Blob | string
  ): Promise<string | null> {
    const cleanReportId = reportId.trim();
    if (!cleanReportId) {
      console.error('[storageBucketService] Missing reportId for sighting photo upload');
      return null;
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

  /**
   * Deletes an image from Cloudinary using signed destroy API.
   */
  async deleteCloudinaryMedia(urlOrPublicId: string): Promise<boolean> {
    if (!urlOrPublicId) return false;
    const cloudName = CLOUDINARY_CLOUD_NAME || 'ymrxc4mq';
    const apiKey = CLOUDINARY_API_KEY;
    const apiSecret = CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) return false;

    let publicId = urlOrPublicId;
    if (urlOrPublicId.includes('cloudinary.com') || urlOrPublicId.startsWith('http')) {
      const extracted = extractCloudinaryPublicId(urlOrPublicId);
      if (!extracted) {
        console.warn('[storageBucketService] Could not parse Cloudinary public_id from:', urlOrPublicId);
        return false;
      }
      publicId = extracted;
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const strToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
      const signature = await sha1Hex(strToSign);
      if (!signature) {
        console.warn('[storageBucketService] Could not generate SHA-1 signature for Cloudinary destroy');
        return false;
      }

      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('timestamp', timestamp);
      formData.append('api_key', apiKey);
      formData.append('signature', signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        console.warn('[storageBucketService] Cloudinary destroy error response:', text);
        return false;
      }

      const json = await res.json();
      console.log('[storageBucketService] Cloudinary image destroyed successfully:', publicId, json);
      return json.result === 'ok';
    } catch (err) {
      console.warn('[storageBucketService] Failed to destroy Cloudinary image:', err);
      return false;
    }
  },

  /**
   * Universal media deletion handler. Cleans up from Cloudinary and Firebase Storage.
   */
  async deleteMedia(urlOrPath: string): Promise<boolean> {
    if (!urlOrPath) return false;

    // 1. Cloudinary image deletion
    if (
      urlOrPath.includes('cloudinary.com') ||
      urlOrPath.includes('findlostpuppy/') ||
      (!urlOrPath.startsWith('http') && !urlOrPath.startsWith('data:') && !urlOrPath.startsWith('/'))
    ) {
      const cloudSuccess = await this.deleteCloudinaryMedia(urlOrPath);
      if (cloudSuccess) return true;
    }

    // 2. Firebase Storage deletion fallback
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
};

