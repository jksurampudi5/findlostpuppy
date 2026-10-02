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

export const CURRENT_CONSENT_VERSION = '1.1';
export const CURRENT_TERMS_VERSION = '1.1';
export const CURRENT_PRIVACY_VERSION = '1.1';
export const CURRENT_DISCLAIMER_VERSION = '1.0';
export const CURRENT_GUIDELINES_VERSION = '1.0';
export const CURRENT_APP_VERSION = '0.1.0';

const CONSENT_STORAGE_KEY = 'findlostpuppy_consent_v1';

class ConsentService {
  private consentRecord: ConsentRecord | null = null;

  constructor() {
    this.loadConsent();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === CONSENT_STORAGE_KEY) {
          this.loadConsent();
          window.dispatchEvent(new CustomEvent('findlostpuppy_consent_updated'));
        }
      });
    }
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
   * Verifies if the user or device has accepted consent.
   * If a returning user has previous consent, or if current consent is stored, returns true.
   */
  hasAcceptedCurrentConsent(userId?: string): boolean {
    this.loadConsent();
    if (userId && typeof localStorage !== 'undefined') {
      if (localStorage.getItem(`findlostpuppy_returning_user_${userId}`) === 'true') return true;
      if (localStorage.getItem(`findlostpuppy_consent_accepted_${userId}`) === 'true') return true;
    }
    if (!this.consentRecord) return false;
    return (
      this.consentRecord.consentVersion === CURRENT_CONSENT_VERSION &&
      this.consentRecord.termsVersion === CURRENT_TERMS_VERSION &&
      this.consentRecord.privacyVersion === CURRENT_PRIVACY_VERSION &&
      this.consentRecord.disclaimerVersion === CURRENT_DISCLAIMER_VERSION &&
      this.consentRecord.guidelinesVersion === CURRENT_GUIDELINES_VERSION &&
      !!this.consentRecord.agreedAt
    );
  }

  /**
   * Checks whether the user is a genuine first-time user who needs to see the initial consent.
   */
  isFirstTimeUser(userId?: string): boolean {
    if (typeof localStorage === 'undefined') return true;
    if (localStorage.getItem('findlostpuppy_has_accepted_consent') === 'true') return false;
    if (userId) {
      if (localStorage.getItem(`findlostpuppy_returning_user_${userId}`) === 'true') return false;
      if (localStorage.getItem(`findlostpuppy_consent_accepted_${userId}`) === 'true') return false;
    }
    if (this.hasAcceptedCurrentConsent(userId)) return false;
    return true;
  }

  /**
   * Permanently flags consent as completed for an existing user so they never see it again.
   */
  markConsentCompletedForUser(userId?: string): void {
    try {
      localStorage.setItem('findlostpuppy_has_accepted_consent', 'true');
      if (userId) {
        localStorage.setItem(`findlostpuppy_consent_accepted_${userId}`, 'true');
        localStorage.setItem(`findlostpuppy_returning_user_${userId}`, 'true');
      }
      if (!this.hasAcceptedCurrentConsent(userId)) {
        this.recordConsent(userId);
      }
    } catch (e) {
      console.warn('Failed to mark consent:', e);
    }
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
      if (userId) {
        localStorage.setItem(`findlostpuppy_consent_accepted_${userId}`, 'true');
        localStorage.setItem(`findlostpuppy_returning_user_${userId}`, 'true');
      }
      this.consentRecord = record;
    } catch (e) {
      console.warn('Failed to persist consent record:', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('findlostpuppy_consent_updated'));
    }

    return record;
  }

  /**
   * Revokes or clears consent (used on account deletion or testing version bumps).
   */
  revokeConsent(userId?: string): void {
    this.consentRecord = null;
    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      localStorage.removeItem('findlostpuppy_has_accepted_consent');
      if (userId) {
        localStorage.removeItem(`findlostpuppy_consent_accepted_${userId}`);
        localStorage.removeItem(`findlostpuppy_returning_user_${userId}`);
      }
    } catch (e) {
      console.warn('Failed to remove consent record:', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('findlostpuppy_consent_updated'));
    }
  }
}

export const consentService = new ConsentService();
