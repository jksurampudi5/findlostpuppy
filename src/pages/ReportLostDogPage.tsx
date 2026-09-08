import React, { useState } from 'react';
import {
  Megaphone,
  Calendar,
  Clock,
  MapPin,
  FileText,
  DollarSign,
  Edit3,
  ArrowLeft,
  ShieldCheck,
  PawPrint,
  AlertTriangle,
  Heart,
  Check,
  Shield,
  Sparkles,
  LayoutDashboard,
  Share2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import type { LostReport, DogProfile } from '../types';
import { triggerStarCelebration } from '../utils/confettiHelper';
import { DogGoingHomeAnimation } from '../components/DogGoingHomeAnimation';
import { DogAwayFromHomeAnimation } from '../components/DogAwayFromHomeAnimation';
import safePuppyImg from '../assets/safe_puppy.jpg';
import missingPuppyImg from '../assets/missing_puppy.jpg';

interface ReportLostDogPageProps {
  onBackToPet?: () => void;
  onSuccess?: () => void;
}

export const ReportLostDogPage: React.FC<ReportLostDogPageProps> = ({
  onBackToPet,
  onSuccess,
}) => {
  const {
    user,
    setActiveOnboardingTab,
    petSafetyStatus,
    markPetSafe,
    markPetLost,
  } = useAuth();
  const { showToast } = useToast();

  const existingPet = user ? storageService.getPetProfileByUserId(user.id) : null;
  const ownerProfile = user ? storageService.getOwnerProfileByUserId(user.id) : null;
  const existingReport = user ? storageService.getLatestReportByUserId(user.id) : null;

  // Active status choice: 'safe' | 'missing' | null (undecided)
  const [userSelectedChoice, setUserSelectedChoice] = useState<'safe' | 'missing' | null>(null);

  const safetyChoice: 'safe' | 'missing' | null =
    userSelectedChoice ??
    (petSafetyStatus === 'LOST'
      ? 'missing'
      : petSafetyStatus === 'SAFE'
      ? 'safe'
      : existingReport && existingReport.status === 'LOST'
      ? 'missing'
      : user && storageService.isPetSafe(user.id)
      ? 'safe'
      : null);

  // Form Fields
  const today = new Date().toISOString().split('T')[0];
  const [dateLost, setDateLost] = useState(existingReport?.dateLost || today);
  const [timeLost, setTimeLost] = useState(existingReport?.timeLost || '06:00 PM');
  const [lastKnownLocation, setLastKnownLocation] = useState(
    existingReport?.lastKnownLocation ||
      (ownerProfile?.approximateArea ? `Near ${ownerProfile.approximateArea}` : '')
  );
  const [incidentNotes, setIncidentNotes] = useState(
    existingReport?.additionalNotes || existingReport?.contactMechanism?.contactNote || ''
  );
  const [rewardAmount, setRewardAmount] = useState('');

  // Dog Info (Pre-populated from Pet Profile or fallback)
  const [dogName] = useState(
    existingReport?.dog?.name || existingPet?.name || 'My Dog'
  );
  const [breed] = useState(
    existingReport?.dog?.breed || existingPet?.breed || 'Companion Pet'
  );
  const [primaryPhoto] = useState(
    existingReport?.dog?.primaryPhoto || existingPet?.primaryPhoto || ''
  );

  // Flow States
  const [isSubmitted, setIsSubmitted] = useState<boolean>(!!existingReport);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // ACTION 1: User chooses "My Pet is Safe" (Updates Navbar instantly!)
  const handleMarkSafe = () => {
    markPetSafe();
    setUserSelectedChoice('safe');

    // Star celebration animation on marking safe!
    triggerStarCelebration();

    showToast(`🐾 Wonderful! ${dogName || 'Your pup'} is safe at home.`, 'success');
  };

  // ACTION 2: User chooses "Pet is Not Safe (Missing)" (Updates Navbar instantly!)
  const handleSelectMissing = () => {
    markPetLost();
    setUserSelectedChoice('missing');
    showToast('Please provide details to broadcast a missing puppy alert.', 'info');
  };

  // ACTION 3: Submit / Publish Missing Dog Alert (NO CELEBRATION / CONFETTI FOR LOST DOG)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!lastKnownLocation.trim()) {
      showToast('Please specify where your dog was last seen.', 'warning');
      return;
    }

    setSubmitting(true);

    const reportId = existingReport?.id || `LOST-${Date.now()}`;
    const ownerId = `owner-${user.id}`;
    const dogId = existingPet?.id || existingReport?.dogId || `dog-${Date.now()}`;

    const dogData: DogProfile = existingPet || {
      id: dogId,
      ownerId,
      name: dogName.trim() || 'My Dog',
      breed: breed.trim() || 'Companion Pet',
      gender: 'Male',
      age: '2 years',
      size: 'Medium (10-25kg)',
      color: 'Not specified',
      distinguishingMarks: incidentNotes.trim(),
      primaryPhoto: primaryPhoto || '',
      photos: [],
      createdAt: new Date().toISOString(),
    };

    const finalReport: LostReport = {
      id: reportId,
      dogId,
      ownerId,
      dog: dogData,
      ownerApproximateLocation: ownerProfile?.approximateArea || lastKnownLocation.trim(),
      lastKnownLocation: lastKnownLocation.trim(),
      lastKnownLatitude: ownerProfile?.latitude,
      lastKnownLongitude: ownerProfile?.longitude,
      dateLost,
      timeLost,
      additionalNotes: incidentNotes.trim() + (rewardAmount ? ` | Reward: ${rewardAmount}` : ''),
      status: 'LOST',
      contactMechanism: {
        showPhone: true,
        showEmail: true,
        safeContactPhone: ownerProfile?.phone || user.phone,
        safeContactEmail: user.email,
        contactNote: incidentNotes.trim() || 'Please reach out immediately if spotted!',
      },
      sightingCount: existingReport?.sightingCount || 0,
      createdAt: existingReport?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      storageService.saveReport(finalReport);
      markPetLost();
      setIsSubmitted(true);
      setIsEditing(false);
      setSubmitting(false);

      // Note: As specified, NO celebration/star animation is triggered when dog is reported lost.
      showToast(`📢 Lost Dog Alert for ${dogData.name} broadcasted to community!`, 'success');
    } catch {
      setSubmitting(false);
      showToast('Could not publish lost report. Please try again.', 'error');
    }
  };

  // ACTION 4: Mark safely reunited from flyer
  const handleMarkReunited = () => {
    if (!existingReport || !user) return;
    storageService.updateReportStatus(existingReport.id, 'REUNITED');
    markPetSafe();
    setUserSelectedChoice('safe');
    setIsSubmitted(false);

    // Star celebration animation on reunification!
    triggerStarCelebration();

    showToast('🎉 Wonderful news! Pup marked as safely REUNITED! ❤️', 'success');
  };

  // ACTION 5: 1-Click WhatsApp SOS Alert Share
  const handleWhatsAppShare = () => {
    const activeReportId = existingReport?.id || '';
    const activeName = existingReport?.dog?.name || dogName || 'Our puppy';
    const activeBreed = existingReport?.dog?.breed || breed || 'Dog';
    const loc = existingReport?.lastKnownLocation || lastKnownLocation || 'our neighborhood';
    const contactPhone =
      existingReport?.contactMechanism.safeContactPhone ||
      ownerProfile?.phone ||
      user?.phone ||
      '';
    const reward = rewardAmount || (existingReport?.additionalNotes?.includes('Reward') ? existingReport.additionalNotes : '');

    // Direct Guest Sighting Link (No login required!)
    const sightingUrl = `${window.location.origin}/report-sighting/${activeReportId}`;

    const msg =
      `🚨 *EMERGENCY LOST DOG ALERT* 🐾\n\n` +
      `Please help us find *"${activeName}"* (${activeBreed})!\n` +
      `📍 *Last Seen:* ${loc}\n` +
      (reward ? `💰 *Reward:* ${reward}\n` : '') +
      (contactPhone ? `📞 *Contact Owner:* ${contactPhone}\n` : '') +
      `\n🐾 *Did you spot or find this dog?*\n` +
      `Click here to report location & photos (*No login required!*):\n` +
      `👉 ${sightingUrl}\n\n` +
      `FindLostPuppy Community Network 🐕❤️`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleBack = () => {
    if (onBackToPet) {
      onBackToPet();
    } else {
      setActiveOnboardingTab('dog');
    }
  };

  return (
    <div className="onboarding-page">
      <div className="app-container onboarding-container">
        <div className="onboarding-card card owner-theme-card">
          {/* Header Greeting */}
          <div className="onboarding-header">
            <div className="cute-welcome-banner">
              <div className="cute-welcome-icon">🐾</div>
              <div className="cute-welcome-text">
                <h1 className="cute-page-title">Pet Alert & Safety Status</h1>
                <p className="cute-page-sub">
                  Select your pet's current status below to explore the dashboard or report an emergency.
                </p>
              </div>
            </div>
          </div>

          {/* DUAL CHOICE STATUS SELECTION: CLEAN & VISUAL WITH IMAGES */}
          <div className="pet-safety-decision-grid">
            {/* CARD 1: MY PET IS SAFE */}
            <div
              className={`safety-decision-card safe-card ${safetyChoice === 'safe' ? 'selected' : ''}`}
              onClick={handleMarkSafe}
              role="button"
              tabIndex={0}
            >
              <div className="card-visual-header">
                <img
                  src={safePuppyImg}
                  alt="Happy pup safe at home"
                  className="decision-card-img"
                />
                {safetyChoice === 'safe' && (
                  <span className="decision-active-badge">
                    <Check size={12} />
                    <span>Safe & Sound</span>
                  </span>
                )}
              </div>

              <div className="decision-card-content">
                <h2 className="decision-title">🟢 My Pet is Safe</h2>
                <p className="decision-desc">
                  {dogName ? `"${dogName}"` : 'Your pet'} is safe at home with family. No emergency alert is needed.
                </p>
                <div className="decision-card-cta">
                  <span className="decision-cta-link safe-link">
                    {safetyChoice === 'safe' ? '✓ Currently Marked Safe' : 'Click: Mark Safe at Home 🏠'}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: PET IS NOT SAFE / MISSING */}
            <div
              className={`safety-decision-card missing-card ${safetyChoice === 'missing' ? 'selected' : ''}`}
              onClick={handleSelectMissing}
              role="button"
              tabIndex={0}
            >
              <div className="card-visual-header">
                <img
                  src={missingPuppyImg}
                  alt="Pet rescue search"
                  className="decision-card-img"
                />
                {safetyChoice === 'missing' && (
                  <span className="decision-active-badge alert-active-badge">
                    <AlertTriangle size={12} />
                    <span>Missing Alert Mode</span>
                  </span>
                )}
              </div>

              <div className="decision-card-content">
                <h2 className="decision-title">🚨 Pet is Not Safe (Missing)</h2>
                <p className="decision-desc">
                  My pet went missing. Broadcast an urgent emergency search alert to neighbors.
                </p>
                <div className="decision-card-cta">
                  <span className="decision-cta-link missing-link">
                    {safetyChoice === 'missing' ? 'Fill Report Below ↓' : 'Click: Report Missing Dog 📢'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CASE 1: PET IS SAFE -> COZY ANIMATED DOG GOING HOME VIEW & DASHBOARD ACCESS */}
          {/* ========================================================================= */}
          {safetyChoice === 'safe' && (
            <div className="pet-safe-confirmed-view">
              <DogGoingHomeAnimation dogName={dogName} />

              <div className="safe-view-actions-row" style={{ marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (onSuccess) onSuccess();
                    else setActiveOnboardingTab('dashboard');
                  }}
                  className="btn btn-primary btn-lg explore-dash-btn"
                >
                  <LayoutDashboard size={18} />
                  <span>Explore Community Dashboard 🐾</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CASE 2: PET IS MISSING -> ANIMATED DOG AWAY FROM HOME & FORM/FLYER */}
          {/* ========================================================================= */}
          {safetyChoice === 'missing' && (
            <div className="missing-component-section">
              <DogAwayFromHomeAnimation
                dogName={dogName}
                lastSeenArea={lastKnownLocation || ownerProfile?.approximateArea || 'your local neighborhood'}
              />

              {/* SUBCASE A: ALREADY SUBMITTED -> SHOW ACTIVE COMMUNITY FLYER */}
              {isSubmitted && !isEditing ? (
                <div className="lost-alert-showcase">
                  {existingReport ? (
                    <div className="alert-flyer-card">
                      <div className="alert-flyer-badge-row">
                        <span className="alert-status-badge">
                          <AlertTriangle size={14} />
                          <span>ACTIVE COMMUNITY ALERT</span>
                        </span>
                        <span className="alert-id-tag">ID: {existingReport.id}</span>
                      </div>

                      <div className="alert-flyer-content">
                        <div className="alert-flyer-photo-wrap">
                          {existingReport.dog.primaryPhoto ? (
                            <img
                              src={existingReport.dog.primaryPhoto}
                              alt={existingReport.dog.name}
                              className="alert-flyer-photo"
                            />
                          ) : (
                            <div className="alert-flyer-avatar-placeholder">
                              <PawPrint size={40} />
                            </div>
                          )}
                        </div>

                        <div className="alert-flyer-details">
                          <h2 className="alert-flyer-dog-name">{existingReport.dog.name}</h2>
                          <p className="alert-flyer-breed">
                            {existingReport.dog.breed} • {existingReport.dog.gender}
                          </p>

                          <div className="alert-meta-list">
                            <div className="alert-meta-item">
                              <MapPin size={15} className="text-terracotta" />
                              <span>
                                <strong>Last Seen:</strong> {existingReport.lastKnownLocation}
                              </span>
                            </div>

                            <div className="alert-meta-item">
                              <Calendar size={15} className="text-terracotta" />
                              <span>
                                <strong>Date & Time:</strong> {existingReport.dateLost} at{' '}
                                {existingReport.timeLost}
                              </span>
                            </div>

                            {existingReport.additionalNotes && (
                              <div className="alert-meta-item">
                                <FileText size={15} className="text-terracotta" />
                                <span>
                                  <strong>Notes:</strong> {existingReport.additionalNotes}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="alert-contact-preview-box">
                            <ShieldCheck size={16} className="text-sage" />
                            <span>
                              <strong>Community Contact:</strong>{' '}
                              {existingReport.contactMechanism.safeContactPhone ||
                                existingReport.contactMechanism.safeContactEmail}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Flyer Actions */}
                      <div className="showcase-actions-row">
                        <div className="action-buttons-wrap">
                          <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="btn btn-outline btn-md"
                          >
                            <Edit3 size={15} />
                            <span>✏️ Update Alert Details</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleMarkReunited}
                            className="btn btn-secondary btn-md reunite-action-btn"
                          >
                            <Heart size={15} />
                            <span>Mark Pup Reunited & Safe ❤️</span>
                          </button>
                        </div>

                        <div className="action-buttons-wrap">
                          <button
                            type="button"
                            onClick={handleWhatsAppShare}
                            className="btn btn-whatsapp btn-md"
                            style={{
                              backgroundColor: '#25D366',
                              color: '#FFFFFF',
                              borderColor: '#25D366',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              fontWeight: 700,
                            }}
                          >
                            <Share2 size={15} />
                            <span>📲 Share SOS on WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveOnboardingTab('dashboard')}
                            className="btn btn-primary btn-md"
                          >
                            <LayoutDashboard size={15} />
                            <span>Explore Dashboard 🐾</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                /* SUBCASE B: FORM TO BROADCAST / EDIT MISSING DOG ALERT */
                <form onSubmit={handleSubmit} className="onboarding-form">
                  <div className="form-section-card cute-section-card">
                    <h3 className="section-title-sm cute-section-title">
                      <span className="cute-title-icon">📢</span>
                      <span>{isEditing ? 'Update Lost Dog Alert' : 'Broadcast Lost Dog Alert'}</span>
                    </h3>

                    {/* Pre-population Banner */}
                    <div className="prepopulated-info-card">
                      <div className="prepopulated-badge">
                        <Sparkles size={14} />
                        <span>Pre-Populated Pet Info</span>
                      </div>
                      <div className="prepopulated-details-row">
                        <span className="prep-item">
                          <strong>Reporting for:</strong> {dogName} ({breed})
                        </span>
                        {ownerProfile?.approximateArea && (
                          <span className="prep-item">
                            <strong>Your Area:</strong> {ownerProfile.approximateArea}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="form-vertical-stack">
                      {/* 1. Date Lost */}
                      <div className="form-group">
                        <label className="form-label cute-label" htmlFor="date-lost">
                          <span>1. Date When Lost</span>
                          <span className="required-star">*</span>
                        </label>
                        <div className="input-with-icon">
                          <Calendar size={16} className="input-icon text-terracotta" />
                          <input
                            id="date-lost"
                            type="date"
                            className="form-input cute-input"
                            value={dateLost}
                            max={today}
                            onChange={(e) => setDateLost(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      {/* 2. Time Lost */}
                      <div className="form-group">
                        <label className="form-label cute-label" htmlFor="time-lost">
                          <span>2. Approximate Time</span>
                          <span className="optional-tag">Optional</span>
                        </label>
                        <div className="input-with-icon">
                          <Clock size={16} className="input-icon text-terracotta" />
                          <input
                            id="time-lost"
                            type="text"
                            className="form-input cute-input"
                            placeholder="e.g. 06:30 PM, Evening walk, Morning"
                            value={timeLost}
                            onChange={(e) => setTimeLost(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* 3. Last Known Location */}
                      <div className="form-group">
                        <label className="form-label cute-label" htmlFor="last-location">
                          <span>3. Last Seen Location / Landmark</span>
                          <span className="required-star">*</span>
                        </label>
                        <div className="input-with-icon">
                          <MapPin size={16} className="input-icon text-terracotta" />
                          <input
                            id="last-location"
                            type="text"
                            className="form-input cute-input"
                            placeholder="e.g. Near City Park Gate, Benz Circle, Tanuku Main Road"
                            value={lastKnownLocation}
                            onChange={(e) => setLastKnownLocation(e.target.value)}
                            required
                          />
                        </div>
                        <span className="input-hint">
                          Help neighbors identify where the search should begin.
                        </span>
                      </div>

                      {/* 4. Incident Notes & Temperament */}
                      <div className="form-group">
                        <label className="form-label cute-label" htmlFor="incident-notes">
                          <span>4. Circumstances & Dog Temperament</span>
                          <span className="optional-tag">Optional</span>
                        </label>
                        <div className="input-with-icon input-textarea-wrap">
                          <FileText size={16} className="input-icon text-terracotta" />
                          <textarea
                            id="incident-notes"
                            className="form-input cute-input cute-textarea"
                            rows={3}
                            placeholder="e.g. Slipped collar when frightened by thunder. Responds to whistle and treats. Friendly with kids."
                            value={incidentNotes}
                            onChange={(e) => setIncidentNotes(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* 5. Reward */}
                      <div className="form-group">
                        <label className="form-label cute-label" htmlFor="reward-amount">
                          <span>5. Heartfelt Reward Offered</span>
                          <span className="optional-tag">Optional</span>
                        </label>
                        <div className="input-with-icon">
                          <DollarSign size={16} className="input-icon text-terracotta" />
                          <input
                            id="reward-amount"
                            type="text"
                            className="form-input cute-input"
                            placeholder="e.g. ₹5,000, Substantial Reward, Generous Token of Thanks"
                            value={rewardAmount}
                            onChange={(e) => setRewardAmount(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Safe Contact Privacy Notice */}
                      <div className="privacy-guarantee-card">
                        <div className="privacy-badge-icon">
                          <Shield size={18} />
                        </div>
                        <div className="privacy-badge-content">
                          <h4 className="privacy-title">Your Private Address is Strictly Protected</h4>
                          <p className="privacy-desc">
                            Only your approximate neighborhood (
                            {ownerProfile?.approximateArea || 'General Area'}) and authorized contact
                            channels will be displayed.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="wizard-actions-footer">
                    <div className="action-buttons-wrap">
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="btn btn-outline btn-lg"
                        >
                          <span>Cancel</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleBack}
                          className="btn btn-outline btn-lg"
                        >
                          <ArrowLeft size={16} />
                          <span>Back to Pet</span>
                        </button>
                      )}
                    </div>

                    <div className="action-buttons-wrap">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-primary btn-lg publish-alert-btn"
                      >
                        <Megaphone size={18} />
                        <span>{isEditing ? '✓ Update Alert' : '📢 Broadcast Missing Alert'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
