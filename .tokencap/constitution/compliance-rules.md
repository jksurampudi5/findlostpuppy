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

*Files:* `.tokencap/agent/START_HERE.md`, `.tokencap/agent/agent-pack.md`, `.tokencap/agent/architecture.md`, `.tokencap/agent/model-instructions.md`

## 🔴 CONST-COMP-003 — CRITICAL

**HIPAA compliance — protected health information (PHI) handling must remain compliant.**

> **Why:** HIPAA requires strict access control, audit logging, and encryption for all PHI. Removing protections is illegal.

> **What breaks:** HIPAA violation. Criminal liability. Patient data exposed.

*Files:* `.tokencap/constitution/compliance-rules.md`, `.tokencap/constitution/constitution.md`, `.tokencap/constitution/constitution.yaml`, `android/app/src/main/assets/public/assets/516-VkbN94rn.js`

## 🔴 CONST-COMP-004 — CRITICAL

**Audit logging must always be written and never removed.**

> **Why:** Audit logs provide the immutable record required for compliance, forensic investigation, and regulatory review.

> **What breaks:** Compliance audit failures. Inability to investigate security incidents. Regulatory violations.

*Files:* `.tokencap/constitution/compliance-rules.md`, `.tokencap/constitution/constitution.md`, `.tokencap/constitution/constitution.yaml`, `ADMIN_TRACKER.md`
