# TokenCap Project Graph

Generated: 01/10/2026, 22:44:10

> **Language Support Note**: The graph only parses JS/TS imports
> (`.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`). Files in other languages
> (Python, Go, Rust, etc.) appear as isolated nodes with no edges.

## Changed Files

- docs/generate_pdf.mjs
- scripts/capture_animation_showcase.mjs
- scripts/capture_logo_flow.mjs
- scripts/generate_all_docs_pdfs.mjs
- scripts/notify_testers.mjs
- scripts/test_admin_security_guard.mjs
- scripts/test_auth_consent_flow.mjs
- scripts/test_component_transitions.mjs
- scripts/test_fast_capture.mjs
- scripts/test_feedback_component.mjs
- scripts/test_interstitial_transition.mjs
- scripts/test_responsive.mjs
- scripts/test_table_launch_transition.mjs
- scripts/verify_admin_shortcuts_tabs.mjs
- src/App.tsx
- src/components/SidebarNav.tsx
- src/services/storageService.ts
- src/pages/ConsentPage.tsx
- src/pages/EmailAuthPage.tsx
- src/pages/PetParentContactPage.tsx
- src/pages/LocationOnboardingPage.tsx
- src/pages/DogOnboardingPage.tsx
- src/pages/ReportLostDogPage.tsx
- src/pages/OnboardingChoicePage.tsx
- src/pages/DashboardPage.tsx
- src/pages/AdminDashboardPage.tsx
- src/pages/CapturePetPage.tsx
- src/pages/PrivacyPolicyPage.tsx
- src/pages/ShortcutsPage.tsx
- src/components/LaunchTributeOverlay.tsx
- src/components/SuggestionWidget.tsx
- src/services/authService.ts
- src/services/firebaseSyncService.ts
- src/utils/locationMatchHelper.ts
- src/vite-env.d.ts
- vite.config.ts

## File Relationships

scratch/test_consent_flow.mjs
→ scripts/qa_lib.mjs

scripts/capture_card_and_sighting.mjs
→ scripts/qa_lib.mjs

scripts/capture_clean_remaining.mjs
→ scripts/qa_lib.mjs

scripts/capture_deep_flows.mjs
→ scripts/qa_lib.mjs

scripts/capture_exact_checkpoints.mjs
→ scripts/qa_lib.mjs

scripts/execute_onboarding_and_alert_flows.mjs
→ scripts/qa_lib.mjs

scripts/release_regression_verify.mjs
→ scripts/qa_lib.mjs

scripts/run_all_qa_checkpoints.mjs
→ scripts/qa_lib.mjs

scripts/run_complete_qa.mjs
→ scripts/qa_lib.mjs

scripts/run_continuous_onboarding.mjs
→ scripts/qa_lib.mjs

scripts/unit/drafts_and_consent.test.mjs
→ scripts/unit/test_harness.mjs

scripts/unit/fallbacks.test.mjs
→ scripts/unit/test_harness.mjs

scripts/unit/firebase_sync.test.mjs
→ scripts/unit/test_harness.mjs

scripts/unit/location_regressions.test.mjs
→ scripts/unit/test_harness.mjs

scripts/unit/media_client.test.mjs
→ scripts/unit/test_harness.mjs

scripts/unit/media_functions.test.mjs
→ scripts/unit/test_harness.mjs

scripts/unit/media_worker.test.mjs
→ scripts/unit/test_harness.mjs

scripts/unit/storage_recovery.test.mjs
→ scripts/unit/test_harness.mjs

src/App.tsx
→ src/context/AuthContext.tsx
→ src/context/ToastContext.tsx
→ src/components/SidebarNav.tsx
→ src/components/Footer.tsx
→ src/services/storageService.ts
→ src/pages/ConsentPage.tsx
→ src/pages/EmailAuthPage.tsx
→ src/pages/PetParentContactPage.tsx
→ src/pages/LocationOnboardingPage.tsx
→ src/pages/DogOnboardingPage.tsx
→ src/pages/ReportLostDogPage.tsx
→ src/pages/GuestSightingPage.tsx
→ src/pages/OnboardingChoicePage.tsx
→ src/components/ui/AnimationShowcaseStudio.tsx
→ src/pages/DiscoveryPage.tsx
→ src/pages/DogDetailPage.tsx
→ src/pages/DashboardPage.tsx
→ src/pages/AdminDashboardPage.tsx
→ src/pages/CapturePetPage.tsx
→ src/pages/PrivacyPolicyPage.tsx
→ src/pages/ShortcutsPage.tsx
→ src/components/LaunchTributeOverlay.tsx
→ src/components/SuggestionWidget.tsx
→ src/components/NetworkResilience.tsx
→ src/components/fallbacks/ServerFailureNotice.tsx
→ src/components/fallbacks/LoadingFallback.tsx
→ src/components/ui/PageTransition.tsx

src/components/AdminUserProximityMap.tsx
→ src/types/index.ts
→ src/context/ToastContext.tsx

src/components/CameraModal.tsx
→ src/context/ToastContext.tsx
→ src/components/fallbacks/PermissionFallback.tsx

src/components/DogCard.tsx
→ src/types/index.ts
→ src/components/StatusBadge.tsx
→ src/utils/dogPhotoHelper.ts
→ src/utils/privacyUtils.ts

src/components/ErrorBoundary.tsx
⇒ src/components/fallbacks/AppErrorBoundary.tsx

src/components/Footer.tsx
→ src/components/SettingsLegalModal.tsx

src/components/ImageUploader.tsx
→ src/utils/imageCompressor.ts
→ src/services/storageBucketService.ts

src/components/LegalModal.tsx
→ src/data/legal/legalContent.ts

