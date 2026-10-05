# FindLostPuppy — Technical Architecture, System Context & Invariants Dossier

## 1. System Overview & Core Mission
**FindLostPuppy** is a community-driven, real-time emergency pet recovery and tracking platform built for Indian pet parents and animal rescue volunteers (with optimized administrative datasets for Andhra Pradesh, Telangana, and nationwide). 

The platform pairs **zero-leak personal privacy** (masking owner contact details, hiding exact home coordinates) with **rapid crowd-sourced reporting** (instant camera photo capture, GPS geocoding, and filtered sighting feeds).

---

## 2. Technology Stack & Connectors

| Layer / Connector | Technologies & Frameworks | Architecture Boundaries & Role |
| :--- | :--- | :--- |
| **Frontend Core** | React 18, TypeScript, Vite, CSS Modules / Vanilla CSS | Single Page Application (SPA). No TailwindCSS or heavy component libraries. Custom responsive design system (320px to 1024px+). |
| **Mobile Runtime** | Capacitor 6, Android Native (Gradle 8.7+, AGP 8.3+, Java 17) | Wraps web app in Android WebView. Native dark splash screen with transparent icon. Backup disabled (`allowBackup="false"`). |
| **Authentication** | Firebase Authentication (Google Sign-In) | Google OAuth sign-in. Retains active session in local storage with synthetic fallback for offline/test environments. |
| **Database** | Google Cloud Firestore | Collections: `pets`, `sightings`, `missing_reports`, `safe_reports`, `owner_profiles`, `user_feedback`. Deny-by-default security rules. |
| **Public Media** | Cloudinary REST API (Unsigned Preset) | Used strictly for public missing-pet photos and sighting uploads under sanitized public alert folder. Pre-compressed before upload. |
| **Private Media** | Firebase Storage | Private owner profile pictures and private pet media. Restricted strictly to owner/admin access. |
| **Location & Geocoding** | W3C Geolocation API, OpenStreetMap / Local Census | Administrative hierarchy: State → District → Mandal/Municipality → Village/Locality. |
| **Native Device Plugins** | `@capacitor/camera`, `@capacitor/geolocation`, `@capacitor/app` | Native camera with gallery fallback; high-accuracy GPS with timeout protection; native Android back button handling. |

---

## 3. Security, Privacy & Compliance Invariants

> **CRITICAL INVARIANTS — STRICTLY ENFORCED:**

1. **Zero-Leak PII Masking:**
   - Public owner contact details must ALWAYS remain masked:
     - Phone: `+91 86••••••48`
     - Email: `j•••5@gmail.com`
2. **No Exact Home GPS Coordinates or Addresses:**
   - Exact home coordinates, street names, and door numbers must NEVER be exposed publicly.
   - Public missing-pet listings and sightings display only State, District, Mandal, and Village/Locality.
3. **Firestore Deny-by-Default:**
   - Pet documents and `safe_reports` are readable ONLY by their authenticated owner or an administrator.
   - Signed-in community users can ONLY query sanitized `missing_reports` and sanitized `sightings`.
4. **Cloudinary Unsigned Upload Constraints:**
   - Unsigned Cloudinary uploads are restricted strictly to public missing-pet and sighting images under the designated public folder.
   - Profile photos and private pet media must NEVER use unsigned Cloudinary presets.
   - Cloudinary API secrets must never be bundled into the web or Android client.
5. **Android Application Backup Disabled:**
   - In `AndroidManifest.xml`, `android:allowBackup="false"` is mandatory because local WebView storage contains authenticated profile and pet data.
6. **Strict Indian Phone Number Validation:**
   - Phone fields must pass `validateIndianPhoneNumber`: exactly 10 digits beginning with 6, 7, 8, or 9.
7. **Client-Side Photo Compression:**
   - Every photo must be compressed through `compressImage` prior to local persistence or network upload to avoid memory exhaustion and bandwidth bloat.
8. **State Mutual Exclusivity:**
   - A pet can NEVER be `LOST` and `SAFE` at the same time.
   - Selecting "Pet is Not Safe (Missing)" triggers the emergency broadcast modal; the `LOST` state is only committed after successful form submission.
