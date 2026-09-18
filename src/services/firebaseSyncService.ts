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
import type {
  OwnerProfile,
  DogProfile,
  LostReport,
  Sighting,
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

      // If owner uploaded a Base64 photo, store in Firebase Storage under users/{userId}/avatar.jpg
      if (ownerAvatar?.startsWith('data:') && storage) {
        try {
          const avatarStorageRef = storageRef(storage, `users/${cleanUserId}/avatar_${Date.now()}.jpg`);
          const uploadRes = await uploadString(avatarStorageRef, ownerAvatar, 'data_url');
          ownerAvatar = await getDownloadURL(uploadRes.ref);
          profile.photo = ownerAvatar;
        } catch (uploadErr) {
          console.warn('[Firebase Storage] Owner avatar upload notice:', uploadErr);
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
      // If photo is Base64 data URL, upload to Firebase Storage under pets/{petId}/
      if (primaryPhoto.startsWith('data:') && storage) {
        try {
          const petStorageRef = storageRef(storage, `pets/${cleanPetId}/photo_${Date.now()}.jpg`);
          const uploadRes = await uploadString(petStorageRef, primaryPhoto, 'data_url');
          primaryPhoto = await getDownloadURL(uploadRes.ref);
          pet.primaryPhoto = primaryPhoto;
        } catch (uploadErr) {
          console.warn('[Firebase Storage] Pet photo upload notice:', uploadErr);
        }
      }

      const docRef = doc(db, 'pets', cleanPetId);
      const payload: Record<string, any> = {
        id: cleanPetId,
        ownerId: cleanOwnerId,
        name: pet.name,
        breed: pet.breed || 'Companion Pet',
        gender: pet.gender || 'Male',
        age: pet.age || '2 years',
        size: pet.size || 'Medium (10-25kg)',
        color: pet.color || '',
        distinguishingMarks: pet.distinguishingMarks || '',
        collarInfo: pet.collarInfo || '',
        primaryPhoto: primaryPhoto,
        photos: pet.photos || (primaryPhoto ? [primaryPhoto] : []),
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
      if (reportPhoto.startsWith('data:') && storage) {
        try {
          const reportStorageRef = storageRef(storage, `reports/${cleanReportId}/photo_${Date.now()}.jpg`);
          const uploadRes = await uploadString(reportStorageRef, reportPhoto, 'data_url');
          reportPhoto = await getDownloadURL(uploadRes.ref);
          if (report.dog) report.dog.primaryPhoto = reportPhoto;
        } catch (uploadErr) {
          console.warn('[Firebase Storage] Report photo upload notice:', uploadErr);
        }
      }

      const docRef = doc(db, 'missing_reports', cleanReportId);
      const payload: Record<string, any> = {
        id: cleanReportId,
        dogId: report.dogId || report.dog?.id || cleanReportId,
        ownerId: cleanOwnerId,
        petName: report.dog?.name || 'Lost Dog',
        petBreed: report.dog?.breed || 'Companion Pet',
        petPhoto: reportPhoto,
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
      if (photoUrl.startsWith('data:') && storage && sighting.reportId) {
        try {
          const sStorageRef = storageRef(storage, `sightings/${sighting.reportId}/${cleanSightingId}.jpg`);
          const uploadRes = await uploadString(sStorageRef, photoUrl, 'data_url');
          photoUrl = await getDownloadURL(uploadRes.ref);
          sighting.photo = photoUrl;
        } catch (uploadErr) {
          console.warn('[Firebase Storage] Sighting photo upload notice:', uploadErr);
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
        photo: photoUrl || null,
        reporterName: sighting.reporterName || 'Anonymous',
        reporterPhone: sighting.reporterPhone || null,
        createdAt: sighting.createdAt || new Date().toISOString(),
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
        const petsSnap = await getDocs(collection(db, 'pets'));
        const reportsSnap = await getDocs(collection(db, 'missing_reports'));
        const sightingsSnap = await getDocs(collection(db, 'sightings'));

        const deletePromises: Promise<any>[] = [];
        petsSnap.docs.forEach((d) => {
          if (d.id !== 'pet-1788871495754') deletePromises.push(deleteDoc(d.ref));
        });
        reportsSnap.docs.forEach((d) => {
          if (d.id !== 'LOST-1788885000505') deletePromises.push(deleteDoc(d.ref));
        });
        sightingsSnap.docs.forEach((d) => deletePromises.push(deleteDoc(d.ref)));

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
};
