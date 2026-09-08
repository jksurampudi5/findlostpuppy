import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, AlertCircle, BookOpen, CheckCircle, Lock } from 'lucide-react';
import {
  TERMS_AND_CONDITIONS,
  PRIVACY_POLICY,
  DISCLAIMER,
  USER_GUIDELINES,
  type LegalDocument,
} from '../data/legal/legalContent';

interface LegalModalProps {
  documentId: 'terms' | 'privacy' | 'disclaimer' | 'guidelines' | null;
  onClose: () => void;
  isAccepted?: boolean;
  onAccept?: (docId: 'terms' | 'privacy' | 'disclaimer' | 'guidelines') => void;
  readOnly?: boolean;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  documentId,
  onClose,
  isAccepted = false,
  onAccept,
  readOnly = false,
}) => {
  const [localChecked, setLocalChecked] = useState(isAccepted);

  useEffect(() => {
    setLocalChecked(isAccepted);
  }, [isAccepted, documentId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!documentId) return null;

  let doc: LegalDocument = TERMS_AND_CONDITIONS;
  let IconComponent = FileText;
  let formTypeLabel = 'Terms & Conditions Agreement Form';

  if (documentId === 'privacy') {
    doc = PRIVACY_POLICY;
    IconComponent = ShieldCheck;
    formTypeLabel = 'Privacy & Data Protection Form';
  } else if (documentId === 'disclaimer') {
    doc = DISCLAIMER;
    IconComponent = AlertCircle;
    formTypeLabel = 'Platform Disclaimer & Dog Safety Release Form';
  } else if (documentId === 'guidelines') {
    doc = USER_GUIDELINES;
    IconComponent = BookOpen;
    formTypeLabel = 'Community Standards & User Guidelines Form';
  }

  const handleConfirmAccept = () => {
    if (onAccept) {
      onAccept(documentId);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop legal-form-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card legal-form-modal-card card" onClick={(e) => e.stopPropagation()}>
        {/* Header with Official Form Seal */}
        <div className="legal-modal-header">
          <div className="legal-modal-title-wrap">
            <div className="legal-icon-wrap">
              <IconComponent size={24} className="text-terracotta" />
            </div>
            <div className="legal-modal-title-texts">
              <div className="legal-form-badge-row">
                <span className="badge-form-official">OFFICIAL LEGAL FORM</span>
                {isAccepted ? (
                  <span className="badge-consented-pill">
                    <CheckCircle size={12} /> Consented
                  </span>
                ) : (
                  <span className="badge-review-pill">
                    <Lock size={12} /> Signature Required
                  </span>
                )}
              </div>
              <h2 className="legal-modal-title">{formTypeLabel}</h2>
              <span className="legal-modal-version">
                {doc.title} • Version {doc.version} • Effective {doc.lastUpdated}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm close-modal-btn"
            onClick={onClose}
            aria-label="Close legal document form"
          >
            <X size={20} />
          </button>
        </div>

        {/* Instructions banner */}
        <div className="legal-modal-notice-banner">
          <p>
            Please scroll down to review the entire document. You can check the consent box at the bottom to sign and accept this form.
          </p>
        </div>

        {/* Scrollable Document Body */}
        <div className="legal-modal-body" tabIndex={0} aria-label="Legal document content">
          {doc.sections.map((section, idx) => (
            <div key={idx} className="legal-doc-section">
              <h3 className="legal-section-heading">
                <span className="section-number-pill">{idx + 1}</span> {section.heading}
              </h3>
              {Array.isArray(section.content) ? (
                <ul className="legal-bullet-list">
                  {section.content.map((point, pIdx) => (
                    <li key={pIdx}>{point}</li>
                  ))}
                </ul>
              ) : (
                <p className="legal-paragraph">{section.content}</p>
              )}
            </div>
          ))}
        </div>

        {/* Interactive Form Consent Footer */}
        <div className="legal-modal-footer form-action-footer">
          {!readOnly ? (
            <div className="modal-consent-action-group">
              <label className={`modal-form-checkbox-label ${localChecked ? 'is-checked' : ''}`}>
                <input
                  type="checkbox"
                  id={`modal-agree-checkbox-${documentId}`}
                  checked={localChecked}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setLocalChecked(checked);
                    if (checked && onAccept) {
                      onAccept(documentId);
                    }
                  }}
                  className="modal-form-checkbox-input"
                />
                <span className="modal-form-checkbox-custom" aria-hidden="true"></span>
                <span className="modal-form-checkbox-text">
                  <strong>
                    I have read and explicitly agree to the {formTypeLabel}.
                  </strong>
                </span>
              </label>

              <div className="modal-footer-btns">
                <button
                  type="button"
                  className="btn btn-ghost btn-md"
                  onClick={onClose}
                >
                  Close
                </button>
                <button
                  type="button"
                  id={`confirm-accept-form-btn-${documentId}`}
                  className={`btn btn-md ${localChecked ? 'btn-primary' : 'btn-outline'}`}
                  onClick={handleConfirmAccept}
                >
                  {localChecked ? (
                    <>
                      <CheckCircle size={16} />
                      <span>Accept & Save Form</span>
                    </>
                  ) : (
                    <span>Accept Form</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="modal-readonly-footer">
              <span className="text-muted-sm">✓ Form verified on record</span>
              <button type="button" className="btn btn-primary btn-md" onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
