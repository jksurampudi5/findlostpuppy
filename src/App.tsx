import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SidebarNav } from './components/SidebarNav';
import { Footer } from './components/Footer';
import { useEffect, useState } from 'react';
import { storageService } from './services/storageService';
import { consentService } from './services/consentService';
import { checkGeoAccess, type GeoCheckResult } from './services/geoBlockService';
import { GeoBlockPage } from './components/GeoBlockPage';

import { ConsentPage } from './pages/ConsentPage';

// Guided Sequential Flow & Dedicated Tab Pages
import { EmailAuthPage } from './pages/EmailAuthPage';
import { OwnerProfile } from './pages/OwnerProfile';
import { Location } from './pages/Location';
import { PetDetails } from './pages/PetDetails';
import { PetSafety } from './pages/PetSafety';
import { GuestSightingPage } from './pages/GuestSightingPage';
import { RegisteredPet } from './pages/RegisteredPet';
import { AnimationShowcaseStudio } from './components/ui/AnimationShowcaseStudio';

// Unlocked Experience Pages
import { DiscoveryPage } from './pages/DiscoveryPage';
import { DogDetailPage } from './pages/DogDetailPage';
import { PetStatus } from './pages/PetStatus';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CapturePetPage } from './pages/CapturePetPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { ShortcutsPage } from './pages/ShortcutsPage';

import { LaunchTributeOverlay } from './components/LaunchTributeOverlay';
import { SuggestionWidget } from './components/SuggestionWidget';
import { NetworkResilience } from './components/NetworkResilience';
import { ServerFailureNotice } from './components/fallbacks/ServerFailureNotice';
import { LoadingFallback } from './components/fallbacks/LoadingFallback';
import { PageTransition } from './components/ui/PageTransition';

/** Throws when the development-only forceErrorBoundary query flag is present; otherwise renders nothing. */
function DevelopmentErrorProbe() {
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('forceErrorBoundary')) {
    throw new Error('Intentional development-only error boundary check');
  }
  return null;
}

import './App.css';

/** Renders application routes according to session loading, authentication, consent, and onboarding state. */
function MainAppFlow() {
  const {
    user,
    isAuthenticated,
    isLoading,
    hasCompletedOwner,
    setActiveOnboardingTab,
    hasValidConsent,
    isFirstTimeUser,
    agreeToConsent,
  } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingFallback message="Checking your saved session…" />;
  }

  // A user needs consent IF AND ONLY IF:
  // 1. Authenticated
  // 2. Genuinely a first-time user
  // 3. Has not yet consented in context state
  // 4. Has no affirmative consent record in localStorage for their account/device
  // Returning users, users with profiles/pets, and unauthenticated users NEVER need consent.
  const needsConsent =
    isAuthenticated &&
    isFirstTimeUser &&
    !hasValidConsent &&
    !consentService.hasAcceptedCurrentConsent(user?.id);

  return (
    <Routes>
      {/* 0. INTERACTIVE DEMO ROUTE */}
      <Route
        path="/demo"
        element={<AnimationShowcaseStudio />}
      />

      {/* 1. PUBLIC EMERGENCY & DIRECT DETAIL ROUTES (Instant 0-roadblock access anywhere) */}
      <Route path="/report-sighting/:id" element={<GuestSightingPage />} />
      <Route path="/found/:id" element={<GuestSightingPage />} />
      <Route path="/alert/:id" element={<GuestSightingPage />} />
      <Route path="/dog/:id" element={<DogDetailPage />} />
      <Route path="/find" element={<DiscoveryPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

      {/* 2. COMMUNITY RECOVERY DASHBOARD & ADMIN PORTAL */}
      <Route
        path="/homepage"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : !hasCompletedOwner ? (
            <Navigate to="/owner" replace />
          ) : (
            <PetStatus />
          )
        }
      />
      <Route path="/dashboard" element={<Navigate to="/homepage" replace />} />
      <Route path="/feedback" element={<PetStatus />} />
      <Route path="/suggest" element={<PetStatus />} />
      <Route path="/next-step" element={<Navigate to="/homepage" replace />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/shortcuts" element={<ShortcutsPage />} />
      <Route path="/admin/shortcuts" element={<ShortcutsPage />} />
      <Route
        path="/capture"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : needsConsent ? (
            <Navigate to="/consent" replace />
          ) : !hasCompletedOwner ? (
            <Navigate to="/owner" replace />
          ) : (
            <CapturePetPage />
          )
        }
      />

      {/* 3. DEDICATED DIRECT ROUTES FOR ALL TABS (Fast, lag-free navigation) */}
      <Route
        path="/owner"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : needsConsent ? (
            <Navigate to="/consent" replace />
          ) : (
            <OwnerProfile
              onSuccess={() => {
                setActiveOnboardingTab('location');
                navigate('/location');
              }}
            />
          )
        }
      />
      <Route path="/edit-parent" element={<Navigate to="/owner" replace />} />
      <Route path="/profile" element={<Navigate to="/owner" replace />} />

      <Route
        path="/location"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : needsConsent ? (
            <Navigate to="/consent" replace />
          ) : !hasCompletedOwner ? (
            <Navigate to="/owner" replace />
          ) : (
            <Location
              onSuccess={() => {
                setActiveOnboardingTab('choice');
                navigate('/choice');
              }}
              onBack={() => {
                setActiveOnboardingTab('owner');
                navigate('/owner');
              }}
            />
          )
        }
      />
      <Route path="/edit-location" element={<Navigate to="/location" replace />} />

      <Route
        path="/choice"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : needsConsent ? (
            <Navigate to="/consent" replace />
          ) : !hasCompletedOwner ? (
            <Navigate to="/owner" replace />
          ) : (
            <RegisteredPet />
          )
        }
      />
      <Route path="/pet-choice" element={<Navigate to="/choice" replace />} />

      <Route
        path="/pet"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : needsConsent ? (
            <Navigate to="/consent" replace />
          ) : !hasCompletedOwner ? (
            <Navigate to="/owner" replace />
          ) : (
            <PetDetails
              onBackToLocation={() => {
                setActiveOnboardingTab('choice');
                navigate('/choice');
              }}
              onSuccess={() => {
                setActiveOnboardingTab('report');
                navigate('/alert');
              }}
            />
          )
        }
      />
      <Route path="/dog" element={<Navigate to="/pet" replace />} />
      <Route path="/dog-profile" element={<Navigate to="/pet" replace />} />
      <Route path="/report-another" element={<Navigate to="/pet" replace />} />

      <Route
        path="/alert"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : needsConsent ? (
            <Navigate to="/consent" replace />
          ) : !hasCompletedOwner ? (
            <Navigate to="/owner" replace />
          ) : (
            <PetSafety
              onBackToPet={() => {
                setActiveOnboardingTab('dog');
                navigate('/pet');
              }}
              onSuccess={() => {
                setActiveOnboardingTab('dashboard');
                navigate('/homepage');
              }}
            />
          )
        }
      />
      <Route path="/report" element={<Navigate to="/alert" replace />} />
      <Route path="/report-lost" element={<Navigate to="/alert" replace />} />

      <Route
        path="/consent"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : !needsConsent ? (
            <Navigate to="/owner" replace />
          ) : (
            <ConsentPage
              onConsentAgreed={(forms, method) => {
                agreeToConsent(forms, method);
                navigate('/owner', { replace: true });
              }}
            />
          )
        }
      />
      <Route path="/login" element={<EmailAuthPage />} />

      {/* 4. ROOT ROUTE (Smart dynamic resolution based on onboarding progress) */}
      <Route
        path="/"
        element={
          !isAuthenticated ? (
            <EmailAuthPage />
          ) : needsConsent ? (
            <Navigate to="/consent" replace />
          ) : (
            <Navigate to="/owner" replace />
          )
        }
      />

      {/* 5. CATCH-ALL FALLBACK */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/owner" : "/login"} replace />} />
    </Routes>
  );
}

