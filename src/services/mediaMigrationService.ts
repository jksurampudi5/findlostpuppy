import { supabase, isSupabaseConfigured } from './supabaseClient';
import { storageBucketService } from './storageBucketService';
import { storageService } from './storageService';

export interface MigrationCandidate {
  table: 'pets' | 'missing_reports' | 'profiles' | 'sightings';
  recordId: string;
  field: string;
  ownerId: string;
  ownerEmail?: string;
  base64Data: string;
}

export interface MigrationItemResult {
  table: string;
  recordId: string;
  status: 'MIGRATED' | 'SKIPPED_NOT_BASE64' | 'SKIPPED_ALREADY_HTTPS' | 'SKIPPED_UNAUTHORIZED' | 'FAILED';
  publicUrl?: string;
  error?: string;
}

export interface MigrationReport {
  timestamp: string;
  totalScanned: number;
  candidatesFound: number;
  migratedCount: number;
  skippedCount: number;
  failedCount: number;
  results: MigrationItemResult[];
}

/**
 * Checks if a string is a genuine Base64 image data URL
 */
export function isBase64DataUrl(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  return trimmed.startsWith('data:image/');
}

/**
 * Checks if a string is already a remote HTTPS/HTTP URL
 */
export function isRemoteHttpsUrl(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  return trimmed.startsWith('https://') || trimmed.startsWith('http://');
}

/**
 * Checks if a string is a bundled/static application asset that should NOT be migrated
 */
export function isStaticAssetUrl(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  return (
    trimmed.startsWith('/src/assets/') ||
    trimmed.startsWith('/findlostpuppy/assets/') ||
    trimmed.startsWith('/assets/') ||
    trimmed.endsWith('.jpg') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:')
  );
}

