import {
  onAuthStateChanged,
  GoogleAuthProvider,
  browserLocalPersistence,
  signInWithPopup,
  signInWithCredential,
  setPersistence,
  signOut,
  updateProfile,
  type User as FirebaseAuthUser,
  type Unsubscribe,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import type { User } from '../types';
import { auth, isFirebaseConfigured } from './firebaseConfig';
import { firebaseSyncService } from './firebaseSyncService';

const OBSOLETE_SESSION_KEY = 'findlostpuppy_session_v1';
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

function getGoogleAuthErrorMessage(err: any): string {
  const code = String(err?.code || '');
  if (code.includes('operation-not-allowed')) {
    return 'Google Sign-In is not enabled in Firebase yet. Enable the Google provider in Firebase Authentication, then try again.';
  }
  if (code.includes('unauthorized-domain')) {
    return 'This app URL is not allowed in Firebase Authentication. Add localhost and the app domain under Authorized domains.';
  }
  if (code.includes('popup-closed-by-user')) {
    return 'Google Sign-In was closed before it finished. Please try again.';
  }
  return err?.message || 'Could not sign in with Google.';
}

export const ADMIN_EMAILS = ['jksurampudi5@gmail.com'];

export function isEmailAdmin(email?: string): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export function mapFirebaseUser(fbUser: FirebaseAuthUser, fallbackProfile?: Partial<User>): User {
  const email = (fbUser.email || fallbackProfile?.email || '').toLowerCase().trim();
  const derivedName =
    fbUser.displayName ||
    fallbackProfile?.name ||
    (email.includes('@') ? email.split('@')[0].replace(/[^a-zA-Z]/g, ' ') : 'Pet Parent');
  const formattedName = derivedName
    ? derivedName.charAt(0).toUpperCase() + derivedName.slice(1)
    : 'Pet Parent';

  return {
    id: fbUser.uid,
    email,
    name: formattedName,
    phone: fbUser.phoneNumber || fallbackProfile?.phone,
    avatar: fbUser.photoURL || fallbackProfile?.avatar,
    isAdmin: isEmailAdmin(email),
    createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
  };
}

class AuthService {
  private currentUser: User | null = null;

  constructor() {
    this.cleanObsoleteSessionStorage();
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('findlostpuppy_active_user');
        if (saved) this.currentUser = JSON.parse(saved);
      } catch {}
    }
  }

  mapFirebaseUser(fbUser: FirebaseAuthUser, fallbackProfile?: Partial<User>): User {
    return mapFirebaseUser(fbUser, fallbackProfile);
  }

  private cleanObsoleteSessionStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(OBSOLETE_SESSION_KEY);
      } catch (e) {
        console.warn('[AuthService] Storage cleanup notice:', e);
      }
    }
  }

  getCurrentUser(): User | null {
    if (!this.currentUser && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('findlostpuppy_active_user');
        if (saved) this.currentUser = JSON.parse(saved);
      } catch {}
    }
    return this.currentUser;
  }

  setCurrentUser(user: User | null) {
    this.currentUser = user;
    if (typeof localStorage !== 'undefined') {
      try {
        if (user) localStorage.setItem('findlostpuppy_active_user', JSON.stringify(user));
        else localStorage.removeItem('findlostpuppy_active_user');
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('findlostpuppy_session_updated', { detail: user }));
    }
  }

  isAdmin(): boolean {
    return !!(this.currentUser?.isAdmin || isEmailAdmin(this.currentUser?.email));
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe | null {
    if (!auth || !isFirebaseConfigured()) return null;
    return onAuthStateChanged(auth, (fbUser) => {
      const mapped = fbUser ? mapFirebaseUser(fbUser) : null;
      this.setCurrentUser(mapped);
      callback(mapped);
      if (mapped) {
        firebaseSyncService.syncUserProfile(mapped).catch((e) =>
          console.warn('[Firebase Sync User Notice]:', e)
        );
      }
    });
  }

  async completeGoogleRedirectSignIn(): Promise<{ success: boolean; user?: User; error?: string }> {
    return { success: false };
  }

  async getSession(): Promise<{ session: null; user: User | null }> {
    return { session: null, user: this.getCurrentUser() };
  }

  async signInWithGoogle(): Promise<{ success: boolean; user?: User; error?: string; redirected?: boolean }> {
    if (!auth || !isFirebaseConfigured()) {
      return { success: false, error: 'Firebase authentication is not configured. Add Firebase web config values first.' };
    }

    try {
      await setPersistence(auth, browserLocalPersistence);
      if (Capacitor.isNativePlatform()) {
        // Use the legacy Google Sign-In path on Android while we work around the
        // Credential Manager re-authentication failure ([16] Account reauth failed).
        const nativeResult = await FirebaseAuthentication.signInWithGoogle({
          useCredentialManager: false,
        });
        const idToken = nativeResult.credential?.idToken;
        if (!idToken) {
          return { success: false, error: 'Google Sign-In did not return an ID token.' };
        }
        const result = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
        const mapped = mapFirebaseUser(result.user);
        this.setCurrentUser(mapped);
        await firebaseSyncService.syncUserProfile(mapped).catch(() => {});
        return { success: true, user: mapped };
      }

      const result = await signInWithPopup(auth, googleProvider);
      const mapped = mapFirebaseUser(result.user);
      this.setCurrentUser(mapped);
      await firebaseSyncService.syncUserProfile(mapped).catch(() => {});
      return { success: true, user: mapped };
    } catch (err: any) {
      const code = String(err?.code || '');
      if (
        code.includes('popup-blocked') ||
        code.includes('popup-closed-by-user') ||
        code.includes('operation-not-supported-in-this-environment') ||
        code.includes('cancelled-popup-request')
      ) {
        return {
          success: false,
          error:
            'Google Sign-In popup was blocked or closed. Allow popups for this site and try again.',
        };
      }
      return { success: false, error: getGoogleAuthErrorMessage(err) };
    }
  }

  async updateCurrentUser(partial: Partial<User>): Promise<User | null> {
    if (!this.currentUser) return null;
    const updated: User = { ...this.currentUser, ...partial };
    this.setCurrentUser(updated);

    if (auth?.currentUser) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: updated.name,
          photoURL: updated.avatar || null,
        });
      } catch (e) {
        console.warn('[AuthService] Firebase updateProfile notice:', e);
      }
    }

    firebaseSyncService.syncUserProfile(updated).catch((e) =>
      console.warn('[Firebase Sync Profile Notice]:', e)
    );
    return updated;
  }

  async logout(): Promise<void> {
    if (auth && isFirebaseConfigured()) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('[AuthService] Firebase signOut notice:', e);
      }
    }
    this.setCurrentUser(null);
    this.cleanObsoleteSessionStorage();
  }
}

export const authService = new AuthService();