src/components/LocationPicker.tsx
→ src/context/ToastContext.tsx
→ src/services/locationService.ts
→ src/utils/geolocationHelper.ts
→ src/components/SearchableSelect.tsx
→ src/components/PermissionRationaleModal.tsx
→ src/types/index.ts

src/components/MissingPetReportModal.tsx
→ src/context/ToastContext.tsx
→ src/utils/geolocationHelper.ts
→ src/types/index.ts
→ src/hooks/useCrashSafeDraft.ts

src/components/Navbar.tsx
→ src/context/AuthContext.tsx
→ src/services/storageService.ts

src/components/NetworkResilience.tsx
→ src/services/storageBucketService.ts
→ src/services/storageService.ts
→ src/hooks/useOnlineStatus.ts
→ src/components/fallbacks/OfflineFallback.tsx

src/components/PetProfileSelector.tsx
→ src/utils/breedAssetHelper.tsx

src/components/ReportModal.tsx
→ src/services/storageService.ts
→ src/types/index.ts

src/components/SettingsLegalModal.tsx
→ src/context/AuthContext.tsx
→ src/services/consentService.ts
→ src/services/storageService.ts
→ src/data/legal/legalContent.ts
→ src/types/index.ts

src/components/SidebarNav.tsx
→ src/components/ui/align-justify-icon.tsx
→ src/context/AuthContext.tsx
→ src/services/storageService.ts

src/components/SightingModal.tsx
→ src/types/index.ts
→ src/services/storageService.ts
→ src/context/ToastContext.tsx
→ src/context/AuthContext.tsx
→ src/utils/imageCompressor.ts
→ src/utils/phoneValidator.ts
→ src/services/storageBucketService.ts
→ src/hooks/useCrashSafeDraft.ts

src/components/StatusBadge.tsx
→ src/types/index.ts

src/components/SuggestionWidget.tsx
→ src/context/AuthContext.tsx
→ src/context/ToastContext.tsx
→ src/services/storageService.ts
→ src/types/index.ts

src/components/admin/AdminShortcuts.tsx
→ src/context/AuthContext.tsx
→ src/components/ui/LoadingButton.tsx
→ src/data/legal/legalContent.ts

src/components/fallbacks/AppErrorBoundary.tsx
→ src/components/fallbacks/FallbackShell.tsx

src/components/fallbacks/LoadingFallback.tsx
→ src/components/fallbacks/FallbackShell.tsx

src/components/fallbacks/OfflineFallback.tsx
→ src/components/fallbacks/FallbackShell.tsx

src/components/fallbacks/PermissionFallback.tsx
→ src/components/fallbacks/FallbackShell.tsx

src/components/fallbacks/ServerFailureNotice.tsx
→ src/services/storageService.ts

src/components/ui/AnimationShowcaseStudio.tsx
→ src/components/ui/LoadingButton.tsx
→ src/components/ui/LogoLeashRunFlowTransition.tsx

src/context/AuthContext.tsx
→ src/types/index.ts
→ src/services/authService.ts
→ src/services/storageService.ts
→ src/services/consentService.ts
→ src/services/storageBucketService.ts
→ src/services/firebaseSyncService.ts
→ src/services/firebaseConfig.ts

src/main.tsx
→ src/App.tsx
→ src/components/ErrorBoundary.tsx

src/pages/AdminDashboardPage.tsx
→ src/context/AuthContext.tsx
→ src/context/ToastContext.tsx
→ src/services/storageService.ts
→ src/services/storageBucketService.ts
→ src/components/StatusBadge.tsx
→ src/components/AdminUserProximityMap.tsx
→ src/components/admin/AdminShortcuts.tsx
→ src/components/ui/LoadingButton.tsx
→ src/types/index.ts
→ src/utils/dogPhotoHelper.ts
→ src/utils/shareHelper.ts
→ src/utils/confettiHelper.ts

src/pages/CapturePetPage.tsx
→ src/context/AuthContext.tsx
→ src/context/ToastContext.tsx
→ src/services/storageService.ts
→ src/services/storageBucketService.ts
→ src/services/locationService.ts
→ src/types/index.ts
→ src/utils/geolocationHelper.ts
→ src/utils/dogPhotoHelper.ts
→ src/components/PermissionRationaleModal.tsx
→ src/components/PetProfileSelector.tsx
→ src/utils/imageCompressor.ts
→ src/components/ui/back-button.tsx
→ src/utils/locationMatchHelper.ts

src/pages/ConsentPage.tsx
→ src/components/LegalModal.tsx
→ src/services/consentService.ts

src/pages/DashboardPage.tsx
→ src/context/AuthContext.tsx
→ src/context/ToastContext.tsx
→ src/services/storageService.ts
→ src/services/locationService.ts
→ src/types/index.ts
→ src/utils/dogPhotoHelper.ts
→ src/utils/locationMatchHelper.ts
→ src/components/fallbacks/EmptyState.tsx

src/pages/DiscoveryPage.tsx
→ src/types/index.ts
→ src/services/storageService.ts
→ src/components/DogCard.tsx
→ src/components/fallbacks/EmptyState.tsx

src/pages/DogDetailPage.tsx
→ src/types/index.ts
→ src/services/storageService.ts
→ src/components/StatusBadge.tsx
→ src/components/SightingModal.tsx
→ src/components/ReportModal.tsx
→ src/context/ToastContext.tsx
→ src/utils/confettiHelper.ts
→ src/utils/dogPhotoHelper.ts
→ src/utils/shareHelper.ts
→ src/context/AuthContext.tsx
→ src/utils/privacyUtils.ts

src/pages/DogOnboardingPage.tsx
→ src/context/AuthContext.tsx
→ src/context/ToastContext.tsx
→ src/services/storageService.ts
→ src/services/storageBucketService.ts
→ src/types/index.ts
→ src/utils/dogPhotoHelper.ts
→ src/utils/imageCompressor.ts
→ src/utils/photoChangePolicy.ts
→ src/components/ui/back-button.tsx
→ src/data/dogBreeds.ts
→ src/utils/breedAssetHelper.tsx
→ src/components/PetProfileSelector.tsx
→ src/components/CameraModal.tsx

