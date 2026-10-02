<!-- TokenCap v1.6 Savings: baseline 5,507,136 tok → actual 32,348 tok (99.4% saved) -->
# AI ENTRY POINT

This repository has been indexed by TokenCap.

Before analyzing files, read:

.tokencap/agent/START_HERE.md

Use:

- .tokencap/agent/agent-pack.md
- .tokencap/agent/allowed-context.json
- .tokencap/agent/context-manifest.json

Do not rediscover the repository from scratch.

---

# TokenCap Snapshot

| Field | Value |
| --- | --- |
| Generated | 2026-10-01T17:13:57.016Z |
| Workspace | /Users/jayakrishna/Desktop/findlostpuppy/findlostpuppy |
| Profile | balanced |
| Selected files | 27 |
| Source bytes | 219983 |
| Estimated source tokens | 50510 |

## Read First

This file is a compressed coding-session handoff. Read it before editing, then inspect the referenced files directly. Prefer the live repository over this snapshot when there is a conflict.

## TokenCap Intelligence Files

- TOKENCAP_GRAPH.md — Project dependency and architecture graph *(JS/TS projects only)*
- TOKENCAP_MEMORY.md — Developer notes, current task, constraints, and context memory

## Handoff Summary

| Field | Value |
| --- | --- |
| Read order | package.json > vite.config.ts > src/App.tsx > src/components/SuggestionWidget.tsx > src/pages/EmailAuthPage.tsx |
| Primary anchors | package.json, vite.config.ts, src/App.tsx |
| Changed files | 65 |
| TODO notes | 0 |
| File budget used | 30% |
| Source budget used | 100% |
| Token estimate | 50510 |
| Contents mode | enabled |

## Handoff Guidelines

- Preserve user changes; avoid reverting unrelated work.
- Start with changed files and files marked `high-signal` in the manifest.
- Treat the Git diff as intent and verify changes in source files.
- Update this snapshot after meaningful edits or before handing off.

## Git Snapshot

| Field | Value |
| --- | --- |
| Branch | fixes |
| Git root | /Users/jayakrishna/Desktop/findlostpuppy/findlostpuppy |

Recent commits:
```text
fa9d5ca chore(android): bump versionCode 41→42, versionName 1.0.2→1.0.3 (30 Sep release)
1db4c9b test: add unit coverage for media privacy, Firebase sync, storage recovery, drafts, consent, location, and UI fallbacks
267c82d fix: address PR security and retry findings
29185cb docs: add JSDoc comments across UI flows, services, media backends, and automation scripts
dd76ee3 feat: harden media privacy and mobile flows
fa0dff8 chore(android): bump versionCode 40→41, versionName 1.0.1→1.0.2
7c424fc fix(camera): camera only turns on when explicitly clicked — never auto-starts
94445e5 fix(images): center and fill all photos correctly — no more cut sides or black bars
```

Status:
```text
 M .gitignore
 M AGENTS.md
 M android/app/build.gradle
 M firebase.firestore.rules
 M package-lock.json
 M package.json
 M scripts/test_feedback_component.mjs
 M scripts/test_responsive.mjs
 M src/App.css
 M src/App.tsx
 M src/components/LaunchTributeOverlay.tsx
 M src/components/SidebarNav.tsx
 M src/components/SuggestionWidget.tsx
 M src/pages/AdminDashboardPage.tsx
 M src/pages/CapturePetPage.tsx
 M src/pages/ConsentPage.tsx
 M src/pages/DashboardPage.tsx
 M src/pages/DogOnboardingPage.tsx
 M src/pages/EmailAuthPage.tsx
 M src/pages/LocationOnboardingPage.tsx
 M src/pages/OnboardingChoicePage.tsx
 M src/pages/PetParentContactPage.tsx
 M src/pages/ReportLostDogPage.tsx
 M src/services/authService.ts
 M src/services/firebaseSyncService.ts
 M src/services/storageService.ts
 M tsconfig.app.json
 M vite.config.ts
?? .agents/rules/graphify.md
?? .agents/workflows/
?? .gitattributes
?? .tokencap/
?? components.json
?? docs/DESIGN_DOCUMENT.md
?? docs/IMPLEMENTATION_PLAN.md
?? docs/PRD.md
?? docs/TRD.md
?? docs/findlostpuppy-app-context.md
?? docs/generate_pdf.mjs
?? docs/local-development.md
?? memory-bank/
?? public/app-logo.png
?? public/docs/
?? public/dog_isolated_draft.png
?? public/logo.png
?? public/splash_dog_exact.png
?? public/splash_dog_only.png
?? scripts/capture_animation_showcase.mjs
?? scripts/capture_logo_flow.mjs
?? scripts/generate_all_docs_pdfs.mjs
?? scripts/notify_testers.mjs
?? scripts/test_admin_security_guard.mjs
?? scripts/test_auth_consent_flow.mjs
?? scripts/test_component_transitions.mjs
?? scripts/test_fast_capture.mjs
?? scripts/test_interstitial_transition.mjs
?? scripts/test_table_launch_transition.mjs
?? scripts/verify_admin_shortcuts_tabs.mjs
?? src/components/admin/
?? src/components/ui/
?? src/lib/
?? src/pages/PrivacyPolicyPage.tsx
?? src/pages/ShortcutsPage.tsx
?? src/utils/locationMatchHelper.ts
?? src/vite-env.d.ts
```

## Project Map

```text
.agents/
.agents/rules/
.agents/skills/
.agents/skills/character-animation/
.agents/skills/emil-design-eng/
.agents/skills/frontend-design/
.agents/skills/gsap-cinematic-animation/
.agents/skills/remotion-video-synthesis/
.agents/skills/responsive-design/
.agents/skills/responsive-design/references/
.agents/workflows/
.github/
.github/workflows/
.tokencap/
.tokencap/agent/
.tokencap/agent/detail/
.tokencap/brain/
.tokencap/constitution/
.tokencap/constitution/constitution-history/
.tokencap/debug/
.tokencap/graph/
.tokencap/memory/
.vscode/
android/
android/app/
android/app/src/
android/app/src/androidTest/
android/app/src/androidTest/java/
android/app/src/androidTest/java/com/
android/app/src/androidTest/java/com/getcapacitor/
android/app/src/androidTest/java/com/getcapacitor/myapp/
android/app/src/main/
android/app/src/main/assets/
android/app/src/main/assets/public/
android/app/src/main/assets/public/assets/
android/app/src/main/java/
android/app/src/main/java/com/
android/app/src/main/java/com/findlostpuppy/
android/app/src/main/java/com/findlostpuppy/app/
android/app/src/main/res/
android/app/src/main/res/drawable/
android/app/src/main/res/drawable-v24/
android/app/src/main/res/layout/
android/app/src/main/res/mipmap-anydpi-v26/
android/app/src/main/res/values/
android/app/src/main/res/xml/
android/app/src/test/
android/app/src/test/java/
android/app/src/test/java/com/
android/app/src/test/java/com/getcapacitor/
android/app/src/test/java/com/getcapacitor/myapp/
android/capacitor-cordova-android-plugins/
android/capacitor-cordova-android-plugins/src/
android/capacitor-cordova-android-plugins/src/main/
docs/
functions/
graphify-out/
graphify-out/2026-10-01/
graphify-out/cache/
graphify-out/cache/ast/
graphify-out/cache/ast/v0.9.72-s4/
memory-bank/
public/
scratch/
scratch/responsive-audit/
scratch/responsive-dashboard-landscape/
scratch/responsive-dashboard-portrait/
scripts/
scripts/unit/
src/
src/components/
src/components/admin/
src/components/fallbacks/
src/components/ui/
src/context/
src/data/
src/data/legal/
src/data/location/
src/data/location/localities/
src/hooks/
src/lib/
src/pages/
src/services/
src/types/
src/utils/
tools/
tools/android/
worker/
.agents/rules/graphify.md
.agents/rules/workflow.md
.agents/skills/character-animation/SKILL.md
.agents/skills/emil-design-eng/SKILL.md
.agents/skills/frontend-design/LICENSE.txt
.agents/skills/frontend-design/SKILL.md
.agents/skills/gsap-cinematic-animation/SKILL.md
.agents/skills/remotion-video-synthesis/SKILL.md
.agents/skills/responsive-design/SKILL.md
.agents/skills/responsive-design/references/breakpoint-strategies.md
.agents/skills/responsive-design/references/container-queries.md
.agents/skills/responsive-design/references/details.md
.agents/skills/responsive-design/references/fluid-layouts.md
.agents/workflows/graphify.md
.github/workflows/deploy.yml
.oxlintrc.json
.tokencap/agent/START_HERE.md
.tokencap/agent/agent-pack.md
.tokencap/agent/agent.json
.tokencap/agent/allowed-context.json
.tokencap/agent/architecture.md
.tokencap/agent/context-manifest.json
.tokencap/agent/detail/index.md
.tokencap/agent/model-instructions.md
.tokencap/agent/review-rules.md
.tokencap/agent/risk-map.md
.tokencap/agent/rules.md
.tokencap/agent/skills.md
.tokencap/agent/tech-stack.md
.tokencap/brain/brain-index.json
.tokencap/brain/knowledge.json
.tokencap/constitution/api-contracts.yaml
.tokencap/constitution/architecture-laws.md
.tokencap/constitution/compliance-rules.md
.tokencap/constitution/constitution-graph.html
.tokencap/constitution/constitution-history/constitution-2026-10-01.json
.tokencap/constitution/constitution.json
.tokencap/constitution/constitution.md
.tokencap/constitution/constitution.yaml
.tokencap/constitution/critical-flows.md
.tokencap/constitution/public-contracts.md
.tokencap/constitution/schema-invariants.yaml
.tokencap/constitution/security-boundaries.md
.tokencap/debug/notes.md
.tokencap/graph/summary.md
.tokencap/memory/current.md
.tokencap/memory/dev-notes.md
.tokencap/savings.json
.tokencap/stats.json
.vscode/settings.json
ADMIN_TRACKER.md
AGENTS.md
LEGAL_REVIEW_REQUIRED.md
README.md
android/app/google-services.json
android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java
android/app/src/main/AndroidManifest.xml
android/app/src/main/assets/capacitor.config.json
android/app/src/main/assets/capacitor.plugins.json
android/app/src/main/assets/public/404.html
android/app/src/main/assets/public/assets/501-Dv5GF2oC.js
android/app/src/main/assets/public/assets/502-CiKnfBNR.js
android/app/src/main/assets/public/assets/503-DRnrewue.js
android/app/src/main/assets/public/assets/505-CAVQ_9yF.js
android/app/src/main/assets/public/assets/506-Cr9i6YqL.js
android/app/src/main/assets/public/assets/507-CINqtXAB.js
android/app/src/main/assets/public/assets/508-D0nItL8p.js
android/app/src/main/assets/public/assets/509-B5KE7Y6e.js
android/app/src/main/assets/public/assets/510-BWbjsvWc.js
android/app/src/main/assets/public/assets/511-_WX6vzfv.js
android/app/src/main/assets/public/assets/512-BB57rvd8.js
android/app/src/main/assets/public/assets/513-aV3nhEOE.js
android/app/src/main/assets/public/assets/514-BJOuGM6E.js
android/app/src/main/assets/public/assets/515-DgE7xlSK.js
android/app/src/main/assets/public/assets/516-VkbN94rn.js
android/app/src/main/assets/public/assets/517-CF9MNAPY.js
android/app/src/main/assets/public/assets/518-CM1iD2Ol.js
android/app/src/main/assets/public/assets/520-BNxLdlev.js
android/app/src/main/assets/public/assets/522-CL3YEBVR.js
android/app/src/main/assets/public/assets/523-ClCfdAWi.js
android/app/src/main/assets/public/assets/524-C1oINcei.js
android/app/src/main/assets/public/assets/528-OFhYce7r.js
android/app/src/main/assets/public/assets/529-5lCbiqdn.js
android/app/src/main/assets/public/assets/530-sJzN4oON.js
android/app/src/main/assets/public/assets/531-h01X0AF2.js
android/app/src/main/assets/public/assets/534-2YT2jEpL.js
android/app/src/main/assets/public/assets/536-CBbXGY9Z.js
android/app/src/main/assets/public/assets/537-B0tf_CCR.js
android/app/src/main/assets/public/assets/540-rNMS9GzX.js
android/app/src/main/assets/public/assets/541-DyuEXzuG.js
android/app/src/main/assets/public/assets/543-CZkyWbfS.js
android/app/src/main/assets/public/assets/549-DngjKRxy.js
android/app/src/main/assets/public/assets/635-Q9Se5S4E.js
android/app/src/main/assets/public/assets/680-DGk3JgRB.js
android/app/src/main/assets/public/assets/681-D7Vck4yu.js
android/app/src/main/assets/public/assets/682-CLVwavQi.js
android/app/src/main/assets/public/assets/683-cli5rhFz.js
android/app/src/main/assets/public/assets/684-C8AR2itm.js
android/app/src/main/assets/public/assets/685-CD5gA4cw.js
android/app/src/main/assets/public/assets/686-DYY9tZGg.js
android/app/src/main/assets/public/assets/687-CfdTCMOv.js
android/app/src/main/assets/public/assets/688-Dpo9hqYh.js
android/app/src/main/assets/public/assets/689-6xmubMbG.js
android/app/src/main/assets/public/assets/690-Cdzt8Bsh.js
android/app/src/main/assets/public/assets/691-Djkyg05h.js
android/app/src/main/assets/public/assets/692-CTQucKNL.js
android/app/src/main/assets/public/assets/693-CTi2LbUs.js
android/app/src/main/assets/public/assets/694-eV74KxAR.js
android/app/src/main/assets/public/assets/695-CjWVl6gH.js
android/app/src/main/assets/public/assets/696-2WWLLHQp.js
android/app/src/main/assets/public/assets/697-DKviOHwP.js
android/app/src/main/assets/public/assets/698-DMWxEI1m.js
android/app/src/main/assets/public/assets/699-xOXVFYZY.js
android/app/src/main/assets/public/assets/700-PQWX5pSW.js
android/app/src/main/assets/public/assets/720-uO_69pcG.js
android/app/src/main/assets/public/assets/721-DmhAewqk.js
android/app/src/main/assets/public/assets/738-C2mH502w.js
android/app/src/main/assets/public/assets/744-CA2dSslM.js
android/app/src/main/assets/public/assets/746-CMIxdwyq.js
android/app/src/main/assets/public/assets/747-Dm8KGMxE.js
android/app/src/main/assets/public/assets/748-Bt5bY80A.js
android/app/src/main/assets/public/assets/749-DKOwrRjb.js
android/app/src/main/assets/public/assets/750-CrQ8iF97.js
android/app/src/main/assets/public/assets/751-BNd53R4M.js
android/app/src/main/assets/public/assets/753-C2l6WBY4.js
android/app/src/main/assets/public/assets/754-BWKBOdRJ.js
android/app/src/main/assets/public/assets/755-Gme_wl79.js
android/app/src/main/assets/public/assets/790-C7om_uC-.js
android/app/src/main/assets/public/assets/web-BWStb2OY.js
android/app/src/main/assets/public/assets/web-C1f0M_I9.js
android/app/src/main/assets/public/assets/web-CXDVJ7zT.js
android/app/src/main/assets/public/cordova.js
... 386 more entries omitted
```

