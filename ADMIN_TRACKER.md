# Admin Tracker

**FindLostPuppy** — manual engineering, cleanup, privacy, and release tracker
**Last updated:** 2026-10-05

This file is a human-maintained project tracker. It is not imported by the app, not used by the build, and not required at runtime. Keep it only if we want one quick place to record major project decisions and cleanup work.

## Current Status

| Area | Status |
| --- | --- |
| Active branch | `main` |
| Last committed privacy-policy deploy baseline | `2d655e2` |
| Current workspace | Has active uncommitted UI/navigation/location-permission/docs changes |
| Android release target discussed | `43 (1.0.4)` |
| Latest produced AAB | `/Users/jayakrishna/Desktop/2oct/findlostpuppy-v1.0.4-code43-release.aab` |

## Current Navigation Flow

The app now uses readable page names for the onboarding and dashboard flow.

| Screen | Route | File |
| --- | --- | --- |
| Owner Profile | `/owner` | `src/pages/OwnerProfile.tsx` |
| Location | `/location` | `src/pages/Location.tsx` |
| Registered Pet | `/choice` | `src/pages/RegisteredPet.tsx` |
| Pet Details | `/pet` | `src/pages/PetDetails.tsx` |
| Pet Safety | `/alert` | `src/pages/PetSafety.tsx` |
| Pet Status | `/homepage` | `src/pages/PetStatus.tsx` |

Detailed navigation docs live in `docs/navigation-flow.md` and `docs/app-context.md`.

## Current Splash And Animation Decisions

- React launch splash timing is documented in `docs/splash-timing.md`.
- Splash logo stage is `3.20s` plus `0.35s` fade-out.
- The same splash timing is used for first-time and returning logged-in users.
- The hand animation assets preserved for the splash are:
  - `logo_top_hand.png`
  - `logo_bottom_hand.png`
  - `logo_center_sanctuary.png`
- The village transition preserves only the running dog videos needed by the flow:
  - `public/animations/dog_village_run_opt.mp4`
  - `public/animations/dog_village_run_back.mp4`

## Current Public Asset Cleanup

Public root assets were reduced to the files that are still needed directly by the web/Android package:

- `public/404.html`
- `public/app_logo_square.png`
- `public/logo_bottom_hand.png`
- `public/logo_center_sanctuary.png`
- `public/logo_top_hand.png`
- `public/privacy-policy.html`

The browser icon now points to `app_logo_square.png` from `index.html`.

## Privacy And Compliance Notes

- `public/privacy-policy.html` was corrected and pushed to `main` for GitHub Actions deployment.
- Google Play Console privacy policy URL still needs to point to the deployed privacy policy page.
- Public owner contact details must remain masked.
- Exact home GPS coordinates and door/street-level address details must not appear in public missing-pet or sighting views.
- Android backup must stay disabled because authenticated app data may exist in local WebView storage.

## Verification Commands Used Recently

```bash
npm run build
npx cap sync android
```

Both commands passed after the latest public asset cleanup.

## Keep Or Remove This File?

Keep this file only as a lightweight human checklist. The app does not need it. If it becomes stale again, prefer deleting it or replacing it with short links to the real docs:

- `docs/app-context.md`
- `docs/navigation-flow.md`
- `docs/splash-timing.md`
- `docs/deployment.md`
- `docs/legal-compliance-checklist.md`


## Current Implemented UI Decisions — 2026-10-05

- Refresh/root launch for authenticated users starts at `/owner` after splash. Direct routes still work when intentionally opened.
- Onboarding-style page headers use the shared layout: Back button left, centered page title, Close button right. This applies to Owner Details, Location, Pet Registered/Pet Choice, Pet Details, and Pet Status/Pet Safety.
- Pet Details view is responsive: stat cards wrap/stack and values do not clip; `Skip to Dashboard` and `Remove Pet` share one responsive row.
- Pet Safety safe/missing completion navigates to `/homepage` with no dashboard card pre-opened.
- Dashboard status cards start neutral; users choose Sightings, Safe Pets, or Missing Pets.
- Safe Pets cards hide exact location/address. Safe pet details are owner/admin-only.
- Mobile drawer pet section is an image shortcut only; detailed pet information is only in Pet Details.
- Location Detect uses an in-app `Allow Precise Location` sheet before Android/browser precise location permission. If Android master Location is off in the installed app, Google Play Services shows an in-app Location Services resolution dialog so the user can turn Location on without manually opening Quick Settings.
- In-app feedback and Play Store rating are separate. Feedback saves to admin review; Play Store rating opens `https://play.google.com/store/apps/details?id=om.findlostpuppy.app&hl=en-US&ah=6AkRSsY1key8_VyeUYB02AhzUpg`.

## Android Location Settings Bridge — 2026-10-05

- Added a native Capacitor `DeviceSettings` bridge for Android.
- Location page now uses Google Play Services Location Settings resolution when device GPS/master Location is off, keeping the user in the app flow.
- Location permission denial retries the in-app/native permission prompt first; Android system settings are fallback only when the OS cannot show the in-app resolution dialog.
- App retries detection automatically when the user returns.
- Browser/localhost still falls back to manual selection because Chrome cannot open Android system settings.
