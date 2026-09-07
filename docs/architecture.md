# Architecture — FindLostPuppy 🐾

## High-Level Architectural Overview

FindLostPuppy is designed as a modern, responsive, privacy-first web platform for reporting and identifying lost dogs and collecting community sightings.

```mermaid
graph TD
    A[Client: React 18 + Vite] --> B[React Router DOM SPA]
    B --> C[Pages & Views]
    C --> C1[HomePage]
    C --> C2[DiscoveryPage]
    C --> C3[DogDetailPage]
    C --> C4[ReportWizardPage - 3 Chapters]
    C --> C5[DashboardPage]
    
    C --> D[Domain State & Services]
    D --> D1[AuthService - Email / Phone OTP / Session]
    D --> D2[StorageService - LocalStorage / IndexedDB Adapter]
    D --> D3[Location Privacy Module - GPS & Approximate Area]
    
    D2 --> E[Future Cloud Backend: Supabase / Firebase / Cloud Run]
    
    F[CI/CD: GitHub Actions] --> G[Production Build: Vite]
    G --> H[GitHub Pages: jksurampudi5.github.io/findlostpuppy]
```

## Core Principles

1. **Privacy Boundaries**:
   - Private data (exact street address, house/flat number, exact GPS meter coordinates, private phone numbers) is strictly partitioned from public representations.
   - Public representations display approximate regions (e.g. `Near Benz Circle, Vijayawada` or `Near Bio-Diversity Park, Gachibowli, Hyderabad`).

2. **2-Chapter Separation**:
   - Chapter 1: Owner Profile & Base Location.
   - Chapter 2: Pup Profile, Characteristics & Photos.
   - Chapter 3: Disappearance Event & Contact Preferences.

3. **Offline-First & Extensibility**:
   - Built on a repository service abstraction (`storageService.ts`), allowing seamless substitution of local storage with Supabase, Firebase, or GraphQL backend APIs without modifying UI components.
