import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Edit3,
  AlertTriangle,
  Heart,
  Check,
  LayoutDashboard,
  Share2,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import type { LostReport, DogProfile } from '../types';
import { triggerStarCelebration } from '../utils/confettiHelper';
import { DogGoingHomeAnimation } from '../components/DogGoingHomeAnimation';
import { DogAwayFromHomeAnimation } from '../components/DogAwayFromHomeAnimation';
import { MissingPetReportModal } from '../components/MissingPetReportModal';
import abulluImg from '../assets/abullu.jpg';
import { getDogPhotoUrl, handleDogImageError } from '../utils/dogPhotoHelper';

interface ReportLostDogPageProps {
  onBackToPet?: () => void;
  onSuccess?: () => void;
}

export const ReportLostDogPage: React.FC<ReportLostDogPageProps> = ({
  onSuccess,
}) => {
  const {
    user,
    setActiveOnboardingTab,
    petSafetyStatus,
    markPetSafe,
    markPetLost,
  } = useAuth();
  const navigate = useNavigate();
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

  // Modal State for reporting or updating missing pet
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Dog Info (Pre-populated from Pet Profile or fallback)
  const dogName = existingReport?.dog?.name || existingPet?.name || 'My Dog';
  const breed = existingReport?.dog?.breed || existingPet?.breed || 'Companion Pet';

  // Toggle visual animation banner preview
  const [showAnimationBanner, setShowAnimationBanner] = useState(true);

  // ACTION 1: User chooses "My Pet is Safe" (Updates Navbar instantly!)
  const handleMarkSafe = () => {
    markPetSafe();
    setUserSelectedChoice('safe');
    setIsMissingModalOpen(false);

    // Star celebration animation on marking safe!
    triggerStarCelebration();

    showToast(`🐾 Wonderful! ${dogName || 'Your pup'} is safe at home.`, 'success');
  };

  // ACTION 2: User chooses "Pet is Not Safe (Missing)" -> Immediately opens Missing Report Modal!
  const handleSelectMissing = () => {
    markPetLost();
    setUserSelectedChoice('missing');
    setIsEditingExisting(false);
    setIsMissingModalOpen(true);
  };

  // ACTION 3: Handle Report Submission from Modal
  const handleModalSubmitReport = (reportData: {
    dateLost: string;
    timeLost: string;
    lastKnownLocation: string;
  }) => {
    if (!user) return;

    const reportId = existingReport?.id || `LOST-${Date.now()}`;
    const ownerId = `owner-${user.id}`;
    const dogId = existingPet?.id || existingReport?.dogId || `dog-${Date.now()}`;

    const dogPhoto =
      existingPet?.primaryPhoto ||
      existingReport?.dog?.primaryPhoto ||
      abulluImg;

    const dogData: DogProfile = existingPet
      ? {
          ...existingPet,
          primaryPhoto: existingPet.primaryPhoto || dogPhoto,
          photos: existingPet.photos && existingPet.photos.length > 0 ? existingPet.photos : [dogPhoto],
        }
      : {
          id: dogId,
          ownerId,
          name: dogName.trim() || 'My Dog',
          breed: breed.trim() || 'Companion Pet',
          gender: 'Male',
          age: '2 years',
          size: 'Medium (10-25kg)',
          color: 'Not specified',
          distinguishingMarks: '',
          primaryPhoto: dogPhoto,
          photos: [dogPhoto],
          createdAt: new Date().toISOString(),
        };

    const finalReport: LostReport = {
      id: reportId,
      dogId,
      ownerId,
      dog: dogData,
      ownerApproximateLocation: ownerProfile?.approximateArea || reportData.lastKnownLocation,
      lastKnownLocation: reportData.lastKnownLocation,
      lastKnownLatitude: ownerProfile?.latitude,
      lastKnownLongitude: ownerProfile?.longitude,
      dateLost: reportData.dateLost,
      timeLost: reportData.timeLost,
      additionalNotes: '',
      status: 'LOST',
      contactMechanism: {
        showPhone: true,
        showEmail: true,
        safeContactPhone: ownerProfile?.phone || user.phone,
        safeContactEmail: user.email,
        contactNote: 'Please reach out immediately if spotted!',
      },
      sightingCount: existingReport?.sightingCount || 0,
      createdAt: existingReport?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      storageService.saveReport(finalReport);
      markPetLost();
      setIsMissingModalOpen(false);

      showToast(
        isEditingExisting
          ? `✓ Lost Dog Alert updated for ${dogData.name}!`
          : `📢 Lost Dog Alert for ${dogData.name} broadcasted to community!`,
        'success'
      );
    } catch {
      showToast('Could not save lost report. Please try again.', 'error');
    }
  };

  // ACTION 4: Mark safely reunited from flyer
  const handleMarkReunited = () => {
    if (!existingReport || !user) return;
    storageService.updateReportStatus(existingReport.id, 'REUNITED');
    markPetSafe();
    setUserSelectedChoice('safe');
    setIsMissingModalOpen(false);

    // Star celebration animation on reunification!
    triggerStarCelebration();

    showToast('🎉 Wonderful news! Pup marked as safely REUNITED! ❤️', 'success');
  };

  // ACTION 5: 1-Click WhatsApp SOS Alert Share
  const handleWhatsAppShare = () => {
    const activeReport = existingReport || (user ? storageService.getLatestReportByUserId(user.id) : null);
    const activeReportId = activeReport?.id || '';
    const activeName = activeReport?.dog?.name || dogName || existingPet?.name || 'Our puppy';
    const activeBreed = activeReport?.dog?.breed || breed || existingPet?.breed || 'Companion Pet';
    const loc = activeReport?.lastKnownLocation || ownerProfile?.approximateArea || 'our local neighborhood';
    const contactPhone =
      activeReport?.contactMechanism?.safeContactPhone ||
      ownerProfile?.phone ||
      user?.phone ||
      '';

    // Direct Guest Sighting Link (No login required!)
    const sightingUrl = `${window.location.origin}/report-sighting/${activeReportId}`;

    const msg =
      `🚨 *EMERGENCY LOST DOG ALERT* 🐾\n\n` +
      `Please help us find *"${activeName}"* (${activeBreed})!\n` +
      `📍 *Last Seen:* ${loc}\n` +
      (contactPhone ? `📞 *Contact Owner:* ${contactPhone}\n` : '') +
      `\n🐾 *Direct Pet Details, Photos & Sighting Report:* (No login needed)\n` +
      `👉 ${sightingUrl}\n\n` +
      `FindLostPuppy Community Network 🐕❤️`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
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
                  Select your pet's current status below to explore the dashboard or broadcast an urgent missing alert.
                </p>
              </div>
            </div>
          </div>

          {/* DUAL CHOICE STATUS SELECTION (Sleek & Immediate) */}
          <div className="pet-safety-decision-grid">
            {/* CARD 1: MY PET IS SAFE */}
            <div
              className={`safety-decision-card safe-card ${safetyChoice === 'safe' ? 'selected' : ''}`}
              onClick={handleMarkSafe}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleMarkSafe()}
            >
              <div className="decision-card-icon-badge safe-icon-badge">
                <span className="decision-emoji">🏡</span>
                {safetyChoice === 'safe' && (
                  <span className="decision-status-pill safe-pill">
                    <Check size={12} />
                    <span>Safe at Home</span>
                  </span>
                )}
              </div>

              <div className="decision-card-content">
                <h2 className="decision-title">🟢 My Pet is Safe</h2>
                <p className="decision-desc">
                  {dogName ? `"${dogName}"` : 'Your pet'} is safe at home. No search alert needed.
                </p>
                <div className="decision-card-cta">
                  <span className="decision-cta-link safe-link">
                    {safetyChoice === 'safe' ? '✓ Currently Marked Safe' : 'Click: Mark Safe at Home 🏠'}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: PET IS NOT SAFE / MISSING (Triggers Instant Popup Modal) */}
            <div
              className={`safety-decision-card missing-card ${safetyChoice === 'missing' ? 'selected' : ''}`}
              onClick={handleSelectMissing}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSelectMissing()}
            >
              <div className="decision-card-icon-badge missing-icon-badge">
                <span className="decision-emoji">🚨</span>
                {safetyChoice === 'missing' && (
                  <span className="decision-status-pill alert-pill">
                    <AlertTriangle size={12} />
                    <span>Missing Alert Active</span>
                  </span>
                )}
              </div>

              <div className="decision-card-content">
                <h2 className="decision-title">🚨 Pet is Not Safe (Missing)</h2>
                <p className="decision-desc">
                  My pet went missing. Click to immediately open and fill the emergency broadcast form.
                </p>
                <div className="decision-card-cta">
                  <span className="decision-cta-link missing-link">
                    {safetyChoice === 'missing' ? '📢 Open Missing Form' : 'Click: Report Missing Pet 📢'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CASE 1: PET IS SAFE -> COZY ANIMATED DOG GOING HOME VIEW */}
          {/* ========================================================================= */}
          {safetyChoice === 'safe' && (
            <div className="pet-safe-confirmed-view">
              <DogGoingHomeAnimation dogName={dogName} />

              <div className="safe-view-actions-row" style={{ marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (onSuccess) onSuccess();
                    else {
                      setActiveOnboardingTab('dashboard');
                      navigate('/dashboard');
                    }
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
          {/* CASE 2: PET IS MISSING -> ACTIVE FLYER & VISUAL ANIMATION */}
          {/* ========================================================================= */}
          {safetyChoice === 'missing' && (
            <div className="missing-component-section">
              {/* Optional Toggle for Animated Radar Scene */}
              <div className="animation-toggle-header">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm animation-toggle-btn"
                  onClick={() => setShowAnimationBanner(!showAnimationBanner)}
                >
                  <Eye size={14} />
                  <span>{showAnimationBanner ? 'Hide Radar Animation' : 'Show Radar Animation'}</span>
                </button>
              </div>

              {showAnimationBanner && (
                <DogAwayFromHomeAnimation
                  dogName={dogName}
                  lastSeenArea={existingReport?.lastKnownLocation || ownerProfile?.approximateArea || 'your local neighborhood'}
                />
              )}

              {/* ACTIVE COMMUNITY FLYER SHOWCASE */}
              <div className="lost-alert-showcase">
                <div className="alert-flyer-card">
                  <div className="alert-flyer-badge-row">
                    <span className="alert-status-badge">
                      <AlertTriangle size={14} />
                      <span>ACTIVE COMMUNITY ALERT</span>
                    </span>
                    {existingReport?.id && (
                      <span className="alert-id-tag">ID: {existingReport.id}</span>
                    )}
                  </div>

                  <div className="alert-flyer-content">
                    <div className="alert-flyer-photo-wrap">
                      <img
                        src={getDogPhotoUrl(existingPet || existingReport?.dog, existingReport)}
                        alt={dogName}
                        className="alert-flyer-photo"
                        onError={handleDogImageError}
                      />
                    </div>

                    <div className="alert-flyer-details">
                      <h2 className="alert-flyer-dog-name">{dogName}</h2>
                      <p className="alert-flyer-breed">
                        {breed} • Companion Pet
                      </p>

                      <div className="alert-meta-list">
                        <div className="alert-meta-item">
                          <MapPin size={15} className="text-terracotta" />
                          <span>
                            <strong>Last Seen:</strong>{' '}
                            {existingReport?.lastKnownLocation ||
                              ownerProfile?.approximateArea ||
                              'Please update last seen location'}
                          </span>
                        </div>

                        <div className="alert-meta-item">
                          <Calendar size={15} className="text-terracotta" />
                          <span>
                            <strong>Date & Time:</strong>{' '}
                            {existingReport?.dateLost || new Date().toISOString().split('T')[0]} at{' '}
                            {existingReport?.timeLost || '06:00 PM'}
                          </span>
                        </div>
                      </div>

                      <div className="alert-contact-preview-box">
                        <ShieldCheck size={16} className="text-sage" />
                        <span>
                          <strong>Community Contact:</strong>{' '}
                          {existingReport?.contactMechanism?.safeContactPhone ||
                            ownerProfile?.phone ||
                            user?.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Flyer Action Buttons */}
                  <div className="showcase-actions-row">
                    <div className="action-buttons-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingExisting(true);
                          setIsMissingModalOpen(true);
                        }}
                        className="btn btn-outline btn-md update-alert-btn"
                      >
                        <Edit3 size={15} />
                        <span>✏️ Update Lost Dog Alert</span>
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
                        onClick={() => {
                          setActiveOnboardingTab('dashboard');
                          navigate('/dashboard');
                        }}
                        className="btn btn-primary btn-md"
                      >
                        <LayoutDashboard size={15} />
                        <span>Explore Dashboard 🐾</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* POPUP MISSING PET REPORT MODAL */}
      <MissingPetReportModal
        isOpen={isMissingModalOpen}
        onClose={() => setIsMissingModalOpen(false)}
        onSubmitReport={handleModalSubmitReport}
        initialData={{
          dateLost: existingReport?.dateLost,
          timeLost: existingReport?.timeLost,
          lastKnownLocation: existingReport?.lastKnownLocation,
        }}
        dog={existingPet || null}
        ownerProfile={ownerProfile || null}
        isEditing={isEditingExisting}
      />
    </div>
  );
};