src/pages/EmailAuthPage.tsx
→ src/context/AuthContext.tsx
→ src/context/ToastContext.tsx

src/pages/GuestSightingPage.tsx
→ src/services/storageService.ts
→ src/context/ToastContext.tsx
→ src/utils/imageCompressor.ts
→ src/utils/dogPhotoHelper.ts
→ src/utils/shareHelper.ts
→ src/utils/privacyUtils.ts
→ src/utils/geolocationHelper.ts
→ src/context/AuthContext.tsx
→ src/services/storageBucketService.ts
→ src/types/index.ts
→ src/hooks/useCrashSafeDraft.ts
→ src/components/fallbacks/LoadingFallback.tsx
→ src/components/fallbacks/EmptyState.tsx

src/pages/HomePage.tsx
→ src/types/index.ts
→ src/services/storageService.ts
→ src/components/DogCard.tsx
→ src/utils/dogPhotoHelper.ts

src/pages/LocationOnboardingPage.tsx
→ src/context/AuthContext.tsx
→ src/context/ToastContext.tsx
→ src/services/storageService.ts
→ src/services/locationService.ts
→ src/components/PetProfileSelector.tsx
→ src/components/PermissionRationaleModal.tsx
→ src/types/index.ts
→ src/utils/dogPhotoHelper.ts
→ src/components/ui/back-button.tsx
→ src/components/ui/DogRunFlowTransition.tsx

src/pages/OnboardingChoicePage.tsx
→ src/context/AuthContext.tsx
→ src/services/storageService.ts
→ src/utils/dogPhotoHelper.ts
→ src/components/ui/back-button.tsx

src/pages/OwnerOnboardingPage.tsx
⇒ src/pages/PetParentContactPage.tsx

src/pages/PetParentContactPage.tsx
→ src/context/AuthContext.tsx
→ src/context/ToastContext.tsx
→ src/services/storageService.ts
→ src/services/authService.ts
→ src/types/index.ts
→ src/utils/imageCompressor.ts
→ src/utils/phoneValidator.ts
→ src/utils/privacyUtils.ts
→ src/services/storageBucketService.ts
→ src/services/firebaseSyncService.ts
→ src/utils/dogPhotoHelper.ts
→ src/utils/photoChangePolicy.ts
→ src/components/CameraModal.tsx
→ src/components/ui/DogRunFlowTransition.tsx

src/pages/PrivacyPolicyPage.tsx
→ src/data/legal/legalContent.ts

src/pages/ReportLostDogPage.tsx
→ src/context/AuthContext.tsx
→ src/context/ToastContext.tsx
→ src/services/storageService.ts
→ src/types/index.ts
→ src/utils/confettiHelper.ts
→ src/components/MissingPetReportModal.tsx
→ src/utils/dogPhotoHelper.ts
→ src/utils/shareHelper.ts
→ src/components/ui/back-button.tsx

src/pages/ReportWizardPage.tsx
→ src/context/AuthContext.tsx
→ src/context/ToastContext.tsx
→ src/components/LocationPicker.tsx
→ src/components/ImageUploader.tsx
→ src/services/storageService.ts
→ src/types/index.ts
→ src/utils/phoneValidator.ts

src/pages/ShortcutsPage.tsx
→ src/components/admin/AdminShortcuts.tsx

src/services/authService.ts
→ src/types/index.ts
→ src/services/firebaseConfig.ts
→ src/services/firebaseSyncService.ts

src/services/firebaseSyncService.ts
→ src/services/firebaseConfig.ts
→ src/services/storageBucketService.ts
→ src/types/index.ts
→ src/utils/dogPhotoHelper.ts

src/services/locationService.ts
→ src/types/index.ts

src/services/seedData.ts
→ src/types/index.ts

src/services/storageBucketService.ts
→ src/services/firebaseConfig.ts

src/services/storageService.ts
→ src/types/index.ts
→ src/services/consentService.ts
→ src/services/firebaseConfig.ts
→ src/services/authService.ts
→ src/utils/dogPhotoHelper.ts
→ src/services/storageBucketService.ts

src/utils/boundaryLookup.ts
→ src/services/locationService.ts

src/utils/breedAssetHelper.tsx
→ src/data/dogBreeds.ts

src/utils/dogPhotoHelper.ts
→ src/services/storageService.ts
→ src/types/index.ts

src/utils/geoData.ts
→ src/services/locationService.ts

src/utils/geolocationHelper.ts
→ src/utils/boundaryLookup.ts

src/utils/locationMatchHelper.ts
→ src/types/index.ts

src/utils/privacyUtils.ts
→ src/types/index.ts
⇒ src/utils/phoneValidator.ts

src/utils/shareHelper.ts
→ src/types/index.ts
→ src/utils/dogPhotoHelper.ts

## Important Nodes

