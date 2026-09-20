import abulluImg from '../assets/abullu.jpg';
import sonuImg from '../assets/sonu.jpg';
import { storageService } from '../services/storageService';
import type { DogProfile, LostReport } from '../types';

/**
 * Tiered generic media resolver:
 * Tier 1 — Remote HTTPS/HTTP URL (Firebase Storage CDN, public URLs)
 * Tier 2 — Bundled/static assets (resolves correctly on localhost & GitHub Pages via import.meta.env.BASE_URL)
 * Tier 3 — Legacy Base64 data URL (data:image/...)
 * Tier 4 — Neutral fallback placeholder
 */
export const resolveGenericMediaUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') {
    return abulluImg;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return abulluImg;
  }

  // Tier 1 — Remote HTTPS/HTTP URL
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }

  // Tier 2 — Bundled static assets
  // 1. Direct bundled imports or legacy source paths
  if (trimmed === sonuImg || trimmed === '/src/assets/sonu.jpg' || trimmed.endsWith('/sonu.jpg')) {
    return sonuImg;
  }
  if (trimmed === abulluImg || trimmed === '/src/assets/abullu.jpg' || trimmed.endsWith('/abullu.jpg')) {
    return abulluImg;
  }

  // 2. Production build asset paths (e.g. /findlostpuppy/assets/... or /assets/...)
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

  // Tier 3 — Legacy Base64 Data URL (data:image/...)
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Tier 4 — Fallback for unrecognized or corrupted strings
  return abulluImg;
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
    if (candidate && typeof candidate === 'string' && candidate.trim().length > 5) {
      return resolveGenericMediaUrl(candidate);
    }
  }

  return abulluImg;
};

/**
 * Graceful image error handler to prevent broken image icons.
 * Fallbacks neutrally without inspecting dog names or record IDs.
 */
export const handleDogImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (target.src !== abulluImg) {
    target.src = abulluImg;
  }
};
