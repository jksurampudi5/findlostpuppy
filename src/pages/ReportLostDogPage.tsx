import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  ShieldCheck,
  PawPrint,
  House,
  Siren,
  ArrowLeft,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import type { LostReport, DogProfile } from '../types';
import { triggerStarCelebration } from '../utils/confettiHelper';
import { MissingPetReportModal } from '../components/MissingPetReportModal';
import abulluImg from '../assets/abullu.jpg';
import { getDogPhotoUrl, handleDogImageError } from '../utils/dogPhotoHelper';
import { generateWhatsAppSosMessage } from '../utils/shareHelper';

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
    refreshProgress,
  } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [, setForceUpdate] = useState(0);
  useEffect(() => {
    const handleUpdate = () => {
      setForceUpdate((prev) => prev + 1);
    };
    window.addEventListener('findlostpuppy_reports_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('findlostpuppy_reports_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const existingPet = user ? storageService.getPetProfileByUserId(user.id, user.email) : null;
  const ownerProfile = user ? storageService.getOwnerProfileByUserId(user.id, user.email) : null;
  const existingReport = user ? storageService.getLatestReportByUserId(user.id, user.email) : null;

  // Active status choice: 'safe' | 'missing' | null (undecided)
  const [userSelectedChoice, setUserSelectedChoice] = useState<'safe' | 'missing' | null>(null);

  useEffect(() => {
    if (petSafetyStatus === 'LOST') {
      setUserSelectedChoice('missing');
    } else if (petSafetyStatus === 'SAFE') {
      setUserSelectedChoice('safe');
    }
  }, [petSafetyStatus]);

  // ACID-compliant reactive resolution: LOST report strictly takes precedence over SAFE
  const isDirectlyLost = petSafetyStatus === 'LOST' || existingReport?.status === 'LOST';
  const isDirectlySafe = petSafetyStatus === 'SAFE' || existingReport?.status === 'SAFE' || (user && storageService.isPetSafe(user.id, user.email));

  const safetyChoice: 'safe' | 'missing' =
    userSelectedChoice ??
    (isDirectlyLost ? 'missing' : isDirectlySafe ? 'safe' : 'safe');

  // Modal State for reporting or updating missing pet
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Dog Info (Pre-populated from Pet Profile or fallback)
  const dogName = existingReport?.dog?.name || existingPet?.name || 'My Dog';
  const breed = existingReport?.dog?.breed || existingPet?.breed || 'Companion Pet';

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
    const ownerId = user.id;
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
      setUserSelectedChoice('missing');
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

  // ACTION 4: Mark safe at home from existing report context (preserved)
  const handleMarkSafeFromFlyer = () => {
    if (!existingReport || !user) return;
    storageService.updateReportStatus(existingReport.id, 'SAFE');
    markPetSafe();
    setUserSelectedChoice('safe');
    setIsMissingModalOpen(false);
    triggerStarCelebration();
    showToast('🏡 Wonderful news! Pup marked as Safe at Home! ❤️', 'success');
  };

  // ACTION 5: Delete / Remove Alert permanently (preserved)
  const handleDeleteAlert = () => {
    if (!existingReport && !user) return;
    const targetId = existingReport?.id;
    const confirmed = window.confirm(`Are you sure you want to remove the missing alert for ${dogName}?`);
    if (!confirmed) return;

    if (targetId) {
      storageService.deleteReport(targetId);
    }
    markPetSafe();
    refreshProgress();
    setUserSelectedChoice('safe');
    setIsMissingModalOpen(false);
    showToast(`🗑️ Missing alert for ${dogName} removed. Pet is marked safe at home.`, 'info');
  };

  // ACTION 6: 1-Click WhatsApp SOS Alert Share (preserved)
  const handleWhatsAppShare = () => {
    const activeReport = existingReport || (user ? storageService.getLatestReportByUserId(user.id) : null);
    const contactPhone =
      activeReport?.contactMechanism?.safeContactPhone ||
      ownerProfile?.phone ||
      user?.phone ||
      '';

    const { whatsappUrl, dashboardUrl } = generateWhatsAppSosMessage(
      activeReport || {
        dog: existingPet || {
          id: 'temp',
          ownerId: user?.id || '',
          name: dogName || 'Our Puppy',
          breed: breed || 'Companion Pet',
          gender: 'Male',
          age: '2 years',
          size: 'Medium (10-25kg)',
          color: '',
          distinguishingMarks: '',
          primaryPhoto: '',
          photos: [],
          createdAt: new Date().toISOString(),
        },
        ownerApproximateLocation: ownerProfile?.approximateArea || 'Local Neighborhood',
        lastKnownLocation: ownerProfile?.approximateArea || 'Local Neighborhood',
      },
      existingPet,
      contactPhone
    );

    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(dashboardUrl);
      }
    } catch {
      // Ignore clipboard write failures
    }

    showToast('📲 WhatsApp SOS alert prepared! Live Public Dashboard link copied.', 'success');
    window.open(whatsappUrl, '_blank');
  };

  // Back navigation
  const handleBack = () => {
    if (onBackToPet) {
      onBackToPet();
    } else if (onSuccess) {
      onSuccess();
    } else {
      navigate(-1);
    }
  };

  // Keyboard handler for cards
  const handleCardKey = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  // Suppress "unused" warnings for preserved business handlers
  void handleMarkSafeFromFlyer;
  void handleDeleteAlert;
  void handleWhatsAppShare;
  void getDogPhotoUrl;
  void handleDogImageError;

  return (
    <div className="onboarding-page">
      <div className="app-container onboarding-container">
        {/* APPROVED OUTER CONTAINER — orange glow/border/shadow preserved exactly */}
        <div className="onboarding-card card owner-theme-card">

          {/* ── BACK BUTTON ── */}
          <div className="ps-top-bar">
            <button
              type="button"
              className="pet-profile-back-btn"
              onClick={handleBack}
              title="Go back"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
          </div>

          {/* ── CENTERED HEADER ── */}
          <div className="ps-header">
            <div className="ps-icon-ring" aria-hidden="true">
              <PawPrint size={28} className="ps-paw-icon" />
            </div>

            <h1 className="ps-title">
              <span className="ps-title-white">Pet Alert &amp; </span>
              <span className="ps-title-orange">Safety Status</span>
            </h1>

            <p className="ps-desc">
              Select your pet's current status below to explore the dashboard or broadcast an urgent missing alert.
            </p>
          </div>

          {/* ── TWO STATUS CARDS ── */}
          <div
            className="ps-cards-grid"
            role="radiogroup"
            aria-label="Pet safety status"
          >

            {/* CARD 1 — MY PET IS SAFE */}
            <div
              className={`ps-card ps-card--safe${safetyChoice === 'safe' ? ' ps-card--selected' : ''}`}
              onClick={handleMarkSafe}
              onKeyDown={(e) => handleCardKey(e, handleMarkSafe)}
              role="radio"
              aria-checked={safetyChoice === 'safe'}
              tabIndex={0}
              aria-label="My Pet is Safe"
            >
              {/* Top-right selection ring */}
              <div className="ps-select-ring ps-select-ring--safe" aria-hidden="true">
                {safetyChoice === 'safe' && (
                  <Check size={14} strokeWidth={3} />
                )}
              </div>

              {/* Visual icon area */}
              <div className="ps-card-visual ps-card-visual--safe" aria-hidden="true">
                <div className="ps-safe-icon-stack">
                  <div className="ps-safe-house-wrap">
                    <House size={52} className="ps-safe-house" />
                  </div>
                  <div className="ps-safe-shield-wrap">
                    <ShieldCheck size={26} className="ps-safe-shield" />
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className="ps-card-body">
                <div className="ps-card-title-row">
                  <span className="ps-status-dot ps-status-dot--green" aria-hidden="true" />
                  <span className="ps-card-title">My Pet is Safe</span>
                </div>
                <p className="ps-card-desc">
                  Your pet is safe at home. No search alert needed.
                </p>
              </div>
            </div>

            {/* CARD 2 — PET IS NOT SAFE (MISSING) */}
            <div
              className={`ps-card ps-card--missing${safetyChoice === 'missing' ? ' ps-card--selected' : ''}`}
              onClick={handleSelectMissing}
              onKeyDown={(e) => handleCardKey(e, handleSelectMissing)}
              role="radio"
              aria-checked={safetyChoice === 'missing'}
              tabIndex={0}
              aria-label="Pet is Not Safe (Missing)"
            >
              {/* Top-right selection ring */}
              <div className="ps-select-ring ps-select-ring--missing" aria-hidden="true">
                {safetyChoice === 'missing' && (
                  <Check size={14} strokeWidth={3} />
                )}
              </div>

              {/* Visual icon area */}
              <div className="ps-card-visual ps-card-visual--missing" aria-hidden="true">
                <div className="ps-missing-icon-stack">
                  <div className="ps-siren-wrap">
                    <Siren size={52} className="ps-siren-icon" />
                    <PawPrint size={20} className="ps-siren-paw" />
                  </div>
                  <AlertTriangle size={0} className="ps-visually-hidden" aria-hidden="true" />
                </div>
              </div>

              {/* Card body */}
              <div className="ps-card-body">
                <div className="ps-card-title-row">
                  <span className="ps-status-dot ps-status-dot--red" aria-hidden="true" />
                  <span className="ps-card-title">Pet is Not Safe (Missing)</span>
                </div>
                <p className="ps-card-desc">
                  My pet went missing. Click to immediately open and fill the emergency broadcast form.
                </p>
              </div>
            </div>

          </div>

          {/* ── DASHBOARD BUTTON ── */}
          <div className="ps-dashboard-row">
            <button
              type="button"
              className="btn btn-primary ps-dash-btn"
              onClick={() => {
                setActiveOnboardingTab('dashboard');
                navigate('/dashboard');
              }}
            >
              <LayoutDashboard size={18} />
              <span>Explore Community Dashboard</span>
            </button>
          </div>
          {/* END OF PET SAFETY CONTENT */}

        </div>
      </div>

      {/* POPUP MISSING PET REPORT MODAL — preserved exactly */}
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
