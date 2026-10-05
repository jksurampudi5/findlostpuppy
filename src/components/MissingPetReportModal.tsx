import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Megaphone,
  Clock,
  MapPin,
  Sparkles,
  Compass,
  CheckCircle2,
  Loader2,
  Home,
  ChevronDown,
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
  const todayDate = new Date();
  const currentYear = todayDate.getFullYear();
  const buildDateString = (year: string, month: string, day: string) => {
    if (!year || !month || !day) return '';
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };
  const splitDateString = (value?: string) => {
    const [year, month, day] = (value || today).split('-');
    return {
      year: year || String(currentYear),
      month: month || String(todayDate.getMonth() + 1).padStart(2, '0'),
      day: day || String(todayDate.getDate()).padStart(2, '0'),
    };
  };
  const initialDateParts = splitDateString(initialData?.dateLost || today);
  const [dateLost, setDateLost] = useState(initialData?.dateLost || today);
  const [lostYear, setLostYear] = useState(initialDateParts.year);
  const [lostMonth, setLostMonth] = useState(initialDateParts.month);
  const [lostDay, setLostDay] = useState(initialDateParts.day);
  const [timeLost, setTimeLost] = useState(initialData?.timeLost || currentTime);
  // Initialize ONLY with existing report's location when editing; otherwise leave empty for the lost location
  const [lastKnownLocation, setLastKnownLocation] = useState(
    initialData?.lastKnownLocation || ''
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedSuccess, setDetectedSuccess] = useState(false);
  const autoDetectAttemptedRef = useRef(false);
  const draftKey = `findlostpuppy_draft_missing_report_${dog?.id || 'new'}`;
  const yearOptions = Array.from({ length: 6 }, (_, index) => String(currentYear - index));
  const maxMonthForSelectedYear = Number(lostYear) === currentYear ? todayDate.getMonth() + 1 : 12;
  const monthOptions = Array.from({ length: maxMonthForSelectedYear }, (_, index) => String(index + 1).padStart(2, '0'));
  const daysInSelectedMonth = new Date(Number(lostYear), Number(lostMonth), 0).getDate();
  const maxDayForSelectedMonth = Number(lostYear) === currentYear && Number(lostMonth) === todayDate.getMonth() + 1
    ? todayDate.getDate()
    : daysInSelectedMonth;
  const dayOptions = Array.from({ length: maxDayForSelectedMonth }, (_, index) => String(index + 1).padStart(2, '0'));
  const isSelectedDateToday = buildDateString(lostYear, lostMonth, lostDay) === today;
  const isSelectedDateFuture = buildDateString(lostYear, lostMonth, lostDay) > today;

  useCrashSafeDraft(draftKey, { dateLost, timeLost, lastKnownLocation }, isOpen && !isEditing);

  // Sync state whenever modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const draft = !initialData && !isEditing
        ? readCrashSafeDraft<{ dateLost: string; timeLost: string; lastKnownLocation: string }>(draftKey)
        : null;
      const nextDateLost = initialData?.dateLost || draft?.dateLost || now.toISOString().split('T')[0];
      const nextDateParts = splitDateString(nextDateLost);
      setDateLost(nextDateLost);
      setLostYear(nextDateParts.year);
      setLostMonth(nextDateParts.month);
      setLostDay(nextDateParts.day);
      setTimeLost(initialData?.timeLost || draft?.timeLost || now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
      setLastKnownLocation(initialData?.lastKnownLocation || draft?.lastKnownLocation || '');
      setDetectedSuccess(false);
      autoDetectAttemptedRef.current = false;
    }
  }, [isOpen, initialData, isEditing, draftKey]);


  useEffect(() => {
    const maxMonth = Number(lostYear) === currentYear ? todayDate.getMonth() + 1 : 12;
    if (Number(lostMonth) > maxMonth) {
      setLostMonth(String(maxMonth).padStart(2, '0'));
      return;
    }

    const maxDay = Number(lostYear) === currentYear && Number(lostMonth) === todayDate.getMonth() + 1
      ? todayDate.getDate()
      : new Date(Number(lostYear), Number(lostMonth), 0).getDate();
    if (Number(lostDay) > maxDay) {
      setLostDay(String(maxDay).padStart(2, '0'));
      return;
    }

    const nextDateLost = buildDateString(lostYear, lostMonth, lostDay);
    if (nextDateLost) setDateLost(nextDateLost);
  }, [lostYear, lostMonth, lostDay, currentYear, today]);

  useEffect(() => {
    if (isSelectedDateToday && timeLost && timeLost > currentTime) {
      setTimeLost(currentTime);
    }
  }, [isSelectedDateToday, timeLost, currentTime]);

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
  const autoDetectGPS = async (options?: { silent?: boolean }) => {
    setIsDetectingLocation(true);
    try {
      const geo = await detectResilientLocation();
      const detectedParts = [
        (geo as any).village,
        geo.city,
        geo.mandal,
        geo.district,
        geo.state,
      ]
        .filter(Boolean)
        .map((part) => String(part).trim())
        .filter((part, index, arr) => part && arr.findIndex((item) => item.toLowerCase() === part.toLowerCase()) === index);
      const area = detectedParts.join(', ');
      if (!area) {
        if (!options?.silent) showToast('Location was detected, but no safe public area name was available. Please enter a nearby landmark.', 'warning');
        return;
      }

      // Exact coordinates must never be copied into the public report text.
      setLastKnownLocation(area);
      setDetectedSuccess(true);
      if (!options?.silent) showToast('📍 Approximate lost area detected. You can edit it before broadcasting.', 'success');
    } catch (err: any) {
      if (!options?.silent) {
        const denied = err?.code === 'PERMISSION_DENIED' || err?.name === 'NotAllowedError' || /denied/i.test(err?.message || '');
        showToast(
          denied
            ? 'Location permission was not granted. Please allow location for FindLostPuppy or type the lost area manually.'
            : 'Could not access location. Please type the lost landmark or area manually.',
          'warning'
        );
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };


  // Auto-fill the missing-alert form when opened: current date/time are set above,
  // and GPS tries to fill a safe public lost area. The user can edit before broadcast.
  useEffect(() => {
    if (!isOpen || isEditing || autoDetectAttemptedRef.current) return;
    if (initialData?.lastKnownLocation) return;
    autoDetectAttemptedRef.current = true;
    autoDetectGPS({ silent: true });
  }, [isOpen, isEditing, initialData?.lastKnownLocation]);

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
    if (isSelectedDateFuture || dateLost > today) {
      showToast('Lost date cannot be in the future. Please choose today or an earlier date.', 'warning');
      return;
    }

    if (dateLost === today && timeLost && timeLost > currentTime) {
      showToast('Lost time cannot be later than the current time.', 'warning');
      setTimeLost(currentTime);
      return;
    }

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
              <div className="missing-date-container-grid" id="modal-date-lost">
                <label className="missing-date-select-wrap">
                  <span>Year</span>
                  <select value={lostYear} onChange={(e) => setLostYear(e.target.value)} required>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} aria-hidden="true" />
                </label>
                <label className="missing-date-select-wrap">
                  <span>Month</span>
                  <select value={lostMonth} onChange={(e) => setLostMonth(e.target.value)} required>
                    {monthOptions.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} aria-hidden="true" />
                </label>
                <label className="missing-date-select-wrap">
                  <span>Date</span>
                  <select value={lostDay} onChange={(e) => setLostDay(e.target.value)} required>
                    {dayOptions.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} aria-hidden="true" />
                </label>
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
                  max={isSelectedDateToday ? currentTime : undefined}
                  onChange={(e) => {
                    const nextTime = e.target.value;
                    if (isSelectedDateToday && nextTime > currentTime) {
                      setTimeLost(currentTime);
                      showToast('Lost time cannot be later than the current time.', 'warning');
                      return;
                    }
                    setTimeLost(nextTime);
                  }}
                />
              </div>
            </div>

            {/* Field 3: Location Where Pet Was Lost (With 1-Click Auto-Detect Button) */}
            <div className="form-group missing-form-group missing-location-group">
              <div className="location-field-label-row">
                <label className="form-label cute-label" htmlFor="modal-last-location" style={{ marginBottom: 0 }}>
                  <span>Lost Location</span>
                  <span className="required-star">*</span>
                </label>

                {/* Location Action Buttons */}
                <div className="location-action-btns-wrap">
                  <button
                    type="button"
                    onClick={() => autoDetectGPS()}
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
                        <span>Auto-Detect Lost Location</span>
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
                    <CheckCircle2 size={13} /> Lost area filled. Edit it if needed before broadcasting.
                  </span>
                ) : (
                  <span className="input-hint">
                    We try to auto-fill the lost area. You can edit this landmark before broadcasting.
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
