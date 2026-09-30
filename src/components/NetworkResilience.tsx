import { useEffect, useRef, useState } from 'react';
import { Wifi } from 'lucide-react';
import { storageBucketService } from '../services/storageBucketService';
import { storageService } from '../services/storageService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { OfflineFallback } from './fallbacks/OfflineFallback';

/** Shows connectivity recovery UI and retries queued media and cloud pulls after reconnection. */
export function NetworkResilience() {
  const online = useOnlineStatus();
  const [reconnected, setReconnected] = useState(false);
  const wasOffline = useRef(!navigator.onLine);

  useEffect(() => {
    let hideTimer: number | undefined;

    /** Marks the connection as lost and hides the reconnection notice. */
    const handleOffline = () => {
      wasOffline.current = true;
      setReconnected(false);
    };

    /** After an offline period, retries queued uploads and cloud synchronization, then schedules notice dismissal. */
    const handleOnline = async () => {
      if (wasOffline.current) {
        setReconnected(true);
        wasOffline.current = false;
        await storageBucketService.flushQueue();
        await storageService.pullFromFirebase().catch(() => undefined);
        hideTimer = window.setTimeout(() => setReconnected(false), 4500);
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    if (navigator.onLine && storageBucketService.getQueue().length > 0) {
      storageBucketService.flushQueue();
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, []);

  if (!online) {
    return <OfflineFallback onRetry={() => {
      if (navigator.onLine) window.dispatchEvent(new Event('online'));
    }} />;
  }

  if (!reconnected) return null;

  return (
    <div className="network-status-banner is-online" role="status" aria-live="polite">
      <Wifi size={18} />
      <span>Connection restored. Saved changes and images are being retried.</span>
    </div>
  );
}
