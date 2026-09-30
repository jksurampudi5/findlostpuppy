import React from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface PermissionRationaleModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  continueLabel?: string;
  cancelLabel?: string;
  onContinue: () => void;
  onCancel: () => void;
  alternativeLabel?: string;
  onAlternative?: () => void;
}

/** Explains camera or location access and offers consent, cancellation, or the supplied alternative action. */
export const PermissionRationaleModal: React.FC<PermissionRationaleModalProps> = ({
  isOpen,
  title,
  message,
  continueLabel = 'Continue',
  cancelLabel = 'Cancel',
  onContinue,
  onCancel,
  alternativeLabel,
  onAlternative,
}) => {
  if (!isOpen) return null;

  return (
    <div className="permission-rationale-backdrop" role="dialog" aria-modal="true" aria-labelledby="permission-rationale-title">
      <section className="permission-rationale-card">
        <button type="button" className="permission-rationale-close" onClick={onCancel} aria-label="Cancel permission request">
          <X size={18} />
        </button>
        <div className="permission-rationale-icon">
          <ShieldCheck size={30} />
        </div>
        <h2 id="permission-rationale-title">{title}</h2>
        <p>{message}</p>
        <div className="permission-rationale-actions">
          <button type="button" className="capture-rotate-button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="capture-main-button" onClick={onContinue}>
            {continueLabel}
          </button>
          {alternativeLabel && onAlternative && (
            <button type="button" className="capture-rotate-button" onClick={onAlternative}>
              {alternativeLabel}
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
