import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { OwnerProfile, DogProfile, LostReport, Sighting, User } from '../types';

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

      const { error } = await supabase.from('profiles').upsert(
        {
          id: userId,
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
      const { error } = await supabase.from('pets').upsert(
        {
          id: pet.id,
          user_id: pet.ownerId,
          name: pet.name,
          breed: pet.breed,
          gender: pet.gender,
          color: pet.color,
          markings: pet.distinguishingMarks || '',
          photo_url: pet.primaryPhoto || '',
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
      const { error } = await supabase.from('missing_reports').upsert(
        {
          id: report.id,
          pet_id: report.dogId || report.dog?.id || report.id,
          user_id: report.ownerId,
          pet_name: report.dog?.name || 'Lost Dog',
          pet_photo: report.dog?.primaryPhoto || '',
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
      const { error } = await supabase.from('sightings').upsert(
        {
          id: sighting.id,
          pet_id: sighting.reportId,
          report_id: sighting.reportId || '',
          reporter_name: sighting.reporterName || 'Anonymous',
          reporter_phone: sighting.reporterPhone || '',
          landmark: sighting.location || '',
          notes: sighting.description || '',
          photo_url: sighting.photo || '',
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
      const [profilesRes, petsRes, reportsRes, sightingsRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('pets').select('*'),
        supabase.from('missing_reports').select('*'),
        supabase.from('sightings').select('*'),
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
};
