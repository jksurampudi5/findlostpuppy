import type { ReactNode } from 'react';
import { Camera, MapPin, RefreshCw, Settings } from 'lucide-react';
import { FallbackShell } from './FallbackShell';

interface PermissionFallbackProps {
  type: 'camera' | 'location';
  onRetry: () => void;
  onAlternative: () => void;
  onOpenSettings?: () => void;
  alternativeLabel?: string;
  compact?: boolean;
  extraAction?: ReactNode;
}

/** Offers retry and alternative actions for camera or location access, with optional settings access. */
export function PermissionFallback({
  type,
  onRetry,
  onAlternative,
  onOpenSettings,
  alternativeLabel,
  compact = false,
  extraAction,
}: PermissionFallbackProps) {
  const camera = type === 'camera';
  return (
    <div className={compact ? 'permission-fallback-compact' : ''}>
      <FallbackShell
        icon={camera ? <Camera size={40} /> : <MapPin size={40} />}
        title={camera ? 'Camera permission needed' : 'Location permission needed'}
        message={camera
          ? 'Camera access is needed to capture your pet photo.'
          : 'Location helps us capture the correct last-seen place for your pet.'}
      >
        <button type="button" className="fallback-button fallback-button--primary" onClick={onRetry}>
          <RefreshCw size={17} /> Try Again
        </button>
        <button type="button" className="fallback-button" onClick={onAlternative}>
          {alternativeLabel || (camera ? 'Upload from Gallery' : 'Enter Location Manually')}
        </button>
        {onOpenSettings && (
          <button type="button" className="fallback-button" onClick={onOpenSettings}>
            <Settings size={17} /> Open Settings
          </button>
        )}
        {extraAction}
      </FallbackShell>
    </div>
  );
}
