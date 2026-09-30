import { useEffect, useState } from 'react';

/** Returns browser-reported connectivity and subscribes to online/offline events until unmount. */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    /** Updates the hook state when the browser reports an online connection. */
    const handleOnline = () => setIsOnline(true);
    /** Updates the hook state when the browser reports an offline connection. */
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
