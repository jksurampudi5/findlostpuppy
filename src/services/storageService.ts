import type {
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
import {
  INITIAL_COMMUNITY_REPORTS,
  INITIAL_COMMUNITY_SIGHTINGS,
  INITIAL_COMMUNITY_PROFILES,
} from '../data/seedReports';

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

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedReports = localStorage.getItem(REPORTS_KEY);
      const rawReports: LostReport[] = storedReports ? JSON.parse(storedReports) : [];
      
      // Merge initial community reports with user stored reports so every new user immediately sees active missing alerts
      const reportMap = new Map<string, LostReport>();
      INITIAL_COMMUNITY_REPORTS.forEach((r) => reportMap.set(r.id, r));
      rawReports.forEach((r) => {
        // If user updated a community report or created their own, preserve user version
        reportMap.set(r.id, r);
      });
      this.reports = Array.from(reportMap.values());
      this.saveReports();

      const storedSightings = localStorage.getItem(SIGHTINGS_KEY);
      const rawSightings: Sighting[] = storedSightings ? JSON.parse(storedSightings) : [];
      const sightingMap = new Map<string, Sighting>();
      INITIAL_COMMUNITY_SIGHTINGS.forEach((s) => sightingMap.set(s.id, s));
      rawSightings.forEach((s) => sightingMap.set(s.id, s));
      this.sightings = Array.from(sightingMap.values());
      this.saveSightings();

      const storedProfiles = localStorage.getItem(PROFILES_KEY);
      const rawProfiles: OwnerProfile[] = storedProfiles ? JSON.parse(storedProfiles) : [];
      const profileMap = new Map<string, OwnerProfile>();
      INITIAL_COMMUNITY_PROFILES.forEach((p) => profileMap.set(p.id, p));
      rawProfiles.forEach((p) => profileMap.set(p.id, p));
      this.profiles = Array.from(profileMap.values());
      this.saveProfiles();

      const storedPets = localStorage.getItem(PETS_KEY);
      this.pets = storedPets ? JSON.parse(storedPets) : [];

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
    } catch {
      this.reports = [...INITIAL_COMMUNITY_REPORTS];
      this.sightings = [...INITIAL_COMMUNITY_SIGHTINGS];
      this.profiles = [...INITIAL_COMMUNITY_PROFILES];
      this.pets = [];
      this.skippedPetUserIds = [];
      this.skippedReportUserIds = [];
      this.listingReports = [];
      this.userReports = [];
      this.blockedUsers = [];
    }
  }

  private savePets() {
    try {
      localStorage.setItem(PETS_KEY, JSON.stringify(this.pets));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  private saveSkippedPets() {
    try {
      localStorage.setItem(SKIPPED_PET_KEY, JSON.stringify(this.skippedPetUserIds));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  private saveSkippedReports() {
    try {
      localStorage.setItem(SKIPPED_REPORT_KEY, JSON.stringify(this.skippedReportUserIds));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  private notifyUpdate() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
    }
  }

  private saveReports() {
    try {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(this.reports));
      this.notifyUpdate();
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  private saveSightings() {
    try {
      localStorage.setItem(SIGHTINGS_KEY, JSON.stringify(this.sightings));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  private saveProfiles() {
    try {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(this.profiles));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // PUBLIC SAFE RETRIEVAL:
  // Returns reports with private owner addresses strictly stripped
  private loadReports() {
    try {
      const storedReports = localStorage.getItem(REPORTS_KEY);
      if (storedReports) {
        this.reports = JSON.parse(storedReports);
      }
    } catch (e) {
      console.warn('Failed to load reports:', e);
    }
  }

  getAllReports(): LostReport[] {
    this.loadReports();
    return [...this.reports].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getReportById(id: string): LostReport | undefined {
    this.loadReports();
    return this.reports.find((r) => r.id.toLowerCase() === id.toLowerCase());
  }

  getReportsByOwner(ownerId: string): LostReport[] {
    this.loadReports();
    return this.reports.filter((r) => r.ownerId === ownerId);
  }

  createReport(report: LostReport): LostReport {
    this.reports.unshift(report);
    this.saveReports();
    return report;
  }

  updateReportStatus(reportId: string, status: ReportStatus): boolean {
    const report = this.reports.find((r) => r.id === reportId);
    if (!report) return false;
    report.status = status;
    report.updatedAt = new Date().toISOString();
    this.saveReports();
    return true;
  }

  // SIGHTINGS:
  getSightingsForReport(reportId: string): Sighting[] {
    return this.sightings
      .filter((s) => s.reportId.toLowerCase() === reportId.toLowerCase())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addSighting(sighting: Sighting): Sighting {
    this.sightings.unshift(sighting);
    this.saveSightings();

    // Increment sighting count on report
    const report = this.reports.find((r) => r.id === sighting.reportId);
    if (report) {
      report.sightingCount = (report.sightingCount || 0) + 1;
      if (report.status === 'LOST') {
        report.status = 'SIGHTED';
      }
      report.updatedAt = new Date().toISOString();
      this.saveReports();
    }

    return sighting;
  }

  // OWNER PROFILES:
  getOwnerProfileByUserId(userId: string): OwnerProfile | undefined {
    return this.profiles.find((p) => p.userId === userId);
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
    return this.pets.find((p) => p.ownerId === `owner-${userId}` || p.ownerId === userId);
  }

  savePetProfile(pet: DogProfile): DogProfile {
    const rawUserId = pet.ownerId.replace('owner-', '');
    this.skippedPetUserIds = this.skippedPetUserIds.filter((id) => id !== pet.ownerId && id !== rawUserId);
    this.saveSkippedPets();

    const index = this.pets.findIndex((p) => p.id === pet.id || p.ownerId === pet.ownerId || p.ownerId === `owner-${rawUserId}`);
    if (index >= 0) {
      this.pets[index] = pet;
    } else {
      this.pets.push(pet);
    }
    this.savePets();
    return pet;
  }

  skipPetProfile(userId: string): void {
    if (!this.skippedPetUserIds.includes(userId)) {
      this.skippedPetUserIds.push(userId);
      this.saveSkippedPets();
    }
  }

  hasSkippedPetProfile(userId: string): boolean {
    return this.skippedPetUserIds.includes(userId);
  }

  hasCompletedPetProfile(userId: string): boolean {
    return !!this.getPetProfileByUserId(userId) || this.hasSkippedPetProfile(userId);
  }

  hasCompletedDogProfile(userId: string): boolean {
    return this.hasCompletedPetProfile(userId);
  }

  // LOST DOG REPORT MANAGEMENT:
  getLatestReportByUserId(userId: string): LostReport | undefined {
    return this.reports.find(
      (r) => r.ownerId === `owner-${userId}` || r.ownerId === userId
    );
  }

  saveReport(report: LostReport): LostReport {
    const rawUserId = report.ownerId.replace('owner-', '');
    this.skippedReportUserIds = this.skippedReportUserIds.filter(
      (id) => id !== report.ownerId && id !== rawUserId
    );
    this.saveSkippedReports();

    const index = this.reports.findIndex((r) => r.id === report.id);
    if (index >= 0) {
      this.reports[index] = { ...report, updatedAt: new Date().toISOString() };
    } else {
      this.reports.unshift(report);
    }
    this.saveReports();
    return report;
  }

  skipReport(userId: string): void {
    if (!this.skippedReportUserIds.includes(userId)) {
      this.skippedReportUserIds.push(userId);
      this.saveSkippedReports();
    }
  }

  markPetSafe(userId: string): void {
    this.skipReport(userId);
    // When pet is safe at home, resolve any active LOST reports
    let changed = false;
    for (const r of this.reports) {
      if ((r.ownerId === `owner-${userId}` || r.ownerId === userId) && r.status === 'LOST') {
        r.status = 'REUNITED';
        r.updatedAt = new Date().toISOString();
        changed = true;
      }
    }
    if (changed) {
      this.saveReports();
    }
  }

  clearPetSafe(userId: string): void {
    this.skippedReportUserIds = this.skippedReportUserIds.filter((id) => id !== userId);
    this.saveSkippedReports();
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
    const index = this.profiles.findIndex((p) => p.id === profile.id || p.userId === profile.userId);
    if (index >= 0) {
      this.profiles[index] = { ...profile, updatedAt: new Date().toISOString() };
    } else {
      this.profiles.push(profile);
    }
    this.saveProfiles();
    return profile;
  }

  // PRIVACY HELPER: Computes safe public approximate location
  formatPublicApproximateLocation(district: string, state: string, locality?: string): string {
    const loc = locality ? locality.replace(/house\s*#?\d+|flat\s*#?\d+|door\s*#?\d+/gi, '').trim() : '';
    if (loc && loc.length > 2) {
      return `Near ${loc}, ${district}`;
    }
    return `${district}, ${state}`;
  }
  private saveListingReports() {
    try {
      localStorage.setItem(LISTING_REPORTS_KEY, JSON.stringify(this.listingReports));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  private saveUserReports() {
    try {
      localStorage.setItem(USER_REPORTS_KEY, JSON.stringify(this.userReports));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  private saveBlockedUsers() {
    try {
      localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(this.blockedUsers));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // LISTING REPORTING
  submitListingReport(
    reportId: string,
    dogName: string,
    category: ListingReportCategory,
    details?: string,
    reporterUserId?: string
  ): ListingReport {
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
    this.saveListingReports();
    return report;
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
    this.saveUserReports();
    return report;
  }

  getUserReports(): UserReport[] {
    return [...this.userReports];
  }

  // USER BLOCKING
  blockUser(userId: string, userName?: string): void {
    if (!this.isUserBlocked(userId)) {
      this.blockedUsers.push({
        blockedUserId: userId,
        blockedUserName: userName,
        blockedAt: new Date().toISOString(),
      });
      this.saveBlockedUsers();
    }
  }

  unblockUser(userId: string): void {
    this.blockedUsers = this.blockedUsers.filter((b) => b.blockedUserId !== userId);
    this.saveBlockedUsers();
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

  // ACCOUNT DELETION
  deleteUserAccount(userId: string): { success: boolean } {
    const rawUserId = userId.replace('owner-', '');

    // 1. Remove owner profile
    this.profiles = this.profiles.filter(
      (p) => p.userId !== userId && p.userId !== rawUserId && p.id !== userId && p.id !== rawUserId
    );
    this.saveProfiles();

    // 2. Remove pet profile
    this.pets = this.pets.filter(
      (p) => p.ownerId !== userId && p.ownerId !== rawUserId
    );
    this.savePets();

    // 3. Remove user reports
    this.reports = this.reports.filter(
      (r) => r.ownerId !== userId && r.ownerId !== `owner-${userId}` && r.ownerId !== rawUserId
    );
    this.saveReports();

    // 4. Remove user sightings
    this.sightings = this.sightings.filter(
      (s) => s.reporterEmail !== userId
    );
    this.saveSightings();

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

    return { success: true };
  }
}

export const storageService = new StorageService();