---

## 4. Component Hierarchy & Navigation Flow

### Launch Splash Timing

The React launch splash uses the same timing for first-time and returning logged-in users: 3.20 seconds for the logo stage, followed by a 0.35 second fade-out. The hand movement completes before fade-out begins. See `docs/splash-timing.md` for the exact timeline.

### First-Time User Flow

```
[App Launch]
    ↓
[Animated Native / React Splash] (Dark background, transparent icon)
    ↓
[Authentication / Login Page] (Google Sign-In)
    ↓
[Consent, if required]
    ↓
[Owner Profile] (/owner)
    ↓
[Location] (/location)
    ↓
[Registered Pet] (/choice)
    ├── Add My Pet / existing pet → [Pet Details] (/pet)
    │                                ↓
    │                              [Pet Safety] (/alert)
    │                                ↓
    │                              [Pet Status] (/homepage)
    └── Skip → [Pet Status] (/homepage)
```

### Returning Or Already Logged-In User Flow

```
[App Launch]
    ↓
<Has active signed-in session?>
    ├── NO  → [Authentication / Login Page] (/login)
    └── YES → <Is this a genuine first-time user needing consent?>
              ├── YES → [Consent] (/consent)
              └── NO  → [Owner Profile] (/owner)
```

Refresh/root launch intentionally starts signed-in users at `Owner Profile` after splash. Direct routes still work when opened intentionally from the app or URL.

Consent is only required for genuine first-time signed-in users. Returning users with existing consent, owner profile, location, pet profile, or reports skip consent.

### Screen File Map

| Screen | Route | File |
| --- | --- | --- |
| Owner Profile | `/owner` | `src/pages/OwnerProfile.tsx` |
| Location | `/location` | `src/pages/Location.tsx` |
| Registered Pet | `/choice` | `src/pages/RegisteredPet.tsx` |
| Pet Details | `/pet` | `src/pages/PetDetails.tsx` |
| Pet Safety | `/alert` | `src/pages/PetSafety.tsx` |
| Pet Status | `/homepage` | `src/pages/PetStatus.tsx` |

### Component Rules
- **Owner Profile:** Saved Owner Details rows are read-only and show no inline orange pencil edit affordances. `Modify Details / Photo` is the single entry point for editing.
- **Pet Choice / Onboarding:**
  - Heading is `Pet Registered` when a pet exists.
  - Existing pet choice reads `You already had a pet: <pet name>`.
  - Exactly one deletion control: top `Remove Pet` button.
  - Prominent `Skip to Dashboard` button enables pet-free users to participate in community sightings immediately.

---

## 5. Location Hierarchy & Geocoding Rules

FindLostPuppy enforces a 4-tier geographic administrative division:
1. **State:** Top-level selection (e.g., Andhra Pradesh, Telangana). Changing State resets District, Mandal, and Village.
2. **District:** Dependent on State. Changing District resets Mandal and Village.
3. **Mandal / Municipality:** Sub-district administrative unit. Distinct from Village/Locality.
4. **Village / Home Base:**
   - **Distinct Village Invariant:** Village/Home Base must contain the specific village or locality and must NEVER repeat the selected mandal.
   - Village selectors filter out any option identical to the selected mandal.
   - If autodetect cannot resolve an exact distinct village, Home Base is filled from the matched mandal's locality list so all four cards are populated and editable.

### Location And Capture Pet Location Invariants
- Location auto-detects on entry when any of the four cards are empty, and `Detect Location` / `Detect Location Again` directly triggers the real Android/browser geolocation permission prompt.
- Apps cannot enable Android's master Location switch directly; if the switch is off, the user must enable it in quick settings/system settings, then tap Detect Again.
- Capture Pet auto-detects State, District, Mandal, and Home Base before the user selects the missing pet; if no missing alert exists in the selected Home Base, an SOS-style change prompt is shown in the Home Base card, not as a toast.
- Capture Pet keeps the first location section visible first; after a valid Home Base is selected, it scrolls to Select Missing Pet.
- Cascading filters: changing parent clears all child fields (no auto-selection).
- Dropdowns retain green pet-present indicators (`🟢`) showing missing pet counts at that administrative tier.