export const mediaMigrationService = {
  /**
   * Generic discovery of all Base64 candidates in Supabase database tables
   */
  async discoverDatabaseCandidates(): Promise<MigrationCandidate[]> {
    if (!supabase || !isSupabaseConfigured()) return [];
    const candidates: MigrationCandidate[] = [];

    try {
      // 1. Scan pets table
      const { data: pets, error: petErr } = await supabase.from('pets').select('*');
      if (!petErr && pets) {
        for (const p of pets) {
          if (isBase64DataUrl(p.photo_url)) {
            candidates.push({
              table: 'pets',
              recordId: p.id,
              field: 'photo_url',
              ownerId: p.user_id,
              base64Data: p.photo_url,
            });
          }
        }
      }

      // 2. Scan missing_reports table
      const { data: reports, error: repErr } = await supabase.from('missing_reports').select('*');
      if (!repErr && reports) {
        for (const r of reports) {
          if (isBase64DataUrl(r.pet_photo)) {
            candidates.push({
              table: 'missing_reports',
              recordId: r.id,
              field: 'pet_photo',
              ownerId: r.user_id,
              ownerEmail: r.contact_email,
              base64Data: r.pet_photo,
            });
          }
        }
      }

      // 3. Scan profiles table
      const { data: profiles, error: prErr } = await supabase.from('profiles').select('*');
      if (!prErr && profiles) {
        for (const pr of profiles) {
          if (isBase64DataUrl(pr.avatar_url)) {
            candidates.push({
              table: 'profiles',
              recordId: pr.id,
              field: 'avatar_url',
              ownerId: pr.id,
              ownerEmail: pr.email,
              base64Data: pr.avatar_url,
            });
          }
        }
      }

      // 4. Scan sightings table
      const { data: sightings, error: sErr } = await supabase.from('sightings').select('*');
      if (!sErr && sightings) {
        for (const s of sightings) {
          if (isBase64DataUrl(s.photo_url)) {
            candidates.push({
              table: 'sightings',
              recordId: s.id,
              field: 'photo_url',
              ownerId: s.pet_id || s.report_id || '',
              base64Data: s.photo_url,
            });
          }
        }
      }
    } catch (err) {
      console.warn('[mediaMigrationService] Discovery error:', err);
    }

    return candidates;
  },

  /**
   * Generic non-destructive migration of all discovered Base64 records.
   * Enforces:
   * - Only migrate when authenticated owner matches RLS requirements
   * - Upload first with upsert: false
   * - Persist HTTPS URL to database
   * - Update local application cache
   * - If ANY step fails, original Base64 is retained untouched
   */
  async runHistoricalMediaMigration(): Promise<MigrationReport> {
    const report: MigrationReport = {
      timestamp: new Date().toISOString(),
      totalScanned: 0,
      candidatesFound: 0,
      migratedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      results: [],
    };

    if (!supabase || !isSupabaseConfigured()) {
      return report;
    }

    // 1. Check current authenticated user session
    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;
    const authUid = session?.user?.id;
    const authEmail = session?.user?.email?.toLowerCase().trim();

    // 2. Discover all candidates across database
    const candidates = await this.discoverDatabaseCandidates();
    report.candidatesFound = candidates.length;

    for (const candidate of candidates) {
      report.totalScanned++;

      // Guard 1: Verify it is genuinely Base64
      if (!isBase64DataUrl(candidate.base64Data)) {
        report.skippedCount++;
        report.results.push({
          table: candidate.table,
          recordId: candidate.recordId,
          status: 'SKIPPED_NOT_BASE64',
        });
        continue;
      }

      // Guard 2: Skip static assets or existing HTTPS URLs
      if (isRemoteHttpsUrl(candidate.base64Data)) {
        report.skippedCount++;
        report.results.push({
          table: candidate.table,
          recordId: candidate.recordId,
          status: 'SKIPPED_ALREADY_HTTPS',
        });
        continue;
      }

      // Guard 3: Ownership validation against Storage RLS
      // Storage RLS requires folders: profiles/{auth.uid()}/..., pets/{auth.uid()}/..., missing-reports/{report_id}/...
      if (!authUid) {
        report.skippedCount++;
        report.results.push({
          table: candidate.table,
          recordId: candidate.recordId,
          status: 'SKIPPED_UNAUTHORIZED',
          error: 'No authenticated Supabase session. RLS prevents unauthenticated writes to owner folders.',
        });
        continue;
      }

      const isCandidateOwner =
        candidate.ownerId === authUid ||
        (authEmail && candidate.ownerEmail && candidate.ownerEmail.toLowerCase().trim() === authEmail);

      if (!isCandidateOwner) {
        report.skippedCount++;
        report.results.push({
          table: candidate.table,
          recordId: candidate.recordId,
          status: 'SKIPPED_UNAUTHORIZED',
          error: `Record owner (${candidate.ownerId}) does not match authenticated user (${authUid}).`,
        });
        continue;
      }

      // 3. Perform Non-Destructive Migration for candidate
      try {
        let publicUrl: string | null = null;

        if (candidate.table === 'pets') {
          // If pet user_id is a legacy format, update to authUid first
          if (candidate.ownerId !== authUid) {
            await supabase.from('pets').update({ user_id: authUid }).eq('id', candidate.recordId);
          }

          publicUrl = await storageBucketService.uploadPetPhoto(
            authUid,
            candidate.recordId,
            candidate.base64Data,
            0
          );

          if (!publicUrl) throw new Error('Storage upload returned empty public URL');

          // Update database column
          const { error: dbErr } = await supabase
            .from('pets')
            .update({ photo_url: publicUrl, updated_at: new Date().toISOString() })
            .eq('id', candidate.recordId);

          if (dbErr) throw new Error(`Database update failed: ${dbErr.message}`);

          // Update local cache
          const localPets = storageService.getAllPets();
          const pIdx = localPets.findIndex((p) => p.id === candidate.recordId);
          if (pIdx >= 0) {
            localPets[pIdx].primaryPhoto = publicUrl;
            if (localPets[pIdx].photos && localPets[pIdx].photos.length > 0) {
              localPets[pIdx].photos[0] = publicUrl;
            }
          }

        } else if (candidate.table === 'missing_reports') {
          // Ensure missing_reports.user_id matches authUid so Storage RLS EXISTS check evaluates to true
          if (candidate.ownerId !== authUid) {
            await supabase.from('missing_reports').update({ user_id: authUid }).eq('id', candidate.recordId);
          }

          publicUrl = await storageBucketService.uploadMissingReportPhoto(
            candidate.recordId,
            candidate.base64Data
          );

          if (!publicUrl) throw new Error('Storage upload returned empty public URL');

          // Update database column
          const { error: dbErr } = await supabase
            .from('missing_reports')
            .update({ pet_photo: publicUrl })
            .eq('id', candidate.recordId);

          if (dbErr) throw new Error(`Database update failed: ${dbErr.message}`);

          // Update local cache
          const localReports = storageService.getAllReports();
          const rIdx = localReports.findIndex((r) => r.id === candidate.recordId);
          if (rIdx >= 0) {
            if (localReports[rIdx].dog) {
              localReports[rIdx].dog.primaryPhoto = publicUrl;
              if (localReports[rIdx].dog.photos && localReports[rIdx].dog.photos.length > 0) {
                localReports[rIdx].dog.photos[0] = publicUrl;
              }
            }
          }

        } else if (candidate.table === 'profiles') {
          publicUrl = await storageBucketService.uploadProfileAvatar(authUid, candidate.base64Data);
          if (!publicUrl) throw new Error('Storage upload returned empty public URL');

          const { error: dbErr } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', authUid);

          if (dbErr) throw new Error(`Database update failed: ${dbErr.message}`);

        } else if (candidate.table === 'sightings') {
          publicUrl = await storageBucketService.uploadSightingPhoto(candidate.ownerId, candidate.base64Data);
          if (!publicUrl) throw new Error('Storage upload returned empty public URL');

          const { error: dbErr } = await supabase
            .from('sightings')
            .update({ photo_url: publicUrl })
            .eq('id', candidate.recordId);

          if (dbErr) throw new Error(`Database update failed: ${dbErr.message}`);
        }

        if (publicUrl) {
          report.migratedCount++;
          report.results.push({
            table: candidate.table,
            recordId: candidate.recordId,
            status: 'MIGRATED',
            publicUrl,
          });
        }
      } catch (migrationErr: any) {
        // STRICT SAFETY: If anything fails, keep the original Base64 untouched!
        console.error(`[mediaMigrationService] Migration failed for ${candidate.table}:${candidate.recordId}. Retaining original Base64:`, migrationErr);
        report.failedCount++;
        report.results.push({
          table: candidate.table,
          recordId: candidate.recordId,
          status: 'FAILED',
          error: migrationErr?.message || 'Unknown migration failure',
        });
      }
    }

    return report;
  },
};
