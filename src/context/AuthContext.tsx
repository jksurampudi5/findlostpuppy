import { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { consentService } from '../services/consentService';

export type OnboardingTab = 'owner' | 'location' | 'dog' | 'pet' | 'report' | 'dashboard' | 'completed';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasValidConsent: boolean;
  isLoading: boolean;
  hasCompletedOwner: boolean;
  hasCompletedLocation: boolean;
  hasCompletedDog: boolean;
  hasCompletedReport: boolean;
  petSafetyStatus: 'SAFE' | 'LOST' | 'UNDECIDED';
  isPetSafe: boolean;
  activeOnboardingTab: OnboardingTab;
  setActiveOnboardingTab: (tab: OnboardingTab) => void;
  markPetSafe: () => void;
  markPetLost: () => void;
  agreeToConsent: (
    acceptedForms?: Partial<import('../services/consentService').AcceptedFormsState>,
    method?: 'all_forms_accepted' | 'master_declaration'
  ) => void;
  loginWithEmail: (email: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  deleteAccount: () => Promise<boolean>;
  refreshProgress: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [hasValidConsent, setHasValidConsent] = useState<boolean>(() =>
    consentService.hasAcceptedCurrentConsent()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasCompletedOwner, setHasCompletedOwner] = useState<boolean>(() => {
    const u = authService.getCurrentUser();
    return u ? storageService.hasCompletedOwnerProfile(u.id) : false;
  });
  const [hasCompletedLocation, setHasCompletedLocation] = useState<boolean>(() => {
    const u = authService.getCurrentUser();
    return u ? storageService.hasCompletedLocation(u.id) : false;
  });
  const [hasCompletedDog, setHasCompletedDog] = useState<boolean>(() => {
    const u = authService.getCurrentUser();
    return u ? storageService.hasCompletedDogProfile(u.id) : false;
  });
  const [hasCompletedReport, setHasCompletedReport] = useState<boolean>(() => {
    const u = authService.getCurrentUser();
    return u ? storageService.hasCompletedReport(u.id) : false;
  });

  const [petSafetyStatus, setPetSafetyStatus] = useState<'SAFE' | 'LOST' | 'UNDECIDED'>(() => {
    const u = authService.getCurrentUser();
    if (!u) return 'UNDECIDED';
    if (storageService.isPetSafe(u.id)) return 'SAFE';
    const rep = storageService.getLatestReportByUserId(u.id);
    if (rep && rep.status === 'LOST') return 'LOST';
    return 'UNDECIDED';
  });

  const [activeOnboardingTab, setActiveOnboardingTab] = useState<OnboardingTab>(() => {
    const u = authService.getCurrentUser();
    if (!u) return 'owner';
    const hasOwner = storageService.hasCompletedOwnerProfile(u.id);
    const hasLoc = storageService.hasCompletedLocation(u.id);
    const hasPet = storageService.hasCompletedPetProfile(u.id);
    const hasReport = storageService.hasCompletedReport(u.id);
    if (!hasOwner) return 'owner';
    if (!hasLoc) return 'location';
    if (!hasPet) return 'dog';
    if (!hasReport) return 'report';
    return 'completed';
  });

  const markPetSafe = () => {
    const u = authService.getCurrentUser();
    if (u) {
      storageService.markPetSafe(u.id);
      setPetSafetyStatus('SAFE');
      setHasCompletedReport(true);
      refreshProgress();
    }
  };

  const markPetLost = () => {
    const u = authService.getCurrentUser();
    if (u) {
      storageService.clearPetSafe(u.id);
      setPetSafetyStatus('LOST');
      refreshProgress();
    }
  };

  const refreshProgress = () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      const hasOwner = storageService.hasCompletedOwnerProfile(currentUser.id);
      const hasLoc = storageService.hasCompletedLocation(currentUser.id);
      const hasDog = storageService.hasCompletedDogProfile(currentUser.id);
      const hasReport = storageService.hasCompletedReport(currentUser.id);
      setHasCompletedOwner(hasOwner);
      setHasCompletedLocation(hasLoc);
      setHasCompletedDog(hasDog);
      setHasCompletedReport(hasReport);

      if (storageService.isPetSafe(currentUser.id)) {
        setPetSafetyStatus('SAFE');
      } else {
        const rep = storageService.getLatestReportByUserId(currentUser.id);
        if (rep && rep.status === 'LOST') {
          setPetSafetyStatus('LOST');
        } else {
          setPetSafetyStatus('UNDECIDED');
        }
      }
    } else {
      setUser(null);
      setHasCompletedOwner(false);
      setHasCompletedLocation(false);
      setHasCompletedDog(false);
      setHasCompletedReport(false);
      setPetSafetyStatus('UNDECIDED');
      setActiveOnboardingTab('owner');
    }
    setHasValidConsent(consentService.hasAcceptedCurrentConsent());
  };

  useEffect(() => {
    refreshProgress();

    const handleGlobalSync = () => {
      refreshProgress();
    };

    window.addEventListener('findlostpuppy_reports_updated', handleGlobalSync);
    window.addEventListener('findlostpuppy_session_updated', handleGlobalSync);
    window.addEventListener('findlostpuppy_consent_updated', handleGlobalSync);
    window.addEventListener('storage', handleGlobalSync);

    return () => {
      window.removeEventListener('findlostpuppy_reports_updated', handleGlobalSync);
      window.removeEventListener('findlostpuppy_session_updated', handleGlobalSync);
      window.removeEventListener('findlostpuppy_consent_updated', handleGlobalSync);
      window.removeEventListener('storage', handleGlobalSync);
    };
  }, []);

  const agreeToConsent = (
    acceptedForms?: Partial<import('../services/consentService').AcceptedFormsState>,
    method?: 'all_forms_accepted' | 'master_declaration'
  ) => {
    consentService.recordConsent(user?.id, acceptedForms, method);
    setHasValidConsent(true);
  };

  const deleteAccount = async (): Promise<boolean> => {
    if (!user) return false;
    const userId = user.id;
    storageService.deleteUserAccount(userId);
    authService.logout();
    setUser(null);
    setHasCompletedOwner(false);
    setHasCompletedLocation(false);
    setHasCompletedDog(false);
    setHasCompletedReport(false);
    setPetSafetyStatus('UNDECIDED');
    setActiveOnboardingTab('owner');
    setHasValidConsent(false);
    return true;
  };

  const loginWithEmail = async (email: string, name?: string) => {
    setIsLoading(true);
    const res = await authService.loginWithEmail(email, name);
    setIsLoading(false);
    if (res.success && res.user) {
      setUser(res.user);
      const hasOwner = storageService.hasCompletedOwnerProfile(res.user.id);
      const hasLoc = storageService.hasCompletedLocation(res.user.id);
      const hasDog = storageService.hasCompletedDogProfile(res.user.id);
      const hasReport = storageService.hasCompletedReport(res.user.id);
      setHasCompletedOwner(hasOwner);
      setHasCompletedLocation(hasLoc);
      setHasCompletedDog(hasDog);
      setHasCompletedReport(hasReport);

      if (storageService.isPetSafe(res.user.id)) {
        setPetSafetyStatus('SAFE');
      } else {
        const rep = storageService.getLatestReportByUserId(res.user.id);
        if (rep && rep.status === 'LOST') {
          setPetSafetyStatus('LOST');
        } else {
          setPetSafetyStatus('UNDECIDED');
        }
      }

      setActiveOnboardingTab(!hasOwner ? 'owner' : !hasLoc ? 'location' : !hasDog ? 'dog' : !hasReport ? 'report' : 'completed');
      return { success: true };
    }
    return { success: false, error: res.error || 'Login failed' };
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setHasCompletedOwner(false);
    setHasCompletedLocation(false);
    setHasCompletedDog(false);
    setHasCompletedReport(false);
    setPetSafetyStatus('UNDECIDED');
    setActiveOnboardingTab('owner');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: !!(user && (user.isAdmin || user.email?.toLowerCase() === 'jksurampudi5@gmail.com')),
        hasValidConsent,
        isLoading,
        hasCompletedOwner,
        hasCompletedLocation,
        hasCompletedDog,
        hasCompletedReport,
        petSafetyStatus,
        isPetSafe: petSafetyStatus === 'SAFE',
        activeOnboardingTab,
        setActiveOnboardingTab,
        markPetSafe,
        markPetLost,
        agreeToConsent,
        loginWithEmail,
        logout,
        deleteAccount,
        refreshProgress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