---

## 6. Dashboard Pet Categories & Modal Rules

The Dashboard revolves around three primary category cards:
- **Sightings:** Sightings reported by community members with photos and geolocations.
- **Safe Pets:** Verified safe pets registered to their owners; public cards show only pet image, pet name, owner chip, and details action.
- **Missing Pets:** Pets broadcasted as missing, awaiting community recovery.

### Modal Invariants
- **Bounded Internally Scrollable Modals:** Selecting a category opens an internally scrollable modal; it never appends long lists beneath cards on the main page.
- **Strict Single-Modal Rule:** Only one modal is permitted on screen at any time. Opening a pet detail or sighting detail modal immediately hides the category list modal.
- **Context Restoration:** Closing a detail modal immediately restores the previously active category list modal at its exact scroll context.
- **Grouped Sightings:** Multiple sightings for the same missing pet are consolidated behind `View sightings (n)` action. Sighting detail dialog displays numbered tabs (`Sighting 1`, `Sighting 2`, etc.).
- **Safe Pet Owner-Only Privacy:** Safe-pet `View Details` is available ONLY to the signed-in owner. Other users cannot view safe pet profiles. Safe-pet dialogs are read-only and never show "Mark Missing" or "Edit" buttons.

---

## 7. Emergency Alert & Roaming Pet Capture System

### Quick Roaming Pet Capture (On Dashboard)
- **Triggers:** Header button `#dashboard-quick-capture-btn` and Floating Action Button (FAB) `#dashboard-floating-capture-fab`.
- **Instant Geolocation & Camera:** User snaps photo; app auto-captures current GPS coordinates.
- **Automatic Designation:**
  - Pet ID: `UNKNOWN_ROAMING_PET`
  - Pet Name: `"Unknown (Roaming Pet)"`
  - Status: `LOST`
- **Instant Discovery:** Sighting is immediately submitted into the "Missing Pets" repository so owners can filter and locate their lost pets.

### Cascading Location Filter Bar
- Dropdown filter bar (State → District → Mandal → Village) inside the "Missing Pets" modal lets users quickly find lost and roaming reports near their neighborhood.

### Feedback And Play Store Rating
- Feedback never pops up automatically on first dashboard load.
- In-app feedback is accessible from the dashboard/footer controls and contains only star rating, optional text input, and `Submit Feedback`.
- Feedback saves through `storageService.saveSuggestion(...)` into the admin-review suggestion backend.
- Play Store rating is a separate dashboard action using `https://play.google.com/store/apps/details?id=om.findlostpuppy.app&hl=en-US&ah=6AkRSsY1key8_VyeUYB02AhzUpg`.

---

## 8. Developer & Release Engineering Cheat Sheet

### Terminal Commands
```bash
# 1. Start local dev server (Port 5173)
npm run dev

# 2. Stop local dev server
kill -9 $(lsof -ti:5173) 2>/dev/null || pkill -f "vite"
```

### Pre-Release Verification Chain
```bash
# Run before any release, commit, or PR:
npm run lint                    # Must have 0 errors
npm run build                   # TypeScript & Vite production build
npm run sync:android            # Sync web assets to Capacitor Android
npm run build:android           # Gradle build release AAB / APK
node scripts/test_responsive.mjs # Responsive verification (320px, 390px, 768px, 1024px)
```

### Android Release Artifact Requirements
Copy release bundle from Gradle output to Desktop under both filenames:
1. `/Users/jayakrishna/Desktop/findlostpuppy-release.aab`
2. `/Users/jayakrishna/Desktop/findlostpuppy-v{versionName}-code{versionCode}-release.aab`

---

## 9. Prompt Template for Claude AI Context

