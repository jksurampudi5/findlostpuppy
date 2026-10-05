# Product Requirements Document (PRD) — FindLostPuppy 🐾

| Document Metadata | Value |
| :--- | :--- |
| **Product Name** | FindLostPuppy |
| **Document Version** | 1.0.0 |
| **Status** | Approved / Living Specification |
| **Target Platforms** | Mobile Web (PWA), Android Native (Capacitor WebView), Desktop Web |
| **Primary Markets** | India (Optimized administrative datasets for Telangana, Andhra Pradesh & Nationwide) |
| **Target Audience** | Pet Parents, Good Samaritan Citizens, Community Animal Rescuers, Shelter Volunteers |

---

## 1. Executive Summary & Vision

### 1.1 Vision Statement
FindLostPuppy is an emergency, privacy-first, community-powered lost pet recovery network tailored specifically for Indian geography and administrative hierarchies. The platform bridges the critical first 48 hours of pet disappearance by empowering pet owners to broadcast instant missing alerts and enabling travelers and citizens to snap and geocode stray or roaming dog sightings.

### 1.2 Core Value Proposition
- **Rapid Disappearance Broadcast:** Convert pet registration into a live public recovery alert in under 60 seconds with auto-generated WhatsApp SOS flyers and public web dashboard links.
- **Zero-Leak Personal Privacy:** Strict PII masking of pet parents (masked phones like `+91 86••••••48`, masked emails `j•••5@gmail.com`, and exclusion of exact GPS coordinates/home door numbers).
- **Administrative Precision:** Location structure mapped to Indian governance: **State $\rightarrow$ District $\rightarrow$ Mandal / Municipality $\rightarrow$ Village / Locality / Home Base**.
- **Offline-First & Resilient Sync:** Immediate local persistence with automatic background queueing and synchronization to Google Cloud Firestore and Cloudinary media delivery.

---

## 2. User Personas & Problem Scenarios

### 2.1 Persona Matrix

| Persona | Role | Primary Goal | Pain Points with Existing Solutions |
| :--- | :--- | :--- | :--- |
| **Priya (Pet Parent)** | Urban dog owner (Hyderabad) | Immediately broadcast missing alert when pet slips collar during a walk. | Physical posters take hours to print; social media groups leak private phone numbers to spam and scammers. |
| **Ramesh (Commuter / Spotter)** | Daily bus/bike commuter (Vikarabad) | Quickly photograph a distressed Indie dog spotted near a bus stand. | Won't install heavy apps or create accounts just to report a single street sighting; doesn't know who the owner is. |
| **Anand (Animal Rescuer / NGO)** | Volunteer at animal shelter | Monitor sightings in specific mandals and coordinate rescues. | Sighting reports scattered across WhatsApp groups lack geocoding, timestamps, or pet identification. |
| **System Administrator** | Platform compliance & safety manager | Moderate spam, ensure PII compliance, verify safety recoveries. | Requires audit logs, GDPR/DPDP-compliant deletion tools, and granular status governance. |

---

## 3. Product Scope & Functional Requirements

```
[Onboarding & Registration]
  ├── Google Sign-In / Session Persistence
  ├── Inauguration & Gratitude (First-time users)
  ├── Owner Profile (Contact, Masking Settings)
  ├── Location Setup (State -> District -> Mandal -> Village)
  └── Pet Profile (Characteristics, Photos, Sonu Preserved)

[Daily Dashboard & Tracking]
  ├── Three Category Cards (Sightings, Safe Pets, Missing Pets)
  ├── Modal-Based Status Explorer (Single-modal invariant)
  ├── Grouped Sighting Drawer (Numbered tabs: Sighting 1, 2...)
  └── Quick Capture Floating Action Button (FAB)

[Emergency Recovery & Sighting]
  ├── Lost Status Declaration (Mutual Exclusivity Enforced)
  ├── WhatsApp SOS Card Generator
  ├── Instant Travel Photo Sighting (Camera + Resilient GPS)
  └── Sighting Confirmation & Reunited Celebrations
```

