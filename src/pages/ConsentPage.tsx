import React, { useState, useEffect } from 'react';
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
import type { AcceptedFormsState } from '../services/consentService';

interface ConsentPageProps {
  onConsentAgreed: (
    acceptedForms?: Partial<AcceptedFormsState>,
    method?: 'all_forms_accepted' | 'master_declaration'
  ) => void;
}

export const ConsentPage: React.FC<ConsentPageProps> = ({ onConsentAgreed }) => {
  // Individual forms consent state
  const [acceptedForms, setAcceptedForms] = useState<Record<'terms' | 'privacy' | 'disclaimer' | 'guidelines', boolean>>({
    terms: false,
    privacy: false,
    disclaimer: false,
    guidelines: false,
  });

  // Master declaration checkbox
  const [masterAgreed, setMasterAgreed] = useState(false);

  // Active popup form modal
  const [activeModalDocId, setActiveModalDocId] = useState<
    'terms' | 'privacy' | 'disclaimer' | 'guidelines' | null
  >(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sync master checkmark when all 4 individual forms are checked
  const allIndividualFormsChecked =
    acceptedForms.terms &&
    acceptedForms.privacy &&
    acceptedForms.disclaimer &&
    acceptedForms.guidelines;

  const canContinue = masterAgreed || allIndividualFormsChecked;
  const acceptedCount = Object.values(acceptedForms).filter(Boolean).length;

  // Toggle all forms at once
  const handleToggleAllForms = (checked: boolean) => {
    setAcceptedForms({
      terms: checked,
      privacy: checked,
      disclaimer: checked,
      guidelines: checked,
    });
    setMasterAgreed(checked);
  };

  const handleModalAccept = (docId: 'terms' | 'privacy' | 'disclaimer' | 'guidelines') => {
    const updated = { ...acceptedForms, [docId]: true };
    setAcceptedForms(updated);
    if (updated.terms && updated.privacy && updated.disclaimer && updated.guidelines) {
      setMasterAgreed(true);
    }
  };

  const handleContinue = () => {
    if (!canContinue) return;
    onConsentAgreed(
      {
        terms: true,
        privacy: true,
        disclaimer: true,
        guidelines: true,
        declaration: true,
      },
      masterAgreed ? 'master_declaration' : 'all_forms_accepted'
    );
  };

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
              Before you sign in, please accept these simple community safety forms. They keep pet
              parents, helpers, and sighting reporters on the same page.
            </p>
          </div>

          {/* Legal Agreement Forms Section */}
          <div className="legal-forms-group-section">
            <div className="forms-section-header">
              <div className="forms-section-title-wrap">
                <h2 className="forms-section-title">Review the 4 forms</h2>
                <span className="forms-section-desc">
                  Tap a card to read it. You can also accept everything together below.
                </span>
              </div>

              <button
                type="button"
                id="toggle-all-forms-btn"
                className="btn btn-ghost btn-sm select-all-forms-btn"
                onClick={() => handleToggleAllForms(!allIndividualFormsChecked)}
              >
                {allIndividualFormsChecked ? 'Clear All' : `Accept All 4 (${acceptedCount}/4)`}
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
          <div className="consent-form-signature-box">
            <label className={`master-signature-label ${canContinue ? 'is-checked' : ''}`}>
              <input
                type="checkbox"
                id="consent-acknowledgment-checkbox"
                checked={canContinue}
                onChange={(e) => handleToggleAllForms(e.target.checked)}
                className="master-signature-checkbox"
              />
              <span className="master-signature-custom" aria-hidden="true"></span>
              <span className="master-signature-text">
                <strong>
                  I agree to the Terms, Privacy Policy, Dog Safety Disclaimer, and Community
                  Guidelines for using FindLostPuppy safely and responsibly.
                </strong>
              </span>
            </label>

            {/* Action Footer */}
            <div className="consent-form-action-row">
              <button
                type="button"
                id="agree-continue-button"
                className={`btn btn-lg btn-block btn-agree-continue ${canContinue ? 'enabled' : 'disabled'}`}
                disabled={!canContinue}
                onClick={handleContinue}
                aria-disabled={!canContinue}
              >
                {canContinue ? (
                  <>
                    <span>Accept All 4 Forms & Continue</span>
                    <ArrowRight size={18} />
                  </>
                ) : (
                  <>
                    <span>Accept all 4 forms to continue</span>
                  </>
                )}
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