- scripts/unit/drafts_and_consent.test.mjs — test
- scripts/unit/fallbacks.test.mjs — test
- scripts/unit/firebase_sync.test.mjs — test
- scripts/unit/location_regressions.test.mjs — test
- scripts/unit/media_client.test.mjs — test
- scripts/unit/media_functions.test.mjs — test
- scripts/unit/media_worker.test.mjs — test
- scripts/unit/storage_recovery.test.mjs — test
- src/hooks/useCrashSafeDraft.ts — hook
- src/hooks/useOnlineStatus.ts — hook
- src/utils/boundaryLookup.ts — utility
- src/utils/breedAssetHelper.tsx — utility
- src/utils/confettiHelper.ts — utility
- src/utils/dogPhotoHelper.ts — utility
- src/utils/geoData.ts — utility
- src/utils/geolocationHelper.ts — utility
- src/utils/imageCompressor.ts — utility
- src/utils/locationMatchHelper.ts — utility *(changed)*
- src/utils/phoneValidator.ts — utility
- src/utils/photoChangePolicy.ts — utility
- src/utils/privacyUtils.ts — utility
- src/utils/shareHelper.ts — utility
- android/app/src/main/assets/public/assets/28_mandals-CVEUtnws.js — route
- android/app/src/main/assets/public/assets/29_mandals-Dqsb_zjr.js — route
- android/app/src/main/assets/public/assets/36_mandals-CC785lOf.js — route
- android/app/src/main/assets/public/assets/501-Dv5GF2oC.js — route
- android/app/src/main/assets/public/assets/502-CiKnfBNR.js — route
- android/app/src/main/assets/public/assets/503-DRnrewue.js — route
- android/app/src/main/assets/public/assets/504-Bfx4Lstf.js — route
- android/app/src/main/assets/public/assets/505-CAVQ_9yF.js — route
- android/app/src/main/assets/public/assets/506-Cr9i6YqL.js — route
- android/app/src/main/assets/public/assets/507-CINqtXAB.js — route
- android/app/src/main/assets/public/assets/508-D0nItL8p.js — route
- android/app/src/main/assets/public/assets/509-B5KE7Y6e.js — route
- android/app/src/main/assets/public/assets/510-BWbjsvWc.js — route
- android/app/src/main/assets/public/assets/511-_WX6vzfv.js — route
- android/app/src/main/assets/public/assets/512-BB57rvd8.js — route
- android/app/src/main/assets/public/assets/513-aV3nhEOE.js — route
- android/app/src/main/assets/public/assets/514-BJOuGM6E.js — route
- android/app/src/main/assets/public/assets/515-DgE7xlSK.js — route
- android/app/src/main/assets/public/assets/516-VkbN94rn.js — route
- android/app/src/main/assets/public/assets/517-CF9MNAPY.js — route
- android/app/src/main/assets/public/assets/518-CM1iD2Ol.js — route
- android/app/src/main/assets/public/assets/519-CugEqc_8.js — route
- android/app/src/main/assets/public/assets/520-BNxLdlev.js — route
- android/app/src/main/assets/public/assets/521-B2ncdNWl.js — route
- android/app/src/main/assets/public/assets/522-CL3YEBVR.js — route
- android/app/src/main/assets/public/assets/523-ClCfdAWi.js — route
- android/app/src/main/assets/public/assets/524-C1oINcei.js — route
- android/app/src/main/assets/public/assets/525-bjcHBb8t.js — route
- android/app/src/main/assets/public/assets/526-CHgEkd90.js — route
- android/app/src/main/assets/public/assets/527-KBqK6ljF.js — route
- android/app/src/main/assets/public/assets/528-OFhYce7r.js — route
- android/app/src/main/assets/public/assets/529-5lCbiqdn.js — route
- android/app/src/main/assets/public/assets/530-sJzN4oON.js — route
- android/app/src/main/assets/public/assets/531-h01X0AF2.js — route
- android/app/src/main/assets/public/assets/532-DElGPl-C.js — route
- android/app/src/main/assets/public/assets/533-DrAJKBL7.js — route
- android/app/src/main/assets/public/assets/534-2YT2jEpL.js — route
- android/app/src/main/assets/public/assets/535-DueuO2he.js — route
- android/app/src/main/assets/public/assets/536-CBbXGY9Z.js — route
- android/app/src/main/assets/public/assets/537-B0tf_CCR.js — route
- android/app/src/main/assets/public/assets/538-BltqbBm4.js — route
- android/app/src/main/assets/public/assets/539-DVhQYVx6.js — route
- android/app/src/main/assets/public/assets/540-rNMS9GzX.js — route
- android/app/src/main/assets/public/assets/541-DyuEXzuG.js — route
- android/app/src/main/assets/public/assets/542-Ch8wKS98.js — route
- android/app/src/main/assets/public/assets/543-CZkyWbfS.js — route
- android/app/src/main/assets/public/assets/544-BiESLSy5.js — route
- android/app/src/main/assets/public/assets/545-DnF8cpm3.js — route
- android/app/src/main/assets/public/assets/546-CEBNVJmp.js — route
- android/app/src/main/assets/public/assets/547--Sii-d9R.js — route
- android/app/src/main/assets/public/assets/548-BIHR71gK.js — route
- android/app/src/main/assets/public/assets/549-DngjKRxy.js — route
- android/app/src/main/assets/public/assets/550-BSa1LjOd.js — route
- android/app/src/main/assets/public/assets/630-CmJLdvsq.js — route
- android/app/src/main/assets/public/assets/631-BTRU5Dgy.js — route
- android/app/src/main/assets/public/assets/635-Q9Se5S4E.js — route
- android/app/src/main/assets/public/assets/680-DGk3JgRB.js — route
- android/app/src/main/assets/public/assets/681-D7Vck4yu.js — route
- android/app/src/main/assets/public/assets/682-CLVwavQi.js — route
- android/app/src/main/assets/public/assets/683-cli5rhFz.js — route
- android/app/src/main/assets/public/assets/684-C8AR2itm.js — route
- android/app/src/main/assets/public/assets/685-CD5gA4cw.js — route
- android/app/src/main/assets/public/assets/686-DYY9tZGg.js — route
- android/app/src/main/assets/public/assets/687-CfdTCMOv.js — route
- android/app/src/main/assets/public/assets/688-Dpo9hqYh.js — route
- android/app/src/main/assets/public/assets/689-6xmubMbG.js — route
- android/app/src/main/assets/public/assets/690-Cdzt8Bsh.js — route
- android/app/src/main/assets/public/assets/691-Djkyg05h.js — route
- android/app/src/main/assets/public/assets/692-CTQucKNL.js — route
- android/app/src/main/assets/public/assets/693-CTi2LbUs.js — route
- android/app/src/main/assets/public/assets/694-eV74KxAR.js — route
- android/app/src/main/assets/public/assets/695-CjWVl6gH.js — route
- android/app/src/main/assets/public/assets/696-2WWLLHQp.js — route
- android/app/src/main/assets/public/assets/697-DKviOHwP.js — route
- android/app/src/main/assets/public/assets/698-DMWxEI1m.js — route
- android/app/src/main/assets/public/assets/699-xOXVFYZY.js — route
- android/app/src/main/assets/public/assets/700-PQWX5pSW.js — route
- android/app/src/main/assets/public/assets/720-uO_69pcG.js — route
- android/app/src/main/assets/public/assets/721-DmhAewqk.js — route
- android/app/src/main/assets/public/assets/738-C2mH502w.js — route
- android/app/src/main/assets/public/assets/743-J5hT5sFy.js — route
- android/app/src/main/assets/public/assets/744-CA2dSslM.js — route
- android/app/src/main/assets/public/assets/745-DD7EdU6i.js — route
- android/app/src/main/assets/public/assets/746-CMIxdwyq.js — route
- android/app/src/main/assets/public/assets/747-Dm8KGMxE.js — route
- android/app/src/main/assets/public/assets/748-Bt5bY80A.js — route
- android/app/src/main/assets/public/assets/749-DKOwrRjb.js — route
- android/app/src/main/assets/public/assets/750-CrQ8iF97.js — route
- android/app/src/main/assets/public/assets/751-BNd53R4M.js — route
- android/app/src/main/assets/public/assets/752-CbkjVCbe.js — route
- android/app/src/main/assets/public/assets/753-C2l6WBY4.js — route
- android/app/src/main/assets/public/assets/754-BWKBOdRJ.js — route
- android/app/src/main/assets/public/assets/755-Gme_wl79.js — route
- android/app/src/main/assets/public/assets/790-C7om_uC-.js — route
- android/app/src/main/assets/public/assets/791-BzvkFCJZ.js — route
- android/app/src/main/assets/public/assets/index-CDlfJJiG.js — route
- android/app/src/main/assets/public/assets/web-BWStb2OY.js — route
- android/app/src/main/assets/public/assets/web-C1f0M_I9.js — route
- android/app/src/main/assets/public/assets/web-CXDVJ7zT.js — route
- android/app/src/main/assets/public/cordova_plugins.js — route
- android/app/src/main/assets/public/cordova.js — route
- src/pages/AdminDashboardPage.tsx — route *(changed)*
- src/pages/CapturePetPage.tsx — route *(changed)*
- src/pages/ConsentPage.tsx — route *(changed)*
- src/pages/DashboardPage.tsx — route *(changed)*
- src/pages/DiscoveryPage.tsx — route
- src/pages/DogDetailPage.tsx — route
- src/pages/DogOnboardingPage.tsx — route *(changed)*
- src/pages/EmailAuthPage.tsx — route *(changed)*
- src/pages/GuestSightingPage.tsx — route
- src/pages/HomePage.tsx — route
- src/pages/LocationOnboardingPage.tsx — route *(changed)*
- src/pages/OnboardingChoicePage.tsx — route *(changed)*
- src/pages/OwnerOnboardingPage.tsx — route
- src/pages/PetParentContactPage.tsx — route *(changed)*
- src/pages/PrivacyPolicyPage.tsx — route *(changed)*
- src/pages/ReportLostDogPage.tsx — route *(changed)*
- src/pages/ReportWizardPage.tsx — route
- src/pages/ShortcutsPage.tsx — route *(changed)*
- src/App.tsx — component *(changed)*
- src/components/admin/AdminShortcuts.tsx — component
- src/components/AdminUserProximityMap.tsx — component
- src/components/CameraModal.tsx — component
- src/components/DogAwayFromHomeAnimation.tsx — component
- src/components/DogCard.tsx — component
- src/components/DogGoingHomeAnimation.tsx — component
- src/components/ErrorBoundary.tsx — component
- src/components/fallbacks/AppErrorBoundary.tsx — component
- src/components/fallbacks/EmptyState.tsx — component
- src/components/fallbacks/FallbackShell.tsx — component
- src/components/fallbacks/LoadingFallback.tsx — component
- src/components/fallbacks/OfflineFallback.tsx — component
- src/components/fallbacks/PermissionFallback.tsx — component
- src/components/fallbacks/ServerFailureNotice.tsx — component
- src/components/Footer.tsx — component
- src/components/ImageUploader.tsx — component
- src/components/LaunchTributeOverlay.tsx — component *(changed)*
- src/components/LegalModal.tsx — component
- src/components/LocationPicker.tsx — component
- src/components/MissingPetReportModal.tsx — component
- src/components/Navbar.tsx — component
- src/components/NetworkResilience.tsx — component
- src/components/PermissionRationaleModal.tsx — component
- src/components/PetProfileSelector.tsx — component
- src/components/ReportModal.tsx — component
- src/components/SearchableSelect.tsx — component
- src/components/SettingsLegalModal.tsx — component
- src/components/SidebarNav.tsx — component *(changed)*
- src/components/SightingModal.tsx — component
- src/components/StatusBadge.tsx — component
- src/components/SuggestionWidget.tsx — component *(changed)*
- src/components/ui/align-justify-icon.tsx — component
- src/components/ui/AnimationShowcaseStudio.tsx — component
- src/components/ui/back-button.tsx — component
- src/components/ui/button.tsx — component
- src/components/ui/demo.tsx — component
- src/components/ui/DogRunFlowTransition.tsx — component
- src/components/ui/FlowLoadingScreen.tsx — component
- src/components/ui/LoadingButton.tsx — component
- src/components/ui/LogoLeashRunFlowTransition.tsx — component
- src/components/ui/PageTransition.tsx — component
- src/context/AuthContext.tsx — component
- src/context/ToastContext.tsx — component
- src/main.tsx — component
- src/lib/utils.ts — service
- src/services/authService.ts — service *(changed)*
- src/services/consentService.ts — service
- src/services/firebaseConfig.ts — service
- src/services/firebaseSyncService.ts — service *(changed)*
- src/services/locationService.ts — service
- src/services/seedData.ts — service
- src/services/storageBucketService.ts — service
- src/services/storageService.ts — service *(changed)*
- scratch/execute_media_migration.ts — database
- scratch/execute_safe_migration_workflow.mjs — database
- vite.config.ts — config *(changed)*

