import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { LegalModal } from '../components/LegalModal';
import { consentService, type AcceptedFormsState } from '../services/consentService';
import { useAuth } from '../context/AuthContext';

interface ConsentPageProps {
  onConsentAgreed: (
    acceptedForms?: Partial<AcceptedFormsState>,
    method?: 'all_forms_accepted' | 'master_declaration'
  ) => void;
}

/** Presents legal consent and age confirmation before allowing the user to continue. */
export const ConsentPage: React.FC<ConsentPageProps> = ({ onConsentAgreed }) => {
  const { user, isFirstTimeUser } = useAuth();
  const signatureBoxRef = useRef<HTMLDivElement>(null);

  // Individual forms consent state
  const [acceptedForms, setAcceptedForms] = useState<Record<'terms' | 'privacy' | 'disclaimer' | 'guidelines', boolean>>({
    terms: false,
    privacy: false,
    disclaimer: false,
    guidelines: false,
  });

  // Master declaration checkbox
  const [masterAgreed, setMasterAgreed] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [indiaResidentConfirmed, setIndiaResidentConfirmed] = useState(false);

  // Active popup form modal
  const [activeModalDocId, setActiveModalDocId] = useState<
    'terms' | 'privacy' | 'disclaimer' | 'guidelines' | null
  >(null);

  // Auto-complete if returning user or consent is already accepted
  useEffect(() => {
    if (!isFirstTimeUser || consentService.hasAcceptedCurrentConsent(user?.id)) {
      onConsentAgreed(
        {
          terms: true,
          privacy: true,
          disclaimer: true,
          guidelines: true,
          declaration: true,
        },
        'master_declaration'
      );
    }
  }, [onConsentAgreed, user?.id, isFirstTimeUser]);

  // Smooth scroll down to acceptance section so user can review the 4 forms cards first
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Allow user to read/see the 4 forms at top, then smoothly auto-scroll down to acceptance
    const splashActive = sessionStorage.getItem('findlostpuppy_launch_seen') !== 'true';
    const scrollDelay = splashActive ? 2800 : 1600;

    const autoScrollTimer = setTimeout(() => {
      if (signatureBoxRef.current) {
        signatureBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, scrollDelay);

    // Cancel auto-scroll if user interacts/scrolls manually
    const cancelAutoScroll = () => {
      clearTimeout(autoScrollTimer);
    };

    window.addEventListener('wheel', cancelAutoScroll, { passive: true });
    window.addEventListener('touchstart', cancelAutoScroll, { passive: true });

    return () => {
      clearTimeout(autoScrollTimer);
      window.removeEventListener('wheel', cancelAutoScroll);
      window.removeEventListener('touchstart', cancelAutoScroll);
    };
  }, []);

  const scrollToSignature = () => {
    signatureBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Sync master checkmark when all 4 individual forms are checked
  const allIndividualFormsChecked =
    acceptedForms.terms &&
    acceptedForms.privacy &&
    acceptedForms.disclaimer &&
    acceptedForms.guidelines;

  const canContinue = (masterAgreed || allIndividualFormsChecked) && ageConfirmed && indiaResidentConfirmed;

  // 1-Click Accept All Forms at Once (sets age 18+, Indian residency, and all 4 agreements)
  const handleAcceptAllTogether = (checked: boolean = true) => {
    setAgeConfirmed(checked);
    setIndiaResidentConfirmed(checked);
    setMasterAgreed(checked);
    setAcceptedForms({
      terms: checked,
      privacy: checked,
      disclaimer: checked,
      guidelines: checked,
    });
  };

  // Toggle all forms at once
  const handleToggleAllForms = (checked: boolean) => {
    setAcceptedForms({
      terms: checked,
      privacy: checked,
      disclaimer: checked,
      guidelines: checked,
    });
    setMasterAgreed(checked);
    if (checked) {
      setIndiaResidentConfirmed(true);
    }
  };

  const handleModalAccept = (docId: 'terms' | 'privacy' | 'disclaimer' | 'guidelines') => {
    const updated = { ...acceptedForms, [docId]: true };
    setAcceptedForms(updated);
    if (updated.terms && updated.privacy && updated.disclaimer && updated.guidelines) {
      setMasterAgreed(true);
    }
  };

  const handleContinue = () => {
    // 1-Click: auto-accept all 4 forms and continue immediately
    handleAcceptAllTogether(true);
    onConsentAgreed(
      {
        terms: true,
        privacy: true,
        disclaimer: true,
        guidelines: true,
        declaration: true,
      },
      'master_declaration'
    );
  };

  if (consentService.hasAcceptedCurrentConsent()) {
    return null;
  }

  return (
    <div className="consent-page-shell">
      <div className="consent-form-wrapper">
        {/* Main Official Legal Form Card */}
        <div className="consent-form-card card" role="form" aria-labelledby="consent-form-title">
          {/* Form Header */}
          <div className="consent-form-header text-center">
            <div className="consent-badge-pill">
              <span className="paw-emoji">🐾</span>
              <span>Community Safety Agreement</span>
            </div>
            <h1 id="consent-form-title" className="consent-form-title">
              Welcome to FindLostPuppy
            </h1>
            <p className="consent-form-subtitle">
              Welcome! Please review and accept these simple community safety forms. They keep pet
              parents, helpers, and sighting reporters on the same page.
            </p>
          </div>

          {/* Legal Agreement Forms Section */}
          <div className="legal-forms-group-section">
            <div className="forms-section-header">
              <div className="forms-section-title-wrap">
                <h2 className="forms-section-title">Review the 4 forms</h2>
                <span className="forms-section-desc">
                  Tap a card to read it. Scrolling down smoothly to accept all 4 forms at once.
                </span>
              </div>
              <button
                type="button"
                className="select-all-forms-btn forms-quick-scroll-pill"
                onClick={scrollToSignature}
                title="Scroll down to accept all 4 forms at once"
              >
                <span>⚡ Accept All 4 Forms ↓</span>
              </button>
            </div>

            {/* Form 1: Terms & Conditions */}
            <div
              className={`form-row-card ${acceptedForms.terms ? 'is-consented' : ''}`}
              onClick={() => setActiveModalDocId('terms')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveModalDocId('terms')}
            >
              <div className="form-row-left">
                <div className="form-icon-bubble">
                  <FileText size={18} />
                </div>
                <div className="form-row-info">
                  <div className="form-row-title-line">
                    <span className="form-name">Terms & Conditions Form</span>
                    <span className="form-tag">16 Sections</span>
                  </div>
                  <p className="form-desc">
                    How the community board works and what users agree to follow.
                  </p>
                </div>
              </div>

              <div className="form-row-right" onClick={(e) => e.stopPropagation()}>
                {acceptedForms.terms && (
                  <span className="form-row-status-pill">
                    <CheckCircle2 size={14} />
                    Accepted
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm open-form-arrow-btn"
                  onClick={() => setActiveModalDocId('terms')}
                  aria-label="Open Terms and Conditions form"
                >
                  <ExternalLink size={15} />
                </button>
              </div>
            </div>

            {/* Form 2: Privacy Policy */}
            <div
              className={`form-row-card ${acceptedForms.privacy ? 'is-consented' : ''}`}
              onClick={() => setActiveModalDocId('privacy')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveModalDocId('privacy')}
            >
              <div className="form-row-left">
                <div className="form-icon-bubble">
                  <ShieldCheck size={18} />
                </div>
                <div className="form-row-info">
                  <div className="form-row-title-line">
                    <span className="form-name">Privacy Policy Form</span>
                    <span className="form-tag">Data Safe</span>
                  </div>
                  <p className="form-desc">
                    How profile, pet, contact, photo, and sighting details are protected.
                  </p>
                </div>
              </div>

              <div className="form-row-right" onClick={(e) => e.stopPropagation()}>
                {acceptedForms.privacy && (
                  <span className="form-row-status-pill">
                    <CheckCircle2 size={14} />
                    Accepted
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm open-form-arrow-btn"
                  onClick={() => setActiveModalDocId('privacy')}
                  aria-label="Open Privacy Policy form"
                >
                  <ExternalLink size={15} />
                </button>
              </div>
            </div>

            {/* Form 3: Platform Disclaimer & Dog Safety */}
            <div
              className={`form-row-card ${acceptedForms.disclaimer ? 'is-consented' : ''}`}
              onClick={() => setActiveModalDocId('disclaimer')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveModalDocId('disclaimer')}
            >
              <div className="form-row-left">
                <div className="form-icon-bubble">
                  <AlertTriangle size={18} />
                </div>
                <div className="form-row-info">
                  <div className="form-row-title-line">
                    <span className="form-name">Platform Disclaimer & Dog Safety Form</span>
                    <span className="form-tag highlight">Zero Liability</span>
                  </div>
                  <p className="form-desc">
                    Safety reminders for unknown pets, sightings, locations, and meetups.
                  </p>
                </div>
              </div>

              <div className="form-row-right" onClick={(e) => e.stopPropagation()}>
                {acceptedForms.disclaimer && (
                  <span className="form-row-status-pill">
                    <CheckCircle2 size={14} />
                    Accepted
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm open-form-arrow-btn"
                  onClick={() => setActiveModalDocId('disclaimer')}
                  aria-label="Open Platform Disclaimer form"
                >
                  <ExternalLink size={15} />
                </button>
              </div>
            </div>

            {/* Form 4: User Guidelines */}
            <div
              className={`form-row-card ${acceptedForms.guidelines ? 'is-consented' : ''}`}
              onClick={() => setActiveModalDocId('guidelines')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveModalDocId('guidelines')}
            >
              <div className="form-row-left">
                <div className="form-icon-bubble">
                  <BookOpen size={18} />
                </div>
                <div className="form-row-info">
                  <div className="form-row-title-line">
                    <span className="form-name">Community Standards & Guidelines Form</span>
                    <span className="form-tag">Code of Conduct</span>
                  </div>
                  <p className="form-desc">
                    Be honest, kind, and careful when posting or reporting sightings.
                  </p>
                </div>
              </div>

              <div className="form-row-right" onClick={(e) => e.stopPropagation()}>
                {acceptedForms.guidelines && (
                  <span className="form-row-status-pill">
                    <CheckCircle2 size={14} />
                    Accepted
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm open-form-arrow-btn"
                  onClick={() => setActiveModalDocId('guidelines')}
                  aria-label="Open User Guidelines form"
                >
                  <ExternalLink size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Master Signature & Acceptance Checkbox */}
          <div className="consent-form-signature-box" ref={signatureBoxRef}>
            <div
              className="one-click-accept-banner"
              onClick={() => handleAcceptAllTogether(!canContinue)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleAcceptAllTogether(!canContinue)}
              title="Click to select all forms, confirm age 18+, and confirm Indian residency"
            >
              <div className="one-click-accept-header">
                <span className="one-click-pill">⚡ Fast Acceptance</span>
                <span className="one-click-title">Accept All Forms at Once</span>
              </div>
              <p className="one-click-desc">
                Confirms age 18+, Indian residency (DPDPA 2023), and agrees to Terms, Privacy, Dog Safety, and Guidelines in one step.
              </p>
            </div>

            <label className={`master-signature-label ${ageConfirmed ? 'is-checked' : ''}`}>
              <input
                type="checkbox"
                id="adult-age-confirmation-checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="master-signature-checkbox"
              />
              <span className="master-signature-custom" aria-hidden="true"></span>
              <span className="master-signature-text">
                <strong>I confirm that I am at least 18 years old.</strong>
              </span>
            </label>

            <label className={`master-signature-label ${indiaResidentConfirmed ? 'is-checked' : ''}`}>
              <input
                type="checkbox"
                id="india-resident-confirmation-checkbox"
                checked={indiaResidentConfirmed}
                onChange={(e) => setIndiaResidentConfirmed(e.target.checked)}
                className="master-signature-checkbox"
              />
              <span className="master-signature-custom" aria-hidden="true"></span>
              <span className="master-signature-text">
                <strong>
                  I confirm that I reside in India and agree to the Digital Personal Data Protection Act, 2023 (DPDPA) and Indian IT Act jurisdiction.
                </strong>
              </span>
            </label>

            <label className={`master-signature-label ${masterAgreed || allIndividualFormsChecked ? 'is-checked' : ''}`}>
              <input
                type="checkbox"
                id="consent-acknowledgment-checkbox"
                checked={masterAgreed || allIndividualFormsChecked}
                onChange={(e) => handleToggleAllForms(e.target.checked)}
                className="master-signature-checkbox"
              />
              <span className="master-signature-custom" aria-hidden="true"></span>
              <span className="master-signature-text">
                <strong>
                  I agree to the Terms of Service, Privacy Policy (DPDPA 2023 compliant), Dog Safety Disclaimer, and Community
                  Guidelines for using FindLostPuppy safely and responsibly across India.
                </strong>
              </span>
            </label>

            {/* Action Footer */}
            <div className="consent-form-action-row">
              <button
                type="button"
                id="agree-continue-button"
                className="btn btn-lg btn-block btn-agree-continue btn-primary enabled"
                onClick={handleContinue}
                aria-label="Accept all 4 forms and continue"
              >
                <span>Accept All 4 Forms & Continue</span>
                <ArrowRight size={18} />
              </button>
              <div className="consent-storage-note">
                <CheckCircle2 size={15} className="text-forest" />
                <span>
                  Your acceptance is saved on this device with the current form versions.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pop-up Legal Form Modal */}
      <LegalModal
        documentId={activeModalDocId}
        onClose={() => setActiveModalDocId(null)}
        isAccepted={activeModalDocId ? acceptedForms[activeModalDocId] : false}
        onAccept={handleModalAccept}
      />
    </div>
  );
};
