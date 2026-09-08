# LEGAL REVIEW NOTICE & PLAY STORE COMPLIANCE MEMORANDUM

**Application Name:** Find Lost Puppy (FLP)  
**Document Reference:** FLP-LEGAL-REVIEW-001  
**Target Region:** India & Global Play Store Deployment  
**Applicable Legal Frameworks Considered:**
- Digital Personal Data Protection Act (DPDPA), 2023 (India)
- Information Technology Act, 2000 & Intermediary Guidelines (India)
- Google Play Developer Program Policies: User Generated Content (UGC), App Safety, Privacy & Security
- Prevention of Cruelty to Animals Act, 1960 & Animal Welfare Regulations

---

## ⚠️ Mandatory Legal Counsel Review Required

> [!IMPORTANT]
> **This platform implementation, its user consent form, disclaimers, terms, privacy disclosures, and safety procedures DO NOT constitute formal legal advice and DO NOT guarantee complete legal immunity or absolute liability protection under all jurisdictions.**
> 
> Before publishing Find Lost Puppy on the Google Play Store or deploying to production, a qualified legal practitioner licensed in the relevant jurisdiction must formally review and calibrate all documents listed below.

---

## Items Requiring Professional Legal Review

### 1. Terms & Conditions
- Review enforceable scope under Section 79 of the Indian Information Technology Act (Intermediary Safe Harbor).
- Review arbitration and dispute resolution clauses under Indian Arbitration and Conciliation Act.
- Clarify governing law and jurisdiction (e.g. Telangana / Andhra Pradesh / local district courts).

### 2. Privacy Policy & DPDPA (2023) Compliance
- Verify lawful basis for processing pet parent contact information (email address, telephone number, approximate neighborhood).
- Confirm compliance with Notice, Consent, and Data Principal Rights under India's Digital Personal Data Protection Act (DPDPA).
- Confirm clarity regarding local browser/device storage architecture vs. cloud sync.

### 3. Disclaimers & Non-Responsibility Language
- **Dog Safety & Custody:** Explicitly disclaiming physical rescue, capture, custody, sheltering, transportation, and veterinary care.
- **Dog Problems (Rabies, Bites, Attacks, Injuries):** Disclaiming liability for aggressive dogs, bites to adults/children, and inter-dog fights.
- **Developer, Platform & Guest User Non-Liability:** Ensuring that neither platform maintainers nor innocent third-party sighting reporters bear tortious liability for pet loss or finder disputes.
- **Location Accuracy:** Ensuring that user-reported or approximate administrative areas (State → District → Mandal → Village) are clearly recognized as non-real-time estimates.

### 4. Limitation of Liability
- Verify enforceability of limitation of liability and exclusion of incidental/consequential damages under applicable contract and consumer protection law.
- Ensure that the agreement does not unlawfully attempt to contract out of non-waivable statutory duties.

### 5. Pre-Authentication Consent Flow & Tamper Resistance
- Enforceability of the electronic click-wrap consent record (version `1.0`, timestamp, explicit unchecked checkbox).
- Evidence retention requirements for proving user consent acceptance upon dispute.

### 6. User-Generated Content (UGC) & Google Play Requirements
In accordance with Google Play's User Generated Content (UGC) Policy:
- **Terms Acceptance:** Users must explicitly accept Terms and Guidelines before submitting content.
- **Content Reporting Mechanism:** Built-in listing reporting with actionable categories (Fake/misleading, Incorrect info, Incorrect location, Inappropriate photo, Privacy, Harassment, Suspicious, Other).
- **User Reporting Mechanism:** Built-in user reporting (Harassment, Fraud, Impersonation, Abuse, Spam, Suspicious, Other).
- **User Blocking:** In-app blocking mechanism hiding listings and sightings from blocked users.
- **Moderation Workflow:** Timely triage and removal of objectionable content and abusive accounts.

### 7. Account & Data Deletion
- Implementation of `Settings → Delete Account` allowing users to permanently purge their account, profile, dog listings, sightings, and photos.
- Compliance with Google Play's Account Deletion Requirement (accessible within the app and via external web link).
- Definition of legitimate data retention periods (e.g., preserving anonymized abuse logs to prevent ban evasion).

---

## Technical Summary of Implemented Legal Safeguards

| Safeguard | Implementation Status | Component / Storage |
| :--- | :--- | :--- |
| **Mandatory Pre-Auth Consent** | Implemented | `ConsentPage.tsx`, `App.tsx` gate |
| **Unchecked Agreement Checkbox** | Implemented | Strict state requirement (`checked={hasAgreed}`) |
| **Tamper-Resistant Gating** | Implemented | URL/refresh/back bypass blocked |
| **Versioned Consent Record** | Implemented | `consentService.ts` (`v1.0`, timestamp) |
| **Listing Reporting (8 Categories)** | Implemented | `ReportModal.tsx`, `storageService.ts` |
| **User Reporting (7 Categories)** | Implemented | `ReportModal.tsx`, `storageService.ts` |
| **User Blocking & Feed Filtering** | Implemented | `DogDetailPage.tsx`, `DashboardPage.tsx` |
| **Settings & Legal Access Hub** | Implemented | `SettingsLegalModal.tsx`, `Navbar.tsx`, `Footer.tsx` |
| **Account & Data Deletion** | Implemented | Cascading purge via `deleteUserAccount()` |
| **Streamlined Sign-In Form** | Implemented | Email-only sign in (`EmailAuthPage.tsx`) |

---

*This document should be retained with the codebase and presented to legal counsel prior to commercial release.*
