import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { FallbackShell } from './FallbackShell';

interface LoadingFallbackProps {
  message?: string;
  timeoutMs?: number;
  onRetry?: () => void;
}

export function LoadingFallback({
  message = 'Loading your pet information…',
  timeoutMs = 12000,
  onRetry = () => window.location.reload(),
}: LoadingFallbackProps) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(timer);
  }, [timeoutMs]);

  if (timedOut) {
    return (
      <FallbackShell
        title="We could not load the latest data"
        message="Please check your connection and try again. Saved information is still available on this device."
      >
        <button type="button" className="fallback-button fallback-button--primary" onClick={onRetry}>
          <RefreshCw size={17} /> Retry
        </button>
      </FallbackShell>
    );
  }

  return <FallbackShell title="Just a moment" message={message} loading />;
}