## All Scanned Files

Total: 304 JS/TS files scanned.

### 🛣️ Route (119)

- android/app/src/main/assets/public/assets/28_mandals-CVEUtnws.js
- android/app/src/main/assets/public/assets/29_mandals-Dqsb_zjr.js
- android/app/src/main/assets/public/assets/36_mandals-CC785lOf.js
- android/app/src/main/assets/public/assets/501-Dv5GF2oC.js
- android/app/src/main/assets/public/assets/502-CiKnfBNR.js
- android/app/src/main/assets/public/assets/503-DRnrewue.js
- android/app/src/main/assets/public/assets/504-Bfx4Lstf.js
- android/app/src/main/assets/public/assets/505-CAVQ_9yF.js
- android/app/src/main/assets/public/assets/506-Cr9i6YqL.js
- android/app/src/main/assets/public/assets/507-CINqtXAB.js
- android/app/src/main/assets/public/assets/508-D0nItL8p.js
- android/app/src/main/assets/public/assets/509-B5KE7Y6e.js
- android/app/src/main/assets/public/assets/510-BWbjsvWc.js
- android/app/src/main/assets/public/assets/511-_WX6vzfv.js
- android/app/src/main/assets/public/assets/512-BB57rvd8.js
- android/app/src/main/assets/public/assets/513-aV3nhEOE.js
- android/app/src/main/assets/public/assets/514-BJOuGM6E.js
- android/app/src/main/assets/public/assets/515-DgE7xlSK.js
- android/app/src/main/assets/public/assets/516-VkbN94rn.js
- android/app/src/main/assets/public/assets/517-CF9MNAPY.js
- android/app/src/main/assets/public/assets/518-CM1iD2Ol.js
- android/app/src/main/assets/public/assets/519-CugEqc_8.js
- android/app/src/main/assets/public/assets/520-BNxLdlev.js
- android/app/src/main/assets/public/assets/521-B2ncdNWl.js
- android/app/src/main/assets/public/assets/522-CL3YEBVR.js
- android/app/src/main/assets/public/assets/523-ClCfdAWi.js
- android/app/src/main/assets/public/assets/524-C1oINcei.js
- android/app/src/main/assets/public/assets/525-bjcHBb8t.js
- android/app/src/main/assets/public/assets/526-CHgEkd90.js
- android/app/src/main/assets/public/assets/527-KBqK6ljF.js
- android/app/src/main/assets/public/assets/528-OFhYce7r.js
- android/app/src/main/assets/public/assets/529-5lCbiqdn.js
- android/app/src/main/assets/public/assets/530-sJzN4oON.js
- android/app/src/main/assets/public/assets/531-h01X0AF2.js
- android/app/src/main/assets/public/assets/532-DElGPl-C.js
- android/app/src/main/assets/public/assets/533-DrAJKBL7.js
- android/app/src/main/assets/public/assets/534-2YT2jEpL.js
- android/app/src/main/assets/public/assets/535-DueuO2he.js
- android/app/src/main/assets/public/assets/536-CBbXGY9Z.js
- android/app/src/main/assets/public/assets/537-B0tf_CCR.js
- android/app/src/main/assets/public/assets/538-BltqbBm4.js
- android/app/src/main/assets/public/assets/539-DVhQYVx6.js
- android/app/src/main/assets/public/assets/540-rNMS9GzX.js
- android/app/src/main/assets/public/assets/541-DyuEXzuG.js
- android/app/src/main/assets/public/assets/542-Ch8wKS98.js
- android/app/src/main/assets/public/assets/543-CZkyWbfS.js
- android/app/src/main/assets/public/assets/544-BiESLSy5.js
- android/app/src/main/assets/public/assets/545-DnF8cpm3.js
- android/app/src/main/assets/public/assets/546-CEBNVJmp.js
- android/app/src/main/assets/public/assets/547--Sii-d9R.js
- android/app/src/main/assets/public/assets/548-BIHR71gK.js
- android/app/src/main/assets/public/assets/549-DngjKRxy.js
- android/app/src/main/assets/public/assets/550-BSa1LjOd.js
- android/app/src/main/assets/public/assets/630-CmJLdvsq.js
- android/app/src/main/assets/public/assets/631-BTRU5Dgy.js
- android/app/src/main/assets/public/assets/635-Q9Se5S4E.js
- android/app/src/main/assets/public/assets/680-DGk3JgRB.js
- android/app/src/main/assets/public/assets/681-D7Vck4yu.js
- android/app/src/main/assets/public/assets/682-CLVwavQi.js
- android/app/src/main/assets/public/assets/683-cli5rhFz.js
- android/app/src/main/assets/public/assets/684-C8AR2itm.js
- android/app/src/main/assets/public/assets/685-CD5gA4cw.js
- android/app/src/main/assets/public/assets/686-DYY9tZGg.js
- android/app/src/main/assets/public/assets/687-CfdTCMOv.js
- android/app/src/main/assets/public/assets/688-Dpo9hqYh.js
- android/app/src/main/assets/public/assets/689-6xmubMbG.js
- android/app/src/main/assets/public/assets/690-Cdzt8Bsh.js
- android/app/src/main/assets/public/assets/691-Djkyg05h.js
- android/app/src/main/assets/public/assets/692-CTQucKNL.js
- android/app/src/main/assets/public/assets/693-CTi2LbUs.js
- android/app/src/main/assets/public/assets/694-eV74KxAR.js
- android/app/src/main/assets/public/assets/695-CjWVl6gH.js
- android/app/src/main/assets/public/assets/696-2WWLLHQp.js
- android/app/src/main/assets/public/assets/697-DKviOHwP.js
- android/app/src/main/assets/public/assets/698-DMWxEI1m.js
- android/app/src/main/assets/public/assets/699-xOXVFYZY.js
- android/app/src/main/assets/public/assets/700-PQWX5pSW.js
- android/app/src/main/assets/public/assets/720-uO_69pcG.js
- android/app/src/main/assets/public/assets/721-DmhAewqk.js
- android/app/src/main/assets/public/assets/738-C2mH502w.js
- android/app/src/main/assets/public/assets/743-J5hT5sFy.js
- android/app/src/main/assets/public/assets/744-CA2dSslM.js
- android/app/src/main/assets/public/assets/745-DD7EdU6i.js
- android/app/src/main/assets/public/assets/746-CMIxdwyq.js
- android/app/src/main/assets/public/assets/747-Dm8KGMxE.js
- android/app/src/main/assets/public/assets/748-Bt5bY80A.js
- android/app/src/main/assets/public/assets/749-DKOwrRjb.js
- android/app/src/main/assets/public/assets/750-CrQ8iF97.js
- android/app/src/main/assets/public/assets/751-BNd53R4M.js
- android/app/src/main/assets/public/assets/752-CbkjVCbe.js
- android/app/src/main/assets/public/assets/753-C2l6WBY4.js
- android/app/src/main/assets/public/assets/754-BWKBOdRJ.js
- android/app/src/main/assets/public/assets/755-Gme_wl79.js
- android/app/src/main/assets/public/assets/790-C7om_uC-.js
- android/app/src/main/assets/public/assets/791-BzvkFCJZ.js
- android/app/src/main/assets/public/assets/index-CDlfJJiG.js
- android/app/src/main/assets/public/assets/web-BWStb2OY.js
- android/app/src/main/assets/public/assets/web-C1f0M_I9.js
- android/app/src/main/assets/public/assets/web-CXDVJ7zT.js
- android/app/src/main/assets/public/cordova_plugins.js
- android/app/src/main/assets/public/cordova.js
- src/pages/AdminDashboardPage.tsx *(changed)*
- src/pages/CapturePetPage.tsx *(changed)*
- src/pages/ConsentPage.tsx *(changed)*
- src/pages/DashboardPage.tsx *(changed)*
- src/pages/DiscoveryPage.tsx
- src/pages/DogDetailPage.tsx
- src/pages/DogOnboardingPage.tsx *(changed)*
- src/pages/EmailAuthPage.tsx *(changed)*
- src/pages/GuestSightingPage.tsx
- src/pages/HomePage.tsx
- src/pages/LocationOnboardingPage.tsx *(changed)*
- src/pages/OnboardingChoicePage.tsx *(changed)*
- src/pages/OwnerOnboardingPage.tsx
- src/pages/PetParentContactPage.tsx *(changed)*
- src/pages/PrivacyPolicyPage.tsx *(changed)*
- src/pages/ReportLostDogPage.tsx *(changed)*
- src/pages/ReportWizardPage.tsx
- src/pages/ShortcutsPage.tsx *(changed)*