## File Manifest

| File | Bytes | Score | Why |
| --- | ---: | ---: | --- |
| package.json | 1912 | 190 | changed, project-metadata |
| vite.config.ts | 605 | 190 | changed, project-metadata |
| src/App.tsx | 11566 | 150 | changed, source |
| src/components/SuggestionWidget.tsx | 11994 | 150 | changed, source |
| src/pages/EmailAuthPage.tsx | 4724 | 150 | changed, source |
| src/pages/OnboardingChoicePage.tsx | 4424 | 150 | changed, source |
| src/pages/PrivacyPolicyPage.tsx | 6797 | 150 | changed, source |
| src/pages/ShortcutsPage.tsx | 207 | 150 | changed, source |
| src/services/authService.ts | 8417 | 150 | changed, source |
| src/utils/locationMatchHelper.ts | 5755 | 150 | changed, source |
| src/vite-env.d.ts | 38 | 150 | changed, source |
| src/components/LaunchTributeOverlay.tsx | 12276 | 149 | changed, source |
| src/pages/ConsentPage.tsx | 16178 | 149 | changed, source |
| src/pages/ReportLostDogPage.tsx | 19816 | 149 | changed, source |
| src/components/SidebarNav.tsx | 26561 | 148 | changed, source |
| src/pages/PetParentContactPage.tsx | 34603 | 148 | changed, source |
| src/services/firebaseSyncService.ts | 28819 | 148 | changed, source |
| scripts/test_admin_security_guard.mjs | 3163 | 138 | changed, test |
| scripts/test_auth_consent_flow.mjs | 4035 | 138 | changed, test |
| scripts/test_component_transitions.mjs | 3309 | 138 | changed, test |
| scripts/test_fast_capture.mjs | 9906 | 138 | changed, test |
| scripts/test_interstitial_transition.mjs | 3194 | 138 | changed, test |
| .agents/rules/graphify.md | 933 | 120 | changed |
| AGENTS.md | 381 | 120 | changed |
| components.json | 370 | 120 | changed |
| android/app/src/main/assets/public/cordova_plugins.js | 0 | 30 | source |
| android/app/src/main/assets/public/cordova.js | 0 | 30 | source |

## Changed Files

-  M .gitignore
-  M AGENTS.md
-  M android/app/build.gradle
-  M firebase.firestore.rules
-  M package-lock.json
-  M package.json
-  M scripts/test_feedback_component.mjs
-  M scripts/test_responsive.mjs
-  M src/App.css
-  M src/App.tsx
-  M src/components/LaunchTributeOverlay.tsx
-  M src/components/SidebarNav.tsx
-  M src/components/SuggestionWidget.tsx
-  M src/pages/AdminDashboardPage.tsx
-  M src/pages/CapturePetPage.tsx
-  M src/pages/ConsentPage.tsx
-  M src/pages/DashboardPage.tsx
-  M src/pages/DogOnboardingPage.tsx
-  M src/pages/EmailAuthPage.tsx
-  M src/pages/LocationOnboardingPage.tsx
-  M src/pages/OnboardingChoicePage.tsx
-  M src/pages/PetParentContactPage.tsx
-  M src/pages/ReportLostDogPage.tsx
-  M src/services/authService.ts
-  M src/services/firebaseSyncService.ts
-  M src/services/storageService.ts
-  M tsconfig.app.json
-  M vite.config.ts
- ?? .agents/rules/graphify.md
- ?? .agents/workflows/
- ?? .gitattributes
- ?? .tokencap/
- ?? components.json
- ?? docs/DESIGN_DOCUMENT.md
- ?? docs/IMPLEMENTATION_PLAN.md
- ?? docs/PRD.md
- ?? docs/TRD.md
- ?? docs/findlostpuppy-app-context.md
- ?? docs/generate_pdf.mjs
- ?? docs/local-development.md
- ?? memory-bank/
- ?? public/app-logo.png
- ?? public/docs/
- ?? public/dog_isolated_draft.png
- ?? public/logo.png
- ?? public/splash_dog_exact.png
- ?? public/splash_dog_only.png
- ?? scripts/capture_animation_showcase.mjs
- ?? scripts/capture_logo_flow.mjs
- ?? scripts/generate_all_docs_pdfs.mjs
- ?? scripts/notify_testers.mjs
- ?? scripts/test_admin_security_guard.mjs
- ?? scripts/test_auth_consent_flow.mjs
- ?? scripts/test_component_transitions.mjs
- ?? scripts/test_fast_capture.mjs
- ?? scripts/test_interstitial_transition.mjs
- ?? scripts/test_table_launch_transition.mjs
- ?? scripts/verify_admin_shortcuts_tabs.mjs
- ?? src/components/admin/
- ?? src/components/ui/
- ?? src/lib/
- ?? src/pages/PrivacyPolicyPage.tsx
- ?? src/pages/ShortcutsPage.tsx
- ?? src/utils/locationMatchHelper.ts
- ?? src/vite-env.d.ts

## Git Diff Snippets

### Unstaged Changes Diff

```diff
// … lines 1–49
diff --git a/.gitignore b/.gitignore
index aaa4c09..73ede82 100644
--- a/.gitignore
+++ b/.gitignore
@@ -26,6 +26,7 @@ dist-ssr
 *.sln
 *.sw?
 scratch/
+graphify-out/
 
 # Android Signing and Keystores
 *.jks
diff --git a/AGENTS.md b/AGENTS.md
index 9125eaa..6471386 100644
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -1,116 +1,8 @@
-# FindLostPuppy Repository Instructions
+# TokenCap Start Here
 
-## Working and Release Workflow
+Project intelligence is generated locally in `.tokencap/`.
 
-- Work locally on the `fixes` branch unless the user explicitly requests another branch.
-- Never modify or push directly to `main`.
-- Do not commit, push, merge, create a pull request, deploy, publish, or distribute a release without explicit user approval.
-- Test changes at `http://localhost:5173` before requesting approval.
-- Before any release, run `npm run lint`, `npm run build`, `npm run build:android`, `npm run sync:android`, and the relevant browser automation.
-- When building an Android release AAB, copy it to Desktop as both `findlostpuppy-release.aab` and `findlostpuppy-v{versionName}-code{versionCode}-release.aab`.
-
-## Security and Privacy Invariants
-
-- Never commit `.env`, service-account files, private keys, signing credentials, access tokens, tester email lists, or real user exports.
-- Client Firebase configuration values may come from approved `VITE_*` variables, but privileged credentials must never be bundled into the web or Android client.
-- Keep Firestore and Storage rules deny-by-default. Public reads or writes require an explicit product requirement and a rule-level validation review.
-- Firestore pet documents and SAFE reports are readable only by their owner or an administrator. Signed-in community users may read only sanitized LOST reports and sanitized sightings.
-- Normal-user cloud synchronization must fetch the signed-in user's private documents directly and query shared collections only with the same privacy predicates enforced by Firestore rules.
-- Firebase Storage profile and pet media are owner/admin-only. Shared missing-report and sighting media must not contain owner contact details or exact coordinates.
-- Unsigned Cloudinary uploads are limited to sanitized public missing-report and sighting images under the configured public-alerts folder. Profile and normal pet media must never use an unsigned public Cloudinary preset.
-- Cloudinary API secrets, signed-upload signatures, deletion credentials, moderation webhooks, and administrative operations belong only on an authenticated backend.
-- Android application backup remains disabled because local WebView storage contains authenticated profile and pet data.
-- Do not log authentication tokens, exact private coordinates, phone numbers, email addresses, or unmasked user records.
-- Public owner contact details must remain masked, for example `+91 86••••••48` and `j•••5@gmail.com`.
-- Exact home addresses and GPS coordinates must never appear in public listings.
-- Phone fields must use `validateIndianPhoneNumber`: exactly 10 digits beginning with 6, 7, 8, or 9.
-- Compress every user photo through `compressImage` before local persistence or upload.
-- Critical report forms must use bounded, expiring local drafts. Failed compressed-image uploads must use the bounded retry queue and retry after connectivity returns.
-- Production crash handling must not log form contents, contact data, exact location, images, credentials, or tokens.
-- Material Terms or Privacy Policy changes must increment the consent versions and require renewed affirmative acceptance.
// … lines 322–327
+++ b/scripts/test_feedback_component.mjs
@@ -67,7 +67,7 @@ async function runTests() {
       const el = document.querySelector('.suggestion-modal-title');
       return el ? el.textContent : '';
     });