### 3.1 Authentication & Onboarding
- **FR-AUTH-1:** The animated FindLostPuppy logo is the exclusive branded artwork shown before user authentication.
- **FR-AUTH-2:** Authentication uses Google Sign-In via Firebase Auth / Capacitor native auth, with resilient synthetic fallback for offline/development environments.
- **FR-AUTH-3 (Launch / Refresh):** After splash, authenticated users start at Owner Profile on root/refresh. Direct routes remain available when opened intentionally. First-time users see consent before Owner Profile when required.
- **FR-AUTH-4 (Step Progression):** Strict sequential onboarding: `Authentication` $\rightarrow$ `Inauguration` (first-time only) $\rightarrow$ `Owner Profile` $\rightarrow$ `Location` $\rightarrow$ `Pet Choice / Details` $\rightarrow$ `Dashboard`.
- **FR-AUTH-5 (Top Header Pattern):** Onboarding and status setup views use Back left, centered title, and Close right. Back buttons navigate to the preceding step; Close exits to Dashboard where applicable.

### 3.2 Owner Profile Management
- **FR-OWN-1 (Phone Validation):** Indian phone numbers must pass `validateIndianPhoneNumber`: exactly 10 digits beginning with 6, 7, 8, or 9.
- **FR-OWN-2 (Read-Only Safety View):** Completed owner details are rendered in a read-only presentation card without inline pencil edit affordances. `Modify Details / Photo` is the single explicit entry point for modifications.
- **FR-OWN-3 (Photo Quota Policy):** Profile image modifications enforce a bounded modification counter to prevent rapid avatar thrashing and storage bloat.

### 3.3 Administrative Location Hierarchy
- **FR-LOC-1 (Hierarchy Distinctness):** State, District, Mandal/Municipality, and Village/Home Base are distinct fields. Village/Home Base must contain the village/locality and must never repeat the mandal.
- **FR-LOC-2 (Permission Model):** The Location page attempts geolocation automatically on entry when any of State, District, Mandal, or Home Base is empty. Detect Location/Detect Again directly triggers the real Android/browser permission prompt. If Android master Location is off, the native Location Settings resolution flow is used and detection retries after return. Manual drill-down selection must always remain available.
- **FR-LOC-3 (Parent-Child Cascading):** Selecting or modifying a parent administrative boundary immediately clears all child fields to prevent invalid geographic combinations.
- **FR-LOC-4 (Pet Presence Indicators):** Sighting selectors must display a green indicator (`🟢`) indicating active missing pet alerts across State, District, Mandal, and Village tiers without auto-selecting filter values.

### 3.4 Pet Registration & Status Invariants
- **FR-PET-1 (Single Pet Choice):** If an existing registered pet exists, the choice heading displays `Pet Registered` and offers `You already had a pet: <Name>` alongside a single `Skip to Dashboard` option.
- **FR-PET-2 (Mutual Exclusivity):** A pet cannot be `LOST` and `SAFE` simultaneously. Selecting `Pet is Not Safe (Missing)` in the Pet Safety modal opens the emergency broadcast flow; the `LOST` state is committed in database storage only upon successful form submission.
- **FR-PET-3 (Single Deletion Control):** Saved pet details expose exactly one deletion control: `Remove Pet`, aligned with `Skip to Dashboard` in one responsive row, resetting the form cleanly.

### 3.5 Dashboard & Status Explorer
- **FR-DASH-1 (Three Category Cards):** Dashboard presents three neutral primary status cards:
  1. `Sightings` (captured pet sightings)
  2. `Safe Pets` (pets marked safe at home)
  3. `Missing Pets` (active emergency alerts across the area)
