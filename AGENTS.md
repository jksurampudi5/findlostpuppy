# Repository Instructions & Deployment Workflow

## 1. Local-First Testing Invariant
- Always test and verify changes in **`localhost:5173`** and run automated test scripts before pushing.
- Always run `npm run build` (`tsc -b && vite build`) to ensure 0 compile/type errors.

## 2. Mandatory Branch & PR Workflow
- **Working Branch**: Always commit and push directly to the **`fixes`** branch (`origin fixes`).
- **Never push directly to `main`**: All changes are tested on `fixes` first.
- **PR & Merge**: Raise a Pull Request from `fixes` to `main`, and then merge into `main`.

## 3. Privacy & Validation Standards
- **Owner Privacy Masking**: Public dashboard listings must always mask phone (`+91 86••••••48`) and email (`j•••5@gmail.com`).
- **10-Digit Indian Phone Numbers**: All phone fields must validate strictly as 10-digit Indian numbers starting with `6`, `7`, `8`, or `9` (`validateIndianPhoneNumber`).
- **Sonu Photo Preservation**: Dog Sonu (`#1788885000505`) must always resolve to `/src/assets/sonu.jpg`.
- **LOST vs SAFE Mutual Exclusivity**: A pet cannot be in both states simultaneously.
- **Image Compression**: All user photo uploads must be compressed via `compressImage` to stay safely within `localStorage` limits.
