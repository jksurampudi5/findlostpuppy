# FindLostPuppy Repository Instructions

## Working and Release Workflow

- Work locally on the `fixes` branch unless the user explicitly requests another branch.
- Never modify or push directly to `main`.
- Do not commit, push, merge, create a pull request, deploy, publish, or distribute a release without explicit user approval.
- Test changes at `http://localhost:5173` before requesting approval.
- Before any release, run `npm run lint`, `npm run build`, `npm run build:android`, `npm run sync:android`, and the relevant browser automation.
- When building an Android release AAB, copy it to Desktop as both `findlostpuppy-release.aab` and `findlostpuppy-v{versionName}-code{versionCode}-release.aab`.

## Security and Privacy Invariants

- Never commit `.env`, service-account files, private keys, signing credentials, access tokens, tester email lists, or real user exports.
- Client Firebase configuration values may come from approved `VITE_*` variables, but privileged credentials must never be bundled into the web or Android client.
- Keep Firestore and Storage rules deny-by-default. Public reads or writes require an explicit product requirement and a rule-level validation review.
- Firestore pet documents and SAFE reports are readable only by their owner or an administrator. Signed-in community users may read only sanitized LOST reports and sanitized sightings.
- Normal-user cloud synchronization must fetch the signed-in user's private documents directly and query shared collections only with the same privacy predicates enforced by Firestore rules.
- Firebase Storage profile and pet media are owner/admin-only. Shared missing-report and sighting media must not contain owner contact details or exact coordinates.
- Unsigned Cloudinary uploads are limited to sanitized public missing-report and sighting images under the configured public-alerts folder. Profile and normal pet media must never use an unsigned public Cloudinary preset.
- Cloudinary API secrets, signed-upload signatures, deletion credentials, moderation webhooks, and administrative operations belong only on an authenticated backend.
- Android application backup remains disabled because local WebView storage contains authenticated profile and pet data.
- Do not log authentication tokens, exact private coordinates, phone numbers, email addresses, or unmasked user records.
- Public owner contact details must remain masked, for example `+91 86••••••48` and `j•••5@gmail.com`.
- Exact home addresses and GPS coordinates must never appear in public listings.
- Phone fields must use `validateIndianPhoneNumber`: exactly 10 digits beginning with 6, 7, 8, or 9.
- Compress every user photo through `compressImage` before local persistence or upload.
- Critical report forms must use bounded, expiring local drafts. Failed compressed-image uploads must use the bounded retry queue and retry after connectivity returns.
- Production crash handling must not log form contents, contact data, exact location, images, credentials, or tokens.
- Material Terms or Privacy Policy changes must increment the consent versions and require renewed affirmative acceptance.
- Do not claim universal legal compliance without review by a qualified lawyer for the actual launch jurisdictions and business practices.
- Preserve Sonu (`#1788885000505`) as `/src/assets/sonu.jpg`.
- A pet cannot be `LOST` and `SAFE` at the same time.
- Selecting `Pet is Not Safe (Missing)` on Pet Safety opens the emergency broadcast modal. Commit the LOST state only after successful form submission.
- Preserve authentication, consent, legal, moderation, reporting, and deletion behavior unless the task explicitly changes it.

## Current Launch and Onboarding Flow

- Android's mandatory native splash uses a dark background with a transparent icon. Do not restore a static logo image before the React animation.
- The animated FindLostPuppy logo is the only branded launch artwork shown before authentication.
- The inauguration/gratitude presentation appears after authentication for a first-time user who has not completed the owner profile.
- Returning users and users with a completed owner profile skip the automatic inauguration. The footer may still open it manually.
- The onboarding order is authentication, first-time inauguration when applicable, owner profile, location, pet choice/details, then dashboard.
- The Pet Choice heading is `Pet Registered` when a pet exists.
- The existing-pet choice reads `You already had a pet: <pet name>`.
- The no-pet choice reads only `Skip` and routes to the dashboard.
- Pet Details shows one `Skip to Dashboard` action above the form or saved-pet view.
- A saved pet has exactly one deletion control: the top `Remove Pet` action. Deletion must remove the pet and leave the form ready for another pet or dashboard skip.
- Saved Owner Details rows are read-only and show no inline orange pencil/edit affordances. `Modify Details / Photo` is the single entry point for editing.

## Location Invariants