### 🧩 Component (45)

- src/App.tsx *(changed)*
- src/components/admin/AdminShortcuts.tsx
- src/components/AdminUserProximityMap.tsx
- src/components/CameraModal.tsx
- src/components/DogAwayFromHomeAnimation.tsx
- src/components/DogCard.tsx
- src/components/DogGoingHomeAnimation.tsx
- src/components/ErrorBoundary.tsx
- src/components/fallbacks/AppErrorBoundary.tsx
- src/components/fallbacks/EmptyState.tsx
- src/components/fallbacks/FallbackShell.tsx
- src/components/fallbacks/LoadingFallback.tsx
- src/components/fallbacks/OfflineFallback.tsx
- src/components/fallbacks/PermissionFallback.tsx
- src/components/fallbacks/ServerFailureNotice.tsx
- src/components/Footer.tsx
- src/components/ImageUploader.tsx
- src/components/LaunchTributeOverlay.tsx *(changed)*
- src/components/LegalModal.tsx
- src/components/LocationPicker.tsx
- src/components/MissingPetReportModal.tsx
- src/components/Navbar.tsx
- src/components/NetworkResilience.tsx
- src/components/PermissionRationaleModal.tsx
- src/components/PetProfileSelector.tsx
- src/components/ReportModal.tsx
- src/components/SearchableSelect.tsx
- src/components/SettingsLegalModal.tsx
- src/components/SidebarNav.tsx *(changed)*
- src/components/SightingModal.tsx
- src/components/StatusBadge.tsx
- src/components/SuggestionWidget.tsx *(changed)*
- src/components/ui/align-justify-icon.tsx
- src/components/ui/AnimationShowcaseStudio.tsx
- src/components/ui/back-button.tsx
- src/components/ui/button.tsx
- src/components/ui/demo.tsx
- src/components/ui/DogRunFlowTransition.tsx
- src/components/ui/FlowLoadingScreen.tsx
- src/components/ui/LoadingButton.tsx
- src/components/ui/LogoLeashRunFlowTransition.tsx
- src/components/ui/PageTransition.tsx
- src/context/AuthContext.tsx
- src/context/ToastContext.tsx
- src/main.tsx