- **FR-DASH-2 (Modal Containment):** Selecting a status card opens a bounded, internally scrollable modal rather than appending lengthy rows beneath the cards.
- **FR-DASH-3 (Single Modal Visibility):** Opening a pet detail or sighting detail modal must hide the category modal. Closing a detail modal restores the previous list at its exact scroll offset.
- **FR-DASH-4 (Grouped Sightings):** Multiple sightings for the same missing pet are grouped under a single `View sightings (n)` action, expanding to numbered tabs: `Sighting 1`, `Sighting 2`, etc.

### 3.6 Quick Travel Sighting & Camera Capture
- **FR-CAP-1:** Floating Quick Capture button launches the camera directly with zero mandatory text input required upfront.
- **FR-CAP-2:** GPS coordinates are captured at snapshot time with resilient timeout fallbacks and reverse geocoded to the nearest Indian locality.
- **FR-CAP-3:** Uploads are queued if network connectivity is lost and retried automatically via the bounded retry queue upon reconnection.

---

## 4. Privacy, Security & Legal Invariants

| ID | Invariant Rule | Implementation Mechanism |
| :--- | :--- | :--- |
| **SEC-1** | **PII Masking** | Public listings display masked phones (`+91 86••••••48`) and masked emails (`j•••5@gmail.com`). Raw phone numbers and emails never leave authenticated owner/admin payloads. |
| **SEC-2** | **No GPS Coordinate Leaks** | Exact home coordinates, door numbers, and private streets are stripped from public Firestore documents; public views expose only administrative boundaries. |
| **SEC-3** | **Deny-by-Default Firestore** | Security rules permit read/write of private pet/owner records solely to the authenticated owner. Community users can only read sanitized public missing alerts and sightings. |
| **SEC-4** | **Restricted Unsigned Cloudinary** | Unsigned Cloudinary uploads are strictly limited to sanitized public missing-report and sighting images under `/findlostpuppy/public-alerts/`. Profile photos require Firebase Storage. |
| **SEC-5** | **Android Backup Disabled** | `android:allowBackup="false"` is enforced in `AndroidManifest.xml` to prevent extraction of local WebView auth and pet drafts via `adb backup`. |
| **SEC-6** | **Client-Side Compression** | All photos pass through `compressImage` (JPEG, max 1280px dimension, 0.75 quality) before local storage or network transmission. |
| **SEC-7** | **Affirmative Legal Consent** | Terms of Service, Privacy Policy, and Master Declarations require explicit checkbox acknowledgement; version increments require renewed acceptance. |

---

## 5. Non-Functional Requirements (NFRs)

- **NFR-PERF-1 (Load Speed):** First Contentful Paint (FCP) $\le 1.2\text{s}$ and Largest Contentful Paint (LCP) $\le 2.0\text{s}$ on standard 4G mobile networks.
- **NFR-RESP-1 (Responsive Matrix):** Strict compatibility from 320px minimum width (compact Android devices) up to 1024px+ tablets, supporting portrait, landscape, cutouts, dynamic viewport units (`dvh`/`dvw`), and high font scaling.
- **NFR-OFFLINE-1:** Full functional continuity when offline: draft persistence in `localStorage`, cached catalog lookups, and bounded retry queue.
- **NFR-RELIABILITY-1:** Zero unhandled UI exceptions; all network boundaries wrapped with safe loading, retry affordances, and non-blocking toast notifications.

---

## 6. Success Metrics & Key Performance Indicators (KPIs)

1. **Time-to-Broadcast:** Average time from pet disappearance realization to live SOS broadcast $< 60$ seconds.
2. **Community Sighting Engagement:** Number of travel sightings logged per missing alert.
3. **Reunification Rate:** Percentage of reported lost pets successfully marked `SAFE` within 7 days.
4. **Zero PII Exposure Incidents:** 100% adherence to privacy masking across all public APIs and client renders.

- **FR-DASH-5 (Neutral Dashboard Return):** Completing Pet Safety as Safe or Missing returns to Dashboard with no category card opened.
- **FR-FEEDBACK-1 (Separated Feedback/Rating):** In-app feedback contains stars, optional text, and Submit Feedback. Play Store rating is a separate action using the Google Play listing URL.
