# System Patterns & Architecture: FindLostPuppy

## 1. High-Level Architecture
FindLostPuppy is structured as a client-first, cloud-synchronized mobile & web application.

```
+-----------------------------------------------------------+
|                   Presentation Layer                      |
|  React 18 + TypeScript + Vite + Vanilla CSS Design System  |
+-----------------------------------------------------------+
                             |
+-----------------------------------------------------------+
|                   Application Layer                       |
|   AuthContext, LocationContext, Modal Layering Manager     |
+-----------------------------------------------------------+
                             |
+-----------------------------------------------------------+
|                   Service / Data Layer                    |
| - storageService (Bounded Local Storage + Draft Queue)    |
| - firebaseSyncService (Firestore sync & listener)         |
| - locationService (AP/Telangana 4-tier geography)         |
| - dogPhotoHelper & compressImage (Photo pipeline)         |
+-----------------------------------------------------------+
         |                         |                    |
+-------------------+    +--------------------+  +---------------+
| Firebase Auth &   |    | Cloudinary         |  | Capacitor     |
| Cloud Firestore   |    | (Unsigned Public)  |  | Native APIs   |
+-------------------+    +--------------------+  +---------------+
```

## 2. Key Architectural Patterns

### A. Deny-by-Default Firestore Security
- **Owner-Only Isolation:** Private pet documents and `safe_reports` are readable ONLY by their authenticated owner or an administrator.
- **Sanitized Community Querying:** Signed-in community users can ONLY query sanitized `missing_reports` and sanitized `sightings`.
- **Field-Level Restrictions:** Creation and update rules enforce exact data types, timestamp bounds, and ownership IDs.

### B. Single-Modal Hierarchy
- Category card selection (`Sighted Missing Pets`, `Pets at Home`, `Pets Missing`) opens an internally scrollable list modal.
- When an item's detail dialog is opened (`Pet Details` or `Sighting Details`), the category list modal is immediately hidden (`activeCategoryModal = null`).
- When the detail dialog is closed, the category list modal is restored to `activeCategoryModal` at its previous scroll position.
- Multiple sightings for the same missing pet are consolidated behind `View sightings (n)` action, featuring numbered tabs (`Sighting 1`, `Sighting 2`, etc.).

### C. 4-Tier Cascading Administrative Division
- **Hierarchy:** State → District → Mandal/Municipality → Village/Locality.
- **Distinct Village Invariant:** Village/Home Base must contain the specific village or locality and must NEVER repeat the selected mandal. Village selectors filter out any option identical to the selected mandal.
- **Cascade Reset:** Changing a parent selection immediately clears all child fields (no auto-selection).
- **Green Pet-Present Indicator:** Dropdowns show `🟢` and count of missing pets present at that administrative tier without auto-selecting.

### D. Roaming Pet Capture System
- Triggered from Dashboard (`#dashboard-quick-capture-btn` & `#dashboard-floating-capture-fab`).
- Automatically tags reports with:
  - `petId: "UNKNOWN_ROAMING_PET"`
  - `name: "Unknown (Roaming Pet)"`
  - `status: "LOST"`
- Directly pushes to the "Pets Missing" repository for immediate community discovery.

### E. Security & Privacy Invariants
- **PII Masking:** Public owner phone (`+91 86••••••48`) and email (`j•••5@gmail.com`).
- **Location Masking:** Exact home coordinates, street names, and door numbers are never exposed publicly.
- **Android Backup Disabled:** `android:allowBackup="false"` in `AndroidManifest.xml`.
- **Photo Compression:** Every image runs through `compressImage` before local persistence or network upload.
- **Strict Indian Phone Validation:** `validateIndianPhoneNumber` (10 digits starting with 6, 7, 8, 9).
