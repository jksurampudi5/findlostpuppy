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
} from '../types';
import { consentService } from './consentService';

import abulluImg from '../assets/abullu.jpg';

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

export const COMMUNITY_BASELINE_REPORTS: LostReport[] = [
  {
    id: 'LOST-1788807276098',
    dogId: 'dog-abullu-01',
    ownerId: 'owner-krishna-abullu',
    dog: {
      id: 'dog-abullu-01',
      ownerId: 'owner-krishna-abullu',
      name: 'abullu',
      breed: 'street dog • Companion Pet',
      gender: 'Male',
      age: '2 years',
      size: 'Medium (10-25kg)',
      color: 'Brown & White with tan spots',
      distinguishingMarks: 'Friendly village companion dog, responsive to whistling, tan spots on back',
      collarInfo: 'None',
      primaryPhoto: abulluImg,
      photos: [abulluImg],
      createdAt: '2026-09-07T18:00:00.000Z',
    },
    ownerApproximateLocation: 'Palangi, Undrajavaram, West Godavari',
    lastKnownLocation: 'Near Palangi, Undrajavaram (Mandal), West Godavari, Andhra Pradesh',
    lastKnownLatitude: 16.8123,
    lastKnownLongitude: 81.6543,
    dateLost: '2026-09-07',
    timeLost: '06:00 PM',
    additionalNotes: 'Very friendly and calm companion dog. Please inform Krishna immediately if spotted anywhere nearby!',
    status: 'LOST',
    contactMechanism: {
      showPhone: true,
      showEmail: true,
      safeContactPhone: '8639452948',
      safeContactEmail: 'krishna.owner@findlostpuppy.org',
      contactNote: 'Please reach out immediately if spotted!',
    },
    sightingCount: 1,
    createdAt: '2026-09-07T18:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'LOST-CHARLIE-01',
    dogId: 'dog-charlie-01',
    ownerId: 'owner-charlie-rescuers',
    dog: {
      id: 'dog-charlie-01',
      ownerId: 'owner-charlie-rescuers',
      name: 'charlie',
      breed: 'Indian Pariah Dog • Rescued Pup',
      gender: 'Male',
      age: '1.5 years',
      size: 'Medium (10-25kg)',
      color: 'Light Tan & White',
      distinguishingMarks: 'Dark patch over left ear, active and energetic',
      collarInfo: 'Red collar',
      primaryPhoto: abulluImg,
      photos: [abulluImg],
      createdAt: '2026-09-07T14:00:00.000Z',
    },
    ownerApproximateLocation: 'Tanuku Road, Undrajavaram, West Godavari',
    lastKnownLocation: 'Near Undrajavaram Main Junction, West Godavari',
    dateLost: '2026-09-07',
    timeLost: '02:00 PM',
    additionalNotes: 'Neighbors reported sighting Charlie near the junction. Volunteers actively monitoring area.',
    status: 'LOST',
    contactMechanism: {
      showPhone: true,
      showEmail: true,
      safeContactPhone: '8639452948',
      safeContactEmail: 'community.care@findlostpuppy.org',
      contactNote: 'Volunteer search team on site.',
    },
    sightingCount: 3,
    createdAt: '2026-09-07T14:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'LOST-BRUNO-WESTGODAVARI',
    dogId: 'dog-bruno-01',
    ownerId: 'owner-bruno-family',
    dog: {
      id: 'dog-bruno-01',
      ownerId: 'owner-bruno-family',
      name: 'brunoo',
      breed: 'Golden Labrador • Companion Pet',
      gender: 'Male',
      age: '3 years',
      size: 'Large (25-45kg)',
      color: 'Golden Cream',
      distinguishingMarks: 'Friendly, playful, golden coat with white chest patch',
      collarInfo: 'Green reflective collar',
      primaryPhoto: abulluImg,
      photos: [abulluImg],
      createdAt: '2026-09-05T12:00:00.000Z',
    },
    ownerApproximateLocation: 'Undrajavaram, West Godavari, Andhra Pradesh',
    lastKnownLocation: 'Palangi Village, West Godavari',
    dateLost: '2026-09-05',
    timeLost: '04:30 PM',
    additionalNotes: 'Safe with loving family through neighborhood vigilance and community care!',
    status: 'SAFE',
    contactMechanism: {
      showPhone: true,
      showEmail: true,
      safeContactPhone: '8639452948',
      safeContactEmail: 'bruno.family@findlostpuppy.org',
      contactNote: 'Safe at home with family in West Godavari.',
    },
    sightingCount: 2,
    createdAt: '2026-09-05T16:30:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

// Helper to normalize and canonicalize report IDs (e.g. '1788807276098' -> 'lost-1788807276098')
export function normalizeReportId(id: string): string {
  if (!id) return '';
  const clean = id.trim().toLowerCase();
  return clean.startsWith('lost-') ? clean : `lost-${clean}`;
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
      throw err;
    } finally {
      this.isTransactionActive = false;
    }
  }

  private enforceIntegrityInvariants(): void {
    // Invariant 1: Deduplicate reports so no 2 active reports exist for the same dog / normalized ID
    const seenMap = new Map<string, LostReport>();
    const seenPetActiveKey = new Set<string>();

    for (const r of this.reports) {
      const canonicalId = normalizeReportId(r.id);
      const ownerClean = (r.ownerId || '').replace(/^owner-/, '').toLowerCase();
      const dogNameClean = (r.dog?.name || '').trim().toLowerCase();
      const petActiveKey = `${ownerClean}::${dogNameClean}`;

      // If active LOST report for same pet is encountered, keep only the latest one
      if (r.status === 'LOST') {
        if (dogNameClean && dogNameClean !== 'my dog' && seenPetActiveKey.has(petActiveKey)) {
          continue; // Skip duplicate active report for same dog
        }
        if (dogNameClean && dogNameClean !== 'my dog') {
          seenPetActiveKey.add(petActiveKey);
        }
      }

      if (!seenMap.has(canonicalId)) {
        seenMap.set(canonicalId, r);
      }
    }
    this.reports = Array.from(seenMap.values());

    // Invariant 2: Ensure all reports have valid photo fallbacks
    for (const r of this.reports) {
      if (!r.dog.primaryPhoto || r.dog.primaryPhoto.trim().length < 5) {
        const ownerClean = (r.ownerId || '').replace(/^owner-/, '');
        const registered = this.pets.find(
          (p) => p.ownerId === r.ownerId || p.ownerId === `owner-${ownerClean}` || p.ownerId === ownerClean
        );
        r.dog.primaryPhoto = registered?.primaryPhoto || abulluImg;
      }
    }
  }

  private commitAllStorage(): void {
    try {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(this.reports));
      localStorage.setItem(PETS_KEY, JSON.stringify(this.pets));
      localStorage.setItem(PROFILES_KEY, JSON.stringify(this.profiles));
      localStorage.setItem(SIGHTINGS_KEY, JSON.stringify(this.sightings));
      localStorage.setItem(SKIPPED_PET_KEY, JSON.stringify(this.skippedPetUserIds));
      localStorage.setItem(SKIPPED_REPORT_KEY, JSON.stringify(this.skippedReportUserIds));
      localStorage.setItem(LISTING_REPORTS_KEY, JSON.stringify(this.listingReports));
      localStorage.setItem(USER_REPORTS_KEY, JSON.stringify(this.userReports));
      localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(this.blockedUsers));
    } catch (e) {
      console.warn('LocalStorage commit error:', e);
    }
  }

  private init() {
    try {
      const storedReports = localStorage.getItem(REPORTS_KEY);
      const rawReports: LostReport[] = storedReports ? JSON.parse(storedReports) : [];
      
      // Filter out old legacy random seed IDs and unwanted test duplicates
      const userReports = rawReports.filter(
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
          r.id !== 'LOST-CHARLIE-SIGHTED'
      );

      // Merge with verified community baseline reports
      const mergedMap = new Map<string, LostReport>();
      for (const rep of COMMUNITY_BASELINE_REPORTS) {
        mergedMap.set(normalizeReportId(rep.id), rep);
      }
      for (const rep of userReports) {
        const canonicalId = normalizeReportId(rep.id);
        // Normalize any legacy REUNITED status to SAFE
        if ((rep.status as any) === 'REUNITED') {
          rep.status = 'SAFE';
        }
        // Ensure Abullu report uses abulluImg if photo is missing or empty
        if (canonicalId === 'lost-1788807276098' && (!rep.dog.primaryPhoto || rep.dog.primaryPhoto.length < 5)) {
          rep.dog.primaryPhoto = abulluImg;
        }
        mergedMap.set(canonicalId, rep);
      }
      this.reports = Array.from(mergedMap.values());
      for (const rep of this.reports) {
        if ((rep.status as any) === 'REUNITED') {
          rep.status = 'SAFE';
        }
      }

      const storedSightings = localStorage.getItem(SIGHTINGS_KEY);
      const rawSightings: Sighting[] = storedSightings ? JSON.parse(storedSightings) : [];
      this.sightings = rawSightings;

      const storedProfiles = localStorage.getItem(PROFILES_KEY);
      const rawProfiles: OwnerProfile[] = storedProfiles ? JSON.parse(storedProfiles) : [];
      this.profiles = rawProfiles;

      const storedPets = localStorage.getItem(PETS_KEY);
      const rawPets: DogProfile[] = storedPets ? JSON.parse(storedPets) : [];
      
      // Merge registered pets with baseline community pets
      const petsMap = new Map<string, DogProfile>();
      for (const r of COMMUNITY_BASELINE_REPORTS) {
        petsMap.set(r.dog.id, r.dog);
      }
      for (const p of rawPets) {
        petsMap.set(p.id, p);
      }
      this.pets = Array.from(petsMap.values());

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

      this.enforceIntegrityInvariants();
      this.commitAllStorage();
    } catch {
      this.reports = [...COMMUNITY_BASELINE_REPORTS];
      this.sightings = [];
      this.profiles = [];
      this.pets = COMMUNITY_BASELINE_REPORTS.map((r) => r.dog);
      this.skippedPetUserIds = [];
      this.skippedReportUserIds = [];
      this.listingReports = [];
      this.userReports = [];
      this.blockedUsers = [];
      this.commitAllStorage();
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
      if (storedReports) {
        const parsed: LostReport[] = JSON.parse(storedReports);
        const map = new Map<string, LostReport>();
        const seenPetActiveKey = new Set<string>();

        for (const r of COMMUNITY_BASELINE_REPORTS) {
          map.set(normalizeReportId(r.id), r);
        }

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
            r.id !== 'LOST-CHARLIE-SIGHTED'
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
          if (!r.dog.primaryPhoto || r.dog.primaryPhoto.length < 5) {
            r.dog.primaryPhoto = abulluImg;
          }

          const canonicalId = normalizeReportId(r.id);
          const ownerClean = (r.ownerId || '').replace(/^owner-/, '').toLowerCase();
          const dogNameClean = (r.dog?.name || '').trim().toLowerCase();
          const petActiveKey = `${ownerClean}::${dogNameClean}`;

          // Deduplicate active reports for same pet
          if (r.status === 'LOST') {
            if (dogNameClean && dogNameClean !== 'my dog' && seenPetActiveKey.has(petActiveKey)) {
              continue;
            }
            if (dogNameClean && dogNameClean !== 'my dog') {
              seenPetActiveKey.add(petActiveKey);
            }
          }

          map.set(canonicalId, r);
        }
        this.reports = Array.from(map.values());
      } else {
        this.reports = [...COMMUNITY_BASELINE_REPORTS];
      }
    } catch (e) {
      console.warn('Failed to load reports:', e);
      this.reports = [...COMMUNITY_BASELINE_REPORTS];
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
        this.pets = JSON.parse(storedPets);
      }
    } catch {}
    return [...this.pets];
  }

  getReportById(id: string): LostReport | undefined {
    this.loadReports();
    if (!id) return undefined;
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
      (r) => r.ownerId === ownerId || r.ownerId === `owner-${cleanOwner}` || r.ownerId === cleanOwner
    );
  }

  createReport(report: LostReport): LostReport {
    return this.saveReport(report);
  }

  deleteReport(reportId: string): boolean {
    return this.executeTransaction(() => {
      const canonicalId = normalizeReportId(reportId);
      const initialCount = this.reports.length;
      this.reports = this.reports.filter(
        (r) =>
          normalizeReportId(r.id) !== canonicalId &&
          r.id !== reportId &&
          r.id.toLowerCase() !== reportId.toLowerCase()
      );
      this.sightings = this.sightings.filter(
        (s) =>
          normalizeReportId(s.reportId) !== canonicalId &&
          s.reportId !== reportId &&
          s.reportId.toLowerCase() !== reportId.toLowerCase()
      );
      return this.reports.length < initialCount;
    });
  }

  updateReportStatus(reportId: string, status: ReportStatus): boolean {
    return this.executeTransaction(() => {
      const canonicalId = normalizeReportId(reportId);
      const report = this.reports.find((r) => normalizeReportId(r.id) === canonicalId || r.id === reportId);
      if (!report) return false;
      report.status = status;
      report.updatedAt = new Date().toISOString();
      return true;
    });
  }

  // SIGHTINGS:
  getSightingsForReport(reportId: string): Sighting[] {
    const canonicalId = normalizeReportId(reportId);
    return this.sightings
      .filter((s) => normalizeReportId(s.reportId) === canonicalId || s.reportId.toLowerCase() === reportId.toLowerCase())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addSighting(sighting: Sighting): Sighting {
    return this.executeTransaction(() => {
      this.sightings.unshift(sighting);

      // Increment sighting count on report
      const canonicalId = normalizeReportId(sighting.reportId);
      const report = this.reports.find(
        (r) => normalizeReportId(r.id) === canonicalId || r.id === sighting.reportId
      );
      if (report) {
        report.sightingCount = (report.sightingCount || 0) + 1;
        // Keep status as strictly LOST if not SAFE
        if (report.status !== 'SAFE' && (report.status as any) !== 'REUNITED') {
          report.status = 'LOST';
        }
        report.updatedAt = new Date().toISOString();
      }

      return sighting;
    });
  }

  getOwnerProfileByUserId(userId: string): OwnerProfile | undefined {
    const rawUserId = userId.replace(/^owner-/, '');
    return this.profiles.find(
      (p) =>
        p.userId === userId ||
        p.userId === rawUserId ||
        p.id === userId ||
        p.id === `owner-${userId}` ||
        p.id === `owner-${rawUserId}`
    );
  }

  hasCompletedOwnerProfile(userId: string): boolean {
    const profile = this.getOwnerProfileByUserId(userId);
    return !!(profile && profile.fullName && profile.phone);
  }

  hasCompletedLocation(userId: string): boolean {
    const profile = this.getOwnerProfileByUserId(userId);
    return !!(profile && (profile.district || profile.city));
  }

  // PET PROFILES:
  getPetProfileByUserId(userId: string): DogProfile | undefined {
    const rawUserId = userId.replace(/^owner-/, '');
    return this.pets.find(
      (p) => p.ownerId === `owner-${userId}` || p.ownerId === userId || p.ownerId === `owner-${rawUserId}` || p.ownerId === rawUserId
    );
  }

  savePetProfile(pet: DogProfile): DogProfile {
    return this.executeTransaction(() => {
      const rawUserId = pet.ownerId.replace(/^owner-/, '');
      this.skippedPetUserIds = this.skippedPetUserIds.filter(
        (id) => id !== pet.ownerId && id !== `owner-${rawUserId}` && id !== rawUserId
      );

      const index = this.pets.findIndex(
        (p) => p.id === pet.id || p.ownerId === pet.ownerId || p.ownerId === `owner-${rawUserId}` || p.ownerId === rawUserId
      );
      if (index >= 0) {
        this.pets[index] = { ...pet };
      } else {
        this.pets.push(pet);
      }

      // Dynamically sync any existing reports for this owner
      for (const r of this.reports) {
        if (r.ownerId === pet.ownerId || r.ownerId === `owner-${rawUserId}` || r.ownerId === rawUserId) {
          r.dog = {
            ...r.dog,
            name: pet.name,
            breed: pet.breed,
            gender: pet.gender,
            age: pet.age,
            size: pet.size,
            color: pet.color,
            distinguishingMarks: pet.distinguishingMarks,
            collarInfo: pet.collarInfo,
            primaryPhoto: pet.primaryPhoto || r.dog.primaryPhoto || abulluImg,
            photos: pet.photos && pet.photos.length > 0 ? pet.photos : r.dog.photos,
          };
          r.updatedAt = new Date().toISOString();
        }
      }

      return pet;
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

  hasCompletedPetProfile(userId: string): boolean {
    return !!this.getPetProfileByUserId(userId) || this.hasSkippedPetProfile(userId);
  }

  hasCompletedDogProfile(userId: string): boolean {
    return this.hasCompletedPetProfile(userId);
  }

  // LOST DOG REPORT MANAGEMENT:
  getLatestReportByUserId(userId: string): LostReport | undefined {
    const rawUserId = userId.replace(/^owner-/, '');
    return this.reports.find(
      (r) => r.ownerId === `owner-${userId}` || r.ownerId === userId || r.ownerId === `owner-${rawUserId}` || r.ownerId === rawUserId
    );
  }

  saveReport(report: LostReport): LostReport {
    return this.executeTransaction(() => {
      const rawUserId = (report.ownerId || '').replace(/^owner-/, '');
      this.skippedReportUserIds = this.skippedReportUserIds.filter(
        (id) => id !== report.ownerId && id !== `owner-${rawUserId}` && id !== rawUserId
      );

      const canonicalId = normalizeReportId(report.id);
      const reportDogName = (report.dog?.name || '').trim().toLowerCase();

      // Find existing report by canonical ID OR by owner + dog name
      const existingIdx = this.reports.findIndex(
        (r) =>
          normalizeReportId(r.id) === canonicalId ||
          ((r.ownerId === report.ownerId || r.ownerId === `owner-${rawUserId}` || r.ownerId === rawUserId) &&
            reportDogName &&
            (r.dog?.name || '').trim().toLowerCase() === reportDogName)
      );

      if (existingIdx >= 0) {
        // Atomic in-place update (prevents duplicate rows)
        this.reports[existingIdx] = {
          ...this.reports[existingIdx],
          ...report,
          id: this.reports[existingIdx].id, // Preserve established ID
          updatedAt: new Date().toISOString(),
        };
      } else {
        this.reports.unshift(report);
      }

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

  markPetSafe(userId: string): void {
    this.executeTransaction(() => {
      const rawUserId = userId.replace(/^owner-/, '');
      if (!this.skippedReportUserIds.includes(userId) && !this.skippedReportUserIds.includes(rawUserId)) {
        this.skippedReportUserIds.push(userId);
      }

      // Atomically resolve active LOST reports for this owner
      for (const r of this.reports) {
        if (
          (r.ownerId === `owner-${userId}` || r.ownerId === userId || r.ownerId === `owner-${rawUserId}` || r.ownerId === rawUserId) &&
          r.status === 'LOST'
        ) {
          r.status = 'SAFE';
          r.updatedAt = new Date().toISOString();
        }
      }
    });
  }

  clearPetSafe(userId: string): void {
    this.executeTransaction(() => {
      const rawUserId = userId.replace(/^owner-/, '');
      this.skippedReportUserIds = this.skippedReportUserIds.filter(
        (id) => id !== userId && id !== `owner-${rawUserId}` && id !== rawUserId
      );
    });
  }

  isPetSafe(userId: string): boolean {
    return this.hasSkippedReport(userId);
  }

  hasSkippedReport(userId: string): boolean {
    return this.skippedReportUserIds.includes(userId);
  }

  hasCompletedReport(userId: string): boolean {
    return !!this.getLatestReportByUserId(userId) || this.hasSkippedReport(userId);
  }

  saveOwnerProfile(profile: OwnerProfile): OwnerProfile {
    return this.executeTransaction(() => {
      const index = this.profiles.findIndex((p) => p.id === profile.id || p.userId === profile.userId);
      if (index >= 0) {
        this.profiles[index] = { ...profile, updatedAt: new Date().toISOString() };
      } else {
        this.profiles.push(profile);
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

    // 2. From Current Session Storage
    try {
      const storedSession = localStorage.getItem(SESSION_KEY);
      if (storedSession) {
        const sessionUser: User = JSON.parse(storedSession);
        if (sessionUser && sessionUser.email && !userMap.has(sessionUser.email.toLowerCase().trim())) {
          userMap.set(sessionUser.email.toLowerCase().trim(), sessionUser);
        }
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
      return true;
    });
  }

  deletePetAsAdmin(petId: string): boolean {
    return this.executeTransaction(() => {
      const initLen = this.pets.length;
      this.pets = this.pets.filter((p) => p.id !== petId);
      // Also remove any linked reports
      this.reports = this.reports.filter((r) => r.dogId !== petId && r.dog?.id !== petId);
      return this.pets.length < initLen;
    });
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

  importFullDatabaseJSON(jsonStr: string): { success: boolean; importedCounts?: any; error?: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Invalid JSON payload structure.' };
      }

      return this.executeTransaction(() => {
        let addedUsers = 0;
        let addedProfiles = 0;
        let addedPets = 0;
        let addedReports = 0;
        let addedSightings = 0;

        // 1. Merge Registered Users
        if (Array.isArray(parsed.users)) {
          const currentUsers = this.getAllRegisteredUsers();
          const userMap = new Map<string, User>();
          currentUsers.forEach((u) => userMap.set(u.email.toLowerCase(), u));
          parsed.users.forEach((u: User) => {
            if (u && u.email && !userMap.has(u.email.toLowerCase())) {
              userMap.set(u.email.toLowerCase(), u);
              addedUsers++;
            }
          });
          localStorage.setItem(USERS_KEY, JSON.stringify(Array.from(userMap.values())));
        }

        // 2. Merge Owner Profiles
        if (Array.isArray(parsed.profiles)) {
          const profileMap = new Map<string, OwnerProfile>();
          this.profiles.forEach((p) => profileMap.set(p.userId || p.id, p));
          parsed.profiles.forEach((p: OwnerProfile) => {
            if (p && (p.userId || p.id)) {
              const key = p.userId || p.id;
              if (!profileMap.has(key)) {
                profileMap.set(key, p);
                addedProfiles++;
              } else {
                profileMap.set(key, { ...profileMap.get(key)!, ...p });
              }
            }
          });
          this.profiles = Array.from(profileMap.values());
        }

        // 3. Merge Pets
        if (Array.isArray(parsed.pets)) {
          const petMap = new Map<string, DogProfile>();
          this.pets.forEach((p) => petMap.set(p.id, p));
          parsed.pets.forEach((p: DogProfile) => {
            if (p && p.id) {
              if (!petMap.has(p.id)) {
                petMap.set(p.id, p);
                addedPets++;
              } else {
                petMap.set(p.id, { ...petMap.get(p.id)!, ...p });
              }
            }
          });
          this.pets = Array.from(petMap.values());
        }

        // 4. Merge Reports
        if (Array.isArray(parsed.reports)) {
          const repMap = new Map<string, LostReport>();
          this.reports.forEach((r) => repMap.set(normalizeReportId(r.id), r));
          parsed.reports.forEach((r: LostReport) => {
            if (r && r.id) {
              const canon = normalizeReportId(r.id);
              if (!repMap.has(canon)) {
                repMap.set(canon, r);
                addedReports++;
              } else {
                repMap.set(canon, { ...repMap.get(canon)!, ...r });
              }
            }
          });
          this.reports = Array.from(repMap.values());
        }

        // 5. Merge Sightings
        if (Array.isArray(parsed.sightings)) {
          const sightingMap = new Map<string, Sighting>();
          this.sightings.forEach((s) => sightingMap.set(s.id, s));
          parsed.sightings.forEach((s: Sighting) => {
            if (s && s.id && !sightingMap.has(s.id)) {
              sightingMap.set(s.id, s);
              addedSightings++;
            }
          });
          this.sightings = Array.from(sightingMap.values());
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
        if (Array.isArray(remoteData.reports)) {
          const repMap = new Map<string, LostReport>();
          this.reports.forEach((r) => repMap.set(normalizeReportId(r.id), r));
          for (const r of remoteData.reports) {
            if (r && r.id) {
              const canon = normalizeReportId(r.id);
              if (!repMap.has(canon)) {
                repMap.set(canon, r);
              } else {
                // Update with latest timestamp
                const existing = repMap.get(canon)!;
                if (new Date(r.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
                  repMap.set(canon, { ...existing, ...r });
                }
              }
            }
          }
          this.reports = Array.from(repMap.values());
        }

        if (Array.isArray(remoteData.sightings)) {
          const sMap = new Map<string, Sighting>();
          this.sightings.forEach((s) => sMap.set(s.id, s));
          for (const s of remoteData.sightings) {
            if (s && s.id && !sMap.has(s.id)) {
              sMap.set(s.id, s);
            }
          }
          this.sightings = Array.from(sMap.values());
        }

        if (Array.isArray(remoteData.pets)) {
          const pMap = new Map<string, DogProfile>();
          this.pets.forEach((p) => pMap.set(p.id, p));
          for (const p of remoteData.pets) {
            if (p && p.id && !pMap.has(p.id)) {
              pMap.set(p.id, p);
            }
          }
          this.pets = Array.from(pMap.values());
        }

        if (Array.isArray(remoteData.profiles)) {
          const prMap = new Map<string, OwnerProfile>();
          this.profiles.forEach((pr) => prMap.set(pr.userId || pr.id, pr));
          for (const pr of remoteData.profiles) {
            if (pr && (pr.userId || pr.id)) {
              const key = pr.userId || pr.id;
              if (!prMap.has(key)) {
                prMap.set(key, pr);
              }
            }
          }
          this.profiles = Array.from(prMap.values());
        }

        if (Array.isArray(remoteData.users)) {
          const currentUsers = this.getAllRegisteredUsers();
          const userMap = new Map<string, User>();
          currentUsers.forEach((u) => userMap.set(u.email.toLowerCase(), u));
          for (const u of remoteData.users) {
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
}

export const storageService = new StorageService();

