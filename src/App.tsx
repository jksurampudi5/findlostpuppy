import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { ConsentPage } from './pages/ConsentPage';

// Guided Sequential Flow Pages
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

import './App.css';

function MainAppFlow() {
  const {
    isAuthenticated,
    activeOnboardingTab,
    setActiveOnboardingTab,
    hasValidConsent,
    agreeToConsent,
  } = useAuth();
  const location = useLocation();

  // STEP 0: PUBLIC EMERGENCY GUEST ROUTES (Instant 0-roadblock access via WhatsApp links)
  // Neighbors, finders, and WhatsApp recipients can directly see the pet details, photos,
  // owner contact info, submit sightings, and explore the community dashboard without login or legal consent roadblocks!
  if (
    location.pathname.startsWith('/report-sighting/') ||
    location.pathname.startsWith('/found/') ||
    location.pathname.startsWith('/alert/')
  ) {
    return (
      <Routes>
        <Route path="/report-sighting/:id" element={<GuestSightingPage />} />
        <Route path="/found/:id" element={<GuestSightingPage />} />
        <Route path="/alert/:id" element={<GuestSightingPage />} />
      </Routes>
    );
  }

  if (location.pathname.startsWith('/dog/')) {
    return (
      <Routes>
        <Route path="/dog/:id" element={<DogDetailPage />} />
      </Routes>
    );
  }

  if (location.pathname === '/dashboard' || location.pathname === '/find') {
    return (
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/find" element={<DiscoveryPage />} />
      </Routes>
    );
  }

  // STEP 1: MANDATORY PRE-AUTHENTICATION CONSENT GATE FOR REGISTERING PETS & AUTH
  if (!hasValidConsent) {
    return <ConsentPage onConsentAgreed={agreeToConsent} />;
  }

  // STEP 2: Not authenticated -> Clean Email Sign In (Zero dog images shown)
  if (!isAuthenticated) {
    return <EmailAuthPage />;
  }

  // STEP 2: Dedicated Component Views (Active Tab Routing)
  if (activeOnboardingTab === 'owner') {
    return (
      <PetParentContactPage
        onSuccess={() => setActiveOnboardingTab('location')}
      />
    );
  }

  if (activeOnboardingTab === 'location') {
    return (
      <LocationOnboardingPage
        onSuccess={() => setActiveOnboardingTab('dog')}
        onBack={() => setActiveOnboardingTab('owner')}
      />
    );
  }

  if (activeOnboardingTab === 'dog' || activeOnboardingTab === 'pet') {
    return (
      <DogOnboardingPage
        onBackToLocation={() => setActiveOnboardingTab('location')}
        onSuccess={() => setActiveOnboardingTab('report')}
      />
    );
  }

  if (activeOnboardingTab === 'report') {
    return (
      <ReportLostDogPage
        onBackToPet={() => setActiveOnboardingTab('dog')}
        onSuccess={() => setActiveOnboardingTab('dashboard')}
      />
    );
  }

  if (activeOnboardingTab === 'dashboard') {
    return <DashboardPage />;
  }

  // STEP 3: Completed all forms -> Rendered community feed unlocked!
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/find" element={<DiscoveryPage />} />
      <Route path="/dog/:id" element={<DogDetailPage />} />
      <Route path="/report-sighting/:id" element={<GuestSightingPage />} />
      <Route path="/found/:id" element={<GuestSightingPage />} />
      <Route
        path="/edit-parent"
        element={<PetParentContactPage onSuccess={() => window.history.back()} />}
      />
      <Route
        path="/edit-location"
        element={<LocationOnboardingPage onSuccess={() => window.history.back()} onBack={() => window.history.back()} />}
      />
      <Route
        path="/report-another"
        element={<DogOnboardingPage onBackToOwner={() => window.history.back()} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  const basename = import.meta.env.BASE_URL;

  return (
    <Router basename={basename}>
      <ToastProvider>
        <AuthProvider>
          <div className="app-layout">
            <Navbar />
            <main className="main-content">
              <MainAppFlow />
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
