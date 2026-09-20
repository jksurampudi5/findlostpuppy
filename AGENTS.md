# Repository Instructions & Deployment Workflow

## 1. Local-First Testing Invariant
- Always test and verify changes in **`localhost:5173`** and run automated test scripts before pushing.
- Always run `npm run build` (`tsc -b && vite build`) to ensure 0 compile/type errors.

## 2. Mandatory Branch & PR Workflow
- **Working Branch**: Always work locally on the **`fixes`** branch unless explicitly instructed otherwise.
- **Never push directly to `main`**: All changes are tested on `fixes` first.
- **Explicit Approval Required**: Do not commit, push, merge, or create a pull request without explicit user approval.
- **PR & Merge**: When explicitly approved, raise a Pull Request from `fixes` to `main`, and then merge into `main` only after approval.

## 3. Privacy & Validation Standards
- **Owner Privacy Masking**: Public dashboard listings must always mask phone (`+91 86••••••48`) and email (`j•••5@gmail.com`).
- **10-Digit Indian Phone Numbers**: All phone fields must validate strictly as 10-digit Indian numbers starting with `6`, `7`, `8`, or `9` (`validateIndianPhoneNumber`).
- **Sonu Photo Preservation**: Dog Sonu (`#1788885000505`) must always resolve to `/src/assets/sonu.jpg`.
- **LOST vs SAFE Mutual Exclusivity**: A pet cannot be in both states simultaneously.
- **Image Compression**: All user photo uploads must be compressed via `compressImage` to stay safely within `localStorage` limits.

## 4. Release Bundle Naming & Version Tracking
- Whenever building Android release AAB bundles, always copy the bundle to Desktop with explicit versioning (e.g., `findlostpuppy-v{versionName}-code{versionCode}-release.aab`) alongside `findlostpuppy-release.aab` so every release is clearly tracked.

## Mandatory Responsive Mobile UI and Viewport Compatibility Rules

- Every screen must adapt automatically to the actual available viewport of the user’s device.
- Never design the UI for only one device, resolution, DPI, density, or aspect ratio.
- Support small phones, large phones, tall phones, wide phones, foldables, tablets, portrait mode, and landscape mode.
- Support different Android status-bar heights, navigation-bar heights, gesture navigation, three-button navigation, display cutouts, punch-hole cameras, display zoom, and font scaling.
- Never use fixed page widths or fixed page heights that can cause overflow.
- Do not assume physical screen resolution equals usable application viewport.
- Do not assume every Android device has the same DPI or logical dp size.
- Test responsive behavior at multiple viewport sizes, including the smallest supported mobile viewport.
- Test the iQOO Z10x 5G viewport and Android emulator viewports.
- Test portrait, landscape, keyboard-open, keyboard-closed, increased font size, and increased display scaling.
- Check every screen for horizontal overflow, clipped content, overlapping elements, incorrect vertical ordering, broken spacing, and controls outside their containers.
- Ensure text never renders outside cards, buttons, inputs, dialogs, modals, dropdowns, or pages.
- Test long pet names, breed names, village names, mandal names, district names, descriptions, error messages, and user-entered text.
- Use responsive Flexbox, CSS Grid, relative units, `clamp()`, `min()`, `max()`, `minmax()`, percentages, `rem`, `dvw`, `dvh`, `svh`, and `lvh` where appropriate.
- Use `box-sizing: border-box` globally.
- Use `min-width: 0` for flex and grid children where required.
- Use safe text wrapping with `overflow-wrap: anywhere` and `word-break: break-word` where appropriate.
- Do not hide important content merely to make the layout fit.
- Do not use arbitrary clipping as a workaround.
- Do not blindly add `overflow-x: hidden` without finding the real source of overflow.
- Do not use excessive negative margins or fragile absolute positioning.
- Ensure all pages can scroll vertically when content is taller than the viewport.
- Ensure normal usage never requires horizontal scrolling.
- Ensure fixed headers and bottom navigation never cover page content.
- Ensure keyboard-open layouts keep focused fields and action buttons visible.
- Ensure modals, popups, drawers, and dropdowns remain within the visible viewport and can scroll internally when necessary.
- Ensure images, videos, canvases, and SVGs never overflow their containers or become distorted.
- Ensure touch targets are sufficiently large and usable on mobile devices.
- Preserve all business logic, authentication, consent, legal, privacy, camera, location, moderation, reporting, and safety functionality.
- Do not change database schemas, RLS policies, authentication behavior, or storage behavior while fixing layout problems.
- Do not redesign unrelated parts of the application.
- Do not modify the `main` branch.
- Work on the `fixes` branch unless explicitly instructed otherwise.
- Do not commit, push, merge, or create a pull request without explicit approval.

Before changing any UI code, the AI agent must:

1. Inspect the current viewport configuration.
2. Inspect global styles and responsive breakpoints.
3. Search for fixed dimensions, unsafe absolute positioning, negative margins, and overflow rules.
4. Identify the likely root cause of each layout problem.
5. Explain the planned fix before implementation.

After changing UI code, the AI agent must:

1. Run lint.
2. Run TypeScript/type-check validation.
3. Run the production build.
4. Run the Android build where available.
5. Test multiple viewport sizes and orientations.
6. Test keyboard, modal, dropdown, camera, and location flows.
7. Confirm there is no unintended horizontal overflow.
8. Confirm no text, button, image, modal, or popup is outside its intended container.
9. Report all changed files, root causes, tests performed, and remaining risks.

Treat responsive behavior as a production requirement, not an optional visual enhancement. A screen that works on one device but overflows, overlaps, clips, or misaligns on another device is considered a defect and must be fixed before release.
