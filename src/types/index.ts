export type ReportStatus = 'LOST' | 'SAFE' | 'SIGHTED' | 'REUNITED' | 'CLOSED';

export type DogGender = 'Male' | 'Female' | 'Unknown';

export type DogSize = 'Toy (under 5kg)' | 'Small (5-10kg)' | 'Medium (10-25kg)' | 'Large (25-45kg)' | 'Extra Large (45kg+)';

export type ContactMethod = 'phone' | 'email' | 'whatsapp';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export type LocalityType = 'VILLAGE' | 'TOWN' | 'CITY' | 'URBAN_LOCALITY' | 'OTHER';

export interface LocationState {
  code: number;
  name: string;
  shortCode: string;
}

export interface LocationDistrict {
  districtCode: number;
  districtName: string;
  stateCode: number;
  stateName: string;
}

export interface LocationSubDistrict {
  subDistrictCode: number;
  subDistrictName: string;
  subDistrictType: 'Mandal' | 'Taluk' | 'Sub-District';
  districtCode: number;
  districtName: string;
  stateCode: number;
  stateName: string;
}

export interface LocationLocality {
  stateCode: number;
  stateName: string;
  districtCode: number;
  districtName: string;
  subDistrictCode: number;
  subDistrictName: string;
  subDistrictType: 'Mandal' | 'Taluk' | 'Sub-District';
  localityCode: number;
  localityName: string;
  localityType: LocalityType;
}

export interface OwnerProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  photo?: string; // Optional Owner profile photo
  address?: string; // Private
  city?: string;
  state?: string;
  district?: string;
  mandalOrMunicipality?: string;
  streetOrLocality?: string;
  pinCode?: string;
  // Normalized LGD fields for authoritative September 2026 hierarchy
  stateCode?: number;
  districtCode?: number;
  subDistrictCode?: number;
  localityCode?: number;
  localityType?: LocalityType;
  preferredContact: ContactMethod;
  hasLocationConsent: boolean;
  latitude?: number;
  longitude?: number;
  approximateArea?: string; // Public safe representation: e.g. "Near Banjara Hills, Hyderabad"
  updatedAt: string;
}

export interface DogProfile {
  id: string;
  ownerId: string;
  name: string;
  breed: string;
  gender: DogGender;
  age: string; // e.g., "2 years"
  size: DogSize;
  color: string;
  coatDescription?: string;
  distinguishingMarks: string;
  collarInfo?: string;
  microchipId?: string;
  temperament?: string;
  medicalNotes?: string;
  primaryPhoto: string;
  photos: string[];
  createdAt: string;
}

export interface LostReport {
  id: string; // e.g. LOST-783921
  dogId: string;
  ownerId: string;
  dog: DogProfile;
  ownerApproximateLocation: string; // Safe representation
  lastKnownLocation: string; // Safe description: e.g. "Near Lumbini Park, Hyderabad"
  lastKnownLatitude?: number;
  lastKnownLongitude?: number;
  dateLost: string; // YYYY-MM-DD
  timeLost: string; // e.g., "04:30 PM"
  additionalNotes?: string;
  status: ReportStatus;
  contactMechanism: {
    showPhone: boolean;
    showEmail: boolean;
    contactNote?: string;
    safeContactEmail?: string;
    safeContactPhone?: string;
  };
  sightingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sighting {
  id: string;
  reportId: string;
  dogName: string;
  date: string;
  time: string;
  location: string;
  latitude?: number;
  longitude?: number;
  photo?: string;
  photos?: string[]; // Multiple photos of the sighted dog
  description: string;
  reporterName?: string;
  reporterPhone?: string;
  reporterEmail?: string;
  isGuest?: boolean;
  createdAt: string;
}

export type ListingReportCategory =
  | 'Fake or misleading listing'
  | 'Incorrect information'
  | 'Incorrect location'
  | 'Inappropriate photograph'
  | 'Privacy concern'
  | 'Harassment or abuse'
  | 'Suspicious activity'
  | 'Other';

export type UserReportCategory =
  | 'Harassment'
  | 'Fraud'
  | 'Impersonation'
  | 'Abuse'
  | 'Spam'
  | 'Suspicious behavior'
  | 'Other';

export interface ListingReport {
  id: string;
  reportId: string;
  dogName: string;
  category: ListingReportCategory;
  details?: string;
  reporterUserId?: string;
  createdAt: string;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTIONED';
}

export interface UserReport {
  id: string;
  targetUserId: string;
  targetUserName?: string;
  category: UserReportCategory;
  details?: string;
  reporterUserId?: string;
  createdAt: string;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTIONED';
}

export interface BlockedUserRecord {
  blockedUserId: string;
  blockedUserName?: string;
  blockedAt: string;
}

