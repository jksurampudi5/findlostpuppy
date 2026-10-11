<!-- TokenCap v1.6 Savings: baseline 6,348,818 tok → actual 30,805 tok (99.5% saved) -->
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
| Generated | 2026-10-11T13:33:46.304Z |
| Workspace | /Users/jayakrishna/Desktop/findlostpuppy/findlostpuppy |
| Profile | balanced |
| Selected files | 36 |
| Source bytes | 219985 |
| Estimated source tokens | 52388 |

## Read First

This file is a compressed coding-session handoff. Read it before editing, then inspect the referenced files directly. Prefer the live repository over this snapshot when there is a conflict.

## TokenCap Intelligence Files

- TOKENCAP_GRAPH.md — Project dependency and architecture graph *(JS/TS projects only)*
- TOKENCAP_MEMORY.md — Developer notes, current task, constraints, and context memory

## Handoff Summary

| Field | Value |
| --- | --- |
| Read order | .tokencap/agent/START_HERE.md > .tokencap/agent/architecture.md > android/app/src/main/java/com/findlostpuppy/app/DeviceSettingsPlugin.java > android/app/src/main/java/com/findlostpuppy/app/MainActivity.java > src/services/nativeSettingsService.ts |
| Primary anchors | .tokencap/agent/START_HERE.md, .tokencap/agent/architecture.md, android/app/src/main/java/com/findlostpuppy/app/DeviceSettingsPlugin.java |
| Changed files | 51 |
| TODO notes | 17 |
| File budget used | 40% |
| Source budget used | 100% |
| Token estimate | 52388 |
| Contents mode | enabled |

## Handoff Guidelines

- Preserve user changes; avoid reverting unrelated work.
- Start with changed files and files marked `high-signal` in the manifest.
- Treat the Git diff as intent and verify changes in source files.
- Update this snapshot after meaningful edits or before handing off.

## Git Snapshot

| Field | Value |
| --- | --- |
| Branch | main |
| Git root | /Users/jayakrishna/Desktop/findlostpuppy/findlostpuppy |

Recent commits:
```text
51954f9 chore(release): bump version to 45 (1.0.6) and add Cloudinary production fallbacks
529f061 Merge branch 'fixes' into main: unified location flow, CodeRabbit fixes, and owner photo reliability
388a6e1 Merge remote-tracking branch 'origin/main' into main (resolve Location.tsx conflicts)
de0ac3d fix(review): address CodeRabbit feedback on location flow, consent check, and navigation
9d38e2d feat(reliability): unified location flow, native dialog handling, and owner photo upload reliability
d124f3e Enforce mandatory owner photo, name, phone and block tab navigation until completed
3c2f2e7 feat(location): add in-app location enablement, permission modals, and fresh fix
333560c Merge branch 'fixes' - location detection platform-specific error handling
```

Status:
```text
 M .tokencap/agent/START_HERE.md
 M .tokencap/agent/agent-pack.md
 M .tokencap/agent/agent.json
 M .tokencap/agent/architecture.md
 M .tokencap/agent/context-manifest.json
 M .tokencap/agent/model-instructions.md
 M .tokencap/agent/review-rules.md
 M .tokencap/agent/risk-map.md
 M .tokencap/agent/rules.md
 M .tokencap/agent/skills.md
 M .tokencap/agent/tech-stack.md
 M .tokencap/brain/brain-index.json
 M .tokencap/brain/knowledge.json
 M .tokencap/constitution/compliance-rules.md
 M .tokencap/constitution/constitution-graph.html
 M .tokencap/constitution/constitution.json
 M .tokencap/constitution/constitution.md
 M .tokencap/constitution/constitution.yaml
 M .tokencap/constitution/critical-flows.md
 M .tokencap/constitution/security-boundaries.md
 M .tokencap/debug/notes.md
 M .tokencap/graph/summary.md
 M .tokencap/memory/current.md
 M .tokencap/memory/dev-notes.md
 M .tokencap/savings.json
 M .tokencap/snapshot.md
 M .tokencap/stats.json
 M android/app/src/main/java/com/findlostpuppy/app/DeviceSettingsPlugin.java
 M android/app/src/main/java/com/findlostpuppy/app/MainActivity.java
 M src/components/LocationPicker.tsx
 M src/hooks/useLocationDetection.ts
 M src/pages/Location.tsx
 M src/services/locationService.ts
 M src/services/nativeSettingsService.ts
 M src/utils/geolocationHelper.ts
?? .tokencap/constitution/constitution-history/constitution-2026-10-11.json
?? scripts/check_btn_state.mjs
?? scripts/check_webview_state.mjs
?? scripts/debug_runtime.mjs
?? scripts/get_logs.mjs
?? scripts/inspect_onclick.mjs
?? scripts/monitor_detection.mjs
?? scripts/step_test.mjs
?? scripts/test_apis.mjs
?? scripts/test_chunk.mjs
?? scripts/test_detect_cdp.mjs
?? scripts/test_device_settings.mjs
?? scripts/test_geo_in_webview.mjs
?? scripts/test_nominatim.mjs
?? scripts/test_plugins.mjs
?? scripts/trigger_and_listen.mjs
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
.mail-data.local/
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
graphify-out/2026-10-02/
graphify-out/2026-10-05/
graphify-out/2026-10-07/
graphify-out/2026-10-08/
graphify-out/2026-10-10/
graphify-out/2026-10-11/
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
.mail-data.local/state.json
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
.tokencap/constitution/constitution-history/constitution-2026-10-02.json
.tokencap/constitution/constitution-history/constitution-2026-10-11.json
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
... 568 more entries omitted
```

## File Manifest

| File | Bytes | Score | Why |
| --- | ---: | ---: | --- |
| .tokencap/agent/START_HERE.md | 1332 | 225 | changed, project-metadata, high-signal-doc |
| .tokencap/agent/architecture.md | 1511 | 155 | changed, high-signal-doc |
| android/app/src/main/java/com/findlostpuppy/app/DeviceSettingsPlugin.java | 9799 | 150 | changed, source |
| android/app/src/main/java/com/findlostpuppy/app/MainActivity.java | 770 | 150 | changed, source |
| src/services/nativeSettingsService.ts | 6099 | 150 | changed, source |
| src/hooks/useLocationDetection.ts | 16231 | 149 | changed, source |
| src/services/locationService.ts | 18343 | 149 | changed, source |
| src/components/LocationPicker.tsx | 29110 | 148 | changed, source |
| src/pages/Location.tsx | 43647 | 147 | changed, source |
| src/utils/geolocationHelper.ts | 37826 | 147 | changed, source |
| scripts/test_apis.mjs | 1733 | 138 | changed, test |
| scripts/test_chunk.mjs | 873 | 138 | changed, test |
| scripts/test_detect_cdp.mjs | 2017 | 138 | changed, test |
| scripts/test_device_settings.mjs | 956 | 138 | changed, test |
| scripts/test_geo_in_webview.mjs | 1034 | 138 | changed, test |
| scripts/test_nominatim.mjs | 1127 | 138 | changed, test |
| scripts/test_plugins.mjs | 1659 | 138 | changed, test |
| .tokencap/agent/agent-pack.md | 7990 | 120 | changed |
| .tokencap/agent/context-manifest.json | 5659 | 120 | changed |
| .tokencap/agent/model-instructions.md | 2517 | 120 | changed |
| .tokencap/agent/review-rules.md | 5473 | 120 | changed |
| .tokencap/agent/risk-map.md | 3352 | 120 | changed |
| .tokencap/agent/rules.md | 2107 | 120 | changed |
| .tokencap/agent/skills.md | 2052 | 120 | changed |
| .tokencap/agent/tech-stack.md | 654 | 120 | changed |
| .tokencap/constitution/compliance-rules.md | 2214 | 120 | changed |
| .tokencap/constitution/critical-flows.md | 1390 | 120 | changed |
| .tokencap/constitution/security-boundaries.md | 3964 | 120 | changed |
| .tokencap/debug/notes.md | 499 | 120 | changed |
| .tokencap/memory/current.md | 1432 | 120 | changed |
| .tokencap/memory/dev-notes.md | 2814 | 120 | changed |
| scripts/check_btn_state.mjs | 852 | 120 | changed |
| scripts/check_webview_state.mjs | 1303 | 120 | changed |
| scripts/debug_runtime.mjs | 1053 | 120 | changed |
| scripts/get_logs.mjs | 555 | 120 | changed |
| src/vite-env.d.ts | 38 | 30 | source |

## Changed Files

-  M .tokencap/agent/START_HERE.md
-  M .tokencap/agent/agent-pack.md
-  M .tokencap/agent/agent.json
-  M .tokencap/agent/architecture.md
-  M .tokencap/agent/context-manifest.json
-  M .tokencap/agent/model-instructions.md
-  M .tokencap/agent/review-rules.md
-  M .tokencap/agent/risk-map.md
-  M .tokencap/agent/rules.md
-  M .tokencap/agent/skills.md
-  M .tokencap/agent/tech-stack.md
-  M .tokencap/brain/brain-index.json
-  M .tokencap/brain/knowledge.json
-  M .tokencap/constitution/compliance-rules.md
-  M .tokencap/constitution/constitution-graph.html
-  M .tokencap/constitution/constitution.json
-  M .tokencap/constitution/constitution.md
-  M .tokencap/constitution/constitution.yaml
-  M .tokencap/constitution/critical-flows.md
-  M .tokencap/constitution/security-boundaries.md
-  M .tokencap/debug/notes.md
-  M .tokencap/graph/summary.md
-  M .tokencap/memory/current.md
-  M .tokencap/memory/dev-notes.md
-  M .tokencap/savings.json
-  M .tokencap/snapshot.md
-  M .tokencap/stats.json
-  M android/app/src/main/java/com/findlostpuppy/app/DeviceSettingsPlugin.java
-  M android/app/src/main/java/com/findlostpuppy/app/MainActivity.java
-  M src/components/LocationPicker.tsx
-  M src/hooks/useLocationDetection.ts
-  M src/pages/Location.tsx
-  M src/services/locationService.ts
-  M src/services/nativeSettingsService.ts
-  M src/utils/geolocationHelper.ts
- ?? .tokencap/constitution/constitution-history/constitution-2026-10-11.json
- ?? scripts/check_btn_state.mjs
- ?? scripts/check_webview_state.mjs
- ?? scripts/debug_runtime.mjs
- ?? scripts/get_logs.mjs
- ?? scripts/inspect_onclick.mjs
- ?? scripts/monitor_detection.mjs
- ?? scripts/step_test.mjs
- ?? scripts/test_apis.mjs
- ?? scripts/test_chunk.mjs
- ?? scripts/test_detect_cdp.mjs
- ?? scripts/test_device_settings.mjs
- ?? scripts/test_geo_in_webview.mjs
- ?? scripts/test_nominatim.mjs
- ?? scripts/test_plugins.mjs
- ?? scripts/trigger_and_listen.mjs

## Git Diff Snippets

### Unstaged Changes Diff

```diff
// … lines 1–55
diff --git a/.tokencap/agent/START_HERE.md b/.tokencap/agent/START_HERE.md
index 3939305..6699add 100644
--- a/.tokencap/agent/START_HERE.md
+++ b/.tokencap/agent/START_HERE.md
@@ -1,6 +1,6 @@
 # START HERE - findlostpuppy
 
-> Generated by TokenCap - 2026-10-02T04:45:29.738Z
+> Generated by TokenCap - 2026-10-11T06:39:23.730Z
 
 Project type: React + TypeScript
 Architecture: Component Layer -> Service Layer
@@ -15,7 +15,7 @@ Architecture: Component Layer -> Service Layer
 
 - [HIGH] Database - HIGH
 - [HIGH] Scripts (qa_lib) - HIGH
-- [HIGH] Unit (test_harness) - HIGH
+- [HIGH] Unit (test-support) - HIGH
 
 ## Review Groups
 
diff --git a/.tokencap/agent/agent-pack.md b/.tokencap/agent/agent-pack.md
index 36ca435..3cd7198 100644
--- a/.tokencap/agent/agent-pack.md
+++ b/.tokencap/agent/agent-pack.md
@@ -4,7 +4,7 @@
 > Paste this entire file into ChatGPT, Claude, Gemini, Cursor, Windsurf, Cline, Roo Code, or OpenHands
 > to give the AI agent full project intelligence before it touches any code.
 
-**Generated:** 2026-10-02T04:45:29.736Z
+**Generated:** 2026-10-11T06:39:23.729Z
 **Project:** findlostpuppy
 **Type:** React
 
@@ -25,7 +25,7 @@
 Component Layer -> Service Layer
 ```
 
-The import graph supports a **Component Layer -> Service Layer** flow. Observed imports: App.tsx -> storageService.ts; App.tsx -> consentService.ts; AuthContext.tsx -> authService.ts. **Testing** is the largest detected subsystem by file count. Detected subsystems: Unclassified, Testing, Pages (index), Components (legalContent), Services (AuthContext).
+The import graph supports a **Component Layer -> Service Layer** flow. Observed imports: App.tsx -> storageService.ts; App.tsx -> consentService.ts; App.tsx -> geoBlockService.ts. **Testing** is the largest detected subsystem by file count. Detected subsystems: Unclassified, Testing, Components (storageService), Components (legalContent), Components (ToastContext).
 
 ---
 
@@ -54,9 +54,9 @@ The import graph supports a **Component Layer -> Service Layer** flow. Observed
 - `src/utils/dogPhotoHelper.ts`
/* ↑ block repeated 3× (3 lines folded to 1) */
+- `scripts/unit/test-support.mjs`
 - `scripts/unit/test_harness.mjs`
-- `src/services/consentService.ts`
-- `src/utils/imageCompressor.ts`
+- `src/services/locationService.ts`
 
 ---
 
