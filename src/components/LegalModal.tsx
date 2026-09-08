import React, { useEffect } from 'react';
import { X, ShieldCheck, FileText, AlertCircle, BookOpen } from 'lucide-react';
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
}

export const LegalModal: React.FC<LegalModalProps> = ({ documentId, onClose }) => {
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

  if (documentId === 'privacy') {
    doc = PRIVACY_POLICY;
    IconComponent = ShieldCheck;
  } else if (documentId === 'disclaimer') {
    doc = DISCLAIMER;
    IconComponent = AlertCircle;
  } else if (documentId === 'guidelines') {
    doc = USER_GUIDELINES;
    IconComponent = BookOpen;
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="legal-modal-card card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="legal-modal-header">
          <div className="legal-modal-title-wrap">
            <div className="legal-icon-wrap">
              <IconComponent size={22} className="text-terracotta" />
            </div>
            <div>
              <h2 className="legal-modal-title">{doc.title}</h2>
              <span className="legal-modal-version">
                Version {doc.version} • Last Updated: {doc.lastUpdated}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm close-modal-btn"
            onClick={onClose}
            aria-label="Close legal document"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="legal-modal-body">
          {doc.sections.map((section, idx) => (
            <div key={idx} className="legal-doc-section">
              <h3 className="legal-section-heading">{section.heading}</h3>
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

        {/* Footer */}
        <div className="legal-modal-footer">
          <button type="button" className="btn btn-primary btn-md" onClick={onClose}>
            <span>I Understand</span>
          </button>
        </div>
      </div>
    </div>
  );
};
