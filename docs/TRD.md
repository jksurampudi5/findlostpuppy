# Technical Requirements Document (TRD) — FindLostPuppy ⚙️

| Document Metadata | Value |
| :--- | :--- |
| **System** | FindLostPuppy Multi-Platform Client & Cloud Architecture |
| **Document Version** | 1.0.0 |
| **Frontend Framework** | React 19, TypeScript 6.0, Vite 8.2 |
| **Mobile Bridge** | Capacitor 8.5 (Android AGP 8.3+, Gradle 8.7+, Java 17) |
| **Cloud Services** | Google Cloud Firestore, Firebase Auth, Firebase Storage, Cloudinary REST API |
| **Security Standard** | Deny-by-Default, Zero-PII-Leak, Client-Side Image Compression |

---

## 1. System Architecture Overview

```
                      ┌─────────────────────────────────────────┐
                      │          CLIENT APPLICATION             │
                      │  React 19 + TypeScript + Vite Bundler   │
                      │  Capacitor Android Native Container     │
                      └────────────────────┬────────────────────┘
                                           │
                ┌──────────────────────────┼──────────────────────────┐
                ▼                          ▼                          ▼
      ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
      │  Firebase Auth   │       │ Cloud Firestore  │       │ Cloudinary Media │
      │ Google OAuth /   │       │ Real-time DB &   │       │ Unsigned Public  │
      │ Session Bridge   │       │ Security Rules   │       │ Alert Uploads    │
      └──────────────────┘       └─────────┬────────┘       └──────────────────┘
                                           │
                                           ▼
                                 ┌──────────────────┐
                                 │ Firebase Storage │
                                 │ Private Owner /  │
                                 │ Pet Media Storage│
                                 └──────────────────┘
```

---

## 2. Frontend Architecture & State Management

### 2.1 Technology Stack Matrix
- **Runtime & UI:** React 19 (`react`, `react-dom`) with TypeScript (`~6.0.2`).
- **Routing:** React Router v7 (`react-router-dom`) with SPA deep link fallback handling (`public/404.html` $\rightarrow$ `index.html` `window.history.replaceState`).
- **Styling:** Custom Obsidian Titanium design system (`src/index.css`, `src/App.css`) with Tailwind utility integration in `src/components/ui/` (`tailwind-merge`, `clsx`, `class-variance-authority`).
- **Build System:** Vite 8.2 with Rolldown-ready code splitting and chunk size optimization.
- **Native Container:** `@capacitor/core`, `@capacitor/android`, `@capacitor/geolocation`, `@capacitor-firebase/authentication`.

### 2.2 Local Storage Schema & Reactive Events
The application employs an offline-first storage repository pattern (`src/services/storageService.ts`):

| LocalStorage Key | Schema Type | Description |
| :--- | :--- | :--- |
| `findlostpuppy_active_user` | `User` object | Current authenticated session (ID, name, email, phone). |
| `findlostpuppy_profiles_v1` | `OwnerProfile[]` | Local array of saved owner profiles. |
| `findlostpuppy_pets_v1` | `DogProfile[]` | Local array of registered pet profiles. |
| `findlostpuppy_reports_v1` | `LostReport[]` | Local cache of missing and safe pet reports. |
| `findlostpuppy_sightings_v1` | `Sighting[]` | Local cache of community sightings. |
| `findlostpuppy_consent_v1` | `ConsentRecord` | Affirmative terms & privacy acceptance version stamp. |

**Cross-Component Reactivity:**
Components synchronize state via browser custom events:
- `findlostpuppy_reports_updated`: Dispatched whenever a report or sighting is added/updated.
- `findlostpuppy_data_synced`: Dispatched on successful Firestore cloud sync.
- `storage`: Dispatched on direct `localStorage` writes to keep active tabs in sync.

---

## 3. Data Models & TypeScript Interfaces

### 3.1 Core Data Interfaces (`src/types/index.ts`)

