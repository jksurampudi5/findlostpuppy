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
  const [lastKnownLocation, setLastKnownLocation] = useState(
    initialData?.lastKnownLocation ||
      (ownerProfile?.approximateArea ? `Near ${ownerProfile.approximateArea}` : '')
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedSuccess, setDetectedSuccess] = useState(false);

  // Sync state whenever modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      const initialLoc =
        initialData?.lastKnownLocation ||
        (ownerProfile?.approximateArea ? `Near ${ownerProfile.approximateArea}` : '');
      setDateLost(initialData?.dateLost || today);
      setTimeLost(initialData?.timeLost || '06:00 PM');
      setLastKnownLocation(initialLoc);
      setDetectedSuccess(false);

      // If location is completely empty when opening, attempt automatic gentle detection
      if (!initialLoc) {
        autoDetectGPS(false);
      }
    }
  }, [isOpen, initialData, ownerProfile]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Automatic / 1-Click GPS Location Detection with Manual Inline Editing
  const autoDetectGPS = (notify = true) => {
    if (!('geolocation' in navigator)) {
      if (ownerProfile?.approximateArea) {
        setLastKnownLocation(`Near ${ownerProfile.approximateArea}`);
      }
      if (notify) showToast('GPS not supported on device. Please enter location manually.', 'info');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let detected = '';
        if (ownerProfile?.approximateArea) {
          detected = `Near ${ownerProfile.approximateArea} (GPS: ${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
        } else if (ownerProfile?.city) {
          detected = `Near ${ownerProfile.city} (GPS: ${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
        } else {
          detected = `Current GPS Coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        }

        setLastKnownLocation(detected);
        setIsDetectingLocation(false);
        setDetectedSuccess(true);
        if (notify) {
          showToast('📍 Location automatically detected! You can edit or refine it manually below.', 'success');
        }
      },
      (_error) => {
        setIsDetectingLocation(false);
        if (ownerProfile?.approximateArea) {
          setLastKnownLocation(`Near ${ownerProfile.approximateArea}`);
        }
        if (notify) {
          showToast('GPS permission unavailable. Please type your location manually.', 'info');
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastKnownLocation.trim()) {
      showToast('Please specify where your dog was last seen.', 'warning');
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
            {/* Pre-Populated Pet Badge */}
            <div className="prepopulated-info-card missing-modal-prep-card">
              <div className="prepopulated-badge">
                <Sparkles size={14} />
                <span>Active Pet Profile</span>
              </div>
              <div className="prepopulated-details-row">
                <span className="prep-item">
                  <strong>Reporting for:</strong> {dogName} ({dogBreed})
                </span>
                {ownerProfile?.approximateArea && (
                  <span className="prep-item">
                    <strong>Home Area:</strong> {ownerProfile.approximateArea}
                  </span>
                )}
              </div>
            </div>

            {/* Field 1: Date When Lost */}
            <div className="form-group">
              <label className="form-label cute-label" htmlFor="modal-date-lost">
                <span>1. Date When Lost</span>
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

            {/* Field 2: Approximate Time */}
            <div className="form-group">
              <label className="form-label cute-label" htmlFor="modal-time-lost">
                <span>2. Approximate Time</span>
                <span className="optional-tag">Optional</span>
              </label>
              <div className="input-with-icon">
                <Clock size={16} className="input-icon text-terracotta" />
                <input
                  id="modal-time-lost"
                  type="text"
                  className="form-input cute-input"
                  placeholder="e.g. 06:30 PM, Morning walk, Afternoon"
                  value={timeLost}
                  onChange={(e) => setTimeLost(e.target.value)}
                />
              </div>
            </div>

            {/* Field 3: Last Seen Location / Landmark (Auto-detected & Manually Editable) */}
            <div className="form-group">
              <div className="location-field-label-row">
                <label className="form-label cute-label" htmlFor="modal-last-location" style={{ marginBottom: 0 }}>
                  <span>3. Last Seen Location / Landmark</span>
                  <span className="required-star">*</span>
                </label>

                {/* Inline 1-Click Auto GPS Button */}
                <button
                  type="button"
                  onClick={() => autoDetectGPS(true)}
                  disabled={isDetectingLocation}
                  className="btn btn-ghost btn-sm auto-detect-loc-btn"
                  title="Detect current GPS location automatically"
                >
                  {isDetectingLocation ? (
                    <>
                      <Loader2 size={13} className="spin-animate" />
                      <span>Detecting GPS...</span>
                    </>
                  ) : (
                    <>
                      <Compass size={13} className="text-terracotta" />
                      <span>📍 Auto-Detect Location</span>
                    </>
                  )}
                </button>
              </div>

              <div className="input-with-icon" style={{ marginTop: '0.4rem' }}>
                <MapPin size={16} className="input-icon text-terracotta" />
                <input
                  id="modal-last-location"
                  type="text"
                  className="form-input cute-input"
                  placeholder="e.g. Near City Park Main Gate, Tanuku Road, Benz Circle"
                  value={lastKnownLocation}
                  onChange={(e) => {
                    setLastKnownLocation(e.target.value);
                    setDetectedSuccess(false);
                  }}
                  required
                />
              </div>

              <div className="location-hint-row">
                {detectedSuccess ? (
                  <span className="location-auto-success-tag">
                    <CheckCircle2 size={13} /> Location auto-detected. You can type or edit manually above!
                  </span>
                ) : (
                  <span className="input-hint">
                    Location is automatically suggested and can be freely updated or changed manually above.
                  </span>
                )}
              </div>
            </div>

            {/* Privacy Guarantee Banner */}
            <div className="privacy-guarantee-card modal-privacy-card">
              <div className="privacy-badge-icon">
                <Shield size={16} />
              </div>
              <div className="privacy-badge-content">
                <h4 className="privacy-title">Safe Community Broadcasting</h4>
                <p className="privacy-desc">
                  Your private home address is never published. Only approximate landmarks and authorized
                  contact channels will be displayed on the flyer.
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
