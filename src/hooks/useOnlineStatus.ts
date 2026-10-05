import { useCallback, useEffect, useState } from 'react';

/** Performs a real network probe so browser/PWA navigator.onLine false positives do not block the app. */
async function canReachAppShell(): Promise<boolean> {
  if (typeof window === 'undefined') return true;

  try {
    const response = await fetch(`${window.location.origin}${import.meta.env.BASE_URL || '/'}?online-check=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-store',
    });
    return response.ok || response.type === 'opaque';
  } catch {
    return false;
  }
}

/** Returns verified connectivity and avoids trusting navigator.onLine alone. */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  const verifyConnectivity = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setIsOnline(true);
      return true;
    }

    const reachable = await canReachAppShell();
    setIsOnline(reachable);
    return reachable;
  }, []);

  useEffect(() => {
    let cancelled = false;

    /** Marks the app online immediately, then lets cloud calls retry normally. */
    const handleOnline = () => {
      if (!cancelled) setIsOnline(true);
    };

    /** Verifies the connection before showing the full offline blocker. */
    const handleOffline = () => {
      verifyConnectivity().then((reachable) => {
        if (!cancelled) setIsOnline(reachable);
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    verifyConnectivity();

    return () => {
      cancelled = true;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [verifyConnectivity]);

  return isOnline;
}
