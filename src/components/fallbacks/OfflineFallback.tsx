import { CloudOff, RefreshCw } from 'lucide-react';
import { FallbackShell } from './FallbackShell';

interface OfflineFallbackProps { onRetry: () => void }

/** Shows a full-screen offline message and invokes the supplied callback when Retry is selected. */
export function OfflineFallback({ onRetry }: OfflineFallbackProps) {
  return (
    <FallbackShell
      fullScreen
      icon={<CloudOff size={44} />}
      title="No internet connection"
      message="Please turn on mobile data or Wi-Fi to continue. Your saved forms and images remain on this device."
    >
      <button type="button" className="fallback-button fallback-button--primary" onClick={onRetry}>
        <RefreshCw size={17} /> Retry
      </button>
    </FallbackShell>
  );
}
