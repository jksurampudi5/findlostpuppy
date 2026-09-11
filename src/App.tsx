import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SidebarNav } from './components/SidebarNav';
import { Footer } from './components/Footer';

import { ConsentPage } from './pages/ConsentPage';

// Guided Sequential Flow & Dedicated Tab Pages
import { EmailAuthPage } from './pages/EmailAuthPage';
import { PetParentContactPage } from './pages/PetParentContactPage';
import { LocationOnboardingPage } from './pages/LocationOnboardingPage';
import { DogOnboardingPage } from './pages/DogOnboardingPage';
import { ReportLostDogPage } from './pages/ReportLostDogPage';
import { GuestSightingPage } from './pages/GuestSightingPage';

// Unlocked Experience Pages
import { DiscoveryPage } from './pages/DiscoveryPage';
import { DogDetailPage } from './pages/DogDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

import './App.css';

function MainAppFlow() {
  const {
    isAuthenticated,
    activeOnboardingTab,
    setActiveOnboardingTab,
    hasValidConsent,
    agreeToConsent,
  } = useAuth();
  const navigate = useNavigate();

  return (
    <Routes>
      {/* 1. PUBLIC EMERGENCY & DIRECT DETAIL ROUTES (Instant 0-roadblock access anywhere) */}
      <Route path="/report-sighting/:id" element={<GuestSightingPage />} />
      <Route path="/found/:id" element={<GuestSightingPage />} />
      <Route path="/alert/:id" element={<GuestSightingPage />} />
      <Route path="/dog/:id" element={<DogDetailPage />} />
      <Route path="/find" element={<DiscoveryPage />} />

      {/* 2. COMMUNITY RECOVERY DASHBOARD & ADMIN PORTAL */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />

      {/* 3. DEDICATED DIRECT ROUTES FOR ALL TABS (Fast, lag-free navigation) */}
      <Route
        path="/owner"
        element={
          !hasValidConsent ? (
            <ConsentPage onConsentAgreed={agreeToConsent} />
          ) : !isAuthenticated ? (
            <EmailAuthPage />
          ) : (
            <PetParentContactPage
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
          !hasValidConsent ? (
            <ConsentPage onConsentAgreed={agreeToConsent} />
          ) : !isAuthenticated ? (
            <EmailAuthPage />
          ) : (
            <LocationOnboardingPage
              onSuccess={() => {
                setActiveOnboardingTab('dog');
                navigate('/pet');
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
        path="/pet"
        element={
          !hasValidConsent ? (
            <ConsentPage onConsentAgreed={agreeToConsent} />
          ) : !isAuthenticated ? (
            <EmailAuthPage />
          ) : (
            <DogOnboardingPage
              onBackToLocation={() => {
                setActiveOnboardingTab('location');
                navigate('/location');
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
          !hasValidConsent ? (
            <ConsentPage onConsentAgreed={agreeToConsent} />
          ) : !isAuthenticated ? (
            <EmailAuthPage />
          ) : (
            <ReportLostDogPage
              onBackToPet={() => {
                setActiveOnboardingTab('dog');
                navigate('/pet');
              }}
              onSuccess={() => {
                setActiveOnboardingTab('dashboard');
                navigate('/dashboard');
              }}
            />
          )
        }
      />
      <Route path="/report" element={<Navigate to="/alert" replace />} />
      <Route path="/report-lost" element={<Navigate to="/alert" replace />} />

      <Route path="/consent" element={<ConsentPage onConsentAgreed={agreeToConsent} />} />
      <Route path="/login" element={<EmailAuthPage />} />

      {/* 4. ROOT ROUTE (Smart dynamic resolution based on onboarding progress) */}
      <Route
        path="/"
        element={
          !hasValidConsent ? (
            <ConsentPage onConsentAgreed={agreeToConsent} />
          ) : !isAuthenticated ? (
            <EmailAuthPage />
          ) : activeOnboardingTab === 'owner' ? (
            <PetParentContactPage
              onSuccess={() => {
                setActiveOnboardingTab('location');
                navigate('/location');
              }}
            />
          ) : activeOnboardingTab === 'location' ? (
            <LocationOnboardingPage
              onSuccess={() => {
                setActiveOnboardingTab('dog');
                navigate('/pet');
              }}
              onBack={() => {
                setActiveOnboardingTab('owner');
                navigate('/owner');
              }}
            />
          ) : activeOnboardingTab === 'dog' || activeOnboardingTab === 'pet' ? (
            <DogOnboardingPage
              onBackToLocation={() => {
                setActiveOnboardingTab('location');
                navigate('/location');
              }}
              onSuccess={() => {
                setActiveOnboardingTab('report');
                navigate('/alert');
              }}
            />
          ) : activeOnboardingTab === 'report' ? (
            <ReportLostDogPage
              onBackToPet={() => {
                setActiveOnboardingTab('dog');
                navigate('/pet');
              }}
              onSuccess={() => {
                setActiveOnboardingTab('dashboard');
                navigate('/dashboard');
              }}
            />
          ) : (
            <DashboardPage />
          )
        }
      />

      {/* 5. CATCH-ALL FALLBACK */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export function App() {
  const basename = import.meta.env.BASE_URL;

  return (
    <Router basename={basename}>
      <ToastProvider>
        <AuthProvider>
          <div className="app-layout-sidebar">
            <SidebarNav />
            <div className="app-main-viewport">
              <main className="main-content">
                <MainAppFlow />
              </main>
              <Footer />
            </div>
          </div>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
