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

*Files:* `scripts/execute_onboarding_and_alert_flows.mjs`, `scripts/run_continuous_onboarding.mjs`, `src/pages/DogOnboardingPage.tsx`, `src/pages/LocationOnboardingPage.tsx`, `src/pages/OnboardingChoicePage.tsx`

## 🔴 CONST-FLOW-003 — CRITICAL

**Notification Pipeline (email, webhook, SMS) must remain operational.**

> **Why:** Notifications are critical for transactional communication (receipts, alerts, order updates).

> **What breaks:** Users stop receiving transactional emails. Webhooks fail silently. Integrations break.

*Files:* `scratch/send_tester_emails.mjs`, `src/pages/EmailAuthPage.tsx`
