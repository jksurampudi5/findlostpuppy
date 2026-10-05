# Implementation Plan & Delivery Roadmap — FindLostPuppy 🚀

| Document Metadata | Value |
| :--- | :--- |
| **Project** | FindLostPuppy Multi-Platform Pet Recovery Network |
| **Document Version** | 1.0.0 |
| **Status** | Active Execution Roadmap |
| **Current Target Branch** | `fixes` |
| **Target Platforms** | Mobile Web (PWA), Android Native App (Google Play) |

---

## 1. Project Phase Architecture

```
Phase 1: Foundation & Security Invariants
  └── React 19 + Vite 8.2 + TypeScript 6.0 + Firestore Deny-by-Default
Phase 2: Authentication & First-Time Inauguration
Phase 3: Sequential Onboarding & Administrative Hierarchy
  └── Owner Contact + State/District/Mandal/Village Cascading Selectors
Phase 4: Pet Profiles & Mutual Exclusivity
Phase 5: Community Dashboard & Modal Layering
  └── 3 Category Cards + Single-Modal Explorer + Grouped Sighting Drawer
Phase 6: Emergency Alerts, WhatsApp SOS & Quick Capture
  └── Form-committed LOST state + WhatsApp SOS card + Camera Geocoding
Phase 7: Modern UI Components & Micro-Interactions
  └── BackButton Pill with sliding arrow + Animated AlignJustifyIcon
Phase 8: Multi-Viewport Responsive Auditing & Android AAB Release
  └── 320px/390px/Tablet audit + Capacitor Gradle build + AAB packaging
```

---

## 2. Detailed Phase Breakdown & Milestones

### Phase 1: Core Foundation & Security Invariants
- [x] Configure Vite 8.2 with TypeScript 6.0 and path aliases (`@/*` $\rightarrow$ `src/*`).
- [x] Establish Firestore security rules with deny-by-default policies (`firebase.firestore.rules`).
- [x] Enforce `android:allowBackup="false"` in `AndroidManifest.xml` to protect local WebView storage.
- [x] Implement client-side `compressImage` pipeline (Canvas max dimensions $1280\times1280$, JPEG 0.75).
- [x] Create core TypeScript types and models in `src/types/index.ts`.

### Phase 2: Authentication & Inauguration Experience
- [x] Implement Google Authentication flow via Firebase Auth and Capacitor native authentication.
- [x] Implement Inauguration / Gratitude presentation for first-time authenticated users.
- [x] Configure refresh/root launch so authenticated users start at Owner Profile after splash; direct app routes remain available.
- [x] Implement master consent declaration dialog with versioned terms and privacy checkboxes.

### Phase 3: Sequential Onboarding & Location Hierarchy
- [x] Build `OwnerProfile` with strict 10-digit Indian phone validation (`validateIndianPhoneNumber`).
- [x] Design read-only Owner Details presentation card with a single `Modify Details / Photo` entry point.
- [x] Construct 4-tier administrative location hierarchy: `State` $\rightarrow$ `District` $\rightarrow$ `Mandal` $\rightarrow$ `Village/Locality`.
- [x] Add auto-detection with W3C/Capacitor Geolocation plus an in-app `Allow Precise Location` sheet before the native Android/browser prompt.
- [x] Integrate green active-alert presence indicators (`🟢`) across administrative selectors.

### Phase 4: Pet Registration & Status Invariants
- [x] Build `RegisteredPet`: displays `Pet Registered` heading and `You already had a pet: <Name>` if a pet exists, or `Skip to Dashboard`.
- [x] Build `PetDetails` with breed selector (A-Z scrubber), age, color, gender, and photo upload.
- [x] Implement single pet deletion control: the top `Remove Pet` action.
- [x] Enforce state mutual exclusivity: pet cannot be `LOST` and `SAFE` simultaneously.

### Phase 5: Community Dashboard & Status Explorer
- [x] Build Dashboard with neutral 3 status category cards: `Sightings`, `Safe Pets`, `Missing Pets`.
- [x] Implement single-modal visibility invariant: opening a detail modal hides the category modal; closing restores the category modal at the same scroll position.
- [x] Group sightings for a single missing dog behind `View sightings (n)` with numbered tabs (`Sighting 1`, `Sighting 2`).
- [x] Display masked owner contact details (`+91 86••••••48`, `j•••5@gmail.com`) and sanitized localities on public missing/sighting cards. Safe Pets cards hide exact location/address and details are owner/admin-only.

