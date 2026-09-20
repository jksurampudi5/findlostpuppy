import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { authService, isEmailAdmin } from '../services/authService';
import { storageService } from '../services/storageService';
import { consentService, type AcceptedFormsState } from '../services/consentService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { supabaseSyncService } from '../services/supabaseSyncService';

export type OnboardingTab = 'owner' | 'location' | 'choice' | 'dog' | 'pet' | 'report' | 'dashboard' | 'completed';

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
    acceptedForms?: Partial<AcceptedFormsState>,
    method?: 'all_forms_accepted' | 'master_declaration'
  ) => void;
  signInWithOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (email: string, name?: string) => Promise<{ success: boolean; error?: string; requiresOtp?: boolean }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
  refreshProgress: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidConsent, setHasValidConsent] = useState<boolean>(() =>
    consentService.hasAcceptedCurrentConsent()
  );

  const [hasCompletedOwner, setHasCompletedOwner] = useState<boolean>(false);
  const [hasCompletedLocation, setHasCompletedLocation] = useState<boolean>(false);
  const [hasCompletedDog, setHasCompletedDog] = useState<boolean>(false);
  const [hasCompletedReport, setHasCompletedReport] = useState<boolean>(false);
  const [petSafetyStatus, setPetSafetyStatus] = useState<'SAFE' | 'LOST' | 'UNDECIDED'>('UNDECIDED');
  const [activeOnboardingTab, setActiveOnboardingTab] = useState<OnboardingTab>('owner');

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

      setActiveOnboardingTab((prev) => {
        if (!hasOwner) return 'owner';
        if (!hasLoc) return 'location';
        if (!hasDog && prev !== 'dog' && prev !== 'pet' && prev !== 'report' && prev !== 'dashboard') return 'choice';
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
    }
    setHasValidConsent(consentService.hasAcceptedCurrentConsent());
  }, []);

  const refreshProgress = useCallback(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    refreshProgressForUser(currentUser);
  }, [refreshProgressForUser]);

  // Supabase Auth Lifecycle & Real-time Session Monitoring
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (!isMounted) return;

          if (!error && data.session?.user) {
            const mappedUser = authService.mapSupabaseUser(data.session.user);
            authService.setCurrentUser(mappedUser);
            setUser(mappedUser);

            // Migrate any local data to this authoritative auth.uid()
            storageService.migrateUserDataToAuthenticatedUser(mappedUser.id, mappedUser.email);
            refreshProgressForUser(mappedUser);

            // Sync user profile to Supabase `profiles` table
            supabaseSyncService.syncUserProfile(mappedUser).catch((e) =>
              console.warn('[Supabase Sync User Notice]:', e)
            );
          } else {
            const cachedUser = authService.getCurrentUser();
            if (!cachedUser) {
              authService.setCurrentUser(null);
              setUser(null);
              refreshProgressForUser(null);
            } else {
              setUser(cachedUser);
              refreshProgressForUser(cachedUser);
            }
          }
        } catch (err) {
          console.warn('[AuthContext] Session init exception:', err);
          if (isMounted) {
            authService.setCurrentUser(null);
            setUser(null);
            refreshProgressForUser(null);
          }
        } finally {
          if (isMounted) setIsLoading(false);
        }

        // Subscribe to auth state changes (Magic Links, Sign In, Sign Out, Token Refresh)
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return;
          console.log(`[Supabase Auth] State changed: ${event}`);

          if (session?.user) {
            const mappedUser = authService.mapSupabaseUser(session.user);
            authService.setCurrentUser(mappedUser);
            setUser(mappedUser);

            storageService.migrateUserDataToAuthenticatedUser(mappedUser.id, mappedUser.email);
            refreshProgressForUser(mappedUser);

            supabaseSyncService.syncUserProfile(mappedUser).catch((e) =>
              console.warn('[Supabase Sync User Notice]:', e)
            );
          } else if (event === 'SIGNED_OUT') {
            authService.setCurrentUser(null);
            setUser(null);
            refreshProgressForUser(null);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } else {
        if (isMounted) {
          setIsLoading(false);
          refreshProgressForUser(null);
        }
      }
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
    setHasValidConsent(true);
  };

  /**
   * Requests a 6-digit OTP code / Magic Link via Supabase Auth
   */
  const signInWithOtp = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const res = await authService.signInWithOtp(email);
    setIsLoading(false);
    return res;
  };

  /**
   * Verifies the 6-digit OTP code entered by user
   */
  const verifyOtp = async (
    email: string,
    token: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const res = await authService.verifyOtp(email, token);
    setIsLoading(false);

    if (res.success && res.user) {
      setUser(res.user);
      storageService.migrateUserDataToAuthenticatedUser(res.user.id, res.user.email);
      refreshProgressForUser(res.user);
      return { success: true };
    }

    return { success: false, error: res.error || 'Verification failed.' };
  };

  /**
   * Backward-compatible login method for forms
   */
  const loginWithEmail = async (
    email: string,
    _name?: string
  ): Promise<{ success: boolean; error?: string; requiresOtp?: boolean }> => {
    return signInWithOtp(email);
  };

  /**
   * Signs the user out of Supabase Auth
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

    storageService.deleteUserAccount(userId);
    supabaseSyncService.deleteUserDataByEmail(userEmail).catch(() => {});
    await authService.logout();

    setUser(null);
    refreshProgressForUser(null);
    setHasValidConsent(false);
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: !!(user && (user.isAdmin || isEmailAdmin(user.email))),
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
        signInWithOtp,
        verifyOtp,
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
