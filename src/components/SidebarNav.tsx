import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  PawPrint,
  Radio,
  MapPin,
  User,
  AlertTriangle,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Check
} from 'lucide-react';
import { useAuth, type OnboardingTab } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import safePuppyImg from '../assets/safe_puppy.jpg';
import missingPuppyImg from '../assets/missing_puppy.jpg';

export const SidebarNav: React.FC = () => {
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

  // Sidebar collapse state (Desktop) - defaults to true so dashboard starts wide and clean
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('findlostpuppy_sidebar_collapsed');
    return saved !== null ? saved === 'true' : true;
  });

  // Hover state for auto-expanding sidebar on hover when collapsed
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Mobile drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const showLabels = !isCollapsed || isHovered;

  useEffect(() => {
    localStorage.setItem('findlostpuppy_sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const existingProfile = user ? storageService.getOwnerProfileByUserId(user.id) : null;
  const existingPet = user ? storageService.getPetProfileByUserId(user.id) : null;
  const existingReport = user ? storageService.getLatestReportByUserId(user.id) : null;

  const previewPhoto =
    existingPet?.primaryPhoto ||
    existingReport?.dog?.primaryPhoto ||
    (petSafetyStatus === 'LOST' ? missingPuppyImg : safePuppyImg);

  const previewDogName = existingPet?.name || existingReport?.dog?.name || 'Your Pup';
  const previewBreed = existingPet?.breed || existingReport?.dog?.breed || 'Companion Pet';
  const previewArea =
    existingReport?.lastKnownLocation ||
    existingProfile?.approximateArea ||
    existingProfile?.city ||
    'Local Area';

  const isUserAdmin = isAdmin || user?.isAdmin || user?.email?.toLowerCase() === 'jksurampudi5@gmail.com';

  const handleTabClick = (tab: OnboardingTab, routePath: string) => {
    setActiveOnboardingTab(tab);
    navigate(routePath);
    setIsMobileMenuOpen(false);
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

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE TOP APP BAR (< 768px) */}
      {/* ========================================================================= */}
      <header className="mobile-top-header" aria-label="Mobile Header">
        <div className="mobile-top-header-inner">
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="mobile-brand-logo"
            onClick={() => {
              if (isAuthenticated) {
                setActiveOnboardingTab('dashboard');
                navigate('/dashboard');
              }
            }}
          >
            <div className="mobile-brand-icon-wrap">
              <PawPrint size={20} className="mobile-brand-paw" />
            </div>
            <span className="mobile-brand-title">FindLostPuppy</span>
          </Link>

          <div className="mobile-top-right-actions">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  className={`mobile-quick-safety-badge ${
                    petSafetyStatus === 'LOST'
                      ? 'badge-lost-pulse'
                      : petSafetyStatus === 'SAFE'
                      ? 'badge-safe-glow'
                      : 'badge-neutral'
                  }`}
                  onClick={() => handleTabClick('report', '/alert')}
                  title="View Pet Alert Status"
                >
                  <span className="safety-badge-emoji">
                    {petSafetyStatus === 'LOST' ? '🚨' : petSafetyStatus === 'SAFE' ? '🏡' : '🐾'}
                  </span>
                  <span className="safety-badge-text">
                    {petSafetyStatus === 'LOST' ? 'Missing!' : petSafetyStatus === 'SAFE' ? 'Safe' : 'Status'}
                  </span>
                </button>

                <button
                  type="button"
                  className="mobile-menu-trigger-btn"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle navigation menu"
                >
                  {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </>
            ) : (
              <div className="mobile-guest-actions">
                <Link to="/dashboard" className="btn btn-outline btn-xs">
                  Dashboard
                </Link>
                <Link to="/" className="btn btn-primary btn-xs">
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE DRAWER OVERLAY & SLIDE-OUT MENU */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`mobile-drawer-panel ${isMobileMenuOpen ? 'drawer-open' : ''}`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="mobile-drawer-header">
          <div className="drawer-brand">
            <PawPrint size={24} className="drawer-paw-icon" />
            <div className="drawer-brand-text">
              <h3 className="drawer-app-name">FindLostPuppy</h3>
              <p className="drawer-app-sub">Community Rescue Hub</p>
            </div>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Pet Quick Card in Drawer */}
        {isAuthenticated && (
          <div
            className={`drawer-pet-card ${petSafetyStatus === 'LOST' ? 'pet-card-lost' : 'pet-card-safe'}`}
            onClick={() => handleTabClick('report', '/alert')}
          >
            <img src={previewPhoto} alt={previewDogName} className="drawer-pet-img" />
            <div className="drawer-pet-info">
              <div className="drawer-pet-name-row">
                <h4 className="drawer-pet-name">{previewDogName}</h4>
                <span className="drawer-status-pill">
                  {petSafetyStatus === 'LOST' ? '🚨 MISSING' : '💚 SAFE'}
                </span>
              </div>
              <p className="drawer-pet-breed">{previewBreed}</p>
              <p className="drawer-pet-location">📍 {previewArea}</p>
            </div>
          </div>
        )}

        <div className="drawer-nav-links">
          {/* 1. Dashboard */}
          <button
            type="button"
            className={`drawer-nav-item ${isDashboardActive ? 'active' : ''}`}
            onClick={() => handleTabClick('dashboard', '/dashboard')}
          >
            <Radio size={18} />
            <span>Dashboard</span>
          </button>

          {/* 2. Owner Profile */}
          <button
            type="button"
            className={`drawer-nav-item ${isOwnerActive ? 'active' : ''}`}
            onClick={() => handleTabClick('owner', '/owner')}
          >
            <User size={18} />
            <span>Owner Profile</span>
            {hasCompletedOwner && <Check size={14} className="text-emerald-500 ml-auto" />}
          </button>

          {/* 3. Location */}
          <button
            type="button"
            className={`drawer-nav-item ${isLocationActive ? 'active' : ''}`}
            onClick={() => handleTabClick('location', '/location')}
          >
            <MapPin size={18} />
            <span>Location</span>
            {hasCompletedLocation && <Check size={14} className="text-emerald-500 ml-auto" />}
          </button>

          {/* 4. Pet Profile */}
          <button
            type="button"
            className={`drawer-nav-item ${isPetActive ? 'active' : ''}`}
            onClick={() => handleTabClick('dog', '/pet')}
          >
            <PawPrint size={18} />
            <span>Pet Profile</span>
            {hasCompletedDog && <Check size={14} className="text-emerald-500 ml-auto" />}
          </button>

          {/* 5. Missing Alert */}
          <button
            type="button"
            className={`drawer-nav-item emergency-item ${isAlertActive ? 'active' : ''}`}
            onClick={() => handleTabClick('report', '/alert')}
          >
            <AlertTriangle size={18} />
            <span>Missing Alert & Status</span>
            {petSafetyStatus === 'LOST' && <span className="drawer-pulse-dot" />}
          </button>

          {/* 6. Admin Portal */}
          {isUserAdmin && (
            <button
              type="button"
              className={`drawer-nav-item admin-item ${isAdminActive ? 'active' : ''}`}
              onClick={() => {
                navigate('/admin');
                setIsMobileMenuOpen(false);
              }}
            >
              <Shield size={18} />
              <span>Admin</span>
            </button>
          )}
        </div>

        {isAuthenticated && (
          <div className="drawer-footer">
            <button type="button" className="btn btn-ghost btn-sm btn-block logout-btn" onClick={logout}>
              <LogOut size={16} />
              <span>Sign Out ({user?.name || user?.email?.split('@')[0]})</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. DESKTOP CONSTANT LEFT SIDEBAR (Fixed / Sticky & Non-Scrolling) */}
      {/* ========================================================================= */}
      <aside
        className={`constant-left-sidebar ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} ${
          isHovered ? 'sidebar-is-hovered' : ''
        }`}
        onMouseEnter={() => isCollapsed && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Main Navigation"
      >
        <div className="constant-sidebar-container">
          {/* Logo Header */}
          <div className="sidebar-logo-header">
            <Link
              to={isAuthenticated ? '/dashboard' : '/'}
              className="sidebar-brand-link"
              onClick={() => {
                if (isAuthenticated) {
                  setActiveOnboardingTab('dashboard');
                  navigate('/dashboard');
                }
              }}
            >
              <div className="sidebar-brand-paw-animated" title="FindLostPuppy">
                <svg viewBox="0 0 64 64" className="paw-logo-svg" fill="none">
                  {/* 4 Toe Pads with subtle bounce */}
                  <ellipse cx="20" cy="18" rx="6" ry="8.5" fill="#E06D44" className="paw-toe-1" />
                  <ellipse cx="32" cy="14" rx="6.5" ry="9" fill="#F59E0B" className="paw-toe-2" />
                  <ellipse cx="44" cy="18" rx="6" ry="8.5" fill="#E06D44" className="paw-toe-3" />
                  <ellipse cx="52" cy="28" rx="5" ry="7" fill="#F59E0B" className="paw-toe-4" />
                  {/* Main Paw Pad */}
                  <path
                    d="M18 42 C18 32, 28 26, 32 26 C36 26, 46 32, 46 42 C46 50, 38 54, 32 54 C26 54, 18 50, 18 42 Z"
                    fill="#B45309"
                    className="paw-pad-main"
                  />
                </svg>
              </div>
              <div className={`sidebar-brand-text ${showLabels ? 'text-visible' : 'text-hidden'}`}>
                <span className="sidebar-brand-title">FindLostPuppy</span>
                <span className="sidebar-brand-sub">Community Rescue</span>
              </div>
            </Link>

            <button
              type="button"
              className={`sidebar-toggle-btn ${showLabels ? 'toggle-visible' : 'toggle-hidden'}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
                if (!isCollapsed) setIsHovered(false);
              }}
              title={isCollapsed ? 'Pin Sidebar Open' : 'Collapse to Icons (Auto-expand on hover)'}
              aria-label={isCollapsed ? 'Pin Sidebar Open' : 'Collapse to Icons'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation Items (Only the 5 core components + Admin) */}
          <nav className="sidebar-items-list" aria-label="Main Navigation">
            {/* 1. DASHBOARD */}
            <button
              type="button"
              className={`sidebar-nav-tab ${isDashboardActive ? 'active' : ''}`}
              onClick={() => handleTabClick('dashboard', '/dashboard')}
              title="Community Recovery Dashboard"
            >
              <div className="nav-tab-icon-circle circle-dashboard">
                <svg viewBox="0 0 48 48" className="nav-animated-svg radar-scanner-svg" fill="none">
                  <circle cx="24" cy="24" r="16" stroke="#22C55E" strokeWidth="2.5" fill="#DCFCE7" />
                  <circle cx="24" cy="24" r="10" stroke="#16A34A" strokeWidth="1.8" strokeDasharray="3 3" />
                  <circle cx="24" cy="24" r="3.5" fill="#15803D" />
                  <line x1="24" y1="24" x2="38" y2="14" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" className="scanner-line" />
                </svg>
              </div>
              <div className={`nav-tab-text-group ${showLabels ? 'text-visible' : 'text-hidden'}`}>
                <span className="nav-tab-title">Dashboard</span>
                <span className="nav-tab-desc">Recovery Network</span>
              </div>
            </button>

            {/* 2. OWNER PROFILE */}
            <button
              type="button"
              className={`sidebar-nav-tab ${isOwnerActive ? 'active' : ''}`}
              onClick={() => handleTabClick('owner', '/owner')}
              title="Owner Profile & Contact"
            >
              <div className="nav-tab-icon-circle circle-owner">
                {existingProfile?.photo ? (
                  <img src={existingProfile.photo} alt="Owner" className="nav-tab-avatar-img" />
                ) : (
                  <svg viewBox="0 0 48 48" className="nav-animated-svg owner-avatar-svg" fill="none">
                    <circle cx="24" cy="24" r="16" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
                    {/* Head */}
                    <circle cx="24" cy="18" r="7" fill="#D97706" />
                    {/* Torso */}
                    <path d="M14 36 C14 28, 34 28, 34 36 Z" fill="#B45309" />
                  </svg>
                )}
              </div>
              <div className={`nav-tab-text-group ${showLabels ? 'text-visible' : 'text-hidden'}`}>
                <span className="nav-tab-title">Owner Profile</span>
                <span className="nav-tab-desc">
                  {existingProfile?.fullName ? existingProfile.fullName : 'Pet Parent Info'}
                </span>
              </div>
              {hasCompletedOwner && (
                <Check size={14} className={`nav-tab-check ${showLabels ? 'text-visible' : 'text-hidden'}`} />
              )}
            </button>

            {/* 3. LOCATION */}
            <button
              type="button"
              className={`sidebar-nav-tab ${isLocationActive ? 'active' : ''}`}
              onClick={() => handleTabClick('location', '/location')}
              title="Home Location & Safe Zone"
            >
              <div className="nav-tab-icon-circle circle-location">
                <svg viewBox="0 0 48 48" className="nav-animated-svg location-pin-svg" fill="none">
                  <circle cx="24" cy="24" r="16" fill="#EDF5F1" stroke="#2D6A4F" strokeWidth="2" />
                  {/* Pin */}
                  <path
                    d="M24 12 C19 12, 16 16, 16 21 C16 27, 24 36, 24 36 C24 36, 32 27, 32 21 C32 16, 29 12, 24 12 Z"
                    fill="#2D6A4F"
                    className="animated-map-pin"
                  />
                  <circle cx="24" cy="21" r="3.5" fill="#FFFFFF" />
                </svg>
              </div>
              <div className={`nav-tab-text-group ${showLabels ? 'text-visible' : 'text-hidden'}`}>
                <span className="nav-tab-title">Location</span>
                <span className="nav-tab-desc">
                  {existingProfile?.city || existingProfile?.district || 'Safe Zone Area'}
                </span>
              </div>
              {hasCompletedLocation && (
                <Check size={14} className={`nav-tab-check ${showLabels ? 'text-visible' : 'text-hidden'}`} />
              )}
            </button>

            {/* 4. PET PROFILE */}
            <button
              type="button"
              className={`sidebar-nav-tab ${isPetActive ? 'active' : ''}`}
              onClick={() => handleTabClick('dog', '/pet')}
              title="Dog Profile"
            >
              <div className="nav-tab-icon-circle circle-pet">
                {existingPet?.primaryPhoto ? (
                  <img src={existingPet.primaryPhoto} alt={existingPet.name} className="nav-tab-avatar-img" />
                ) : (
                  <svg viewBox="0 0 48 48" className="nav-animated-svg dog-collar-svg" fill="none">
                    <circle cx="24" cy="24" r="16" fill="#FFF7ED" stroke="#E06D44" strokeWidth="2" />
                    {/* Dog Face */}
                    <ellipse cx="24" cy="23" rx="10" ry="8" fill="#FBBF24" />
                    {/* Ears */}
                    <ellipse cx="15" cy="18" rx="3.5" ry="6" fill="#D97706" className="anim-left-ear" />
                    <ellipse cx="33" cy="18" rx="3.5" ry="6" fill="#D97706" className="anim-right-ear" />
                    {/* Snout & Eyes */}
                    <circle cx="20" cy="21" r="1.5" fill="#1F2937" />
                    <circle cx="28" cy="21" r="1.5" fill="#1F2937" />
                    <ellipse cx="24" cy="26" rx="3" ry="2" fill="#1F2937" />
                  </svg>
                )}
              </div>
              <div className={`nav-tab-text-group ${showLabels ? 'text-visible' : 'text-hidden'}`}>
                <span className="nav-tab-title">Pet Profile</span>
                <span className="nav-tab-desc">
                  {existingPet?.name ? existingPet.name : 'Add Dog Info'}
                </span>
              </div>
              {hasCompletedDog && (
                <Check size={14} className={`nav-tab-check ${showLabels ? 'text-visible' : 'text-hidden'}`} />
              )}
            </button>

            {/* 5. MISSING ALERT / PET SAFETY */}
            <button
              type="button"
              id="sidebar-missing-alert-tab"
              className={`sidebar-nav-tab emergency-nav-tab ${
                petSafetyStatus === 'LOST' ? 'status-lost' : petSafetyStatus === 'SAFE' ? 'status-safe' : ''
              } ${isAlertActive ? 'active' : ''}`}
              onClick={() => handleTabClick('report', '/alert')}
              title="Missing Dog Alert & Safety Status"
            >
              <div
                className={`nav-tab-icon-circle circle-alert ${
                  petSafetyStatus === 'LOST' ? 'pulse-beacon-red' : petSafetyStatus === 'SAFE' ? 'safe-glow-green' : ''
                }`}
              >
                {petSafetyStatus === 'LOST' ? (
                  <svg viewBox="0 0 48 48" className="nav-animated-svg siren-beacon-svg" fill="none">
                    <circle cx="24" cy="24" r="16" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
                    <path d="M16 28 C16 18, 32 18, 32 28 Z" fill="#DC2626" className="anim-siren-dome" />
                    <rect x="14" y="28" width="20" height="5" rx="2" fill="#374151" />
                    <line x1="24" y1="14" x2="24" y2="8" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="14" y1="16" x2="10" y2="12" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
                    <line x1="34" y1="16" x2="38" y2="12" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 48 48" className="nav-animated-svg home-safe-svg" fill="none">
                    <circle cx="24" cy="24" r="16" fill="#DCFCE7" stroke="#16A34A" strokeWidth="2" />
                    {/* Cozy Home */}
                    <path d="M15 24 L24 16 L33 24 L33 32 L15 32 Z" fill="#16A34A" />
                    <rect x="21" y="25" width="6" height="7" fill="#DCFCE7" />
                  </svg>
                )}
              </div>
              <div className={`nav-tab-text-group ${showLabels ? 'text-visible' : 'text-hidden'}`}>
                <span className="nav-tab-title">
                  {petSafetyStatus === 'LOST' ? 'Missing Alert' : 'Pet Safety'}
                </span>
                <span className="nav-tab-desc">
                  {petSafetyStatus === 'LOST' ? '🚨 Missing SOS Active' : petSafetyStatus === 'SAFE' ? '🏡 Safe at Home 💚' : 'Set Safety Status'}
                </span>
              </div>
            </button>

            {/* 6. ADMIN (Rendered if user is Admin) */}
            {isUserAdmin && (
              <button
                type="button"
                className={`sidebar-nav-tab admin-nav-tab ${isAdminActive ? 'active' : ''}`}
                onClick={() => navigate('/admin')}
                title="Master Admin Portal"
              >
                <div className="nav-tab-icon-circle circle-admin">
                  <Shield size={20} className="text-amber-700" />
                </div>
                <div className={`nav-tab-text-group ${showLabels ? 'text-visible' : 'text-hidden'}`}>
                  <span className="nav-tab-title">Admin Portal</span>
                  <span className="nav-tab-desc">Database & Sync</span>
                </div>
              </button>
            )}
          </nav>

          {/* Bottom Profile / Sign Out Card */}
          {isAuthenticated && (
            <div className="sidebar-footer-profile">
              <div className="footer-user-row">
                {existingProfile?.photo ? (
                  <img src={existingProfile.photo} alt="User" className="footer-avatar-img" />
                ) : (
                  <div className="footer-avatar-initials">
                    {user?.name?.charAt(0).toUpperCase() || '🐾'}
                  </div>
                )}
                <div className={`footer-user-meta ${showLabels ? 'text-visible' : 'text-hidden'}`}>
                  <span className="footer-user-name">
                    {user?.name || user?.email?.split('@')[0] || 'Pet Parent'}
                  </span>
                  <span className="footer-user-email">{user?.email}</span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className={`footer-logout-btn ${showLabels ? 'toggle-visible' : 'toggle-hidden'}`}
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 4. MOBILE BOTTOM DOCK (5 Core Components on Mobile < 768px) */}
      {/* ========================================================================= */}
      {isAuthenticated && (
        <nav className="mobile-dog-dock-nav" aria-label="Mobile Navigation">
          <div className="mobile-dock-inner">
            {/* 1. Dashboard */}
            <button
              type="button"
              className={`dock-tab-btn ${isDashboardActive ? 'active' : ''}`}
              onClick={() => handleTabClick('dashboard', '/dashboard')}
            >
              <div className="dock-icon-wrap">
                <Radio size={19} />
              </div>
              <span className="dock-label">Dashboard</span>
            </button>

            {/* 2. Owner */}
            <button
              type="button"
              className={`dock-tab-btn ${isOwnerActive ? 'active' : ''}`}
              onClick={() => handleTabClick('owner', '/owner')}
            >
              <div className="dock-icon-wrap">
                <User size={19} />
              </div>
              <span className="dock-label">Owner</span>
            </button>

            {/* 3. Center SOS Alert */}
            <button
              type="button"
              className={`dock-center-sos-btn ${
                petSafetyStatus === 'LOST' ? 'dock-sos-lost' : petSafetyStatus === 'SAFE' ? 'dock-sos-safe' : ''
              } ${isAlertActive ? 'active' : ''}`}
              onClick={() => handleTabClick('report', '/alert')}
              title="Pet Safety Alert"
            >
              <div className="center-sos-icon-glow">
                <span className="sos-badge-icon">
                  {petSafetyStatus === 'LOST' ? '🚨' : petSafetyStatus === 'SAFE' ? '🏡' : '🐾'}
                </span>
              </div>
              <span className="dock-label sos-label">
                {petSafetyStatus === 'LOST' ? 'Missing!' : 'Alert'}
              </span>
            </button>

            {/* 4. Location */}
            <button
              type="button"
              className={`dock-tab-btn ${isLocationActive ? 'active' : ''}`}
              onClick={() => handleTabClick('location', '/location')}
            >
              <div className="dock-icon-wrap">
                <MapPin size={19} />
              </div>
              <span className="dock-label">Location</span>
            </button>

            {/* 5. Pet Profile */}
            <button
              type="button"
              className={`dock-tab-btn ${isPetActive ? 'active' : ''}`}
              onClick={() => handleTabClick('dog', '/pet')}
            >
              <div className="dock-icon-wrap">
                {existingPet?.primaryPhoto ? (
                  <img src={existingPet.primaryPhoto} alt="Pet" className="dock-pet-mini-avatar" />
                ) : (
                  <PawPrint size={19} />
                )}
              </div>
              <span className="dock-label">Pet</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
};
