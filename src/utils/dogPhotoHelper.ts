import abulluImg from '../assets/abullu.jpg';
import sonuImg from '../assets/sonu.jpg';
import { storageService } from '../services/storageService';
import type { DogProfile, LostReport } from '../types';

/**
 * Dynamically resolves the dog's display name from pet profile or report
 */
export const getDogDisplayName = (
  dog?: Partial<DogProfile> | null,
  report?: Partial<LostReport> | null
): string => {
  if (dog?.name && dog.name.trim()) return dog.name.trim();
  if (report?.dog?.name && report.dog.name.trim()) return report.dog.name.trim();
  const ownerId = dog?.ownerId || report?.ownerId;
  if (ownerId) {
    const pet = storageService.getPetProfileByUserId(ownerId);
    if (pet?.name && pet.name.trim()) return pet.name.trim();
  }
  return 'My Pup';
};

/**
 * Dynamically resolves the best available pet image:
 * 1. dog.primaryPhoto (or sonuImg if name is Sonu and photo is missing/abullu)
 * 2. dog.photos[0]
 * 3. report.dog.primaryPhoto
 * 4. registered pet profile by ownerId
 * 5. abulluImg fallback
 */
export const getDogPhotoUrl = (
  dog?: Partial<DogProfile> | null,
  report?: Partial<LostReport> | null
): string => {
  const dogName = (dog?.name || report?.dog?.name || '').trim().toLowerCase();
  const reportId = (report?.id || '').toLowerCase();
  const isSonu = dogName === 'sonu' || reportId.includes('1788885000505') || (dog?.id || '').includes('1788871495754');

  if (dog?.primaryPhoto && typeof dog.primaryPhoto === 'string' && dog.primaryPhoto.trim().length > 5) {
    if (isSonu && (dog.primaryPhoto.includes('abullu') || dog.primaryPhoto === abulluImg)) {
      return sonuImg;
    }
    return dog.primaryPhoto.trim();
  }
  if (dog?.photos && Array.isArray(dog.photos) && dog.photos.length > 0) {
    const firstPhoto = dog.photos[0];
    if (firstPhoto && typeof firstPhoto === 'string' && firstPhoto.trim().length > 5) {
      if (isSonu && (firstPhoto.includes('abullu') || firstPhoto === abulluImg)) {
        return sonuImg;
      }
      return firstPhoto.trim();
    }
  }
  if (report?.dog?.primaryPhoto && typeof report.dog.primaryPhoto === 'string' && report.dog.primaryPhoto.trim().length > 5) {
    if (isSonu && (report.dog.primaryPhoto.includes('abullu') || report.dog.primaryPhoto === abulluImg)) {
      return sonuImg;
    }
    return report.dog.primaryPhoto.trim();
  }
  const ownerId = dog?.ownerId || report?.ownerId;
  if (ownerId) {
    const registeredPet = storageService.getPetProfileByUserId(ownerId);
    if (registeredPet?.primaryPhoto && typeof registeredPet.primaryPhoto === 'string' && registeredPet.primaryPhoto.trim().length > 5) {
      if (isSonu && (registeredPet.primaryPhoto.includes('abullu') || registeredPet.primaryPhoto === abulluImg)) {
        return sonuImg;
      }
      return registeredPet.primaryPhoto.trim();
    }
  }

  if (isSonu) {
    return sonuImg;
  }

  return abulluImg;
};

/**
 * Graceful image error handler to prevent broken image icons
 */
export const handleDogImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  const alt = (target.alt || '').toLowerCase();
  if (alt.includes('sonu')) {
    if (target.src !== sonuImg) {
      target.src = sonuImg;
    }
    return;
  }
  if (target.src !== abulluImg) {
    target.src = abulluImg;
  }
};
