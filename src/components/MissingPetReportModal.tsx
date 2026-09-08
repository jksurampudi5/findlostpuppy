import React, { useState, useEffect } from 'react';
import {
  X,
  Megaphone,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Shield,
  Compass,
  CheckCircle2,
  Loader2,
  Home,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import type { DogProfile, OwnerProfile } from '../types';

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
  const [dateLost, setDateLost] = useState(initialData?.dateLost || today);
  const [timeLost, setTimeLost] = useState(initialData?.timeLost || '06:00 PM');
  // Initialize ONLY with existing report's location when editing; otherwise leave empty for the lost location
  const [lastKnownLocation, setLastKnownLocation] = useState(
    initialData?.lastKnownLocation || ''
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedSuccess, setDetectedSuccess] = useState(false);

  // Sync state whenever modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setDateLost(initialData?.dateLost || today);
      setTimeLost(initialData?.timeLost || '06:00 PM');
      setLastKnownLocation(initialData?.lastKnownLocation || '');
      setDetectedSuccess(false);
    }
  }, [isOpen, initialData]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 1-Click GPS Location Detection from the Place Where Pet is Lost
  const autoDetectGPS = () => {
    if (!('geolocation' in navigator)) {
      showToast('GPS is not supported on this browser. Please type the lost landmark manually.', 'info');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const detected = `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

        setLastKnownLocation(detected);
        setIsDetectingLocation(false);
        setDetectedSuccess(true);
        showToast('📍 Current lost GPS location detected! You can edit or add landmark details in the box below.', 'success');
      },
      (_error) => {
        setIsDetectingLocation(false);
        showToast('Could not access GPS. Please type the lost landmark or area manually.', 'warning');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Optional 1-Click Shortcut: Use Saved Home Location
  const handleUseHomeArea = () => {
    if (ownerProfile?.approximateArea) {
      setLastKnownLocation(`Near Home (${ownerProfile.approximateArea})`);
      setDetectedSuccess(true);
      showToast('🏠 Filled with your home area. You can edit or modify it below.', 'info');
    } else if (ownerProfile?.city) {
      setLastKnownLocation(`Near ${ownerProfile.city}`);
      setDetectedSuccess(true);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastKnownLocation.trim()) {
      showToast('Please specify the location or landmark where your dog was lost.', 'warning');
      return;
    }

    onSubmitReport({
      dateLost,
      timeLost,
      lastKnownLocation: lastKnownLocation.trim(),
    });
  };

  const dogName = dog?.name || 'Your Dog';
  const dogBreed = dog?.breed || 'Companion Pet';

  return (
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
              {ownerProfile?.approximateArea && (
                <span className="pet-strip-home-tag">
                  Home: {ownerProfile.approximateArea.split(',')[0]}
                </span>
              )}
            </div>

            {/* Fields 1 & 2: Date and Time (Compact 2-Column Grid) */}
            <div className="missing-datetime-row">
              <div className="form-group datetime-field">
                <label className="form-label cute-label" htmlFor="modal-date-lost">
                  <span>1. Date When Lost</span>
                  <span className="required-star">*</span>
                </label>
                <div className="input-with-icon">
                  <Calendar size={15} className="input-icon text-terracotta" />
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

              <div className="form-group datetime-field">
                <label className="form-label cute-label" htmlFor="modal-time-lost">
                  <span>2. Approximate Time</span>
                  <span className="optional-tag">Optional</span>
                </label>
                <div className="input-with-icon">
                  <Clock size={15} className="input-icon text-terracotta" />
                  <input
                    id="modal-time-lost"
                    type="text"
                    className="form-input cute-input"
                    placeholder="e.g. 06:30 PM"
                    value={timeLost}
                    onChange={(e) => setTimeLost(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Field 3: Last Seen Location / Landmark (Place Where Pet Was Lost) */}
            <div className="form-group missing-location-group">
              <div className="location-field-label-row">
                <label className="form-label cute-label" htmlFor="modal-last-location" style={{ marginBottom: 0 }}>
                  <span>3. Location Where Pet Was Lost</span>
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

                  {ownerProfile?.approximateArea && (
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

            {/* Privacy Guarantee Banner */}
            <div className="privacy-guarantee-card modal-privacy-card">
              <div className="privacy-badge-icon">
                <Shield size={15} />
              </div>
              <div className="privacy-badge-content">
                <h4 className="privacy-title">Safe Community Broadcasting</h4>
                <p className="privacy-desc">
                  Only the approximate lost landmark and authorized contact channels are displayed on the community search flyer.
                </p>
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
};
