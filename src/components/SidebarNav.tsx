import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  PawPrint,
  Radio,
  MapPin,
  User,
  AlertTriangle,
  Shield,
  LogOut,
  Menu,
  X,
  Check,
  Lightbulb,
  ShieldCheck,
  Camera,
} from 'lucide-react';
import { useAuth, type OnboardingTab } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import safePuppyImg from '../assets/safe_puppy.jpg';
import missingPuppyImg from '../assets/missing_puppy.jpg';
import appLogoImg from '../assets/app_logo.png';

interface NavigationItem {
  id: string;
  title: string;
  subtitle: string;
  isActive: boolean;
  isCompleted?: boolean;
  isEmergency?: boolean;
  circleClass: string;
  icon: React.ReactNode;
  drawerIcon: React.ReactNode;
  onClick: () => void;
}

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
    refreshProgress,
    logout,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // 1. Hover State (Desktop mouse enter/leave)
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const isExpanded = isHovered;

  // 2. Mobile Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Force re-render when reports change in localStorage so effectiveStatus updates immediately
  const [, setForceUpdate] = useState(0);
  useEffect(() => {
    const handleUpdate = () => {
      setForceUpdate(n => n + 1);
      refreshProgress();
    };
    window.addEventListener('findlostpuppy_reports_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('findlostpuppy_reports_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshProgress]);

  const existingProfile = user ? storageService.getOwnerProfileByUserId(user.id, user.email) : null;
  const existingPet = user ? storageService.getPetProfileByUserId(user.id, user.email) : null;
  const existingReport = user ? storageService.getLatestReportByUserId(user.id, user.email) : null;

  // ACID compliance: derive effective status
  const effectiveStatus: 'LOST' | 'SAFE' | 'UNDECIDED' = (() => {
    if (petSafetyStatus === 'LOST' || existingReport?.status === 'LOST') return 'LOST';
    if (petSafetyStatus === 'SAFE' || existingReport?.status === 'SAFE' || (existingReport?.status as any) === 'REUNITED') return 'SAFE';
    if (user && storageService.isPetSafe(user.id, user.email)) return 'SAFE';
    return 'UNDECIDED';
  })();

  const isLost = effectiveStatus === 'LOST';
  const isSafe = effectiveStatus === 'SAFE';

  const previewPhoto =
    existingPet?.primaryPhoto ||
    existingReport?.dog?.primaryPhoto ||
    (isLost ? missingPuppyImg : safePuppyImg);

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
    location.pathname === '/next-step' ||
    location.pathname === '/pet' ||
    location.pathname === '/dog' ||
    location.pathname === '/dog-profile' ||
    (location.pathname === '/' && (activeOnboardingTab === 'choice' || activeOnboardingTab === 'dog' || activeOnboardingTab === 'pet'));

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
  const isCaptureActive = location.pathname === '/capture';

  // =========================================================================
  // SINGLE SOURCE OF TRUTH: NAVIGATION ITEMS CONFIGURATION
  // Used identically in both Desktop Sidebar and Mobile Drawer
  // =========================================================================
  const navigationItems: NavigationItem[] = useMemo(() => [
    // 1. Dashboard
    {
      id: 'dashboard',
      title: 'Dashboard',
      subtitle: 'Recovery Network',
      isActive: isDashboardActive,
      circleClass: 'circle-dashboard',
      icon: (
        <svg viewBox="0 0 48 48" className="nav-animated-svg radar-scanner-svg" fill="none">
          <circle cx="24" cy="24" r="16" stroke="#22C55E" strokeWidth="2.5" fill="#DCFCE7" />
          <circle cx="24" cy="24" r="10" stroke="#16A34A" strokeWidth="1.8" strokeDasharray="3 3" />
          <circle cx="24" cy="24" r="3.5" fill="#15803D" />
          <line x1="24" y1="24" x2="38" y2="14" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" className="scanner-line" />
        </svg>
      ),
      drawerIcon: <Radio size={18} />,
      onClick: () => handleTabClick('dashboard', '/dashboard'),
    },
    // 2. Owner Profile
    {
      id: 'owner',
      title: 'Owner Profile',
      subtitle: existingProfile?.fullName ? existingProfile.fullName : 'Pet Parent Info',
      isActive: isOwnerActive,
      isCompleted: hasCompletedOwner,
      circleClass: 'circle-owner',
      icon: (existingProfile?.photo || user?.avatar) ? (
        <img src={existingProfile?.photo || user?.avatar} alt="Owner" className="nav-tab-avatar-img" />
      ) : (
        <svg viewBox="0 0 48 48" className="nav-animated-svg owner-avatar-svg" fill="none">
          <circle cx="24" cy="24" r="16" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="24" cy="18" r="7" fill="#D97706" />
          <path d="M14 36 C14 28, 34 28, 34 36 Z" fill="#B45309" />
        </svg>
      ),
      drawerIcon: <User size={18} />,
      onClick: () => handleTabClick('owner', '/owner'),
    },
    // 3. Location
    {
      id: 'location',
      title: 'Location',
      subtitle: existingProfile?.city || existingProfile?.district || 'Safe Zone Area',
      isActive: isLocationActive,
      isCompleted: hasCompletedLocation,
      circleClass: 'circle-location',
      icon: (
        <svg viewBox="0 0 48 48" className="nav-animated-svg location-pin-svg" fill="none">
          <circle cx="24" cy="24" r="16" fill="#EDF5F1" stroke="#2D6A4F" strokeWidth="2" />
          <path
            d="M24 12 C19 12, 16 16, 16 21 C16 27, 24 36, 24 36 C24 36, 32 27, 32 21 C32 16, 29 12, 24 12 Z"
            fill="#2D6A4F"
            className="animated-map-pin"
          />
          <circle cx="24" cy="21" r="3.5" fill="#FFFFFF" />
        </svg>
      ),
      drawerIcon: <MapPin size={18} />,
      onClick: () => handleTabClick('location', '/location'),
    },
    // 4. Next Step Options
    {
      id: 'pet',
      title: 'Next Step',
      subtitle: 'Add Pet / Sighting / Skip',
      isActive: isPetActive,
      isCompleted: hasCompletedDog,
      circleClass: 'circle-pet',
      icon: existingPet?.primaryPhoto ? (
        <img src={existingPet.primaryPhoto} alt={existingPet.name} className="nav-tab-avatar-img" />
      ) : (
        <svg viewBox="0 0 48 48" className="nav-animated-svg dog-collar-svg" fill="none">
          <circle cx="24" cy="24" r="16" fill="#FFF7ED" stroke="#E06D44" strokeWidth="2" />
          <ellipse cx="24" cy="23" rx="10" ry="8" fill="#FBBF24" />
          <ellipse cx="15" cy="18" rx="3.5" ry="6" fill="#D97706" className="anim-left-ear" />
          <ellipse cx="33" cy="18" rx="3.5" ry="6" fill="#D97706" className="anim-right-ear" />
          <circle cx="20" cy="21" r="1.5" fill="#1F2937" />
          <circle cx="28" cy="21" r="1.5" fill="#1F2937" />
          <ellipse cx="24" cy="26" rx="3" ry="2" fill="#1F2937" />
        </svg>
      ),
      drawerIcon: <PawPrint size={18} />,
      onClick: () => handleTabClick('choice', '/next-step'),
    },
    // 5. Pet Safety / Missing Alert
    {
      id: 'alert',
      title: isLost ? '🔴 PET IS MISSING' : isSafe ? 'Pet Safety' : 'Pet Safety',
      subtitle: isLost
        ? `🚨 Searching for ${previewDogName}...`
        : isSafe
        ? '🏡 Safe at Home 💚'
        : 'Safe at Home',
      isActive: isAlertActive,
      isEmergency: true,
      circleClass: `circle-alert ${isLost ? 'pulse-beacon-red' : isSafe ? 'safe-glow-green' : ''}`,
      icon: isLost ? (
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
          <path d="M15 24 L24 16 L33 24 L33 32 L15 32 Z" fill="#16A34A" />
          <rect x="21" y="25" width="6" height="7" fill="#DCFCE7" />
        </svg>
      ),
      drawerIcon: <AlertTriangle size={18} />,
      onClick: () => handleTabClick('report', '/alert'),
    },
    // 6. Capture Pet
    {
      id: 'capture',
      title: 'Capture Pet',
      subtitle: 'Private Sighting',
      isActive: isCaptureActive,
      circleClass: 'circle-suggestion',
      icon: <Camera size={20} className="text-amber-500" />,
      drawerIcon: <Camera size={18} className="text-amber-500" />,
      onClick: () => {
        navigate('/capture');
        setIsMobileMenuOpen(false);
      },
    },
    // 7. Admin Portal (rendered if user is Admin)
    ...(isUserAdmin ? [{
      id: 'admin',
      title: 'Admin Portal',
      subtitle: 'Database & Sync',
      isActive: isAdminActive,
      circleClass: 'circle-admin',
      icon: <Shield size={20} className="text-amber-700" />,
      drawerIcon: <Shield size={18} />,
      onClick: () => {
        navigate('/admin');
        setIsMobileMenuOpen(false);
      },
    }] : []),
    // 8. Suggest Idea
    {
      id: 'suggest',
      title: 'Suggest Idea',
      subtitle: 'Help us improve',
      isActive: false,
      circleClass: 'circle-suggestion',
      icon: <Lightbulb size={20} className="text-amber-500" />,
      drawerIcon: <Lightbulb size={18} className="text-amber-500" />,
      onClick: () => {
        setIsMobileMenuOpen(false);
        window.dispatchEvent(new CustomEvent('open-suggestion-modal'));
      },
    },
  ], [
    isDashboardActive,
    isOwnerActive,
    isLocationActive,
    isPetActive,
    isAlertActive,
    isAdminActive,
    isCaptureActive,
    hasCompletedOwner,
    hasCompletedLocation,
    hasCompletedDog,
    existingProfile,
    existingPet,
    isUserAdmin,
    isLost,
    isSafe,
    previewDogName,
    user,
    navigate,
    setActiveOnboardingTab,
  ]);

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE TOP APP BAR (< 768px) */}
      {/* ========================================================================= */}
      <header className="mobile-top-header" aria-label="Mobile Header">
        <div className={`mobile-top-header-inner ${!isAuthenticated ? 'mobile-top-header-inner-guest' : ''}`}>
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
              <img
                src={appLogoImg}
                alt="FindLostPuppy"
                className="mobile-brand-logo-img"
              />
            </div>
            <span className="mobile-brand-title">FindLostPuppy</span>
          </Link>

          {isAuthenticated ? (
            <div className="mobile-top-right-actions">
              <>
                <button
                  type="button"
                  className={`mobile-quick-safety-badge ${
                    isLost ? 'badge-lost-pulse' : isSafe ? 'badge-safe-glow' : 'badge-neutral'
                  }`}
                  onClick={() => handleTabClick('report', '/alert')}
                  title="View Pet Alert Status"
                >
                  <span className="safety-badge-emoji">
                    {isLost ? (
                      <AlertTriangle size={13} className="text-red-600" />
                    ) : isSafe ? (
                      <ShieldCheck size={13} className="text-emerald-600" />
                    ) : (
                      <PawPrint size={13} />
                    )}
                  </span>
                  <span className="safety-badge-text">
                    {isLost ? 'MISSING!' : isSafe ? 'Safe' : 'Status'}
                  </span>
                </button>

                <button
                  type="button"
                  className="mobile-header-logout-btn"
                  onClick={logout}
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut size={19} />
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
            </div>
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
            <img
              src={appLogoImg}
              alt="FindLostPuppy"
              className="drawer-app-logo-img"
            />
            <div className="drawer-brand-text">
              <h3 className="drawer-app-name">FindLostPuppy</h3>
              <p className="drawer-app-sub">Community Rescue Hub</p>
            </div>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close navigation drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Pet Quick Card in Drawer */}
        {isAuthenticated && (
          <div
            className={`drawer-pet-card ${isLost ? 'pet-card-lost' : 'pet-card-safe'}`}
            onClick={() => handleTabClick('report', '/alert')}
          >
            <img src={previewPhoto} alt={previewDogName} className="drawer-pet-img" />
            <div className="drawer-pet-info">
              <div className="drawer-pet-name-row">
                <h4 className="drawer-pet-name">{previewDogName}</h4>
                <span className="drawer-status-pill">
                  {isLost ? 'MISSING' : 'SAFE'}
                </span>
              </div>
              <p className="drawer-pet-breed">{previewBreed}</p>
              <p className="drawer-pet-location">
                <MapPin size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                {previewArea}
              </p>
            </div>
          </div>
        )}

        {/* Shared navigation array rendering in mobile drawer */}
        <div className="drawer-nav-links">
          {navigationItems.map(item => (
            <button
              key={item.id}
              type="button"
              className={`drawer-nav-item ${item.isActive ? 'active' : ''} ${
                item.isEmergency && isLost ? 'drawer-lost-item' : ''
              }`}
              onClick={() => {
                item.onClick();
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="drawer-nav-icon-slot">
                {item.drawerIcon}
              </div>
              <span>{item.title}</span>
              {item.isCompleted && <Check size={14} className="text-emerald-500 ml-auto" />}
              {item.isEmergency && isLost && <span className="drawer-pulse-dot ml-auto" />}
            </button>
          ))}
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
      {/* 3. DESKTOP CONSTANT LEFT SIDEBAR (Anchored Vertical Axis & Precision Right Expand) */}
      {/* ========================================================================= */}
      <aside
        className={`constant-left-sidebar ${isExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Main Navigation"
      >
        <div className="constant-sidebar-container">
          {/* Logo Header: 100% same slot geometry as nav items */}
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
              title="FindLostPuppy"
            >
              <div className="nav-icon-slot logo-slot" title="FindLostPuppy">
                <img
                  src={appLogoImg}
                  alt="FindLostPuppy"
                  className="sidebar-brand-logo-img"
                />
              </div>
              <div className={`sidebar-brand-text ${isExpanded ? 'text-visible' : 'text-hidden'}`}>
                <span className="sidebar-brand-title">FindLostPuppy</span>
                <span className="sidebar-brand-sub">Community Rescue</span>
              </div>
            </Link>
          </div>

          {/* Navigation Items List: Single source of truth */}
          <nav className="sidebar-items-list" aria-label="Main Navigation">
            {navigationItems.map(item => (
              <button
                key={item.id}
                type="button"
                id={`sidebar-${item.id}-tab`}
                className={`sidebar-nav-tab ${item.id}-tab ${item.isActive ? 'active' : ''} ${
                  item.isEmergency ? (isLost ? 'status-lost' : isSafe ? 'status-safe' : '') : ''
                }`}
                onClick={item.onClick}
                title={`${item.title} — ${item.subtitle}`}
              >
                {/* Fixed, invariant 44px icon slot */}
                <div className="nav-icon-slot">
                  <div className={`nav-tab-icon-circle ${item.circleClass}`}>
                    {item.icon}
                  </div>
                </div>
                {/* Labels reveal only to the right */}
                <div className={`nav-tab-text-group ${isExpanded ? 'text-visible' : 'text-hidden'}`}>
                  <span
                    className="nav-tab-title"
                    style={item.isEmergency && isLost ? { color: '#DC2626', fontWeight: 800 } : {}}
                  >
                    {item.title}
                  </span>
                  <span
                    className="nav-tab-desc"
                    style={item.isEmergency && isLost ? { color: '#EF4444' } : {}}
                  >
                    {item.subtitle}
                  </span>
                </div>
                {item.isCompleted && (
                  <Check size={14} className={`nav-tab-check ${isExpanded ? 'text-visible' : 'text-hidden'}`} />
                )}
                {item.isEmergency && isLost && isExpanded && (
                  <span className="sidebar-lost-beacon-dot" />
                )}
              </button>
            ))}
          </nav>

          {/* Bottom Profile / Sign Out Card */}
          {isAuthenticated && (
            <div className="sidebar-footer-profile">
              <div className="footer-user-row">
                <div className="nav-icon-slot footer-slot">
                  {existingProfile?.photo || user?.avatar ? (
                    <img src={existingProfile?.photo || user?.avatar} alt="User" className="footer-avatar-img" />
                  ) : (
                    <div className="footer-avatar-initials">
                      {user?.name?.charAt(0).toUpperCase() || '🐾'}
                    </div>
                  )}
                </div>
                <div className={`footer-user-meta ${isExpanded ? 'text-visible' : 'text-hidden'}`}>
                  <span className="footer-user-name">
                    {existingProfile?.fullName || user?.name || user?.email?.split('@')[0] || 'Pet Parent'}
                  </span>
                  <span className="footer-user-email">{user?.email}</span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className={`footer-logout-btn ${isExpanded ? 'toggle-visible' : 'toggle-hidden'}`}
                  title="Sign Out"
                  aria-label="Sign Out"
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
                isLost ? 'dock-sos-lost' : isSafe ? 'dock-sos-safe' : ''
              } ${isAlertActive ? 'active' : ''}`}
              onClick={() => handleTabClick('report', '/alert')}
              title="Pet Safety Alert"
            >
              <div className="center-sos-icon-glow">
                <span className="sos-badge-icon">
                  {isLost ? '🚨' : isSafe ? '🏡' : '🐾'}
                </span>
              </div>
              <span className="dock-label sos-label" style={isLost ? { color: '#DC2626', fontWeight: 800 } : {}}>
                {isLost ? '⚠ Missing!' : 'Alert'}
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

            {/* 5. Next Step */}
            <button
              type="button"
              className={`dock-tab-btn ${isPetActive ? 'active' : ''}`}
              onClick={() => handleTabClick('choice', '/next-step')}
            >
              <div className="dock-icon-wrap">
                {existingPet?.primaryPhoto ? (
                  <img src={existingPet.primaryPhoto} alt="Pet" className="dock-pet-mini-avatar" />
                ) : (
                  <PawPrint size={19} />
                )}
              </div>
              <span className="dock-label">Next</span>
            </button>

            {/* 6. Logout */}
            <button
              type="button"
              className="dock-tab-btn dock-logout-btn"
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <div className="dock-icon-wrap">
                <LogOut size={19} />
              </div>
              <span className="dock-label">Logout</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
};
