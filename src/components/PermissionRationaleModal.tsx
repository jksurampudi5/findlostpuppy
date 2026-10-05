import React from 'react';
import { MapPin, Navigation, ShieldCheck, ToggleRight, X } from 'lucide-react';

export type PermissionStateLabel = 'allowed' | 'not-allowed' | 'ask' | 'unknown';

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
  variant?: 'default' | 'location';
  permissionState?: PermissionStateLabel;
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
  variant = 'default',
  permissionState = 'unknown',
}) => {
  if (!isOpen) return null;

  const isLocationVariant = variant === 'location';
  const locationAllowed = permissionState === 'allowed';
  const permissionText =
    permissionState === 'allowed'
      ? 'Allowed'
      : permissionState === 'not-allowed'
        ? 'Not allowed'
        : permissionState === 'ask'
          ? 'Ready to ask'
          : 'Checking permission...';
  const locationFeatureText =
    permissionState === 'allowed'
      ? 'Location access is already allowed. Tap Use Current Location to detect and fill your location squares automatically.'
      : permissionState === 'not-allowed'
        ? 'Location is blocked right now. Tap Allow Location to ask again; if the browser blocks it, use the Location control in the address bar.'
        : 'After you consent, Android or the browser will show the Location permission prompt. Choose precise location when available.';

  return (
    <div className="permission-rationale-backdrop" role="dialog" aria-modal="true" aria-labelledby="permission-rationale-title">
      <section className={`permission-rationale-card ${isLocationVariant ? 'permission-location-card' : ''}`.trim()}>
        <button type="button" className="permission-rationale-close" onClick={onCancel} aria-label="Cancel permission request">
          <X size={18} />
        </button>
        <div className="permission-rationale-icon">
          {isLocationVariant ? <MapPin size={30} /> : <ShieldCheck size={30} />}
        </div>
        <h2 id="permission-rationale-title">{title}</h2>
        {isLocationVariant ? (
          <div className="permission-location-body">
            <div className={`permission-location-switch-row ${locationAllowed ? 'is-allowed' : 'is-blocked'}`} aria-hidden="true">
              <div>
                <strong>Location</strong>
                <span>{permissionText}</span>
              </div>
              <ToggleRight size={42} />
            </div>
            <div className="permission-location-feature-row">
              <Navigation size={18} />
              <span>{locationFeatureText}</span>
            </div>
            <p>{message}</p>
          </div>
        ) : (
          <p>{message}</p>
        )}
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
