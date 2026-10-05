import puppeteer from 'puppeteer-core';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FindLostPuppy - Complete Technical Context & Architecture Dossier</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.55;
      font-size: 13px;
      -webkit-font-smoothing: antialiased;
    }

    .cover-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 90vh;
      padding: 40px 20px;
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge-primary {
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
    }

    .badge-danger {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .badge-success {
      background: #f0fdf4;
      color: #16a34a;
      border: 1px solid #bbf7d0;
    }

    .cover-title {
      font-size: 32px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      margin-top: 20px;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }

    .cover-subtitle {
      font-size: 16px;
      color: #475569;
      line-height: 1.5;
      margin-bottom: 30px;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 30px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }

    .meta-value {
      font-size: 12px;
      font-weight: 500;
      color: #0f172a;
    }

    .page-break {
      page-break-after: always;
    }

    h1 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 24px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #e2e8f0;
      letter-spacing: -0.01em;
    }

    h2 {
      font-size: 15px;
      font-weight: 700;
      color: #1e293b;
      margin-top: 18px;
      margin-bottom: 8px;
    }

    h3 {
      font-size: 13px;
      font-weight: 600;
      color: #334155;
      margin-top: 12px;
      margin-bottom: 4px;
    }

    p {
      margin-bottom: 10px;
      color: #334155;
    }

    ul, ol {
      margin-left: 18px;
      margin-bottom: 12px;
    }

    li {
      margin-bottom: 4px;
      color: #334155;
    }

    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5px;
      background: #f1f5f9;
      padding: 2px 5px;
      border-radius: 4px;
      color: #0f172a;
      border: 1px solid #e2e8f0;
    }

    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 12px;
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      line-height: 1.45;
      margin-bottom: 14px;
      overflow-x: auto;
      border: 1px solid #1e293b;
    }

    pre code {
      background: transparent;
      padding: 0;
      color: inherit;
      border: none;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 11.5px;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 600;
    }

    tr:nth-child(even) {
      background: #f8fafc;
    }

    .callout {
      border-left: 4px solid #3b82f6;
      background: #eff6ff;
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 14px;
    }

    .callout-warning {
      border-left-color: #f59e0b;
      background: #fffbeb;
    }

    .callout-danger {
      border-left-color: #ef4444;
      background: #fef2f2;
    }

    .callout-title {
      font-weight: 700;
      font-size: 12px;
      margin-bottom: 4px;
    }

    .toc {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 24px;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 12px;
    }

    .toc-item a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }

    .tag {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      margin-right: 4px;
    }

    .tag-blue { background: #dbeafe; color: #1e40af; }
    .tag-amber { background: #fef3c7; color: #92400e; }
    .tag-emerald { background: #d1fae5; color: #065f46; }
    .tag-purple { background: #f3e8ff; color: #6b21a8; }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div>
      <span class="badge badge-primary">Technical Dossier & Architectural Context</span>
      <h1 class="cover-title">FindLostPuppy</h1>
      <p class="cover-subtitle">Complete Architecture, Connectors, Security Invariants, Navigation Workflows, and Engineering Guidelines for Claude / AI Assistants.</p>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Application Name</span>
        <span class="meta-value">FindLostPuppy (Pet Emergency Network)</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Primary Stack</span>
        <span class="meta-value">React 18 + TypeScript + Vite + Capacitor 6 (Android)</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Backend & Storage</span>
        <span class="meta-value">Firebase Auth, Firestore, Firebase Storage, Cloudinary</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Target Platforms</span>
        <span class="meta-value">Android (APK/AAB, Target SDK 34/35) & Progressive Web App</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Git Branch Rule</span>
        <span class="meta-value">Local <code>fixes</code> branch only (Never direct to <code>main</code>)</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Target Launch Geography</span>
        <span class="meta-value">India (Andhra Pradesh, Telangana, Nationwide)</span>
      </div>
    </div>

    <div class="callout callout-warning">
      <div class="callout-title">Document Purpose</div>
      <p>This technical briefing is prepared as a definitive ground truth specification for LLM code generation (Claude, Gemini, GPT), engineering audits, and security compliance. Every rule, connector, and UX invariant documented herein is enforced in production.</p>
    </div>
  </div>

  <!-- TABLE OF CONTENTS -->
  <h1>Table of Contents</h1>
  <div class="toc">
    <div class="toc-item"><span>1. Mission & System Overview</span><span>Page 2</span></div>
    <div class="toc-item"><span>2. Technology Stack & Connectors</span><span>Page 2</span></div>
    <div class="toc-item"><span>3. Security, Privacy & Compliance Invariants</span><span>Page 3</span></div>
    <div class="toc-item"><span>4. Component Hierarchy & Visual Flow</span><span>Page 4</span></div>
    <div class="toc-item"><span>5. Location Hierarchy & Geocoding Rules</span><span>Page 5</span></div>
    <div class="toc-item"><span>6. Dashboard Pet Categories & Modal Rules</span><span>Page 6</span></div>
    <div class="toc-item"><span>7. Emergency Alert & Roaming Pet Capture System</span><span>Page 7</span></div>
    <div class="toc-item"><span>8. Developer & Release Engineering Cheat Sheet</span><span>Page 8</span></div>
    <div class="toc-item"><span>9. Prompt Template for Claude AI Context</span><span>Page 9</span></div>
  </div>

  <!-- SECTION 1: MISSION & SYSTEM OVERVIEW -->
  <h1>1. Mission & System Overview</h1>
  <p><strong>FindLostPuppy</strong> is a mission-critical, community-driven emergency pet recovery and tracking application. Built specifically for Indian pet parents and animal rescue volunteers, the platform bridges the gap between pet loss and community sighting reports.</p>
  <p>The core ethos combines strict <strong>zero-leak personal privacy</strong> (masking owner PII and home coordinates) with <strong>instant crowd-sourced reporting</strong> (photo capture, auto-geocoding, and filtered sighting feeds).</p>

  <!-- SECTION 2: TECH STACK & CONNECTORS -->
  <h1>2. Technology Stack & Connectors</h1>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Layer / Connector</th>
        <th style="width: 35%;">Technologies & Libraries</th>
        <th style="width: 40%;">Role & Architecture Boundaries</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Frontend Core</strong></td>
        <td>React 18, TypeScript, Vite, Vanilla CSS / CSS Modules</td>
        <td>SPA architecture. No heavy component libraries or TailwindCSS (pure custom CSS design system). Ultra-responsive (320px to 1024px+).</td>
      </tr>
      <tr>
        <td><strong>Mobile Runtime</strong></td>
        <td>Capacitor 6, Android Native (Gradle 8.7+, AGP 8.3+)</td>
        <td>Wraps web app in Android WebView. Native dark splash with transparent icon. Backup disabled (<code>allowBackup="false"</code>).</td>
      </tr>
      <tr>
        <td><strong>Authentication</strong></td>
        <td>Firebase Authentication (Google Sign-In)</td>
        <td>Google OAuth sign-in flow. Synthetic fallback for testing. Retains active session in local storage.</td>
      </tr>
      <tr>
        <td><strong>Database</strong></td>
        <td>Google Cloud Firestore</td>
        <td>Collections: <code>pets</code>, <code>sightings</code>, <code>missing_reports</code>, <code>safe_reports</code>, <code>owner_profiles</code>, <code>user_feedback</code>. Deny-by-default rules.</td>
      </tr>
      <tr>
        <td><strong>Public Media</strong></td>
        <td>Cloudinary REST API (Unsigned preset)</td>
        <td>Only used for public missing-pet photos and sighting uploads under sanitized folder. Pre-compressed before upload via <code>compressImage</code>.</td>
      </tr>
      <tr>
        <td><strong>Private Media</strong></td>
        <td>Firebase Storage</td>
        <td>Private profile and pet documents. Restricted strictly to owner/admin. No public read access.</td>
      </tr>
      <tr>
        <td><strong>Location & Geocoding</strong></td>
        <td>W3C Geolocation API, OpenStreetMap / Local Census</td>
        <td>Cascade: State &rarr; District &rarr; Mandal/Municipality &rarr; Village/Locality. AP/Telangana administrative division matching.</td>
      </tr>
      <tr>
        <td><strong>Native Plugins</strong></td>
        <td><code>@capacitor/camera</code>, <code>@capacitor/geolocation</code>, <code>@capacitor/app</code></td>
        <td>Camera capture with gallery fallback; high-accuracy GPS with timeout protection; native Android back button handling.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 3: SECURITY & PRIVACY INVARIANTS -->
  <div class="page-break"></div>
  <h1>3. Security, Privacy & Compliance Invariants</h1>
  <div class="callout callout-danger">
    <div class="callout-title">CRITICAL SECURITY INVARIANTS (NON-NEGOTIABLE)</div>
    <p>These invariants are hard-coded into the repository instructions, Firestore security rules, and linting suites. Violating any of these breaks compliance and will block releases.</p>
  </div>

  <ul>
    <li><strong>Zero-Leak PII Masking:</strong> Public owner contact details must ALWAYS remain masked. For example:
      <br/>&bull; Phone: <code>+91 86••••••48</code>
      <br/>&bull; Email: <code>j•••5@gmail.com</code>
    </li>
    <li><strong>No Exact Home GPS or Street Addresses:</strong> Exact home coordinates, street names, and door numbers must NEVER be exposed publicly. Public sightings and alerts only display State, District, Mandal, and Village/Locality.</li>
    <li><strong>Firestore Deny-by-Default:</strong>
      <br/>&bull; <code>pets</code> and <code>safe_reports</code>: Readable ONLY by their authenticated owner or an administrator.
      <br/>&bull; Signed-in community users can ONLY query sanitized <code>missing_reports</code> and sanitized <code>sightings</code>.
    </li>
    <li><strong>Unsigned Cloudinary Constraints:</strong> Unsigned uploads are strictly limited to public missing-pet and sighting images under configured public folders. Profile pictures and private pet media must NEVER use unsigned Cloudinary presets. Cloudinary API secrets must never be bundled into client code.</li>
    <li><strong>Android Backup Disabled:</strong> In <code>AndroidManifest.xml</code>, <code>android:allowBackup="false"</code> is strictly enforced because local WebView storage contains authenticated profile and pet data.</li>
    <li><strong>Strict Indian Phone Validation:</strong> Phone inputs must pass <code>validateIndianPhoneNumber</code>: exactly 10 digits beginning with 6, 7, 8, or 9.</li>
    <li><strong>Client-Side Photo Compression:</strong> Every photo must be compressed through <code>compressImage</code> prior to local persistence or network upload to avoid memory exhaustion and bandwidth bloat.</li>
    <li><strong>State Mutual Exclusivity:</strong> A pet can NEVER be <code>LOST</code> and <code>SAFE</code> simultaneously. Selecting "Pet is Not Safe (Missing)" triggers the emergency broadcast modal; the <code>LOST</code> state is only committed after successful form submission.</li>
  </ul>

  <!-- SECTION 4: COMPONENT HIERARCHY & VISUAL FLOW -->
  <h1>4. Component Hierarchy & Navigation Flow</h1>
  <p>The application follows a strictly defined, linear onboarding flow for new users, with fast-track bypasses for returning users.</p>

  <pre><code>[App Launch]
    &darr;
[Animated Native / React Splash] (Dark background, transparent icon)
    &darr;
[Authentication / Login Page] (Google Sign-In)
    &darr;
&lt;Is First-Time User without Completed Profile?&gt;
    &boxvr;&mdash; YES &rarr; [Inauguration &amp; Gratitude Presentation] &rarr; [Owner Profile Form]
    &boxur;&mdash; NO  &rarr; [Dashboard Page] (Inauguration available via footer)
                       &uarr;
                 [Location Selector] (State &rarr; District &rarr; Mandal &rarr; Village)
                       &darr;
                 [Pet Choice / Details Page]
                       &boxvr;&mdash; Existing Pet &rarr; "You already had a pet: &lt;pet name&gt;"
                       &boxvr;&mdash; New Pet      &rarr; "Pet Registered" (Fill Form)
                       &boxur;&mdash; No Pet       &rarr; "Skip to Dashboard" &rarr; [Dashboard Page]</code></pre>

  <h3>Key Component Rules</h3>
  <ul>
    <li><strong>Owner Profile:</strong> Saved Owner Details rows are read-only and show no inline orange pencil edit icons. <code>Modify Details / Photo</code> is the sole entry point for editing.</li>
    <li><strong>Pet Choice / Onboarding:</strong> Heading displays <code>Pet Registered</code> when a pet exists. Existing pet choice reads <code>You already had a pet: &lt;pet name&gt;</code>. Deletion control has exactly one control: top <code>Remove Pet</code> button.</li>
    <li><strong>Skip Action:</strong> <code>Skip to Dashboard</code> action is prominently available on Pet Details to ensure users without pets can browse missing pets immediately.</li>
  </ul>

  <!-- SECTION 5: LOCATION HIERARCHY -->
  <div class="page-break"></div>
  <h1>5. Location Hierarchy & Geocoding Rules</h1>
  <p>FindLostPuppy enforces a 4-tier geographic administrative division aligned with the Indian administrative structure (specifically optimized for Andhra Pradesh and Telangana):</p>

  <table>
    <thead>
      <tr>
        <th>Level</th>
        <th>Field Name</th>
        <th>Validation & Logic Invariants</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td><strong>State</strong></td>
        <td>Top-level selection (e.g., Andhra Pradesh, Telangana). Changing State clears District, Mandal, and Village.</td>
      </tr>
      <tr>
        <td>2</td>
        <td><strong>District</strong></td>
        <td>Dependent on State. Changing District clears Mandal and Village.</td>
      </tr>
      <tr>
        <td>3</td>
        <td><strong>Mandal / Municipality</strong></td>
        <td>Sub-district administrative unit. Distinct from Village/Locality.</td>
      </tr>
      <tr>
        <td>4</td>
        <td><strong>Village / Home Base</strong></td>
        <td><strong>Strict Distinct Village Invariant:</strong> Village/Home Base should contain the specific village or locality and should not repeat the selected mandal when a distinct locality is available. Autodetect fills Home Base from the matched locality; if the geocoder cannot resolve an exact locality, it uses the matched mandal's locality list so all four cards are filled and editable.</td>
      </tr>
    </tbody>
  </table>

  <h3>Capture Pet Location Independence</h3>
  <ul>
    <li><strong>Initial State:</strong> The "Capture Pet" page initializes State, District, Mandal, and Village as blank, even if the logged-in owner profile already has a saved home address.</li>
    <li><strong>Cascading Filters:</strong> Changing any parent filter immediately resets all child fields. Auto-selection is forbidden.</li>
    <li><strong>Pet Presence Indicator:</strong> Filter dropdowns retain a green dot indicator (<code>🟢</code>) showing the count of missing pets present at that administrative tier without auto-selecting those values.</li>
  </ul>

  <!-- SECTION 6: DASHBOARD PET CATEGORIES & MODAL RULES -->
  <h1>6. Dashboard Pet Categories & Modal Rules</h1>
  <p>The main Dashboard revolves around three primary category cards:</p>
  <ul>
    <li><span class="tag tag-purple">Sightings</span> Crowd-sourced sightings reported by good samaritans with photos and locations.</li>
    <li><span class="tag tag-emerald">Safe Pets</span> Verified safe pets registered to their owners; public cards avoid address disclosure.</li>
    <li><span class="tag tag-amber">Missing Pets</span> Pets broadcasted as missing/lost, awaiting community recovery.</li>
  </ul>

  <h3>Dashboard Modal Invariants</h3>
  <ul>
    <li><strong>Bounded Internally Scrollable Modals:</strong> Selecting a category card opens a bounded, internally scrollable list modal. It NEVER appends long list elements directly beneath the cards on the main page.</li>
    <li><strong>Strict Single-Modal Rule:</strong> Only one modal is permitted on screen at any time. Opening a pet detail or sighting detail modal immediately conceals the underlying category list modal.</li>
    <li><strong>Context Restoration:</strong> Closing a detail modal immediately restores the previously active category list modal at its exact scroll context.</li>
    <li><strong>Grouped Sightings:</strong> Multiple sightings for the same missing pet are consolidated behind a single <code>View sightings (n)</code> action. Sighting detail dialog displays numbered tabs (<code>Sighting 1</code>, <code>Sighting 2</code>, etc.).</li>
    <li><strong>Owner Privacy on Safe Pets:</strong> Safe-pet <code>View Details</code> is available ONLY to the signed-in owner. Other users cannot view safe pet profiles. Safe-pet dialogs are read-only and never show "Mark Missing" or "Edit" buttons.</li>
  </ul>

  <!-- SECTION 7: ROAMING PET & EMERGENCY CAPTURE -->
  <div class="page-break"></div>
  <h1>7. Emergency Alert & Roaming Pet Capture System</h1>

  <h3>1. Quick Roaming Pet Capture (On Dashboard)</h3>
  <p>To empower travelers and commuters who spot an unattended or lost dog on the road, a quick capture mechanism is embedded directly in the Dashboard:</p>
  <ul>
    <li><strong>Triggers:</strong> Header action button <code>#dashboard-quick-capture-btn</code> and Floating Action Button (FAB) <code>#dashboard-floating-capture-fab</code>.</li>
    <li><strong>Instant Geolocation & Camera:</strong> User snaps a photo, and the app captures current GPS coordinates.</li>
    <li><strong>Automatic "Unknown (Roaming Pet)" Designation:</strong> Because the pet owner is unknown, the system assigns:
      <br/>&bull; Pet ID: <code>UNKNOWN_ROAMING_PET</code>
      <br/>&bull; Pet Name: <code>"Unknown (Roaming Pet)"</code>
      <br/>&bull; Status: <code>LOST</code>
    </li>
    <li><strong>Immediate Community Discovery:</strong> The sighting is instantly submitted to the "Missing Pets" repository so an owner searching for their lost dog can view recent roaming sightings with photos and map locations.</li>
  </ul>

  <h3>2. Cascading Location Filter Bar</h3>
  <p>Inside the "Missing Pets" modal, a 4-tier dropdown filter (State &rarr; District &rarr; Mandal &rarr; Village) allows owners to instantly filter through hundreds of lost and roaming reports to locate pets near their specific neighborhood.</p>

  <h3>3. App Suggestion & Feedback Widget Modal</h3>
  <p>To avoid annoying users during their first session, the feedback popup is never shown automatically on first dashboard load. Instead, it is accessible via a dedicated button at the bottom of the dashboard. The modal features a clean, distraction-free layout:
    <br/>&bull; Header: App Rating &amp; Feedback
    <br/>&bull; Interactive 5-star rating selector
    <br/>&bull; Feedback comment textarea
    <br/>&bull; Centered Submit button
  </p>

  <!-- SECTION 8: DEVELOPER & RELEASE CHEAT SHEET -->
  <h1>8. Developer & Release Engineering Cheat Sheet</h1>

  <h3>Local Development & Port Control</h3>
  <pre><code># Start local development server (Port 5173)
npm run dev

# Stop local development server
kill -9 $(lsof -ti:5173) 2&gt;/dev/null || pkill -f "vite"</code></pre>

  <h3>Mandatory Pre-Release Verification Pipeline</h3>
  <p>Before any release, commit, or pull request, run the following verification chain:</p>
  <pre><code># 1. Run ESLint (must have 0 errors)
npm run lint

# 2. Compile TypeScript & Vite production bundle
npm run build

# 3. Synchronize Web bundle into Android Capacitor
npm run sync:android

# 4. Build Android Release AAB / APK
npm run build:android

# 5. Run Responsive Verification Suite (320px, 390px, 768px, 1024px)
node scripts/test_responsive.mjs</code></pre>

  <h3>Android Release Artifact Requirements</h3>
  <p>When generating an Android release bundle (AAB), copy the file from the Gradle output directory to <code>/Users/jayakrishna/Desktop/</code> under both standardized filenames:</p>
  <ul>
    <li><code>/Users/jayakrishna/Desktop/findlostpuppy-release.aab</code></li>
    <li><code>/Users/jayakrishna/Desktop/findlostpuppy-v{versionName}-code{versionCode}-release.aab</code> (e.g. <code>findlostpuppy-v1.0.4-code43-release.aab</code>)</li>
  </ul>

  <!-- SECTION 9: CLAUDE AI PROMPT TEMPLATE -->
  <div class="page-break"></div>
  <h1>9. Prompt Template for Claude AI Context</h1>
  <p>Copy and paste the block below into Claude or any AI coding assistant to immediately give it full context of the FindLostPuppy codebase:</p>

  <pre><code>You are an expert full-stack engineer pair-programming on the FindLostPuppy project.
Here is the authoritative system context and non-negotiable invariants:

1. REPOSITORY &amp; WORKFLOW RULES:
- Always work locally on the 'fixes' branch. Never commit or push directly to 'main'.
- Never modify production without user approval.
- Local dev server runs on http://localhost:5173.
- After any UI edit, run: npm run lint, npm run build, npm run sync:android, and node scripts/test_responsive.mjs.
- Ensure layouts work flawlessly from 320px, 390px, to 1024px+ viewports without horizontal scroll.

2. SECURITY &amp; PRIVACY:
- Strict PII masking: Mask owner phone numbers (+91 86••••••48) and emails (j•••5@gmail.com).
- Never expose exact home GPS coordinates or street addresses in public listings.
- Firestore is deny-by-default. Private pet docs and SAFE reports are owner/admin only. Community users read only sanitized LOST reports and sightings.
- Unsigned Cloudinary is restricted to sanitized public missing-report photos. Private photos use Firebase Storage.
- Android backup is disabled (android:allowBackup="false").
- Indian phone number validation: exactly 10 digits beginning with 6, 7, 8, or 9.
- Always compress photos via compressImage before saving or uploading.

3. LOCATION INVARIANTS:
- 4 tiers: State &rarr; District &rarr; Mandal/Municipality &rarr; Village/Locality.
- Village must be distinct from Mandal (never duplicate the mandal name).
- Capture Pet page always initializes with blank location selectors.
- Cascading dropdowns: changing a parent clears all child fields (no auto-selection).
- Dropdowns retain green pet-present indicators (🟢) showing counts.

4. NAVIGATION &amp; DASHBOARD:
- Onboarding order: Auth &rarr; Inauguration (first-time only) &rarr; Owner Profile &rarr; Location &rarr; Pet Choice/Details &rarr; Dashboard.
- Dashboard has 3 category cards: 'Sightings', 'Safe Pets', 'Missing Pets'.
- Selecting a card opens an internally scrollable modal. Single-modal visibility rule: opening a detail modal hides the category modal; closing it restores the category modal.
- Sighted reports for the same pet are grouped behind 'View sightings (n)' with numbered tabs (Sighting 1, 2...).
- Quick capture on Dashboard logs roaming pets as 'Unknown (Roaming Pet)' with ID UNKNOWN_ROAMING_PET directly into 'Missing Pets'.</code></pre>

  <div style="margin-top: 30px; text-align: center; color: #94a3b8; font-size: 11px;">
    FindLostPuppy System Specification Dossier &bull; Generated locally &bull; Verified for production & release standards
  </div>

</body>
</html>
`;

async function generatePdf() {
  const outputPath = '/Users/jayakrishna/Desktop/app-context.pdf';
  console.log('Launching headless Chrome to render PDF...');
  
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  console.log('Printing to PDF...');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '12mm',
      right: '12mm'
    }
  });

  await browser.close();
  console.log(`✅ PDF successfully generated at: ${outputPath}`);
}

generatePdf().catch(err => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
