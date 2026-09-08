export interface AcceptedFormsState {
  terms: boolean;
  privacy: boolean;
  disclaimer: boolean;
  guidelines: boolean;
  declaration: boolean;
}

export interface ConsentRecord {
  consentVersion: string;
  termsVersion: string;
  privacyVersion: string;
  disclaimerVersion: string;
  guidelinesVersion: string;
  agreedAt: string;
  userId?: string;
  appVersion: string;
  acceptedForms: AcceptedFormsState;
  consentMethod: 'all_forms_accepted' | 'master_declaration';
}

export const CURRENT_CONSENT_VERSION = '1.0';
export const CURRENT_TERMS_VERSION = '1.0';
export const CURRENT_PRIVACY_VERSION = '1.0';
export const CURRENT_DISCLAIMER_VERSION = '1.0';
export const CURRENT_GUIDELINES_VERSION = '1.0';
export const CURRENT_APP_VERSION = '0.1.0';

const CONSENT_STORAGE_KEY = 'findlostpuppy_consent_v1';

class ConsentService {
  private consentRecord: ConsentRecord | null = null;

  constructor() {
    this.loadConsent();
  }

  private loadConsent() {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        this.consentRecord = JSON.parse(stored);
      } else {
        this.consentRecord = null;
      }
    } catch {
      this.consentRecord = null;
    }
  }

  /**
   * Strictly verifies if the user has accepted the CURRENT version of consent.
   * If terms are updated or no consent exists, returns false.
   */
  hasAcceptedCurrentConsent(): boolean {
    this.loadConsent();
    if (!this.consentRecord) return false;
    return (
      this.consentRecord.consentVersion === CURRENT_CONSENT_VERSION &&
      this.consentRecord.termsVersion === CURRENT_TERMS_VERSION &&
      this.consentRecord.privacyVersion === CURRENT_PRIVACY_VERSION &&
      this.consentRecord.disclaimerVersion === CURRENT_DISCLAIMER_VERSION &&
      !!this.consentRecord.agreedAt
    );
  }

  getConsentRecord(): ConsentRecord | null {
    this.loadConsent();
    return this.consentRecord;
  }

  /**
   * Explicitly records user consent with timestamp, versioning, and accepted forms breakdown.
   */
  recordConsent(
    userId?: string,
    acceptedForms?: Partial<AcceptedFormsState>,
    method: 'all_forms_accepted' | 'master_declaration' = 'master_declaration'
  ): ConsentRecord {
    const fullForms: AcceptedFormsState = {
      terms: acceptedForms?.terms ?? true,
      privacy: acceptedForms?.privacy ?? true,
      disclaimer: acceptedForms?.disclaimer ?? true,
      guidelines: acceptedForms?.guidelines ?? true,
      declaration: acceptedForms?.declaration ?? true,
    };

    const record: ConsentRecord = {
      consentVersion: CURRENT_CONSENT_VERSION,
      termsVersion: CURRENT_TERMS_VERSION,
      privacyVersion: CURRENT_PRIVACY_VERSION,
      disclaimerVersion: CURRENT_DISCLAIMER_VERSION,
      guidelinesVersion: CURRENT_GUIDELINES_VERSION,
      agreedAt: new Date().toISOString(),
      userId: userId || undefined,
      appVersion: CURRENT_APP_VERSION,
      acceptedForms: fullForms,
      consentMethod: method,
    };

    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
      this.consentRecord = record;
    } catch (e) {
      console.warn('Failed to persist consent record:', e);
    }

    return record;
  }

  /**
   * Revokes or clears consent (used on account deletion or testing version bumps).
   */
  revokeConsent(): void {
    this.consentRecord = null;
    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to remove consent record:', e);
    }
  }
}

export const consentService = new ConsentService();
