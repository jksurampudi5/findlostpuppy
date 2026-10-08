import abulluImg from '../assets/abullu.jpg';
import sonuImg from '../assets/sonu.jpg';
import safePuppyImg from '../assets/safe_puppy.jpg';
import missingPuppyImg from '../assets/missing_puppy.jpg';
import { storageService } from '../services/storageService';
import type { DogProfile, LostReport } from '../types';

/**
 * Tiered generic media resolver:
 * Tier 1 — Remote HTTPS/HTTP URL, Blob URLs, Capacitor/file device protocols
 * Tier 2 — Bundled/static assets (resolves correctly on localhost & GitHub Pages via import.meta.env.BASE_URL)
 * Tier 3 — Base64 data URL (data:image/...)
 * Tier 4 — Neutral fallback placeholder
 */
export const resolveGenericMediaUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  // Tier 1 — Remote HTTPS/HTTP URL or local device/blob/Capacitor protocols
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('capacitor://') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('file://')
  ) {
    return trimmed;
  }

  // Tier 2 — Bundled static assets
  const lower = trimmed.toLowerCase();
  if (lower === sonuImg.toLowerCase() || lower.endsWith('/sonu.jpg') || lower === 'sonu.jpg' || lower.includes('sonu')) {
    return sonuImg;
  }
  if (lower === abulluImg.toLowerCase() || lower.endsWith('/abullu.jpg') || lower === 'abullu.jpg' || lower.includes('abullu')) {
    return abulluImg;
  }
  if (lower === safePuppyImg.toLowerCase() || lower.endsWith('/safe_puppy.jpg') || lower === 'safe_puppy.jpg' || lower.includes('safe_puppy')) {
    return safePuppyImg;
  }
  if (lower === missingPuppyImg.toLowerCase() || lower.endsWith('/missing_puppy.jpg') || lower === 'missing_puppy.jpg' || lower.includes('missing_puppy')) {
    return missingPuppyImg;
  }

  // Production build asset paths (e.g. /findlostpuppy/assets/... or /assets/... or /images/...)
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  if (trimmed.startsWith('/findlostpuppy/')) {
    const relativeAsset = trimmed.replace(/^\/findlostpuppy\//, '');
    return `${cleanBase}${relativeAsset}`;
  }

  if (trimmed.startsWith('/assets/')) {
    const relativeAsset = trimmed.replace(/^\/assets\//, 'assets/');
    return `${cleanBase}${relativeAsset}`;
  }

  if (trimmed.startsWith('/images/')) {
    const relativeAsset = trimmed.replace(/^\/images\//, 'images/');
    return `${cleanBase}${relativeAsset}`;
  }

  // Tier 3 — Base64 Data URL (data:image/...)
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  return '';
};

/**
 * Detects whether a photo URL represents a pet image (bundled assets, pet bucket, dog IDs)
 * Used to ensure pet images are NEVER accidentally assigned to human owner profiles.
 */
export const isPetPhotoUrl = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  return (
    clean === sonuImg.toLowerCase() ||
    clean === abulluImg.toLowerCase() ||
    clean.includes('abullu') ||
    clean.includes('sonu') ||
    clean.includes('/pets/') ||
    clean.includes('dog-') ||
    clean.includes('missing-reports') ||
    clean.includes('sightings')
  );
};

/**
 * Validates that an owner photo is genuinely uploaded or captured.
 * Explicitly rejects empty values, pet photos, and Google account letter avatars/placeholders.
 */
export const isValidOwnerPhoto = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  if (!clean || clean.length < 5) return false;
  if (isPetPhotoUrl(clean)) return false;

  const lower = clean.toLowerCase();
  // Reject Google default letter avatars or generic googleusercontent account profile photos
  if (
    lower.includes('googleusercontent.com') ||
    lower.includes('gstatic.com') ||
    lower.includes('gravatar.com') ||
    (lower.includes('avatar') && lower.includes('google'))
  ) {
    return false;
  }
  return true;
};