### ⚙️ Service (9)

- src/lib/utils.ts
- src/services/authService.ts *(changed)*
- src/services/consentService.ts
- src/services/firebaseConfig.ts
- src/services/firebaseSyncService.ts *(changed)*
- src/services/locationService.ts
- src/services/seedData.ts
- src/services/storageBucketService.ts
- src/services/storageService.ts *(changed)*

### 🗄️ Database (2)

- scratch/execute_media_migration.ts
- scratch/execute_safe_migration_workflow.mjs

### 🔧 Config (1)

- vite.config.ts *(changed)*

### 📄 Unknown (106)

- .github/workflows/deploy.yml
- .tokencap/constitution/api-contracts.yaml
- .tokencap/constitution/constitution.yaml
- .tokencap/constitution/schema-invariants.yaml
- capacitor.config.ts
- cleanup_cloudinary.js
- docs/generate_pdf.mjs *(changed)*
- functions/index.js
- scratch/apply_sonu_corrections.mjs
- scratch/audit_all_integrity.mjs
- scratch/capture_full_navigation_flow.mjs
- scratch/capture_full_tabs.cjs
- scratch/capture_owner_glow.mjs
- scratch/capture_tribute.mjs
- scratch/check_and_delete_supabase_data.cjs
- scratch/check_android_webview.mjs
- scratch/clean_supabase_duplicates.cjs
- scratch/extract_session.cjs
- scratch/fetch_users.mjs
- scratch/generate_cheat_sheet.mjs
- scratch/generate_pdf.mjs
- scratch/inspect_details.mjs
- scratch/inspect_localstorage.cjs
- scratch/inspect_media_columns.cjs
- scratch/inspect_page.mjs
- scratch/inspect_profiles_table.cjs
- scratch/inspect_summary.cjs
- scratch/inspect_supabase.cjs
- scratch/inspect_supabase.mjs
- scratch/investigate_sonu_integrity.mjs
- scratch/reproduce_data_wipe.mjs
- scratch/send_tester_emails.mjs
- scratch/test_admin.cjs
- scratch/test_admin.js
- scratch/test_consent_flow.mjs
- scratch/test_dashboard_multiuser.cjs
- scratch/test_delete_and_sync.cjs
- scratch/test_deletion_and_privacy.cjs
- scratch/test_dynamic_images.cjs
- scratch/test_email_dedup_and_scd2.cjs
- scratch/test_full_app_lifecycle.cjs
- scratch/test_master_system_verification.cjs
- scratch/test_navigation_and_deduplication.cjs
- scratch/test_pet_profile_ui.mjs
- scratch/test_pet_safety_acid_transitions.cjs
- scratch/test_phone_validation_and_masking.cjs
- scratch/test_privacy_and_permanent_delete.cjs
- scratch/test_registration_and_dashboard_sync.cjs
- scratch/test_ssr.mjs
- scratch/test_step12_privacy_verification.mjs
- scratch/test_supabase_debug.mjs
- scratch/test_whatsapp_shared_link.cjs
- scratch/verify_dashboard_feedback_button.mjs
- scratch/verify_dog_image.cjs
- scratch/verify_inauguration_and_consent.mjs
- scratch/verify_integrity.cjs
- scratch/verify_rate_app_flow.mjs
- scratch/wipe_supabase_data.mjs
- scripts/capture_animation_showcase.mjs *(changed)*
- scripts/capture_card_and_sighting.mjs
- scripts/capture_clean_remaining.mjs
- scripts/capture_deep_flows.mjs
- scripts/capture_exact_checkpoints.mjs
- scripts/capture_logo_flow.mjs *(changed)*
- scripts/capture_playstore_screenshots.js
- scripts/cloudinary_delete_all_images.mjs
- scripts/execute_onboarding_and_alert_flows.mjs
- scripts/generate_all_docs_pdfs.mjs *(changed)*
- scripts/notify_testers.mjs *(changed)*
- scripts/qa_lib.mjs
- scripts/release_regression_verify.mjs
- scripts/run_all_qa_checkpoints.mjs
- scripts/run_complete_qa.mjs
- scripts/run_continuous_onboarding.mjs
- scripts/test_admin_security_guard.mjs *(changed)*
- scripts/test_all_components_flow.mjs
- scripts/test_auth_consent_flow.mjs *(changed)*
- scripts/test_browser_autodetect.mjs
- scripts/test_component_transitions.mjs *(changed)*
- scripts/test_fast_capture.mjs *(changed)*
- scripts/test_feedback_component.mjs *(changed)*
- scripts/test_hard_reset_and_cloudinary_removal.mjs
- scripts/test_interstitial_transition.mjs *(changed)*
- scripts/test_location_accuracy.mjs
- scripts/test_location_back_and_pet_choice_flow.mjs
- scripts/test_mobile_interactions.mjs
- scripts/test_responsive.mjs *(changed)*
- scripts/test_table_launch_transition.mjs *(changed)*
- scripts/unit/test_harness.mjs
- scripts/validate_firebase_env.mjs
- scripts/verify_admin_shortcuts_tabs.mjs *(changed)*
- scripts/verify_android_assets.mjs
- scripts/verify_automotive_theme.mjs
- scripts/verify_cloudinary_privacy.mjs
- scripts/verify_firestore_privacy.mjs
- scripts/verify_localhost.mjs
- scripts/verify_resilience.mjs
- scripts/verify_sidebar_navigation.mjs
- scripts/visual_qa_runner.mjs
- src/data/dogBreeds.ts
- src/data/legal/legalContent.ts
- src/types/geojson.d.ts
- src/types/index.ts
- src/vite-env.d.ts *(changed)*
- worker-configuration.d.ts
- worker/index.ts