```typescript
export interface DogProfile {
  id: string;
  ownerId: string;
  name: string;
  breed: string;
  color: string;
  size: 'Small' | 'Medium' | 'Large' | 'Extra Large';
  gender: 'Male' | 'Female';
  age?: string;
  distinguishingMarks?: string;
  hasCollarOrChip?: boolean;
  collarDetails?: string;
  primaryPhoto: string;
  photos: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OwnerProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  preferredContact: 'phone' | 'email' | 'whatsapp';
  state: string;
  district: string;
  mandalOrMunicipality: string;
  city: string; // Village / Locality / Home Base
  streetOrLocality?: string;
  latitude?: number;
  longitude?: number;
  hasLocationConsent: boolean;
  photoUrl?: string;
  updatedAt: string;
}

export interface LostReport {
  id: string;
  dogId: string;
  ownerId: string;
  status: 'LOST' | 'SAFE';
  dateLost: string;
  timeLost: string;
  lastKnownLocation: string;
  ownerApproximateLocation: string; // Masked locality (State, District, Mandal, Village)
  dog: DogProfile;
  sightingCount: number;
  contactMechanism: {
    showPhone: boolean;
    showEmail: boolean;
    safeContactPhone?: string; // MASKED (e.g. +91 86••••••48)
    safeContactEmail?: string; // MASKED (e.g. j•••5@gmail.com)
  };
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
  state: string;
  district: string;
  mandal: string;
  village: string;
  photo: string;
  description: string;
  latitude?: number;
  longitude?: number;
  isCurrent: boolean;
  createdAt: string;
}
```

---

## 4. Cloud & Backend Specifications

### 4.1 Cloud Firestore Collections & Security Rules (`firebase.firestore.rules`)
All Firestore access is **deny-by-default**.

| Collection | Read Permission | Write / Update Permission | Privacy Invariant |
| :--- | :--- | :--- | :--- |
| `owner_profiles` | Authenticated Owner / Admin | Authenticated Owner | Exact coordinates and unmasked phone never exposed publicly. |
| `pets` | Authenticated Owner / Admin | Authenticated Owner | Private pet profile data. |
| `missing_reports` | Public Authenticated Read (Sanitized) | Authenticated Owner / Admin | Sanitized payload: no exact coordinates, masked contacts only. |
| `sightings` | Public Authenticated Read (Sanitized) | Public Authenticated Write | Image uploads sanitized; no PII embedded. |
| `safe_reports` | Authenticated Owner / Admin | Authenticated Owner | Private safe confirmation. |
| `user_feedback` | Authenticated User | Authenticated User | Bounded text feedback for community rescue enhancements. |

### 4.2 Cloudinary Media Integration
- **Unsigned Upload Preset:** Restricted solely to public missing pet photos and sighting reports under the directory `findlostpuppy/public-alerts/`.
- **Private Profiles:** Owner personal photos and safe pet photos are stored in **Firebase Storage** with access rules locked to the owning user UID.
- **Client-Side Compression:** Images are compressed via `compressImage` (HTML5 Canvas rendering, max width/height `1280px`, JPEG quality `0.75`) prior to transmission.

---

## 5. Security, Privacy & Integrity Specifications

### 5.1 Indian Phone Validation
Phone fields must strictly satisfy `validateIndianPhoneNumber`:
```typescript
export function validateIndianPhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 && /^[6-9]/.test(digits);
}
```

### 5.2 Zero-PII Leak Masking Algorithm
```typescript
export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10) return '+91 ••••••••••';
  return `+91 ${digits.slice(0, 2)}••••••${digits.slice(-2)}`;
}

export function maskEmailAddress(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return '•••@••••.com';
  const maskedUser = user.length <= 2 ? `${user[0]}•` : `${user[0]}•••${user.slice(-1)}`;
  return `${maskedUser}@${domain}`;
}
```

### 5.3 Android App Backup Invariant
In `android/app/src/main/AndroidManifest.xml`:
```xml
<application
    android:allowBackup="false"
    android:fullBackupContent="false"
    ... >
```
Prevents unauthorized local storage extraction of credentials or private pet documents via Android Debug Bridge (`adb backup`).

---

## 6. Build, Android Packaging & Release Automation

### 6.1 Release Validation Command Chain
Before any code deployment or Android build generation, the following validation chain must execute with **0 errors**:
```bash
npm run lint                  # Oxlint validation across codebase
npm run build                 # TypeScript typecheck (tsc -b) & Vite compilation
npm run build:android         # Validates env and builds with CAPACITOR_BUILD=true
npm run sync:android          # Capacitor assets copy & Android verify
```

### 6.2 Android AAB Release Deliverables
When compiling a production Android App Bundle (AAB):
- Outputs must be generated via Gradle: `./gradlew bundleRelease`
- Copies must be deposited on the Desktop under both naming standards:
  1. `findlostpuppy-release.aab`
  2. `findlostpuppy-v{versionName}-code{versionCode}-release.aab`
