import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebaseConfig';

export const PET_MEDIA_BUCKET = 'pet-media';
export const MEDIA_QUEUE_KEY = 'findlostpuppy_media_queue_v1';
export const MAX_MEDIA_QUEUE_SIZE = 10;

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
const CLOUDINARY_FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || 'findlostpuppy';

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
        const fileName = `${cloudPath.split('/').pop() || `image_${Date.now()}`}.jpg`;
        const folderPrefix = cleanCloudPath(CLOUDINARY_FOLDER);
        const folder = `${folderPrefix}/${cloudPath.split('/').slice(0, -1).join('/')}`.replace(/\/+$/g, '');

        formData.append('file', blob, fileName);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        if (folder) formData.append('folder', folder);
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
          publicUrl,
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
   * profiles/{user_id}/avatar_{timestamp}_{random}.jpg
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

    const timestamp = Date.now();
    const random = generateRandomSuffix();
    const storagePath = `profiles/${cleanUserId}/avatar_${timestamp}_${random}.jpg`;

    const result = await this.uploadMedia(storagePath, image);
    return result ? result.publicUrl : null;
  },

  /**
   * Uploads pet primary or gallery photo to:
   * pets/{user_id}/{pet_id}/photo_{timestamp}_{index}_{random}.jpg
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

    const timestamp = Date.now();
    const random = generateRandomSuffix();
    const storagePath = `pets/${cleanUserId}/${cleanPetId}/photo_${timestamp}_${index}_${random}.jpg`;

    const result = await this.uploadMedia(storagePath, image);
    return result ? result.publicUrl : null;
  },

  /**
   * Uploads missing report photo to:
   * missing-reports/{report_id}/photo_{timestamp}_{random}.jpg
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

    const timestamp = Date.now();
    const random = generateRandomSuffix();
    const storagePath = `missing-reports/${cleanReportId}/photo_${timestamp}_${random}.jpg`;

    const result = await this.uploadMedia(storagePath, image);
    return result ? result.publicUrl : null;
  },

  /**
   * Uploads guest or community sighting photo to:
   * sightings/{report_id}/sighting_{timestamp}_{random}.jpg
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

    const timestamp = Date.now();
    const random = generateRandomSuffix();
    const storagePath = `sightings/${cleanReportId}/sighting_${timestamp}_${random}.jpg`;

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
};
