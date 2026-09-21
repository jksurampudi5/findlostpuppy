import {
  doc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadString,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from './firebaseConfig';
import { storageBucketService } from './storageBucketService';
import type {
  OwnerProfile,
  DogProfile,
  LostReport,
  Sighting,
  AppSuggestion,
} from '../types';
import { isPetPhotoUrl } from '../utils/dogPhotoHelper';

export interface FirebaseSyncStatus {
  isConfigured: boolean;
  isOnline: boolean;
  lastSyncTime: string | null;
  syncedMembersCount: number;
  syncedPetsCount: number;
  syncedReportsCount: number;
  syncedSightingsCount: number;
  errorMessage: string | null;
}

let lastSyncTimestamp: string | null = null;
let lastSyncCounts = {
  members: 0,
  pets: 0,
  reports: 0,
  sightings: 0,
};
let lastSyncError: string | null = null;

const isInlineImage = (value?: string | null): boolean =>
  typeof value === 'string' && value.startsWith('data:image/');

const cloudPhotoOrEmpty = (value?: string | null): string =>
  value && !isInlineImage(value) ? value : '';

const uploadInlineImage = async (
  storagePath: string,
  imageData: string
): Promise<string> => {
  const cloudUpload = await storageBucketService.uploadMedia(storagePath, imageData);
  if (cloudUpload?.publicUrl) return cloudUpload.publicUrl;

  if (!storage) return '';
  const fallbackRef = storageRef(storage, storagePath);
  const uploadRes = await uploadString(fallbackRef, imageData, 'data_url');
  return getDownloadURL(uploadRes.ref);
};

export const firebaseSyncService = {
  isConfigured(): boolean {
    return isFirebaseConfigured();
  },

  getStatus(): FirebaseSyncStatus {
    return {
      isConfigured: isFirebaseConfigured(),
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      lastSyncTime: lastSyncTimestamp,
      syncedMembersCount: lastSyncCounts.members,
      syncedPetsCount: lastSyncCounts.pets,
      syncedReportsCount: lastSyncCounts.reports,
      syncedSightingsCount: lastSyncCounts.sightings,
      errorMessage: lastSyncError,
    };
  },

  async syncUserProfile(user: Partial<OwnerProfile> & { id: string; email: string; name?: string; avatar?: string; phone?: string; createdAt?: string }): Promise<boolean> {
    if (!db || !isFirebaseConfigured()) return false;
    try {
      const cleanUserId = (user.id || '').replace(/^owner-/, '');
      if (!cleanUserId) return false;

      let ownerAvatar = user.avatar || user.photo || '';
      if (ownerAvatar && isPetPhotoUrl(ownerAvatar)) ownerAvatar = '';
      if (ownerAvatar && isInlineImage(ownerAvatar)) {
        try {
          ownerAvatar = await uploadInlineImage(`profiles/${cleanUserId}/avatar.jpg`, ownerAvatar);
        } catch (uploadErr) {
          console.warn('[Cloud Image Storage] User avatar upload notice:', uploadErr);
          ownerAvatar = '';
        }
      }

      await setDoc(doc(db, 'profiles', cleanUserId), {
        id: cleanUserId,
        userId: cleanUserId,
        fullName: user.fullName || user.name || user.email.split('@')[0],
        email: user.email.toLowerCase().trim(),
        phone: user.phone || '',
        photo: ownerAvatar || null,
        photoChangeMonth: user.photoChangeMonth || null,
        photoChangeCount: user.photoChangeCount || 0,
        photoLastChangedAt: user.photoLastChangedAt || null,
        photoChangeApprovalRequired: user.photoChangeApprovalRequired || false,
        preferredContact: user.preferredContact || 'phone',
        address: user.address || '',
        state: user.state || '',
        district: user.district || '',
        mandalOrMunicipality: user.mandalOrMunicipality || '',
        city: user.city || '',
        pinCode: user.pinCode || '',
        updatedAt: new Date().toISOString(),
        createdAt: user.createdAt || new Date().toISOString(),
      }, { merge: true });
      return true;
    } catch (err: any) {
      console.warn('[Firebase] syncUserProfile error:', err);
      lastSyncError = err?.message || 'Error syncing user profile to Firebase';
      return false;
    }
  },

  /**
   * SCD Type 1: Sync a human owner profile to Firestore `profiles` collection.
   * Strictly overwrites in-place via merge: true.
   * STRICT SEPARATION: Pet photos are rejected from the owner profile.
   */
  async syncOwnerProfile(profile: OwnerProfile, userId: string): Promise<boolean> {
    if (!db || !isFirebaseConfigured()) return false;
    try {
      const cleanUserId = (userId || profile.userId || profile.id || '').replace(/^owner-/, '');
      if (!cleanUserId) return false;

      // Filter out any pet photos from owner document
      let ownerAvatar = profile.photo?.trim();
      if (ownerAvatar && isPetPhotoUrl(ownerAvatar)) {
        ownerAvatar = undefined;
      }

      // If owner uploaded a Base64 photo, store it in the configured cloud image store.
      if (ownerAvatar && isInlineImage(ownerAvatar)) {
        try {
          ownerAvatar = await uploadInlineImage(`profiles/${cleanUserId}/avatar.jpg`, ownerAvatar);
          profile.photo = ownerAvatar;
        } catch (uploadErr) {
          console.warn('[Cloud Image Storage] Owner avatar upload notice:', uploadErr);
          ownerAvatar = undefined;
        }
      }

      const fullAddress =
        [
          profile.streetOrLocality,
          profile.city,
          profile.mandalOrMunicipality,
          profile.district,
          profile.state,
        ]
          .filter(Boolean)
          .join(', ') || profile.address || '';

      const docRef = doc(db, 'profiles', cleanUserId);
      const payload: Record<string, any> = {
        id: cleanUserId,
        userId: cleanUserId,
        fullName: profile.fullName || 'Pet Parent',
        email: profile.email ? profile.email.toLowerCase().trim() : '',
        phone: profile.phone || '',
        photo: ownerAvatar || null,
        photoChangeMonth: profile.photoChangeMonth || null,
        photoChangeCount: profile.photoChangeCount || 0,
        photoLastChangedAt: profile.photoLastChangedAt || null,
        photoChangeApprovalRequired: profile.photoChangeApprovalRequired || false,
        preferredContact: profile.preferredContact || 'phone',
        address: fullAddress,
        state: profile.state || '',
        district: profile.district || '',
        mandalOrMunicipality: profile.mandalOrMunicipality || '',
        city: profile.city || '',
        pinCode: profile.pinCode || '',
        stateCode: profile.stateCode || null,
        districtCode: profile.districtCode || null,
        subDistrictCode: profile.subDistrictCode || null,
        localityCode: profile.localityCode || null,
        latitude: profile.latitude || null,
        longitude: profile.longitude || null,
        approximateArea: profile.approximateArea || '',
        hasLocationConsent: profile.hasLocationConsent ?? true,
        updatedAt: new Date().toISOString(),
      };

      // SCD1: Overwrite in-place without duplicating or splitting documents
      await setDoc(docRef, payload, { merge: true });
      return true;
    } catch (err: any) {
      console.warn('[Firebase] syncOwnerProfile error:', err);
      lastSyncError = err?.message || 'Error syncing owner profile to Firebase';
      return false;
    }
  },

  /**
   * SCD Type 1: Sync a pet profile to Firestore `pets` collection.
   * STRICT SEPARATION: Pet is its own document linked to ownerId.
   */
  async syncPet(pet: DogProfile): Promise<boolean> {
    if (!db || !isFirebaseConfigured()) return false;
    try {
      const cleanPetId = pet.id;
      const cleanOwnerId = (pet.ownerId || '').replace(/^owner-/, '');
      if (!cleanPetId) return false;

      let primaryPhoto = pet.primaryPhoto || '';
      // If photo is Base64 data URL, upload it to the configured cloud image store.
      if (isInlineImage(primaryPhoto)) {
        try {
          primaryPhoto = await uploadInlineImage(`pets/${cleanOwnerId || 'unknown-owner'}/${cleanPetId}/photo_0.jpg`, primaryPhoto);
          pet.primaryPhoto = primaryPhoto;
        } catch (uploadErr) {
          console.warn('[Cloud Image Storage] Pet photo upload notice:', uploadErr);
          primaryPhoto = '';
        }
      }

      const docRef = doc(db, 'pets', cleanOwnerId || cleanPetId);
      const payload: Record<string, any> = {
        id: cleanOwnerId || cleanPetId,
        petId: cleanPetId,
        ownerId: cleanOwnerId,
        name: pet.name,
        breed: pet.breed || 'Companion Pet',
        gender: pet.gender || 'Male',
        age: pet.age || '2 years',
        size: pet.size || 'Medium (10-25kg)',
        color: pet.color || '',
        distinguishingMarks: pet.distinguishingMarks || '',
        collarInfo: pet.collarInfo || '',
        primaryPhoto: cloudPhotoOrEmpty(primaryPhoto),
        photos: (pet.photos || (primaryPhoto ? [primaryPhoto] : [])).filter((photo) => !isInlineImage(photo)),
        photoChangeMonth: pet.photoChangeMonth || null,
        photoChangeCount: pet.photoChangeCount || 0,
        photoLastChangedAt: pet.photoLastChangedAt || null,
        photoChangeApprovalRequired: pet.photoChangeApprovalRequired || false,
        isLost: false,
        createdAt: pet.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // SCD1: Overwrite in-place
      await setDoc(docRef, payload, { merge: true });
      return true;
    } catch (err: any) {
      console.warn('[Firebase] syncPet error:', err);
      lastSyncError = err?.message || 'Error syncing pet to Firebase';
      return false;
    }
  },

  /**
   * SCD Type 1: Sync a missing pet emergency alert to Firestore `missing_reports` collection.
   */
  async syncLostReport(report: LostReport): Promise<boolean> {
    if (!db || !isFirebaseConfigured()) return false;
    try {
      const cleanReportId = report.id;
      const cleanOwnerId = (report.ownerId || '').replace(/^owner-/, '');
      if (!cleanReportId) return false;

      let reportPhoto = report.dog?.primaryPhoto || '';
      if (isInlineImage(reportPhoto)) {
        try {
          reportPhoto = await uploadInlineImage(`missing-reports/${cleanReportId}/photo.jpg`, reportPhoto);
          if (report.dog) report.dog.primaryPhoto = reportPhoto;
        } catch (uploadErr) {
          console.warn('[Cloud Image Storage] Report photo upload notice:', uploadErr);
          reportPhoto = '';
        }
      }

      const docRef = doc(db, 'missing_reports', cleanOwnerId || cleanReportId);
      const payload: Record<string, any> = {
        id: cleanOwnerId || cleanReportId,
        reportId: cleanReportId,
        dogId: report.dogId || report.dog?.id || cleanReportId,
        ownerId: cleanOwnerId,
        petName: report.dog?.name || 'Lost Dog',
        petBreed: report.dog?.breed || 'Companion Pet',
        petPhoto: cloudPhotoOrEmpty(reportPhoto),
        ownerApproximateLocation: report.ownerApproximateLocation || '',
        lastKnownLocation: report.lastKnownLocation || '',
        lastKnownLatitude: report.lastKnownLatitude || null,
        lastKnownLongitude: report.lastKnownLongitude || null,
        dateLost: report.dateLost || new Date().toISOString().slice(0, 10),
        timeLost: report.timeLost || '12:00 PM',
        additionalNotes: report.additionalNotes || '',
        status: report.status === 'SAFE' ? 'SAFE' : 'LOST',
        contactMechanism: {
          showPhone: report.contactMechanism?.showPhone ?? true,
          showEmail: report.contactMechanism?.showEmail ?? true,
          safeContactPhone: report.contactMechanism?.safeContactPhone || '',
          safeContactEmail: report.contactMechanism?.safeContactEmail || '',
          contactNote: report.contactMechanism?.contactNote || '',
        },
        sightingCount: report.sightingCount || 0,
        createdAt: report.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // SCD1: Overwrite in-place
      await setDoc(docRef, payload, { merge: true });
      return true;
    } catch (err: any) {
      console.warn('[Firebase] syncLostReport error:', err);
      lastSyncError = err?.message || 'Error syncing report to Firebase';
      return false;
    }
  },

  /**
   * SCD Type 1: Sync a community sighting to Firestore `sightings` collection.
   */
  async syncSighting(sighting: Sighting): Promise<boolean> {
    if (!db || !isFirebaseConfigured()) return false;
    try {
      const cleanSightingId = sighting.id;
      if (!cleanSightingId) return false;

      let photoUrl = sighting.photo || '';
      if (isInlineImage(photoUrl) && sighting.reportId) {
        try {
          photoUrl = await uploadInlineImage(`sightings/${sighting.reportId}/${cleanSightingId}.jpg`, photoUrl);
          sighting.photo = photoUrl;
        } catch (uploadErr) {
          console.warn('[Cloud Image Storage] Sighting photo upload notice:', uploadErr);
          photoUrl = '';
        }
      }

      const docRef = doc(db, 'sightings', cleanSightingId);
      const payload: Record<string, any> = {
        id: cleanSightingId,
        reportId: sighting.reportId || '',
        dogName: sighting.dogName || 'Lost Dog',
        date: sighting.date || new Date().toISOString().slice(0, 10),
        time: sighting.time || '12:00 PM',
        location: sighting.location || '',
        description: sighting.description || '',
        photo: cloudPhotoOrEmpty(photoUrl) || null,
        state: sighting.state || '',
        district: sighting.district || '',
        mandal: sighting.mandal || '',
        village: sighting.village || '',
        pinCode: sighting.pinCode || '',
        latitude: sighting.latitude || null,
        longitude: sighting.longitude || null,
        reporterName: sighting.reporterName || 'Anonymous',
        reporterPhone: sighting.reporterPhone || null,
        reporterEmail: sighting.reporterEmail || null,
        reporterUserId: sighting.reporterUserId || null,
        isGuest: sighting.isGuest ?? false,
        isCurrent: sighting.isCurrent ?? true,
        validFrom: sighting.validFrom || sighting.createdAt || new Date().toISOString(),
        validTo: sighting.validTo || null,
        version: sighting.version || 1,
        createdAt: sighting.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, payload, { merge: true });
      return true;
    } catch (err: any) {
      console.warn('[Firebase] syncSighting error:', err);
      lastSyncError = err?.message || 'Error syncing sighting to Firebase';
      return false;
    }
  },

  /**
   * Pull all cloud records from Firestore collections.
   */
  async fetchAllCloudData(): Promise<{
    profiles: any[];
    pets: any[];
    reports: any[];
    sightings: any[];
  } | null> {
    if (!db || !isFirebaseConfigured()) return null;
    try {
      const [profilesSnap, petsSnap, reportsSnap, sightingsSnap] = await Promise.all([
        getDocs(collection(db, 'profiles')),
        getDocs(collection(db, 'pets')),
        getDocs(collection(db, 'missing_reports')),
        getDocs(collection(db, 'sightings')),
      ]);

      const profiles = profilesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const pets = petsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const reports = reportsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const sightings = sightingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      lastSyncTimestamp = new Date().toISOString();
      lastSyncCounts = {
        members: profiles.length,
        pets: pets.length,
        reports: reports.length,
        sightings: sightings.length,
      };
      lastSyncError = null;

      return { profiles, pets, reports, sightings };
    } catch (err: any) {
      console.warn('[Firebase] fetchAllCloudData error:', err);
      lastSyncError = err?.message || 'Error fetching cloud data from Firebase';
      return null;
    }
  },

  /**
   * Delete a pet record as admin from Firestore.
   */
  async deletePetAsAdmin(petId: string): Promise<boolean> {
    if (!db || !isFirebaseConfigured()) return false;
    try {
      if (petId === '*') {
        const profilesSnap = await getDocs(collection(db, 'profiles'));
        const petsSnap = await getDocs(collection(db, 'pets'));
        const reportsSnap = await getDocs(collection(db, 'missing_reports'));
        const sightingsSnap = await getDocs(collection(db, 'sightings'));
        const suggestionsSnap = await getDocs(collection(db, 'app_suggestions'));

        const deletePromises: Promise<any>[] = [];
        profilesSnap.docs.forEach((d) => deletePromises.push(deleteDoc(d.ref)));
        petsSnap.docs.forEach((d) => {
          if (d.id !== 'pet-1788871495754') deletePromises.push(deleteDoc(d.ref));
        });
        reportsSnap.docs.forEach((d) => {
          if (d.id !== 'LOST-1788885000505') deletePromises.push(deleteDoc(d.ref));
        });
        sightingsSnap.docs.forEach((d) => deletePromises.push(deleteDoc(d.ref)));
        suggestionsSnap.docs.forEach((d) => deletePromises.push(deleteDoc(d.ref)));

        await Promise.allSettled(deletePromises);
        return true;
      }

      await deleteDoc(doc(db, 'pets', petId));
      return true;
    } catch (err: any) {
      console.warn('[Firebase] deletePetAsAdmin error:', err);
      return false;
    }
  },

  async deleteUserAsAdmin(userId: string): Promise<boolean> {
    if (!db || !isFirebaseConfigured()) return false;
    try {
      await Promise.all([
        deleteDoc(doc(db, 'profiles', userId)),
        deleteDoc(doc(db, 'pets', userId)),
        deleteDoc(doc(db, 'missing_reports', userId)),
      ]);
      return true;
    } catch (err: any) {
      console.warn('[Firebase] deleteUserAsAdmin error:', err);
      return false;
    }
  },

  async deleteUserDataByEmail(email: string): Promise<boolean> {
    if (!db || !isFirebaseConfigured()) return false;
    try {
      const target = email.toLowerCase().trim();
      const data = await this.fetchAllCloudData();
      const profile = data?.profiles.find((p: any) => p.email?.toLowerCase?.().trim() === target);
      if (!profile?.id) return false;
      return this.deleteUserAsAdmin(profile.id);
    } catch (err: any) {
      console.warn('[Firebase] deleteUserDataByEmail error:', err);
      return false;
    }
  },

  async deleteLostReport(reportId: string, petId?: string): Promise<boolean> {
    if (!db || !isFirebaseConfigured()) return false;
    try {
      const reportsSnap = await getDocs(collection(db, 'missing_reports'));
      const sightingsSnap = await getDocs(collection(db, 'sightings'));
      const deletePromises: Promise<any>[] = [];
      reportsSnap.docs.forEach((d) => {
        const data: any = d.data();
        if (d.id === reportId || data.reportId === reportId || data.dogId === petId) deletePromises.push(deleteDoc(d.ref));
      });
      sightingsSnap.docs.forEach((d) => {
        const data: any = d.data();
        if (data.reportId === reportId || data.reportId === petId) deletePromises.push(deleteDoc(d.ref));
      });
      await Promise.allSettled(deletePromises);
      return true;
    } catch (err: any) {
      console.warn('[Firebase] deleteLostReport error:', err);
      return false;
    }
  },

  async deleteSightingAsAdmin(sightingId: string): Promise<boolean> {
    if (!db || !isFirebaseConfigured()) return false;
    try {
      await deleteDoc(doc(db, 'sightings', sightingId));
      return true;
    } catch (err: any) {
      console.warn('[Firebase] deleteSightingAsAdmin error:', err);
      return false;
    }
  },

  async updatePetSafetyStatus(petId: string, isLost: boolean): Promise<boolean> {
    if (!db || !isFirebaseConfigured()) return false;
    try {
      const reportsSnap = await getDocs(collection(db, 'missing_reports'));
      const updates = reportsSnap.docs
        .filter((d) => {
          const data: any = d.data();
          return data.dogId === petId || data.petId === petId || d.id === petId;
        })
        .map((d) => setDoc(d.ref, { status: isLost ? 'LOST' : 'SAFE', updatedAt: new Date().toISOString() }, { merge: true }));
      await Promise.allSettled(updates);
      return true;
    } catch (err: any) {
      console.warn('[Firebase] updatePetSafetyStatus error:', err);
      return false;
    }
  },

  async syncSuggestion(suggestion: AppSuggestion): Promise<boolean> {
    if (!db || !isFirebaseConfigured()) return false;
    try {
      let screenshotUrl = suggestion.screenshotData || '';
      if (isInlineImage(screenshotUrl)) {
        try {
          screenshotUrl = await uploadInlineImage(`suggestions/${suggestion.id}/screen.jpg`, screenshotUrl);
        } catch (uploadErr) {
          console.warn('[Cloud Image Storage] Suggestion screenshot upload notice:', uploadErr);
          screenshotUrl = '';
        }
      }
      await setDoc(doc(db, 'app_suggestions', suggestion.id), {
        ...suggestion,
        screenshotData: screenshotUrl || null,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return true;
    } catch (err: any) {
      console.warn('[Firebase] syncSuggestion error:', err);
      return false;
    }
  },
};
