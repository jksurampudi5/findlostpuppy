# Product Context: FindLostPuppy

## 1. Why This Product Exists
Every hour a pet is separated from its family drastically lowers the chance of recovery. FindLostPuppy bridges the gap between distressed owners and community bystanders through a privacy-preserving, lightning-fast reporting and discovery system.

## 2. User Personas & Core Journeys

### A. The Pet Parent (Owner)
1. **Onboarding:**
   - Authenticates via Google Sign-In.
   - First-time users without a completed profile see the Inauguration / Gratitude ceremony, followed by Owner Profile creation.
   - Selects geographic base: State → District → Mandal → Village.
   - Registers their pet: Form displays `Pet Registered` and auto-saves profile.
   - If they already registered a pet, choice reads `You already had a pet: <pet name>`.
2. **Daily Peace of Mind:**
   - Dashboard displays pet under "Pets at Home" with safe status.
   - Safe pet details dialog is read-only and visible only to the verified owner.
3. **Emergency Broadcast:**
   - If pet escapes, owner selects "Pet is Not Safe (Missing)".
   - Opens the emergency broadcast confirmation modal.
   - `LOST` status is committed only upon final form submission, triggering community alerts.

### B. The Pet-Free Good Samaritan / Volunteer
1. **Onboarding:**
   - Skips pet creation using prominent `Skip to Dashboard` button on Pet Details.
   - Instantly lands on Dashboard ready to assist in recovery.
2. **Quick Roaming Pet Capture:**
   - Spots a lost or unattended dog while commuting.
   - Taps `#dashboard-quick-capture-btn` in header or `#dashboard-floating-capture-fab`.
   - Snaps a photo; app records current GPS coordinates.
   - Report is automatically filed as `UNKNOWN_ROAMING_PET` under "Pets Missing" so searching owners can find it.
3. **Sighting Reports:**
   - Reports sightings of specific missing pets with photos and notes.
   - Grouped sightings behind `View sightings (n)` action on the pet card.

## 3. Core UX Philosophies
- **Zero Intrusive Popups:** App Suggestion / Rating widget never interrupts the first session automatically. It sits quietly as a clean button at the bottom of the Dashboard.
- **Single-Modal Rule:** Only one modal is ever visible at a time. Opening a detail modal conceals the category list modal; closing it restores the list modal at its exact previous scroll position.
- **Cascading Filter Clarity:** Dropdowns in missing pet discovery show green pet-present indicators (`🟢`) and pet counts without auto-selecting, keeping users in complete control.
