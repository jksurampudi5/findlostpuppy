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
- **Authentic Sonu Asset**:
  - Sonu (`#1788885000505`) must always resolve to the authentic photo (`/src/assets/sonu.jpg`) with the Indie white vertical forehead blaze and white chest patch.
- **Mutually Exclusive States**:
  - A pet is either `LOST` or `SAFE`—never both. "Safe at Home 🏡" immediately removes the pet from active missing searches.
- **Client-Side Compression**:
  - All image uploads must be compressed via `compressImage` to ~40KB JPEGs to protect browser `localStorage` quotas.
