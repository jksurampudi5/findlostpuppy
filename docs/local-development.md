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

---

## 6. Next-Time Checklist: Localhost → fixes Branch → main → Android AAB

Use this checklist when you want to test changes locally, commit them to `fixes`, merge them to `main`, and generate the Play Console `.aab` file.

### A. Start Localhost

From the project root:

```bash
cd /Users/jayakrishna/Desktop/findlostpuppy/findlostpuppy
npm run dev
```

Open the URL Vite prints, usually:

```text
http://localhost:5173
```

If you want to replay the splash/onboarding from a clean browser state, open DevTools Console and run:

```js
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### B. Stop Localhost

If the terminal is still showing the Vite server, press:

```text
Ctrl + C
```

If the server is running in the background and you cannot find the terminal:

```bash
pkill -f "vite"
```

### C. Check Current Branch And Changes

```bash
git branch --show-current
git status --short
```

If you accidentally made changes on `main`, move the uncommitted changes to `fixes` before committing:

```bash
git switch fixes
```

Then verify the changes followed you:

```bash
git status --short
```

### D. Do Not Commit TokenCap Local Files

The `.tokencap/**` files are local generated intelligence/cache files. Unless we intentionally decide otherwise, do not include them in app commits.

Before staging, inspect:

```bash
git status --short
```

If `.tokencap/**` is modified, leave it unstaged.

### E. Verify Before Commit

Run the production build:

```bash
npm run build
```

Optional lint check:

```bash
npm run lint
```

### F. Stage App Changes On `fixes`

Stage only the real app/docs/assets changes. Example:

```bash
git add ADMIN_TRACKER.md \
  docs \
  index.html \
  public \
  scripts \
  src
```

Check staged files before committing:

```bash
git diff --cached --stat
git status --short
```

If `.tokencap/**` appears staged by mistake, unstage it:

```bash
git restore --staged .tokencap
```

### G. Commit And Push `fixes`

```bash
git commit -m "fix: align onboarding navigation flow and assets"
git push origin fixes
```

### H. Move `fixes` To `main`

After testing and approval, merge `fixes` into `main`:

```bash
git switch main
git pull origin main
git merge fixes
npm run build
git push origin main
```

Pushing to `main` triggers GitHub Actions deployment for GitHub Pages.

### I. Generate Android `.aab` For Play Console

Make sure `main` has the approved changes and the Android version code/name are correct. Then run:

```bash
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```

The generated AAB is usually here:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

Copy it to the Desktop release folder, for example:

```bash
mkdir -p /Users/jayakrishna/Desktop/2oct
cp android/app/build/outputs/bundle/release/app-release.aab \
  /Users/jayakrishna/Desktop/2oct/findlostpuppy-v1.0.4-code43-release.aab
```

Verify the file exists:

```bash
ls -lh /Users/jayakrishna/Desktop/2oct/findlostpuppy-v1.0.4-code43-release.aab
shasum -a 256 /Users/jayakrishna/Desktop/2oct/findlostpuppy-v1.0.4-code43-release.aab
```

### J. Play Console Release Info Template

Release name:

```text
1.0.4 (43)
```

Short release notes:

```text
Improved onboarding navigation, splash timing, privacy policy, and app asset cleanup for closed testing.
```


## 7. Current Manual QA Checklist — 2026-10-05

Use this after starting localhost and before building an AAB:

1. Refresh/root launch
   - Sign in.
   - Refresh `/` or open the app root.
   - Confirm splash finishes and the first component is Owner Details at `/owner`.

2. Shared setup headers
   - Check Owner Details, Location, Pet Registered/Pet Choice, Pet Details, and Pet Status/Pet Safety.
   - Confirm Back is left, title is centered, and Close is right.

3. Location permission flow
   - On Location, tap Detect Location.
   - Confirm the in-app `Allow Precise Location` sheet opens at the top without scrolling.
   - Tap Allow Precise Location and confirm Android/browser precise-location permission appears.
   - If device Location is off, enable it in quick settings/settings and tap Detect Again.

4. Pet Details responsive layout
   - At mobile width, confirm Breed, Age, Size, Color, and Collar/Tag cards wrap/stack and no value clips sideways.
   - Confirm `Skip to Dashboard` and `Remove Pet` share one row when space allows and stack on tiny screens.

5. Pet Safety and Dashboard return
   - Select Safe or submit Missing.
   - Confirm dashboard opens with all three cards neutral/closed.

6. Dashboard privacy and actions
   - Safe Pets cards must show image/name/breed/owner as allowed but never exact address/location.
   - Non-owner users must not open safe pet details.
   - Feedback and Play Store rating are separate buttons; feedback saves to admin suggestions, Play Store opens the listing URL.

7. Do not stage generated local cache
   - Leave `.tokencap/**` unstaged unless intentionally regenerating project intelligence.

### Android Location Settings Behavior — 2026-10-05

The app cannot silently turn on Android's master Location switch. Android requires the user to toggle it for privacy. The implemented flow is:

1. User taps **Detect Location**.
2. App shows the in-app **Allow Precise Location** sheet.
3. App requests native precise/coarse location permission.
4. If permission is denied, the app opens FindLostPuppy app settings so the user can enable permission.
5. If the phone's master Location/GPS switch is off in the installed app, Google Play Services shows an in-app **Location Services** resolution dialog.
6. The user turns Location on by consent in that native dialog. If the dialog is unavailable, the app falls back to Android Location settings. When the user returns to FindLostPuppy, detection retries automatically and fills State, District, Mandal, and Home Base when possible.

On localhost/browser this Android native dialog is not available, so Chrome permission behavior and manual selection remain the fallback. Test the native Location Services dialog on the Android build.
