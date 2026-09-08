import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, LogOut, Check, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import safePuppyImg from '../assets/safe_puppy.jpg';
import missingPuppyImg from '../assets/missing_puppy.jpg';

export const Navbar = () => {
  const {
    user,
    isAuthenticated,
    hasCompletedOwner,
    hasCompletedLocation,
    hasCompletedDog,
    activeOnboardingTab,
    setActiveOnboardingTab,
    petSafetyStatus,
    logout,
  } = useAuth();

  const existingProfile = user ? storageService.getOwnerProfileByUserId(user.id) : null;
  const existingPet = user ? storageService.getPetProfileByUserId(user.id) : null;
  const existingReport = user ? storageService.getLatestReportByUserId(user.id) : null;
  const hasSkippedPet = user ? storageService.hasSkippedPetProfile(user.id) : false;
  const [isPetAlertHovered, setIsPetAlertHovered] = useState(false);

  const previewPhoto =
    existingPet?.primaryPhoto ||
    existingReport?.dog?.primaryPhoto ||
    (petSafetyStatus === 'LOST' ? missingPuppyImg : safePuppyImg);

  const previewDogName = existingPet?.name || existingReport?.dog?.name || 'Your Dog';
  const previewBreed = existingPet?.breed || existingReport?.dog?.breed || 'Companion Pet';
  const previewArea =
    existingReport?.lastKnownLocation ||
    existingProfile?.approximateArea ||
    existingProfile?.city ||
    'Local Area';

  return (
    <header className="navbar-header">
      <div className="app-container navbar-container">
        {/* Brand Logo & Mobile Quick Controls */}
        <div className="navbar-brand-row">
          <Link
            to="/"
            className="brand-logo"
            onClick={() => {
              if (isAuthenticated) setActiveOnboardingTab('dashboard');
            }}
          >
            <div className="brand-icon-wrapper">
              <PawPrint size={22} className="brand-icon" />
            </div>
            <div className="brand-text">
              <span className="brand-title">FindLostPuppy</span>
              <span className="brand-badge">Community Network</span>
            </div>
          </Link>

          {isAuthenticated && (
            <div className="nav-user-actions-mobile">
              <button
                type="button"
                onClick={logout}
                className="btn btn-ghost btn-sm logout-nav-btn mobile-logout-btn"
                title="Sign out"
              >
                <LogOut size={15} />
                <span className="logout-text">Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {isAuthenticated ? (
          <div className="onboarding-nav-status">
            {/* Dedicated Unified Navigation Tabs (All Identical Size & Proportions) */}
            <div className="onboarding-nav-spaces">
              {/* 1. SEPARATE OWNER PROFILE TAB */}
              <div className="nav-tab-wrapper">
                <button
                  type="button"
                  className={`nav-space-pill owner-space-pill ${activeOnboardingTab === 'owner' ? 'active' : ''}`}
                  onClick={() => setActiveOnboardingTab('owner')}
                  title="View / Edit Pet Parent Profile"
                >
                  <div className="space-pill-icon owner-icon">
                    {existingProfile?.photo ? (
                      <img src={existingProfile.photo} alt="Owner" className="pill-avatar-img" />
                    ) : (
                      <span className="pill-avatar-emoji">🧑‍🦱</span>
                    )}
                  </div>
                  <div className="space-pill-content">
                    <span className="space-pill-title">Owner</span>
                    <span className="space-pill-detail">Profile</span>
                  </div>
                  {hasCompletedOwner && <Check size={13} className="space-pill-check" />}
                </button>
              </div>

              {/* 2. SEPARATE LOCATION TAB */}
              <div className="nav-tab-wrapper">
                <button
                  type="button"
                  className={`nav-space-pill location-space-pill ${activeOnboardingTab === 'location' ? 'active' : ''}`}
                  onClick={() => setActiveOnboardingTab('location')}
                  title="View / Edit Location"
                >
                  <div className="space-pill-icon location-icon">
                    <span className="pill-avatar-emoji">📍</span>
                  </div>
                  <div className="space-pill-content">
                    <span className="space-pill-title">Location</span>
                    <span className="space-pill-detail">
                      {existingProfile?.city || existingProfile?.district || 'Set Area'}
                    </span>
                  </div>
                  {hasCompletedLocation && <Check size={13} className="space-pill-check" />}
                </button>
              </div>

              {/* 3. SEPARATE PET PROFILE TAB */}
              <div className="nav-tab-wrapper">
                <button
                  type="button"
                  className={`nav-space-pill pet-space-pill ${activeOnboardingTab === 'dog' || activeOnboardingTab === 'pet' ? 'active' : ''}`}
                  onClick={() => setActiveOnboardingTab('dog')}
                  title="View / Edit Pet Profile"
                >
                  <div className="space-pill-icon pet-icon">
                    {existingPet?.primaryPhoto ? (
                      <img src={existingPet.primaryPhoto} alt={existingPet.name} className="pill-avatar-img" />
                    ) : (
                      <span className="pill-avatar-emoji">🐶</span>
                    )}
                  </div>
                  <div className="space-pill-content">
                    <span className="space-pill-title">Pet Profile</span>
                    <span className="space-pill-detail">
                      {existingPet?.name ? existingPet.name : hasSkippedPet ? 'Skipped' : 'Add Pup'}
                    </span>
                  </div>
                  {hasCompletedDog && <Check size={13} className="space-pill-check" />}
                </button>
              </div>

              {/* 4. SEPARATE PET SAFETY ALERT TAB (With Interactive Hover & Click Preview Card) */}
              <div
                className="nav-tab-wrapper pet-alert-tab-wrapper"
                onMouseEnter={() => setIsPetAlertHovered(true)}
                onMouseLeave={() => setIsPetAlertHovered(false)}
              >
                <button
                  type="button"
                  id="navbar-pet-alert-btn"
                  className={`nav-space-pill ${
                    petSafetyStatus === 'LOST'
                      ? 'pet-missing-alert-pill'
                      : petSafetyStatus === 'SAFE'
                      ? 'pet-safe-home-pill'
                      : ''
                  } ${activeOnboardingTab === 'report' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveOnboardingTab('report');
                    setIsPetAlertHovered(false);
                  }}
                  title={
                    petSafetyStatus === 'LOST'
                      ? 'Urgent Missing Dog Alert'
                      : petSafetyStatus === 'SAFE'
                      ? 'Pet Safe at Home'
                      : 'Check Pet Safety Status'
                  }
                >
                  <div
                    className={`space-pill-icon ${
                      petSafetyStatus === 'LOST'
                        ? 'alert-icon pulsing-red-beacon'
                        : petSafetyStatus === 'SAFE'
                        ? 'safe-home-icon'
                        : ''
                    }`}
                  >
                    <span className="pill-avatar-emoji">
                      {petSafetyStatus === 'LOST' ? '🚨' : petSafetyStatus === 'SAFE' ? '🏡' : '🐾'}
                    </span>
                  </div>
                  <div className="space-pill-content">
                    <span className="space-pill-title">
                      {petSafetyStatus === 'LOST' ? 'Pet Alert' : petSafetyStatus === 'SAFE' ? 'Pet Safety' : 'Pet Safety'}
                    </span>
                    <span className="space-pill-detail">
                      {petSafetyStatus === 'LOST'
                        ? 'Missing Dog! 🚨'
                        : petSafetyStatus === 'SAFE'
                        ? 'Safe at Home 💚'
                        : 'Set Status'}
                    </span>
                  </div>
                  {petSafetyStatus === 'SAFE' && (
                    <Check size={13} className="space-pill-check" style={{ color: '#16A34A' }} />
                  )}
                </button>

                {/* Floating Visual Pet Alert Preview Popover on Hover / Focus */}
                {isPetAlertHovered && (
                  <div className="pet-alert-hover-popover" role="tooltip">
                    <div className="popover-badge-row">
                      {petSafetyStatus === 'LOST' ? (
                        <span className="popover-status-badge badge-lost">
                          <AlertTriangle size={12} />
                          <span>MISSING DOG ALERT</span>
                        </span>
                      ) : (
                        <span className="popover-status-badge badge-safe">
                          <ShieldCheck size={12} />
                          <span>SAFE AT HOME</span>
                        </span>
                      )}
                    </div>

                    <div className="popover-media-wrap">
                      <img
                        src={previewPhoto}
                        alt={previewDogName}
                        className="popover-preview-img"
                      />
                    </div>

                    <div className="popover-info-body">
                      <h4 className="popover-dog-name">{previewDogName}</h4>
                      <p className="popover-dog-breed">{previewBreed}</p>
                      <p className="popover-location-text">
                        📍 <strong>Location:</strong> {previewArea}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm btn-block popover-cta-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveOnboardingTab('report');
                        setIsPetAlertHovered(false);
                      }}
                    >
                      <span>Manage Pet Alert</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* 5. SEPARATE DASHBOARD SPACE */}
              <div className="nav-tab-wrapper">
                <button
                  type="button"
                  className={`nav-space-pill dashboard-space-pill ${activeOnboardingTab === 'dashboard' || activeOnboardingTab === 'completed' ? 'active' : ''}`}
                  onClick={() => setActiveOnboardingTab('dashboard')}
                  title="Community Recovery Dashboard & Browse Dogs"
                >
                  <div className="space-pill-icon dashboard-icon">
                    <span className="pill-avatar-emoji">📊</span>
                  </div>
                  <div className="space-pill-content">
                    <span className="space-pill-title">Dashboard</span>
                    <span className="space-pill-detail">Browse & Alerts</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="nav-desktop-actions">
              <button
                type="button"
                onClick={logout}
                className="btn btn-ghost btn-sm logout-nav-btn desktop-logout-btn"
                title="Sign out of account"
              >
                <LogOut size={16} />
                <span className="logout-text">Sign Out</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
};