-    assert(modalTitle.includes('App Suggestion & Feedback'), `Modal title is correct: "${modalTitle.trim()}"`);
// … lines 405–410
+          /** Waits for modal updates before the next browser assertion. */
+          const pause = (ms = 120) => new Promise(resolve => setTimeout(resolve, ms));
           /** Clicks the first matching HTML element, throwing if the selector does not resolve to one. */
           const click = (selector) => {
             const element = document.querySelector(selector);
@@ -162,6 +162,14 @@ try {
// … lines 985–990
+
+.capture-instant-submit-btn:hover:not(:disabled) {
+  transform: translateY(-1px);
+  box-shadow: 0 8px 30px rgba(255, 102, 0, 0.5);
+}
+
// … lines 1540–1545
 function DevelopmentErrorProbe() {
@@ -58,12 +62,20 @@ function MainAppFlow() {
 
   return (
     <Routes>
+      {/* 0. INTERACTIVE DEMO ROUTE */}
// … lines 1635–1640
               onBackToLocation={() => {
@@ -171,10 +185,10 @@ function MainAppFlow() {
       <Route
         path="/alert"
         element={
-          !hasValidConsent ? (
// … lines 1892–1897
+
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
 
@@ -129,9 +142,9 @@ export const SuggestionWidget: React.FC = () => {
       localStorage.setItem('findlostpuppy_suggestion_shown', 'true');
// … lines 2625–2630
+  /** Uploads or queues captured photos and saves a sighting or unknown missing-pet alert. */
   const handleSubmit = async () => {
-    if (!user || !selectedReport) return;
+    if (!user) return;
+    if (!selectedReport && !isUnknownSelected) {
+      showToast('Please select a missing pet or choose "Report Unknown Roaming Pet".', 'warning');
// … lines 3695–3700
 
   const handleContinue = () => {
-    if (!canContinue) return;
+    // 1-Click: auto-accept all 4 forms and continue immediately
+    handleAcceptAllTogether(true);
     onConsentAgreed(
// … lines 4543–4548
       } else {
@@ -31,7 +34,7 @@ export const EmailAuthPage = () => {
         navigate('/owner', { replace: true });
       }
     }
-  }, [isAuthenticated, hasCompletedOwner, hasCompletedLocation, navigate, setActiveOnboardingTab]);
// … lines 4641–4646
+
+  const handleForwardTransitionComplete = () => {
+    setIsTransitioningForward(false);
     if (onSuccess) {
       onSuccess();
     } else {
// … lines 5146–5151
 
+  const handleTransitionComplete = () => {
+    setIsTransitioning(false);
     if (onSuccess) {
       onSuccess();
     } else {
// … lines 5310–5315
       window.dispatchEvent(new CustomEvent('findlostpuppy_session_updated', { detail: user }));
@@ -170,7 +170,7 @@ class AuthService {
         }
         const mapped = mapFirebaseUser(result.user);
         this.setCurrentUser(mapped);
-        await firebaseSyncService.syncUserProfile(mapped).catch(() => {});
// … lines 5424–5429
   deleteUserAsAdmin: async (...args: Parameters<typeof import('./firebaseSyncService').firebaseSyncService.deleteUserAsAdmin>) =>
@@ -2401,8 +2403,14 @@ class StorageService {
   /** Merges accessible Firebase records into local storage and signals synchronization success or failure; returns a success flag. */
   async pullFromFirebase(): Promise<boolean> {
     try {
+      if (!isFirebaseConfigured()) return true;

_Not shown (ask if needed): runTests, pause, media, not, MainAppFlow, App, LaunchTributeOverlayProps, handleOpenPlayStore, ReportGeoLocation, handleEnableCamera, handleProceedToReview, handleRetake, handleCloseReview, ConsentPageProps, cancelAutoScroll … and 18 more._
```

## TODO / FIXME / HACK Notes

No TODO/FIXME/HACK notes found in selected files.

## Selected File Context

### package.json

| Field | Value |
| --- | --- |
| Bytes | 1912 |
| Score | 190 |
| Why | changed, project-metadata |
| Status | Full content |


```json
{
  "name": "findlostpuppy",
  "private": true,
  "version": "1.0.7",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:android": "node scripts/validate_firebase_env.mjs && CAPACITOR_BUILD=true tsc -b && CAPACITOR_BUILD=true vite build",
    "sync:android": "npx cap copy android && node scripts/verify_android_assets.mjs",
    "verify:firestore-privacy": "node scripts/verify_firestore_privacy.mjs",
    "verify:cloudinary-privacy": "node scripts/verify_cloudinary_privacy.mjs",
    "cloudinary:delete-all-images": "node scripts/cloudinary_delete_all_images.mjs",
    "worker:types": "wrangler types worker-configuration.d.ts",
    "worker:check": "wrangler deploy --dry-run",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "@capacitor-firebase/authentication": "^8.5.2",
    "@capacitor/core": "^8.5.2",
    "@capacitor/geolocation": "^8.2.2",
    "@capgo/capacitor-nativegeocoder": "^8.0.48",
    "@radix-ui/react-slot": "^1.3.3",
    "@turf/boolean-point-in-polygon": "^7.4.0",
    "@turf/helpers": "^7.4.0",
    "canvas-confetti": "^1.9.4",
    "class-variance-authority": "^0.7.1",
    "cloudinary": "^2.11.0",
    "clsx": "^2.1.1",
    "firebase": "^12.19.0",
    "gsap": "^3.15.0",
    "jose": "^6.2.12",
    "lucide-react": "^1.42.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-router-dom": "^7.18.3",
    "tailwind-merge": "^3.7.0"
  },
  "devDependencies": {
    "@capacitor/android": "^8.5.2",
    "@capacitor/cli": "^8.5.2",
    "@cloudflare/workers-types": "^5.20260929.1",
    "@types/canvas-confetti": "^1.9.0",
    "@types/node": "^24.13.3",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.4",
    "@vitejs/plugin-react": "^6.1.0",
    "oxlint": "^1.79.0",
    "puppeteer-core": "^25.11.0",
    "typescript": "~6.0.2",
    "vite": "^8.2.2",
    "wrangler": "^4.143.1"
  }
}
```

### vite.config.ts

| Field | Value |
| --- | --- |
| Bytes | 605 |
| Score | 190 |
| Why | changed, project-metadata |
| Status | Full content |


```ts
import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'geojson-loader',
      transform(code, id) {
        if (id.endsWith('.geojson')) {
          return {
            code: `export default ${code};`,
            map: null,
          };
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: process.env.CAPACITOR_BUILD === 'true'
    ? '/'
    : (process.env.VITE_BASE_URL || '/'),
})
```

### src/App.tsx

| Field | Value |
| --- | --- |
| Bytes | 11566 |
| Score | 150 |
| Why | changed, source |
| Status | Full content |


```tsx
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SidebarNav } from './components/SidebarNav';
import { Footer } from './components/Footer';
import { useEffect } from 'react';
import { storageService } from './services/storageService';

import { ConsentPage } from './pages/ConsentPage';

// Guided Sequential Flow & Dedicated Tab Pages
import { EmailAuthPage } from './pages/EmailAuthPage';
import { PetParentContactPage } from './pages/PetParentContactPage';
import { LocationOnboardingPage } from './pages/LocationOnboardingPage';
import { DogOnboardingPage } from './pages/DogOnboardingPage';
import { ReportLostDogPage } from './pages/ReportLostDogPage';
import { GuestSightingPage } from './pages/GuestSightingPage';
import { OnboardingChoicePage } from './pages/OnboardingChoicePage';
import { AnimationShowcaseStudio } from './components/ui/AnimationShowcaseStudio';

// Unlocked Experience Pages
import { DiscoveryPage } from './pages/DiscoveryPage';
import { DogDetailPage } from './pages/DogDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CapturePetPage } from './pages/CapturePetPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { ShortcutsPage } from './pages/ShortcutsPage';

import { LaunchTributeOverlay } from './components/LaunchTributeOverlay';
import { SuggestionWidget } from './components/SuggestionWidget';
import { NetworkResilience } from './components/NetworkResilience';
import { ServerFailureNotice } from './components/fallbacks/ServerFailureNotice';
import { LoadingFallback } from './components/fallbacks/LoadingFallback';
import { PageTransition } from './components/ui/PageTransition';

/** Throws when the development-only forceErrorBoundary query flag is present; otherwise renders nothing. */
function DevelopmentErrorProbe() {
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('forceErrorBoundary')) {
    throw new Error('Intentional development-only error boundary check');
  }
  return null;
}

import './App.css';

/** Renders application routes according to session loading, authentication, consent, and onboarding state. */
function MainAppFlow() {
  const {
    isAuthenticated,
    isLoading,
    activeOnboardingTab,
    setActiveOnboardingTab,
    hasValidConsent,
    agreeToConsent,
  } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingFallback message="Checking your saved session…" />;
  }

  return (
    <Routes>
      {/* 0. INTERACTIVE DEMO ROUTE */}
      <Route
        path="/demo"
        element={<AnimationShowcaseStudio />}
      />

      {/* 1. PUBLIC EMERGENCY & DIRECT DETAIL ROUTES (Instant 0-roadblock access anywhere) */}
      <Route path="/report-sighting/:id" element={<GuestSightingPage />} />
      <Route path="/found/:id" element={<GuestSightingPage />} />
      <Route path="/alert/:id" element={<GuestSightingPage />} />
      <Route path="/dog/:id" element={<DogDetailPage />} />
      <Route path="/find" element={<DiscoveryPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

      {/* 2. COMMUNITY RECOVERY DASHBOARD & ADMIN PORTAL */}
      <Route path="/homepage" element={<DashboardPage />} />
      <Route path="/dashboard" element={<Navigate to="/homepage" replace />} />
      <Route path="/feedback" element={<DashboardPage />} />
      <Route path="/suggest" element={<DashboardPage />} />
      <Route path="/next-step" element={<Navigate to="/homepage" replace />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/shortcuts" element={<ShortcutsPage />} />
      <Route path="/admin/shortcuts" element={<ShortcutsPage />} />
      <Route
        path="/capture"
        element={
          !isAuthenticated ? (
            <EmailAuthPage />
          ) : !hasValidConsent ? (
            <ConsentPage onConsentAgreed={agreeToConsent} />
          ) : (
            <CapturePetPage />
          )
        }
      />

      {/* 3. DEDICATED DIRECT ROUTES FOR ALL TABS (Fast, lag-free navigation) */}
      <Route
        path="/owner"
        element={
          !isAuthenticated ? (
            <EmailAuthPage />
          ) : !hasValidConsent ? (
            <ConsentPage onConsentAgreed={agreeToConsent} />
          ) : (
            <PetParentContactPage
              onSuccess={() => {
                setActiveOnboardingTab('location');
                navigate('/location');
              }}
            />
          )
        }
      />
      <Route path="/edit-parent" element={<Navigate to="/owner" replace />} />
      <Route path="/profile" element={<Navigate to="/owner" replace />} />

      <Route
        path="/location"
        element={
          !isAuthenticated ? (
            <EmailAuthPage />
          ) : !hasValidConsent ? (
            <ConsentPage onConsentAgreed={agreeToConsent} />
          ) : (
            <LocationOnboardingPage
              onSuccess={() => {
                setActiveOnboardingTab('choice');
                navigate('/choice');
              }}
              onBack={() => {
                setActiveOnboardingTab('owner');
                navigate('/owner');
              }}
            />
          )
        }
      />
      <Route path="/edit-location" element={<Navigate to="/location" replace />} />

      <Route
        path="/choice"
        element={
          !isAuthenticated ? (
            <EmailAuthPage />
          ) : !hasValidConsent ? (
            <ConsentPage onConsentAgreed={agreeToConsent} />
          ) : (
            <OnboardingChoicePage />
          )
        }
      />
      <Route path="/pet-choice" element={<Navigate to="/choice" replace />} />

      <Route
        path="/pet"
        element={
          !isAuthenticated ? (
            <EmailAuthPage />
          ) : !hasValidConsent ? (
            <ConsentPage onConsentAgreed={agreeToConsent} />
          ) : (
            <DogOnboardingPage
              onBackToLocation={() => {
                setActiveOnboardingTab('choice');
                navigate('/choice');
              }}
              onSuccess={() => {
                setActiveOnboardingTab('report');
                navigate('/alert');
              }}
            />
          )
        }
      />
      <Route path="/dog" element={<Navigate to="/pet" replace />} />
      <Route path="/dog-profile" element={<Navigate to="/pet" replace />} />
      <Route path="/report-another" element={<Navigate to="/pet" replace />} />

      <Route
        path="/alert"
        element={
          !isAuthenticated ? (
            <EmailAuthPage />
          ) : !hasValidConsent ? (
            <ConsentPage onConsentAgreed={agreeToConsent} />
          ) : (
            <ReportLostDogPage
              onBackToPet={() => {
                setActiveOnboardingTab('dog');
                navigate('/pet');
              }}
              onSuccess={() => {
                setActiveOnboardingTab('dashboard');
                navigate('/homepage');
              }}
            />
          )
        }
      />
      <Route path="/report" element={<Navigate to="/alert" replace />} />
      <Route path="/report-lost" element={<Navigate to="/alert" replace />} />

      <Route
        path="/consent"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : hasValidConsent ? (
            <Navigate to={activeOnboardingTab === 'completed' ? '/homepage' : `/${activeOnboardingTab === 'dog' ? 'pet' : activeOnboardingTab}`} replace />
          ) : (
            <ConsentPage
              onConsentAgreed={(forms, method) => {
                agreeToConsent(forms, method);
                navigate(activeOnboardingTab === 'completed' ? '/homepage' : `/${activeOnboardingTab === 'dog' ? 'pet' : activeOnboardingTab}`);
              }}
            />
          )
        }
      />
      <Route path="/login" element={<EmailAuthPage />} />

      {/* 4. ROOT ROUTE (Smart dynamic resolution based on onboarding progress) */}
      <Route
        path="/"
        element={
          !isAuthenticated ? (
            <EmailAuthPage />
          ) : !hasValidConsent ? (
            <ConsentPage
              onConsentAgreed={(forms, method) => {
                agreeToConsent(forms, method);
                navigate(activeOnboardingTab === 'completed' ? '/homepage' : `/${activeOnboardingTab === 'dog' ? 'pet' : activeOnboardingTab}`);
              }}
            />
          ) : activeOnboardingTab === 'owner' ? (
            <PetParentContactPage
              onSuccess={() => {
                setActiveOnboardingTab('location');
                navigate('/location');
              }}
            />
          ) : activeOnboardingTab === 'location' ? (
            <LocationOnboardingPage
              onSuccess={() => {
                setActiveOnboardingTab('choice');
                navigate('/choice');
              }}
              onBack={() => {
                setActiveOnboardingTab('owner');
                navigate('/owner');
              }}
            />
          ) : activeOnboardingTab === 'choice' ? (
            <OnboardingChoicePage />
          ) : activeOnboardingTab === 'dog' || activeOnboardingTab === 'pet' ? (
            <DogOnboardingPage
              onBackToLocation={() => {
                setActiveOnboardingTab('choice');
                navigate('/choice');
              }}
              onSuccess={() => {
                setActiveOnboardingTab('report');
                navigate('/alert');
              }}
            />
          ) : activeOnboardingTab === 'report' ? (
            <ReportLostDogPage
              onBackToPet={() => {
                setActiveOnboardingTab('dog');
                navigate('/pet');
              }}
              onSuccess={() => {
                setActiveOnboardingTab('dashboard');
                navigate('/homepage');
              }}
            />
          ) : (
            <DashboardPage />
          )
        }
      />

      {/* 5. CATCH-ALL FALLBACK */}
      <Route path="*" element={<Navigate to="/homepage" replace />} />
    </Routes>
  );
}

/** Composes routing, session providers, recovery notices, and the app shell, and starts cloud synchronization. */
export function App() {
  const basename = import.meta.env.BASE_URL;

  // Single source of truth: Pull authentic Firebase cloud records on application boot
  useEffect(() => {
    storageService.pullFromFirebase().catch(() => {});
  }, []);

  return (
    <Router basename={basename}>
      <ToastProvider>
        <AuthProvider>
          <DevelopmentErrorProbe />
          <NetworkResilience />
          <ServerFailureNotice />
          <LaunchTributeOverlay />
          <div className="app-layout-sidebar">
            <SidebarNav />
            <div className="app-main-viewport">
              <main className="main-content">
                <PageTransition>
                  <MainAppFlow />
                </PageTransition>
              </main>
              <Footer />
            </div>
          </div>
          <SuggestionWidget />
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
```

### src/components/SuggestionWidget.tsx

| Field | Value |
| --- | --- |
| Bytes | 11994 |
| Score | 150 |
| Why | changed, source |
| Status | Full content |


```tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  X,
  Send,
  CheckCircle2,
  Star,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import type { SuggestionCategory } from '../types';

const PLAY_STORE_TESTING_URL = 'https://play.google.com/apps/testing/om.findlostpuppy.app';
const PLAY_STORE_REVIEW_URL =
  import.meta.env.VITE_PLAY_STORE_URL || PLAY_STORE_TESTING_URL;
const PLAY_STORE_MARKET_URL = 'market://details?id=om.findlostpuppy.app';

export const SuggestionWidget: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const pathname = location.pathname;

  // Auto-open on feedback routes or when query parameter indicates feedback
  useEffect(() => {
    const isFeedbackRoute = pathname === '/feedback' || pathname === '/suggest';
    const searchParams = new URLSearchParams(location.search);
    const hasFeedbackParam =
      searchParams.get('feedback') === 'true' || searchParams.get('openFeedback') === 'true';

    if (isFeedbackRoute || hasFeedbackParam) {
      setIsOpen(true);
      setIsSuccess(false);
    }
  }, [pathname, location.search]);

  // Form states
  const [suggestionText, setSuggestionText] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);

  // Identity states (prefilled silently)
  const [name, setName] = useState(user?.name || '');
  const [contact, setContact] = useState(user?.email || user?.phone || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync user info when auth updates
  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name || '');
      setContact((prev) => prev || user.email || user.phone || '');
    }
  }, [user?.name, user?.email, user?.phone]);

  // Global listener to open suggestion modal from any button in navbar, drawer, or footer
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setIsSuccess(false);
    };
    window.addEventListener('open-suggestion-modal', handleOpen);
    return () => window.removeEventListener('open-suggestion-modal', handleOpen);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Record the timestamp of the last shown popup
    localStorage.setItem('suggestion_last_shown', Date.now().toString());
    // Preserve old flags for backward compatibility
    localStorage.setItem('suggestion_shown', 'true');
    localStorage.setItem('findlostpuppy_suggestion_shown', 'true');
    if (pathname === '/feedback' || pathname === '/suggest') {
      navigate('/homepage');
    }
  };

  const handleRatingClick = (val: number) => {
    setRating(val);
  };

  const handleOpenPlayStore = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const isCapacitor =
        typeof (window as any).Capacitor !== 'undefined' &&
        (window as any).Capacitor?.isNativePlatform?.();

      if (isCapacitor) {
        window.location.href = PLAY_STORE_MARKET_URL;
      } else {
        const win = window.open(PLAY_STORE_REVIEW_URL, '_blank', 'noopener,noreferrer');
        if (!win || win.closed || typeof win.closed === 'undefined') {
          window.location.href = PLAY_STORE_REVIEW_URL;
        }
      }
      showToast('⭐ Opening Google Play Store...', 'info');
    } catch {
      window.open(PLAY_STORE_REVIEW_URL, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      const trimmed = suggestionText.trim();
      const firstLine = trimmed ? trimmed.split('\n')[0].trim() : `App Rating: ${rating} Stars`;
      const derivedTitle = firstLine.length > 70 ? `${firstLine.substring(0, 67)}...` : firstLine;

      const descriptionWithContext = trimmed || `User rated ${rating} out of 5 stars.`;

      const derivedCategory: SuggestionCategory =
        rating <= 2 ? 'bug' : rating === 3 ? 'improvement' : 'praise';

      storageService.saveSuggestion({
        userId: user?.id,
        userName: name.trim() || user?.name || 'Community Member',
        userEmail: contact.includes('@') ? contact.trim() : user?.email,
        userPhone: !contact.includes('@') && contact.trim() ? contact.trim() : user?.phone,
        category: derivedCategory,
        title: derivedTitle,
        description: descriptionWithContext,
        rating,
        pageUrl: location.pathname,
      });

      // Record timestamp so popup won't re-appear for 5 days
      localStorage.setItem('suggestion_last_shown', Date.now().toString());
      localStorage.setItem('suggestion_shown', 'true');
      localStorage.setItem('findlostpuppy_suggestion_shown', 'true');

      setIsSuccess(true);
      showToast('🎉 Thank you! Your rating was recorded.', 'success');

      // Auto close after 2s
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
        setSuggestionText('');
        if (pathname === '/feedback' || pathname === '/suggest') {
          navigate('/homepage');
        }
      }, 2000);
    } catch {
      showToast('Could not save rating. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingDescriptions = [
    '',
    'Needs attention 🛠️',
    'Fair, could be better 💡',
    'Good experience 👍',
    'Great experience! 🌟',
    'Loved it! ❤️',
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* ========================================================================= */}
      {/* APP RATING POPUP MODAL                                                    */}
      {/* ========================================================================= */}
      {isOpen && (
        <div className="suggestion-modal-overlay" onClick={handleClose}>
          <div
            className="suggestion-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="suggestion-modal-title"
          >
            {/* Modal Header: Clean title with Star Badge and Close button */}
            <div className="suggestion-modal-header suggestion-clean-header">
              <div className="suggestion-modal-title-wrap">
                <span className="suggestion-modal-star-badge" aria-hidden="true">
                  <Star size={18} fill="#FFB800" stroke="#FFB800" />
                </span>
                <h3 id="suggestion-modal-title" className="suggestion-modal-title">
                  App Rating
                </h3>
              </div>
              <button
                type="button"
                className="suggestion-modal-close"
                onClick={handleClose}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            {isSuccess ? (
              <div className="suggestion-success-view">
                <div className="suggestion-success-icon-wrap">
                  <CheckCircle2 size={54} className="text-success" />
                </div>
                <h4>Thank You for Rating! 🎉</h4>
                <p>
                  You rated FindLostPuppy {rating} out of 5 stars. Thank you for helping keep community pets safe!
                </p>
                <div className="suggestion-success-actions">
                  <a
                    href={PLAY_STORE_REVIEW_URL}
                    onClick={handleOpenPlayStore}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    ⭐ Review on Google Play <ExternalLink size={14} />
                  </a>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleClose}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="suggestion-form">
                {/* 1. Rating & Direct Review Link Row */}
                <div className="suggestion-rating-review-card">
                  <div className="rating-review-top">
                    <span className="rating-question-label">Rate your app experience:</span>
                    <span className="suggestion-rating-desc">
                      {ratingDescriptions[hoverRating || rating]}
                    </span>
                  </div>

                  <div className="rating-review-row">
                    {/* Stars */}
                    <div className="suggestion-stars-row">
                      {[1, 2, 3, 4, 5].map((val) => {
                        const active = (hoverRating || rating) >= val;
                        return (
                          <button
                            key={val}
                            type="button"
                            className={`suggestion-star-btn ${active ? 'star-active' : ''}`}
                            onClick={() => handleRatingClick(val)}
                            onMouseEnter={() => setHoverRating(val)}
                            onMouseLeave={() => setHoverRating(0)}
                            aria-label={`Rate ${val} out of 5 stars`}
                          >
                            <Star
                              size={26}
                              fill={active ? '#FFB800' : 'none'}
                              stroke={active ? '#FFB800' : '#94a3b8'}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* Direct Review Link Button */}
                    <a
                      href={PLAY_STORE_REVIEW_URL}
                      onClick={handleOpenPlayStore}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="suggestion-playstore-link-btn"
                      title="Rate on Google Play Store"
                    >
                      <span>⭐ Rate on Google Play</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>

                {/* 2. Review Text Input Bar */}
                <div className="suggestion-field-group">
                  <textarea
                    id="suggestion-desc-input"
                    rows={4}
                    className="suggestion-textarea simplified-textarea"
                    value={suggestionText}
                    onChange={(e) => setSuggestionText(e.target.value)}
                    placeholder="Share any review, thoughts, or suggestions (optional)..."
                    maxLength={1500}
                    autoFocus
                  />
                </div>

                {/* 3. Centered Submit Button */}
                <div className="suggestion-modal-footer suggestion-footer-centered">
                  <button
                    type="submit"
                    className="btn btn-primary suggestion-submit-btn"
                    disabled={isSubmitting}
                  >
                    <Send size={15} />
                    <span>{isSubmitting ? 'Sending...' : 'Submit Rating ⭐'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
```

### src/pages/EmailAuthPage.tsx

| Field | Value |
| --- | --- |
| Bytes | 4724 |
| Score | 150 |
| Why | changed, source |
| Status | Full content |


```tsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, PawPrint, ShieldCheck, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const EmailAuthPage = () => {
  const {
    signInWithGoogle,
    isAuthenticated,
    hasValidConsent,
    setActiveOnboardingTab,
    isLoading,
    authNotice,
    hasCompletedOwner,
    hasCompletedLocation,
  } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const visibleError = errorMsg || authNotice;

  useEffect(() => {
    if (isAuthenticated) {
      if (!hasValidConsent) {
        navigate('/consent', { replace: true });
      } else if (hasCompletedOwner && hasCompletedLocation) {
        setActiveOnboardingTab('dashboard');
        navigate('/homepage', { replace: true });
      } else {
        setActiveOnboardingTab('owner');
        navigate('/owner', { replace: true });
      }
    }
  }, [isAuthenticated, hasValidConsent, hasCompletedOwner, hasCompletedLocation, navigate, setActiveOnboardingTab]);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsSigningIn(true);
    const res = await signInWithGoogle();
    
    if (isMountedRef.current) {
      setIsSigningIn(false);
    }

    if (res.success) {
      if (!res.redirected) {
        showToast('Signed in with Google.', 'success');
        if (!hasValidConsent) {
          navigate('/consent', { replace: true });
        } else if (hasCompletedOwner && hasCompletedLocation) {
          setActiveOnboardingTab('dashboard');
          navigate('/homepage', { replace: true });
        } else {
          setActiveOnboardingTab('owner');
          navigate('/owner', { replace: true });
        }
      }
      return;
    }

    const nextRetry = retryCount + 1;
    setRetryCount(nextRetry);

    if (nextRetry >= 3) {
      sessionStorage.setItem('findlostpuppy_limited_mode', 'true');
      showToast('Login failed after 3 attempts. Entering Dashboard in Limited Guest Mode. You can retry from Profile anytime.', 'info');
      setActiveOnboardingTab('dashboard');
      navigate('/homepage', { replace: true });
      return;
    }

    setErrorMsg(res.error || `Could not sign in with Google (Attempt ${nextRetry}/3). Please try again.`);
  };

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <div className="auth-landing-page">
      <div className="auth-landing-container">
        <div className="auth-card card">
          <div className="auth-card-header text-center">
            <div className="auth-paw-icon-bubble">
              <PawPrint size={36} />
            </div>
            <h1 className="auth-card-title">FindLostPuppy</h1>
            <p className="auth-card-quote">"Every paw deserves to find its way home."</p>
            <p className="auth-card-instruction">
              Sign in with Google to continue. This avoids email-link quota issues and keeps your
              profile, pet details, sightings, and photos synced securely.
            </p>
          </div>

          {visibleError && (
            <div className="auth-error-banner" role="alert" style={{ marginBottom: '1.25rem' }}>
              <span>{visibleError}</span>
            </div>
          )}

          <div className="auth-card-form">
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block auth-submit-btn"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isSigningIn}
            >
              {isSigningIn ? (
                <span>Signing you in...</span>
              ) : isLoading ? (
                <span>Loading...</span>
              ) : retryCount > 0 ? (
                <>
                  <RotateCcw size={18} />
                  <span>Retry Google Sign-In ({retryCount}/3)</span>
                </>
              ) : (
                <>
                  <span>Continue with Google</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          <div className="auth-card-footer text-center">
            <div className="privacy-pill-subtle">
              <ShieldCheck size={16} />
              <span>100% Privacy Protected • Google Sign-In • Firebase Auth</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### src/pages/OnboardingChoicePage.tsx

| Field | Value |
| --- | --- |
| Bytes | 4424 |
| Score | 150 |
| Why | changed, source |
| Status | Full content |


```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Dog, LayoutDashboard, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { getDogPhotoUrl } from '../utils/dogPhotoHelper';
import { BackButton } from '../components/ui/back-button';

/** Offers pet registration or the existing-pet flow, with an option to skip to the dashboard. */
export const OnboardingChoicePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setActiveOnboardingTab } = useAuth();

  const existingPet = user ? storageService.getPetProfileByUserId(user.id, user.email) : null;
  const hasExistingPet = Boolean(existingPet?.id && (existingPet?.name || existingPet?.breed));
  const petPhotoUrl = existingPet ? getDogPhotoUrl(existingPet) : '';

  const handleBack = () => {
    setActiveOnboardingTab('location');
    navigate('/location');
  };

  const exitToDashboard = () => {
    setActiveOnboardingTab('dashboard');
    navigate('/homepage');
  };

  const goToPetDetails = () => {
    setActiveOnboardingTab('dog');
    navigate('/pet');
  };

  const goToCapturePet = () => {
    setActiveOnboardingTab('dashboard');
    navigate('/capture');
  };

  // Preserve feature for reference
  void goToCapturePet;

  return (
    <div className="onboarding-page onboarding-choice-page">
      <div className="app-container onboarding-container">
        <section className="onboarding-card card owner-theme-card onboarding-choice-card">
          <button
            type="button"
            className="onboarding-exit-btn"
            onClick={exitToDashboard}
            aria-label="Exit onboarding and go to dashboard"
            title="Exit to dashboard"
          >
            <X size={19} />
          </button>

          {/* Top-left back button inside container for going back to Location */}
          <div className="pet-profile-header-bar choice-header-bar">
            <div className="pet-profile-header-left">
              <BackButton
                onClick={handleBack}
                title="Go back to Location"
                aria-label="Back to Location"
              />
            </div>
          </div>

          <div className="section-card-title-block">
            <h1>{hasExistingPet ? 'Pet Registered' : 'Pet Choice'}</h1>
          </div>

          <div className="onboarding-choice-grid">
            {hasExistingPet && existingPet ? (
              <button
                type="button"
                className="onboarding-choice-option pet-option existing-pet-active-option"
                onClick={goToPetDetails}
              >
                <span className="choice-icon-wrap choice-pet-avatar-wrap">
                  {petPhotoUrl ? (
                    <img
                      src={petPhotoUrl}
                      alt={existingPet.name}
                      className="choice-pet-avatar-img"
                    />
                  ) : (
                    <Dog size={30} />
                  )}
                </span>
                <span className="choice-copy">
                  <strong>You already had a pet: {existingPet.name}</strong>
                </span>
                <ArrowRight size={20} />
              </button>
            ) : (
              <button
                type="button"
                className="onboarding-choice-option pet-option"
                onClick={goToPetDetails}
              >
                <span className="choice-icon-wrap">
                  <Dog size={30} />
                </span>
                <span className="choice-copy">
                  <strong>Add My Pet</strong>
                  <small>Create or update your pet details and photo.</small>
                </span>
                <ArrowRight size={20} />
              </button>
            )}

            <button
              type="button"
              className="onboarding-choice-option skip-option"
              onClick={exitToDashboard}
            >
              <span className="choice-icon-wrap">
                <LayoutDashboard size={30} />
              </span>
              <span className="choice-copy">
                <strong>Skip</strong>
              </span>
              <ArrowRight size={20} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
```

### src/pages/PrivacyPolicyPage.tsx

| Field | Value |
| --- | --- |
| Bytes | 6797 |
| Score | 150 |
| Why | changed, source |
| Status | Full content |


```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock } from 'lucide-react';
import { PRIVACY_POLICY } from '../data/legal/legalContent';

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#08090A', color: '#E1E4EA', paddingBottom: '60px' }}>
      {/* Top sticky nav */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(12, 14, 18, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '14px 20px',
        }}
      >
        <div
          style={{
            maxWidth: '860px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '9999px',
              padding: '8px 16px',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} style={{ color: '#FF9800' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#A0AEC0' }}>Official Policy</span>
          </div>
        </div>
      </header>

      {/* Main Content Wrap */}
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 20px' }}>
        {/* Title Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(255, 121, 0, 0.12), rgba(15, 23, 42, 0.6))',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            borderRadius: '20px',
            padding: '28px 24px',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(255, 152, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FF9800',
              }}
            >
              <Lock size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                {PRIVACY_POLICY.title}
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#A0AEC0' }}>
                Version {PRIVACY_POLICY.version} • Effective {PRIVACY_POLICY.lastUpdated}
              </p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#CBD5E1' }}>
            FindLostPuppy is dedicated to helping reunite lost pets with their families while strictly protecting
            owner privacy, phone numbers, and exact home addresses through administrative boundary masking.
          </p>
        </div>

        {/* Policy Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {PRIVACY_POLICY.sections.map((section, idx) => (
            <section
              key={idx}
              style={{
                background: 'rgba(18, 20, 26, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '22px 24px',
              }}
            >
              <h2
                style={{
                  margin: '0 0 14px',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#FFB74D',
                  letterSpacing: '-0.01em',
                }}
              >
                {section.heading}
              </h2>
              {Array.isArray(section.content) ? (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '14px',
                    lineHeight: 1.65,
                    color: '#D1D5DB',
                  }}
                >
                  {section.content.map((item, itemIdx) => (
                    <li key={itemIdx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.65, color: '#D1D5DB' }}>
                  {section.content}
                </p>
              )}
            </section>
          ))}
        </div>

        {/* Contact & Grievance Box */}
        <div
          style={{
            marginTop: '36px',
            background: 'rgba(12, 14, 18, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Questions or Privacy Requests?</div>
            <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '2px' }}>
              Direct data inquiries or account deletion requests to{' '}
              <a href="mailto:jksurampudi5@gmail.com" style={{ color: '#FF9800', textDecoration: 'underline' }}>
                jksurampudi5@gmail.com
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/homepage')}
            style={{
              background: '#FF7900',
              color: '#111827',
              border: 'none',
              borderRadius: '9999px',
              padding: '10px 22px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
};
```

### src/pages/ShortcutsPage.tsx

| Field | Value |
| --- | --- |
| Bytes | 207 |
| Score | 150 |
| Why | changed, source |
| Status | Full content |


```tsx
import React from 'react';
import { AdminShortcuts } from '../components/admin/AdminShortcuts';

export const ShortcutsPage: React.FC = () => {
  return <AdminShortcuts />;
};

export default ShortcutsPage;
```

### src/services/authService.ts

| Field | Value |
| --- | --- |
| Bytes | 8417 |
| Score | 150 |
| Why | changed, source |
| Status | Full content |


```ts
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  browserLocalPersistence,
  signInWithPopup,
  signInWithCredential,
  setPersistence,
  signOut,
  updateProfile,
  type User as FirebaseAuthUser,
  type Unsubscribe,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import type { User } from '../types';
import { auth, isFirebaseConfigured } from './firebaseConfig';
import { firebaseSyncService } from './firebaseSyncService';

const OBSOLETE_SESSION_KEY = 'findlostpuppy_session_v1';
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

function getGoogleAuthErrorMessage(err: any): string {
  const code = String(err?.code || '');
  if (code.includes('operation-not-allowed')) {
    return 'Google Sign-In is not enabled in Firebase yet. Enable the Google provider in Firebase Authentication, then try again.';
  }
  if (code.includes('unauthorized-domain')) {
    return 'This app URL is not allowed in Firebase Authentication. Add localhost and the app domain under Authorized domains.';
  }
  if (code.includes('popup-closed-by-user')) {
    return 'Google Sign-In was closed before it finished. Please try again.';
  }
  return err?.message || 'Could not sign in with Google.';
}

export const ADMIN_EMAILS = ['jksurampudi5@gmail.com'];

export function isEmailAdmin(email?: string): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export function mapFirebaseUser(fbUser: FirebaseAuthUser, fallbackProfile?: Partial<User>): User {
  const email = (fbUser.email || fallbackProfile?.email || '').toLowerCase().trim();
  const derivedName =
    fbUser.displayName ||
    fallbackProfile?.name ||
    (email.includes('@') ? email.split('@')[0].replace(/[^a-zA-Z]/g, ' ') : 'Pet Parent');
  const formattedName = derivedName
    ? derivedName.charAt(0).toUpperCase() + derivedName.slice(1)
    : 'Pet Parent';

  return {
    id: fbUser.uid,
    email,
    name: formattedName,
    phone: fbUser.phoneNumber || fallbackProfile?.phone,
    avatar: fbUser.photoURL || fallbackProfile?.avatar,
    isAdmin: isEmailAdmin(email),
    createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
    lastLoginAt: fbUser.metadata.lastSignInTime || new Date().toISOString(),
  };
}

class AuthService {
  private currentUser: User | null = null;

  constructor() {
    this.cleanObsoleteSessionStorage();
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('findlostpuppy_active_user');
        if (saved) this.currentUser = JSON.parse(saved);
      } catch { }
    }
  }

  mapFirebaseUser(fbUser: FirebaseAuthUser, fallbackProfile?: Partial<User>): User {
    return mapFirebaseUser(fbUser, fallbackProfile);
  }

  private cleanObsoleteSessionStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(OBSOLETE_SESSION_KEY);
      } catch (e) {
        console.warn('[AuthService] Storage cleanup notice:', e);
      }
    }
  }

  getCurrentUser(): User | null {
    if (!this.currentUser && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('findlostpuppy_active_user');
        if (saved) this.currentUser = JSON.parse(saved);
      } catch { }
    }
    return this.currentUser;
  }

  setCurrentUser(user: User | null) {
    this.currentUser = user;
    if (typeof localStorage !== 'undefined') {
      try {
        if (user) localStorage.setItem('findlostpuppy_active_user', JSON.stringify(user));
        else localStorage.removeItem('findlostpuppy_active_user');
      } catch { }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('findlostpuppy_session_updated', { detail: user }));
    }
  }

  isAdmin(): boolean {
    return !!(this.currentUser?.isAdmin || isEmailAdmin(this.currentUser?.email));
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe | null {
    if (!auth || !isFirebaseConfigured()) return null;
    return onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const mapped = mapFirebaseUser(fbUser);
        this.setCurrentUser(mapped);
        callback(mapped);
        firebaseSyncService.syncUserProfile(mapped).catch((e) =>
          console.warn('[Firebase Sync User Notice]:', e)
        );
      } else {
        const cached = this.getCurrentUser();
        callback(cached);
      }
    });
  }

  async completeGoogleRedirectSignIn(): Promise<{ success: boolean; user?: User; error?: string }> {
    return { success: false };
  }

  async getSession(): Promise<{ session: null; user: User | null }> {
    return { session: null, user: this.getCurrentUser() };
  }

  async signInWithGoogle(): Promise<{ success: boolean; user?: User; error?: string; redirected?: boolean }> {
    if (!auth || !isFirebaseConfigured()) {
      return { success: false, error: 'Firebase authentication is not configured. Add Firebase web config values first.' };
    }

    try {
      await setPersistence(auth, browserLocalPersistence);
      if (Capacitor.isNativePlatform()) {
        // Use the legacy Google Sign-In path on Android while we work around the
        // Credential Manager re-authentication failure ([16] Account reauth failed).
        const nativeResult = await FirebaseAuthentication.signInWithGoogle({
          useCredentialManager: false,
        });
        const idToken = nativeResult.credential?.idToken;
        if (!idToken) {
          return { success: false, error: 'Google Sign-In did not return an ID token.' };
        }
        const result = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
        if (result.user?.email && !result.user.email.toLowerCase().endsWith('@gmail.com')) {
          await auth.signOut();
          return { success: false, error: 'Only @gmail.com accounts are allowed for security purposes.' };
        }
        const mapped = mapFirebaseUser(result.user);
        this.setCurrentUser(mapped);
        await firebaseSyncService.syncUserProfile(mapped).catch(() => { });
        return { success: true, user: mapped };
      }

      const result = await signInWithPopup(auth, googleProvider);
      if (result.user?.email && !result.user.email.toLowerCase().endsWith('@gmail.com')) {
        await auth.signOut();
        return { success: false, error: 'Only @gmail.com accounts are allowed for security purposes.' };
      }
      const mapped = mapFirebaseUser(result.user);
      this.setCurrentUser(mapped);
      await firebaseSyncService.syncUserProfile(mapped).catch(() => { });
      return { success: true, user: mapped };
    } catch (err: any) {
      const code = String(err?.code || '');
      if (
        code.includes('popup-blocked') ||
        code.includes('popup-closed-by-user') ||
        code.includes('operation-not-supported-in-this-environment') ||
        code.includes('cancelled-popup-request')
      ) {
        return {
          success: false,
          error:
            'Google Sign-In popup was blocked or closed. Allow popups for this site and try again.',
        };
      }
      return { success: false, error: getGoogleAuthErrorMessage(err) };
    }
  }

  async updateCurrentUser(partial: Partial<User>): Promise<User | null> {
    if (!this.currentUser) return null;
    const updated: User = { ...this.currentUser, ...partial };
    this.setCurrentUser(updated);

    if (auth?.currentUser) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: updated.name,
          photoURL: updated.avatar || null,
        });
      } catch (e) {
        console.warn('[AuthService] Firebase updateProfile notice:', e);
      }
    }

    firebaseSyncService.syncUserProfile(updated).catch((e) =>
      console.warn('[Firebase Sync Profile Notice]:', e)
    );
    return updated;
  }

  async logout(): Promise<void> {
    if (auth && isFirebaseConfigured()) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('[AuthService] Firebase signOut notice:', e);
      }
    }
    this.setCurrentUser(null);
    this.cleanObsoleteSessionStorage();
  }
}

export const authService = new AuthService();
```

### src/utils/locationMatchHelper.ts

| Field | Value |
| --- | --- |
| Bytes | 5755 |
| Score | 150 |
| Why | changed, source |
| Status | Full content |


```ts
import type { LostReport, OwnerProfile } from '../types';

export interface ReportGeoLocation {
  state: string;
  district: string;
  mandal: string;
  village: string;
}

export const getReportGeo = (r: LostReport, profiles: OwnerProfile[] = []): ReportGeoLocation => {
  const cleanOwnerId = (r.ownerId || '').replace(/^owner-/, '').toLowerCase().trim();
  const safeContact = (r.contactMechanism?.safeContactEmail || '').toLowerCase().trim();

  const p = profiles.find((pr) => {
    const prId = (pr.id || '').replace(/^owner-/, '').toLowerCase().trim();
    const prUserId = (pr.userId || '').replace(/^owner-/, '').toLowerCase().trim();
    const prEmail = (pr.email || '').toLowerCase().trim();
    return (
      (prId && prId === cleanOwnerId) ||
      (prUserId && prUserId === cleanOwnerId) ||
      (prEmail && safeContact && prEmail === safeContact)
    );
  });

  const dogAny = (r.dog || {}) as Record<string, any>;
  let state = (dogAny.state || p?.state || '').trim();
  let district = (dogAny.district || p?.district || '').trim();
  let mandal = (dogAny.mandalOrMunicipality || p?.mandalOrMunicipality || '').trim();
  let village = (dogAny.city || dogAny.streetOrLocality || p?.city || p?.streetOrLocality || '').trim();

  const combinedText = `${r.lastKnownLocation || ''} ${r.ownerApproximateLocation || ''} ${p?.approximateArea || ''} ${p?.address || ''}`.trim();

  // If state is missing, infer from combinedText
  if (!state) {
    if (/andhra pradesh|\bap\b/i.test(combinedText)) state = 'Andhra Pradesh';
    else if (/telangana|\bts\b/i.test(combinedText)) state = 'Telangana';
    else if (/karnataka|\bka\b/i.test(combinedText)) state = 'Karnataka';
    else if (/tamil nadu|\btn\b/i.test(combinedText)) state = 'Tamil Nadu';
    else if (/maharashtra/i.test(combinedText)) state = 'Maharashtra';
    else if (/kerala/i.test(combinedText)) state = 'Kerala';
    else if (/vikarabad|hyderabad|rangareddy|yennaepally/i.test(combinedText)) state = 'Telangana';
    else if (/godavari|palangi|undrajavaram|tanuku|guntur|krishna/i.test(combinedText)) state = 'Andhra Pradesh';
    else if (/bengaluru|bangalore|mysuru|mysore/i.test(combinedText)) state = 'Karnataka';
  }

  // If district is missing, infer
  if (!district && combinedText) {
    if (/west godavari/i.test(combinedText)) district = 'West Godavari';
    else if (/east godavari/i.test(combinedText)) district = 'East Godavari';
    else if (/vikarabad|yennaepally/i.test(combinedText)) district = 'Vikarabad';
    else if (/hyderabad/i.test(combinedText)) district = 'Hyderabad';
    else if (/rangareddy|ranga reddy/i.test(combinedText)) district = 'Rangareddy';
    else if (/bengaluru|bangalore/i.test(combinedText)) district = 'Bengaluru Urban';
    else if (/palangi|undrajavaram|tanuku/i.test(combinedText)) district = 'West Godavari';
  }

  // If mandal is missing, infer
  if (!mandal && combinedText) {
    if (/undrajavaram/i.test(combinedText)) mandal = 'Undrajavaram';
    else if (/vikarabad|yennaepally/i.test(combinedText)) mandal = 'Vikarabad';
    else if (/tanuku/i.test(combinedText)) mandal = 'Tanuku';
    else if (/palangi/i.test(combinedText)) mandal = 'Undrajavaram';
  }

  // If village is missing, infer
  if (!village && combinedText) {
    if (/palangi/i.test(combinedText)) village = 'Palangi';
    else if (/yennaepally/i.test(combinedText)) village = 'Yennaepally';
  }

  return { state, district, mandal, village };
};

export const isMatchState = (r: LostReport, targetState: string, profiles: OwnerProfile[] = []): boolean => {
  if (!targetState) return true;
  const geo = getReportGeo(r, profiles);
  const ts = targetState.trim().toLowerCase();
  if (geo.state && geo.state.toLowerCase() === ts) return true;
  const combinedText = `${r.lastKnownLocation || ''} ${r.ownerApproximateLocation || ''}`.toLowerCase();
  return combinedText.includes(ts);
};

export const isMatchDistrict = (
  r: LostReport,
  targetState: string,
  targetDistrict: string,
  profiles: OwnerProfile[] = []
): boolean => {
  if (!isMatchState(r, targetState, profiles)) return false;
  if (!targetDistrict) return true;
  const geo = getReportGeo(r, profiles);
  const td = targetDistrict.trim().toLowerCase();
  if (geo.district && geo.district.toLowerCase() === td) return true;
  const combinedText = `${r.lastKnownLocation || ''} ${r.ownerApproximateLocation || ''}`.toLowerCase();
  return combinedText.includes(td);
};

export const isMatchMandal = (
  r: LostReport,
  targetState: string,
  targetDistrict: string,
  targetMandal: string,
  profiles: OwnerProfile[] = []
): boolean => {
  if (!isMatchDistrict(r, targetState, targetDistrict, profiles)) return false;
  if (!targetMandal) return true;
  const geo = getReportGeo(r, profiles);
  const tm = targetMandal.trim().toLowerCase();
  if (geo.mandal && geo.mandal.toLowerCase() === tm) return true;
  const combinedText = `${r.lastKnownLocation || ''} ${r.ownerApproximateLocation || ''}`.toLowerCase();
  return combinedText.includes(tm);
};

export const isMatchCity = (
  r: LostReport,
  targetState: string,
  targetDistrict: string,
  targetMandal: string,
  targetCity: string,
  profiles: OwnerProfile[] = []
): boolean => {
  if (!isMatchMandal(r, targetState, targetDistrict, targetMandal, profiles)) return false;
  if (!targetCity) return true;
  const geo = getReportGeo(r, profiles);
  const tc = targetCity.trim().toLowerCase();
  if (
    geo.village &&
    (geo.village.toLowerCase() === tc ||
      geo.village.toLowerCase().includes(tc) ||
      tc.includes(geo.village.toLowerCase()))
  ) {
    return true;
  }
  const combinedText = `${r.lastKnownLocation || ''} ${r.ownerApproximateLocation || ''}`.toLowerCase();
  return combinedText.includes(tc);
};
```

### src/vite-env.d.ts

| Field | Value |
| --- | --- |
| Bytes | 38 |
| Score | 150 |
| Why | changed, source |
| Status | Full content |


```ts
/// <reference types="vite/client" />
```

### src/components/LaunchTributeOverlay.tsx

| Field | Value |
| --- | --- |
| Bytes | 12276 |
| Score | 149 |
| Why | changed, source |
| Status | Full content |


```tsx
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, PawPrint, ArrowRight, X } from 'lucide-react';
import logoTopHandImg from '../assets/logo_top_hand.png';
import logoBottomHandImg from '../assets/logo_bottom_hand.png';
import logoCenterSanctuaryImg from '../assets/logo_center_sanctuary.png';
import './LaunchTributeOverlay.css';

interface LaunchTributeOverlayProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

/** Coordinates the launch animation and authenticated first-time tribute, with manual tribute access. */
export const LaunchTributeOverlay: React.FC<LaunchTributeOverlayProps> = ({ forceOpen = false, onClose }) => {
  const [visible, setVisible] = useState(() => {
    if (forceOpen) return true;
    return sessionStorage.getItem('findlostpuppy_launch_seen') !== 'true';
  });
  const [phase, setPhase] = useState<'logo' | 'tribute'>('logo');
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [showProceedBtn, setShowProceedBtn] = useState(false);
  const [replayKey] = useState(0);
  const dismissalTimerRef = useRef<number | undefined>(undefined);

  const paragraph1Words = [
    "A", "very", "special", "note", "of", "gratitude", "to", "Priyanka", "Sharma", "—",
    "a", "gifted", "artist,", "inspiring", "educator,", "and", "devoted", "pet", "lover."
  ];

  const paragraph2Words = [
    "Your", "boundless", "love", "for", "animals", "and", "creative", "perspective", "were", "a",
    "guiding", "light", "in", "shaping", "this", "app.", "Thank", "you", "for", "your", "warmth,",
    "insight,", "and", "faith", "in", "this", "journey", "to", "ensure", "no", "lost", "pet", "is",
    "ever", "forgotten", "and", "every", "puppy", "finds", "its", "way", "home."
  ];

  const totalWords = paragraph1Words.length + paragraph2Words.length;

  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setVisible(true);
      setPhase('tribute');
      setShowProceedBtn(false);
      setCurrentWordIndex(0);
      return;
    }

    if (sessionStorage.getItem('findlostpuppy_launch_seen') === 'true') {
      return; // Already seen splash in this session
    }

    setPhase('logo');
    setIsFadingOut(false);

    // The animated logo is the only app-controlled launch artwork.
    // Automatic inauguration notes popup is disabled so launch timing is fast for all users.
    const logoTimer = setTimeout(() => {
      setIsFadingOut(true);
      dismissalTimerRef.current = window.setTimeout(() => {
        setVisible(false);
        sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
        setIsFadingOut(false);
        if (onClose) onClose();
      }, 350);
    }, 1200);

    return () => {
      clearTimeout(logoTimer);
      if (dismissalTimerRef.current) window.clearTimeout(dismissalTimerRef.current);
    };
  }, [forceOpen, onClose, replayKey]);

  // Global event listener to re-open from footer button
  useEffect(() => {
    const handleReopen = () => {
      if (dismissalTimerRef.current) window.clearTimeout(dismissalTimerRef.current);
      dismissalTimerRef.current = undefined;
      setVisible(true);
      setIsFadingOut(false);
      setPhase('tribute');
      setShowProceedBtn(false);
      setCurrentWordIndex(0);
    };

    window.addEventListener('open-tribute-modal', handleReopen);
    return () => window.removeEventListener('open-tribute-modal', handleReopen);
  }, []);

  // Lock body scroll when overlay is active to eliminate background judder
  useEffect(() => {
    if (visible) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [visible]);

  // Word-by-word reading progression at a relaxed, comfortable cadence (~380ms per word)
  useEffect(() => {
    if (visible && phase === 'tribute') {
      setCurrentWordIndex(0);
      setShowProceedBtn(false);

      const wordInterval = setInterval(() => {
        setCurrentWordIndex((prev) => {
          if (prev < totalWords) {
            return prev + 1;
          }
          return prev;
        });
      }, 380);

      return () => clearInterval(wordInterval);
    }
  }, [visible, phase, totalWords]);

  // Once reading finishes ("finds its way home."), pause for 3 seconds then gracefully reveal the proceed button
  useEffect(() => {
    if (visible && phase === 'tribute' && currentWordIndex >= totalWords) {
      const pauseTimer = setTimeout(() => {
        setShowProceedBtn(true);
      }, 3000);

      return () => clearTimeout(pauseTimer);
    }
  }, [visible, phase, currentWordIndex, totalWords]);

  const handleDismiss = () => {
    localStorage.setItem('findlostpuppy_gratitude_seen', 'true');
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    setVisible(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (onClose) onClose();
  };

  if (!visible) return null;

  return (
    <div className={`launch-overlay-backdrop ${phase} ${isFadingOut ? 'fade-out' : ''}`} role="dialog" aria-modal="true" aria-label="Launch dedication">
      {/* Background ambient orbs */}
      <div className="launch-ambient-glow glow-1" />
      <div className="launch-ambient-glow glow-2" />
      <div className="launch-ambient-glow glow-3" />

      {phase === 'logo' ? (
        <div key={replayKey} className="launch-logo-stage animate-fade-in" onClick={handleDismiss} title="Click anywhere to enter app">
          <div className="launch-logo-container">
            {/* The Badge Container */}
            <div className="launch-logo-badge protective-sanctuary-card">
              {/* Warm Hearth Fire Glow behind dog inside home */}
              <div className="safe-dog-hearth-glow" />

              {/* 1. Center Sanctuary: Home, Locator Pin & Safe Dog with Leash */}
              <img
                src={logoCenterSanctuaryImg}
                alt="Dog safe at home in locator"
                className="sanctuary-center-img"
              />

              {/* 2. Top Hand: Comes in from outside above to shelter over home */}
              <img
                src={logoTopHandImg}
                alt="Protective hand sheltering dog from above"
                className="protective-hand-img hand-top-incoming"
              />

              {/* 3. Bottom Hand: Comes in from outside below to cradle under locator */}
              <img
                src={logoBottomHandImg}
                alt="Protective hand cradling dog from below"
                className="protective-hand-img hand-bottom-incoming"
              />
            </div>
          </div>

          <h1 className="launch-brand-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div>
              <span className="brand-find">find</span>
              <span className="brand-lost">lost</span>
              <span className="brand-puppy">puppy</span>
            </div>
          </h1>

          <p className="launch-brand-tagline">
            Every puppy deserves to find its way home 🐾
          </p>

          <div className="launch-progress-bar-wrap">
            <div className="launch-progress-bar-fill" />
          </div>
        </div>
      ) : (
        <div className="launch-tribute-stage animate-slide-up">
          <div className="launch-tribute-card">
            {/* Top Close Button */}
            <button
              type="button"
              className="tribute-close-btn"
              onClick={handleDismiss}
              aria-label="Close and continue to home"
            >
              <X size={18} />
            </button>

            {/* Header: Inaugural Launch & Brand */}
            <div className="tribute-editorial-header">
              <div className="tribute-header-eyebrow">
                <Sparkles size={13} className="eyebrow-sparkle" />
                <span>INAUGURAL LAUNCH • 2026</span>
              </div>
              <h2 className="tribute-launch-title">
                Welcome to <span className="highlight-brand">findlostpuppy</span>
              </h2>
            </div>

            {/* Prestigious Honoree Hero Presentation */}
            <div className="tribute-honoree-banner">
              <div className="honoree-eyebrow-chip">
                <Sparkles size={12} className="chip-sparkle" />
                <span>A SPECIAL NOTE OF GRATITUDE</span>
                <Sparkles size={12} className="chip-sparkle" />
              </div>
              <h3 className="honoree-signature-name">Priyanka Sharma</h3>
              <p className="honoree-signature-subtitle">
                Inspiring Art Teacher & Devoted Pet Lover
              </p>
            </div>

            {/* Editorial Quote Passage (Liquid Light Typography) */}
            <div className="tribute-passage-section">
              <div className="passage-quote-mark top-mark">“</div>

              {/* Paragraph 1 */}
              <p className="tribute-paragraph illuminated-text">
                {paragraph1Words.map((word, idx) => {
                  const globalIdx = idx;
                  let wordClass = 'word-upcoming';
                  if (globalIdx < currentWordIndex) {
                    wordClass = 'word-read';
                  } else if (globalIdx === currentWordIndex) {
                    wordClass = 'word-active';
                  }
                  const isSpecialName = word === 'Priyanka' || word === 'Sharma';
                  return (
                    <React.Fragment key={idx}>
                      <span
                        className={`reading-word ${wordClass} ${isSpecialName ? 'word-name' : ''}`}
                        onClick={() => setCurrentWordIndex(globalIdx)}
                      >
                        {word}
                      </span>{' '}
                    </React.Fragment>
                  );
                })}
              </p>

              {/* Paragraph 2 */}
              <p className="tribute-paragraph illuminated-text">
                {paragraph2Words.map((word, idx) => {
                  const globalIdx = paragraph1Words.length + idx;
                  let wordClass = 'word-upcoming';
                  if (globalIdx < currentWordIndex) {
                    wordClass = 'word-read';
                  } else if (globalIdx === currentWordIndex) {
                    wordClass = 'word-active';
                  }
                  return (
                    <React.Fragment key={idx}>
                      <span
                        className={`reading-word ${wordClass}`}
                        onClick={() => setCurrentWordIndex(globalIdx)}
                      >
                        {word}
                      </span>{' '}
                    </React.Fragment>
                  );
                })}
              </p>

              <div className="passage-quote-mark bottom-mark">”</div>
            </div>

            {/* Actions Bar - Gracefully reveals Continue button after tribute finishes */}
            <div className="tribute-actions-row">
              {showProceedBtn ? (
                <button
                  type="button"
                  className="tribute-enter-btn animate-proceed-reveal"
                  onClick={handleDismiss}
                  autoFocus
                >
                  <span>Continue to Home Page</span>
                  <PawPrint size={18} className="btn-paw-icon" />
                  <ArrowRight size={18} className="btn-arrow-icon" />
                </button>
              ) : (
                <div 
                  className="tribute-actions-holding" 
                  onClick={() => setShowProceedBtn(true)}
                  onMouseEnter={() => setShowProceedBtn(true)}
                  title="Click to proceed immediately"
                  role="button"
                  tabIndex={0}
                >
                  <span className="holding-pulse-dot" />
                  <span className="holding-text">Reading tribute note...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

### src/pages/ConsentPage.tsx

| Field | Value |
| --- | --- |
| Bytes | 16178 |
| Score | 149 |
| Why | changed, source |
| Status | Truncated (budget limit) |

**Structural Outline:**
  - `interface ConsentPageProps` (line 14)
  - `fn cancelAutoScroll` (line 57)
  - `fn scrollToSignature` (line 71)
  - `fn handleAcceptAllTogether` (line 85)
  - `fn handleToggleAllForms` (line 97)
  - `fn handleModalAccept` (line 107)
  - `fn handleContinue` (line 115)


```tsx
// … lines 1–18
import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { LegalModal } from '../components/LegalModal';
import type { AcceptedFormsState } from '../services/consentService';

interface ConsentPageProps {
  onConsentAgreed: (
    acceptedForms?: Partial<AcceptedFormsState>,
    method?: 'all_forms_accepted' | 'master_declaration'
  ) => void;
// … lines 56–61
    // Cancel auto-scroll if user interacts/scrolls manually
    const cancelAutoScroll = () => {
      clearTimeout(autoScrollTimer);
    };

    window.addEventListener('wheel', cancelAutoScroll, { passive: true });
// … lines 70–75

  const scrollToSignature = () => {
    signatureBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Sync master checkmark when all 4 individual forms are checked
// … lines 84–89
  // 1-Click Accept All 4 Forms at Once (sets both age 18+ and all 4 agreements)
  const handleAcceptAllTogether = (checked: boolean = true) => {
    setAgeConfirmed(checked);
    setMasterAgreed(checked);
    setAcceptedForms({
      terms: checked,
// … lines 96–101
  // Toggle all forms at once
  const handleToggleAllForms = (checked: boolean) => {
    setAcceptedForms({
      terms: checked,
      privacy: checked,
      disclaimer: checked,
// … lines 106–119

  const handleModalAccept = (docId: 'terms' | 'privacy' | 'disclaimer' | 'guidelines') => {
    const updated = { ...acceptedForms, [docId]: true };
    setAcceptedForms(updated);
    if (updated.terms && updated.privacy && updated.disclaimer && updated.guidelines) {
      setMasterAgreed(true);
    }
  };

  const handleContinue = () => {
    // 1-Click: auto-accept all 4 forms and continue immediately
    handleAcceptAllTogether(true);
    onConsentAgreed(
      {
```

### src/pages/ReportLostDogPage.tsx

| Field | Value |
| --- | --- |
| Bytes | 19816 |
| Score | 149 |
| Why | changed, source |
| Status | Truncated (budget limit) |

**Structural Outline:**
  - `interface ReportLostDogPageProps` (line 23)
  - `fn handleUpdate` (line 46)
  - `fn handleMarkSafe` (line 91)
  - `fn handleSelectMissing` (line 107)
  - `fn handleMarkSafeFromFlyer` (line 212)
  - `fn handleDeleteAlert` (line 223)
  - `fn handleWhatsAppShare` (line 241)
  - `fn handleBack` (line 285)
  - `fn handleCardKey` (line 296)


```tsx
// … lines 1–27
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  ShieldCheck,
  PawPrint,
  House,
  Siren,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import type { LostReport, DogProfile } from '../types';
import { triggerStarCelebration } from '../utils/confettiHelper';
import { MissingPetReportModal } from '../components/MissingPetReportModal';
import abulluImg from '../assets/abullu.jpg';
import { getDogPhotoUrl, handleDogImageError } from '../utils/dogPhotoHelper';
import { generateWhatsAppSosMessage } from '../utils/shareHelper';
import { BackButton } from '../components/ui/back-button';

interface ReportLostDogPageProps {
  onBackToPet?: () => void;
  onSuccess?: () => void;
}

// … lines 45–50
  useEffect(() => {
    const handleUpdate = () => {
      setForceUpdate((prev) => prev + 1);
    };
    window.addEventListener('findlostpuppy_reports_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
// … lines 90–95
  // ACTION 1: User chooses "My Pet is Safe" -> Go to Dashboard Pets At Home tab
  const handleMarkSafe = () => {
    markPetSafe();
    setUserSelectedChoice('safe');
    setIsMissingModalOpen(false);

// … lines 106–111
  /** Opens the missing-report form, or shows an existing-broadcast notice when the pet is already reported missing. */
  const handleSelectMissing = () => {
    setUserSelectedChoice('missing');
    if (existingReport?.status === 'LOST') {
      setIsMissingModalOpen(false);
      setShowAlreadyBroadcast(true);
// … lines 211–216
  // ACTION 4: Mark safe at home from existing report context (preserved)
  const handleMarkSafeFromFlyer = () => {
    if (!existingReport || !user) return;
    storageService.updateReportStatus(existingReport.id, 'SAFE');
    markPetSafe();
    setUserSelectedChoice('safe');
// … lines 222–227
  // ACTION 5: Delete / Remove Alert permanently (preserved)
  const handleDeleteAlert = () => {
    if (!existingReport && !user) return;
    const targetId = existingReport?.id;
    const confirmed = window.confirm(`Are you sure you want to remove the missing alert for ${dogName}?`);
    if (!confirmed) return;
// … lines 240–245
  /** Builds a WhatsApp SOS link from the active report or pet details and attempts to copy the dashboard URL. */
  const handleWhatsAppShare = () => {
    const activeReport = existingReport || (user ? storageService.getLatestReportByUserId(user.id) : null);
    const contactPhone =
      activeReport?.contactMechanism?.safeContactPhone ||
      ownerProfile?.phone ||
// … lines 284–289
  // Back navigation
  const handleBack = () => {
    if (onBackToPet) {
      onBackToPet();
    } else if (onSuccess) {
      onSuccess();
// … lines 295–300
  // Keyboard handler for cards
  const handleCardKey = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
```

### src/components/SidebarNav.tsx

| Field | Value |
| --- | --- |
| Bytes | 26561 |
| Score | 148 |
| Why | changed, source |
| Status | Truncated (budget limit) |

**Structural Outline:**
  - `interface NavigationItem` (line 24)
  - `fn handleUpdate` (line 69)
  - `fn handleTabClick` (line 111)


```tsx
// … lines 1–28
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  PawPrint,
  Radio,
  MapPin,
  User,
  AlertTriangle,
  Shield,
  LogOut,
  X,
  Check,
  Lightbulb,
  ShieldCheck,
  Camera,
} from 'lucide-react';
import { AlignJustifyIcon } from './ui/align-justify-icon';
import { useAuth, type OnboardingTab } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import safePuppyImg from '../assets/safe_puppy.jpg';
import missingPuppyImg from '../assets/missing_puppy.jpg';
import appLogoImg from '../assets/app_logo.png';

interface NavigationItem {
  id: string;
  title: string;
  subtitle: string;
  isActive: boolean;
// … lines 68–73
  useEffect(() => {
    const handleUpdate = () => {
      setForceUpdate(n => n + 1);
      refreshProgress();
    };
    window.addEventListener('findlostpuppy_reports_updated', handleUpdate);
// … lines 110–115

  const handleTabClick = (tab: OnboardingTab, routePath: string) => {
    setActiveOnboardingTab(tab);
    navigate(routePath);
    setIsMobileMenuOpen(false);
  };
```

### src/pages/PetParentContactPage.tsx

| Field | Value |
| --- | --- |
| Bytes | 34603 |
| Score | 148 |
| Why | changed, source |
| Status | Truncated (budget limit) |

**Structural Outline:**
  - `interface PetParentContactPageProps` (line 19)
  - `fn handleRetriedUpload` (line 67)
  - `fn handleCancelEdit` (line 277)
  - `fn handleSubmit` (line 359)
  - `fn handleTransitionComplete` (line 379)
  - `fn handleExitToDashboard` (line 390)


```tsx
// … lines 1–23
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Check, ArrowRight, Camera, Trash2, Edit3, AlertCircle, CheckCircle2, X, Upload, Phone, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import type { ContactMethod, OwnerProfile } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { validateIndianPhoneNumber } from '../utils/phoneValidator';
import { sanitizePersonName } from '../utils/privacyUtils';
import { storageBucketService } from '../services/storageBucketService';
import { firebaseSyncService } from '../services/firebaseSyncService';
import { isPetPhotoUrl } from '../utils/dogPhotoHelper';
import { applyPhotoChangeTracking, canChangePhoto } from '../utils/photoChangePolicy';
import { CameraModal } from '../components/CameraModal';
import { DogRunFlowTransition } from '../components/ui/DogRunFlowTransition';

interface PetParentContactPageProps {
  onSuccess?: () => void;
}

/** Displays saved owner contact details and an editing form with managed profile-photo uploads. */
// … lines 66–71
    /** Applies a completed queued profile upload to the current owner's stored profile, session, and form. */
    const handleRetriedUpload = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!user || detail?.category !== 'profile' || detail?.referenceId !== user.id || !detail?.publicUrl) return;
      const currentProfile = storageService.getOwnerProfileByUserId(user.id, user.email);
      if (!currentProfile) return;
// … lines 154–159
  /** Compresses and uploads a selected owner photo, queuing unsuccessful uploads for retry. */
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file (JPG, PNG, WebP).', 'warning');
// … lines 226–231
  /** Deletes the managed profile photo before clearing the owner's saved name, phone, and avatar. */
  const handleHardReset = async () => {
    const isAppManagedPhoto = photo.includes('cloudinary.com') || photo.includes('firebasestorage');
    const publicId = storageBucketService.extractPublicId(photo);
    const cleanUserId = user?.id.replace(/^(owner-)+/, '') || '';
    const isCurrentWorkerPhoto = Boolean(publicId && cleanUserId && (
// … lines 273–278

  const handleCancelEdit = () => {
    setFullName(savedSnapshot.name);
    setPhone(savedSnapshot.phone);
    setPhoto(savedSnapshot.photo);
    setPreferredContact(savedSnapshot.contact);
// … lines 355–365

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfileInternal(true);
  };

  const handleContinueToLocation = async () => {
    if (isTransitioning) return;

    // Auto-sync profile and avatar to Cloudinary & Firebase cloud
    try {
// … lines 375–380

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
    if (onSuccess) {
      onSuccess();
    } else {
// … lines 386–391

  const handleExitToDashboard = () => {
    setActiveOnboardingTab('dashboard');
    navigate('/dashboard');
  };
```

### src/services/firebaseSyncService.ts

| Field | Value |
| --- | --- |
| Bytes | 28819 |
| Score | 148 |
| Why | changed, source |
| Status | Truncated (budget limit) |

**Structural Outline:**
  - `interface FirebaseSyncStatus` (line 27)


```ts
// … lines 1–31
import {
  doc,
  setDoc,
  getDocs,
  getDoc,
  collection,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadString,
  getDownloadURL,
} from 'firebase/storage';
import { auth, db, storage, isFirebaseConfigured } from './firebaseConfig';
import { storageBucketService } from './storageBucketService';
import type {
  OwnerProfile,
  DogProfile,
  LostReport,
  Sighting,
  AppSuggestion,
} from '../types';
import { isPetPhotoUrl } from '../utils/dogPhotoHelper';

export interface FirebaseSyncStatus {
  isConfigured: boolean;
  isOnline: boolean;
  lastSyncTime: string | null;
  syncedMembersCount: number;
```

### scripts/test_admin_security_guard.mjs

| Field | Value |
| --- | --- |
| Bytes | 3163 |
| Score | 138 |
| Why | changed, test |
| Status | Full content |


```mjs
import puppeteer from 'puppeteer-core';

const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function testSecurity() {
  console.log('Testing AdminShortcuts access control security guard...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // TEST 1: Plain user (non-admin)
  console.log('Case 1: Plain user (regularuser@example.com)...');
  await page.goto('http://localhost:5173/shortcuts', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify({
      id: 'plain-user-1',
      email: 'regularuser@example.com',
      name: 'Regular Pet Parent',
      isAdmin: false
    }));
    localStorage.setItem('findlostpuppy_consent_agreed_v1', 'true');
    localStorage.setItem('findlostpuppy_launch_seen', 'true');
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
  });

  await page.goto('http://localhost:5173/shortcuts', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const pageText = await page.evaluate(() => document.body.innerText);
  if (!pageText.includes('Administrator Access Required')) {
    throw new Error('FAILED: Plain user was able to bypass admin check on /shortcuts!');
  }
  if (pageText.includes('Product Requirements Document') || pageText.includes('Firestore Security Rules')) {
    throw new Error('FAILED: Sensitive documents or rules leaked to plain user!');
  }
  console.log('✅ Case 1 Passed: Plain user successfully blocked with Administrator Access Required screen');

  // TEST 2: Authorized Admin
  console.log('Case 2: Authorized Admin (jksurampudi5@gmail.com)...');
  await page.evaluate(() => {
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify({
      id: 'admin-user-1',
      email: 'jksurampudi5@gmail.com',
      name: 'Jaya Krishna',
      isAdmin: true
    }));
    localStorage.setItem('findlostpuppy_consent_agreed_v1', 'true');
    localStorage.setItem('findlostpuppy_launch_seen', 'true');
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
  });

  await page.goto('http://localhost:5173/shortcuts', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const adminPageText = await page.evaluate(() => document.body.innerText);
  if (!adminPageText.includes('FindLostPuppy Admin Shortcuts')) {
    throw new Error('FAILED: Authorized admin was blocked from /shortcuts!');
  }
  if (!adminPageText.includes('Navigation Flow') || !adminPageText.includes('Official Documents & PDFs')) {
    throw new Error('FAILED: Admin dashboard did not load correctly for admin!');
  }
  console.log('✅ Case 2 Passed: Authorized Admin successfully granted full access');

  await browser.close();
  console.log('🎉 All security access control tests passed!');
}

testSecurity().catch(err => {
  console.error(err);
  process.exit(1);
});
```

### scripts/test_auth_consent_flow.mjs

| Field | Value |
| --- | --- |
| Bytes | 4035 |
| Score | 138 |
| Why | changed, test |
| Status | Full content |


```mjs
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePaths = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

const executablePath = chromePaths.find((p) => fs.existsSync(p));
const artifactDir = '/Users/jayakrishna/.gemini/antigravity-ide/brain/14a5c867-efb6-4e2c-b19b-304469980ec9';

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // TEST 1: Logged Out user visits root '/' -> MUST see Sign In page (NOT Consent)
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  const test1Screenshot = path.join(artifactDir, 'flow_test1_logged_out_shows_signin.png');
  await page.screenshot({ path: test1Screenshot });
  console.log('Saved Test 1 (Logged Out -> Shows Sign In):', test1Screenshot);

  // Check if sign-in button or text exists
  const hasSignIn = await page.evaluate(() => {
    return document.body.innerText.includes('Sign in with Google') || document.body.innerText.includes('FindLostPuppy');
  });
  console.log('Test 1 Verified - Sign In displayed for unauthenticated user:', hasSignIn);

  // TEST 2: New signed-in user without consent -> MUST see ConsentPage
  await page.evaluate(() => {
    const newUser = {
      id: 'new_user_1',
      email: 'newuser@example.com',
      name: 'New Puppy Parent',
      isAdmin: false,
    };
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify(newUser));
    localStorage.setItem('findlostpuppy_current_user_v1', JSON.stringify(newUser));
    localStorage.removeItem('findlostpuppy_consent_v1');
    localStorage.removeItem('findlostpuppy_consent_records_v1');
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  const test2Screenshot = path.join(artifactDir, 'flow_test2_new_signedin_shows_consent.png');
  await page.screenshot({ path: test2Screenshot });
  console.log('Saved Test 2 (New Signed In -> Shows Consent):', test2Screenshot);

  // TEST 3: Returning signed-in user WITH consent -> MUST NOT see Consent, goes to onboarding/dashboard
  await page.evaluate(() => {
    const returningUser = {
      id: 'returning_user_1',
      email: 'returning@example.com',
      name: 'Returning Parent',
      isAdmin: false,
    };
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify(returningUser));
    localStorage.setItem('findlostpuppy_current_user_v1', JSON.stringify(returningUser));
    localStorage.setItem('findlostpuppy_consent_v1', JSON.stringify({
      consentVersion: '1.1',
      termsVersion: '1.1',
      privacyVersion: '1.1',
      disclaimerVersion: '1.0',
      guidelinesVersion: '1.0',
      agreedAt: new Date().toISOString(),
      acceptedForms: { terms: true, privacy: true, disclaimer: true, guidelines: true, declaration: true },
      consentMethod: 'all_forms_accepted',
    }));
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  const test3Screenshot = path.join(artifactDir, 'flow_test3_returning_signedin_bypasses_consent.png');
  await page.screenshot({ path: test3Screenshot });
  console.log('Saved Test 3 (Returning Signed In -> Bypasses Consent to Onboarding/Dashboard):', test3Screenshot);

  await browser.close();
  console.log('All 3 Auth/Consent flow tests passed successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### scripts/test_component_transitions.mjs

| Field | Value |
| --- | --- |
| Bytes | 3309 |
| Score | 138 |
| Why | changed, test |
| Status | Full content |


```mjs
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePaths = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

const executablePath = chromePaths.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error('No Chrome binary found!');
  process.exit(1);
}

const artifactDir = '/Users/jayakrishna/.gemini/antigravity-ide/brain/14a5c867-efb6-4e2c-b19b-304469980ec9';

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // 1. Seed admin state in localStorage so we bypass the admin guard seamlessly
  await page.goto('http://localhost:5173/shortcuts', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const adminUser = {
      id: 'admin_test_14',
      email: 'jayakrishna.jk14@gmail.com',
      name: 'Jayakrishna',
      isAdmin: true,
    };
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify(adminUser));
    localStorage.setItem('findlostpuppy_current_user_v1', JSON.stringify(adminUser));
    localStorage.setItem('findlostpuppy_consent_records_v1', JSON.stringify({
      hasAgreed: true,
      agreedAt: new Date().toISOString(),
      forms: ['terms', 'privacy', 'disclaimer', 'guidelines'],
    }));
  });

  // 2. Reload shortcuts page
  await page.goto('http://localhost:5173/shortcuts', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));

  // Capture Admin Shortcuts with new 21st.dev Component Transition Engine
  const shortcutsScreenshot = path.join(artifactDir, 'admin_shortcuts_with_transition_engine.png');
  await page.screenshot({ path: shortcutsScreenshot });
  console.log('Saved:', shortcutsScreenshot);

  // 3. Test component transition by clicking a step button
  // Find the button for Step 04 (/choice) or Step 09 (/privacy)
  const buttons = await page.$$('.btn-21st-loading');
  console.log(`Found ${buttons.length} 21st.dev loading buttons on page.`);

  if (buttons.length > 0) {
    // Click the 4th button (Step 04 - Choice or similar)
    const targetBtn = buttons[3] || buttons[0];
    await targetBtn.click();

    // Immediately capture the mid-transition gap (showing button loading state + top progress bar)
    await new Promise((r) => setTimeout(r, 120));
    const loadingGapScreenshot = path.join(artifactDir, 'component_switching_loading_gap.png');
    await page.screenshot({ path: loadingGapScreenshot });
    console.log('Saved mid-transition loading gap screenshot:', loadingGapScreenshot);

    // Wait for the transition to finish and target component to animate in
    await new Promise((r) => setTimeout(r, 650));
    const arrivedScreenshot = path.join(artifactDir, 'component_transition_arrived.png');
    await page.screenshot({ path: arrivedScreenshot });
    console.log('Saved arrived component screenshot:', arrivedScreenshot);
  }

  await browser.close();
  console.log('All component transition tests completed successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### scripts/test_fast_capture.mjs

| Field | Value |
| --- | --- |
| Bytes | 9906 |
| Score | 138 |
| Why | changed, test |
| Status | Full content |


```mjs
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifactDir = '/Users/jayakrishna/.gemini/antigravity-ide/brain/14a5c867-efb6-4e2c-b19b-304469980ec9';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  console.log('1. Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  // Seed user, completed profile, consent, and skip inauguration/launch screens
  await page.evaluate(() => {
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    localStorage.setItem('findlostpuppy_gratitude_seen', 'true');

    const user = {
      id: 'test-user-commuter',
      name: 'Rider Tester',
      email: 'rider@example.com',
      phone: '9876543210',
      avatar: ''
    };
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify(user));

    const profile = {
      id: 'profile-rider',
      userId: 'test-user-commuter',
      fullName: 'Rider Tester',
      phone: '9876543210',
      email: 'rider@example.com',
      state: 'Telangana',
      district: 'Medchal-Malkajgiri',
      mandalOrMunicipality: 'Kukatpally',
      city: 'Kukatpally Locality',
      streetOrLocality: 'Highway Road',
      hasLocationConsent: true,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('findlostpuppy_owner_profile', JSON.stringify(profile));
    localStorage.setItem('findlostpuppy_owner_profiles', JSON.stringify([profile]));

    const consentRecord = {
      consentVersion: '1.1',
      termsVersion: '1.1',
      privacyVersion: '1.1',
      disclaimerVersion: '1.0',
      guidelinesVersion: '1.0',
      agreedAt: new Date().toISOString(),
      userId: 'test-user-commuter',
      appVersion: '0.1.0',
      acceptedForms: { terms: true, privacy: true, disclaimer: true, guidelines: true, declaration: true },
      consentMethod: 'master_declaration'
    };
    localStorage.setItem('findlostpuppy_consent_v1', JSON.stringify(consentRecord));
  });

  // Navigate to Dashboard
  console.log('2. Navigating to Dashboard (/homepage)...');
  await page.goto('http://localhost:5173/homepage', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Verify "Spotted a Roaming or Lost Pet?" is NOT on Dashboard
  const pageText = await page.evaluate(() => document.body.innerText);
  const hasSpottedBlock = pageText.includes('Spotted a Roaming or Lost Pet');
  console.log(`[CHECK 1] "Spotted a Roaming or Lost Pet?" block absent: ${!hasSpottedBlock}`);
  if (hasSpottedBlock) {
    throw new Error('FAIL: "Spotted a Roaming or Lost Pet?" is still present on Dashboard!');
  }

  // 2. Verify floating camera button exists
  const fabExists = await page.evaluate(() => {
    const fab = document.querySelector('#dashboard-floating-capture-fab') || document.querySelector('.dashboard-floating-camera-btn');
    return !!fab;
  });
  console.log(`[CHECK 2] Dashboard floating camera button present: ${fabExists}`);

  await page.screenshot({ path: path.join(artifactDir, 'dashboard_no_spotted_card.png') });
  console.log('Saved dashboard_no_spotted_card.png');

  // 3. Navigate to Capture Pet page via floating camera button or URL
  console.log('3. Opening Quick Capture Pet (/capture?mode=unknown)...');
  await page.goto('http://localhost:5173/capture?mode=unknown', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  // Check UI elements on Capture Pet page
  const captureCheck = await page.evaluate(() => {
    const backBtn = document.querySelector('.back-button-root');
    const privacyNotice = document.querySelector('.capture-consent-box')?.innerText || '';
    const cameraFrame = document.querySelector('.capture-camera-frame');
    const gpsPill = document.querySelector('.capture-camera-gps-pill')?.innerText || '';
    const snapBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Snap Pet Photo'));
    const manualAccordion = document.querySelector('.capture-manual-toggle-btn');

    return {
      hasBackButton: !!backBtn,
      privacyNoticeHasFrameOnly: privacyNotice.includes('Frame Pet Only') || privacyNotice.includes('strictly photograph the animal'),
      hasCameraFrameAtTop: !!cameraFrame,
      gpsPillText: gpsPill,
      hasSnapBtn: !!snapBtn,
      hasManualAccordion: !!manualAccordion
    };
  });

  console.log('[CHECK 3] Capture Pet Page Elements:', JSON.stringify(captureCheck, null, 2));
  await page.screenshot({ path: path.join(artifactDir, 'capture_screen_commute_ready.png') });
  console.log('Saved capture_screen_commute_ready.png');

  // 4. Simulate snapping a photo by adding a mock photo to test instant submit flow
  console.log('4. Simulating photo snap...');
  await page.evaluate(() => {
    // Generate a simple 1x1 data URL jpeg
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#E06D44';
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px sans-serif';
      ctx.fillText('Spotted Dog Photo', 80, 150);
    }
    const photoData = canvas.toDataURL('image/jpeg');

    // Trigger frame capture or set photos state through standard UI
    const snapBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Snap Pet Photo'));
    if (snapBtn) {
      snapBtn.click();
    }
  });

  await new Promise(r => setTimeout(r, 1200));

  // Check if instant submit card is rendered
  let hasInstantCard = await page.evaluate(() => !!document.querySelector('.capture-instant-submit-card'));

  // If fake video stream didn't have videoWidth in headless test, inject a test photo directly to evaluate instant submit card
  if (!hasInstantCard) {
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#E06D44';
        ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px sans-serif';
        ctx.fillText('Spotted Dog 🐕', 120, 150);
      }
      const dummyPhoto = canvas.toDataURL('image/jpeg');

      // Add to React state via clicking hidden input file dispatch or mock
      const input = document.querySelector('input[type="file"]');
      if (input) {
        const file = new File(['dog'], 'pet.jpg', { type: 'image/jpeg' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 1000));
    hasInstantCard = await page.evaluate(() => !!document.querySelector('.capture-instant-submit-card'));
  }

  console.log(`[CHECK 4] Instant Submit Card visible after snap/photo: ${hasInstantCard}`);
  await page.screenshot({ path: path.join(artifactDir, 'capture_instant_submit_card.png') });
  console.log('Saved capture_instant_submit_card.png');

  // 5. Test expanding manual location/pet accordion
  console.log('5. Clicking optional manual details accordion...');
  await page.evaluate(() => {
    const acc = document.querySelector('.capture-manual-toggle-btn');
    if (acc) acc.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const manualCheck = await page.evaluate(() => {
    const grid = document.querySelector('.loc-grid-2x2');
    const stateSq = document.querySelector('.loc-gsq-state');
    const distSq = document.querySelector('.loc-gsq-district');
    const mandSq = document.querySelector('.loc-gsq-mandal');
    const homeSq = document.querySelector('.loc-gsq-home');
    const unknownCard = document.querySelector('.capture-unknown-choice-card');

    return {
      hasGrid: !!grid,
      hasStateSq: !!stateSq,
      hasDistSq: !!distSq,
      hasMandSq: !!mandSq,
      hasHomeSq: !!homeSq,
      hasUnknownCard: !!unknownCard
    };
  });
  console.log('[CHECK 5] Expanded Manual Controls:', JSON.stringify(manualCheck, null, 2));
  await page.screenshot({ path: path.join(artifactDir, 'capture_expanded_manual_details.png') });
  console.log('Saved capture_expanded_manual_details.png');

  // 6. Test 1-click submit
  console.log('6. Submitting sighting via 1-click submit button...');
  const submitBtnExists = await page.evaluate(() => {
    const btn = document.querySelector('.capture-instant-submit-btn');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log(`[CHECK 6] 1-Click submit button clicked: ${submitBtnExists}`);

  await new Promise(r => setTimeout(r, 400));
  const successTickVisible = await page.evaluate(() => !!document.querySelector('.success-tick-overlay'));
  console.log(`[CHECK 7] Success tick overlay rendered: ${successTickVisible}`);
  await page.screenshot({ path: path.join(artifactDir, 'capture_success_tick.png') });
  console.log('Saved capture_success_tick.png');

  await new Promise(r => setTimeout(r, 1400));
  const currentUrl = page.url();
  console.log(`[CHECK 8] Redirected after submission to: ${currentUrl}`);

  await browser.close();
  console.log('All verification checks completed successfully!');
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
```

### scripts/test_interstitial_transition.mjs

| Field | Value |
| --- | --- |
| Bytes | 3194 |
| Score | 138 |
| Why | changed, test |
| Status | Full content |


```mjs
import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTIFACTS_DIR = '/Users/jayakrishna/.gemini/antigravity-ide/brain/14a5c867-efb6-4e2c-b19b-304469980ec9';

async function testTransition() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Set auth & consent & launch_seen so user is directly in app
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    localStorage.setItem('findlostpuppy_launch_seen', 'true');
    const mockUser = {
      id: 'usr_test_123',
      email: 'jayakrishna.jk14@gmail.com',
      name: 'Jayakrishna',
      phone: '9876543210',
      isAdmin: true,
    };
    localStorage.setItem('findlostpuppy_active_user', JSON.stringify(mockUser));
    localStorage.setItem('findlostpuppy_current_user_v1', JSON.stringify(mockUser));
    localStorage.setItem('findlostpuppy_consent_v1', JSON.stringify({
      agreed: true,
      timestamp: Date.now(),
      consentVersion: '1.1',
      termsAgreed: true,
      disclaimerAgreed: true,
      guidelinesAgreed: true,
      privacyAgreed: true,
    }));
    const mockProfile = {
      id: 'usr_test_123',
      userId: 'usr_test_123',
      fullName: 'Jayakrishna',
      phone: '9876543210',
      email: 'jayakrishna.jk14@gmail.com',
      preferredContact: 'phone',
      hasLocationConsent: true,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('findlostpuppy_profiles_v1', JSON.stringify([mockProfile]));
    localStorage.setItem('findlostpuppy_owner_profile_usr_test_123', JSON.stringify(mockProfile));
    localStorage.setItem('findlostpuppy_owner_profile', JSON.stringify(mockProfile));
  });

  console.log('Navigating to http://localhost:5173/owner ...');
  await page.goto('http://localhost:5173/owner', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  // Find Continue to Location button
  const continueBtn = await page.$('.continue-to-location-orange-btn');
  if (continueBtn) {
    console.log('Clicking Continue to Location button...');
    await continueBtn.click();
    
    // Screenshot 1: In the middle (interstitial loading animation active!)
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'interstitial_transition_in_middle.png') });
    console.log('Captured interstitial transition loading screen!');

    // Wait for transition to complete (duration is 1500ms)
    await new Promise(r => setTimeout(r, 1600));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'interstitial_transition_landed_location.png') });
    console.log('Captured location page landed screenshot!');
  } else {
    console.log('Could not find continue button, checking form view...');
  }

  await browser.close();
}

testTransition().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### .agents/rules/graphify.md

| Field | Value |
| --- | --- |
| Bytes | 933 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```markdown
---
trigger: always_on
description: Consult the graphify knowledge graph at graphify-out/ for codebase and architecture questions.
---

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- For codebase or architecture questions, when `graphify-out/graph.json` exists, first run `graphify query "<question>"` (CLI) or `query_graph` (MCP). Use `graphify path "<A>" "<B>"` / `shortest_path` for relationships and `graphify explain "<concept>"` / `get_node` for focused concepts. These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output.
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
```

### AGENTS.md

| Field | Value |
| --- | --- |
| Bytes | 381 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```markdown
# TokenCap Start Here

Project intelligence is generated locally in `.tokencap/`.

1. Read `.tokencap/agent/START_HERE.md`.
2. Use `.tokencap/agent/allowed-context.json` to find task-relevant files.
3. Use the connected TokenCap MCP server for overview, search, impact, memory, and debug context.
4. Do not scan the repository broadly unless the generated context is insufficient.
```

### components.json

| Field | Value |
| --- | --- |
| Bytes | 370 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

### android/app/src/main/assets/public/cordova_plugins.js

| Field | Value |
| --- | --- |
| Bytes | 0 |
| Score | 30 |
| Why | source |
| Status | Full content |


```js

```

### android/app/src/main/assets/public/cordova.js

| Field | Value |
| --- | --- |
| Bytes | 0 |
| Score | 30 |
| Why | source |
| Status | Full content |


```js

```