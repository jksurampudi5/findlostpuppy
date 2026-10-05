# Antigravity Pair-Programming & Deployment Workflow

## 1. Local-First Development & Testing Rule
- **Always Test Locally First**: Every code change, fix, and feature addition MUST be tested and verified locally first (`http://localhost:5173/`, `npm run build`, and test scripts in `scratch/`).
- **Build Verification**: Run `npm run build` (`tsc -b && vite build`) to guarantee 0 TypeScript and bundling errors before committing.

## 2. Git Branch & Release Flow
1. **Target Branch**: All commits and pushes MUST be made strictly to the **`fixes`** branch (`origin fixes`).
2. **Never Push Directly to `main`**: All changes go to `fixes` first.
3. **Pull Request Workflow**: Once changes are verified on `localhost` and pushed to `fixes`, create a Pull Request from `fixes` into `main`, and then merge into `main`.

## 3. Core Product Invariants & Rules
- **Owner Contact Privacy Masking**:
  - Public dashboard cards, search listings, and browse grids must ALWAYS mask phone numbers (`+91 86••••••48`) and emails (`j•••5@gmail.com`) to prevent scraping and spam.
  - Sighting relay tools ("Report Sighting") are used by community finders to communicate securely without exposing raw numbers.
- **Strict Indian Phone Number Validation**:
  - All phone inputs must be genuine 10-digit Indian mobile numbers starting with `6`, `7`, `8`, or `9` (`validateIndianPhoneNumber`).
  - Automatically reject dummy numbers (e.g. `1234567819`, `0000000000`, `9999999999`, sequential sequences).
- **Mutually Exclusive States**:
  - A pet is either `LOST` or `SAFE`—never both. "Safe at Home 🏡" immediately removes the pet from active missing searches.
- **Client-Side Compression**:
  - All image uploads must be compressed via `compressImage` to ~40KB JPEGs to protect browser `localStorage` quotas.

## 4. Current Product Memory — 2026-10-05
- Root `/` and browser refresh for an authenticated user must start at `/owner` after splash. Direct guarded routes like `/location`, `/choice`, `/pet`, `/alert`, `/capture`, and `/homepage` remain available when intentionally opened.
- Consent is required only for first-time users before Owner Profile. Returning users should not be sent back to consent.
- Owner Profile, Location, Pet Registered, Pet Details, and Pet Safety use the same top header pattern: Back on the left, page title centered, Close on the right.
- Dashboard starts neutral with no card selected. The three cards are `Sightings`, `Safe Pets`, and `Missing Pets`; selecting a card opens its modal, and closing/completing returns to the neutral dashboard.
- Location page auto-detects on entry when State, District, Mandal, or Home Base is missing. Detect/Detect Again must directly invoke the real browser/Android location permission prompt. If Android's master Location switch is off, use the native DeviceSettings/Google Play Services resolution flow, then retry on resume. Reset must clear and immediately re-detect.
- Capture Pet auto-detects state, district, mandal, and Home Base, shows a waiting state while resolving, lets the user change Home Base, scrolls to Select Missing Pet after Home Base is selected, and uses a compact camera sheet.
- Safe Pets public cards show pet image, pet name, status, owner chip, and Details only. Address/location details are visible only to the owner/admin inside details.
- Pet Details must keep stat/input cards responsive; long values wrap or stack instead of clipping. `Skip to Dashboard` and `Remove Pet` stay on the same responsive row.
- Feedback is an in-app App Suggestion component with stars, text input, and Submit Feedback. Play Store rating is a separate Early Access link button.
- Mobile side navigation shows only the pet image shortcut for pet details; it must not show the old large white pet detail card.

## 5. Android Location Settings Rule — 2026-10-05
- For Location detection, do not claim the app can silently turn on Android Location. Android requires user action.
- Use the native `DeviceSettings` Capacitor bridge to show the Google Play Services Location Settings resolution dialog when the master switch is off, and retry detection when the app regains focus.
- When Location permission is denied or the master Location toggle is off, keep the user in the native app flow first: request Android permission, then use the Google Play Services Location Settings resolution dialog. Open Android settings only as fallback.
