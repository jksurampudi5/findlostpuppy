export type ReportStatus = 'LOST' | 'SAFE' | 'SIGHTED' | 'REUNITED' | 'CLOSED';

export type DogGender = 'Male' | 'Female' | 'Unknown';

export type DogSize = 'Toy (under 5kg)' | 'Small (5-10kg)' | 'Medium (10-25kg)' | 'Large (25-45kg)' | 'Extra Large (45kg+)';

export type ContactMethod = 'phone' | 'email' | 'whatsapp';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isAdmin?: boolean;
  createdAt: string;
  lastLoginAt?: string;
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
  photoChangeMonth?: string;
  photoChangeCount?: number;
  photoLastChangedAt?: string;
  photoChangeApprovalRequired?: boolean;
  address?: string; // Private
  city?: string;
  state?: string;
  district?: string;
  mandalOrMunicipality?: string;
  streetOrLocality?: string;
  street?: string;
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
  photoChangeMonth?: string;
  photoChangeCount?: number;
  photoLastChangedAt?: string;
  photoChangeApprovalRequired?: boolean;
  createdAt: string;
  updatedAt?: string;
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
  state?: string;
  district?: string;
  mandal?: string;
  village?: string;
  pinCode?: string;
  latitude?: number;
  longitude?: number;
  photo?: string;
  photos?: string[]; // Multiple photos of the sighted dog
  description: string;
  reporterName?: string;
  reporterPhone?: string;
  reporterEmail?: string;
  reporterUserId?: string;
  isGuest?: boolean;
  createdAt: string;
  // SCD Type 2 Historical Sighting Tracking:
  isCurrent?: boolean; // true if active current sighting; false if superseded by a newer sighting
  validFrom?: string; // ISO timestamp when this sighting became current
  validTo?: string | null; // ISO timestamp when superseded (null if still current)
  version?: number; // Revision counter: 1, 2, 3...
  supersededBy?: string; // ID of the newer sighting record that replaced this one
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

export type SuggestionCategory =
  | 'feature'
  | 'improvement'
  | 'ui_ux'
  | 'bug'
  | 'praise'
  | 'other';

export interface AppSuggestion {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  category: SuggestionCategory;
  title: string;
  description: string;
  rating?: number; // 1 to 5
  pageUrl: string;
  deviceInfo?: string;
  screenshotData?: string;
  createdAt: string;
  status: 'NEW' | 'REVIEWED' | 'PLANNED' | 'COMPLETED';
}

export interface ExtractedPetItem {
  id?: string;
  name?: string | null;
  petName?: string;
  breed?: string | null;
  age_text?: string | null;
  age?: string;
  gender?: 'Male' | 'Female' | 'Unknown' | null;
  size?: DogSize | string | null;
  vaccinated?: boolean | null;
  dewormed?: boolean | null;
  spayedOrNeutered?: boolean | null;
  temperament?: string | null;
  health_notes?: string | null;
  healthNotes?: string;
  about?: string | null;
  description?: string;
  photo?: string;
  field_confidence?: Record<string, number>;
  fieldConfidence?: Record<string, number>;
  field_source?: Record<string, string>;
  fieldSource?: Record<string, string>;
}

export interface ExtractedCaretaker {
  name: string | null;
  phone: string | null;
  email: string | null;
  contact_channel: string | null;
}

export interface ExtractedLocation {
  location_hint: string | null;
  state: string | null;
  district: string | null;
  mandal: string | null;
  village: string | null;
  pin_code: string | null;
}

export interface PosterExtractionResult {
  unreadable_text: boolean;
  pets: ExtractedPetItem[];
  caretaker: ExtractedCaretaker;
  location: ExtractedLocation;
}

export type AdoptionStatus = 'AVAILABLE' | 'ADOPTED' | 'PENDING';

export interface AdoptionPet {
  id: string; // e.g. "ADOPT-123456"
  listingGroupId?: string; // Groups multiple pets from the same poster submission
  userId?: string;
  petName: string;
  breed: string;
  gender: DogGender;
  age: string;
  size: DogSize;
  photo: string;
  photos?: string[];
  description: string;
  healthNotes?: string;
  vaccinated?: boolean;
  dewormed?: boolean;
  spayedOrNeutered?: boolean;
  state: string;
  district: string;
  mandal?: string;
  village?: string;
  city?: string;
  pinCode?: string;
  latitude?: number;
  longitude?: number;
  locationHint?: string; // Poster location hint (e.g. "Hyderabad")
  approximateLocation?: string;
  contactName: string;
  contactPhone: string; // Masked public phone (e.g. "+91 96••••••14")
  contactEmail?: string; // Masked public email (e.g. "c•••r@example.com")
  rawContactPhone?: string; // Private unmasked phone readable only by creator & admin
  rawContactEmail?: string; // Private unmasked email readable only by creator & admin
  flyerPhoto?: string; // Original uploaded adoption flyer/poster image (base64 or URL)
  isFlyerUpload?: boolean; // Flag if listing was created/populated via flyer scan
  extractedRawText?: string; // Audit raw text extracted from flyer
  fieldConfidence?: Record<string, number>;
  fieldSource?: Record<string, string>;
  status: AdoptionStatus;
  createdAt: string;
  updatedAt: string;
}
