# Privacy and Legal Launch Checklist

Last reviewed: 29 September 2026

This is an engineering and operations checklist, not a legal opinion. A qualified lawyer should confirm which laws apply to the operator, users, launch states, revenue, and data practices before public launch.

## Implemented in the app

- Versioned, affirmative consent with renewed acceptance for Terms and Privacy Policy v1.1.
- Account creation and personal-data submission limited to users who confirm they are at least 18.
- Notice of collected data, purposes, service providers, local/offline storage, retention approach, user rights, grievance contact, and breach notification.
- Account-deletion request flow, owner-scoped database rules, masked public contact details, approximate public locations, and no advertising trackers.
- Crash-safe seven-day form drafts and a bounded compressed-image retry queue.

## Operator actions required before launch

- Have Indian and U.S. privacy counsel review the Terms, Privacy Policy, consent design, and actual business model.
- Monitor `jksurampudi5@gmail.com` for privacy and grievance requests and document identity verification, response, appeal, and closure dates.
- Execute and retain appropriate processor terms/data-processing agreements with Firebase/Google, Cloudinary, and any location provider.
- Implement an authenticated server-side Cloudinary deletion endpoint and verify that account deletion removes provider-hosted images. Until then, the UI accurately states that image cleanup may take additional processing.
- Maintain a written incident-response process that can identify affected records, preserve evidence, notify affected people and authorities when required, and record decisions.
- Keep a data inventory and retention schedule for accounts, profiles, pet records, missing reports, sightings, moderation records, backups, and hosted images.
- Confirm whether any U.S. state privacy law applies based on the operator's location, revenue, processing volume, and business practices. Add state-specific request methods or notices if counsel determines they are required.
- Do not knowingly accept data from children. If the service later allows minors, implement verified parental consent and child-specific controls before doing so.
- Provide translated notices in relevant Indian languages when operationally required and ensure withdrawal is as easy as consent.
- Re-run security, rules, dependency, backup, deletion, and recovery tests before each release.

## Primary official references

- India: Digital Personal Data Protection Act, 2023 — https://www.meity.gov.in/static/uploads/2024/02/Digital-Personal-Data-Protection-Act-2023.pdf
- India: Ministry of Electronics and Information Technology DPDP materials — https://www.meity.gov.in/data-protection-framework
- United States: FTC Children's Privacy/COPPA — https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy
- California: Attorney General CCPA guidance — https://www.oag.ca.gov/privacy/ccpa
