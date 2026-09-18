import type {
  User,
  LostReport,
  OwnerProfile,
  Sighting,
  ReportStatus,
  DogProfile,
  ListingReport,
  UserReport,
  BlockedUserRecord,
  ListingReportCategory,
  UserReportCategory,
  AppSuggestion,
} from '../types';
import { consentService } from './consentService';
import { supabaseSyncService } from './supabaseSyncService';
import { firebaseSyncService } from './firebaseSyncService';
import { authService } from './authService';
import { resolveGenericMediaUrl, isPetPhotoUrl } from '../utils/dogPhotoHelper';

import abulluImg from '../assets/abullu.jpg';
import sonuImg from '../assets/sonu.jpg';

const REPORTS_KEY = 'findlostpuppy_reports_v1';
const SIGHTINGS_KEY = 'findlostpuppy_sightings_v1';
const PROFILES_KEY = 'findlostpuppy_profiles_v1';
const PETS_KEY = 'findlostpuppy_pets_v1';
const SKIPPED_PET_KEY = 'findlostpuppy_skipped_pets_v1';
const SKIPPED_REPORT_KEY = 'findlostpuppy_skipped_reports_v1';
const LISTING_REPORTS_KEY = 'findlostpuppy_listing_reports_v1';
const USER_REPORTS_KEY = 'findlostpuppy_user_reports_v1';
const BLOCKED_USERS_KEY = 'findlostpuppy_blocked_users_v1';
const USERS_KEY = 'findlostpuppy_registered_users_v1';
const SESSION_KEY = 'findlostpuppy_session_v1';
const DELETED_REPORTS_KEY = 'findlostpuppy_deleted_reports_v1';
const DELETED_PETS_KEY = 'findlostpuppy_deleted_pets_v1';
const SUGGESTIONS_KEY = 'findlostpuppy_suggestions_v1';

export const COMMUNITY_BASELINE_REPORTS: LostReport[] = [
  {
    id: 'LOST-1788885000505',
    dogId: 'pet-1788871495754',
    ownerId: 'user-1788871008918',
    dog: {
      id: 'pet-1788871495754',
      ownerId: 'user-1788871008918',
      name: 'SONU',
      breed: 'INDIE • Companion Pet',
      gender: 'Male',
      age: '2 years',
      size: 'Medium (10-25kg)',
      color: 'Golden brown with white streak on head and white fur on chest',
      distinguishingMarks: 'Thin white vertical streak on forehead between eyes, white chest patch, alert and friendly',
      collarInfo: 'None',
      primaryPhoto: sonuImg,
      photos: [sonuImg],
      createdAt: '2026-09-08T12:44:55.754Z',
    },
    ownerApproximateLocation: 'Yennaepally, Vikarabad (Mandal), Vikarabad, Telangana',
    lastKnownLocation: 'Yennaepally, Vikarabad, Telangana',
    dateLost: '2026-09-08',
    timeLost: '12:00 PM',
    additionalNotes: 'Very friendly and gentle Indie dog. Reunited and safe at home with family!',
    status: 'SAFE',
    contactMechanism: {
      showPhone: true,
      showEmail: true,
      safeContactPhone: '07396868941',
      safeContactEmail: 'priyankashrama80@gmail.com',
      contactNote: 'Please reach out immediately if spotted!',
    },
    sightingCount: 1,
    createdAt: '2026-09-08T16:30:00.505Z',
    updatedAt: new Date().toISOString(),
  },
];

// Helper to normalize and canonicalize report IDs (e.g. '1788807276098' -> 'lost-1788807276098')
export function normalizeReportId(id: string): string {
  if (!id) return '';
  const clean = id.trim().toLowerCase();
  return clean.startsWith('lost-') ? clean : `lost-${clean}`;
}

// Helper to extract and canonicalize the unique owner email for single-pet deduplication
export function extractReportOwnerEmail(report: LostReport, profiles: OwnerProfile[] = []): string {
  if (!report) return '';
  if (report.contactMechanism?.safeContactEmail && report.contactMechanism.safeContactEmail.includes('@')) {
    return report.contactMechanism.safeContactEmail.toLowerCase().trim();
  }
  if ((report as any)?.ownerEmail && typeof (report as any).ownerEmail === 'string' && (report as any).ownerEmail.includes('@')) {
    return (report as any).ownerEmail.toLowerCase().trim();
  }
  if ((report as any)?.contactEmail && typeof (report as any).contactEmail === 'string' && (report as any).contactEmail.includes('@')) {
    return (report as any).contactEmail.toLowerCase().trim();
  }
  const cleanOwnerId = (report.ownerId || '').replace(/^owner-/, '').toLowerCase().trim();
  if (cleanOwnerId.includes('@')) {
    return cleanOwnerId;
  }
  const matchedProfile = profiles.find(
    (p) =>
      p.userId === report.ownerId ||
      p.userId === cleanOwnerId ||
      p.id === report.ownerId ||
      p.id === `owner-${cleanOwnerId}` ||
      p.id === cleanOwnerId
  );
  if (matchedProfile?.email && matchedProfile.email.includes('@')) {
    return matchedProfile.email.toLowerCase().trim();
  }
  // Baseline known emails
  if (report.id === 'LOST-1788807276098' || report.ownerId === 'owner-krishna-abullu') {
    return 'krishna.owner@findlostpuppy.org';
  }
  if (report.id === 'LOST-CHARLIE-01' || report.ownerId === 'owner-charlie-rescuers') {
    return 'community.care@findlostpuppy.org';
  }
  if (report.id === 'LOST-BRUNO-WESTGODAVARI' || report.ownerId === 'owner-bruno-family') {
    return 'bruno.family@findlostpuppy.org';
  }
  return cleanOwnerId || 'unknown-owner';
}

class StorageService {
  private reports: LostReport[] = [];
  private sightings: Sighting[] = [];
  private profiles: OwnerProfile[] = [];
  private pets: DogProfile[] = [];
  private skippedPetUserIds: string[] = [];
  private skippedReportUserIds: string[] = [];
  private listingReports: ListingReport[] = [];
  private userReports: UserReport[] = [];
  private blockedUsers: BlockedUserRecord[] = [];
  private deletedReportIds: string[] = [];
  private deletedPetIds: string[] = [];
  private suggestions: AppSuggestion[] = [];
  private isTransactionActive: boolean = false;

