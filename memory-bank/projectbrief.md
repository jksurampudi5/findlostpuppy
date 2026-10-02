# Project Brief: FindLostPuppy

## 1. Executive Summary
**FindLostPuppy** is a mission-critical, community-driven emergency pet recovery and tracking platform built specifically for Indian pet parents, animal lovers, and rescue volunteers. The platform enables rapid broadcast of lost pet alerts, crowd-sourced sightings with photo verification, and filtered discovery of lost and roaming animals.

## 2. Core Problem & Mission
In India, lost pets face high mortality and displacement risks due to dense traffic, lack of centralized microchip registries, and unstructured social media broadcasts. Traditional recovery relies on fragmented local posters or WhatsApp groups that leak owner privacy and lack geographic precision.

**FindLostPuppy solves this through:**
1. **Zero-Leak Personal Privacy:** Public alert listings mask owner phone numbers (`+91 86••••••48`) and email addresses (`j•••5@gmail.com`), while never revealing exact home street addresses or GPS coordinates.
2. **Instant Emergency Broadcast:** Pet parents can broadcast their missing pet in seconds with photo compression and automatic geographic aggregation.
3. **Roaming Pet Quick Capture:** Commuters and travelers can snap photos of unattended/lost dogs on the street; the system auto-tags them as `UNKNOWN_ROAMING_PET` under "Pets Missing" so searching owners can find recent sightings.
4. **Cascading Neighborhood Filtering:** A 4-tier administrative hierarchy (State → District → Mandal → Village) enables pinpoint discovery of pets near specific neighborhoods.

## 3. Scope & Target Platforms
- **Mobile First:** Optimized for Android deployment via Capacitor 6 (Target SDK 34/35).
- **Web / PWA:** Ultra-responsive Progressive Web App running across all viewport sizes (320px to 1024px+).
- **Core Geography:** Optimized for Andhra Pradesh, Telangana, and nationwide Indian administrative divisions.

## 4. Non-Negotiable Success Criteria
- **Deny-by-Default Security:** Firestore rules restrict private pet records and SAFE status to authenticated owners only.
- **Mutual Exclusivity:** A pet can never be simultaneously `LOST` and `SAFE`.
- **Responsive Layout Stability:** Zero horizontal scrolling, zero viewport clipping, and full keyboard/notch compatibility.
- **Asset Integrity:** Memorial asset Sonu (`#1788885000505`) strictly preserved as `/src/assets/sonu.jpg`.
