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

*Files:* `scripts/test_auth_consent_flow.mjs`, `scripts/unit/firebase_sync.test.mjs`, `scripts/validate_firebase_env.mjs`, `src/context/AuthContext.tsx`

## 🔒 CONST-SEC-004 — IMMUTABLE

**Authentication middleware (scripts/test_auth_consent_flow.mjs, scripts/unit/firebase_sync.test.mjs) must remain enabled on all protected routes.**

> **Why:** These files guard access to protected resources. Disabling or bypassing them exposes all protected data.

> **What breaks:** Unauthorized users gain access to protected routes, user data, and admin features.

*Files:* `scripts/test_auth_consent_flow.mjs`, `scripts/unit/firebase_sync.test.mjs`, `scripts/validate_firebase_env.mjs`, `src/context/AuthContext.tsx`

## 🔒 CONST-SEC-005 — IMMUTABLE

**Password hashing algorithm must not be changed or removed.**

> **Why:** The hashing algorithm is the last line of defence for stored credentials. Changing it invalidates all existing password hashes.

> **What breaks:** All existing users are locked out. Passwords unverifiable without a migration.

*Files:* `android/app/src/main/assets/public/assets/index-CDlfJJiG.js`

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
