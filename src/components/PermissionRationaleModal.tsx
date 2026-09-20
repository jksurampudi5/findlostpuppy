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
}

export const PermissionRationaleModal: React.FC<PermissionRationaleModalProps> = ({
  isOpen,
  title,
  message,
  continueLabel = 'Continue',
  cancelLabel = 'Cancel',
  onContinue,
  onCancel,
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
        </div>
      </section>
    </div>
  );
};
