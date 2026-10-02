import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Megaphone,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Compass,
  CheckCircle2,
  Loader2,
  Home,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { detectResilientLocation } from '../utils/geolocationHelper';
import type { DogProfile, OwnerProfile } from '../types';
import { clearCrashSafeDraft, readCrashSafeDraft, useCrashSafeDraft } from '../hooks/useCrashSafeDraft';

interface MissingPetReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (reportData: {
    dateLost: string;
    timeLost: string;
    lastKnownLocation: string;
  }) => void;
  initialData?: {
    dateLost?: string;
    timeLost?: string;
    lastKnownLocation?: string;
  };
  dog: DogProfile | null;
  ownerProfile: OwnerProfile | null;
  isEditing?: boolean;
}

/** Collects a pet's last-seen time and area in a modal backed by a recoverable local draft. */
export const MissingPetReportModal: React.FC<MissingPetReportModalProps> = ({
  isOpen,
  onClose,
  onSubmitReport,
  initialData,
  dog,
  ownerProfile,
  isEditing = false,
}) => {
  const { showToast } = useToast();

  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const [dateLost, setDateLost] = useState(initialData?.dateLost || today);
  const [timeLost, setTimeLost] = useState(initialData?.timeLost || currentTime);
  // Initialize ONLY with existing report's location when editing; otherwise leave empty for the lost location
  const [lastKnownLocation, setLastKnownLocation] = useState(
    initialData?.lastKnownLocation || ''
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedSuccess, setDetectedSuccess] = useState(false);
  const draftKey = `findlostpuppy_draft_missing_report_${dog?.id || 'new'}`;

  useCrashSafeDraft(draftKey, { dateLost, timeLost, lastKnownLocation }, isOpen && !isEditing);

  // Sync state whenever modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const draft = !initialData && !isEditing
        ? readCrashSafeDraft<{ dateLost: string; timeLost: string; lastKnownLocation: string }>(draftKey)
        : null;
      setDateLost(initialData?.dateLost || draft?.dateLost || now.toISOString().split('T')[0]);
      setTimeLost(initialData?.timeLost || draft?.timeLost || now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
      setLastKnownLocation(initialData?.lastKnownLocation || draft?.lastKnownLocation || '');
      setDetectedSuccess(false);
    }
  }, [isOpen, initialData, isEditing, draftKey]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 1-Click Resilient Location Detection from the Place Where Pet is Lost
  /** Fills the last-known location with a detected area name and reports detection or permission failures. */
  const autoDetectGPS = async () => {
    setIsDetectingLocation(true);
    try {
      const geo = await detectResilientLocation();
      const area = (geo as any).village || geo.city || geo.mandal || geo.district || geo.state || '';
      if (!area) {
        showToast('Location was detected, but no safe public area name was available. Please enter a nearby landmark.', 'warning');
        return;
      }

      // Exact coordinates must never be copied into the public report text.
      setLastKnownLocation(area);
      setDetectedSuccess(true);
      showToast('📍 Approximate lost area detected. You can add a nearby public landmark.', 'success');
    } catch (err: any) {
      if (err?.code === 'PERMISSION_DENIED' || err?.name === 'NotAllowedError' || /denied/i.test(err?.message || '')) {
        alert('Location access is denied. Please enable location permissions in your browser settings (usually the lock icon in the address bar) to allow auto-detection.');
      } else {
        showToast('Could not access location. Please type the lost landmark or area manually.', 'warning');
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const homeAreaLabel =
    (ownerProfile as any)?.approximateArea ||
    ownerProfile?.city ||
    ownerProfile?.streetOrLocality ||
    ownerProfile?.mandalOrMunicipality ||
    ownerProfile?.district ||
    '';
  const homeAreaDisplay = homeAreaLabel.split(',')[0].trim();

  // Optional 1-Click Shortcut: Use Saved Home Location
  const handleUseHomeArea = () => {
    if (homeAreaDisplay) {
      setLastKnownLocation(`Near Home (${homeAreaDisplay})`);
      setDetectedSuccess(true);
      showToast('🏠 Filled with your home area. You can edit or modify it below.', 'info');
    }
  };

  if (!isOpen) return null;

  /** Validates the last-known location, clears the draft, and passes report details to the submission callback. */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastKnownLocation.trim()) {
      showToast('Please specify the location or landmark where your dog was lost.', 'warning');
      return;
    }

    clearCrashSafeDraft(draftKey);
    onSubmitReport({
      dateLost,
      timeLost,
      lastKnownLocation: lastKnownLocation.trim(),
    });
  };

  const dogName = dog?.name || 'Your Dog';
  const dogBreed = dog?.breed || 'Companion Pet';

  const modalContent = (
    <div
      className="modal-backdrop missing-report-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="missing-modal-title"
    >
      <div
        className="modal-card missing-report-modal-card card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="missing-modal-header">
          <div className="missing-modal-title-wrap">
            <div className="missing-icon-wrap">
              <span className="missing-beacon-emoji">🚨</span>
            </div>
            <div className="missing-modal-title-texts">
              <span className="missing-modal-badge">URGENT SEARCH BROADCAST</span>
              <h2 id="missing-modal-title" className="missing-modal-title">
                {isEditing ? 'Update Lost Dog Alert' : 'Report Missing Pet Alert'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm close-modal-btn"
            onClick={onClose}
            aria-label="Close missing pet report dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="missing-modal-form">
          <div className="missing-modal-body">
            {/* Ultra-Slim Pet Profile Strip */}
            <div className="missing-modal-pet-strip">
              <div className="pet-strip-left">
                <Sparkles size={14} className="text-terracotta" />
                <span className="pet-strip-label">
                  <strong>Reporting For:</strong> {dogName} ({dogBreed})
                </span>
              </div>
              {homeAreaDisplay && (
                <span className="pet-strip-home-tag">
                  Home: {homeAreaDisplay}
                </span>
              )}
            </div>

            {/* Field 1: Date When Lost (Auto-filled with today's date) */}
            <div className="form-group missing-form-group">
              <label className="form-label cute-label" htmlFor="modal-date-lost">
                <span>Date When Lost</span>
                <span className="required-star">*</span>
              </label>
              <div className="input-with-icon">
                <Calendar size={16} className="input-icon text-terracotta" />
                <input
                  id="modal-date-lost"
                  type="date"
                  className="form-input cute-input"
                  value={dateLost}
                  max={today}
                  onChange={(e) => setDateLost(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Field 2: Approximate Time (Stacked below Date) */}
            <div className="form-group missing-form-group">
              <label className="form-label cute-label" htmlFor="modal-time-lost">
                <span>Approximate Time</span>
                <span className="optional-tag">Optional</span>
              </label>
              <div className="input-with-icon">
                <Clock size={16} className="input-icon text-terracotta" />
                <input
                  id="modal-time-lost"
                  type="time"
                  className="form-input cute-input"
                  placeholder="e.g. 18:00"
                  value={timeLost}
                  onChange={(e) => setTimeLost(e.target.value)}
                />
              </div>
            </div>

            {/* Field 3: Location Where Pet Was Lost (With 1-Click Auto-Detect Button) */}
            <div className="form-group missing-form-group missing-location-group">
              <div className="location-field-label-row">
                <label className="form-label cute-label" htmlFor="modal-last-location" style={{ marginBottom: 0 }}>
                  <span>Location Where Pet Was Lost</span>
                  <span className="required-star">*</span>
                </label>

                {/* Location Action Buttons */}
                <div className="location-action-btns-wrap">
                  <button
                    type="button"
                    onClick={autoDetectGPS}
                    disabled={isDetectingLocation}
                    className="btn btn-sm auto-detect-loc-btn"
                    title="Detect GPS coordinates of the place where pet was lost"
                  >
                    {isDetectingLocation ? (
                      <>
                        <Loader2 size={13} className="spin-animate" />
                        <span>Detecting Lost GPS...</span>
                      </>
                    ) : (
                      <>
                        <Compass size={13} className="text-terracotta" />
                        <span>📍 Auto-Detect Lost GPS</span>
                      </>
                    )}
                  </button>

                  {homeAreaDisplay && (
                    <button
                      type="button"
                      onClick={handleUseHomeArea}
                      className="btn btn-ghost btn-sm use-home-loc-btn"
                      title="Use registered home area if pet was lost near home"
                    >
                      <Home size={12} />
                      <span>Lost Near Home</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="input-with-icon location-main-input-wrap">
                <MapPin size={16} className="input-icon text-terracotta" />
                <input
                  id="modal-last-location"
                  type="text"
                  className="form-input cute-input location-text-input"
                  placeholder="Type landmark or area where pet was lost (e.g. Near City Park Gate, Benz Circle, Highway 16)"
                  value={lastKnownLocation}
                  onChange={(e) => {
                    setLastKnownLocation(e.target.value);
                    setDetectedSuccess(false);
                  }}
                  autoFocus
                  required
                />
              </div>

              <div className="location-hint-row">
                {detectedSuccess ? (
                  <span className="location-auto-success-tag">
                    <CheckCircle2 size={13} /> Location captured. You can freely edit or type additional landmark details above!
                  </span>
                ) : (
                  <span className="input-hint">
                    Click <strong>Auto-Detect Lost GPS</strong> if you are at the lost location, or type the landmark manually above.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="missing-modal-footer">
            <button
              type="button"
              className="btn btn-ghost btn-md"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-lg missing-modal-submit-btn"
            >
              <Megaphone size={18} />
              <span>{isEditing ? '✓ Update Lost Dog Alert' : '📢 Broadcast Missing Alert'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
