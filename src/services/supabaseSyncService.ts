import { supabase, isSupabaseConfigured } from './supabaseClient';
import { storageBucketService } from './storageBucketService';
import type { OwnerProfile, DogProfile, LostReport, Sighting, User, AppSuggestion } from '../types';

export interface SupabaseSyncStatus {
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

export const supabaseSyncService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  getStatus(): SupabaseSyncStatus {
    return {
      isConfigured: isSupabaseConfigured(),
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
   * Sync a user profile to Supabase `profiles` table
   */
  async syncUserProfile(user: Partial<User> & { id: string; email: string }): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;
    try {
      const { error } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email.toLowerCase().trim(),
          name: user.name || user.email.split('@')[0],
          avatar_url: user.avatar || '',
          created_at: user.createdAt || new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      if (error) {
        console.warn('[Supabase] syncUserProfile notice:', error.message);
        lastSyncError = error.message;
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[Supabase] syncUserProfile exception:', err);
      return false;
    }
  },

  /**
   * Sync complete owner profile to Supabase `profiles` table
   */
  async syncOwnerProfile(profile: OwnerProfile, userId: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;
    try {
      const fullAddress = [
        profile.streetOrLocality,
        profile.mandalOrMunicipality,
        profile.district,
        profile.state,
      ]
        .filter(Boolean)
        .join(', ') || profile.address || '';

      const cleanUserId = userId.replace(/^owner-/, '');
      const { error } = await supabase.from('profiles').upsert(
        {
          id: cleanUserId,
          email: profile.email.toLowerCase().trim(),
          name: profile.fullName,
          phone: profile.phone,
          address: fullAddress,
          avatar_url: profile.photo || '',
        },
        { onConflict: 'id' }
      );
      if (error) {
        console.warn('[Supabase] syncOwnerProfile notice:', error.message);
        lastSyncError = error.message;
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[Supabase] syncOwnerProfile exception:', err);
      return false;
    }
  },

  /**
   * Sync a pet profile to Supabase `pets` table
   */
  async syncPet(pet: DogProfile): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;
    try {
      const cleanUserId = (pet.ownerId || '').replace(/^owner-/, '');
      let finalPhotoUrl = pet.primaryPhoto || '';

      if (finalPhotoUrl.startsWith('data:') && cleanUserId) {
        try {
          const publicUrl = await storageBucketService.uploadPetPhoto(cleanUserId, pet.id, finalPhotoUrl, 0);
          if (publicUrl) {
            finalPhotoUrl = publicUrl;
            pet.primaryPhoto = publicUrl;
          }
        } catch (uploadErr) {
          console.warn('[Supabase] syncPet photo upload notice:', uploadErr);
        }
      }

      const { error } = await supabase.from('pets').upsert(
        {
          id: pet.id,
          user_id: cleanUserId,
          name: pet.name,
          breed: pet.breed,
          gender: pet.gender,
          color: pet.color,
          markings: pet.distinguishingMarks || '',
          photo_url: finalPhotoUrl,
          is_lost: false,
          created_at: pet.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      if (error) {
        console.warn('[Supabase] syncPet notice:', error.message);
        lastSyncError = error.message;
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[Supabase] syncPet exception:', err);
      return false;
    }
  },

  /**
   * Sync a lost dog emergency report to Supabase `missing_reports` table
   */
  async syncLostReport(report: LostReport): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;
    try {
      const cleanUserId = (report.ownerId || '').replace(/^owner-/, '');
      let finalPhotoUrl = report.dog?.primaryPhoto || '';

      // Step 1: Ensure missing_reports row exists first (satisfies Storage RLS EXISTS policy)
      const { error } = await supabase.from('missing_reports').upsert(
        {
          id: report.id,
          pet_id: report.dogId || report.dog?.id || report.id,
          user_id: cleanUserId,
          pet_name: report.dog?.name || 'Lost Dog',
          pet_photo: finalPhotoUrl,
          landmark: report.lastKnownLocation || '',
          district: report.ownerApproximateLocation || '',
          state: 'AP',
          contact_phone: report.contactMechanism?.safeContactPhone || '',
          contact_email: report.contactMechanism?.safeContactEmail || '',
          is_resolved: report.status === 'SAFE' || (report.status as any) === 'REUNITED',
          created_at: report.createdAt || new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      if (error) {
        console.warn('[Supabase] syncLostReport notice:', error.message);
        lastSyncError = error.message;
        return false;
      }

      // Step 2: If photo is Base64 data URL, upload to missing-reports/{report_id}/photo_{timestamp}_{random}.jpg
      if (finalPhotoUrl.startsWith('data:')) {
        try {
          const publicUrl = await storageBucketService.uploadMissingReportPhoto(report.id, finalPhotoUrl);
          if (publicUrl) {
            finalPhotoUrl = publicUrl;
            if (report.dog) report.dog.primaryPhoto = publicUrl;
            await supabase.from('missing_reports').update({ pet_photo: publicUrl }).eq('id', report.id);
          }
        } catch (uploadErr) {
          console.warn('[Supabase] syncLostReport photo upload notice:', uploadErr);
        }
      }

      return true;
    } catch (err) {
      console.warn('[Supabase] syncLostReport exception:', err);
      return false;
    }
  },

  /**
   * Sync a community sighting to Supabase `sightings` table
   */
  async syncSighting(sighting: Sighting): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;
    try {
      let finalPhotoUrl = sighting.photo || '';

      if (finalPhotoUrl.startsWith('data:') && sighting.reportId) {
        try {
          const publicUrl = await storageBucketService.uploadSightingPhoto(sighting.reportId, finalPhotoUrl);
          if (publicUrl) {
            finalPhotoUrl = publicUrl;
            sighting.photo = publicUrl;
          }
        } catch (uploadErr) {
          console.warn('[Supabase] syncSighting photo upload notice:', uploadErr);
        }
      }

      const { error } = await supabase.from('sightings').upsert(
        {
          id: sighting.id,
          pet_id: sighting.reportId,
          report_id: sighting.reportId || '',
          reporter_name: sighting.reporterName || 'Anonymous',
          reporter_phone: sighting.reporterPhone || '',
          landmark: sighting.location || '',
          notes: sighting.description || '',
          photo_url: finalPhotoUrl,
          created_at: sighting.createdAt || new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      if (error) {
        console.warn('[Supabase] syncSighting notice:', error.message);
        lastSyncError = error.message;
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[Supabase] syncSighting exception:', err);
      return false;
    }
  },

  /**
   * Fetch all cloud records from Supabase tables to sync across all devices
   */
  async fetchAllCloudData(): Promise<{
    profiles: any[];
    pets: any[];
    reports: any[];
    sightings: any[];
  } | null> {
    if (!supabase || !isSupabaseConfigured()) return null;
    try {
      // Step 12 Privacy Hardening: Read from controlled public views missing_reports_public and sightings_public
      // Fall back gracefully to base tables if views are not yet created or being initialized in migration
      let reportsRes = await supabase.from('missing_reports_public').select('*');
      if (reportsRes.error) {
        reportsRes = await supabase.from('missing_reports').select('*');
      }

      let sightingsRes = await supabase.from('sightings_public').select('*');
      if (sightingsRes.error) {
        sightingsRes = await supabase.from('sightings').select('*');
      }

      const [profilesRes, petsRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('pets').select('*'),
      ]);

      if (profilesRes.error && !profilesRes.error.message.includes('does not exist')) {
        lastSyncError = profilesRes.error.message;
      }

      const profiles = profilesRes.data || [];
      const pets = petsRes.data || [];
      const reports = reportsRes.data || [];
      const sightings = sightingsRes.data || [];

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
      console.warn('[Supabase] fetchAllCloudData exception:', err);
      lastSyncError = err?.message || 'Failed to fetch cloud database';
      return null;
    }
  },

  /**
   * Update a pet's status (LOST vs SAFE) in Supabase
   */
  async updatePetSafetyStatus(petId: string, isLost: boolean): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;
    try {
      await Promise.all([
        supabase
          .from('pets')
          .update({ is_lost: isLost, updated_at: new Date().toISOString() })
          .eq('id', petId),
        supabase
          .from('missing_reports')
          .update({ is_resolved: !isLost })
          .eq('pet_id', petId),
      ]);
      return true;
    } catch (err) {
      console.warn('[Supabase] updatePetSafetyStatus error:', err);
      return false;
    }
  },

  /**
   * Admin delete user from Supabase
   */
  async deleteUserAsAdmin(userId: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;
    try {
      await Promise.all([
        supabase.from('profiles').delete().eq('id', userId),
        supabase.from('pets').delete().eq('user_id', userId),
        supabase.from('missing_reports').delete().eq('user_id', userId),
      ]);
      return true;
    } catch (err) {
      console.warn('[Supabase] deleteUserAsAdmin error:', err);
      return false;
    }
  },

  /**
   * Admin delete pet from Supabase
   */
  async deletePetAsAdmin(petId: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;
    try {
      await Promise.all([
        supabase.from('pets').delete().eq('id', petId),
        supabase.from('missing_reports').delete().eq('pet_id', petId),
        supabase.from('sightings').delete().eq('pet_id', petId),
      ]);
      return true;
    } catch (err) {
      console.warn('[Supabase] deletePetAsAdmin error:', err);
      return false;
    }
  },

  /**
   * Delete a lost dog emergency report and its sightings from Supabase
   */
  async deleteLostReport(reportId: string, petId?: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;
    try {
      const canonicalId = reportId.startsWith('LOST-') ? reportId : `LOST-${reportId.toUpperCase()}`;
      const rawId = reportId.replace(/^lost-/i, '');

      await Promise.all([
        supabase.from('missing_reports').delete().eq('id', reportId),
        supabase.from('missing_reports').delete().eq('id', canonicalId),
        supabase.from('missing_reports').delete().eq('id', rawId),
        supabase.from('sightings').delete().eq('report_id', reportId),
        supabase.from('sightings').delete().eq('report_id', canonicalId),
        supabase.from('sightings').delete().eq('report_id', rawId),
      ]);

      if (petId) {
        await Promise.all([
          supabase.from('missing_reports').delete().eq('pet_id', petId),
          supabase.from('sightings').delete().eq('pet_id', petId),
        ]);
        // Only delete pet if not a baseline community seed ID
        if (!petId.startsWith('dog-abullu-') && !petId.startsWith('dog-charlie-') && !petId.startsWith('dog-bruno-')) {
          await supabase.from('pets').delete().eq('id', petId);
        }
      }

      return true;
    } catch (err) {
      console.warn('[Supabase] deleteLostReport error:', err);
      return false;
    }
  },

  /**
   * Delete all data associated with an email address from Supabase
   */
  async deleteUserDataByEmail(email: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;
    try {
      const targetEmail = email.toLowerCase().trim();
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', targetEmail);

      const userIds = (profiles || []).map((p: any) => p.id);

      await Promise.all([
        supabase.from('missing_reports').delete().ilike('contact_email', targetEmail),
        supabase.from('profiles').delete().ilike('email', targetEmail),
      ]);

      for (const uid of userIds) {
        await Promise.all([
          supabase.from('missing_reports').delete().eq('user_id', uid),
          supabase.from('pets').delete().eq('user_id', uid),
          supabase.from('profiles').delete().eq('id', uid),
        ]);
      }

      return true;
    } catch (err) {
      console.warn('[Supabase] deleteUserDataByEmail error:', err);
      return false;
    }
  },

  /**
   * Admin delete sighting from Supabase
   */
  async deleteSightingAsAdmin(sightingId: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;
    try {
      await supabase.from('sightings').delete().eq('id', sightingId);
      return true;
    } catch (err) {
      console.warn('[Supabase] deleteSightingAsAdmin error:', err);
      return false;
    }
  },

  /**
   * Sync an app suggestion to Supabase `app_suggestions` table
   */
  async syncSuggestion(suggestion: AppSuggestion): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;
    try {
      const { error } = await supabase.from('app_suggestions').upsert(
        {
          id: suggestion.id,
          user_id: suggestion.userId || null,
          user_name: suggestion.userName || null,
          user_email: suggestion.userEmail || null,
          user_phone: suggestion.userPhone || null,
          category: suggestion.category,
          title: suggestion.title,
          description: suggestion.description,
          rating: suggestion.rating || null,
          page_url: suggestion.pageUrl,
          device_info: suggestion.deviceInfo || null,
          created_at: suggestion.createdAt,
          status: suggestion.status,
        },
        { onConflict: 'id' }
      );
      if (error) {
        console.info('[Supabase] syncSuggestion notice:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.info('[Supabase] syncSuggestion exception:', err);
      return false;
    }
  },
};

