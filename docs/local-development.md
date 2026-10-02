# Local Development Guide — FindLostPuppy 🐾

This guide provides step-by-step instructions for running, debugging, and testing FindLostPuppy locally on your machine.

---

## 1. Prerequisites

Ensure you have the following installed on your system:
- **Node.js**: v20 or v22+ (check via `node -v`)
- **npm**: v10+ (check via `npm -v`)
- **Git**: Working branch is `fixes` (check via `git branch`)

---

## 2. Initial Setup

1. **Navigate to the project root:**
   ```bash
   cd /Users/jayakrishna/Desktop/findlostpuppy/findlostpuppy
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file if `.env` does not already exist:
   ```bash
   cp .env.example .env
   ```
   *(For basic local testing, the application runs with default fallback values and mock/local storage).*

---

## 3. Starting the Localhost Dev Server

Run the development server via Vite:

```bash
npm run dev
```

### Accessing the App:
- **Local URL:** [http://localhost:5173](http://localhost:5173)
- Vite supports Instant Hot Module Replacement (HMR). Any changes made in `src/` will immediately reflect in your browser without restarting the server.

### Network / Mobile Testing on Same Wi-Fi:
To test the app directly on your phone or tablet on the same local network:
```bash
npm run dev -- --host
```
Vite will output your local IP (e.g., `http://192.168.1.X:5173`). Open that URL in your mobile browser.

---

## 4. Key Scripts & Commands

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run dev` | **Start Dev Server** | Launches Vite on `http://localhost:5173` with fast refresh |
| `npm run lint` | **Code Linting** | Runs `oxlint` across all files to catch errors instantly |
| `npm run build` | **Typecheck & Production Build** | Runs `tsc -b` and compiles optimized bundles to `dist/` |
| `npm run preview` | **Preview Build** | Locally serves the production `dist/` bundle to verify before deployment |
| `npm run build:android` | **Android Build** | Compiles assets specifically for Capacitor Android environment |
| `npm run sync:android` | **Sync Android Assets** | Copies web assets to Android native project (`android/`) |

---

## 5. Troubleshooting & Useful Tips

### Port `5173` Already in Use
If port 5173 is occupied, Vite will automatically select the next available port (e.g., `http://localhost:5174`).
To stop any lingering Vite processes:
```bash
pkill -f "vite"
```

### Resetting Local Onboarding State
If you want to re-test the onboarding flow from the start (Splash $\rightarrow$ Owner Profile $\rightarrow$ Location $\rightarrow$ Pet Choice $\rightarrow$ Pet Details):
1. Open Chrome DevTools (`Cmd + Option + I`).
2. Open the **Console** tab and run:
   ```js
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```
3. Alternatively, open an Incognito / Private window at `http://localhost:5173`.

### Typechecking & Pre-commit Verification
Before committing or submitting changes:
```bash
npm run lint && npm run build
```
Ensure both commands complete with **0 errors**.
