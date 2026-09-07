# FindLostPuppy 🐾

> **"Every paw deserves to find its way home."**  
> A compassionate, trustworthy, community-powered web platform to help lost dogs reunite with their loving families.

---

## 🐶 Overview

**FindLostPuppy** is a mobile-first web application designed for pet parents and neighborhood communities. When a pet goes missing, every second counts. FindLostPuppy provides a guided, two-chapter reporting process, protects private owner addresses with approximate public locations, enables neighbors to report visual sightings with photos, and offers real-time dashboards for pet owners to coordinate safe reunions.

---

## ✨ Features

- **🐾 2-Chapter Wizard**:
  - **Chapter 1 (Owner)**: Full name, phone, email, and administrative address with explicit location consent.
  - **Chapter 2 (Dog)**: Photos, breed, size, color, distinguishing marks, collar, microchip, and temperament.
  - **Chapter 3 (Lost Report)**: Last seen date/time, specific landmark, and safe contact preferences.
- **🔒 Location & Address Privacy Guarantee**:
  - Exact residential addresses and meter-accurate GPS coordinates are **strictly private**.
  - Public searchers only see safe approximate areas (e.g. `Near Benz Circle, Vijayawada` or `Near Bio-Diversity Park, Gachibowli, Hyderabad`).
- **👀 Community Sighting Pipeline**:
  - Community members can log sightings with date, time, landmark, observations, and photos.
  - Sighting alerts instantly populate the owner's dashboard.
- **📱 Mobile-First Responsive Design**:
  - Optimized for smartphone screens, tablets, and desktop displays with smooth touch targets and accessible navigation.
- **❤️ Joyful Reunions**:
  - One-click status updates (`LOST` ↔ `REUNITED`) with celebration animations.

---

## 🏛️ Architecture

FindLostPuppy is engineered using a modular client-side architecture with repository abstraction:

```
src/
├── components/          # Reusable UI components (Navbar, Footer, DogCard, StatusBadge, ImageUploader, LocationPicker, SightingModal, AuthModal)
├── context/             # React Contexts (AuthContext, ToastContext)
├── pages/               # Top-level views (HomePage, DiscoveryPage, DogDetailPage, ReportWizardPage, DashboardPage)
├── services/            # StorageService (IndexedDB/LocalStorage abstraction), AuthService, SeedData
├── types/               # Domain interfaces (User, OwnerProfile, DogProfile, LostReport, Sighting)
├── App.tsx              # Routing and top-level provider layout
├── index.css            # Design tokens, color palette, and utility styles
└── App.css              # Component styling and responsive media queries
```

See [docs/architecture.md](file:///Users/jayakrishna/Desktop/findlostpuppy/findlostpuppy/docs/architecture.md) for full details.

---

## 🛠️ Technology Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 8 (instant HMR and fast production bundles)
- **Styling**: Tailored Modern CSS Design System (warm cream, terracotta, and forest sage palette)
- **Routing**: React Router DOM 7 with base path support
- **Icons**: Lucide React
- **Micro-Animations**: Canvas Confetti

---

## 💻 Local Development

1. **Clone repository**:
   ```bash
   git clone https://github.com/jksurampudi5/findlostpuppy.git
   cd findlostpuppy
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local dev server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Contains base URL and extensible backend endpoints for future cloud migrations.

---

## 🛡️ Authentication

FindLostPuppy uses direct, privacy-safe **Email Authentication**:
- Single-field email entry with session persistence (`localStorage`)
- Remembers authenticated pet owners across refreshes and visits
- Protected linear progression: Email Sign In → Form 1 (Owner) → Form 2 (Pup) → Unlocked Community Dogs

---

## 🗄️ Database & Persistence

Currently runs on a modular `StorageService` using `localStorage` with rich seed data for Vijayawada, Hyderabad, Bengaluru, and Mumbai. Designed to easily switch to Supabase or Firebase without changing UI code. See [docs/database.md](file:///Users/jayakrishna/Desktop/findlostpuppy/findlostpuppy/docs/database.md).

---

## 🚀 Deployment & GitHub Pages

FindLostPuppy is configured for automated CI/CD deployment to **GitHub Pages**:
- **Workflow**: `.github/workflows/deploy.yml` triggers on pushes to `main`.
- **SPA Routing**: `public/404.html` and `index.html` preserve deep routes without 404 errors.
- **Production Base Path**: `/findlostpuppy/`
- See [docs/deployment.md](file:///Users/jayakrishna/Desktop/findlostpuppy/findlostpuppy/docs/deployment.md).

---

## 🔒 Security & Privacy

Detailed in [docs/security.md](file:///Users/jayakrishna/Desktop/findlostpuppy/findlostpuppy/docs/security.md):
- Zero hardcoded secrets in source code
- Safe separation of private residential data vs public approximate landmarks
- Client-side image validation (< 5MB, strict MIME check)
- Protected owner routes and authorization checks

---

## 🗺️ Future Roadmap

- Automated WhatsApp & SMS instant alerts for nearby volunteers
- QR Code Dog Tag generator for registered pet profiles
- AI-assisted puppy photo matching using visual embeddings
