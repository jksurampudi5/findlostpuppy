# Active Context: FindLostPuppy

## 1. Current Branch & Git State
- **Branch:** `fixes` (All development work is strictly confined to `fixes`).
- **Working Tree:** Uncommitted changes are actively tracking recent UX, security, and verification enhancements.
- **Port:** Local server is active on `http://localhost:5173`.

## 2. Recent Architectural Enhancements & Key Changes

### A. Quick Roaming Pet Capture System
- Added header quick capture button (`#dashboard-quick-capture-btn`) and floating action button (`#dashboard-floating-capture-fab`) on the Dashboard.
- When clicked, immediately takes a photo, captures device geolocation, and publishes directly as `UNKNOWN_ROAMING_PET` under "Pets Missing".
- Enables commuters to log unattended roaming pets without requiring ownership registration.

### B. Cascading Location Filter Bar in "Pets Missing"
- Added interactive 4-tier dropdown filter (State → District → Mandal → Village) at the top of the "Pets Missing" modal.
- Includes green pet-present indicators (`🟢`) with real-time pet counts.
- Cascading resets ensure children clear when parents change, avoiding invalid combinations.

### C. Dog Onboarding Input Bar & Placeholder Fixes
- In `src/pages/DogOnboardingPage.tsx`:
  - Replaced glowing white default style with standard `.placeholder` class text for **Gender** (`"Select Gender"`), **Size Category** (`"Select size"`), and **Collar/Tag/Microchip** (`"Select Collar, Tag or Microchip"`).
  - Added search inputs/buttons to modal pickers (`searchable={true}`).
  - Hard reset properly clears all three fields to empty (`''`).

### D. App Suggestion & Feedback Widget Redesign
- Removed automatic intrusive popup on first dashboard arrival.
- Added clean footer access button on the Dashboard.
- Simplified modal layout:
  - Header: App Rating & Feedback
  - 5-Star interactive rating selector
  - Textarea for comments
  - Centered submit button

### E. MCP & Tooling Upgrades
- Added `playwright`, `puppeteer`, and `sequential-thinking` servers to `~/.gemini/config/mcp_config.json`.
- Verified live execution of `playwright_navigate`, `playwright_screenshot`, and `playwright_close`.
- Initialized comprehensive in-repo Memory Bank.

## 3. Next Steps & Active Considerations
- Support Playwright / Puppeteer automated regression suites for newly created roaming pet and filter flows.
- Verify responsive layouts across all mobile viewports when adding new UI modules.
- Ensure Firestore rules and PII protections remain impenetrable.
