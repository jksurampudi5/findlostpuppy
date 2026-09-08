export interface LegalDocument {
  id: 'terms' | 'privacy' | 'disclaimer' | 'guidelines';
  title: string;
  version: string;
  lastUpdated: string;
  sections: {
    heading: string;
    content: string | string[];
  }[];
}

export const TERMS_AND_CONDITIONS: LegalDocument = {
  id: 'terms',
  title: 'Terms & Conditions',
  version: '1.0',
  lastUpdated: 'September 2026',
  sections: [
    {
      heading: '1. Purpose of the Application',
      content:
        'Find Lost Puppy is a community-driven digital information-sharing platform. Its sole purpose is to provide a venue where dog owners, neighbors, and volunteers can upload, view, and search information and photographs of missing or sighted dogs. The platform operates solely as a digital bulletin and communication aid.',
    },
    {
      heading: '2. User Responsibilities',
      content: [
        'You are entirely responsible for the information, descriptions, contact details, and photographs you submit to the application.',
        'You agree to use the service in good faith and solely for lawful, non-commercial purposes related to locating lost dogs or reporting sightings.',
        'You must independently verify all information before taking any physical, financial, or personal actions.',
      ],
    },
    {
      heading: '3. User-Generated Content',
      content: [
        'All listings, descriptions, sighting reports, and messages are submitted directly by users.',
        'Find Lost Puppy does not pre-screen, verify, or warrant the accuracy, authenticity, or truthfulness of user-generated content.',
        'We reserve the right to review, flag, or remove any content that violates these Terms or applicable law.',
      ],
    },
    {
      heading: '4. Photo Uploads & Permissions',
      content: [
        'You must hold the necessary legal rights, copyright, or authorization to upload any photograph to the service.',
        'Do not upload photographs depicting people without consent, sensitive private documents, or explicit, offensive, or copyrighted material.',
        'By uploading photos, you grant Find Lost Puppy a non-exclusive license to display the image solely for the purpose of community dog identification and search flyers.',
      ],
    },
    {
      heading: '5. Location Information & Disclaimers',
      content: [
        'Locations shown in the application represent user-submitted areas or device-detected data at the time of report creation.',
        'A dog’s physical position changes dynamically; a dog may no longer be present at or near a listed location.',
        'Displayed locations are approximate for community search purposes and must never be interpreted as real-time tracking or guaranteed presence.',
      ],
    },
    {
      heading: '6. Pet Ownership Disclaimer',
      content: [
        'Find Lost Puppy does not verify, confirm, or determine legal ownership of any animal.',
        'A person creating a report or claiming to be an owner may not be the legitimate owner.',
        'Users must conduct their own independent verification (e.g., matching medical records, municipal registration, or distinctive traits) before transferring custody of any pet.',
      ],
    },
    {
      heading: '7. Pet Safety & Welfare Disclaimer',
      content: [
        'Find Lost Puppy does not take physical custody, responsibility, or care of any pet listed on the service.',
        'We do not guarantee that any missing dog will be found, recovered, returned, safe, uninjured, or provided with veterinary care.',
        'All decisions regarding physical care, medical treatment, or retrieval of an animal are made independently by the parties involved.',
      ],
    },
    {
      heading: '8. User-to-User Interactions',
      content: [
        'Find Lost Puppy is not a party to any communication, meeting, handover, or arrangement between users.',
        'We cannot guarantee the identity, background, intentions, or safety of any user you interact with.',
        'Always exercise caution: meet in public, well-lit places during daylight, bring a companion, and do not make unverified financial payments or wire transfers.',
      ],
    },
    {
      heading: '9. Prohibited Use',
      content: [
        'You must not use this application for any unlawful activity, fraud, extortion, harassment, stalking, or impersonation.',
        'Falsely claiming ownership of a dog or fabricating missing pet reports is strictly prohibited.',
        'Commercial solicitation, pet sales, spam, unauthorized data scraping, and malicious bot activity are forbidden.',
      ],
    },
    {
      heading: '10. Account Suspension & Termination',
      content:
        'We reserve the right to suspend or terminate accounts, remove listings, or block access to users who violate these Terms, harass others, submit fraudulent reports, or act contrary to community safety and applicable law.',
    },
    {
      heading: '11. Reporting & Content Moderation',
      content:
        'Users can report suspicious, false, or abusive listings and profiles using the built-in Report feature. Reports are reviewed by moderators. Submitting a report does not guarantee immediate or automatic removal.',
    },
    {
      heading: '12. General Disclaimers',
      content:
        'THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
    },
    {
      heading: '13. Limitation of Liability',
      content:
        'To the maximum extent permitted by applicable law, Find Lost Puppy, its creators, and operators shall not be liable for any direct, indirect, incidental, consequential, or punitive damages resulting from your use of the platform, loss of pets, personal injury, user disputes, or reliance on user-uploaded information.',
    },
    {
      heading: '14. Changes to Terms',
      content:
        'We may update these Terms periodically. When material changes occur, users will be required to review and accept the revised terms upon signing in or opening the app.',
    },
    {
      heading: '15. Legal Compliance',
      content:
        'Users are required to comply with all applicable local, state, and national laws, including animal welfare regulations and privacy rules.',
    },
    {
      heading: '16. Contact Information & Support',
      content:
        'For inquiries, concerns, or legal notices, please reach out to the community team at support@findlostpuppy.local or through the official GitHub project repository.',
    },
  ],
};