/** Composes routing, session providers, recovery notices, and the app shell, and starts cloud synchronization. */
export function App() {
  const basename = import.meta.env.BASE_URL;

  // ── India-only geo-block ────────────────────────────────────────────────
  // 'checking' → waiting for IP lookup | 'allowed' → IN or indeterminate | 'blocked' → non-IN
  const [geoStatus, setGeoStatus] = useState<'checking' | 'allowed' | 'blocked'>('checking');
  const [geoInfo, setGeoInfo] = useState<GeoCheckResult | null>(null);

  useEffect(() => {
    checkGeoAccess().then((result) => {
      setGeoInfo(result);
      setGeoStatus(result.allowed ? 'allowed' : 'blocked');
    });
  }, []);

  // Single source of truth: Pull authentic Firebase cloud records on application boot, then backfill any existing offline photos to Cloudinary
  useEffect(() => {
    if (geoStatus !== 'allowed') return; // skip cloud sync until geo passes
    storageService
      .pullFromFirebase()
      .then(() => storageService.backfillExistingPhotosToCloudinary())
      .catch(() => storageService.backfillExistingPhotosToCloudinary());
  }, [geoStatus]);

  // ── Geo-block guard ──────────────────────────────────────────────────────
  if (geoStatus === 'checking') {
    // Minimal loading screen while IP lookup is in flight (typically < 1s)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#050506',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: 'center', color: '#555C64' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🐾</div>
          <p style={{ fontSize: '14px', margin: 0 }}>Loading FindLostPuppy…</p>
        </div>
      </div>
    );
  }

  if (geoStatus === 'blocked') {
    return (
      <GeoBlockPage
        countryCode={geoInfo?.countryCode}
        countryName={geoInfo?.countryName}
      />
    );
  }

  return (
    <Router basename={basename}>
      <ToastProvider>
        <AuthProvider>
          <DevelopmentErrorProbe />
          <NetworkResilience />
          <ServerFailureNotice />
          <LaunchTributeOverlay />
          <div className="app-layout-sidebar">
            <SidebarNav />
            <div className="app-main-viewport">
              <main className="main-content">
                <PageTransition>
                  <MainAppFlow />
                </PageTransition>
              </main>
              <Footer />
            </div>
          </div>
          <SuggestionWidget />
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
