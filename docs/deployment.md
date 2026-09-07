# Deployment Guide — GitHub Pages CI/CD

## GitHub Pages Setup

FindLostPuppy is configured for automatic build and deployment to **GitHub Pages** whenever code is merged to `main`.

### Repository Details
* **Repository**: `jksurampudi5/findlostpuppy`
* **Target URL**: `https://jksurampudi5.github.io/findlostpuppy/`
* **Base Path**: `/findlostpuppy/`

### Automatic Workflow
The file `.github/workflows/deploy.yml` runs on every push to `main`:
1. Checks out repository
2. Sets up Node.js 22 with npm cache
3. Runs `npm ci`
4. Runs `npm run build` (invokes `tsc -b && vite build` with base `/findlostpuppy/`)
5. Packages `./dist` artifact
6. Deploys directly to GitHub Pages environment using GitHub's native Actions deployment

### SPA Routing & Deep Link Support
To prevent 404 errors when reloading deep URLs (e.g. `/findlostpuppy/dog/LOST-BRUNO-881`):
* `public/404.html` captures non-root paths and redirects with query parameters.
* `index.html` extracts the query parameters and restores the original path using `window.history.replaceState` before React Router initializes.

### GitHub Repository Settings
In GitHub Repository Settings -> **Pages**:
* **Source**: GitHub Actions