### Phase 6: Emergency Alerts, WhatsApp SOS & Quick Travel Sighting
- [x] Implement emergency broadcast modal; commit `LOST` state only upon successful form submission.
- [x] Build one-tap WhatsApp SOS alert generator with public dashboard link.
- [x] Implement `CapturePetPage` with live camera stream, capture snapshot, and resilient reverse geocoding.
- [x] Implement offline bounded retry queue for failed image uploads.

### Phase 7: UI Polish, Component Library & Navigation Refinements
- [x] **BackButton Component:** Create interactive dark pill button with sliding arrow hover animation (`src/components/ui/back-button.tsx`) and use shared top-row headers: Back left, title center, Close right.
- [x] Integrate `BackButton` into Onboarding flow (`Location`, `Pet Choice`, `Pet Details`, `Report Lost Dog`) navigating to preceding steps.
- [x] Remove temporary showcase cards and pop-ups from Dashboard to maintain production cleanliness.
- [x] **AlignJustifyIcon Component:** Create animated SVG sequential stroke hamburger icon (`src/components/ui/align-justify-icon.tsx`).
- [x] Integrate `AlignJustifyIcon` as the mobile header navigation trigger in `SidebarNav.tsx`.

### Phase 8: Quality Assurance, Responsive Auditing & Release Workflow
- [x] **Linting:** Achieve **0 errors** across entire codebase with `oxlint` (`npm run lint`).
- [x] **Compilation:** Achieve **0 errors** in TypeScript compilation and Vite production build (`npm run build`).
- [x] **Responsive Verification:** Audit layout across 320px, 390px, landscape, and tablet viewports via automated headless browser tests.
- [x] **Android Build Pipeline:** Maintain build commands:
  - `npm run build:android`
  - `npm run sync:android`
- [ ] **Android AAB Packaging (On User Approval):**
  - Run `./gradlew bundleRelease` in `android/`
  - Copy output to Desktop as `findlostpuppy-release.aab` and `findlostpuppy-v{versionName}-code{versionCode}-release.aab`.

### Phase 9: Final Closed-Testing UI Stabilization
- [x] Refresh/root launch begins at Owner Profile after splash.
- [x] Pet Details cards auto-wrap with no horizontal clipping; Skip and Remove Pet share one row.
- [x] Pet Safety uses the shared header and returns to a neutral dashboard after safe/missing completion.
- [x] Feedback modal simplified to stars + text + submit; Play Store rating separated to the listing URL.
- [x] Mobile drawer pet detail card replaced with image shortcut only.

---

## 3. Testing & Verification Matrix

| Test Suite | Purpose | Execution Command | Target Criteria |
| :--- | :--- | :--- | :--- |
| **Linting Suite** | Syntax, TypeScript errors, unused variables | `npm run lint` | 0 errors |
| **Production Build** | Static type checking (`tsc -b`) & asset bundling | `npm run build` | 0 errors |
| **Responsive Audit** | Overflow check at 320px, 390px, 768px, 1024px | `node scripts/test_responsive.mjs` | Zero horizontal scroll, zero clipped modals |
| **Privacy Audit** | Ensure no unmasked PII or exact coordinates in shared collections | `npm run verify:firestore-privacy` | PASS |
| **Android Sync** | Verify native web assets and manifest compliance | `npm run sync:android` | PASS |

---

## 4. Release & Deployment Protocol

1. **Local Branch Rule:** Work strictly on the `fixes` branch. Never modify or push directly to `main`.
2. **User Approval Requirement:** Do NOT commit, push, merge, create a pull request, deploy, or distribute without explicit user approval.
3. **Localhost Verification:** Always verify and screenshot changes at `http://localhost:5173` prior to requesting sign-off.
4. **Knowledge Graph Sync:** Execute `graphify update .` after code modifications to maintain architectural traceability.
