import { Link } from 'react-router-dom';
import { PawPrint, LogOut, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';

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
  const hasSkippedPet = user ? storageService.hasSkippedPetProfile(user.id) : false;

  return (
    <header className="navbar-header">
      <div className="app-container navbar-container">
        {/* Brand Logo */}
        <Link
          to="/"
          className="brand-logo"
          onClick={() => {
            if (isAuthenticated) setActiveOnboardingTab('dashboard');
          }}
        >
          <div className="brand-icon-wrapper">
            <PawPrint size={24} className="brand-icon" />
          </div>
          <div className="brand-text">
            <span className="brand-title">FindLostPuppy</span>
            <span className="brand-badge">Community Network</span>
          </div>
        </Link>

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
                      <img src={existingProfile.photo} alt={existingProfile.fullName} className="pill-avatar-img" />
                    ) : (
                      <span className="pill-avatar-emoji">🧑‍🦱</span>
                    )}
                  </div>
                  <div className="space-pill-content">
                    <span className="space-pill-title">Owner</span>
                    <span className="space-pill-detail">
                      {existingProfile?.fullName ? existingProfile.fullName.split(' ')[0] : 'Profile'}
                    </span>
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

              {/* 4. SEPARATE PET SAFETY ALERT TAB (Green if at Home, Red Alert if Missing) */}
              <div className="nav-tab-wrapper">
                <button
                  type="button"
                  className={`nav-space-pill ${
                    petSafetyStatus === 'LOST'
                      ? 'pet-missing-alert-pill'
                      : petSafetyStatus === 'SAFE'
                      ? 'pet-safe-home-pill'
                      : ''
                  } ${activeOnboardingTab === 'report' ? 'active' : ''}`}
                  onClick={() => setActiveOnboardingTab('report')}
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
              </div>

              {/* 5. SEPARATE DASHBOARD SPACE (Now houses Browse Dogs directory as well) */}
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

            <button
              type="button"
              onClick={logout}
              className="btn btn-ghost btn-sm logout-nav-btn"
              title="Sign out"
            >
              <LogOut size={15} />
              <span className="logout-text">Sign Out</span>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};
