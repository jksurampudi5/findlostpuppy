import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { authService, isEmailAdmin } from '../services/authService';
import { storageService } from '../services/storageService';
import { consentService, type AcceptedFormsState } from '../services/consentService';
import { storageBucketService } from '../services/storageBucketService';
import { firebaseSyncService } from '../services/firebaseSyncService';
import { auth } from '../services/firebaseConfig';
import { deleteUser } from 'firebase/auth';

export type OnboardingTab = 'owner' | 'location' | 'choice' | 'dog' | 'pet' | 'report' | 'dashboard' | 'completed';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasValidConsent: boolean;
  isFirstTimeUser: boolean;
  isLoading: boolean;
  authNotice: string;
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
    acceptedForms?: Partial<AcceptedFormsState>,
    method?: 'all_forms_accepted' | 'master_declaration'
  ) => void;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string; redirected?: boolean }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
  refreshProgress: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Provides session, consent, onboarding progress, and account actions to descendant components. */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState('');
  const [hasValidConsent, setHasValidConsent] = useState<boolean>(() =>
    consentService.hasAcceptedCurrentConsent()
  );
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean>(false);

  const [hasCompletedOwner, setHasCompletedOwner] = useState<boolean>(false);
  const [hasCompletedLocation, setHasCompletedLocation] = useState<boolean>(false);
  const [hasCompletedDog, setHasCompletedDog] = useState<boolean>(false);
  const [hasCompletedReport, setHasCompletedReport] = useState<boolean>(false);
  const [petSafetyStatus, setPetSafetyStatus] = useState<'SAFE' | 'LOST' | 'UNDECIDED'>('UNDECIDED');
  const [activeOnboardingTab, setActiveOnboardingTab] = useState<OnboardingTab>('owner');

  /**
   * Evaluates if the authenticated user is genuinely a first-time user.
   * If they already have any profile, location, pets, reports, or previous acceptance, they are returning.
   */
  const checkIfFirstTimeUser = useCallback((currentUser: User | null): boolean => {
    if (!currentUser) return false;
    if (localStorage.getItem(`findlostpuppy_returning_user_${currentUser.id}`) === 'true') return false;
    if (localStorage.getItem(`findlostpuppy_consent_accepted_${currentUser.id}`) === 'true') return false;
    if (localStorage.getItem('findlostpuppy_has_accepted_consent') === 'true') return false;
    if (consentService.hasAcceptedCurrentConsent(currentUser.id)) return false;

    if (storageService.hasCompletedOwnerProfile(currentUser.id, currentUser.email)) return false;
    if (storageService.hasCompletedLocation(currentUser.id, currentUser.email)) return false;
    if (storageService.hasCompletedDogProfile(currentUser.id, currentUser.email)) return false;
    if (storageService.hasCompletedReport(currentUser.id, currentUser.email)) return false;
    const pets = storageService.getAllPets().filter((p: { ownerId?: string }) => p.ownerId === currentUser.id);
    if (pets.length > 0) return false;
    const reports = storageService.getAllReports().filter((r: { dog?: { ownerId?: string } }) => r.dog?.ownerId === currentUser.id);
    if (reports.length > 0) return false;

    return true;
  }, []);

  /**
   * Recalculates onboarding progress and safety status for a given user
   */
  const refreshProgressForUser = useCallback((currentUser: User | null) => {
    if (currentUser) {
      const hasOwner = storageService.hasCompletedOwnerProfile(currentUser.id, currentUser.email);
      const hasLoc = storageService.hasCompletedLocation(currentUser.id, currentUser.email);
      const hasDog = storageService.hasCompletedDogProfile(currentUser.id, currentUser.email);
      const hasReport = storageService.hasCompletedReport(currentUser.id, currentUser.email);

      setHasCompletedOwner(hasOwner);
      setHasCompletedLocation(hasLoc);
      setHasCompletedDog(hasDog);
      setHasCompletedReport(hasReport);

      const newSafety = storageService.getPetSafetyStatus(currentUser.id, currentUser.email);
      setPetSafetyStatus(newSafety);

      const firstTime = checkIfFirstTimeUser(currentUser);
      setIsFirstTimeUser(firstTime);

      if (!firstTime) {
        // Returning user - permanently satisfy consent and skip it completely
        consentService.markConsentCompletedForUser(currentUser.id);
        setHasValidConsent(true);
      } else {
        setHasValidConsent(consentService.hasAcceptedCurrentConsent(currentUser.id));
      }

      setActiveOnboardingTab((prev) => {
        if (!hasOwner) return 'owner';
        if (!hasLoc) return 'location';
        if (!hasDog) return 'dog';
        if (!hasReport) return 'report';
        return prev === 'owner' || prev === 'location' || prev === 'choice' || prev === 'dog' || prev === 'report' ? 'completed' : prev;
      });
    } else {
      setHasCompletedOwner(false);
      setHasCompletedLocation(false);
      setHasCompletedDog(false);
      setHasCompletedReport(false);
      setPetSafetyStatus('UNDECIDED');
      setActiveOnboardingTab('owner');
      setIsFirstTimeUser(false);
      setHasValidConsent(consentService.hasAcceptedCurrentConsent());
    }
  }, [checkIfFirstTimeUser]);

  const refreshProgress = useCallback(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    refreshProgressForUser(currentUser);
  }, [refreshProgressForUser]);

  // Firebase Auth Lifecycle & Real-time Session Monitoring
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const redirectResult = await authService.completeGoogleRedirectSignIn();
        if (redirectResult.error) setAuthNotice(redirectResult.error);
      } catch {}

      const unsubscribe = authService.onAuthStateChanged(async (mappedUser) => {
        if (!isMounted) return;
        if (mappedUser) {
          setUser(mappedUser);
          storageService.migrateUserDataToAuthenticatedUser(mappedUser.id, mappedUser.email);
          refreshProgressForUser(mappedUser);
          storageService.pullFromFirebase().then(() => {
            if (isMounted) refreshProgressForUser(mappedUser);
          }).catch(() => {});
        } else {
          const cachedUser = authService.getCurrentUser();
          if (cachedUser) {
            storageService.pullFromFirebase().then(() => {
              if (isMounted) refreshProgressForUser(cachedUser);
            }).catch(() => {});
          }
          setUser(cachedUser);
          refreshProgressForUser(cachedUser);
        }
        setIsLoading(false);
      });

      if (!unsubscribe) {
        if (isMounted) {
          setIsLoading(false);
          const cachedUser = authService.getCurrentUser();
          setUser(cachedUser);
          refreshProgressForUser(cachedUser);
        }
      }

      return () => {
        unsubscribe?.();
      };
    }

    const cleanupPromise = initAuth();

    return () => {
      isMounted = false;
      cleanupPromise.then((cleanup) => {
        if (typeof cleanup === 'function') cleanup();
      });
    };
  }, [refreshProgressForUser]);

  // Window event listeners for storage and progress sync
  useEffect(() => {
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
  }, [refreshProgress]);

  const markPetSafe = () => {
    const u = authService.getCurrentUser();
    if (u) {
      storageService.markPetSafe(u.id, u.email);
      setPetSafetyStatus('SAFE');
      setHasCompletedReport(true);
      refreshProgress();
    }
  };

  const markPetLost = () => {
    const u = authService.getCurrentUser();
    if (u) {
      storageService.markPetLost(u.id, u.email);
      setPetSafetyStatus('LOST');
      refreshProgress();
    }
  };

  const agreeToConsent = (
    acceptedForms?: Partial<AcceptedFormsState>,
    method?: 'all_forms_accepted' | 'master_declaration'
  ) => {
    consentService.recordConsent(user?.id, acceptedForms, method);
    consentService.markConsentCompletedForUser(user?.id);
    setHasValidConsent(true);
    setIsFirstTimeUser(false);
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string; redirected?: boolean }> => {
    setAuthNotice('');
    setIsLoading(true);
    const res = await authService.signInWithGoogle();
    if (!res.redirected) setIsLoading(false);

    if (res.success && res.user) {
      setAuthNotice('');
      setUser(res.user);
      storageService.migrateUserDataToAuthenticatedUser(res.user.id, res.user.email);
      await storageService.pullFromFirebase();
      refreshProgressForUser(res.user);
      return { success: true };
    }

    if (!res.success && res.error) setAuthNotice(res.error);

    return { success: res.success, error: res.error, redirected: res.redirected };
  };

  /**
   * Signs the user out of Firebase Auth
   */
  const logout = async (): Promise<void> => {
    await authService.logout();
    setUser(null);
    refreshProgressForUser(null);
  };

  /**
   * Permanently deletes user account and records
   */
  const deleteAccount = async (): Promise<boolean> => {
    if (!user) return false;
    const userId = user.id;
    const userEmail = user.email;

    const cloudDeleted = await storageBucketService.deleteMyAccountData();
    if (!cloudDeleted) return false;
    storageBucketService.clearQueue();
    const recordsDeleted = await firebaseSyncService.deleteUserDataByEmail(userEmail);
    if (!recordsDeleted) return false;
    storageService.deleteUserAccount(userId);
    consentService.revokeConsent(userId);
    if (auth?.currentUser) await deleteUser(auth.currentUser);
    await authService.logout();

    setUser(null);
    refreshProgressForUser(null);
    setHasValidConsent(false);
    setIsFirstTimeUser(false);
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: !!(user && (user.isAdmin || isEmailAdmin(user.email))),
        hasValidConsent,
        isFirstTimeUser,
        isLoading,
        authNotice,
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
        signInWithGoogle,
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