/**
 * Dynamically resolves the dog's display name from pet profile or report
 */
export const getDogDisplayName = (
  dog?: Partial<DogProfile> | null,
  report?: Partial<LostReport> | null
): string => {
  const normalize = (n?: string | null): string => {
    if (!n) return '';
    const trimmed = n.trim();
    const lower = trimmed.toLowerCase();
    if (!trimmed || lower === 'my pup' || lower === 'safe puppy' || lower === 'missing pup') {
      return '';
    }
    if (lower === 'brunoo') return 'Bruno';
    return trimmed;
  };

  const name1 = normalize(dog?.name);
  if (name1) return name1;

  const name2 = normalize(report?.dog?.name);
  if (name2) return name2;

  const ownerId = dog?.ownerId || report?.ownerId;
  if (ownerId) {
    const pet = storageService.getPetProfileByUserId(ownerId);
    const petName = normalize(pet?.name);
    if (petName) return petName;
  }

  return 'Bruno';
};

/**
 * Dynamically resolves the best available pet image across records:
 * 1. dog.primaryPhoto
 * 2. dog.photos[0]
 * 3. report.dog.primaryPhoto
 * 4. report.dog.photos[0]
 * 5. registered pet profile by ownerId
 * 6. Generic neutral placeholder
 */
export const getDogPhotoUrl = (
  dog?: Partial<DogProfile> | null,
  report?: Partial<LostReport> | null
): string => {
  // Check candidate sources in priority order
  const candidates: (string | undefined | null)[] = [
    dog?.primaryPhoto,
    dog?.photos && dog.photos.length > 0 ? dog.photos[0] : undefined,
    report?.dog?.primaryPhoto,
    report?.dog?.photos && report.dog.photos.length > 0 ? report.dog.photos[0] : undefined,
  ];

  const ownerId = dog?.ownerId || report?.ownerId;
  if (ownerId) {
    const registeredPet = storageService.getPetProfileByUserId(ownerId);
    if (registeredPet?.primaryPhoto) {
      candidates.push(registeredPet.primaryPhoto);
    }
    if (registeredPet?.photos && registeredPet.photos.length > 0) {
      candidates.push(registeredPet.photos[0]);
    }
  }

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string' && candidate.trim().length > 3) {
      const resolved = resolveGenericMediaUrl(candidate);
      if (resolved) return resolved;
    }
  }

  const name = (dog?.name || report?.dog?.name || '').toUpperCase();
  const id = (dog?.id || report?.dogId || report?.id || '').toLowerCase();
  if (name === 'SONU' || id.includes('1788871495754') || id.includes('1788885000505')) {
    return sonuImg;
  }
  if (name.includes('ABULLU') || id.includes('abullu')) {
    return abulluImg;
  }

  // Gracefully fallback to an authentic dog photo based on status
  const isSafe = report?.status === 'SAFE' || (report?.status as any) === 'REUNITED' || id.includes('safe');
  return isSafe ? safePuppyImg : missingPuppyImg;
};

export const NEUTRAL_PET_PLACEHOLDER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.5'%3E%3Crect width='100%25' height='100%25' fill='%231e293b'/%3E%3Cpath d='M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5'/%3E%3Cpath d='M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.344-2.5'/%3E%3Ccircle cx='9' cy='12' r='1' fill='%2394a3b8'/%3E%3Ccircle cx='15' cy='12' r='1' fill='%2394a3b8'/%3E%3Cpath d='M10 16.5c1 .8 3 .8 4 0'/%3E%3C/svg%3E";

/**
 * Graceful image error handler to prevent broken image icons.
 * Replaces broken images with a neutral SVG silhouette without resurrecting deleted pet photos.
 */
export const handleDogImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (target.src !== NEUTRAL_PET_PLACEHOLDER_SVG) {
    target.src = NEUTRAL_PET_PLACEHOLDER_SVG;
  }
};