@@ -64,10 +64,10 @@ The import graph supports a **Component Layer -> Service Layer** flow. Observed
// … lines 3946–3951
++++ b/android/app/src/main/java/com/findlostpuppy/app/DeviceSettingsPlugin.java
+@@ -183,10 +183,20 @@ public class DeviceSettingsPlugin extends Plugin {
+             result.put("opened", true);
+             call.resolve(result);
+         } catch (Exception ex) {
+-            JSObject result = new JSObject();
// … lines 4267–4272
-       window.dispatchEvent(new CustomEvent('findlostpuppy_session_updated', { detail: user }));
-@@ -170,7 +170,7 @@ class AuthService {
-         }
-         const mapped = mapFirebaseUser(result.user);
-         this.setCurrentUser(mapped);
--        await firebaseSyncService.syncUserProfile(mapped).catch(() => {});
// … lines 5178–5183
 
-  const handleSubmit = async (e: React.FormEvent) => {
-    e.preventDefault();
+      if (attemptIdRef.current !== attemptId) return;
 
-    setIsSubmitting(true);
// … lines 5897–5902
+
+  const handleDistrictChange = (newDistrict: string) => {
+    setDistrict(newDistrict);
+    setMandalOrMunicipality('');
+    setCity('');
+    setPinCode('');
// … lines 6984–6989
+    @Override
+    public void onCreate(Bundle savedInstanceState) {
+        registerPlugin(DeviceSettingsPlugin.class);
+        super.onCreate(savedInstanceState);
+    }
+}
// … lines 8850–8855
-
-interface LaunchTributeOverlayProps {
-  forceOpen?: boolean;
-  onClose?: () => void;
-}
-
// … lines 9401–9406
-
-  const handleModalAccept = (docId: 'terms' | 'privacy' | 'disclaimer' | 'guidelines') => {
-    const updated = { ...acceptedForms, [docId]: true };
-    setAcceptedForms(updated);
-    if (updated.terms && updated.privacy && updated.disclaimer && updated.guidelines) {
-      setMasterAgreed(true);
// … lines 9662–9667
+    /** Shows the notice when cloud synchronization fails. */
+    const failed = () => setVisible(true);
+    /** Hides the notice when synchronized data becomes available. */
+    const recovered = () => {
+      setVisible(false);
+      setDismissed(false);
// … lines 10076–10081
+ */
+export function GeoBlockPage({ countryName, countryCode }: GeoBlockPageProps) {
+  const displayCountry = countryName || countryCode || 'your region';
 
-  const page = await browser.newPage();
-  await page.setViewport({ width: 1280, height: 900 });
// … lines 11641–11646
-4. Do not scan the repository broadly unless the generated context is insufficient.
+export function AlignJustifyIcon({ size = 24, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
+  return (
+    <svg width={size} height={size} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
+      <g fill="none" stroke="currentColor" strokeDasharray="8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
+        <path d="M12 5h6M12 5h-6">
// … lines 12178–12183
 
@@ -154,47 +192,64 @@ export function useLocationDetection({
 
     pendingSettingsReturnRef.current = null;
     const currentAttemptId = ++attemptIdRef.current;
+    isDetectingRef.current = true;
// … lines 13213–13218
       lng = pos.longitude;
@@ -739,34 +829,14 @@ export async function detectResilientLocation(options?: { allowIpFallback?: bool
     let subDistrictCode: number | undefined;
     let boundaryMatched = false;
 
-    // Authoritative Point-in-Polygon Boundary Lookup (Tier 1 GPS & Tier 2 Network)
// … lines 13252–13257
     const mergedMandal = nativeGeo?.mandal || webGeo?.mandal;
@@ -777,33 +847,49 @@ export async function detectResilientLocation(options?: { allowIpFallback?: bool
       ? 'nativegeocoder' + (webGeo ? `+${webGeo.provider}` : '')
       : (webGeo?.provider || 'none');
 
-    // AUTHORITY RULE for District + Mandal:

_Not shown (ask if needed): useLocationDetection, runTests, pause, click, not, DevelopmentErrorProbe, MainAppFlow, handleSubmit, handleContinue, EmailAuthPage, handleForwardTransitionComplete, handleTransitionComplete, StorageService, transform, DeviceSettingsPlugin … and 133 more._
```

## TODO / FIXME / HACK Notes

- .tokencap/memory/current.md:25 - .tokencap/memory/current.md:29:- No failing test output or TODO/FIXME markers detected.
- .tokencap/memory/current.md:26 - .tokencap/memory/dev-notes.md:27:- No failing test output or TODO/FIXME markers detected.
- .tokencap/memory/current.md:27 - .tokencap/snapshot.md:47:| TODO notes | 0 |
- .tokencap/memory/current.md:28 - .tokencap/snapshot.md:654:## TODO / FIXME / HACK Notes
- .tokencap/memory/current.md:29 - .tokencap/snapshot.md:656:No TODO/FIXME/HACK notes found in selected files.
- .tokencap/memory/dev-notes.md:27 - .tokencap/memory/current.md:25:- .tokencap/memory/current.md:29:- No failing test output or TODO/FIXME markers detected.
- .tokencap/memory/dev-notes.md:28 - .tokencap/memory/current.md:26:- .tokencap/memory/dev-notes.md:27:- No failing test output or TODO/FIXME markers detected.
- .tokencap/memory/dev-notes.md:29 - .tokencap/memory/current.md:27:- .tokencap/snapshot.md:47:| TODO notes | 0 |
- .tokencap/memory/dev-notes.md:30 - .tokencap/memory/current.md:28:- .tokencap/snapshot.md:654:## TODO / FIXME / HACK Notes
- .tokencap/memory/dev-notes.md:31 - .tokencap/memory/current.md:29:- .tokencap/snapshot.md:656:No TODO/FIXME/HACK notes found in selected files.
- .tokencap/memory/dev-notes.md:32 - .tokencap/memory/dev-notes.md:23:- .tokencap/memory/current.md:29:- No failing test output or TODO/FIXME markers detected.
- .tokencap/memory/dev-notes.md:33 - .tokencap/memory/dev-notes.md:24:- .tokencap/memory/dev-notes.md:27:- No failing test output or TODO/FIXME markers detected.
- .tokencap/memory/dev-notes.md:34 - .tokencap/memory/dev-notes.md:25:- .tokencap/snapshot.md:47:| TODO notes | 0 |
- .tokencap/memory/dev-notes.md:35 - .tokencap/memory/dev-notes.md:26:- .tokencap/snapshot.md:654:## TODO / FIXME / HACK Notes
- .tokencap/memory/dev-notes.md:36 - .tokencap/memory/dev-notes.md:27:- .tokencap/snapshot.md:656:No TODO/FIXME/HACK notes found in selected files.
- .tokencap/memory/dev-notes.md:37 - .tokencap/snapshot.md:47:| TODO notes | 0 |
- .tokencap/memory/dev-notes.md:38 - .tokencap/snapshot.md:654:## TODO / FIXME / HACK Notes

## Selected File Context

### .tokencap/agent/START_HERE.md

| Field | Value |
| --- | --- |
| Bytes | 1332 |
| Score | 225 |
| Why | changed, project-metadata, high-signal-doc |
| Status | Full content |


```markdown
# START HERE - findlostpuppy

> Generated by TokenCap - 2026-10-11T06:39:23.730Z

Project type: React + TypeScript
Architecture: Component Layer -> Service Layer

## Read in This Order

1. `allowed-context.json` - locate files for the current task.
2. `detail/index.md` - choose only the intelligence needed.
3. Use TokenCap MCP for overview, search, impact, memory, and debug context.

## Critical Areas

- [HIGH] Database - HIGH
- [HIGH] Scripts (qa_lib) - HIGH
- [HIGH] Unit (test-support) - HIGH

## Review Groups

- **Database Review Group**: schema-invariants.yaml, execute_media_migration.ts, execute_safe_migration_workflow.mjs
- **Scripts (qa_lib) Review Group**: qa_lib.mjs, test_consent_flow.mjs, capture_card_and_sighting.mjs

## Non-Negotiable Rules

- Business logic belongs in services
- Custom React hooks live in hooks/ - prefix with 'use'
- Shared utilities live in utils/ - keep them pure and side-effect free

## Detail Map

- `agent-pack.md`: full onboarding and architecture context
- `architecture.md`: dependency chains and boundaries
- `rules.md` and `review-rules.md`: conventions and review scope
- `risk-map.md`: high-risk files before editing
- `tech-stack.md` and `skills.md`: platform-specific context

Do not scan the repository broadly unless the generated context and MCP results are insufficient.
```

### .tokencap/agent/architecture.md

| Field | Value |
| --- | --- |
| Bytes | 1511 |
| Score | 155 |
| Why | changed, high-signal-doc |
| Status | Full content |


```markdown
# Architecture - findlostpuppy

> Generated by TokenCap v0.8 - 2026-10-11T06:39:23.728Z

---

## Overview

The import graph supports a **Component Layer -> Service Layer** flow. Observed imports: App.tsx -> storageService.ts; App.tsx -> consentService.ts; App.tsx -> geoBlockService.ts. **Testing** is the largest detected subsystem by file count. Detected subsystems: Unclassified, Testing, Components (storageService), Components (legalContent), Components (ToastContext).

---

## Architecture Pattern

```
Component Layer -> Service Layer
```

## Layers

1. **Component Layer**
2. **Service Layer**

## Evidence

The architecture pattern above is supported by these observed imports:

- `App.tsx -> storageService.ts`
- `App.tsx -> consentService.ts`
- `App.tsx -> geoBlockService.ts`

---

## Subsystems

| Cluster | Files | Risk | Central File |
| --- | --- | --- | --- |
| **Unclassified** | 143 | [LOW] LOW | `deploy.yml` |
| **Testing** | 34 | [LOW] LOW | `test_admin.cjs` |
| **Components (storageService)** | 23 | [HIGH] HIGH | `storageService.ts` |
| **Components (legalContent)** | 19 | [MEDIUM] MEDIUM | `legalContent.ts` |
| **Components (ToastContext)** | 16 | [HIGH] HIGH | `ToastContext.tsx` |
| **Pages (index)** | 16 | [HIGH] HIGH | `index.ts` |
| **Services** | 11 | [LOW] LOW | `generate_pdf.mjs` |
| **Frontend** | 11 | [LOW] LOW | `check_update_mail_ui.mjs` |
| **Scripts (qa_lib)** | 11 | [HIGH] HIGH | `qa_lib.mjs` |
| **Unit (test-support)** | 9 | [HIGH] HIGH | `test-support.mjs` |
```

### android/app/src/main/java/com/findlostpuppy/app/DeviceSettingsPlugin.java

| Field | Value |
| --- | --- |
| Bytes | 9799 |
| Score | 150 |
| Why | changed, source |
| Status | Full content |


```java
package com.findlostpuppy.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.IntentSender;
import android.location.LocationManager;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.common.api.ResolvableApiException;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.Priority;
import com.google.android.gms.location.SettingsClient;

@CapacitorPlugin(name = "DeviceSettings", requestCodes = {9207})
public class DeviceSettingsPlugin extends Plugin {

    public static final int REQUEST_CODE_ENABLE_LOCATION = 9207;
    private static PluginCall sPendingCall = null;

    public static void onLocationResolutionResult(int resultCode) {
        if (sPendingCall != null) {
            JSObject result = new JSObject();
            if (resultCode == Activity.RESULT_OK) {
                result.put("resolved", true);
                result.put("enabled", true);
                result.put("status", "enabled");
            } else if (resultCode == Activity.RESULT_CANCELED) {
                result.put("resolved", false);
                result.put("enabled", false);
                result.put("status", "cancelled");
            } else {
                result.put("resolved", false);
                result.put("enabled", false);
                result.put("status", "dismissed");
            }
            try {
                sPendingCall.resolve(result);
            } catch (Exception ignored) {}
            sPendingCall = null;
        }
    }

    private boolean isLocationEnabledInternal() {
        try {
            LocationManager locationManager = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            if (locationManager == null) {
                return false;
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                return locationManager.isLocationEnabled();
            } else {
                return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
                       locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
            }
        } catch (Exception e) {
            return false;
        }
    }

    @PluginMethod
    public void isLocationEnabled(PluginCall call) {
        try {
            boolean isEnabled = isLocationEnabledInternal();
            JSObject result = new JSObject();
            result.put("enabled", isEnabled);
            call.resolve(result);
        } catch (Exception ex) {
            JSObject fallback = new JSObject();
            fallback.put("enabled", false);
            call.resolve(fallback);
        }
    }

    @PluginMethod
    public void promptEnableLocation(PluginCall call) {
        try {
            if (isLocationEnabledInternal()) {
                JSObject result = new JSObject();
                result.put("resolved", true);
                result.put("enabled", true);
                result.put("alreadyEnabled", true);
                result.put("status", "already_enabled");
                call.resolve(result);
                return;
            }

            Activity activity = getActivity();
            if (activity == null || activity.isFinishing() || activity.isDestroyed()) {
                JSObject result = new JSObject();
                result.put("resolved", false);
                result.put("enabled", false);
                result.put("status", "unavailable");
                call.resolve(result);
                return;
            }

            LocationRequest locationRequest = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 10000L)
                    .setMinUpdateIntervalMillis(5000L)
                    .build();

            LocationSettingsRequest request = new LocationSettingsRequest.Builder()
                    .addLocationRequest(locationRequest)
                    .setAlwaysShow(true)
                    .build();

            SettingsClient client = LocationServices.getSettingsClient(activity);
            client.checkLocationSettings(request)
                    .addOnSuccessListener(response -> {
                        boolean enabled = isLocationEnabledInternal();
                        JSObject result = new JSObject();
                        result.put("resolved", true);
                        result.put("enabled", enabled);
                        result.put("alreadyEnabled", true);
                        result.put("status", enabled ? "already_enabled" : "failed_to_enable");
                        call.resolve(result);
                    })
                    .addOnFailureListener(exception -> {
                        if (exception instanceof ResolvableApiException) {
                            try {
                                PluginCall existingCall = getSavedCall();
                                if (existingCall != null) {
                                    JSObject cancelOld = new JSObject();
                                    cancelOld.put("resolved", false);
                                    cancelOld.put("enabled", false);
                                    cancelOld.put("status", "cancelled");
                                    existingCall.resolve(cancelOld);
                                    freeSavedCall();
                                }
                                sPendingCall = call;
                                saveCall(call);
                                ((ResolvableApiException) exception).startResolutionForResult(activity, REQUEST_CODE_ENABLE_LOCATION);
                            } catch (IntentSender.SendIntentException sendEx) {
                                sPendingCall = null;
                                freeSavedCall();
                                JSObject result = new JSObject();
                                result.put("resolved", false);
                                result.put("enabled", false);
                                result.put("status", "launch_failed");
                                call.resolve(result);
                            } catch (Exception ex) {
                                sPendingCall = null;
                                freeSavedCall();
                                JSObject result = new JSObject();
                                result.put("resolved", false);
                                result.put("enabled", false);
                                result.put("status", "launch_failed");
                                call.resolve(result);
                            }
                        } else {
                            JSObject result = new JSObject();
                            result.put("resolved", false);
                            result.put("enabled", false);
                            result.put("status", "unavailable");
                            call.resolve(result);
                        }
                    });
        } catch (Exception ex) {
            JSObject result = new JSObject();
            result.put("resolved", false);
            result.put("enabled", false);
            result.put("status", "error");
            call.resolve(result);
        }
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_CODE_ENABLE_LOCATION) {
            onLocationResolutionResult(resultCode);
            PluginCall savedCall = getSavedCall();
            if (savedCall != null) {
                freeSavedCall();
            }
        }
    }

    @PluginMethod
    public void openLocationSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);

            JSObject result = new JSObject();
            result.put("opened", true);
            call.resolve(result);
        } catch (Exception ex) {
            try {
                Intent fallback = new Intent(Settings.ACTION_SETTINGS);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(fallback);

                JSObject result = new JSObject();
                result.put("opened", true);
                call.resolve(result);
            } catch (Exception fallbackEx) {
                JSObject result = new JSObject();
                result.put("opened", false);
                result.put("error", ex.getMessage());
                call.resolve(result);
            }
        }
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(android.net.Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);

            JSObject result = new JSObject();
            result.put("opened", true);
            call.resolve(result);
        } catch (Exception ex) {
            JSObject result = new JSObject();
            result.put("opened", false);
            result.put("error", ex.getMessage());
            call.resolve(result);
        }
    }
}
```

### android/app/src/main/java/com/findlostpuppy/app/MainActivity.java

| Field | Value |
| --- | --- |
| Bytes | 770 |
| Score | 150 |
| Why | changed, source |
| Status | Full content |


```java
package com.findlostpuppy.app;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DeviceSettingsPlugin.class);
        super.onCreate(savedInstanceState);
        WebView.setWebContentsDebuggingEnabled(true);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == DeviceSettingsPlugin.REQUEST_CODE_ENABLE_LOCATION) {
            DeviceSettingsPlugin.onLocationResolutionResult(resultCode);
        }
    }
}
```

### src/services/nativeSettingsService.ts

| Field | Value |
| --- | --- |
| Bytes | 6099 |
| Score | 150 |
| Why | changed, source |
| Status | Full content |


```ts

import { Capacitor, registerPlugin } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export type PromptLocationStatus =
  | 'already_enabled'
  | 'enabled'
  | 'cancelled'
  | 'launch_failed'
  | 'unavailable'
  | 'failed_to_enable'
  | 'error';

export interface PromptLocationResult {
  resolved: boolean;
  enabled: boolean;
  status: PromptLocationStatus;
}

export type AppLocationPermissionStatus = 'granted' | 'approximate' | 'prompt' | 'denied';

interface DeviceSettingsPlugin {
  isLocationEnabled(): Promise<{ enabled: boolean }>;
  promptEnableLocation(): Promise<{
    resolved: boolean;
    enabled?: boolean;
    alreadyEnabled?: boolean;
    status?: PromptLocationStatus;
  }>;
  openLocationSettings(): Promise<{ opened: boolean; error?: string }>;
  openAppSettings(): Promise<{ opened: boolean; error?: string }>;
}

const DeviceSettings = registerPlugin<DeviceSettingsPlugin>('DeviceSettings');

/**
 * Checks whether device Location services (GPS master switch) are enabled.
 */
export async function isDeviceLocationEnabled(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return true; // Browser handles this via navigator.geolocation directly
  }

  try {
    const result = await DeviceSettings.isLocationEnabled();
    return Boolean(result?.enabled);
  } catch (error) {
    console.warn('[nativeSettingsService] Unable to check device location status:', error);
    return true;
  }
}

/**
 * Triggers Google Play Services in-app Location resolution dialog if disabled.
 * Settle with explicit status ('enabled', 'cancelled', 'unavailable', etc.).
 */
export async function promptEnableDeviceLocation(): Promise<PromptLocationResult> {
  if (!Capacitor.isNativePlatform()) {
    return { resolved: true, enabled: true, status: 'already_enabled' };
  }

  try {
    const alreadyOn = await isDeviceLocationEnabled();
    if (alreadyOn) {
      return { resolved: true, enabled: true, status: 'already_enabled' };
    }

    let pollTimer: any = null;
    const pollGpsPromise = new Promise<PromptLocationResult>((resolve) => {
      let checks = 0;
      pollTimer = setInterval(async () => {
        checks++;
        const enabled = await isDeviceLocationEnabled();
        if (enabled) {
          if (pollTimer) clearInterval(pollTimer);
          resolve({ resolved: true, enabled: true, status: 'enabled' });
        } else if (checks >= 40) { // 10 seconds (40 * 250ms)
          if (pollTimer) clearInterval(pollTimer);
          resolve({ resolved: false, enabled: false, status: 'cancelled' });
        }
      }, 250);
    });

    const nativePromise = (async (): Promise<PromptLocationResult> => {
      const result = await DeviceSettings.promptEnableLocation();
      const enabled = Boolean(result?.enabled || result?.alreadyEnabled);
      const status: PromptLocationStatus =
        (result?.status as PromptLocationStatus) || (enabled ? 'enabled' : 'unavailable');
      return {
        resolved: Boolean(result?.resolved),
        enabled,
        status,
      };
    })();

    const winner = await Promise.race([nativePromise, pollGpsPromise]);
    if (pollTimer) clearInterval(pollTimer);
    return winner;
  } catch (error) {
    console.warn('[nativeSettingsService] Unable to show Android Location enable dialog:', error);
    return { resolved: false, enabled: false, status: 'error' };
  }
}

/**
 * Opens native Android Location Source Settings.
 */
export async function openDeviceLocationSettings(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const result = await DeviceSettings.openLocationSettings();
    return Boolean(result?.opened);
  } catch (error) {
    console.warn('[nativeSettingsService] Unable to open device Location settings:', error);
    return false;
  }
}

/**
 * Opens native Android App Details Settings (to change runtime permissions).
 */
export async function openAppPermissionSettings(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const result = await DeviceSettings.openAppSettings();
    return Boolean(result?.opened);
  } catch (error) {
    console.warn('[nativeSettingsService] Unable to open app permission settings:', error);
    return false;
  }
}

/**
 * Accurately checks current app location permission state across platforms,
 * explicitly respecting approximate (coarse) permission.
 */
export async function checkAppLocationPermission(): Promise<AppLocationPermissionStatus> {
  if (!Capacitor.isNativePlatform()) {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      return 'prompt';
    }
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      if (status.state === 'granted') return 'granted';
      if (status.state === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'prompt';
    }
  }

  try {
    const perm = await Geolocation.checkPermissions();
    if (perm.location === 'granted') return 'granted';
    if (perm.coarseLocation === 'granted') return 'approximate';
    if (perm.location === 'denied' && perm.coarseLocation === 'denied') return 'denied';
    return 'prompt';
  } catch (error) {
    console.warn('[nativeSettingsService] checkPermissions error:', error);
    // If device location is disabled, some Android versions may throw: treat as prompt
    return 'prompt';
  }
}

/**
 * Prompts user for app location permission and returns resulting state.
 */
export async function requestAppLocationPermission(): Promise<AppLocationPermissionStatus> {
  if (!Capacitor.isNativePlatform()) {
    return 'prompt';
  }

  try {
    const req = await Geolocation.requestPermissions();
    if (req.location === 'granted') return 'granted';
    if (req.coarseLocation === 'granted') return 'approximate';
    if (req.location === 'denied' && req.coarseLocation === 'denied') return 'denied';
    return 'prompt';
  } catch (error) {
    console.warn('[nativeSettingsService] requestPermissions error:', error);
    return 'denied';
  }
}
```

### src/hooks/useLocationDetection.ts

| Field | Value |
| --- | --- |
| Bytes | 16231 |
| Score | 149 |
| Why | changed, source |
| Status | Truncated (budget limit) |

**Structural Outline:**
  - `interface LocationDetectionResult` (line 18)
  - `interface UseLocationDetectionOptions` (line 30)
  - `fn useLocationDetection` (line 36)
  - `fn onFocus` (line 396)
  - `fn onVisibilityChange` (line 399)


```ts
// … lines 1–22
import { useState, useRef, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import {
  isDeviceLocationEnabled,
  promptEnableDeviceLocation,
  openDeviceLocationSettings,
  openAppPermissionSettings,
  checkAppLocationPermission,
  requestAppLocationPermission,
  type AppLocationPermissionStatus,
} from '../services/nativeSettingsService';
import { detectResilientLocation, type LocationGeoResult, NativeLocationError } from '../utils/geolocationHelper';
import { locationService, type LocationMatchResult } from '../services/locationService';
import { normalizeToEnglishText } from '../utils/indicTransliteration';
import { useToast } from '../context/ToastContext';

export interface LocationDetectionResult {
  geo: LocationGeoResult;
  match: LocationMatchResult | null;
  detectedState: string;
  detectedDistrict: string;
// … lines 29–40

export interface UseLocationDetectionOptions {
  onSuccess: (result: LocationDetectionResult) => void;
  onError?: (error: any) => void;
  onClearFieldsForNewDetection?: () => void;
}

export function useLocationDetection({
  onSuccess,
  onError,
  onClearFieldsForNewDetection,
}: UseLocationDetectionOptions) {
// … lines 394–402
    } else {
      const onFocus = () => {
        if (isMounted) handleSettingsReturn();
      };
      const onVisibilityChange = () => {
        if (isMounted && document.visibilityState === 'visible') handleSettingsReturn();
      };

      window.addEventListener('focus', onFocus);
```

### src/services/locationService.ts

| Field | Value |
| --- | --- |
| Bytes | 18343 |
| Score | 149 |
| Why | changed, source |
| Status | Truncated (budget limit) |

**Structural Outline:**
  - `interface LocationMatchResult` (line 12)
  - `fn normalizeStem` (line 59)
  - `class LocationService` (line 72)


```ts
// … lines 1–20
import statesData from '../data/location/states.json';
import districtsData from '../data/location/districts.json';
import subdistrictsData from '../data/location/subdistricts.json';
import type {
  LocationState,
  LocationDistrict,
  LocationSubDistrict,
  LocationLocality,
} from '../types';
import { normalizeToEnglishText } from '../utils/indicTransliteration';

export interface LocationMatchResult {
  state: LocationState;
  district: LocationDistrict;
  subDistrict?: LocationSubDistrict;
  locality?: LocationLocality;
}

// Vite glob loader for code-split district locality files
const localityModules = import.meta.glob<LocationLocality[] | { default: LocationLocality[] }>(
// … lines 58–63

function normalizeStem(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/mandal|taluk|district|\(urban\)|\(rural\)|\(mdl\)/gi, '')
// … lines 71–76

class LocationService {
  private states: LocationState[] = statesData as LocationState[];
  private districts: LocationDistrict[] = districtsData as LocationDistrict[];
  private subdistricts: LocationSubDistrict[] = subdistrictsData as LocationSubDistrict[];
  private localityCache: Map<number, LocationLocality[]> = new Map();
```

### src/components/LocationPicker.tsx

| Field | Value |
| --- | --- |
| Bytes | 29110 |
| Score | 148 |
| Why | changed, source |
| Status | Truncated (budget limit) |

**Structural Outline:**
  - `interface LocationPickerProps` (line 24)
  - `fn handleStateChange` (line 223)
  - `fn handleDistrictChange` (line 232)
  - `fn handleMandalSelect` (line 240)
  - `fn handleCitySelect` (line 247)
  - `fn handleLocationDetected` (line 303)
  - `fn handleDetectClick` (line 403)
  - `fn handleConfirmLocation` (line 407)


```tsx
// … lines 1–28
import React, { useState, useMemo, useEffect } from 'react';
import {
  MapPin,
  ShieldCheck,
  Navigation,
  Lock,
  Crosshair,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Check,
  Building,
  Sparkles,
  Landmark,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { locationService } from '../services/locationService';
import { PermissionRationaleModal } from './PermissionRationaleModal';
import { useLocationDetection, type LocationDetectionResult } from '../hooks/useLocationDetection';
import { SearchableSelect, type SelectOption } from './SearchableSelect';
import type { LocationLocality } from '../types';

interface LocationPickerProps {
  state: string;
  district: string;
  city?: string;
  mandalOrMunicipality?: string;
// … lines 221–226
  // Cascading Selection Handlers with Strict Reset
  const handleStateChange = (newState: string) => {
    updateFields({
      state: newState,
      district: '',
      mandalOrMunicipality: '',
// … lines 230–257

  const handleDistrictChange = (newDistrict: string) => {
    updateFields({
      district: newDistrict,
      mandalOrMunicipality: '',
      city: '',
    });
  };

  const handleMandalSelect = (newMandal: string) => {
    updateFields({
      mandalOrMunicipality: newMandal,
      city: '',
    });
  };

  const handleCitySelect = (newCity: string) => {
    updateFields({
      city: newCity,
    });
  };

  // 6-digit PIN lookup
  const handlePinChange = async (pinValue: string) => {
    updateFields({ pinCode: pinValue });
    if (pinValue.trim().length === 6 && /^\d{6}$/.test(pinValue.trim())) {
      setLookingUpPin(true);
      try {
// … lines 299–304

  const handleLocationDetected = (result: LocationDetectionResult) => {
    const { geo, match, detectedState, detectedDistrict, detectedMandal, detectedCity, detectedStreet, detectedPin } = result;

    setAccuracyRadius(geo.accuracyMeters || (geo.source === 'gps' ? 20 : 100));

// … lines 396–405
  // Direct native location detector using shared robust flow
  const handleDetectClick = () => {
    triggerDetectLocation();
  };

  const handleConfirmLocation = () => {
    setIsConfirmed(true);
    setIsEditing(false);
    showToast('✓ Location confirmed!', 'success');
  };
```

### src/pages/Location.tsx

| Field | Value |
| --- | --- |
| Bytes | 43647 |
| Score | 147 |
| Why | changed, source |
| Status | Truncated (budget limit) |

**Structural Outline:**
  - `interface LocationProps` (line 28)
  - `fn handleUpdate` (line 47)
  - `fn cleanSavedStreet` (line 85)
  - `fn handleStateChange` (line 332)
  - `fn handleDistrictChange` (line 342)
  - `fn handleMandalSelect` (line 351)
  - `fn handleCitySelect` (line 360)
  - `fn handleProceedToPup` (line 739)
  - `fn handleForwardTransitionComplete` (line 749)
  - `fn handleBack` (line 760)
  - `fn handleBackTransitionComplete` (line 765)
  - `fn handleExitToDashboard` (line 776)


```tsx
// … lines 1–32
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Navigation,
  RefreshCw,
  Building,
  Building2,
  Home,
  MapPin,
  Landmark,
  Check,
  ArrowRight,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { locationService } from '../services/locationService';
import { PetProfileSelector, type SelectorOption } from '../components/PetProfileSelector';
import type { OwnerProfile, LocationLocality } from '../types';
import { isValidOwnerPhoto } from '../utils/dogPhotoHelper';
import { BackButton } from '../components/ui/back-button';
import { VillageDogTransition } from '../components/ui/VillageDogTransition';
import { PermissionRationaleModal } from '../components/PermissionRationaleModal';
import { normalizeToEnglishText, hasNonLatinScript } from '../utils/indicTransliteration';
import { useLocationDetection, type LocationDetectionResult } from '../hooks/useLocationDetection';

interface LocationProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

// … lines 46–51
  useEffect(() => {
    const handleUpdate = () => {
      setForceUpdate((prev) => prev + 1);
      refreshProgress();
    };
    window.addEventListener('findlostpuppy_reports_updated', handleUpdate);
// … lines 80–85
  /** Trims a saved street value, returning an empty string for missing values or leading Plus Codes, and normalizes Indic scripts to English. */
  const cleanSavedStreet = (v?: string) => {
    if (!v || PLUS_CODE_RE.test(v.trim())) return '';
    return normalizeToEnglishText(v.trim());
  };

// … lines 324–329
  // Cascading Selection Handlers with Strict Reset
  const handleStateChange = (newState: string) => {
    setState(newState);
    setDistrict('');
    setMandalOrMunicipality('');
    setCity('');
// … lines 334–339

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    setMandalOrMunicipality('');
    setCity('');
    setPinCode('');
// … lines 343–348

  const handleMandalSelect = (newMandal: string) => {
    setMandalOrMunicipality(newMandal);
    setCity('');
    setPinCode('');
    setLocalities([]);
// … lines 352–357
  /** Selects a locality, fills a missing street placeholder, closes the picker, and resolves its PIN code. */
  const handleCitySelect = (newCity: string) => {
    setCity(newCity);
    // Only auto-fill street if there is no human-readable street already
    // (and the existing value is not a Plus Code which we should treat as empty)
    const PLUS_CODE_RE = /^[A-Z0-9]{2,8}\+[A-Z0-9]{2,}/i;
// … lines 530–535

  const handleResetLocation = async () => {
    hasManuallyResetRef.current = true;
    cancelDetection();
    if (autoSyncTimerRef.current) {
      window.clearTimeout(autoSyncTimerRef.current);
// … lines 731–736

  const handleProceedToPup = () => {
    if (isTransitioningBack || isTransitioningForward) return;
    if (!isLocationValid) {
      showToast('Please select State, District, Mandal, and Home Base before continuing.', 'warning');
      return;
// … lines 741–746

  const handleForwardTransitionComplete = () => {
    setIsTransitioningForward(false);
    if (onSuccess) {
      onSuccess();
    } else {
// … lines 752–762

  const handleBack = () => {
    if (isTransitioningBack || isTransitioningForward) return;
    setIsTransitioningBack(true);
  };

  const handleBackTransitionComplete = () => {
    setIsTransitioningBack(false);
    if (onBack) {
      onBack();
    } else {
// … lines 768–773

  const handleExitToDashboard = () => {
    setActiveOnboardingTab('dashboard');
    navigate('/dashboard');
  };
```

### src/utils/geolocationHelper.ts

| Field | Value |
| --- | --- |
| Bytes | 37826 |
| Score | 147 |
| Why | changed, source |
| Status | Truncated (budget limit) |

**Structural Outline:**
  - `interface LocationDiagnostic` (line 19)
  - `interface LocationGeoResult` (line 62)
  - `interface CoordsResult` (line 84)
  - `class NativeLocationError` (line 92)
  - `fn printLocationDiagnostic` (line 108)
  - `fn getPositionWithConfig` (line 149)
  - `fn enrichWithPostalPin` (line 283)
  - `fn reverseGeocodeCoords` (line 376)
  - `fn getNativeGeocodedAddress` (line 536)
  - `fn fetchIpLocation` (line 704)
  - `fn detectResilientLocation` (line 757)


```ts
// … lines 1–23
/**
 * Resilient Multi-Tier Geolocation & Administrative Resolver for FindLostPuppy
 * 
 * Pipeline:
 * 1. Physical Device Location (Capacitor Native GPS / Fused Location or Browser Geolocation API)
 * 2. Accuracy Validation (thresholds: 0-20m Excellent, 20-50m Good, 50-100m Moderate, >100m Low)
 * 3. Authoritative Point-in-Polygon Administrative Boundary Containment (State -> District -> Mandal)
 * 4. Reverse Geocoding (Village / Locality & PIN) without overriding authoritative boundary polygons
 * 5. Smart Multi-Office Postal PIN Cross-Validation (scores candidate post offices)
 * 6. Confidence Model (HIGH, MEDIUM, LOW) & Transparent Diagnostics
 */
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { NativeGeocoder } from '@capgo/capacitor-nativegeocoder';
import { findMandalByCoordinates } from './boundaryLookup';
import { normalizeToEnglishText } from './indicTransliteration';
import subdistrictsData from '../data/location/subdistricts.json';

export interface LocationDiagnostic {
  platform: string;
  permission: 'fine' | 'coarse' | 'browser' | 'denied';
  coordinates: {
    latitude: number;
// … lines 61–66

export interface LocationGeoResult {
  latitude: number;
  longitude: number;
  state?: string;
  district?: string;
// … lines 83–96

interface CoordsResult {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  permissionStatus: 'fine' | 'coarse' | 'browser' | 'denied';
  timestamp?: number;
}

export class NativeLocationError extends Error {
  code: 'PERMISSION_DENIED' | 'LOCATION_SERVICES_DISABLED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED';

  constructor(
    code: 'PERMISSION_DENIED' | 'LOCATION_SERVICES_DISABLED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED',
// … lines 107–112
 */
export function printLocationDiagnostic(d: LocationDiagnostic) {
  const lines = [
    '=== FINDLOSTPUPPY LOCATION DIAGNOSTIC ===',
    `Platform: ${d.platform}`,
/* ↑ block repeated 3× (6 lines folded to 2) */
// … lines 126–131
 */
async function getPositionWithConfig(options: PositionOptions): Promise<CoordsResult> {
  if (Capacitor.isNativePlatform()) {
    let perm: any = null;
    let permissionStatus: 'fine' | 'coarse' | 'browser' | 'denied' = 'denied';

// … lines 254–259
 */
export async function enrichWithPostalPin(
  pinCode: string,
  context: { state?: string; district?: string; mandal?: string; city?: string }
): Promise<{
  bestOffice?: string;
// … lines 346–351
 */
async function reverseGeocodeCoords(lat: number, lng: number): Promise<{
  state?: string;
  district?: string;
  mandal?: string;
  city?: string;
// … lines 505–510
 */
async function getNativeGeocodedAddress(
  lat: number,
  lng: number
): Promise<Partial<LocationGeoResult> | null> {
  // Only attempt on native Android — this plugin has no web/iOS key-free equivalent
// … lines 673–678
 */
async function fetchIpLocation(): Promise<CoordsResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
// … lines 726–731
 */
export async function detectResilientLocation(options?: { allowIpFallback?: boolean }): Promise<LocationGeoResult> {
  let lat: number | null = null;
  let lng: number | null = null;
  let accuracyMeters: number | undefined;
  let source: 'gps' | 'network' | 'ip' = 'gps';
```

### scripts/test_apis.mjs

| Field | Value |
| --- | --- |
| Bytes | 1733 |
| Score | 138 |
| Why | changed, test |
| Status | Full content |


```mjs
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:9222/devtools/page/F71A143ACA0EF3B342F4BA0C48E20EC8');

ws.on('open', () => {
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));

  // Run detectResilientLocation directly from the bundled code!
  ws.send(JSON.stringify({
    id: 2,
    method: 'Runtime.evaluate',
    params: {
      expression: `(async () => {
        // Let's test boundary lookup vs reverse geocode
        const out = {};
        const lat = 16.7689026;
        const lng = 81.697225;
        
        // 1. Test fetch nominatim
        const t0 = performance.now();
        try {
          const res = await fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&zoom=18&addressdetails=1', {
            headers: { 'User-Agent': 'FindLostPuppy-MobileApp/1.0' }
          });
          out.nominatim = { ok: res.ok, ms: Math.round(performance.now() - t0) };
        } catch(e) {
          out.nominatim = { err: e.message, ms: Math.round(performance.now() - t0) };
        }

        // 2. Test postal pincode
        const t1 = performance.now();
        try {
          const res2 = await fetch('https://api.postalpincode.in/pincode/534211');
          out.postal = { ok: res2.ok, ms: Math.round(performance.now() - t1) };
        } catch(e) {
          out.postal = { err: e.message, ms: Math.round(performance.now() - t1) };
        }

        return out;
      })()`,
      awaitPromise: true,
      returnByValue: true
    }
  }));
});

ws.on('message', (msg) => {
  const d = JSON.parse(msg.toString());
  if (d.id === 2) {
    console.log('Result:', JSON.stringify(d.result?.result?.value, null, 2));
    process.exit(0);
  }
});
```

### scripts/test_chunk.mjs

| Field | Value |
| --- | --- |
| Bytes | 873 |
| Score | 138 |
| Why | changed, test |
| Status | Full content |


```mjs
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:9222/devtools/page/F71A143ACA0EF3B342F4BA0C48E20EC8');

ws.on('open', () => {
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));

  // Test dynamic import in webview!
  ws.send(JSON.stringify({
    id: 2,
    method: 'Runtime.evaluate',
    params: {
      expression: `(async () => {
        try {
          const res = await fetch('https://localhost/assets/523-C1oINcei.js');
          return { ok: res.ok, status: res.status };
        } catch (e) {
          return { error: e.message };
        }
      })()`,
      awaitPromise: true,
      returnByValue: true
    }
  }));
});

ws.on('message', (msg) => {
  const d = JSON.parse(msg.toString());
  if (d.id === 2) {
    console.log('Chunk fetch test:', JSON.stringify(d.result?.result?.value, null, 2));
    process.exit(0);
  }
});
```

### scripts/test_detect_cdp.mjs

| Field | Value |
| --- | --- |
| Bytes | 2017 |
| Score | 138 |
| Why | changed, test |
| Status | Full content |


```mjs
import WebSocket from 'ws';

async function test() {
  const ws = new WebSocket('ws://localhost:9222/devtools/page/24AD561B09EE620027028A9D6B742871');

  ws.on('open', () => {
    ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));

    console.log('Clicking detect location button...');
    ws.send(JSON.stringify({
      id: 3,
      method: 'Runtime.evaluate',
      params: {
        expression: 'document.querySelector(".location-detect-primary-btn")?.click()',
        returnByValue: true
      }
    }));
  });

  ws.on('message', (msg) => {
    const d = JSON.parse(msg.toString());
    if (d.method === 'Console.messageAdded') {
      console.log('CONSOLE:', d.params.message.text);
    } else if (d.method === 'Runtime.consoleAPICalled') {
      console.log('CONSOLE_API:', d.params.args.map(a => a.value || JSON.stringify(a)).join(' '));
    } else if (d.id === 4) {
      console.log('FORM_STATE:', JSON.stringify(d.result?.result?.value, null, 2));
    }
  });

  setTimeout(() => {
    ws.send(JSON.stringify({
      id: 4,
      method: 'Runtime.evaluate',
      params: {
        expression: `(() => {
          const cards = Array.from(document.querySelectorAll(".location-field-card")).map(c => ({
            label: c.querySelector(".location-field-label")?.innerText?.trim(),
            value: (c.querySelector("select") ? c.querySelector("select").value : (c.querySelector("input") ? c.querySelector("input").value : c.innerText))
          }));
          const btn = document.querySelector(".location-detect-primary-btn")?.innerText?.trim();
          const badge = document.querySelector(".location-status-badge")?.innerText?.trim();
          const banner = document.querySelector(".location-detected-banner")?.innerText?.trim();
          return { btn, badge, banner, cards };
        })()`,
        returnByValue: true
      }
    }));
  }, 4000);

  setTimeout(() => {
    process.exit(0);
  }, 6000);
}

test();
```

### scripts/test_device_settings.mjs

| Field | Value |
| --- | --- |
| Bytes | 956 |
| Score | 138 |
| Why | changed, test |
| Status | Full content |


```mjs
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:9222/devtools/page/773E5B600F2D20260AD61C182F2C1042');

ws.on('open', () => {
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  
  ws.send(JSON.stringify({
    id: 2,
    method: 'Runtime.evaluate',
    params: {
      expression: `(async () => {
        const out = {};
        try {
          const ds = window.Capacitor?.Plugins?.DeviceSettings;
          out.hasDeviceSettings = !!ds;
          if (ds) {
            out.isLocEnabled = await ds.isLocationEnabled();
          }
        } catch (e) {
          out.err = e.message || String(e);
        }
        return out;
      })()`,
      awaitPromise: true,
      returnByValue: true
    }
  }));
});

ws.on('message', (msg) => {
  const data = JSON.parse(msg.toString());
  if (data.id === 2) {
    console.log('DeviceSettings test result:', JSON.stringify(data.result, null, 2));
    process.exit(0);
  }
});
```

### scripts/test_geo_in_webview.mjs

| Field | Value |
| --- | --- |
| Bytes | 1034 |
| Score | 138 |
| Why | changed, test |
| Status | Full content |


```mjs
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:9222/devtools/page/773E5B600F2D20260AD61C182F2C1042');

ws.on('open', () => {
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  
  // Test Geolocation directly in the WebView!
  ws.send(JSON.stringify({
    id: 2,
    method: 'Runtime.evaluate',
    params: {
      expression: `(async () => {
        try {
          console.log('[EVAL] Testing navigator.geolocation...');
          const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 }));
          return { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch (e) {
          return { error: e.message, code: e.code };
        }
      })()`,
      awaitPromise: true,
      returnByValue: true
    }
  }));
});

ws.on('message', (msg) => {
  const data = JSON.parse(msg.toString());
  if (data.id === 2) {
    console.log('Geolocation test result:', JSON.stringify(data.result, null, 2));
    process.exit(0);
  }
});
```

### scripts/test_nominatim.mjs

| Field | Value |
| --- | --- |
| Bytes | 1127 |
| Score | 138 |
| Why | changed, test |
| Status | Full content |


```mjs
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:9222/devtools/page/F71A143ACA0EF3B342F4BA0C48E20EC8');

ws.on('open', () => {
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));

  ws.send(JSON.stringify({
    id: 2,
    method: 'Runtime.evaluate',
    params: {
      expression: `(async () => {
        const t0 = performance.now();
        try {
          const res = await fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=16.7689&lon=81.6972&zoom=18&addressdetails=1', {
            headers: { 'User-Agent': 'FindLostPuppy-MobileApp/1.0' }
          });
          const dt = Math.round(performance.now() - t0);
          return { ok: res.ok, status: res.status, dt };
        } catch (e) {
          return { error: e.message, dt: Math.round(performance.now() - t0) };
        }
      })()`,
      awaitPromise: true,
      returnByValue: true
    }
  }));
});

ws.on('message', (msg) => {
  const d = JSON.parse(msg.toString());
  if (d.id === 2) {
    console.log('Nominatim fetch test:', JSON.stringify(d.result?.result?.value, null, 2));
    process.exit(0);
  }
});
```

### scripts/test_plugins.mjs

| Field | Value |
| --- | --- |
| Bytes | 1659 |
| Score | 138 |
| Why | changed, test |
| Status | Full content |


```mjs
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:9222/devtools/page/773E5B600F2D20260AD61C182F2C1042');

ws.on('open', () => {
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  
  ws.send(JSON.stringify({
    id: 2,
    method: 'Runtime.evaluate',
    params: {
      expression: `(async () => {
        const out = {};
        try {
          const cap = window.Capacitor;
          out.isNative = cap?.isNativePlatform?.();
          out.platform = cap?.getPlatform?.();
          
          const geoPlugin = cap?.Plugins?.Geolocation;
          if (geoPlugin) {
            out.geoPerm = await geoPlugin.checkPermissions();
            const pos = await geoPlugin.getCurrentPosition({ enableHighAccuracy: true, timeout: 3000 });
            out.geoPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          }
          
          const nativeGeo = cap?.Plugins?.NativeGeocoder;
          if (nativeGeo && out.geoPos) {
            out.reverse = await nativeGeo.reverseGeocode({
              latitude: out.geoPos.lat,
              longitude: out.geoPos.lng,
              useLocale: false,
              defaultLocale: 'en_IN',
              maxResults: 1
            });
          }
        } catch (e) {
          out.err = e.message || String(e);
          out.stack = e.stack;
        }
        return out;
      })()`,
      awaitPromise: true,
      returnByValue: true
    }
  }));
});

ws.on('message', (msg) => {
  const data = JSON.parse(msg.toString());
  if (data.id === 2) {
    console.log('Native Plugins test result:', JSON.stringify(data.result, null, 2));
    process.exit(0);
  }
});
```

### .tokencap/agent/agent-pack.md

| Field | Value |
| --- | --- |
| Bytes | 7990 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```markdown
# Agent Pack - findlostpuppy

> This file was auto-generated by **TokenCap v0.8**.
> Paste this entire file into ChatGPT, Claude, Gemini, Cursor, Windsurf, Cline, Roo Code, or OpenHands
> to give the AI agent full project intelligence before it touches any code.

**Generated:** 2026-10-11T06:39:23.729Z
**Project:** findlostpuppy
**Type:** React

---

## 1. Tech Stack

**Languages:** TypeScript
**Frameworks:** React
**Auth:** Firebase Auth, JOSE (JWT)
**Build:** Vite

---

## 2. Architecture

```
Component Layer -> Service Layer
```

The import graph supports a **Component Layer -> Service Layer** flow. Observed imports: App.tsx -> storageService.ts; App.tsx -> consentService.ts; App.tsx -> geoBlockService.ts. **Testing** is the largest detected subsystem by file count. Detected subsystems: Unclassified, Testing, Components (storageService), Components (legalContent), Components (ToastContext).

---

## 3. Project Rules

- Business logic belongs in services
- Custom React hooks live in hooks/ - prefix with 'use'
- Shared utilities live in utils/ - keep them pure and side-effect free
- Core library code lives in lib/ - keep it framework-agnostic
- UI components live in components/ - keep them presentational
- Page components live in pages/ - route-level only, no business logic
- App Router entry points live in app/ - follow Next.js file conventions
- Shared TypeScript types live in types/ - import from here, not redeclared inline
- React context providers live in context/
- Use TypeScript strictly - avoid `any` types
- Write tests for all service-layer functions

---

## 4. Important Files

- `src/types/index.ts`
- `src/services/storageService.ts`
- `src/context/AuthContext.tsx`
- `src/context/ToastContext.tsx`
- `src/utils/dogPhotoHelper.ts`
- `src/services/storageBucketService.ts`
- `scripts/qa_lib.mjs`
- `scripts/unit/test-support.mjs`
- `scripts/unit/test_harness.mjs`
- `src/services/locationService.ts`

---

## 5. High-Risk Areas

- [HIGH] **Database** - HIGH: Database layer holds all persistent state. Schema changes can corrupt or lose data.
- [HIGH] **Scripts (qa_lib)** - HIGH: Scripts (qa_lib) contains 11 modules with elevated risk. Most-connected file: qa_lib.mjs (10 importers).
- [HIGH] **Unit (test-support)** - HIGH: Unit (test-support) contains 9 modules with elevated risk. Most-connected file: test-support.mjs (8 importers).
- [HIGH] **Unit (test_harness)** - HIGH: Unit (test_harness) contains 9 modules with elevated risk. Most-connected file: test_harness.mjs (8 importers).
- [HIGH] **Components (storageService)** - HIGH: Components (storageService) contains 23 modules with elevated risk. Most-connected file: storageService.ts (25 importers).
- [HIGH] **Components (ToastContext)** - HIGH: Components (ToastContext) contains 16 modules with elevated risk. Most-connected file: ToastContext.tsx (20 importers).

---

## 6. Review Rules

When any of these files change, review ALL files in the group together:

### [HIGH] Database Review Group

Shared dependency chain (3 files). Central file: schema-invariants.yaml with 0 importers. Changes in this group carry HIGH risk - review all listed files together.

- `.tokencap/constitution/schema-invariants.yaml`
- `scratch/execute_media_migration.ts`
- `scratch/execute_safe_migration_workflow.mjs`

### [HIGH] Scripts (qa_lib) Review Group

Shared dependency chain (11 files). Central file: qa_lib.mjs with 10 importers. Changes in this group carry HIGH risk - review all listed files together.

- `scripts/qa_lib.mjs`
- `scratch/test_consent_flow.mjs`
- `scripts/capture_card_and_sighting.mjs`
- `scripts/capture_clean_remaining.mjs`
- `scripts/capture_deep_flows.mjs`
- `scripts/capture_exact_checkpoints.mjs`
- `scripts/execute_onboarding_and_alert_flows.mjs`
- `scripts/release_regression_verify.mjs`

### [HIGH] Unit (test-support) Review Group

Shared dependency chain (9 files). Central file: test-support.mjs with 8 importers. Changes in this group carry HIGH risk - review all listed files together.

- `scripts/unit/test-support.mjs`
- `scripts/unit/consent-page.test.mjs`
- `scripts/unit/drafts-consent.test.mjs`
- `scripts/unit/firebase-sync.test.mjs`
- `scripts/unit/geolocation.test.mjs`
- `scripts/unit/media-functions.test.mjs`
- `scripts/unit/media-storage.test.mjs`
- `scripts/unit/media-worker.test.mjs`

### [HIGH] Unit (test_harness) Review Group

Shared dependency chain (9 files). Central file: test_harness.mjs with 8 importers. Changes in this group carry HIGH risk - review all listed files together.

- `scripts/unit/test_harness.mjs`
- `scripts/unit/drafts_and_consent.test.mjs`
- `scripts/unit/fallbacks.test.mjs`
- `scripts/unit/firebase_sync.test.mjs`
- `scripts/unit/location_regressions.test.mjs`
- `scripts/unit/media_client.test.mjs`
- `scripts/unit/media_functions.test.mjs`
- `scripts/unit/media_worker.test.mjs`

### [HIGH] Components (storageService) Review Group

Shared dependency chain (23 files). Central file: storageService.ts with 25 importers. Changes here affect 4 neighboring module(s) outside this cluster. Changes in this group carry HIGH risk - review all listed files together.

- `src/services/storageService.ts`
- `src/context/AuthContext.tsx`
- `src/services/storageBucketService.ts`
- `src/utils/phoneValidator.ts`
- `src/services/consentService.ts`
- `src/services/firebaseSyncService.ts`
- `src/services/firebaseConfig.ts`
- `src/utils/privacyUtils.ts`

### [HIGH] Components (ToastContext) Review Group

Shared dependency chain (16 files). Central file: ToastContext.tsx with 20 importers. Changes here affect 4 neighboring module(s) outside this cluster. Changes in this group carry HIGH risk - review all listed files together.

- `src/context/ToastContext.tsx`
- `src/services/locationService.ts`
- `src/utils/geolocationHelper.ts`
- `src/utils/indicTransliteration.ts`
- `src/components/PermissionRationaleModal.tsx`
- `src/hooks/useCrashSafeDraft.ts`
- `src/hooks/useLocationDetection.ts`
- `src/services/nativeSettingsService.ts`

### [HIGH] Pages (imageCompressor) Review Group

Shared dependency chain (6 files). Central file: imageCompressor.ts with 6 importers. Changes here affect 4 neighboring module(s) outside this cluster. Changes in this group carry HIGH risk - review all listed files together.

- `src/utils/imageCompressor.ts`
- `src/components/PetProfileSelector.tsx`
- `src/utils/breedAssetHelper.tsx`
- `src/data/dogBreeds.ts`
- `src/pages/PetDetails.tsx`
- `src/pages/CapturePetPage.tsx`
- `src/App.tsx`
- `src/context/AuthContext.tsx`

### [HIGH] Pages (index) Review Group

Shared dependency chain (16 files). Central file: index.ts with 31 importers. Changes here affect 4 neighboring module(s) outside this cluster. Changes in this group carry HIGH risk - review all listed files together.

- `src/types/index.ts`
- `src/utils/dogPhotoHelper.ts`
- `src/components/ui/VillageDogTransition.tsx`
- `src/components/ui/back-button.tsx`
- `src/utils/shareHelper.ts`
- `src/components/StatusBadge.tsx`
- `src/utils/confettiHelper.ts`
- `src/components/DogCard.tsx`

---

## 7. Core Features

- Components (storageService)
- Components (legalContent)
- Components (ToastContext)
- Pages (index)
- Services
- Frontend
- Scripts (qa_lib)
- Unit (test-support)

---

## 8. Agent Instructions

You are an AI agent working on **findlostpuppy**.

Before making any changes:
1. Understand the **Component Layer -> Service Layer** architecture pattern.
2. Follow all **Project Rules** listed in Section 3.
3. Check the **High-Risk Areas** - any change there requires extra review.
4. When touching files in a **Review Group**, review all files in that group together.
5. Never hard-code secrets or skip validation at API boundaries.

The most important files in this project are:
- `src/types/index.ts`
- `src/services/storageService.ts`
- `src/context/AuthContext.tsx`
- `src/context/ToastContext.tsx`
- `src/utils/dogPhotoHelper.ts`

Start here. Work methodically. Ask before making assumptions about intent.
```

### .tokencap/agent/context-manifest.json

| Field | Value |
| --- | --- |
| Bytes | 5659 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```json
{
  "version": "1.0.0",
  "generatedAt": "2026-10-11T06:39:23.731Z",
  "entry": "START_HERE.md",
  "project": {
    "name": "findlostpuppy",
    "type": "React + TypeScript",
    "architectureStyle": "Component Layer -> Service Layer"
  },
  "clusters": [
    "database",
    "scripts-(qa_lib)",
    "unit-(test_harness)",
    "components-(authcontext)",
    "components-(toastcontext)",
    "pages-(index)",
    "other",
    "config",
    "services",
    "authentication",
    "frontend",
    "testing",
    "components-(fallbackshell)",
    "dashboard",
    "utilities"
  ],
  "criticalFiles": [
    "src/types/index.ts",
    "src/services/storageService.ts",
    "src/context/AuthContext.tsx",
    "src/context/ToastContext.tsx",
    "src/utils/dogPhotoHelper.ts",
    "src/services/storageBucketService.ts",
    "scripts/qa_lib.mjs",
    "scripts/unit/test_harness.mjs",
    "src/utils/imageCompressor.ts",
    "src/services/locationService.ts"
  ],
  "riskAreas": [
    {
      "cluster": "database",
      "level": "HIGH"
    },
    {
      "cluster": "scripts-(qa_lib)",
      "level": "HIGH"
    },
    {
      "cluster": "unit-(test_harness)",
      "level": "HIGH"
    },
    {
      "cluster": "components-(authcontext)",
      "level": "HIGH"
    },
    {
      "cluster": "components-(toastcontext)",
      "level": "HIGH"
    },
    {
      "cluster": "pages-(index)",
      "level": "HIGH"
    }
  ],
  "reviewGroups": [
    {
      "name": "Database Review Group",
      "fileCount": 3
    },
    {
      "name": "Scripts (qa_lib) Review Group",
      "fileCount": 10
    },
    {
      "name": "Unit (test_harness) Review Group",
      "fileCount": 9
    },
    {
      "name": "Components (AuthContext) Review Group",
      "fileCount": 14
    },
    {
      "name": "Components (ToastContext) Review Group",
      "fileCount": 14
    },
    {
      "name": "Pages (index) Review Group",
      "fileCount": 14
    }
  ],
  "allowedContext": {
    "database": [
      ".tokencap/constitution/schema-invariants*",
      "scratch/**"
    ],
    "scripts-qalib": [
      "scratch/test_consent_flow*",
      "scripts/**"
    ],
    "unit-testharness": [
      "scripts/unit/**"
    ],
    "components-authcontext": [
      "src/context/AuthContext*",
      "src/pages/**",
      "src/components/**",
      "src/utils/**",
      "src/services/**",
      "src/data/dogBreeds*"
    ],
    "components-toastcontext": [
      "src/context/ToastContext*",
      "src/pages/**",
      "src/components/**",
      "src/services/locationService*",
      "src/utils/**",
      "src/hooks/useCrashSafeDraft*"
    ],
    "pages-index": [
      "src/services/**",
      "src/pages/**",
      "src/components/**",
      "src/types/index*",
      "src/utils/**"
    ],
    "other": [
      ".github/workflows/deploy*",
      ".tokencap/constitution/**",
      "android/app/src/main/assets/public/**",
      "cleanup_cloudinary*",
      "functions/index*",
      "scratch/**",
      "scripts/**",
      "src/types/geojson.d*",
      "worker-configuration.d*",
      "worker/index*"
    ],
    "config": [
      "capacitor.config*",
      "scripts/validate_firebase_env*",
      "src/vite-env.d*",
      "vite.config*"
    ],
    "services": [
      "docs/generate_pdf*",
      "scratch/**",
      "scripts/**"
    ],
    "authentication": [
      "scratch/extract_session*",
      "scripts/test_auth_consent_flow*"
    ],
    "frontend": [
      "scratch/**",
      "scripts/**",
      "src/components/**"
    ],
    "testing": [
      "scratch/**",
      "scripts/**"
    ],
    "components-fallbackshell": [
      "src/**"
    ],
    "dashboard": [
      "scratch/**"
    ],
    "utilities": [
      "src/lib/utils*"
    ]
  },
  "recommendedReads": {
    "database": [
      "architecture.md",
      "rules.md",
      "risk-map.md",
      "review-rules.md"
    ],
    "scripts-(qa_lib)": [
      "architecture.md",
      "rules.md",
      "risk-map.md",
      "review-rules.md"
    ],
    "unit-(test_harness)": [
      "architecture.md",
      "rules.md",
      "risk-map.md",
      "review-rules.md"
    ],
    "components-(authcontext)": [
      "architecture.md",
      "rules.md",
      "risk-map.md",
      "review-rules.md"
    ],
    "components-(toastcontext)": [
      "architecture.md",
      "rules.md",
      "risk-map.md",
      "review-rules.md"
    ],
    "pages-(index)": [
      "architecture.md",
      "rules.md",
      "risk-map.md",
      "review-rules.md"
    ],
    "config": [
      "architecture.md",
      "rules.md"
    ],
    "services": [
      "architecture.md",
      "rules.md"
    ],
    "authentication": [
      "architecture.md",
      "rules.md"
    ],
    "frontend": [
      "architecture.md",
      "rules.md"
    ],
    "testing": [
      "architecture.md",
      "rules.md"
    ],
    "unclassified:-scripts": [
      "architecture.md",
      "rules.md"
    ],
    "components-(fallbackshell)": [
      "architecture.md",
      "rules.md"
    ]
  },
  "files": {
    "entry": "START_HERE.md",
    "intelligence": "agent-pack.md",
    "allowedContext": "allowed-context.json",
    "modelInstructions": "model-instructions.md",
    "architecture": "architecture.md",
    "rules": "rules.md",
    "reviewRules": "review-rules.md",
    "riskMap": "risk-map.md",
    "techStack": "tech-stack.md",
    "skills": "skills.md",
    "machineReadable": "agent.json"
  },
  "meta": {
    "tokencapVersion": "1.0.0",
    "description": "Self-Loading Universal Context Layer - machine-readable repository intelligence index.",
    "usage": "Read entry file first, then use allowedContext and recommendedReads for navigation."
  }
}
```

### .tokencap/agent/model-instructions.md

| Field | Value |
| --- | --- |
| Bytes | 2517 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```markdown
# Model Instructions - findlostpuppy

> Generated by TokenCap v1.0.0 - 2026-10-11T06:39:23.731Z

---

## Before Touching Code

1. Read `START_HERE.md` - repository overview
2. Read `agent-pack.md` - full project intelligence
3. Use `allowed-context.json` - locate files for your task
4. Read `risk-map.md` before modifying HIGH or CRITICAL areas

---

## Architecture

Component Layer -> Service Layer

---

## Where Things Live

- **Database** -> `.tokencap/constitution/schema-invariants*, scratch/**`
- **Scripts qalib** -> `scratch/test_consent_flow*, scripts/**`
- **Unit testharness** -> `scripts/unit/**`
- **Components authcontext** -> `src/context/AuthContext*, src/pages/**`
- **Components toastcontext** -> `src/context/ToastContext*, src/pages/**`
- **Pages index** -> `src/services/**, src/pages/**`
- **Other** -> `.github/workflows/deploy*, .tokencap/constitution/**`
- **Config** -> `capacitor.config*, scripts/validate_firebase_env*`

---

## Non-Negotiable Rules

- Business logic belongs in services
- Custom React hooks live in hooks/ - prefix with 'use'
- Shared utilities live in utils/ - keep them pure and side-effect free
- Core library code lives in lib/ - keep it framework-agnostic
- UI components live in components/ - keep them presentational
- Page components live in pages/ - route-level only, no business logic
- App Router entry points live in app/ - follow Next.js file conventions
- Shared TypeScript types live in types/ - import from here, not redeclared inline

---

## High-Risk Files - Extra Care Required

- [HIGH] `scratch/execute_media_migration.ts`
- [HIGH] `scratch/execute_safe_migration_workflow.mjs`
- [HIGH] `scripts/qa_lib.mjs`
- [HIGH] `scripts/unit/test-support.mjs`
- [HIGH] `scripts/unit/test_harness.mjs`
- [HIGH] `src/services/storageService.ts`

---

## Do Not

- Scan the full repository unless the task specifically requires it
- Make assumptions about architecture - read `architecture.md` first
- Modify HIGH or CRITICAL files without checking `risk-map.md`
- Change files in multiple clusters in one pass without checking review groups
- Create new patterns that contradict `rules.md`

---

## Navigation

| Tool | How to use it |
|---|---|
| Find files for a feature | Look up topic in `allowed-context.json` |
| Understand the full project | Read `agent-pack.md` |
| Check what changed recently | Read `TOKENCAP.md` Recent Changes section |
| Understand dependencies | Read `architecture.md` |
| Know what to review together | Read `review-rules.md` |
```

### .tokencap/agent/review-rules.md

| Field | Value |
| --- | --- |
| Bytes | 5473 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```markdown
# Review Rules - findlostpuppy

> Generated by TokenCap v0.8 - 2026-10-11T06:39:23.728Z
> When reviewing changes in any of these groups, review ALL listed files together.

---

## Database Review Group

**Risk:** [HIGH] HIGH

**Reason:** Shared dependency chain (3 files). Central file: schema-invariants.yaml with 0 importers. Changes in this group carry HIGH risk - review all listed files together.

**Review Together:**

- `.tokencap/constitution/schema-invariants.yaml`
- `scratch/execute_media_migration.ts`
- `scratch/execute_safe_migration_workflow.mjs`

---

## Scripts (qa_lib) Review Group

**Risk:** [HIGH] HIGH

**Reason:** Shared dependency chain (11 files). Central file: qa_lib.mjs with 10 importers. Changes in this group carry HIGH risk - review all listed files together.

**Review Together:**

- `scripts/qa_lib.mjs`
- `scratch/test_consent_flow.mjs`
- `scripts/capture_card_and_sighting.mjs`
- `scripts/capture_clean_remaining.mjs`
- `scripts/capture_deep_flows.mjs`
- `scripts/capture_exact_checkpoints.mjs`
- `scripts/execute_onboarding_and_alert_flows.mjs`
- `scripts/release_regression_verify.mjs`
- `scripts/run_all_qa_checkpoints.mjs`
- `scripts/run_complete_qa.mjs`

---

## Unit (test-support) Review Group

**Risk:** [HIGH] HIGH

**Reason:** Shared dependency chain (9 files). Central file: test-support.mjs with 8 importers. Changes in this group carry HIGH risk - review all listed files together.

**Review Together:**

- `scripts/unit/test-support.mjs`
- `scripts/unit/consent-page.test.mjs`
- `scripts/unit/drafts-consent.test.mjs`
- `scripts/unit/firebase-sync.test.mjs`
- `scripts/unit/geolocation.test.mjs`
- `scripts/unit/media-functions.test.mjs`
- `scripts/unit/media-storage.test.mjs`
- `scripts/unit/media-worker.test.mjs`
- `scripts/unit/storage-recovery.test.mjs`

---

## Unit (test_harness) Review Group

**Risk:** [HIGH] HIGH

**Reason:** Shared dependency chain (9 files). Central file: test_harness.mjs with 8 importers. Changes in this group carry HIGH risk - review all listed files together.

**Review Together:**

- `scripts/unit/test_harness.mjs`
- `scripts/unit/drafts_and_consent.test.mjs`
- `scripts/unit/fallbacks.test.mjs`
- `scripts/unit/firebase_sync.test.mjs`
- `scripts/unit/location_regressions.test.mjs`
- `scripts/unit/media_client.test.mjs`
- `scripts/unit/media_functions.test.mjs`
- `scripts/unit/media_worker.test.mjs`
- `scripts/unit/storage_recovery.test.mjs`

---

## Components (storageService) Review Group

**Risk:** [HIGH] HIGH

**Reason:** Shared dependency chain (23 files). Central file: storageService.ts with 25 importers. Changes here affect 4 neighboring module(s) outside this cluster. Changes in this group carry HIGH risk - review all listed files together.

**Review Together:**

- `src/services/storageService.ts`
- `src/context/AuthContext.tsx`
- `src/services/storageBucketService.ts`
- `src/utils/phoneValidator.ts`
- `src/services/consentService.ts`
- `src/services/firebaseSyncService.ts`
- `src/services/firebaseConfig.ts`
- `src/utils/privacyUtils.ts`
- `src/services/authService.ts`
- `src/pages/OwnerProfile.tsx`
- `src/App.tsx`
- `src/components/SuggestionWidget.tsx`
- `src/components/admin/AdminShortcuts.tsx`
- `src/types/index.ts`

---

## Components (ToastContext) Review Group

**Risk:** [HIGH] HIGH

**Reason:** Shared dependency chain (16 files). Central file: ToastContext.tsx with 20 importers. Changes here affect 4 neighboring module(s) outside this cluster. Changes in this group carry HIGH risk - review all listed files together.

**Review Together:**

- `src/context/ToastContext.tsx`
- `src/services/locationService.ts`
- `src/utils/geolocationHelper.ts`
- `src/utils/indicTransliteration.ts`
- `src/components/PermissionRationaleModal.tsx`
- `src/hooks/useCrashSafeDraft.ts`
- `src/hooks/useLocationDetection.ts`
- `src/services/nativeSettingsService.ts`
- `src/pages/Location.tsx`
- `src/pages/GuestSightingPage.tsx`
- `src/App.tsx`
- `src/components/AdminUserProximityMap.tsx`
- `src/components/CameraModal.tsx`
- `src/components/SidebarNav.tsx`

---

## Pages (imageCompressor) Review Group

**Risk:** [HIGH] HIGH

**Reason:** Shared dependency chain (6 files). Central file: imageCompressor.ts with 6 importers. Changes here affect 4 neighboring module(s) outside this cluster. Changes in this group carry HIGH risk - review all listed files together.

**Review Together:**

- `src/utils/imageCompressor.ts`
- `src/components/PetProfileSelector.tsx`
- `src/utils/breedAssetHelper.tsx`
- `src/data/dogBreeds.ts`
- `src/pages/PetDetails.tsx`
- `src/pages/CapturePetPage.tsx`
- `src/App.tsx`
- `src/context/AuthContext.tsx`
- `src/context/ToastContext.tsx`
- `src/services/storageService.ts`

---

## Pages (index) Review Group

**Risk:** [HIGH] HIGH

**Reason:** Shared dependency chain (16 files). Central file: index.ts with 31 importers. Changes here affect 4 neighboring module(s) outside this cluster. Changes in this group carry HIGH risk - review all listed files together.

**Review Together:**

- `src/types/index.ts`
- `src/utils/dogPhotoHelper.ts`
- `src/components/ui/VillageDogTransition.tsx`
- `src/components/ui/back-button.tsx`
- `src/utils/shareHelper.ts`
- `src/components/StatusBadge.tsx`
- `src/utils/confettiHelper.ts`
- `src/components/DogCard.tsx`
- `src/pages/PetSafety.tsx`
- `src/pages/RegisteredPet.tsx`
- `src/App.tsx`
- `src/context/AuthContext.tsx`
- `src/context/ToastContext.tsx`
- `src/services/storageService.ts`

---
```

### .tokencap/agent/risk-map.md

| Field | Value |
| --- | --- |
| Bytes | 3352 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```markdown
# Risk Map - findlostpuppy

> Generated by TokenCap v0.8 - 2026-10-11T06:39:23.728Z

---

## Summary

[HIGH] **HIGH clusters:** Database, Scripts (qa_lib), Unit (test-support), Unit (test_harness), Components (storageService), Components (ToastContext), Pages (imageCompressor), Pages (index)

---

## Risk Areas

### [HIGH] Database

**Risk Level:** HIGH

**Why:** Database layer holds all persistent state. Schema changes can corrupt or lose data.

**Key Files:**

- `scratch/execute_media_migration.ts`
- `scratch/execute_safe_migration_workflow.mjs`

### [HIGH] Scripts (qa_lib)

**Risk Level:** HIGH

**Why:** Scripts (qa_lib) contains 11 modules with elevated risk. Most-connected file: qa_lib.mjs (10 importers).

**Key Files:**

- `scripts/qa_lib.mjs`

### [HIGH] Unit (test-support)

**Risk Level:** HIGH

**Why:** Unit (test-support) contains 9 modules with elevated risk. Most-connected file: test-support.mjs (8 importers).

**Key Files:**

- `scripts/unit/test-support.mjs`

### [HIGH] Unit (test_harness)

**Risk Level:** HIGH

**Why:** Unit (test_harness) contains 9 modules with elevated risk. Most-connected file: test_harness.mjs (8 importers).

**Key Files:**

- `scripts/unit/test_harness.mjs`

### [HIGH] Components (storageService)

**Risk Level:** HIGH

**Why:** Components (storageService) contains 23 modules with elevated risk. Most-connected file: storageService.ts (25 importers).

**Key Files:**

- `src/services/storageService.ts`
- `src/context/AuthContext.tsx`
- `src/services/storageBucketService.ts`
- `src/utils/phoneValidator.ts`
- `src/services/consentService.ts`
- `src/services/firebaseSyncService.ts`

### [HIGH] Components (ToastContext)

**Risk Level:** HIGH

**Why:** Components (ToastContext) contains 16 modules with elevated risk. Most-connected file: ToastContext.tsx (20 importers).

**Key Files:**

- `src/context/ToastContext.tsx`
- `src/services/locationService.ts`
- `src/utils/geolocationHelper.ts`
- `src/utils/indicTransliteration.ts`

### [HIGH] Pages (imageCompressor)

**Risk Level:** HIGH

**Why:** Pages (imageCompressor) contains 6 modules with elevated risk. Most-connected file: imageCompressor.ts (6 importers).

**Key Files:**

- `src/utils/imageCompressor.ts`

### [HIGH] Pages (index)

**Risk Level:** HIGH

**Why:** Pages (index) contains 16 modules with elevated risk. Most-connected file: index.ts (31 importers).

**Key Files:**

- `src/types/index.ts`
- `src/utils/dogPhotoHelper.ts`
- `src/components/ui/VillageDogTransition.tsx`
- `src/components/ui/back-button.tsx`

### [MEDIUM] Components (legalContent)

**Risk Level:** MEDIUM

**Why:** Components (legalContent) contains 19 modules with elevated risk. Most-connected file: legalContent.ts (4 importers).

**Key Files:**

- `src/App.tsx`
- `src/components/Footer.tsx`
- `src/services/geoBlockService.ts`
- `src/components/GeoBlockPage.tsx`
- `src/components/ui/AnimationShowcaseStudio.tsx`

### [MEDIUM] Fallbacks (FallbackShell)

**Risk Level:** MEDIUM

**Why:** Fallbacks (FallbackShell) contains 8 modules with elevated risk. Most-connected file: FallbackShell.tsx (4 importers).

**Key Files:**

- `src/components/fallbacks/LoadingFallback.tsx`
- `src/components/CameraModal.tsx`
- `src/components/fallbacks/PermissionFallback.tsx`
- `src/components/ErrorBoundary.tsx`
- `src/components/fallbacks/AppErrorBoundary.tsx`
```

### .tokencap/agent/rules.md

| Field | Value |
| --- | --- |
| Bytes | 2107 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```markdown
# Project Rules - findlostpuppy

> Generated by TokenCap v0.8 - 2026-10-11T06:39:23.728Z
> These rules are inferred automatically from the project structure and tech stack.

---

## Folder Conventions

### `services/`

**Rule:** Business logic belongs in services

**Example:** `src/services/storageService.ts`

### `hooks/`

**Rule:** Custom React hooks live in hooks/ - prefix with 'use'

**Example:** `src/hooks/useLocationDetection.ts`

### `utils/`

**Rule:** Shared utilities live in utils/ - keep them pure and side-effect free

**Example:** `src/utils/dogPhotoHelper.ts`

### `lib/`

**Rule:** Core library code lives in lib/ - keep it framework-agnostic

**Example:** `src/lib/utils.ts`

### `components/`

**Rule:** UI components live in components/ - keep them presentational

**Example:** `src/components/SidebarNav.tsx`

### `pages/`

**Rule:** Page components live in pages/ - route-level only, no business logic

**Example:** `src/pages/ConsentPage.tsx`

### `app/`

**Rule:** App Router entry points live in app/ - follow Next.js file conventions

**Example:** `android/app/src/main/assets/public/assets/28_mandals-CVEUtnws.js`

### `types/`

**Rule:** Shared TypeScript types live in types/ - import from here, not redeclared inline

**Example:** `src/types/index.ts`

### `context/`

**Rule:** React context providers live in context/

**Example:** `src/context/AuthContext.tsx`

---

## Quick Reference

All conventions at a glance:

- Business logic belongs in services
- Custom React hooks live in hooks/ - prefix with 'use'
- Shared utilities live in utils/ - keep them pure and side-effect free
- Core library code lives in lib/ - keep it framework-agnostic
- UI components live in components/ - keep them presentational
- Page components live in pages/ - route-level only, no business logic
- App Router entry points live in app/ - follow Next.js file conventions
- Shared TypeScript types live in types/ - import from here, not redeclared inline
- React context providers live in context/
- Use TypeScript strictly - avoid `any` types
- Write tests for all service-layer functions
```

### .tokencap/agent/skills.md

| Field | Value |
| --- | --- |
| Bytes | 2052 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```markdown
# Agent Skills - findlostpuppy

> Generated by TokenCap v0.8 - 2026-10-11T06:39:23.729Z
> This file teaches an AI agent the essential knowledge needed to work on this project.

---

## Project Type

You are working on a **React** project.

---

## Core Features

- Components (storageService)
- Components (legalContent)
- Components (ToastContext)
- Pages (index)
- Services
- Frontend
- Scripts (qa_lib)
- Unit (test-support)

---

## Architecture

```
Component Layer -> Service Layer
```

---

## Project Conventions

Follow these rules when writing or reviewing code:

- Business logic belongs in services
- Custom React hooks live in hooks/ - prefix with 'use'
- Shared utilities live in utils/ - keep them pure and side-effect free
- Core library code lives in lib/ - keep it framework-agnostic
- UI components live in components/ - keep them presentational
- Page components live in pages/ - route-level only, no business logic
- App Router entry points live in app/ - follow Next.js file conventions
- Shared TypeScript types live in types/ - import from here, not redeclared inline
- React context providers live in context/
- Use TypeScript strictly - avoid `any` types
- Write tests for all service-layer functions

---

## Important Files

These files are critical - understand them before making changes:

- `src/types/index.ts`
- `src/services/storageService.ts`
- `src/context/AuthContext.tsx`
- `src/context/ToastContext.tsx`
- `src/utils/dogPhotoHelper.ts`
- `src/services/storageBucketService.ts`
- `scripts/qa_lib.mjs`
- `scripts/unit/test-support.mjs`
- `scripts/unit/test_harness.mjs`
- `src/services/locationService.ts`

---

## High-Risk Areas

Changes to these areas require extra care and thorough review:

- [HIGH] **Database** - HIGH
- [HIGH] **Scripts (qa_lib)** - HIGH
- [HIGH] **Unit (test-support)** - HIGH
- [HIGH] **Unit (test_harness)** - HIGH
- [HIGH] **Components (storageService)** - HIGH
- [HIGH] **Components (ToastContext)** - HIGH
- [HIGH] **Pages (imageCompressor)** - HIGH
- [HIGH] **Pages (index)** - HIGH
```

### .tokencap/agent/tech-stack.md

| Field | Value |
| --- | --- |
| Bytes | 654 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```markdown
# Tech Stack - findlostpuppy

> Generated by TokenCap v0.8 - 2026-10-11T06:39:23.727Z

---

## Languages

- TypeScript

## Frameworks

- React

## Authentication

- Firebase Auth
- JOSE (JWT)

## Build Tools

- Vite

## Other Dependencies

- @capacitor-firebase/authentication
- @capacitor/app
- @capacitor/core
- @capacitor/geolocation
- @capgo/capacitor-nativegeocoder
- @radix-ui/react-slot
- @turf/boolean-point-in-polygon
- @turf/helpers

## External Services

- External API via VITE_BASE_URL: /findlostpuppy/
- External API via VITE_FIREBASE_API_KEY: [REDACTED:KEY]
- External API via VITE_FIREBASE_API_KEY: your-api-key
```

### .tokencap/constitution/compliance-rules.md

| Field | Value |
| --- | --- |
| Bytes | 2214 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```markdown
# Compliance Rules

> TokenCap Constitution Engine

## 🔴 CONST-COMP-001 — CRITICAL

**Payment processing (PCI-DSS) — all Stripe/payment code requires compliance review.**

> **Why:** PCI-DSS requires that all payment card data handling meets security standards. Any change to payment flows must be reviewed.

> **What breaks:** PCI compliance violation. Payment processor account suspension. Legal liability.

*Files:* `.agents/skills/responsive-design/references/container-queries.md`, `.agents/skills/responsive-design/references/details.md`, `.agents/skills/responsive-design/references/fluid-layouts.md`, `.tokencap/constitution/compliance-rules.md`

## 🔴 CONST-COMP-002 — CRITICAL

**GDPR compliance — personal data handling must preserve user rights (consent, erasure, portability).**

> **Why:** GDPR requires explicit consent for data collection, the right to erasure, and data portability. Removing these breaks legal compliance.

> **What breaks:** GDPR violation. Regulatory fines. User data rights cannot be exercised.

*Files:* `.agents/rules/workflow.md`, `.tokencap/agent/START_HERE.md`, `.tokencap/agent/agent-pack.md`, `.tokencap/agent/architecture.md`

## 🔴 CONST-COMP-003 — CRITICAL

**HIPAA compliance — protected health information (PHI) handling must remain compliant.**

> **Why:** HIPAA requires strict access control, audit logging, and encryption for all PHI. Removing protections is illegal.

> **What breaks:** HIPAA violation. Criminal liability. Patient data exposed.

*Files:* `.tokencap/constitution/compliance-rules.md`, `.tokencap/constitution/constitution.md`, `.tokencap/constitution/constitution.yaml`, `android/app/src/main/assets/public/assets/516-VkbN94rn.js`

## 🔴 CONST-COMP-004 — CRITICAL

**Audit logging must always be written and never removed.**

> **Why:** Audit logs provide the immutable record required for compliance, forensic investigation, and regulatory review.

> **What breaks:** Compliance audit failures. Inability to investigate security incidents. Regulatory violations.

*Files:* `.tokencap/constitution/compliance-rules.md`, `.tokencap/constitution/constitution.md`, `.tokencap/constitution/constitution.yaml`, `docs/PRD.md`
```

### .tokencap/constitution/critical-flows.md

| Field | Value |
| --- | --- |
| Bytes | 1390 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```markdown
# Critical Flows

> TokenCap Constitution Engine

## 🔴 CONST-FLOW-001 — CRITICAL

**Authentication Flow is repository-critical and must remain intact end-to-end.**

> **Why:** Every protected page and authenticated feature depends on this flow working correctly.

> **What breaks:** Users cannot log in. All authenticated features become unreachable. Sessions invalidated.

*Files:* `scripts/test_auth_consent_flow.mjs`, `src/context/AuthContext.tsx`, `src/pages/EmailAuthPage.tsx`, `src/services/authService.ts`

## 🔴 CONST-FLOW-002 — CRITICAL

**User Registration Flow must remain functional. New users must be able to create accounts.**

> **Why:** Registration is the entry point for all new users. Breaking it stops user growth.

> **What breaks:** New users cannot create accounts. User acquisition blocked.

*Files:* `scripts/execute_onboarding_and_alert_flows.mjs`, `scripts/run_continuous_onboarding.mjs`, `src/pages/OwnerOnboardingPage.tsx`, `src/pages/RegisteredPet.tsx`

## 🔴 CONST-FLOW-003 — CRITICAL

**Notification Pipeline (email, webhook, SMS) must remain operational.**

> **Why:** Notifications are critical for transactional communication (receipts, alerts, order updates).

> **What breaks:** Users stop receiving transactional emails. Webhooks fail silently. Integrations break.

*Files:* `scratch/send_tester_emails.mjs`, `src/pages/EmailAuthPage.tsx`
```

### .tokencap/constitution/security-boundaries.md

| Field | Value |
| --- | --- |
| Bytes | 3964 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```markdown
# Security Boundaries

> TokenCap Constitution Engine

## 🔴 CONST-SEC-001 — CRITICAL

**JWT authentication flow must remain operational.**

> **Why:** JWT is detected as the active auth system. Changing or removing it invalidates all existing sessions.

> **What breaks:** All protected routes return 401. User sessions invalidated. Logout flows break.

*Files:* `scripts/test_auth_consent_flow.mjs`, `src/context/AuthContext.tsx`, `src/pages/EmailAuthPage.tsx`, `src/services/authService.ts`

## 🔒 CONST-SEC-002 — IMMUTABLE

**Authentication middleware (scripts/test_auth_consent_flow.mjs, src/context/AuthContext.tsx) must remain enabled on all protected routes.**

> **Why:** These files guard access to protected resources. Disabling or bypassing them exposes all protected data.

> **What breaks:** Unauthorized users gain access to protected routes, user data, and admin features.

*Files:* `scripts/test_auth_consent_flow.mjs`, `src/context/AuthContext.tsx`, `src/pages/EmailAuthPage.tsx`, `src/services/authService.ts`

## 🔴 CONST-SEC-003 — CRITICAL

**Firebase Auth authentication flow must remain operational.**

> **Why:** Firebase Auth is detected as the active auth system. Changing or removing it invalidates all existing sessions.

> **What breaks:** All protected routes return 401. User sessions invalidated. Logout flows break.

*Files:* `scratch/check_firebase_storage.mjs`, `scripts/test_auth_consent_flow.mjs`, `scripts/unit/firebase-sync.test.mjs`, `scripts/unit/firebase_sync.test.mjs`

## 🔒 CONST-SEC-004 — IMMUTABLE

**Authentication middleware (scratch/check_firebase_storage.mjs, scripts/test_auth_consent_flow.mjs) must remain enabled on all protected routes.**

> **Why:** These files guard access to protected resources. Disabling or bypassing them exposes all protected data.

> **What breaks:** Unauthorized users gain access to protected routes, user data, and admin features.

*Files:* `scratch/check_firebase_storage.mjs`, `scripts/test_auth_consent_flow.mjs`, `scripts/unit/firebase-sync.test.mjs`, `scripts/unit/firebase_sync.test.mjs`

## 🔒 CONST-SEC-005 — IMMUTABLE

**Password hashing algorithm must not be changed or removed.**

> **Why:** The hashing algorithm is the last line of defence for stored credentials. Changing it invalidates all existing password hashes.

> **What breaks:** All existing users are locked out. Passwords unverifiable without a migration.

*Files:* `android/app/src/main/assets/public/assets/index-BgJgrvH4.js`, `scripts/unit/media-worker.test.mjs`

## 🔴 CONST-SEC-006 — CRITICAL

**Encryption implementation must remain algorithm-compatible.**

> **Why:** Changing the encryption algorithm or key derivation method makes all existing encrypted data unreadable.

> **What breaks:** Encrypted data (tokens, at-rest fields, backups) cannot be decrypted.

*Files:* `worker-configuration.d.ts`

## 🔴 CONST-SEC-007 — CRITICAL

**Environment secrets must never be hardcoded in source files.**

> **Why:** Secrets committed to source are exposed via version control history and repository access.

> **What breaks:** Security breach. API keys, database credentials, and tokens compromised.

*Files:* `docs/generate_pdf.mjs`, `scratch/generate_pdf.mjs`, `scratch/send_tester_emails.mjs`, `scripts/cloudinary_delete_all_images.mjs`

## 🟠 CONST-SEC-008 — HIGH

**Rate limiting must not be removed from public endpoints.**

> **Why:** Rate limiting prevents brute-force attacks and denial-of-service.

> **What breaks:** Brute-force login attacks. API abuse. Service degradation under load.

*Files:* `worker-configuration.d.ts`

## 🔴 CONST-SEC-009 — CRITICAL

**Environment variable files (.env) must never be committed to version control.**

> **Why:** .env files contain secrets. Committing them exposes credentials to all repository users.

> **What breaks:** All secrets in .env become public. Immediate security incident.

*Files:* `.env`, `.env.example`
```

### .tokencap/debug/notes.md

| Field | Value |
| --- | --- |
| Bytes | 499 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```markdown
# Debug Notes

<!-- Managed by TokenCap. Generated 2026-10-11T06:39:48.897Z. -->

## Problem

No active failure has been captured.

## Error Logs

```
No captured error output is available.
```

## Stack Trace

```
No captured stack trace is available.
```

## Failed Tests

- No captured failed tests.

## Attempted Fixes

- No attempted fixes captured in this debug session.

## Suspected Files

- No suspected files inferred yet.

## Unresolved Questions

- No unresolved questions inferred yet.
```

### .tokencap/memory/current.md

| Field | Value |
| --- | --- |
| Bytes | 1432 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```markdown
# TokenCap Memory

Generated: October 11, 2026 at 12:09 PM

**Branch:** `main`

## Current Task

Working on `main` with 8 uncommitted files:
- .tokencap/graph/summary.md
- .tokencap/savings.json
- .tokencap/snapshot.md
- .tokencap/stats.json
- android/app/src/main/java/com/findlostpuppy/app/DeviceSettingsPlugin.java
- src/components/LocationPicker.tsx
- src/hooks/useLocationDetection.ts
- src/pages/Location.tsx

## Developer Intent

Not inferred from local repository evidence.

## Known Issues

- .tokencap/memory/current.md:29:- No failing test output or TODO/FIXME markers detected.
- .tokencap/memory/dev-notes.md:27:- No failing test output or TODO/FIXME markers detected.
- .tokencap/snapshot.md:47:| TODO notes | 0 |
- .tokencap/snapshot.md:654:## TODO / FIXME / HACK Notes
- .tokencap/snapshot.md:656:No TODO/FIXME/HACK notes found in selected files.

## Constraints

- No additional constraints inferred.

## Decisions Made

- No decisions inferred from the current repository state.

## Recent Changed Files

- .tokencap/debug/notes.md
- .tokencap/graph/summary.md
- .tokencap/memory/dev-notes.md
- .tokencap/savings.json
- .tokencap/snapshot.md
- .tokencap/stats.json
- android/app/src/main/java/com/findlostpuppy/app/DeviceSettingsPlugin.java
- src/components/LocationPicker.tsx
- src/hooks/useLocationDetection.ts
- src/pages/Location.tsx

## Next Steps

- Review the changed files and recent commits listed above.
```

### .tokencap/memory/dev-notes.md

| Field | Value |
| --- | --- |
| Bytes | 2814 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```markdown
# TokenCap Notes

<!-- Managed by TokenCap. Generated 2026-10-11T06:39:48.897Z. -->

## Current Task

Working on `main` with 30 uncommitted files:
- .tokencap/agent/START_HERE.md
- .tokencap/agent/agent-pack.md
- .tokencap/agent/agent.json
- .tokencap/agent/architecture.md
- .tokencap/agent/context-manifest.json
- .tokencap/agent/model-instructions.md
- .tokencap/agent/review-rules.md
- .tokencap/agent/risk-map.md
- .tokencap/agent/rules.md
- .tokencap/agent/skills.md
- .tokencap/agent/tech-stack.md
- .tokencap/constitution/compliance-rules.md

## Developer Intent

Not inferred from local repository evidence.

## Known Issues

- .tokencap/memory/current.md:25:- .tokencap/memory/current.md:29:- No failing test output or TODO/FIXME markers detected.
- .tokencap/memory/current.md:26:- .tokencap/memory/dev-notes.md:27:- No failing test output or TODO/FIXME markers detected.
- .tokencap/memory/current.md:27:- .tokencap/snapshot.md:47:| TODO notes | 0 |
- .tokencap/memory/current.md:28:- .tokencap/snapshot.md:654:## TODO / FIXME / HACK Notes
- .tokencap/memory/current.md:29:- .tokencap/snapshot.md:656:No TODO/FIXME/HACK notes found in selected files.
- .tokencap/memory/dev-notes.md:23:- .tokencap/memory/current.md:29:- No failing test output or TODO/FIXME markers detected.
- .tokencap/memory/dev-notes.md:24:- .tokencap/memory/dev-notes.md:27:- No failing test output or TODO/FIXME markers detected.
- .tokencap/memory/dev-notes.md:25:- .tokencap/snapshot.md:47:| TODO notes | 0 |
- .tokencap/memory/dev-notes.md:26:- .tokencap/snapshot.md:654:## TODO / FIXME / HACK Notes
- .tokencap/memory/dev-notes.md:27:- .tokencap/snapshot.md:656:No TODO/FIXME/HACK notes found in selected files.
- .tokencap/snapshot.md:47:| TODO notes | 0 |
- .tokencap/snapshot.md:654:## TODO / FIXME / HACK Notes

## Recent Commits

- 51954f9 chore(release): bump version to 45 (1.0.6) and add Cloudinary production fallbacks
- 529f061 Merge branch 'fixes' into main: unified location flow, CodeRabbit fixes, and owner photo reliability
- 388a6e1 Merge remote-tracking branch 'origin/main' into main (resolve Location.tsx conflicts)
- de0ac3d fix(review): address CodeRabbit feedback on location flow, consent check, and navigation
- 9d38e2d feat(reliability): unified location flow, native dialog handling, and owner photo upload reliability
- d124f3e Enforce mandatory owner photo, name, phone and block tab navigation until completed
- 3c2f2e7 feat(location): add in-app location enablement, permission modals, and fresh fix
- 333560c Merge branch 'fixes' - location detection platform-specific error handling

## Constraints

- No additional constraints inferred.

## Decisions Made

- No decisions inferred from the current repository state.

## Next Steps

- Review the changed files and recent commits listed above.
```

### scripts/check_btn_state.mjs

| Field | Value |
| --- | --- |
| Bytes | 852 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```mjs
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:9222/devtools/page/F71A143ACA0EF3B342F4BA0C48E20EC8');

ws.on('open', () => {
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));

  // Evaluate detecting state in the component
  ws.send(JSON.stringify({
    id: 10,
    method: 'Runtime.evaluate',
    params: {
      expression: `(() => {
        const btn = document.querySelector('.location-detect-primary-btn');
        return {
          btnText: btn?.innerText,
          isDisabled: btn?.disabled,
        };
      })()`,
      returnByValue: true
    }
  }));
});

ws.on('message', (msg) => {
  const data = JSON.parse(msg.toString());
  if (data.id === 10) {
    console.log('Button State:', data.result?.result?.value);
    process.exit(0);
  }
});
```

### scripts/check_webview_state.mjs

| Field | Value |
| --- | --- |
| Bytes | 1303 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```mjs
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:9222/devtools/page/773E5B600F2D20260AD61C182F2C1042');

ws.on('open', () => {
  // Enable console and runtime
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
  
  // Evaluate DOM state
  ws.send(JSON.stringify({
    id: 3,
    method: 'Runtime.evaluate',
    params: {
      expression: `({
        detectingBtn: document.querySelector('.loc-hero-detect-btn')?.innerText,
        stateText: document.querySelector('.loc-gsq-state .loc-gsq-value')?.innerText,
        districtText: document.querySelector('.loc-gsq-district .loc-gsq-value')?.innerText,
        mandalText: document.querySelector('.loc-gsq-mandal .loc-gsq-value')?.innerText,
        homeText: document.querySelector('.loc-gsq-home .loc-gsq-value')?.innerText,
        localStorageProfile: localStorage.getItem('findlostpuppy_owner_profiles'),
      })`,
      returnByValue: true
    }
  }));
});

ws.on('message', (msg) => {
  const data = JSON.parse(msg.toString());
  if (data.id === 3) {
    console.log('DOM Evaluation:', JSON.stringify(data.result, null, 2));
    process.exit(0);
  }
});

setTimeout(() => {
  console.log('Timeout waiting for response');
  process.exit(1);
}, 4000);
```

### scripts/debug_runtime.mjs

| Field | Value |
| --- | --- |
| Bytes | 1053 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```mjs
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:9222/devtools/page/773E5B600F2D20260AD61C182F2C1042');

ws.on('open', () => {
  ws.send(JSON.stringify({ id: 1, method: 'Log.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
  
  // Inspect what happened in the app
  ws.send(JSON.stringify({
    id: 3,
    method: 'Runtime.evaluate',
    params: {
      expression: `(() => {
        return {
          windowKeys: Object.keys(window).filter(k => k.includes('location') || k.includes('detect') || k.includes('geo')),
          navOnline: navigator.onLine,
        };
      })()`,
      returnByValue: true
    }
  }));
});

ws.on('message', (msg) => {
  const d = JSON.parse(msg.toString());
  if (d.method === 'Runtime.consoleAPICalled') {
    console.log('[CONSOLE]', d.params.type, d.params.args.map(a => a.value || a.description).join(' '));
  }
  if (d.id === 3) {
    console.log('Result:', JSON.stringify(d.result, null, 2));
    process.exit(0);
  }
});

setTimeout(() => process.exit(0), 4000);
```

### scripts/get_logs.mjs

| Field | Value |
| --- | --- |
| Bytes | 555 |
| Score | 120 |
| Why | changed |
| Status | Full content |


```mjs
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:9222/devtools/page/F71A143ACA0EF3B342F4BA0C48E20EC8');

ws.on('open', () => {
  ws.send(JSON.stringify({ id: 1, method: 'Log.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));

  // Evaluate any errors or logs
  ws.send(JSON.stringify({
    id: 3,
    method: 'Log.getLog',
  }));
});

ws.on('message', (msg) => {
  const d = JSON.parse(msg.toString());
  console.log('CDP message:', JSON.stringify(d, null, 2));
});

setTimeout(() => process.exit(0), 3000);
```

### src/vite-env.d.ts

| Field | Value |
| --- | --- |
| Bytes | 38 |
| Score | 30 |
| Why | source |
| Status | Full content |


```ts
/// <reference types="vite/client" />
```