  constructor() {
    this.init();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('findlostpuppy_')) {
          this.init();
          this.notifyUpdate();
        }
      });

      // Single source of truth: Immediately pull original data from Supabase
      this.pullFromSupabase()
        .then(() => {
          // Then sync any local pending records if needed
          return this.pushLocalToSupabase();
        })
        .catch(() => {});

      // Periodic cloud background sync (every 20s)
      setInterval(() => {
        if (navigator.onLine) {
          this.pullFromSupabase().catch(() => {});
        }
      }, 20000);
    }
  }

  /**
   * ACID TRANSACTION ENGINE:
   * Executes multi-table mutations atomically. If any assertion or step fails,
   * it automatically rolls back all memory and localStorage snapshots.
   */
  executeTransaction<T>(action: () => T): T {
    if (this.isTransactionActive) {
      // Re-entrant transaction within same execution context
      return action();
    }

    this.isTransactionActive = true;
    const snapshot = {
      reports: JSON.stringify(this.reports),
      sightings: JSON.stringify(this.sightings),
      profiles: JSON.stringify(this.profiles),
      pets: JSON.stringify(this.pets),
      skippedPetUserIds: JSON.stringify(this.skippedPetUserIds),
      skippedReportUserIds: JSON.stringify(this.skippedReportUserIds),
      listingReports: JSON.stringify(this.listingReports),
      userReports: JSON.stringify(this.userReports),
      blockedUsers: JSON.stringify(this.blockedUsers),
      deletedReportIds: JSON.stringify(this.deletedReportIds),
      deletedPetIds: JSON.stringify(this.deletedPetIds),
      suggestions: JSON.stringify(this.suggestions),
    };

    try {
      const result = action();
      // ACID Invariant checks:
      this.enforceIntegrityInvariants();
      // Atomic flush to durable localStorage:
      this.commitAllStorage();
      this.notifyUpdate();
      return result;
    } catch (err) {
      console.error('ACID Transaction Rolled Back due to error:', err);
      // Rollback memory state:
      this.reports = JSON.parse(snapshot.reports);
      this.sightings = JSON.parse(snapshot.sightings);
      this.profiles = JSON.parse(snapshot.profiles);
      this.pets = JSON.parse(snapshot.pets);
      this.skippedPetUserIds = JSON.parse(snapshot.skippedPetUserIds);
      this.skippedReportUserIds = JSON.parse(snapshot.skippedReportUserIds);
      this.listingReports = JSON.parse(snapshot.listingReports);
      this.userReports = JSON.parse(snapshot.userReports);
      this.blockedUsers = JSON.parse(snapshot.blockedUsers);
      this.deletedReportIds = JSON.parse(snapshot.deletedReportIds);
      this.deletedPetIds = JSON.parse(snapshot.deletedPetIds);
      this.suggestions = JSON.parse(snapshot.suggestions);
      throw err;
    } finally {
      this.isTransactionActive = false;
    }
  }

  private enforceIntegrityInvariants(): void {
    // Invariant 1: Deduplicate reports so:
    // a) Each unique owner email has at most 1 active pet report
    // b) Pet state is strictly mutually exclusive: LOST vs SAFE (normalizing legacy REUNITED to SAFE)
    // c) The most recently updated/created report is preserved as the single canonical representation
    const seenOwnerIds = new Set<string>();
    const seenEmails = new Set<string>();
    const seenDogIds = new Set<string>();
    const seenReportIds = new Set<string>();
    const deduplicatedReports: LostReport[] = [];

    // Sort reports by newest update/creation first
    const sortedReports = [...this.reports].sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    for (const r of sortedReports) {
      if ((r.status as any) === 'REUNITED') {
        r.status = 'SAFE';
      }
      const canonicalId = normalizeReportId(r.id);
      const rawOwnerId = (r.ownerId || '').replace(/^(owner-)+/, '').toLowerCase().trim();
      const ownerEmail = extractReportOwnerEmail(r, this.profiles);
      const dogId = (r.dogId || r.dog?.id || '').toLowerCase().trim();

      const matchesOwnerId = Boolean(rawOwnerId && rawOwnerId !== 'unknown-owner' && seenOwnerIds.has(rawOwnerId));
      const matchesEmail = Boolean(ownerEmail && ownerEmail.includes('@') && seenEmails.has(ownerEmail));
      const matchesDogId = Boolean(dogId && seenDogIds.has(dogId));
      const matchesReportId = seenReportIds.has(canonicalId);

      if (matchesOwnerId || matchesEmail || matchesDogId || matchesReportId) {
        // Find existing canonical report to merge richer photo/info if needed
        const existing = deduplicatedReports.find(
          (ex) =>
            (rawOwnerId && (ex.ownerId || '').replace(/^(owner-)+/, '').toLowerCase().trim() === rawOwnerId) ||
            (ownerEmail && ownerEmail.includes('@') && extractReportOwnerEmail(ex, this.profiles) === ownerEmail) ||
            (dogId && (ex.dogId || ex.dog?.id || '').toLowerCase().trim() === dogId) ||
            normalizeReportId(ex.id) === canonicalId
        );
        if (existing) {
          if ((!existing.dog.primaryPhoto || existing.dog.primaryPhoto.length < 5) && r.dog.primaryPhoto) {
            existing.dog.primaryPhoto = r.dog.primaryPhoto;
          }
          if ((!existing.dog.photos || existing.dog.photos.length === 0) && r.dog.photos?.length) {
            existing.dog.photos = r.dog.photos;
          }
        }
        continue;
      }

      if (rawOwnerId && rawOwnerId !== 'unknown-owner') seenOwnerIds.add(rawOwnerId);
      if (ownerEmail && ownerEmail.includes('@')) seenEmails.add(ownerEmail);
      if (dogId) seenDogIds.add(dogId);
      seenReportIds.add(canonicalId);
      deduplicatedReports.push(r);
    }

    this.reports = deduplicatedReports;

    // Invariant 2: Ensure all reports have valid photo fallbacks
    for (const r of this.reports) {
      if (!r.dog.primaryPhoto || r.dog.primaryPhoto.trim().length < 5) {
        const ownerClean = (r.ownerId || '').replace(/^owner-/, '');
        const registered = this.pets.find(
          (p) => p.ownerId === r.ownerId || p.ownerId === `owner-${ownerClean}` || p.ownerId === ownerClean
        );
        r.dog.primaryPhoto = registered?.primaryPhoto || abulluImg;
      }
      if (!r.dog.photos || r.dog.photos.length === 0) {
        r.dog.photos = [r.dog.primaryPhoto || abulluImg];
      }
    }

    // Invariant 3: Ensure report.sightingCount accurately reflects current active sightings (isCurrent !== false)
    for (const r of this.reports) {
      const canonicalId = normalizeReportId(r.id);
      const activeCount = this.sightings.filter(
        (s) =>
          (normalizeReportId(s.reportId) === canonicalId || s.reportId.toLowerCase() === r.id.toLowerCase()) &&
          s.isCurrent !== false
      ).length;
      r.sightingCount = activeCount;
    }

    // Invariant 4: Normalize dog names (e.g. 'brunoo' -> 'Bruno', 'My Pup' -> 'Bruno')
    for (const r of this.reports) {
      if (r.dog?.name) {
        const cleanName = r.dog.name.trim();
        const lower = cleanName.toLowerCase();
        if (lower === 'brunoo' || lower === 'my pup' || lower === 'safe puppy') {
          r.dog.name = 'Bruno';
        }
      }
    }
    for (const p of this.pets) {
      if (p.name) {
        const cleanName = p.name.trim();
        const lower = cleanName.toLowerCase();
        if (lower === 'brunoo' || lower === 'my pup' || lower === 'safe puppy') {
          p.name = 'Bruno';
        }
      }
    }
  }

  private commitAllStorage(): void {
    const safeSet = (key: string, data: any) => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (err: any) {
        if (err?.name === 'QuotaExceededError' || err?.code === 22 || err?.message?.includes('quota')) {
          try {
            // Strip oversized base64 strings to stay well within browser quota
            const sanitized = JSON.parse(
              JSON.stringify(data, (k, v) => {
                if (k === 'photos' && Array.isArray(v) && v.length > 2) return v.slice(0, 2);
                if (typeof v === 'string' && v.startsWith('data:image/') && v.length > 300000) {
                  return '';
                }
                return v;
              })
            );
            localStorage.setItem(key, JSON.stringify(sanitized));
          } catch {}
        }
      }
    };

    safeSet(REPORTS_KEY, this.reports);
    safeSet(PETS_KEY, this.pets);
    safeSet(PROFILES_KEY, this.profiles);
    safeSet(SIGHTINGS_KEY, this.sightings);
    safeSet(SKIPPED_PET_KEY, this.skippedPetUserIds);
    safeSet(SKIPPED_REPORT_KEY, this.skippedReportUserIds);
    safeSet(LISTING_REPORTS_KEY, this.listingReports);
    safeSet(USER_REPORTS_KEY, this.userReports);
    safeSet(BLOCKED_USERS_KEY, this.blockedUsers);
    safeSet(DELETED_REPORTS_KEY, this.deletedReportIds);
    safeSet(DELETED_PETS_KEY, this.deletedPetIds);
    safeSet(SUGGESTIONS_KEY, this.suggestions);
  }

  private isReportOrPetDeleted(reportId?: string, dogId?: string, petId?: string): boolean {
    if (typeof localStorage !== 'undefined') {
      const rawDeletedReports = localStorage.getItem(DELETED_REPORTS_KEY);
      if (rawDeletedReports) {
        try {
          const parsed = JSON.parse(rawDeletedReports);
          if (Array.isArray(parsed)) {
            this.deletedReportIds = Array.from(new Set([...this.deletedReportIds, ...parsed]));
          }
        } catch {}
      }
      const rawDeletedPets = localStorage.getItem(DELETED_PETS_KEY);
      if (rawDeletedPets) {
        try {
          const parsed = JSON.parse(rawDeletedPets);
          if (Array.isArray(parsed)) {
            this.deletedPetIds = Array.from(new Set([...this.deletedPetIds, ...parsed]));
          }
        } catch {}
      }
    }

    const checkId = (idToCheck?: string): boolean => {
      if (!idToCheck || typeof idToCheck !== 'string') return false;
      const raw = idToCheck.trim();
      if (!raw) return false;
      const lower = raw.toLowerCase();
      const canon = normalizeReportId(raw);
      const noLost = lower.replace(/^lost-/, '');
      const upper = raw.toUpperCase();

      const inReportList = this.deletedReportIds.some((d) => {
        if (!d) return false;
        const dLower = d.toLowerCase();
        return (
          d === raw ||
          dLower === lower ||
          normalizeReportId(d) === canon ||
          dLower.replace(/^lost-/, '') === noLost ||
          d.toUpperCase() === upper
        );
      });

      if (inReportList) return true;

      const inPetList = this.deletedPetIds.some((p) => {
        if (!p) return false;
        const pLower = p.toLowerCase();
        return p === raw || pLower === lower || p.toUpperCase() === upper;
      });

      return inPetList;
    };

    if (reportId && checkId(reportId)) return true;
    if (dogId && checkId(dogId)) return true;
    if (petId && checkId(petId)) return true;
    return false;
  }

  private init() {
    try {
      const storedDeletedReports = localStorage.getItem(DELETED_REPORTS_KEY);
      this.deletedReportIds = storedDeletedReports ? JSON.parse(storedDeletedReports) : [];

      const storedDeletedPets = localStorage.getItem(DELETED_PETS_KEY);
      this.deletedPetIds = storedDeletedPets ? JSON.parse(storedDeletedPets) : [];

      const storedReports = localStorage.getItem(REPORTS_KEY);
      if (storedReports !== null) {
        const rawReports: LostReport[] = JSON.parse(storedReports);
        
        // Filter out old legacy random seed IDs, unwanted test duplicates, and deleted tombstones
        this.reports = rawReports.filter(
          (r) =>
            !r.id.startsWith('LOST-849201') &&
            !r.id.startsWith('LOST-732910') &&
            !r.id.startsWith('LOST-621804') &&
            !r.id.startsWith('LOST-510492') &&
            !r.id.startsWith('LOST-BELLA-') &&
            !r.id.startsWith('LOST-MILO-') &&
            !r.id.startsWith('LOST-LUNA-') &&
            !r.id.startsWith('LOST-ROCKY-') &&
            !r.id.startsWith('LOST-SIMBA-') &&
            !r.id.startsWith('LOST-LEO-') &&
            !r.id.includes('1788863155592') &&
            r.id !== 'LOST-CHARLIE-SIGHTED' &&
            !this.isReportOrPetDeleted(r.id, r.dogId, r.dog?.id)
        );
      } else {
        // First run initialization: seed with baseline community reports
        this.reports = COMMUNITY_BASELINE_REPORTS.filter(
          (r) => !this.isReportOrPetDeleted(r.id, r.dogId, r.dog?.id)
        );
      }

      for (const rep of this.reports) {
        if ((rep.status as any) === 'REUNITED') {
          rep.status = 'SAFE';
        }
        rep.dog.primaryPhoto = resolveGenericMediaUrl(rep.dog.primaryPhoto);
        if (!rep.dog.photos || rep.dog.photos.length === 0) {
          rep.dog.photos = [rep.dog.primaryPhoto];
        } else {
          rep.dog.photos = rep.dog.photos.map((ph) => resolveGenericMediaUrl(ph));
        }
      }

      const storedSightings = localStorage.getItem(SIGHTINGS_KEY);
      const rawSightings: Sighting[] = storedSightings ? JSON.parse(storedSightings) : [];
      this.sightings = rawSightings.filter((s) => !this.isReportOrPetDeleted(s.reportId));

      const storedProfiles = localStorage.getItem(PROFILES_KEY);
      this.profiles = storedProfiles ? JSON.parse(storedProfiles) : [];
      // Clean up confirmed orphaned mock legacy user user-1788801094228 from offline cache
      if (this.profiles.some((p) => p.id === 'user-1788801094228' || p.userId === 'user-1788801094228')) {
        this.profiles = this.profiles.filter((p) => p.id !== 'user-1788801094228' && p.userId !== 'user-1788801094228');
        localStorage.setItem(PROFILES_KEY, JSON.stringify(this.profiles));
      }
      const storedUsers = localStorage.getItem(USERS_KEY);
      if (storedUsers && storedUsers.includes('user-1788801094228')) {
        try {
          const parsedUsers = JSON.parse(storedUsers);
          if (Array.isArray(parsedUsers)) {
            const filteredUsers = parsedUsers.filter((u: any) => u.id !== 'user-1788801094228');
            localStorage.setItem(USERS_KEY, JSON.stringify(filteredUsers));
          }
        } catch {}
      }

      const storedPets = localStorage.getItem(PETS_KEY);
      if (storedPets !== null) {
        const rawPets: DogProfile[] = JSON.parse(storedPets);
        this.pets = rawPets.filter((p) => !this.isReportOrPetDeleted(undefined, p.id, p.id));
      } else {
        this.pets = this.reports
          .map((r) => r.dog)
          .filter((p) => !this.isReportOrPetDeleted(undefined, p.id, p.id));
      }

      for (const p of this.pets) {
        if ((p.name || '').trim().toUpperCase() === 'SONU' || (p.id || '').includes('1788871495754')) {
          if (!p.primaryPhoto || p.primaryPhoto === abulluImg || p.primaryPhoto.includes('abullu')) {
            p.primaryPhoto = sonuImg;
          }
          if (!p.photos || p.photos.length === 0 || (p.photos.length === 1 && (p.photos[0] === abulluImg || p.photos[0].includes('abullu')))) {
            p.photos = [sonuImg];
          }
        }
      }

      const storedSkipped = localStorage.getItem(SKIPPED_PET_KEY);
      this.skippedPetUserIds = storedSkipped ? JSON.parse(storedSkipped) : [];

      const storedSkippedReports = localStorage.getItem(SKIPPED_REPORT_KEY);
      this.skippedReportUserIds = storedSkippedReports ? JSON.parse(storedSkippedReports) : [];

      const storedListingReports = localStorage.getItem(LISTING_REPORTS_KEY);
      this.listingReports = storedListingReports ? JSON.parse(storedListingReports) : [];

      const storedUserReports = localStorage.getItem(USER_REPORTS_KEY);
      this.userReports = storedUserReports ? JSON.parse(storedUserReports) : [];

      const storedBlocked = localStorage.getItem(BLOCKED_USERS_KEY);
      this.blockedUsers = storedBlocked ? JSON.parse(storedBlocked) : [];

      const storedSuggestions = localStorage.getItem(SUGGESTIONS_KEY);
      this.suggestions = storedSuggestions ? JSON.parse(storedSuggestions) : [];

      this.enforceIntegrityInvariants();
      this.commitAllStorage();
    } catch {
      this.reports = COMMUNITY_BASELINE_REPORTS.filter(
        (r) => !this.isReportOrPetDeleted(r.id, r.dogId, r.dog?.id)
      );
      this.sightings = [];
      this.profiles = [];
      this.pets = this.reports.map((r) => r.dog);
      this.skippedPetUserIds = [];
      this.skippedReportUserIds = [];
      this.listingReports = [];
      this.userReports = [];
      this.blockedUsers = [];
    }
  }

  private notifyUpdate() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
    }
  }

  // PUBLIC SAFE RETRIEVAL:
  private loadReports() {
    try {
      const storedReports = localStorage.getItem(REPORTS_KEY);
      if (storedReports !== null) {
        const parsed: LostReport[] = JSON.parse(storedReports);

        const filteredParsed = parsed.filter(
          (r) =>
            !r.id.startsWith('LOST-849201') &&
            !r.id.startsWith('LOST-732910') &&
            !r.id.startsWith('LOST-621804') &&
            !r.id.startsWith('LOST-510492') &&
            !r.id.startsWith('LOST-BELLA-') &&
            !r.id.startsWith('LOST-MILO-') &&
            !r.id.startsWith('LOST-LUNA-') &&
            !r.id.startsWith('LOST-ROCKY-') &&
            !r.id.startsWith('LOST-SIMBA-') &&
            !r.id.startsWith('LOST-LEO-') &&
            !r.id.includes('1788863155592') &&
            r.id !== 'LOST-CHARLIE-SIGHTED' &&
            !this.isReportOrPetDeleted(r.id, r.dogId, r.dog?.id)
        );

        for (const r of filteredParsed) {
          const rawId = r.ownerId ? r.ownerId.replace(/^owner-/, '') : '';
          const registeredPet = this.pets.find(
            (p) => p.ownerId === r.ownerId || p.ownerId === `owner-${rawId}` || p.ownerId === rawId
          );
          if (registeredPet) {
            if (registeredPet.name && (!r.dog.name || r.dog.name === 'My Dog')) {
              r.dog.name = registeredPet.name;
            }
            if (registeredPet.primaryPhoto && (!r.dog.primaryPhoto || r.dog.primaryPhoto.length < 5)) {
              r.dog.primaryPhoto = registeredPet.primaryPhoto;
            }
          }
          r.dog.primaryPhoto = resolveGenericMediaUrl(r.dog.primaryPhoto);
          if (!r.dog.photos || r.dog.photos.length === 0) {
            r.dog.photos = [r.dog.primaryPhoto];
          } else {
            r.dog.photos = r.dog.photos.map((ph) => resolveGenericMediaUrl(ph));
          }
        }
        this.reports = filteredParsed;
        this.enforceIntegrityInvariants();
      } else {
        this.reports = COMMUNITY_BASELINE_REPORTS.filter(
          (r) => !this.isReportOrPetDeleted(r.id, r.dogId, r.dog?.id)
        );
        this.enforceIntegrityInvariants();
      }
    } catch (e) {
      console.warn('Failed to load reports:', e);
      this.reports = COMMUNITY_BASELINE_REPORTS.filter(
        (r) => !this.isReportOrPetDeleted(r.id, r.dogId, r.dog?.id)
      );
      this.enforceIntegrityInvariants();
    }
  }

  getAllReports(): LostReport[] {
    this.loadReports();
    return [...this.reports].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getAllPets(): DogProfile[] {
    try {
      const storedPets = localStorage.getItem(PETS_KEY);
      if (storedPets) {
        const rawPets: DogProfile[] = JSON.parse(storedPets);
        this.pets = rawPets.filter((p) => !this.isReportOrPetDeleted(undefined, p.id, p.id));
      }
    } catch {}
    return [...this.pets];
  }

  getReportById(id: string): LostReport | undefined {
    this.loadReports();
    if (!id) return undefined;
    if (this.isReportOrPetDeleted(id)) return undefined;
    const cleanId = id.trim().toLowerCase();
    const canonicalId = normalizeReportId(cleanId);
    const withoutPrefix = cleanId.replace(/^lost-/, '');

    return (
      this.reports.find((r) => normalizeReportId(r.id) === canonicalId) ||
      this.reports.find((r) => r.id.toLowerCase() === cleanId) ||
      this.reports.find((r) => normalizeReportId(r.id).replace(/^lost-/, '') === withoutPrefix) ||
      this.reports.find((r) => (r.dog?.name || '').toLowerCase() === withoutPrefix) ||
      this.reports.find((r) => r.id.toLowerCase().includes(withoutPrefix))
    );
  }

  getReportsByOwner(ownerId: string): LostReport[] {
    this.loadReports();
    const cleanOwner = (ownerId || '').replace(/^owner-/, '');
    return this.reports.filter(
      (r) =>
        (r.ownerId === ownerId || r.ownerId === `owner-${cleanOwner}` || r.ownerId === cleanOwner) &&
        !this.isReportOrPetDeleted(r.id, r.dogId, r.dog?.id)
    );
  }

  createReport(report: LostReport): LostReport {
    return this.saveReport(report);
  }

  deleteReport(reportId: string): boolean {
    return this.executeTransaction(() => {
      const canonicalId = normalizeReportId(reportId);
      const cleanLower = reportId.toLowerCase().trim();
      const rawNoPrefix = cleanLower.replace(/^lost-/, '');

      // Find the target report before removing
      const targetReport = this.reports.find(
        (r) =>
          normalizeReportId(r.id) === canonicalId ||
          r.id === reportId ||
          r.id.toLowerCase() === cleanLower ||
          r.id.toLowerCase().replace(/^lost-/, '') === rawNoPrefix
      );

      const targetPetId = targetReport?.dogId || targetReport?.dog?.id;
      const targetOwnerId = targetReport?.ownerId;
      const rawOwnerId = targetOwnerId ? targetOwnerId.replace(/^owner-/, '') : '';

      // Record tombstone IDs in all variations so reloads/sync NEVER resurrect this report or pet
      const idsToTombstone = [
        reportId,
        canonicalId,
        cleanLower,
        canonicalId.toLowerCase(),
        reportId.toUpperCase(),
        canonicalId.toUpperCase(),
        rawNoPrefix,
        targetReport?.id,
        targetPetId,
      ].filter(Boolean) as string[];

      for (const id of idsToTombstone) {
        if (!this.deletedReportIds.includes(id)) {
          this.deletedReportIds.push(id);
        }
      }

      if (targetPetId) {
        const petIdsToTombstone = [
          targetPetId,
          targetPetId.toLowerCase(),
          targetPetId.toUpperCase(),
        ];
        for (const pid of petIdsToTombstone) {
          if (!this.deletedPetIds.includes(pid)) {
            this.deletedPetIds.push(pid);
          }
        }
      }

      // 1. Remove from reports list
      this.reports = this.reports.filter(
        (r) =>
          r.id !== reportId &&
          r.id.toLowerCase() !== cleanLower &&
          normalizeReportId(r.id) !== canonicalId &&
          r.id.toLowerCase().replace(/^lost-/, '') !== rawNoPrefix &&
          !this.isReportOrPetDeleted(r.id, r.dogId, r.dog?.id)
      );

      // 2. Remove all associated sightings
      this.sightings = this.sightings.filter(
        (s) =>
          s.reportId !== reportId &&
          s.reportId.toLowerCase() !== cleanLower &&
          normalizeReportId(s.reportId) !== canonicalId &&
          s.reportId.toLowerCase().replace(/^lost-/, '') !== rawNoPrefix &&
          !this.isReportOrPetDeleted(s.reportId)
      );

      // 3. Remove associated pet profile and any pet profile linked to this owner
      if (targetPetId) {
        this.pets = this.pets.filter(
          (p) =>
            p.id !== targetPetId &&
            p.id.toLowerCase() !== targetPetId.toLowerCase() &&
            p.id !== targetReport?.id &&
            !this.isReportOrPetDeleted(undefined, p.id, p.id)
        );
      }

      if (targetOwnerId || rawOwnerId) {
        const ownerPets = this.pets.filter(
          (p) =>
            p.ownerId === targetOwnerId ||
            p.ownerId === rawOwnerId ||
            p.ownerId === `owner-${rawOwnerId}` ||
            (p.ownerId && p.ownerId.replace(/^owner-/, '') === rawOwnerId)
        );
        for (const op of ownerPets) {
          if (!this.deletedPetIds.includes(op.id)) {
            this.deletedPetIds.push(op.id);
          }
          if (!this.deletedPetIds.includes(op.id.toLowerCase())) {
            this.deletedPetIds.push(op.id.toLowerCase());
          }
        }
        this.pets = this.pets.filter(
          (p) =>
            p.ownerId !== targetOwnerId &&
            p.ownerId !== rawOwnerId &&
            p.ownerId !== `owner-${rawOwnerId}` &&
            !(p.ownerId && p.ownerId.replace(/^owner-/, '') === rawOwnerId)
        );
      }

      // 4. Remove from skipped list
      if (targetOwnerId) {
        this.skippedReportUserIds = this.skippedReportUserIds.filter(
          (id) => id !== targetOwnerId && id !== `owner-${rawOwnerId}` && id !== rawOwnerId
        );
      }

      // 5. Cloud synchronization to Supabase database
      supabaseSyncService
        .deleteLostReport(reportId, targetPetId)
        .catch((e) => console.warn('[Supabase Sync Delete Report Notice]:', e));

      return true;
    });
  }

  deletePetProfile(petId: string, ownerId?: string): boolean {
    return this.executeTransaction(() => {
      const canonicalPetId = petId.toLowerCase().trim();
      const rawPetId = canonicalPetId.replace(/^pet-/, '').replace(/^dog-/, '');
      const rawOwnerId = ownerId ? ownerId.replace(/^owner-/, '').toLowerCase().trim() : '';

      // 1. Tombstone pet IDs
      const petIdsToTombstone = [
        petId,
        canonicalPetId,
        rawPetId,
        `pet-${rawPetId}`,
        `dog-${rawPetId}`,
      ];
      for (const pid of petIdsToTombstone) {
        if (!this.deletedPetIds.includes(pid)) {
          this.deletedPetIds.push(pid);
        }
      }

      // 2. Remove pet from this.pets (enforce removal of any pet belonging to this owner)
      this.pets = this.pets.filter((p) => {
        const pLower = p.id.toLowerCase();
        const pRaw = pLower.replace(/^pet-/, '').replace(/^dog-/, '');
        const pOwnerRaw = (p.ownerId || '').replace(/^owner-/, '').toLowerCase().trim();
        const matchPet = p.id === petId || pLower === canonicalPetId || pRaw === rawPetId;
        const matchOwner = rawOwnerId && (p.ownerId === ownerId || pOwnerRaw === rawOwnerId || p.ownerId === `owner-${rawOwnerId}`);
        return !matchPet && !matchOwner;
      });

      // 3. Remove and tombstone all linked reports
      const linkedReports = this.reports.filter((r) => {
        const rDogId = (r.dogId || r.dog?.id || '').toLowerCase();
        const rDogRaw = rDogId.replace(/^pet-/, '').replace(/^dog-/, '');
        const rOwnerRaw = (r.ownerId || '').replace(/^owner-/, '').toLowerCase().trim();
        const matchDog = rDogId === canonicalPetId || rDogRaw === rawPetId || r.dogId === petId;
        const matchOwner = rawOwnerId && (r.ownerId === ownerId || rOwnerRaw === rawOwnerId || r.ownerId === `owner-${rawOwnerId}`);
        return matchDog || matchOwner;
      });

      linkedReports.forEach((r) => {
        const cId = normalizeReportId(r.id);
        [r.id, cId, r.id.toLowerCase(), cId.toLowerCase()].forEach((id) => {
          if (!this.deletedReportIds.includes(id)) this.deletedReportIds.push(id);
        });
      });

      this.reports = this.reports.filter((r) => !linkedReports.some((lr) => lr.id === r.id));

      // 4. Remove linked sightings
      this.sightings = this.sightings.filter((s) => {
        return !linkedReports.some((lr) => lr.id === s.reportId || normalizeReportId(lr.id) === normalizeReportId(s.reportId));
      });

      // 5. Reset skipped states so user can start clean if needed
      if (rawOwnerId) {
        this.skippedPetUserIds = this.skippedPetUserIds.filter(
          (id) => id !== ownerId && id !== rawOwnerId && id !== `owner-${rawOwnerId}`
        );
        this.skippedReportUserIds = this.skippedReportUserIds.filter(
          (id) => id !== ownerId && id !== rawOwnerId && id !== `owner-${rawOwnerId}`
        );
      }

      // 6. Cloud sync deletion
      supabaseSyncService
        .deletePetAsAdmin(petId)
        .catch((e) => console.warn('[Supabase Delete Pet Notice]:', e));

      return true;
    });
  }

  deleteUserDataByEmail(email: string): boolean {
    return this.executeTransaction(() => {
      const targetEmail = email.toLowerCase().trim();

      // Find all report IDs and pet IDs belonging to this email
      const matchedReports = this.reports.filter((r) => {
        const ownerEmail = extractReportOwnerEmail(r, this.profiles);
        return ownerEmail === targetEmail;
      });

      const matchedOwnerIds = new Set<string>();
      matchedReports.forEach((r) => {
        const cId = normalizeReportId(r.id);
        [r.id, cId, r.id.toLowerCase(), cId.toLowerCase()].forEach((id) => {
          if (!this.deletedReportIds.includes(id)) this.deletedReportIds.push(id);
        });
        const pId = r.dogId || r.dog?.id;
        if (pId && !this.deletedPetIds.includes(pId)) {
          this.deletedPetIds.push(pId);
        }
        if (r.ownerId) {
          matchedOwnerIds.add(r.ownerId);
          matchedOwnerIds.add(r.ownerId.replace(/^owner-/, ''));
        }
      });

      // Find profiles matching this email
      const matchedProfiles = this.profiles.filter(
        (p) => p.email && p.email.toLowerCase().trim() === targetEmail
      );
      matchedProfiles.forEach((p) => {
        if (p.userId) matchedOwnerIds.add(p.userId);
        if (p.id) matchedOwnerIds.add(p.id);
      });

      // 1. Remove reports
      this.reports = this.reports.filter((r) => {
        const ownerEmail = extractReportOwnerEmail(r, this.profiles);
        return ownerEmail !== targetEmail && !this.isReportOrPetDeleted(r.id, r.dogId, r.dog?.id);
      });

      // 2. Remove sightings for those reports or reported by this email
      this.sightings = this.sightings.filter((s) => {
        const isTargetReporter = s.reporterEmail && s.reporterEmail.toLowerCase().trim() === targetEmail;
        const isTargetReport = matchedReports.some(
          (r) => normalizeReportId(r.id) === normalizeReportId(s.reportId) || r.id === s.reportId
        );
        return !isTargetReporter && !isTargetReport && !this.isReportOrPetDeleted(s.reportId);
      });

      // 3. Remove pets
      this.pets = this.pets.filter((p) => {
        const rawOwner = p.ownerId ? p.ownerId.replace(/^owner-/, '') : '';
        return (
          !matchedOwnerIds.has(p.ownerId) &&
          !matchedOwnerIds.has(rawOwner) &&
          !this.isReportOrPetDeleted(undefined, p.id, p.id) &&
          p.id !== 'dog-abullu-01' // preserve community baseline if not explicitly deleted
        );
      });

      // 4. Remove profiles
      this.profiles = this.profiles.filter(
        (p) => !p.email || p.email.toLowerCase().trim() !== targetEmail
      );

      // 5. Clear skipped lists
      matchedOwnerIds.forEach((id) => {
        this.skippedPetUserIds = this.skippedPetUserIds.filter((x) => x !== id);
        this.skippedReportUserIds = this.skippedReportUserIds.filter((x) => x !== id);
      });

      // 6. Cloud synchronization to Supabase
      supabaseSyncService
        .deleteUserDataByEmail(targetEmail)
        .catch((e) => console.warn('[Supabase Sync Delete User Data Notice]:', e));

      return true;
    });
  }

  updateReportStatus(reportId: string, status: ReportStatus): boolean {
    return this.executeTransaction(() => {
      const canonicalId = normalizeReportId(reportId);
      const normalizedStatus: ReportStatus = (status as any) === 'REUNITED' ? 'SAFE' : status;
      const report = this.reports.find((r) => normalizeReportId(r.id) === canonicalId || r.id === reportId);
      if (!report) return false;

      report.status = normalizedStatus;
      report.updatedAt = new Date().toISOString();

      const rawOwner = (report.ownerId || '').replace(/^owner-/, '');
      if (normalizedStatus === 'SAFE') {
        if (!this.skippedReportUserIds.includes(report.ownerId) && !this.skippedReportUserIds.includes(rawOwner)) {
          this.skippedReportUserIds.push(report.ownerId);
        }
      } else if (normalizedStatus === 'LOST') {
        this.skippedReportUserIds = this.skippedReportUserIds.filter(
          (id) => id !== report.ownerId && id !== `owner-${rawOwner}` && id !== rawOwner
        );
      }

      // Background sync to Supabase
      supabaseSyncService.syncLostReport(report).catch(() => {});
      supabaseSyncService.updatePetSafetyStatus(
        report.dogId || report.dog?.id || report.id,
        normalizedStatus === 'LOST'
      ).catch(() => {});

      return true;
    });
  }

  // SIGHTINGS (SCD Type 2 Historical Tracking):
  getSightingsForReport(reportId: string, currentOnly: boolean = false): Sighting[] {
    const canonicalId = normalizeReportId(reportId);
    return this.sightings
      .filter((s) => {
        const matches =
          normalizeReportId(s.reportId) === canonicalId || s.reportId.toLowerCase() === reportId.toLowerCase();
        if (!matches) return false;
        if (currentOnly) return s.isCurrent !== false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getActiveSightingsForReport(reportId: string): Sighting[] {
    return this.getSightingsForReport(reportId, true);
  }

  getHistoricalSightingsForReport(reportId: string): Sighting[] {
    const canonicalId = normalizeReportId(reportId);
    return this.sightings
      .filter(
        (s) =>
          (normalizeReportId(s.reportId) === canonicalId || s.reportId.toLowerCase() === reportId.toLowerCase()) &&
          s.isCurrent === false
      )
      .sort((a, b) => new Date(b.validTo || b.createdAt).getTime() - new Date(a.validTo || a.createdAt).getTime());
  }

  addSighting(sighting: Sighting): Sighting {
    return this.executeTransaction(() => {
      const now = new Date().toISOString();
      const canonicalReportId = normalizeReportId(sighting.reportId);

      // Unique reporter identity: email > userId > phone > sightingId
      const reporterEmail = (sighting.reporterEmail || '').toLowerCase().trim();
      const reporterPhone = (sighting.reporterPhone || '').replace(/\D/g, '');
      const reporterUserId = (sighting.reporterUserId || '').trim();

      // Find prior active sighting by this reporter on this report
      let existingActiveSighting: Sighting | undefined;
      for (const s of this.sightings) {
        if (
          normalizeReportId(s.reportId) !== canonicalReportId &&
          s.reportId.toLowerCase() !== sighting.reportId.toLowerCase()
        ) {
          continue;
        }
        if (s.isCurrent === false) continue; // Already archived/historical

        const sEmail = (s.reporterEmail || '').toLowerCase().trim();
        const sPhone = (s.reporterPhone || '').replace(/\D/g, '');
        const sUserId = (s.reporterUserId || '').trim();

        if (
          (reporterEmail.includes('@') && sEmail === reporterEmail) ||
          (reporterUserId && sUserId === reporterUserId) ||
          (reporterPhone && sPhone.length >= 7 && sPhone === reporterPhone)
        ) {
          existingActiveSighting = s;
          break;
        }
      }

      let version = 1;
      if (existingActiveSighting) {
        // SCD Type 2: Close out prior active sighting
        existingActiveSighting.isCurrent = false;
        existingActiveSighting.validTo = now;
        existingActiveSighting.supersededBy = sighting.id;
        version = (existingActiveSighting.version || 1) + 1;
      }

      // Create new current active sighting
      const currentSighting: Sighting = {
        ...sighting,
        isCurrent: true,
        validFrom: now,
        validTo: null,
        version,
        createdAt: sighting.createdAt || now,
      };

      this.sightings.unshift(currentSighting);

      // Increment / update sighting count on report
      const report = this.reports.find(
        (r) => normalizeReportId(r.id) === canonicalReportId || r.id === sighting.reportId
      );
      if (report) {
        const activeCount = this.sightings.filter(
          (s) =>
            (normalizeReportId(s.reportId) === canonicalReportId ||
              s.reportId.toLowerCase() === sighting.reportId.toLowerCase()) &&
            s.isCurrent !== false
        ).length;
        report.sightingCount = activeCount;
        if (report.status !== 'SAFE' && (report.status as any) !== 'REUNITED') {
          report.status = 'LOST';
        }
        report.updatedAt = now;
      }

      // Background sync to Supabase
      supabaseSyncService.syncSighting(currentSighting).catch((e) => console.warn('[Supabase Sync Sighting Notice]:', e));

      return currentSighting;
    });
  }

  loadProfiles(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(PROFILES_KEY);
        if (stored) {
          this.profiles = JSON.parse(stored);
        }
      } catch {}
    }
  }

  loadPets(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(PETS_KEY);
        if (stored) {
          const rawPets: DogProfile[] = JSON.parse(stored);
          this.pets = rawPets.filter((p) => !this.isReportOrPetDeleted(undefined, p.id, p.id));
        }
      } catch {}
    }
  }

  getOwnerProfileByUserId(userId: string, email?: string): OwnerProfile | undefined {
    this.loadProfiles();
    if (!userId && !email) return undefined;
    const rawUserId = (userId || '').replace(/^owner-/, '');
    const cleanEmail = email?.trim().toLowerCase();

    // 1. Direct ID match
    let match: OwnerProfile | undefined;
    if (userId) {
      match = this.profiles.find(
        (p) =>
          p.userId === userId ||
          p.userId === rawUserId ||
          p.id === userId ||
          p.id === `owner-${userId}` ||
          p.id === `owner-${rawUserId}`
      );
    }

    // 2. Email match
    if (!match && cleanEmail) {
      match = this.profiles.find((p) => p.email && p.email.trim().toLowerCase() === cleanEmail);
    }

    if (match) {
      // Auto-heal missing photo: If matched profile has no photo, locate photo across profiles or active auth user
      if (!match.photo) {
        const withPhoto = this.profiles.find(
          (p) =>
            p.photo &&
            ((cleanEmail && p.email && p.email.trim().toLowerCase() === cleanEmail) ||
              (rawUserId && (p.userId === rawUserId || p.id === rawUserId || p.id === `owner-${rawUserId}`)))
        );
        if (withPhoto?.photo) {
          match.photo = withPhoto.photo;
        } else {
          const activeUser = authService.getCurrentUser();
          if (
            activeUser?.avatar &&
            (activeUser.id === rawUserId || (cleanEmail && activeUser.email?.trim().toLowerCase() === cleanEmail))
          ) {
            match.photo = activeUser.avatar;
          }
        }
      }
      return match;
    }

    return undefined;
  }

  getOwnerProfileByEmail(email: string): OwnerProfile | undefined {
    this.loadProfiles();
    if (!email) return undefined;
    const clean = email.trim().toLowerCase();
    const match = this.profiles.find((p) => p.email && p.email.trim().toLowerCase() === clean);
    if (match) {
      if (!match.photo) {
        const withPhoto = this.profiles.find((p) => p.email && p.email.trim().toLowerCase() === clean && p.photo);
        if (withPhoto?.photo) {
          match.photo = withPhoto.photo;
        } else {
          const activeUser = authService.getCurrentUser();
          if (activeUser?.avatar && activeUser.email?.trim().toLowerCase() === clean) {
            match.photo = activeUser.avatar;
          }
        }
      }
      return match;
    }
    return undefined;
  }

  hasCompletedOwnerProfile(userId: string, email?: string): boolean {
    const profile = this.getOwnerProfileByUserId(userId, email);
    return !!(profile && profile.fullName && profile.phone);
  }

  hasCompletedLocation(userId: string, email?: string): boolean {
    const profile = this.getOwnerProfileByUserId(userId, email);
    return !!(profile && (profile.district || profile.city));
  }

  // PET PROFILES:
  getPetProfileByUserId(userId: string, email?: string): DogProfile | undefined {
    this.loadPets();
    this.loadReports();
    if (!userId && !email) return undefined;
    const rawUserId = (userId || '').replace(/^owner-/, '');

    // 1. Match in pets collection
    if (userId) {
      const directPet = this.pets.find(
        (p) =>
          p.ownerId === `owner-${userId}` ||
          p.ownerId === userId ||
          p.ownerId === `owner-${rawUserId}` ||
          p.ownerId === rawUserId
      );
      if (directPet) return directPet;
    }

    // 2. Match in reports collection (by userId or by email)
    const cleanEmail = email?.trim().toLowerCase();
    const rep = this.reports.find(
      (r) =>
        ((userId && (r.ownerId === `owner-${userId}` || r.ownerId === userId || r.ownerId === `owner-${rawUserId}` || r.ownerId === rawUserId)) ||
          (cleanEmail && r.contactMechanism?.safeContactEmail?.trim().toLowerCase() === cleanEmail)) &&
        !this.isReportOrPetDeleted(r.id, r.dogId, r.dog?.id)
    );
    if (rep && rep.dog) {
      return rep.dog;
    }

    return undefined;
  }

  /**
   * Safe migration helper: Associates any local unauthenticated or legacy records
   * with the newly verified Supabase authenticated user (auth.uid()).
   */
  migrateUserDataToAuthenticatedUser(authUid: string, email: string): void {
    if (!authUid || !email) return;
    this.executeTransaction(() => {
      const cleanEmail = email.toLowerCase().trim();

      // 1. Migrate owner profile matching this email
      for (const p of this.profiles) {
        if (p.email?.toLowerCase().trim() === cleanEmail) {
          p.userId = authUid;
          p.id = authUid;
          p.updatedAt = new Date().toISOString();
        }
      }

      // 2. Migrate pet profiles
      for (const pet of this.pets) {
        const ownerProfile = this.profiles.find((p) => p.userId === authUid);
        if (
          pet.ownerId.toLowerCase().includes(cleanEmail) ||
          (ownerProfile && (pet.ownerId === ownerProfile.id || pet.ownerId.replace(/^owner-/, '') === ownerProfile.userId))
        ) {
          pet.ownerId = authUid;
        }
      }

      // 3. Migrate lost reports
      for (const r of this.reports) {
        const rEmail = r.contactMechanism?.safeContactEmail?.toLowerCase().trim() || '';
        if (rEmail === cleanEmail || r.ownerId.toLowerCase().includes(cleanEmail)) {
          r.ownerId = authUid;
          r.updatedAt = new Date().toISOString();
        }
      }

      // 4. Migrate sightings
      for (const s of this.sightings) {
        if (s.reporterEmail?.toLowerCase().trim() === cleanEmail) {
          s.reporterUserId = authUid;
        }
      }
    });
  }

  savePetProfile(pet: DogProfile): DogProfile {
    return this.executeTransaction(() => {
      const rawUserId = pet.ownerId.replace(/^owner-/, '');
      pet.ownerId = rawUserId;
      this.skippedPetUserIds = this.skippedPetUserIds.filter(
        (id) => id !== pet.ownerId && id !== `owner-${rawUserId}` && id !== rawUserId
      );

      // Invariant: Exactly one pet profile per owner. If one already exists, edit/update it.
      const existingPetIndex = this.pets.findIndex(
        (p) => p.id === pet.id || p.ownerId === pet.ownerId || p.ownerId === `owner-${rawUserId}` || p.ownerId === rawUserId
      );
      const targetPetId = existingPetIndex >= 0 ? this.pets[existingPetIndex].id : pet.id;
      const canonicalPet: DogProfile = {
        ...pet,
        id: targetPetId,
        ownerId: rawUserId,
      };

      // Filter out any other entries for this owner, keeping strictly 1 pet
      this.pets = this.pets.filter(
        (p) =>
          p.id !== targetPetId &&
          p.ownerId !== pet.ownerId &&
          p.ownerId !== `owner-${rawUserId}` &&
          p.ownerId !== rawUserId
      );
      this.pets.push(canonicalPet);

      // Fetch owner profile for location and contact details
      const ownerProfile = this.getOwnerProfileByUserId(canonicalPet.ownerId);
      const approxLoc =
        ownerProfile?.approximateArea ||
        [ownerProfile?.city, ownerProfile?.district, ownerProfile?.state].filter(Boolean).join(', ') ||
        'Local Neighborhood';

      // Find existing report for this owner or pet
      let existingReport = this.reports.find(
        (r) =>
          r.dogId === targetPetId ||
          r.dog?.id === targetPetId ||
          r.dogId === pet.id ||
          r.dog?.id === pet.id ||
          r.ownerId === canonicalPet.ownerId ||
          r.ownerId === `owner-${rawUserId}` ||
          r.ownerId === rawUserId
      );

      if (existingReport) {
        existingReport.dogId = targetPetId;
        existingReport.dog = {
          ...existingReport.dog,
          id: targetPetId,
          ownerId: rawUserId,
          name: canonicalPet.name,
          breed: canonicalPet.breed,
          gender: canonicalPet.gender,
          age: canonicalPet.age,
          size: canonicalPet.size,
          color: canonicalPet.color,
          distinguishingMarks: canonicalPet.distinguishingMarks,
          collarInfo: canonicalPet.collarInfo,
          primaryPhoto: canonicalPet.primaryPhoto || existingReport.dog.primaryPhoto || abulluImg,
          photos: canonicalPet.photos && canonicalPet.photos.length > 0 ? canonicalPet.photos : existingReport.dog.photos,
        };
        if (!existingReport.ownerApproximateLocation || existingReport.ownerApproximateLocation === 'Local Neighborhood') {
          existingReport.ownerApproximateLocation = approxLoc;
          existingReport.lastKnownLocation = existingReport.lastKnownLocation || approxLoc;
        }
        existingReport.updatedAt = new Date().toISOString();
      } else {
        // Auto-create a synchronized Safe at Home report so the newly registered pet immediately appears in the community dashboard
        const reportId = `LOST-${targetPetId.replace(/^pet-/, '').replace(/^dog-/, '')}`;
        if (!this.isReportOrPetDeleted(reportId, targetPetId)) {
          const newReport: LostReport = {
            id: reportId,
            dogId: targetPetId,
            ownerId: rawUserId,
            dog: { ...canonicalPet, primaryPhoto: canonicalPet.primaryPhoto || abulluImg, photos: canonicalPet.photos?.length ? canonicalPet.photos : [abulluImg] },
            ownerApproximateLocation: approxLoc,
            lastKnownLocation: approxLoc,
            lastKnownLatitude: ownerProfile?.latitude,
            lastKnownLongitude: ownerProfile?.longitude,
            dateLost: new Date().toISOString().split('T')[0],
            timeLost: '12:00 PM',
            additionalNotes: '',
            status: 'SAFE',
            contactMechanism: {
              showPhone: true,
              showEmail: true,
              safeContactPhone: ownerProfile?.phone || '',
              safeContactEmail: ownerProfile?.email || '',
              contactNote: 'Safe at home with loving family.',
            },
            sightingCount: 0,
            createdAt: canonicalPet.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.reports.unshift(newReport);
          existingReport = newReport;
        }
      }

      // Enforce strictly 1 report for this owner
      this.reports = this.reports.filter(
        (r) =>
          r === existingReport ||
          (r.ownerId !== canonicalPet.ownerId &&
            r.ownerId !== `owner-${rawUserId}` &&
            r.ownerId !== rawUserId &&
            r.dogId !== targetPetId &&
            r.dog?.id !== targetPetId)
      );

      // Background sync to Supabase and Firebase
      supabaseSyncService.syncPet(canonicalPet).catch((e) => console.warn('[Supabase Sync Pet Notice]:', e));
      if (firebaseSyncService.isConfigured()) {
        firebaseSyncService.syncPet(canonicalPet).catch((e) => console.warn('[Firebase Sync Pet Notice]:', e));
      }

      return canonicalPet;
    });
  }

  skipPetProfile(userId: string): void {
    this.executeTransaction(() => {
      const rawUserId = userId.replace(/^owner-/, '');
      if (!this.skippedPetUserIds.includes(userId) && !this.skippedPetUserIds.includes(rawUserId)) {
        this.skippedPetUserIds.push(userId);
      }
    });
  }

  hasSkippedPetProfile(userId: string): boolean {
    const rawUserId = userId.replace(/^owner-/, '');
    return this.skippedPetUserIds.includes(userId) || this.skippedPetUserIds.includes(rawUserId);
  }

  hasCompletedPetProfile(userId: string, email?: string): boolean {
    return !!this.getPetProfileByUserId(userId, email) || this.hasSkippedPetProfile(userId);
  }

  hasCompletedDogProfile(userId: string, email?: string): boolean {
    return this.hasCompletedPetProfile(userId, email);
  }

  // LOST DOG REPORT MANAGEMENT:
  getLatestReportByUserId(userId: string, email?: string): LostReport | undefined {
    this.loadReports();
    if (!userId && !email) return undefined;
    const rawUserId = (userId || '').replace(/^owner-/, '');
    const cleanEmail = email?.trim().toLowerCase();

    return this.reports.find((r) => {
      if (this.isReportOrPetDeleted(r.id, r.dogId, r.dog?.id)) return false;
      if (userId && (r.ownerId === `owner-${userId}` || r.ownerId === userId || r.ownerId === `owner-${rawUserId}` || r.ownerId === rawUserId)) {
        return true;
      }
      if (cleanEmail && r.contactMechanism?.safeContactEmail?.trim().toLowerCase() === cleanEmail) {
        return true;
      }
      return false;
    });
  }

  saveReport(report: LostReport): LostReport {
    return this.executeTransaction(() => {
      const rawUserId = (report.ownerId || '').replace(/^(owner-)+/, '');
      report.ownerId = rawUserId;
      const ownerEmail = extractReportOwnerEmail(report, this.profiles);

      if ((report.status as any) === 'REUNITED') {
        report.status = 'SAFE';
      }

      if (report.status === 'LOST') {
        this.skippedReportUserIds = this.skippedReportUserIds.filter((id) => {
          const clean = id.replace(/^(owner-)+/, '');
          if (clean === rawUserId || id === report.ownerId || id === `owner-${rawUserId}`) return false;
          if (ownerEmail && id.toLowerCase() === ownerEmail.toLowerCase()) return false;
          return true;
        });
      } else if (report.status === 'SAFE') {
        if (!this.skippedReportUserIds.includes(report.ownerId) && !this.skippedReportUserIds.includes(rawUserId)) {
          this.skippedReportUserIds.push(report.ownerId);
        }
      }

      const canonicalId = normalizeReportId(report.id);

      // Find existing report by canonical ID OR by owner unique email OR by owner ID
      const existingIdx = this.reports.findIndex((r) => {
        if (normalizeReportId(r.id) === canonicalId) return true;
        const rEmail = extractReportOwnerEmail(r, this.profiles);
        if (ownerEmail.includes('@') && rEmail === ownerEmail) return true;
        if (r.ownerId === report.ownerId || r.ownerId === `owner-${rawUserId}` || r.ownerId === rawUserId) return true;
        return false;
      });

      if (existingIdx >= 0) {
        // Atomic in-place update (prevents duplicate rows for the same unique email)
        this.reports[existingIdx] = {
          ...this.reports[existingIdx],
          ...report,
          id: this.reports[existingIdx].id, // Preserve established ID
          status: report.status, // Explicitly use the new status
          updatedAt: new Date().toISOString(),
        };
      } else {
        this.reports.unshift(report);
      }

      this.enforceIntegrityInvariants();

      // Background sync to Supabase
      supabaseSyncService.syncLostReport(report).catch((e) => console.warn('[Supabase Sync Report Notice]:', e));

      supabaseSyncService.updatePetSafetyStatus(
        report.dogId || report.dog?.id || report.id,
        report.status === 'LOST'
      ).catch((e) => console.warn('[Supabase Update Safety Notice]:', e));

      return report;
    });
  }

  skipReport(userId: string): void {
    this.executeTransaction(() => {
      const rawUserId = userId.replace(/^owner-/, '');
      if (!this.skippedReportUserIds.includes(userId) && !this.skippedReportUserIds.includes(rawUserId)) {
        this.skippedReportUserIds.push(userId);
      }
    });
  }

  markPetSafe(userId: string, email?: string): void {
    this.executeTransaction(() => {
      const rawUserId = userId.replace(/^owner-/, '');
      const cleanEmail = email?.trim().toLowerCase();
      if (!this.skippedReportUserIds.includes(userId) && !this.skippedReportUserIds.includes(rawUserId)) {
        this.skippedReportUserIds.push(userId);
      }

      // Atomically resolve active reports for this owner
      let matched = false;
      for (const r of this.reports) {
        if (
          r.ownerId === `owner-${userId}` ||
          r.ownerId === userId ||
          r.ownerId === `owner-${rawUserId}` ||
          r.ownerId === rawUserId ||
          (cleanEmail && r.contactMechanism?.safeContactEmail?.trim().toLowerCase() === cleanEmail)
        ) {
          r.status = 'SAFE';
          r.updatedAt = new Date().toISOString();
          matched = true;
        }
      }

      // If no report exists yet but a pet profile is registered, auto-create the Safe at Home report
      if (!matched) {
        const pet = this.getPetProfileByUserId(userId, email);
        const ownerProfile = this.getOwnerProfileByUserId(userId, email);
        if (pet) {
          const approxLoc =
            ownerProfile?.approximateArea ||
            [ownerProfile?.city, ownerProfile?.district, ownerProfile?.state].filter(Boolean).join(', ') ||
            'Local Neighborhood';
          const reportId = `LOST-${pet.id.replace(/^pet-/, '').replace(/^dog-/, '')}`;
          if (!this.isReportOrPetDeleted(reportId, pet.id)) {
            const newReport: LostReport = {
              id: reportId,
              dogId: pet.id,
              ownerId: `owner-${rawUserId}`,
              dog: { ...pet, primaryPhoto: pet.primaryPhoto || abulluImg, photos: pet.photos?.length ? pet.photos : [abulluImg] },
              ownerApproximateLocation: approxLoc,
              lastKnownLocation: approxLoc,
              lastKnownLatitude: ownerProfile?.latitude,
              lastKnownLongitude: ownerProfile?.longitude,
              dateLost: new Date().toISOString().split('T')[0],
              timeLost: '12:00 PM',
              additionalNotes: '',
              status: 'SAFE',
              contactMechanism: {
                showPhone: true,
                showEmail: true,
                safeContactPhone: ownerProfile?.phone || '',
                safeContactEmail: ownerProfile?.email || '',
                contactNote: 'Safe at home with loving family.',
              },
              sightingCount: 0,
              createdAt: pet.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            this.reports.unshift(newReport);
          }
        }
      }
    });
  }

  markPetLost(userId: string, email?: string): void {
    this.executeTransaction(() => {
      const rawUserId = userId.replace(/^(owner-)+/, '');
      const cleanEmail = email?.trim().toLowerCase();
      this.skippedReportUserIds = this.skippedReportUserIds.filter((id) => {
        const cleanId = id.replace(/^(owner-)+/, '');
        if (cleanId === rawUserId || id === userId || id === `owner-${rawUserId}`) return false;
        if (cleanEmail && id.toLowerCase() === cleanEmail) return false;
        return true;
      });

      // Atomically mark reports as LOST for this owner
      let matched = false;
      for (const r of this.reports) {
        if (
          r.ownerId === `owner-${userId}` ||
          r.ownerId === userId ||
          r.ownerId === `owner-${rawUserId}` ||
          r.ownerId === rawUserId ||
          (cleanEmail && r.contactMechanism?.safeContactEmail?.trim().toLowerCase() === cleanEmail)
        ) {
          r.status = 'LOST';
          r.updatedAt = new Date().toISOString();
          matched = true;
        }
      }

      // If no report exists yet, auto-create the missing alert report
      if (!matched) {
        const pet = this.getPetProfileByUserId(userId, email);
        const ownerProfile = this.getOwnerProfileByUserId(userId, email);
        const approxLoc =
          ownerProfile?.approximateArea ||
          [ownerProfile?.city, ownerProfile?.district, ownerProfile?.state].filter(Boolean).join(', ') ||
          'Local Neighborhood';
        const dogId = pet?.id || `pet-${rawUserId}`;
        const reportId = `LOST-${dogId.replace(/^pet-/, '').replace(/^dog-/, '')}`;
        if (!this.isReportOrPetDeleted(reportId, dogId)) {
          const newReport: LostReport = {
            id: reportId,
            dogId: dogId,
            ownerId: `owner-${rawUserId}`,
            dog: pet
              ? { ...pet, primaryPhoto: pet.primaryPhoto || abulluImg, photos: pet.photos?.length ? pet.photos : [abulluImg] }
              : {
                  id: dogId,
                  ownerId: `owner-${rawUserId}`,
                  name: 'My Dog',
                  breed: 'Companion Pet',
                  gender: 'Male',
                  age: '2 years',
                  size: 'Medium (10-25kg)',
                  color: 'Not specified',
                  distinguishingMarks: '',
                  primaryPhoto: abulluImg,
                  photos: [abulluImg],
                  createdAt: new Date().toISOString(),
                },
            ownerApproximateLocation: approxLoc,
            lastKnownLocation: approxLoc,
            lastKnownLatitude: ownerProfile?.latitude,
            lastKnownLongitude: ownerProfile?.longitude,
            dateLost: new Date().toISOString().split('T')[0],
            timeLost: '12:00 PM',
            additionalNotes: '',
            status: 'LOST',
            contactMechanism: {
              showPhone: true,
              showEmail: true,
              safeContactPhone: ownerProfile?.phone || '',
              safeContactEmail: ownerProfile?.email || cleanEmail || '',
              contactNote: 'Please reach out immediately if spotted!',
            },
            sightingCount: 0,
            createdAt: pet?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.reports.unshift(newReport);
        }
      }
    });
  }

  clearPetSafe(userId: string): void {
    this.executeTransaction(() => {
      const rawUserId = userId.replace(/^(owner-)+/, '');
      this.skippedReportUserIds = this.skippedReportUserIds.filter(
        (id) => id.replace(/^(owner-)+/, '') !== rawUserId && id !== userId && id !== `owner-${rawUserId}`
      );
    });
  }

  getPetSafetyStatus(userId: string, email?: string): 'SAFE' | 'LOST' | 'UNDECIDED' {
    if (!userId && !email) return 'UNDECIDED';
    const rep = this.getLatestReportByUserId(userId, email);
    if (rep) {
      if (rep.status === 'LOST') return 'LOST';
      if (rep.status === 'SAFE' || (rep.status as any) === 'REUNITED') return 'SAFE';
    }
    if (this.hasSkippedReport(userId)) return 'SAFE';
    return 'UNDECIDED';
  }

  isPetSafe(userId: string, email?: string): boolean {
    if (!userId && !email) return false;
    const rep = this.getLatestReportByUserId(userId, email);
    if (rep) {
      if (rep.status === 'LOST') return false;
      if (rep.status === 'SAFE' || (rep.status as any) === 'REUNITED') return true;
    }
    return this.hasSkippedReport(userId);
  }

  hasSkippedReport(userId: string): boolean {
    const rawUserId = userId.replace(/^(owner-)+/, '');
    return this.skippedReportUserIds.some((id) => {
      const clean = id.replace(/^(owner-)+/, '');
      return clean === rawUserId || id === userId || id === `owner-${rawUserId}`;
    });
  }

  hasCompletedReport(userId: string, email?: string): boolean {
    return !!this.getLatestReportByUserId(userId, email) || this.hasSkippedReport(userId);
  }

  saveOwnerProfile(profile: OwnerProfile, forceRemovePhoto = false): OwnerProfile {
    return this.executeTransaction(() => {
      const cleanEmail = profile.email?.trim().toLowerCase();
      const rawUserId = (profile.userId || profile.id || '').replace(/^owner-/, '');
      profile.userId = rawUserId;
      profile.id = rawUserId;

      const index = this.profiles.findIndex(
        (p) =>
          p.id === profile.id ||
          p.userId === profile.userId ||
          p.id === `owner-${rawUserId}` ||
          p.userId === rawUserId ||
          (cleanEmail && p.email && p.email.trim().toLowerCase() === cleanEmail)
      );

      // Cleanse any pet photo from owner profile
      if (isPetPhotoUrl(profile.photo)) {
        profile.photo = undefined;
      }

      let finalPhoto: string | undefined;
      if (forceRemovePhoto) {
        finalPhoto = undefined;
      } else if (profile.photo && !isPetPhotoUrl(profile.photo)) {
        finalPhoto = profile.photo.trim();
      } else if (index >= 0 && this.profiles[index]?.photo && !isPetPhotoUrl(this.profiles[index]?.photo)) {
        finalPhoto = this.profiles[index].photo;
      } else if (cleanEmail) {
        const matchingByEmail = this.profiles.find(
          (p) => p.email && p.email.trim().toLowerCase() === cleanEmail && p.photo && !isPetPhotoUrl(p.photo)
        );
        if (matchingByEmail?.photo) finalPhoto = matchingByEmail.photo;
      }

      if (!finalPhoto && !forceRemovePhoto) {
        const activeUser = authService.getCurrentUser();
        if (activeUser?.avatar && !isPetPhotoUrl(activeUser.avatar)) {
          finalPhoto = activeUser.avatar;
        }
      }

      if (index >= 0) {
        this.profiles[index] = {
          ...this.profiles[index],
          ...profile,
          photo: finalPhoto,
          updatedAt: new Date().toISOString(),
        };
      } else {
        this.profiles.push({
          ...profile,
          photo: finalPhoto,
          updatedAt: new Date().toISOString(),
        });
      }

      const approxLoc =
        profile.approximateArea ||
        [profile.city, profile.district, profile.state].filter(Boolean).join(', ') ||
        'Local Neighborhood';

      // Update location and contact details on any existing reports for this owner
      let hasReport = false;
      for (const r of this.reports) {
        if (
          r.ownerId === profile.id ||
          r.ownerId === profile.userId ||
          r.ownerId === `owner-${rawUserId}` ||
          r.ownerId === rawUserId ||
          (profile.email && r.contactMechanism?.safeContactEmail?.trim().toLowerCase() === profile.email.trim().toLowerCase())
        ) {
          r.ownerApproximateLocation = approxLoc;
          if (!r.lastKnownLocation || r.lastKnownLocation === 'Local Neighborhood') {
            r.lastKnownLocation = approxLoc;
          }
          if (profile.latitude) r.lastKnownLatitude = profile.latitude;
          if (profile.longitude) r.lastKnownLongitude = profile.longitude;
          if (profile.phone && r.contactMechanism) r.contactMechanism.safeContactPhone = profile.phone;
          if (profile.email && r.contactMechanism) r.contactMechanism.safeContactEmail = profile.email;
          r.updatedAt = new Date().toISOString();
          hasReport = true;
        }
      }

      // If owner has a registered pet profile but no report yet, auto-create the Safe at Home report with the newly saved location
      if (!hasReport) {
        const pet = this.getPetProfileByUserId(profile.userId || profile.id, profile.email);
        if (pet) {
          const reportId = `LOST-${pet.id.replace(/^pet-/, '').replace(/^dog-/, '')}`;
          if (!this.isReportOrPetDeleted(reportId, pet.id)) {
            const newReport: LostReport = {
              id: reportId,
              dogId: pet.id,
              ownerId: rawUserId,
              dog: { ...pet, primaryPhoto: pet.primaryPhoto || abulluImg, photos: pet.photos?.length ? pet.photos : [abulluImg] },
              ownerApproximateLocation: approxLoc,
              lastKnownLocation: approxLoc,
              lastKnownLatitude: profile.latitude,
              lastKnownLongitude: profile.longitude,
              dateLost: new Date().toISOString().split('T')[0],
              timeLost: '12:00 PM',
              additionalNotes: '',
              status: 'SAFE',
              contactMechanism: {
                showPhone: true,
                showEmail: true,
                safeContactPhone: profile.phone || '',
                safeContactEmail: profile.email || '',
                contactNote: 'Safe at home with loving family.',
              },
              sightingCount: 0,
              createdAt: pet.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            this.reports.unshift(newReport);
          }
        }
      }

      // Background sync to Supabase and Firebase
      supabaseSyncService
        .syncOwnerProfile(profile, profile.userId || profile.id)
        .catch((e) => console.warn('[Supabase Sync Owner Notice]:', e));
      if (firebaseSyncService.isConfigured()) {
        firebaseSyncService
          .syncOwnerProfile(profile, profile.userId || profile.id)
          .catch((e) => console.warn('[Firebase Sync Owner Notice]:', e));
      }

      return profile;
    });
  }

  // PRIVACY HELPER: Computes safe public approximate location
  formatPublicApproximateLocation(district: string, state: string, locality?: string): string {
    const loc = locality ? locality.replace(/house\s*#?\d+|flat\s*#?\d+|door\s*#?\d+/gi, '').trim() : '';
    if (loc && loc.length > 2) {
      return `Near ${loc}, ${district}`;
    }
    return `${district}, ${state}`;
  }


  // LISTING REPORTING
  submitListingReport(
    reportId: string,
    dogName: string,
    category: ListingReportCategory,
    details?: string,
    reporterUserId?: string
  ): ListingReport {
    return this.executeTransaction(() => {
      const report: ListingReport = {
        id: `rep-listing-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        reportId,
        dogName,
        category,
        details: details?.trim() || undefined,
        reporterUserId: reporterUserId || undefined,
        createdAt: new Date().toISOString(),
        status: 'PENDING',
      };
      this.listingReports.unshift(report);
      return report;
    });
  }

  getListingReports(): ListingReport[] {
    return [...this.listingReports];
  }

  // USER REPORTING
  submitUserReport(
    targetUserId: string,
    targetUserName: string | undefined,
    category: UserReportCategory,
    details?: string,
    reporterUserId?: string
  ): UserReport {
    return this.executeTransaction(() => {
      const report: UserReport = {
        id: `rep-user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        targetUserId,
        targetUserName,
        category,
        details: details?.trim() || undefined,
        reporterUserId: reporterUserId || undefined,
        createdAt: new Date().toISOString(),
        status: 'PENDING',
      };
      this.userReports.unshift(report);
      return report;
    });
  }

  getUserReports(): UserReport[] {
    return [...this.userReports];
  }

  // USER BLOCKING
  blockUser(userId: string, userName?: string): void {
    this.executeTransaction(() => {
      if (!this.isUserBlocked(userId)) {
        this.blockedUsers.push({
          blockedUserId: userId,
          blockedUserName: userName,
          blockedAt: new Date().toISOString(),
        });
      }
    });
  }

  unblockUser(userId: string): void {
    this.executeTransaction(() => {
      this.blockedUsers = this.blockedUsers.filter((b) => b.blockedUserId !== userId);
    });
  }

  getBlockedUsers(): BlockedUserRecord[] {
    return [...this.blockedUsers];
  }

  getBlockedUserIds(): string[] {
    return this.blockedUsers.map((b) => b.blockedUserId);
  }

  isUserBlocked(userId: string): boolean {
    return this.blockedUsers.some((b) => b.blockedUserId === userId);
  }

  // ==========================================
  // ADMIN & COMMUNITY DATA MANAGEMENT METHODS
  // ==========================================

  getAllRegisteredUsers(): User[] {
    const userMap = new Map<string, User>();

    // 1. From Registered Users Storage
    try {
      const storedUsers = localStorage.getItem(USERS_KEY);
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
      users.forEach((u) => {
        if (u && u.email) userMap.set(u.email.toLowerCase().trim(), u);
      });
    } catch {}

    // 2. From Active Supabase Session
    try {
      const activeUser = authService.getCurrentUser();
      if (activeUser && activeUser.email && !userMap.has(activeUser.email.toLowerCase().trim())) {
        userMap.set(activeUser.email.toLowerCase().trim(), activeUser);
      }
    } catch {}

    // 3. Inferred from Owner Profiles
    try {
      this.profiles.forEach((p) => {
        if (p.email && p.email.includes('@')) {
          const emailKey = p.email.toLowerCase().trim();
          if (!userMap.has(emailKey)) {
            userMap.set(emailKey, {
              id: p.userId || p.id || `user-${Date.now()}`,
              name: p.fullName || emailKey.split('@')[0],
              email: p.email,
              phone: p.phone,
              isAdmin: emailKey === 'jksurampudi5@gmail.com',
              createdAt: p.updatedAt || new Date().toISOString(),
            });
          }
        }
      });
    } catch {}

    // 4. Inferred from Lost Reports
    try {
      this.reports.forEach((r) => {
        const contactEmail = r.contactMechanism?.safeContactEmail;
        if (contactEmail && contactEmail.includes('@')) {
          const emailKey = contactEmail.toLowerCase().trim();
          if (!userMap.has(emailKey)) {
            const rawOwner = (r.ownerId || '').replace(/^owner-/, '');
            userMap.set(emailKey, {
              id: rawOwner || `user-${Date.now()}`,
              name: rawOwner ? rawOwner.charAt(0).toUpperCase() + rawOwner.slice(1) : 'Pet Parent',
              email: contactEmail,
              phone: r.contactMechanism?.safeContactPhone,
              isAdmin: emailKey === 'jksurampudi5@gmail.com',
              createdAt: r.createdAt || new Date().toISOString(),
            });
          }
        }
      });
    } catch {}

    return Array.from(userMap.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  getAllOwnerProfiles(): OwnerProfile[] {
    try {
      const storedProfiles = localStorage.getItem(PROFILES_KEY);
      if (storedProfiles) {
        this.profiles = JSON.parse(storedProfiles);
      }
    } catch {}
    return [...this.profiles];
  }

  getAllSightings(): Sighting[] {
    try {
      const storedSightings = localStorage.getItem(SIGHTINGS_KEY);
      if (storedSightings) {
        this.sightings = JSON.parse(storedSightings);
      }
    } catch {}
    return [...this.sightings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  deleteUserAsAdmin(userId: string): boolean {
    return this.executeTransaction(() => {
      this.deleteUserAccount(userId);
      supabaseSyncService.deleteUserAsAdmin(userId).catch((e) => console.warn('[Supabase Delete User Notice]:', e));
      return true;
    });
  }

  deletePetAsAdmin(petId: string): boolean {
    return this.deletePetProfile(petId);
  }

  deleteSightingAsAdmin(sightingId: string): boolean {
    return this.executeTransaction(() => {
      const target = this.sightings.find((s) => s.id === sightingId);
      if (target) {
        const canonicalRepId = normalizeReportId(target.reportId);
        const report = this.reports.find(
          (r) => normalizeReportId(r.id) === canonicalRepId || r.id === target.reportId
        );
        if (report && report.sightingCount > 0) {
          report.sightingCount -= 1;
        }
      }
      this.sightings = this.sightings.filter((s) => s.id !== sightingId);
      supabaseSyncService.deleteSightingAsAdmin(sightingId).catch((e) => console.warn('[Supabase Delete Sighting Notice]:', e));
      return true;
    });
  }

  exportFullDatabaseJSON(): string {
    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      users: this.getAllRegisteredUsers(),
      profiles: this.getAllOwnerProfiles(),
      pets: this.getAllPets(),
      reports: this.getAllReports(),
      sightings: this.getAllSightings(),
      listingReports: this.getListingReports(),
      userReports: this.getUserReports(),
      blockedUsers: this.getBlockedUsers(),
    };
    return JSON.stringify(payload, null, 2);
  }

  importFullDatabaseJSON(jsonStr: string): { success: boolean; error?: string; importedCounts?: any } {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'Invalid JSON payload format.' };
      }

      return this.executeTransaction(() => {
        let addedUsers = 0;
        let addedProfiles = 0;
        let addedPets = 0;
        let addedReports = 0;
        let addedSightings = 0;

        if (Array.isArray(data.users)) {
          const currentUsers = this.getAllRegisteredUsers();
          const userMap = new Map<string, User>();
          currentUsers.forEach((u) => userMap.set(u.email.toLowerCase(), u));
          data.users.forEach((u: User) => {
            if (u && u.email && !userMap.has(u.email.toLowerCase())) {
              userMap.set(u.email.toLowerCase(), u);
              addedUsers++;
            }
          });
          localStorage.setItem(USERS_KEY, JSON.stringify(Array.from(userMap.values())));
        }

        if (Array.isArray(data.profiles)) {
          const prMap = new Map<string, OwnerProfile>();
          this.profiles.forEach((pr) => prMap.set(pr.userId || pr.id, pr));
          data.profiles.forEach((pr: OwnerProfile) => {
            if (pr && (pr.userId || pr.id)) {
              const key = pr.userId || pr.id;
              if (!prMap.has(key)) {
                prMap.set(key, pr);
                addedProfiles++;
              }
            }
          });
          this.profiles = Array.from(prMap.values());
        }

        if (Array.isArray(data.pets)) {
          const pMap = new Map<string, DogProfile>();
          this.pets.forEach((p) => pMap.set(p.id, p));
          data.pets.forEach((p: DogProfile) => {
            if (p && p.id && !pMap.has(p.id) && !this.isReportOrPetDeleted(undefined, p.id, p.id)) {
              pMap.set(p.id, p);
              addedPets++;
            }
          });
          this.pets = Array.from(pMap.values());
        }

        if (Array.isArray(data.reports)) {
          const repMap = new Map<string, LostReport>();
          this.reports.forEach((r) => repMap.set(normalizeReportId(r.id), r));
          data.reports.forEach((r: LostReport) => {
            if (r && r.id) {
              const canon = normalizeReportId(r.id);
              if (!repMap.has(canon) && !this.isReportOrPetDeleted(r.id, r.dogId, r.dog?.id)) {
                repMap.set(canon, r);
                addedReports++;
              }
            }
          });
          this.reports = Array.from(repMap.values());
        }

        if (Array.isArray(data.sightings)) {
          const sMap = new Map<string, Sighting>();
          this.sightings.forEach((s) => sMap.set(s.id, s));
          data.sightings.forEach((s: Sighting) => {
            if (s && s.id && !sMap.has(s.id) && !this.isReportOrPetDeleted(s.reportId)) {
              sMap.set(s.id, s);
              addedSightings++;
            }
          });
          this.sightings = Array.from(sMap.values());
        }

        return {
          success: true,
          importedCounts: {
            users: addedUsers,
            profiles: addedProfiles,
            pets: addedPets,
            reports: addedReports,
            sightings: addedSightings,
          },
        };
      });
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to parse backup JSON.' };
    }
  }

  mergeCommunityData(remoteData: any): void {
    if (!remoteData || typeof remoteData !== 'object') return;
    try {
      this.executeTransaction(() => {
        if (Array.isArray(remoteData.reports) && remoteData.reports.length > 0) {
          const repMap = new Map<string, LostReport>();
          // Cloud reports from Supabase are the single source of truth
          for (const r of remoteData.reports) {
            if (r && r.id) {
              const canon = normalizeReportId(r.id);
              if (this.isReportOrPetDeleted(r.id, r.dogId, r.dog?.id)) {
                continue;
              }
              repMap.set(canon, r);
            }
          }

          // Retain only local reports that were freshly created by the user and haven't synced yet
          for (const r of this.reports) {
            const canon = normalizeReportId(r.id);
            if (!repMap.has(canon) && !this.isReportOrPetDeleted(r.id, r.dogId, r.dog?.id)) {
              const rawOwnerId = (r.ownerId || '').replace(/^owner-/, '');
              const isLocalUserReport = rawOwnerId.startsWith('user-') || rawOwnerId.startsWith('parent-');
              if (isLocalUserReport) {
                repMap.set(canon, r);
              }
            }
          }
          this.reports = Array.from(repMap.values());
        }

        if (Array.isArray(remoteData.sightings)) {
          const sMap = new Map<string, Sighting>();
          for (const s of remoteData.sightings) {
            if (s && s.id && !this.isReportOrPetDeleted(s.reportId)) {
              sMap.set(s.id, s);
            }
          }
          for (const s of this.sightings) {
            if (!sMap.has(s.id) && !this.isReportOrPetDeleted(s.reportId)) {
              sMap.set(s.id, s);
            }
          }
          this.sightings = Array.from(sMap.values());
        }

        if (Array.isArray(remoteData.pets) && remoteData.pets.length > 0) {
          const pMap = new Map<string, DogProfile>();
          for (const p of remoteData.pets) {
            if (p && p.id && !this.isReportOrPetDeleted(undefined, p.id, p.id)) {
              pMap.set(p.id, p);
            }
          }
          // Retain un-synced user pets
          for (const p of this.pets) {
            if (!pMap.has(p.id) && !this.isReportOrPetDeleted(undefined, p.id, p.id)) {
              const cleanOwner = (p.ownerId || '').replace(/^owner-/, '');
              if (cleanOwner.startsWith('user-') || cleanOwner.startsWith('parent-')) {
                pMap.set(p.id, p);
              }
            }
          }
          this.pets = Array.from(pMap.values());
        }

        if (Array.isArray(remoteData.profiles) && remoteData.profiles.length > 0) {
          const prMap = new Map<string, OwnerProfile>();
          // Deep non-destructive merge: retain local rich structured location data
          for (const localPr of this.profiles) {
            const key = localPr.userId || localPr.id;
            if (key) prMap.set(key, { ...localPr });
          }
          for (const pr of remoteData.profiles) {
            if (pr && (pr.userId || pr.id)) {
              const key = pr.userId || pr.id;
              const existing = prMap.get(key);
              if (existing) {
                prMap.set(key, {
                  ...existing,
                  ...pr,
                  fullName: pr.fullName || existing.fullName,
                  phone: pr.phone || existing.phone,
                  state: existing.state || pr.state,
                  district: existing.district || pr.district,
                  mandalOrMunicipality: existing.mandalOrMunicipality || pr.mandalOrMunicipality,
                  city: existing.city || pr.city,
                  pinCode: existing.pinCode || pr.pinCode,
                  stateCode: existing.stateCode || pr.stateCode,
                  districtCode: existing.districtCode || pr.districtCode,
                  subDistrictCode: existing.subDistrictCode || pr.subDistrictCode,
                  latitude: existing.latitude || pr.latitude,
                  longitude: existing.longitude || pr.longitude,
                  approximateArea: existing.approximateArea || pr.approximateArea,
                  photo: (!isPetPhotoUrl(pr.photo) && pr.photo) || (!isPetPhotoUrl(existing.photo) && existing.photo) || undefined,
                });
              } else {
                prMap.set(key, {
                  ...pr,
                  photo: isPetPhotoUrl(pr.photo) ? undefined : pr.photo,
                });
              }
            }
          }
          this.profiles = Array.from(prMap.values());
        }

        if (Array.isArray(remoteData.users)) {
          const currentUsers = this.getAllRegisteredUsers();
          const userMap = new Map<string, User>();
          for (const u of remoteData.users) {
            if (u && u.email) {
              userMap.set(u.email.toLowerCase(), u);
            }
          }
          for (const u of currentUsers) {
            if (u && u.email && !userMap.has(u.email.toLowerCase())) {
              userMap.set(u.email.toLowerCase(), u);
            }
          }
          localStorage.setItem(USERS_KEY, JSON.stringify(Array.from(userMap.values())));
        }
      });
    } catch (e) {
      console.warn('Community sync merge failed:', e);
    }
  }

  async pullFromSupabase(): Promise<boolean> {
    try {
      const data = await supabaseSyncService.fetchAllCloudData();
      if (!data) return false;

      const { profiles, pets, reports, sightings } = data;

      // Map Supabase profiles to OwnerProfile and User (Sanitizing any raw UUID strings)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const sanitizeName = (rawName?: string, email?: string): string => {
        if (!rawName || uuidRegex.test(rawName.trim())) {
          if (email?.toLowerCase().includes('jksurampudi5')) return 'Jaya Krishna';
          if (email && email.includes('@')) {
            const prefix = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim();
            return prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : 'Pet Parent';
          }
          return 'Pet Parent';
        }
        return rawName.trim();
      };

      const mappedProfiles: OwnerProfile[] = (profiles || []).map((p: any) => ({
        id: p.id,
        userId: p.id,
        fullName: sanitizeName(p.name, p.email),
        email: p.email,
        phone: p.phone || '',
        address: p.address || '',
        photo: isPetPhotoUrl(p.avatar_url) ? undefined : p.avatar_url,
        preferredContact: 'phone',
        hasLocationConsent: true,
        updatedAt: p.created_at || new Date().toISOString(),
      }));

      const mappedUsers: User[] = (profiles || []).map((p: any) => ({
        id: p.id,
        name: sanitizeName(p.name, p.email),
        email: p.email,
        phone: p.phone,
        avatar: isPetPhotoUrl(p.avatar_url) ? undefined : p.avatar_url,
        isAdmin: p.email?.toLowerCase().trim() === 'jksurampudi5@gmail.com',
        createdAt: p.created_at || new Date().toISOString(),
      }));

      // Map Supabase pets to DogProfile
      const mappedPets: DogProfile[] = (pets || []).map((p: any) => {
        let photo = resolveGenericMediaUrl(p.photo_url);
        if (p.id === 'pet-1788871495754' || p.id === '1788885000505' || (p.name && p.name.toUpperCase() === 'SONU')) {
          photo = sonuImg;
        }
        return {
          id: p.id,
          ownerId: p.user_id,
          name: p.name,
          breed: p.breed || 'Companion Pet',
          gender: p.gender || 'Male',
          age: '2 years',
          size: 'Medium (10-25kg)',
          color: p.color || '',
          distinguishingMarks: p.markings || '',
          collarInfo: '',
          primaryPhoto: photo,
          photos: [photo],
          createdAt: p.created_at || new Date().toISOString(),
        };
      });

      // Map Supabase missing_reports to LostReport
      const mappedReports: LostReport[] = (reports || []).map((r: any) => {
        const petInfo = (pets || []).find((p: any) => p.id === r.pet_id);
        let photo = resolveGenericMediaUrl(r.pet_photo || petInfo?.photo_url);
        if (
          r.id === 'LOST-1788885000505' ||
          r.pet_id === '1788885000505' ||
          r.pet_id === 'pet-1788871495754' ||
          (r.pet_name && r.pet_name.toUpperCase() === 'SONU')
        ) {
          photo = sonuImg;
        }
        const derivedOwnerId = r.user_id || petInfo?.ownerId || petInfo?.user_id || '';
        return {
          id: r.id,
          dogId: r.pet_id,
          ownerId: derivedOwnerId,
          dog: {
            id: r.pet_id,
            ownerId: derivedOwnerId,
            name: r.pet_name || petInfo?.name || 'Pet',
            breed: petInfo?.breed || 'Companion Dog',
            gender: petInfo?.gender || 'Male',
            age: '2 years',
            size: 'Medium (10-25kg)',
            color: petInfo?.color || '',
            distinguishingMarks: petInfo?.markings || '',
            collarInfo: '',
            primaryPhoto: photo,
            photos: [photo],
            createdAt: r.created_at || new Date().toISOString(),
          },
          ownerApproximateLocation: r.district || 'West Godavari',
          lastKnownLocation: r.landmark || 'Nearby',
          dateLost: r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          timeLost: '12:00 PM',
          status: r.is_resolved ? 'SAFE' : 'LOST',
          contactMechanism: {
            showPhone: true,
            showEmail: true,
            safeContactPhone: r.contact_phone || '',
            safeContactEmail: r.contact_email || '',
            contactNote: 'Please contact immediately if spotted.',
          },
          sightingCount: (sightings || []).filter((s: any) => s.report_id === r.id || s.pet_id === r.pet_id).length,
          createdAt: r.created_at || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      // Map Supabase sightings to Sighting
      const mappedSightings: Sighting[] = (sightings || []).map((s: any) => ({
        id: s.id,
        reportId: s.report_id,
        dogName: s.reporter_name || 'Lost Dog',
        date: s.created_at ? s.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        time: '12:00 PM',
        location: s.landmark || 'Seen nearby',
        description: s.notes || '',
        photo: s.photo_url || undefined,
        reporterName: s.reporter_name || 'Anonymous',
        reporterPhone: s.reporter_phone || undefined,
        createdAt: s.created_at || new Date().toISOString(),
      }));

      this.mergeCommunityData({
        users: mappedUsers,
        profiles: mappedProfiles,
        pets: mappedPets,
        reports: mappedReports,
        sightings: mappedSightings,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('findlostpuppy_session_updated', { detail: null }));
        window.dispatchEvent(new CustomEvent('findlostpuppy_data_synced', { detail: { count: profiles.length } }));
        window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated', { detail: null }));
      }

      return true;
    } catch (e) {
      console.warn('Failed to pull from Supabase:', e);
      return false;
    }
  }

  /**
   * Resets all mock/test community records and starts completely fresh with 0 stale data.
   * Retains only the memorial/tribute dog Sonu (#1788885000505) as mandated by repo invariant.
   */
  async clearAllAdminTestData(): Promise<boolean> {
    this.executeTransaction(() => {
      // 1. Keep only memorial dog Sonu
      const sonuReport = COMMUNITY_BASELINE_REPORTS.find((r) => r.id === 'LOST-1788885000505');
      this.reports = sonuReport ? [sonuReport] : [];
      this.pets = sonuReport ? [sonuReport.dog] : [];
      this.sightings = [];
      this.profiles = [];
      this.userReports = [];
      this.listingReports = [];
      this.skippedPetUserIds = [];
      this.skippedReportUserIds = [];
      this.suggestions = [];

      // Clean local storage keys
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(REPORTS_KEY, JSON.stringify(this.reports));
        localStorage.setItem(PETS_KEY, JSON.stringify(this.pets));
        localStorage.setItem(SIGHTINGS_KEY, JSON.stringify([]));
        localStorage.setItem(PROFILES_KEY, JSON.stringify([]));
        localStorage.setItem(USER_REPORTS_KEY, JSON.stringify([]));
        localStorage.setItem(LISTING_REPORTS_KEY, JSON.stringify([]));
        localStorage.setItem(SKIPPED_PET_KEY, JSON.stringify([]));
        localStorage.setItem(SKIPPED_REPORT_KEY, JSON.stringify([]));
        localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify([]));

        // Clean user avatar if it's a pet photo
        try {
          const rawUser = localStorage.getItem('findlostpuppy_active_user');
          if (rawUser) {
            const u = JSON.parse(rawUser);
            if (isPetPhotoUrl(u.avatar)) {
              delete u.avatar;
              localStorage.setItem('findlostpuppy_active_user', JSON.stringify(u));
            }
          }
        } catch {}
      }

      this.commitAllStorage();
    });

    // Wipe Supabase cloud tables to ensure 0 stale test records
    try {
      await Promise.allSettled([
        supabaseSyncService.deletePetAsAdmin('*'),
      ]);
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
      window.dispatchEvent(new CustomEvent('findlostpuppy_session_updated'));
    }

    return true;
  }

  /**
   * Automatically migrates any locally-cached user profiles, pets, and lost reports
   * to Supabase when a returning user visits the updated site on their phone.
   */
  async pushLocalToSupabase(): Promise<void> {
    try {
      if (!supabaseSyncService.isConfigured()) return;

      // 1. Sync all registered users
      const users = this.getAllRegisteredUsers();
      for (const u of users) {
        await supabaseSyncService.syncUserProfile(u).catch(() => {});
      }

      // 2. Sync all owner profiles
      for (const p of this.profiles) {
        await supabaseSyncService.syncOwnerProfile(p, p.userId || p.id).catch(() => {});
      }

      // 3. Sync all pets
      for (const pet of this.pets) {
        await supabaseSyncService.syncPet(pet).catch(() => {});
      }

      // 4. Sync all reports
      for (const r of this.reports) {
        await supabaseSyncService.syncLostReport(r).catch(() => {});
      }

      // 5. Sync all sightings
      for (const s of this.sightings) {
        await supabaseSyncService.syncSighting(s).catch(() => {});
      }
    } catch (e) {
      console.warn('Auto local-to-cloud migration notice:', e);
    }
  }

  // ACCOUNT DELETION
  deleteUserAccount(userId: string): { success: boolean } {
    return this.executeTransaction(() => {
      const rawUserId = userId.replace('owner-', '');

      // 1. Remove owner profile
      this.profiles = this.profiles.filter(
        (p) => p.userId !== userId && p.userId !== rawUserId && p.id !== userId && p.id !== rawUserId
      );

      // 2. Remove pet profile
      this.pets = this.pets.filter(
        (p) => p.ownerId !== userId && p.ownerId !== rawUserId
      );

      // 3. Remove user reports
      this.reports = this.reports.filter(
        (r) => r.ownerId !== userId && r.ownerId !== `owner-${userId}` && r.ownerId !== rawUserId
      );

      // 4. Remove user sightings
      this.sightings = this.sightings.filter(
        (s) => s.reporterEmail !== userId
      );

      // 5. Remove registered user entry
      try {
        const storedUsers = localStorage.getItem(USERS_KEY);
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          const filtered = users.filter((u: any) => u.id !== userId && u.id !== rawUserId);
          localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
        }
      } catch (e) {
        console.warn('Failed to delete from registered users:', e);
      }

      // 6. Remove session
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch {}

      // 7. Revoke consent for clean state
      consentService.revokeConsent();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('findlostpuppy_session_updated', { detail: null }));
      }

      return { success: true };
    });
  }

  // =========================================================================
  // APP SUGGESTIONS & FEEDBACK ENGINE
  // =========================================================================

  saveSuggestion(
    suggestion: Omit<AppSuggestion, 'id' | 'createdAt' | 'status'> & Partial<AppSuggestion>
  ): AppSuggestion {
    const newRecord: AppSuggestion = {
      id: suggestion.id || `sugg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: suggestion.userId,
      userName: suggestion.userName,
      userEmail: suggestion.userEmail,
      userPhone: suggestion.userPhone,
      category: suggestion.category || 'feature',
      title: (suggestion.title || '').trim(),
      description: (suggestion.description || '').trim(),
      rating: suggestion.rating,
      pageUrl: suggestion.pageUrl || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      deviceInfo:
        suggestion.deviceInfo ||
        (typeof navigator !== 'undefined'
          ? `${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} • ${window.innerWidth}x${window.innerHeight}`
          : 'Web Client'),
      createdAt: suggestion.createdAt || new Date().toISOString(),
      status: suggestion.status || 'NEW',
    };

    const existingIndex = this.suggestions.findIndex((s) => s.id === newRecord.id);
    if (existingIndex >= 0) {
      this.suggestions[existingIndex] = newRecord;
    } else {
      this.suggestions.unshift(newRecord);
    }

    this.commitAllStorage();
    this.notifyUpdate();

    // Background sync to Supabase if configured
    supabaseSyncService.syncSuggestion(newRecord).catch((err) => {
      console.info('[StorageService] Suggestion sync notice:', err);
    });

    return newRecord;
  }

  getAllSuggestions(): AppSuggestion[] {
    return [...this.suggestions];
  }

  deleteSuggestion(id: string): boolean {
    const prevLen = this.suggestions.length;
    this.suggestions = this.suggestions.filter((s) => s.id !== id);
    if (this.suggestions.length !== prevLen) {
      this.commitAllStorage();
      this.notifyUpdate();
      return true;
    }
    return false;
  }

  updateSuggestionStatus(id: string, status: AppSuggestion['status']): boolean {
    const item = this.suggestions.find((s) => s.id === id);
    if (item) {
      item.status = status;
      this.commitAllStorage();
      this.notifyUpdate();
      return true;
    }
    return false;
  }
}

export const storageService = new StorageService();