export const PRIVACY_POLICY: LegalDocument = {
  id: 'privacy',
  title: 'Privacy Policy',
  version: '1.0',
  lastUpdated: 'September 2026',
  sections: [
    {
      heading: '1. Information We Collect',
      content: [
        'Account Information: Email address and optional parent name provided upon sign-in.',
        'Pet Parent Profile: Full name, phone number, and safe public administrative area (State, District, Mandal, and Locality/Village).',
        'Dog Information: Name, breed, gender, age, distinguishing traits, microchip status, and uploaded photographs.',
        'Location Data: Administrative hierarchy selections. If you permit device GPS detection, coordinates are converted to official administrative areas via reverse-geocoding.',
        'Reports & Sightings: Date, time, description, approximate area, and sighting photos submitted.',
        'Safety & Moderation: User reports, listing reports, blocked accounts, and consent acceptance timestamps.',
      ],
    },
    {
      heading: '2. How We Use Information',
      content: [
        'To display community missing-pet alerts and digital search flyers to neighbors in your area.',
        'To help reunite pet parents with sighted dogs.',
        'To verify community search radiuses without exposing exact private addresses.',
        'To enforce community guidelines, prevent fraud, and moderate reported content.',
      ],
    },
    {
      heading: '3. Data Storage & Architecture',
      content: [
        'In the current version (v1.0), application state, session data, user profiles, dog listings, and consent records are stored locally within your browser/device localStorage.',
        'Your private home address is never collected or shown. Only broad, safe public administrative units (e.g. Village, Mandal, District) are shown on alerts.',
      ],
    },
    {
      heading: '4. Information Sharing & Disclosure',
      content: [
        'Public Data: Missing dog photos, names, breed, last-seen approximate area, and sighting notes are publicly visible to visitors.',
        'Protected Data: Your private telephone number and email are kept hidden by default and only revealed through protected contact mechanism actions.',
        'Third-Party Sharing: We do not sell, rent, or trade your personal information to third parties or advertisers.',
      ],
    },
    {
      heading: '5. Account & Data Deletion Rights',
      content: [
        'You have the complete right to delete your account and associated data at any time.',
        'Navigate to Settings → Delete Account in the application.',
        'Upon deletion, your profile, dog profiles, missing reports, photos, and active session are purged.',
        'Minimal anonymized moderation logs may be retained solely where necessary to prevent repeated abuse or comply with legal requirements.',
      ],
    },
    {
      heading: '6. Cookies & Tracking',
      content:
        'Find Lost Puppy uses standard browser storage strictly for functional application state (authentication remembrance and saved pet data). We do not employ third-party advertising trackers.',
    },
    {
      heading: '7. Updates to this Policy',
      content:
        'We may revise this Privacy Policy to reflect application enhancements. Changes will be posted with an updated version number and date.',
    },
  ],
};

export const DISCLAIMER: LegalDocument = {
  id: 'disclaimer',
  title: 'Platform Disclaimer',
  version: '1.0',
  lastUpdated: 'September 2026',
  sections: [
    {
      heading: 'Not an Emergency, Police, or Rescue Service',
      content: [
        'Find Lost Puppy is strictly a digital bulletin and peer-to-peer communication board.',
        'We are NOT a police department, law enforcement agency, animal control authority, or legal advisory service.',
        'We are NOT an emergency response unit, veterinary hospital, or animal rescue shelter.',
        'If you or an animal are in immediate danger or distress, contact local police, emergency services, or licensed veterinarians immediately.',
      ],
    },
    {
      heading: 'No Custody, Transport, or Physical Search',
      content: [
        'Find Lost Puppy staff and software do NOT physically search for, track, capture, rescue, transport, shelter, or care for any animal.',
        'We do not guarantee the recovery, safety, health, or return of any dog listed on the site.',
      ],
    },
    {
      heading: 'Dynamic & Approximate Locations',
      content: [
        'Displayed locations reflect user-reported sightings or general neighborhood areas.',
        'Dogs move rapidly; an animal may have moved far from the reported location.',
        'Do not assume a listed location represents the dog’s current guaranteed position.',
      ],
    },
    {
      heading: 'Independent Verification Mandatory',
      content: [
        'You must independently verify the identity of any claimant and the physical condition of any pet.',
        'Find Lost Puppy assumes no liability for disputes, accidents, handovers, or transactions between users.',
      ],
    },
  ],
};

export const USER_GUIDELINES: LegalDocument = {
  id: 'guidelines',
  title: 'Community User Guidelines',
  version: '1.0',
  lastUpdated: 'September 2026',
  sections: [
    {
      heading: '1. Be Truthful & Accurate',
      content: [
        'Provide honest, recent photos and descriptive traits of missing or found dogs.',
        'Never submit fabricated reports, prank listings, or false sightings.',
      ],
    },
    {
      heading: '2. Respect Pet Safety',
      content: [
        'Never corner, threaten, or chase an unfamiliar frightened dog. Approach cautiously or contact local animal welfare volunteers.',
        'Ensure proper identification (collar tags, microchip scan at a vet) before claiming or handing over any pet.',
      ],
    },
    {
      heading: '3. Respect Community Privacy',
      content: [
        'Do not post personal home addresses, phone numbers, or photos of neighbors without their permission.',
        'Keep communications polite, helpful, and focused on pet reunion.',
      ],
    },
    {
      heading: '4. Zero Tolerance for Scams & Harassment',
      content: [
        'Demanding ransom money, extortion, rewards for fabricated sightings, or abusive language will result in immediate account termination and reporting to relevant authorities.',
      ],
    },
  ],
};
