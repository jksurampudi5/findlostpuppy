import type { PosterExtractionResult, AdoptionPet } from '../types';
import { maskPhoneNumber, maskEmail } from '../utils/privacyUtils';
import { storageService } from './storageService';
import { firebaseSyncService } from './firebaseSyncService';

/**
 * Service to communicate with backend adoption endpoints:
 * - POST /api/extract-pet-from-image
 * - POST /api/adoption-listings
 */
export const adoptionApiService = {
  /**
   * Calls backend endpoint POST /api/extract-pet-from-image
   */
  async extractPetFromImage(base64Image: string): Promise<PosterExtractionResult> {
    try {
      const response = await fetch('/api/extract-pet-from-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });

      if (response.ok) {
        const data = (await response.json()) as PosterExtractionResult;
        return data;
      }
    } catch (err) {
      console.warn('[adoptionApiService] /api/extract-pet-from-image error, using client fallback:', err);
    }

    // Client fallback: Return clean schema
    return {
      unreadable_text: false,
      pets: [],
      caretaker: { name: null, phone: null, email: null, contact_channel: null },
      location: { location_hint: null, state: null, district: null, mandal: null, village: null, pin_code: null },
    };
  },

  /**
   * Calls backend endpoint POST /api/adoption-listings
   * Writes all pets in one Firestore batch sharing listingGroupId
   */
  async saveAdoptionListings(params: {
    submissionId: string;
    pets: Partial<AdoptionPet>[];
    caretaker: { name: string; phone: string; email?: string };
    location: {
      state: string;
      district: string;
      mandal?: string;
      village?: string;
      city?: string;
      pinCode?: string;
      locationHint?: string;
      latitude?: number;
      longitude?: number;
    };
    flyerPhoto?: string;
    userId?: string;
  }): Promise<{ success: boolean; listingGroupId: string; pets: AdoptionPet[] }> {
    try {
      const response = await fetch('/api/adoption-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.pets)) {
          // Sync saved pets to local client cache so they immediately display in app
          for (const pet of data.pets) {
            storageService.addAdoptionPet(pet);
          }
          return data;
        }
      }
    } catch (err) {
      console.warn('[adoptionApiService] /api/adoption-listings error, using client-side batch fallback:', err);
    }

    // Client-side batch fallback
    const now = new Date().toISOString();
    const submissionId = params.submissionId || `ADOPT_GRP_${Date.now()}`;
    const maskedPhone = maskPhoneNumber(params.caretaker.phone);
    const maskedEmail = params.caretaker.email ? maskEmail(params.caretaker.email) : '';

    const createdPets: AdoptionPet[] = params.pets.map((p, idx) => {
      const existingMatch = storageService.findMatchingAdoptionPet({
        id: p.id,
        userId: params.userId,
        petName: p.petName,
        rawContactPhone: params.caretaker.phone,
        contactEmail: params.caretaker.email,
        flyerPhoto: params.flyerPhoto,
        listingGroupId: submissionId,
      });
      const petId = existingMatch?.id || p.id || `ADOPT-${Date.now()}-${idx + 1}`;
      const fullPet: AdoptionPet = {
        id: petId,
        listingGroupId: submissionId,
        userId: params.userId,
        petName: p.petName || `Pet ${idx + 1}`,
        breed: p.breed || 'Indie / Desi Dog',
        gender: p.gender || 'Male',
        age: p.age || 'Young',
        size: p.size || 'Medium (10-25kg)',
        photo: p.photo || params.flyerPhoto || '',
        photos: p.photos || (params.flyerPhoto ? [params.flyerPhoto] : []),
        flyerPhoto: params.flyerPhoto,
        isFlyerUpload: Boolean(params.flyerPhoto),
        description: p.description || 'Looking for a loving forever family.',
        healthNotes: p.healthNotes || '',
        vaccinated: typeof p.vaccinated === 'boolean' ? p.vaccinated : true,
        dewormed: typeof p.dewormed === 'boolean' ? p.dewormed : true,
        spayedOrNeutered: typeof p.spayedOrNeutered === 'boolean' ? p.spayedOrNeutered : false,
        state: params.location.state,
        district: params.location.district,
        mandal: params.location.mandal,
        village: params.location.village || params.location.city,
        city: params.location.city || params.location.village,
        pinCode: params.location.pinCode,
        locationHint: params.location.locationHint,
        contactName: params.caretaker.name,
        contactPhone: params.caretaker.phone || maskedPhone,
        contactEmail: params.caretaker.email || maskedEmail,
        rawContactPhone: params.caretaker.phone,
        rawContactEmail: params.caretaker.email,
        fieldConfidence: p.fieldConfidence,
        fieldSource: p.fieldSource,
        status: 'AVAILABLE',
        createdAt: existingMatch?.createdAt || now,
        updatedAt: now,
      };

      storageService.addAdoptionPet(fullPet);
      firebaseSyncService.syncAdoptionPet(fullPet).catch((e) => console.warn('[Firebase Sync Notice]:', e));
      return fullPet;
    });

    return {
      success: true,
      listingGroupId: submissionId,
      pets: createdPets,
    };
  },
};
