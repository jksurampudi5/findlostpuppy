import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PawPrint, LogOut, Check, AlertTriangle, ArrowRight, ShieldCheck, Shield } from 'lucide-react';
import { useAuth, type OnboardingTab } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import safePuppyImg from '../assets/safe_puppy.jpg';
import missingPuppyImg from '../assets/missing_puppy.jpg';

export const Navbar = () => {
  const {
    user,
    isAuthenticated,
    isAdmin,
    hasCompletedOwner,
    hasCompletedLocation,
    hasCompletedDog,
    activeOnboardingTab,
    setActiveOnboardingTab,
    petSafetyStatus,
    logout,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

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

  const handleTabClick = (tab: OnboardingTab, routePath: string) => {
    setActiveOnboardingTab(tab);
    navigate(routePath);
    setIsPetAlertHovered(false);
  };

  const isOwnerActive =
    location.pathname === '/owner' ||
    (location.pathname === '/' && activeOnboardingTab === 'owner');

  const isLocationActive =
    location.pathname === '/location' ||
    (location.pathname === '/' && activeOnboardingTab === 'location');

  const isPetActive =
    location.pathname === '/pet' ||
    location.pathname === '/dog' ||
    location.pathname === '/dog-profile' ||
    (location.pathname === '/' && (activeOnboardingTab === 'dog' || activeOnboardingTab === 'pet'));

  const isAlertActive =
    location.pathname === '/alert' ||
    location.pathname === '/report' ||
    location.pathname === '/report-lost' ||
    (location.pathname === '/' && activeOnboardingTab === 'report');

  const isDashboardActive =
    location.pathname === '/dashboard' ||
    location.pathname === '/find' ||
    (location.pathname === '/' && (activeOnboardingTab === 'dashboard' || activeOnboardingTab === 'completed'));

  const isAdminActive = location.pathname === '/admin';
  const isUserAdmin = isAdmin || user?.isAdmin || user?.email?.toLowerCase() === 'jksurampudi5@gmail.com';

  return (
    <>
      {/* Top Header for Desktop & Mobile */}
      <header className="navbar-header">
        <div className="app-container navbar-container">
          {/* Brand Logo */}
          <div className="navbar-brand-row">
            <Link
              to={isAuthenticated ? '/dashboard' : '/'}
              className="brand-logo"
              onClick={() => {
                if (isAuthenticated) {
                  setActiveOnboardingTab('dashboard');
                  navigate('/dashboard');
                }
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
          </div>

          {isAuthenticated ? (
            <div className="onboarding-nav-status">
              {/* Mobile Quick Status Pill (Visible on Mobile Only) */}
              <div className="mobile-header-quick-status">
                {isUserAdmin && (
                  <button
                    type="button"
                    className={`mobile-quick-alert-btn ${isAdminActive ? 'quick-alert-admin-active' : 'quick-alert-admin'}`}
                    onClick={() => navigate('/admin')}
                    title="Open Admin Portal"
                  >
                    <span className="quick-alert-icon">🛡️</span>
                    <span className="quick-alert-text">Admin</span>
                  </button>
                )}
                <button
                  type="button"
                  className={`mobile-quick-alert-btn ${
                    petSafetyStatus === 'LOST'
                      ? 'quick-alert-lost'
                      : petSafetyStatus === 'SAFE'
                      ? 'quick-alert-safe'
                      : 'quick-alert-neutral'
                  }`}
                  onClick={() => handleTabClick('report', '/alert')}
                  title="View Pet Alert Status"
                >
                  <span className="quick-alert-icon">
                    {petSafetyStatus === 'LOST' ? '🚨' : petSafetyStatus === 'SAFE' ? '🏡' : '🐾'}
                  </span>
                  <span className="quick-alert-text">
                    {petSafetyStatus === 'LOST' ? 'Missing Dog!' : petSafetyStatus === 'SAFE' ? 'Safe at Home' : 'Pet Alert'}
                  </span>
                </button>
              </div>

              {/* Desktop Navigation Spaces (Visible on Desktop >= 768px) */}
              <div className="onboarding-nav-spaces desktop-nav-spaces">
                {/* 1. SEPARATE OWNER PROFILE TAB */}
                <div className="nav-tab-wrapper">
                  <button
                    type="button"
                    className={`nav-space-pill owner-space-pill ${isOwnerActive ? 'active' : ''}`}
                    onClick={() => handleTabClick('owner', '/owner')}
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
                    className={`nav-space-pill location-space-pill ${isLocationActive ? 'active' : ''}`}
                    onClick={() => handleTabClick('location', '/location')}
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
                    className={`nav-space-pill pet-space-pill ${isPetActive ? 'active' : ''}`}
                    onClick={() => handleTabClick('dog', '/pet')}
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

                {/* 4. SEPARATE PET SAFETY ALERT TAB */}
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
                    } ${isAlertActive ? 'active' : ''}`}
                    onClick={() => handleTabClick('report', '/alert')}
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

                  {/* Floating Popover on Hover (Desktop) */}
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
                          handleTabClick('report', '/alert');
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
                    className={`nav-space-pill dashboard-space-pill ${isDashboardActive ? 'active' : ''}`}
                    onClick={() => handleTabClick('dashboard', '/dashboard')}
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

                {/* 6. ADMIN PANEL TAB (Rendered when user is Admin) */}
                {isUserAdmin && (
                  <div className="nav-tab-wrapper">
                    <button
                      type="button"
                      className={`nav-space-pill admin-space-pill ${isAdminActive ? 'active' : ''}`}
                      onClick={() => navigate('/admin')}
                      title="Master Admin Portal - Track Members & Pets"
                    >
                      <div className="space-pill-icon admin-icon">
                        <Shield size={16} />
                      </div>
                      <div className="space-pill-content">
                        <span className="space-pill-title">Admin</span>
                        <span className="space-pill-detail">Roster & Sync</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Sign out action */}
              <div className="nav-desktop-actions">
                <button
                  type="button"
                  onClick={logout}
                  className="btn btn-ghost btn-sm logout-nav-btn"
                  title="Sign out of account"
                >
                  <LogOut size={16} />
                  <span className="logout-text">Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="onboarding-nav-status guest-nav-status">
              <Link to="/dashboard" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>📊 Dashboard</span>
              </Link>
              <Link to="/" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>🐾 Sign In</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Modern Native-Feeling Mobile Bottom Navigation Bar (Fixed at bottom for screens < 768px) */}
      {isAuthenticated && (
        <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
          <div className="mobile-bottom-nav-inner">
            {/* 1. DASHBOARD */}
            <button
              type="button"
              className={`mobile-nav-item ${isDashboardActive ? 'active' : ''}`}
              onClick={() => handleTabClick('dashboard', '/dashboard')}
            >
              <div className="mobile-nav-icon-wrap">
                <span className="mobile-nav-icon">📊</span>
              </div>
              <span className="mobile-nav-label">Dashboard</span>
            </button>

            {/* 2. OWNER */}
            <button
              type="button"
              className={`mobile-nav-item ${isOwnerActive ? 'active' : ''}`}
              onClick={() => handleTabClick('owner', '/owner')}
            >
              <div className="mobile-nav-icon-wrap">
                {existingProfile?.photo ? (
                  <img src={existingProfile.photo} alt="Owner" className="mobile-nav-avatar" />
                ) : (
                  <span className="mobile-nav-icon">🧑‍🦱</span>
                )}
                {hasCompletedOwner && <span className="mobile-nav-check-badge">✓</span>}
              </div>
              <span className="mobile-nav-label">Owner</span>
            </button>

            {/* 3. LOCATION */}
            <button
              type="button"
              className={`mobile-nav-item ${isLocationActive ? 'active' : ''}`}
              onClick={() => handleTabClick('location', '/location')}
            >
              <div className="mobile-nav-icon-wrap">
                <span className="mobile-nav-icon">📍</span>
                {hasCompletedLocation && <span className="mobile-nav-check-badge">✓</span>}
              </div>
              <span className="mobile-nav-label">Location</span>
            </button>

            {/* 4. PET PROFILE */}
            <button
              type="button"
              className={`mobile-nav-item ${isPetActive ? 'active' : ''}`}
              onClick={() => handleTabClick('dog', '/pet')}
            >
              <div className="mobile-nav-icon-wrap">
                {existingPet?.primaryPhoto ? (
                  <img src={existingPet.primaryPhoto} alt="Pet" className="mobile-nav-avatar" />
                ) : (
                  <span className="mobile-nav-icon">🐶</span>
                )}
                {hasCompletedDog && <span className="mobile-nav-check-badge">✓</span>}
              </div>
              <span className="mobile-nav-label">Pet</span>
            </button>

            {/* 5. PET ALERT (Highlighted SOS Safety Tab) */}
            <button
              type="button"
              className={`mobile-nav-item mobile-nav-alert-item ${
                petSafetyStatus === 'LOST'
                  ? 'mobile-alert-lost'
                  : petSafetyStatus === 'SAFE'
                  ? 'mobile-alert-safe'
                  : ''
              } ${isAlertActive ? 'active' : ''}`}
              onClick={() => handleTabClick('report', '/alert')}
            >
              <div className="mobile-nav-icon-wrap alert-beacon-wrap">
                <span className="mobile-nav-icon">
                  {petSafetyStatus === 'LOST' ? '🚨' : petSafetyStatus === 'SAFE' ? '🏡' : '🐾'}
                </span>
                {petSafetyStatus === 'LOST' && <span className="mobile-nav-pulse-beacon" />}
              </div>
              <span className="mobile-nav-label">
                {petSafetyStatus === 'LOST' ? 'Missing!' : petSafetyStatus === 'SAFE' ? 'Safe' : 'Alert'}
              </span>
            </button>

            {/* 6. ADMIN (Rendered when user is Admin) */}
            {isUserAdmin && (
              <button
                type="button"
                className={`mobile-nav-item mobile-admin-item ${isAdminActive ? 'active' : ''}`}
                onClick={() => navigate('/admin')}
              >
                <div className="mobile-nav-icon-wrap">
                  <span className="mobile-nav-icon">🛡️</span>
                </div>
                <span className="mobile-nav-label">Admin</span>
              </button>
            )}
          </div>
        </nav>
      )}
    </>
  );
};