- State, District, Mandal/Municipality, and Village/Home Base are distinct fields.
- Village/Home Base must contain the village or locality and must never repeat the selected mandal.
- If automatic location detection cannot resolve a distinct village, clear Village/Home Base and ask the user to select it.
- Village selectors must filter out any option identical to the selected mandal.
- Location permission is requested only when the user chooses automatic detection; manual selection must remain available.
- Capture Pet must initialize State, District, Mandal, and Village/Home Base as blank, even when the owner profile contains a saved address.
- Capture Pet location filters are user selected in order. Selecting or changing a parent clears every child field; missing-pet reports must never auto-select filter values.
- Capture Pet selectors must retain the green pet-present indicator at every available State, District, Mandal, and Village level without auto-selecting those values.

## Dashboard Pet Status Invariants

- The dashboard has three category cards: `Sighted Missing Pets`, `Pets at Home`, and `Pets Missing`.
- Selecting a category opens a bounded, internally scrollable list modal rather than appending a long list below the cards.
- Mobile category cards show a representative pet image when one is available.
- Each Home or Missing row contains the pet image and pet name. Missing-pet details remain public for recovery; safe-pet `View Details` is available only to the signed-in owner.
- Safe-pet detail dialogs are read-only and must never contain Edit Details, Mark Missing, or Report Other Pet actions. Other users must not be able to open them.
- Sightings for the same missing pet are grouped behind one `View sightings (n)` action.
- Opening pet or sighting details must hide the category list modal so only one modal is visible.
- Closing a detail modal must restore the same category list at its previous context.
- A sighting detail modal exposes `Sighting 1`, `Sighting 2`, and subsequent numbered tabs for that pet.
- Modal content must stay inside the visible viewport and scroll internally on small screens and landscape devices.

## Responsive UI Requirements

- For every new screen or feature, always include safe loading, error, offline, permission-denied, and empty states. The app must never show a blank screen, infinite loader, broken layout, or raw technical error to users.
- Support small and large phones, tablets, foldables, portrait, landscape, Android cutouts, variable system bars, gesture and three-button navigation, display zoom, and font scaling.
- Do not assume physical screen resolution equals the usable CSS viewport.
- Use responsive Flexbox/Grid and relative sizing such as `clamp()`, `min()`, `max()`, `minmax()`, `%`, `rem`, `dvw`, `dvh`, and `svh`.
- Keep global `box-sizing: border-box`; use `min-width: 0` on constrained flex/grid children and safe wrapping for user-entered text.
- Do not use fixed page dimensions, arbitrary clipping, global horizontal hiding, fragile negative margins, or absolute positioning as overflow workarounds.
- Pages must scroll vertically when needed and must not require horizontal scrolling.
- Fixed headers and bottom navigation must not cover content.
- Keep focused fields and actions visible when the keyboard opens.
- Keep dialogs, drawers, selectors, camera surfaces, images, videos, canvases, and SVGs within their containers.
- Test long pet names, breeds, villages, mandals, districts, descriptions, and validation messages.

## Required UI Change Procedure

Before editing UI code:

1. Inspect the viewport meta configuration.
2. Inspect global styles and relevant responsive breakpoints.
3. Search for fixed dimensions, unsafe positioning, negative margins, and overflow rules.
4. Identify and explain the root cause and planned correction.

After editing UI code:

1. Run `npm run lint` and report errors separately from existing warnings.
2. Run `npm run build` for TypeScript and production compilation.
3. Run `npm run build:android` and `npm run sync:android` when Android assets are affected.
4. Run the relevant functional automation, plus `node scripts/test_responsive.mjs` for layout changes.
5. Test at least 320 px and 390 px portrait widths and a landscape/tablet viewport. Include the iQOO Z10x 5G viewport when an emulator or device is available.
6. Exercise affected keyboard, modal, dropdown, camera, and location flows where applicable.
7. Confirm there is no horizontal overflow, clipping, overlap, hidden action, or content outside its container.
8. Report changed files, root causes, tests, and any device-only validation still required.

## Automation Maintenance

- Treat automation selectors and expected copy as part of the feature. Update them in the same change when labels, routes, modal layering, or onboarding order changes.
- Browser tests must seed `findlostpuppy_gratitude_seen` and `findlostpuppy_launch_seen` when the test is unrelated to launch behavior.
- Launch tests must separately cover first-time authenticated users and returning users with completed owner profiles.
- Dashboard tests must assert single-modal visibility, restoration of the category list after detail close, concise Home/Missing rows, grouped sightings, and numbered sighting tabs.
- Keep test data synthetic. Never add real tester emails, phone numbers, addresses, coordinates, credentials, or production exports to fixtures or screenshots.
- Store generated screenshots and QA output under `scratch/` or another ignored artifact directory.
