# Technical Context: FindLostPuppy

## 1. Technologies & Dependencies

### Frontend Framework & Core Libraries
- **React 19 & React DOM 19**: Modern UI layer with React Hooks.
- **TypeScript 6.0**: Strict type safety. No `any` escapes.
- **Vite 8.2**: Fast module bundler and development server.
- **React Router DOM 7.18**: Route declarations and navigation.
- **GSAP 3.15 & Canvas Confetti**: Celebratory onboarding animations.
- **Lucide React**: Clean SVG icon system.

### Mobile & Android Runtime
- **Capacitor 6 / @capacitor/core 8.5**: Bridge between web application and Android native WebView.
- **Android Target SDK 34/35**: Built with Gradle 8.7+ and AGP 8.3+.
- **Native Splash Screen**: Configured with a dark background and transparent icon. Static splash images are prohibited before the React animation.
- **Native Plugins**:
  - `@capacitor/camera`: Camera and gallery photo selection.
  - `@capacitor/geolocation`: High-accuracy device GPS tracking.
  - `@capacitor-firebase/authentication`: Native Google Sign-In.
  - `@capgo/capacitor-nativegeocoder`: Native geocoding utilities.

### Backend, Database & Cloud Connectors
- **Firebase Authentication**: Google OAuth provider.
- **Cloud Firestore 12.19**: NoSQL collection store with strict deny-by-default rules.
- **Cloudinary 2.11**: Unsigned client-side uploads restricted to sanitized public alert photos.
- **Firebase Storage**: Private owner profile and pet photos.

## 2. Development Setup & Port Management
- **Local Dev Server:** Runs on `http://localhost:5173`.
  ```bash
  npm run dev
  ```
- **Port Release:**
  ```bash
  kill -9 $(lsof -ti:5173) 2>/dev/null || pkill -f "vite"
  ```

## 3. Build & Release Pipelines
- **Pre-Release Verification Sequence:**
  ```bash
  npm run lint                    # Oxlint static check (0 errors required)
  npm run build                   # TypeScript compilation & Vite bundle
  npm run sync:android            # Capacitor copy to Android assets
  npm run build:android           # Gradle release AAB build
  node scripts/test_responsive.mjs # Responsive verification (320px, 390px, 768px, 1024px)
  ```
- **Release Artifact Naming Convention:**
  When generating an Android release AAB, copy to Desktop as both:
  - `/Users/jayakrishna/Desktop/findlostpuppy-release.aab`
  - `/Users/jayakrishna/Desktop/findlostpuppy-v{versionName}-code{versionCode}-release.aab`

## 4. MCP Server Integrations
Configured in `~/.gemini/config/mcp_config.json`:
- **`playwright`**: Browser automation via `@executeautomation/playwright-mcp-server` (35 active tools).
- **`puppeteer`**: Direct headless browser control via `@modelcontextprotocol/server-puppeteer`.
- **`sequential-thinking`**: Systematic structured reasoning via `@modelcontextprotocol/server-sequential-thinking`.