```text
You are an expert full-stack engineer pair-programming on the FindLostPuppy project.
Here is the authoritative system context and non-negotiable invariants:

1. REPOSITORY & WORKFLOW RULES:
- Always work locally on the 'fixes' branch. Never commit or push directly to 'main'.
- Never modify production without user approval.
- Local dev server runs on http://localhost:5173.
- After any UI edit, run: npm run lint, npm run build, npm run sync:android, and node scripts/test_responsive.mjs.
- Ensure layouts work flawlessly from 320px, 390px, to 1024px+ viewports without horizontal scroll.

2. SECURITY & PRIVACY:
- Strict PII masking: Mask owner phone numbers (+91 86••••••48) and emails (j•••5@gmail.com).
- Never expose exact home GPS coordinates or street addresses in public listings.
- Firestore is deny-by-default. Private pet docs and SAFE reports are owner/admin only. Community users read only sanitized LOST reports and sightings.
- Unsigned Cloudinary is restricted to sanitized public missing-report photos. Private photos use Firebase Storage.
- Android backup is disabled (android:allowBackup="false").
- Indian phone number validation: exactly 10 digits beginning with 6, 7, 8, or 9.
- Always compress photos via compressImage before saving or uploading.
3. LOCATION INVARIANTS:
- 4 tiers: State → District → Mandal/Municipality → Village/Locality.
- Village must be distinct from Mandal (never duplicate the mandal name).
- Capture Pet page always initializes with blank location selectors.
- Cascading dropdowns: changing a parent clears all child fields (no auto-selection).
- Dropdowns retain green pet-present indicators (🟢) showing counts.

4. NAVIGATION & DASHBOARD:
- Onboarding order: Auth → Inauguration (first-time only) → Owner Profile → Location → Pet Choice/Details → Dashboard.
- Dashboard has 3 category cards: 'Sightings', 'Safe Pets', 'Missing Pets'.
- Selecting a card opens an internally scrollable modal. Single-modal visibility rule: opening a detail modal hides the category modal; closing it restores the category modal.
- Sighted reports for the same pet are grouped behind 'View sightings (n)' with numbered tabs (Sighting 1, 2...).
- Quick capture on Dashboard logs roaming pets as 'Unknown (Roaming Pet)' with ID UNKNOWN_ROAMING_PET directly into 'Missing Pets'.
```


## 10. Current UI/Flow Snapshot — 2026-10-05

- Shared top-row header pattern is required on Owner Details, Location, Pet Registered/Pet Choice, Pet Details, and Pet Status/Pet Safety: Back left, title centered, Close right.
- Refresh/root startup always begins authenticated users at `/owner` after splash.
- Pet Details view must be fully responsive: stat cards auto-fit or stack; values wrap; `Skip to Dashboard` and `Remove Pet` share one responsive row.
- Pet Safety completion and Missing alert submission must navigate to the neutral dashboard with no status card opened.
- Dashboard status cards start neutral; the user picks Sightings, Safe Pets, or Missing Pets.
- Safe Pets cards never show exact address/location. Only owner/admin can open safe-pet details.
- Mobile drawer pet section is image shortcut only; details stay in Pet Details.
- Feedback and Play Store rating are separate actions. Feedback syncs to admin backend; Play Store opens the listing URL.

### Android Location Permission Invariant — 2026-10-05

FindLostPuppy directly requests the real native Android/browser location permission when detecting location. The Location page auto-detects on entry when State, District, Mandal, or Home Base is missing, fills all four cards, and scrolls to the cards plus Continue button after a successful detection. Reset clears and immediately re-detects. If the phone's master Location switch is off in the installed app, Google Play Services shows an in-app Location Settings resolution dialog so the user can turn Location on by consent. Android settings remain fallback only when the OS cannot show the resolution dialog. Android does not allow silently toggling the master Location switch from an app.

### Scroll / Next-Action Invariant — 2026-10-05

After a user action fills or changes a multi-section component, the app should scroll to the next useful section or primary action. Owner Profile scrolls to edit form/actions, Location scrolls to the filled four-card area and Continue button, Pet Details scrolls to form/actions, Pet Status opens list modals from the top, and Capture Pet scrolls to Select Missing Pet once Home Base is resolved.
