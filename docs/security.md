# Security & Privacy Architecture — FindLostPuppy 🐾

Security and location privacy are first-class engineering requirements of the FindLostPuppy platform.

## 1. Strict Privacy Separation
* **Private Owner Location**: Stored securely. Contains house numbers, flat/door numbers, and exact residential street names. Used exclusively for verification and authorized match coordination.
* **Public Approximate Location**: Computed and sanitized (e.g. `Near Benz Circle, Vijayawada` or `Near Bio-Diversity Park, Gachibowli, Hyderabad`). Only this sanitized string is exposed to public cards, APIs, and search views.
* **GPS Coordinate Offset**: Any browser GPS coordinates collected with consent have meter-level precision rounded off to protect user residence privacy.

## 2. Authentication & Authorization Guards
* Unauthenticated visitors cannot create lost dog reports or modify existing records.
* Protected routes (`/report`, `/dashboard`) redirect to auth modal with return capability.
* Owners can only edit and update the status of their own registered pets.

## 3. Safe Contact Mechanisms
* Phone numbers and email addresses can be selectively hidden or shown with consent.
* Rescuers reporting sightings have their contact info shared only with the verified pet owner, never publicly on the web page.

## 4. Input & File Upload Validation
* File uploads are restricted to valid image types (JPG, PNG, WebP) and constrained to < 5MB.
* Client-side validation prevents oversized payloads or injection attacks.
* No API credentials, service accounts, or private tokens are committed to source control.
