import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
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

  const handleIndividualFormToggle = (docId: 'terms' | 'privacy' | 'disclaimer' | 'guidelines') => {
    const nextVal = !acceptedForms[docId];
    const updated = { ...acceptedForms, [docId]: nextVal };
    setAcceptedForms(updated);

    if (updated.terms && updated.privacy && updated.disclaimer && updated.guidelines) {
      setMasterAgreed(true);
    } else {
      setMasterAgreed(false);
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
              <span>OFFICIAL COMMUNITY SAFETY & LEGAL AGREEMENT</span>
            </div>
            <h1 id="consent-form-title" className="consent-form-title">
              Before You Continue
            </h1>
            <p className="consent-form-subtitle">
              Find Lost Puppy is a community-powered missing pet bulletin. Please read our safety
              declaration below and accept the required legal forms to continue to sign in.
            </p>
          </div>

          {/* Key Safety Declaration Box */}
          <div className="declaration-summary-box">
            <div className="declaration-summary-header">
              <ShieldAlert className="text-terracotta" size={20} />
              <h3>Essential Safety Declarations & Zero-Liability Notice</h3>
            </div>

            <div className="declaration-points-list">
              <div className="declaration-point-item">
                <span className="point-badge">1</span>
                <div>
                  <strong>Passive Digital Bulletin Board Only:</strong> Find Lost Puppy strictly provides a digital bulletin board for community pet photos and sightings. We do not operate a search, rescue, catching, sheltering, transport, or veterinary service.
                </div>
              </div>

              <div className="declaration-point-item">
                <span className="point-badge">2</span>
                <div>
                  <strong>Absolute Non-Responsibility:</strong> Neither the app developers, platform operators, nor any guest sighting reporters or finders assume any responsibility, duty of care, or liability for any dog, person, location, injury, meeting, or outcome.
                </div>
              </div>

              <div className="declaration-point-item">
                <span className="point-badge">3</span>
                <div>
                  <strong>All Dog Problems Disclaimed:</strong> Unfamiliar lost dogs may bite, attack, carry rabies/diseases, cause traffic accidents, or inflict injury. The platform and guest reporters bear zero liability for dog bites, attacks, illness, injury, death, or third-party custody disputes.
                </div>
              </div>

              <div className="declaration-point-item">
                <span className="point-badge">4</span>
                <div>
                  <strong>Approximate Locations & Personal Duty:</strong> Locations shown are community approximations and may change. Always verify information independently and meet in safe, public places when verifying pet ownership.
                </div>
              </div>
            </div>
          </div>

          {/* Legal Agreement Forms Section */}
          <div className="legal-forms-group-section">
            <div className="forms-section-header">
              <div className="forms-section-title-wrap">
                <h2 className="forms-section-title">Official Legal Agreement Forms</h2>
                <span className="forms-section-desc">
                  Click any form to read its full terms and sign it, or accept all forms below:
                </span>
              </div>

              <button
                type="button"
                id="toggle-all-forms-btn"
                className="btn btn-ghost btn-sm select-all-forms-btn"
                onClick={() => handleToggleAllForms(!allIndividualFormsChecked)}
              >
                {allIndividualFormsChecked ? 'Clear All Forms' : '✓ Check All 4 Forms'}
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
                    Digital bulletin board rules, non-commercial service terms, and dispute policies.
                  </p>
                </div>
              </div>

              <div className="form-row-right" onClick={(e) => e.stopPropagation()}>
                <label className="form-row-checkbox-label" title="Accept Terms & Conditions">
                  <input
                    type="checkbox"
                    id="checkbox-terms-form"
                    checked={acceptedForms.terms}
                    onChange={() => handleIndividualFormToggle('terms')}
                    className="form-row-checkbox-input"
                  />
                  <span className="form-row-checkbox-custom"></span>
                  <span className="form-row-status-text">
                    {acceptedForms.terms ? 'Consented' : 'Accept'}
                  </span>
                </label>
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
                    Complete data inventory, zero password tracking, safe contact sharing, and deletion.
                  </p>
                </div>
              </div>

              <div className="form-row-right" onClick={(e) => e.stopPropagation()}>
                <label className="form-row-checkbox-label" title="Accept Privacy Policy">
                  <input
                    type="checkbox"
                    id="checkbox-privacy-form"
                    checked={acceptedForms.privacy}
                    onChange={() => handleIndividualFormToggle('privacy')}
                    className="form-row-checkbox-input"
                  />
                  <span className="form-row-checkbox-custom"></span>
                  <span className="form-row-status-text">
                    {acceptedForms.privacy ? 'Consented' : 'Accept'}
                  </span>
                </label>
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
                    Dog bites, attacks, rabies, injury, traffic accidents, and developer/guest non-responsibility.
                  </p>
                </div>
              </div>

              <div className="form-row-right" onClick={(e) => e.stopPropagation()}>
                <label className="form-row-checkbox-label" title="Accept Platform Disclaimer">
                  <input
                    type="checkbox"
                    id="checkbox-disclaimer-form"
                    checked={acceptedForms.disclaimer}
                    onChange={() => handleIndividualFormToggle('disclaimer')}
                    className="form-row-checkbox-input"
                  />
                  <span className="form-row-checkbox-custom"></span>
                  <span className="form-row-status-text">
                    {acceptedForms.disclaimer ? 'Consented' : 'Accept'}
                  </span>
                </label>
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
                    Rules against scams, harassment, false ownership claims, extortion, and fake sightings.
                  </p>
                </div>
              </div>

              <div className="form-row-right" onClick={(e) => e.stopPropagation()}>
                <label className="form-row-checkbox-label" title="Accept User Guidelines">
                  <input
                    type="checkbox"
                    id="checkbox-guidelines-form"
                    checked={acceptedForms.guidelines}
                    onChange={() => handleIndividualFormToggle('guidelines')}
                    className="form-row-checkbox-input"
                  />
                  <span className="form-row-checkbox-custom"></span>
                  <span className="form-row-status-text">
                    {acceptedForms.guidelines ? 'Consented' : 'Accept'}
                  </span>
                </label>
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
                  I have read, understood and agree to all declarations and legal forms above,
                  including the Terms & Conditions, Privacy Policy, Dog Safety & Zero-Liability
                  Disclaimer, and Community Guidelines. I understand that neither app developers,
                  platform operators, nor guest users are responsible or liable for anything regarding
                  any dog, location, listing, meeting, injury, or outcome, and that I am solely
                  responsible for my own actions and interactions.
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
                    <span>Agree & Continue to Sign In</span>
                    <ArrowRight size={18} />
                  </>
                ) : (
                  <>
                    <span>Please Check Agreement Box to Continue</span>
                  </>
                )}
              </button>
              <div className="consent-storage-note">
                <CheckCircle2 size={15} className="text-forest" />
                <span>
                  All forms and versioned consents (v1.0) are recorded in device storage upon clicking continue.
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
