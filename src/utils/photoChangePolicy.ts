export const PHOTO_CHANGE_MONTHLY_LIMIT = 2;

export interface PhotoChangeTracking {
  photo?: string;
  primaryPhoto?: string;
  photoChangeMonth?: string;
  photoChangeCount?: number;
  photoLastChangedAt?: string;
  photoChangeApprovalRequired?: boolean;
}

export function getCurrentPhotoChangeMonth(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function canChangePhoto(record?: PhotoChangeTracking | null): {
  allowed: boolean;
  count: number;
  month: string;
  remaining: number;
  isInitialPhoto: boolean;
} {
  const month = getCurrentPhotoChangeMonth();
  const hasExistingPhoto = Boolean(record?.photo || record?.primaryPhoto);
  const count = record?.photoChangeMonth === month ? record?.photoChangeCount || 0 : 0;
  const isInitialPhoto = !hasExistingPhoto;
  const remaining = Math.max(0, PHOTO_CHANGE_MONTHLY_LIMIT - count);

  return {
    allowed: isInitialPhoto || count < PHOTO_CHANGE_MONTHLY_LIMIT,
    count,
    month,
    remaining,
    isInitialPhoto,
  };
}

export function applyPhotoChangeTracking<T extends PhotoChangeTracking>(
  record: T,
  existing?: PhotoChangeTracking | null
): T {
  const policy = canChangePhoto(existing);
  const nextCount = policy.isInitialPhoto ? 0 : policy.count + 1;
  return {
    ...record,
    photoChangeMonth: policy.month,
    photoChangeCount: nextCount,
    photoLastChangedAt: new Date().toISOString(),
    photoChangeApprovalRequired: nextCount >= PHOTO_CHANGE_MONTHLY_LIMIT,
  };
}
