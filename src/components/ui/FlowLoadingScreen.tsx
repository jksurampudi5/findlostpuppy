import React, { useEffect, useState } from 'react';
import { Sparkles, MapPin, CheckCircle2 } from 'lucide-react';
import './flow-loading-screen.css';

export interface FlowLoadingScreenProps {
  fromStep?: string;
  toStep?: string;
  title?: string;
  subtitle?: string;
  durationMs?: number;
  onComplete: () => void;
  /** Optional custom animation node to be injected from the user's prompt */
  customAnimation?: React.ReactNode;
}

/**
 * Interstitial In-Between Component Transition Screen
 * Renders in the middle when navigating between components (e.g. Owner Profile -> Location).
 * Automatically fires onComplete when the loading animation sequence concludes.
 */
export const FlowLoadingScreen: React.FC<FlowLoadingScreenProps> = ({
  title = 'Saving Owner Profile…',
  subtitle = 'Setting up Location & GPS mapping for rapid community rescue…',
  durationMs = 1200,
  onComplete,
  customAnimation,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 100);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  return (
    <div className="flow-loading-overlay" role="status" aria-live="polite">
      <div className="flow-loading-card">
        {/* Badge */}
        <div className="flow-loading-badge">
          <Sparkles size={13} color="#FF7900" />
          <span>Transitioning Steps</span>
        </div>

        {/* Central Animation Stage (Will hold the user's custom prompt animation) */}
        <div className="flow-loading-stage">
          {customAnimation ? (
            customAnimation
          ) : (
            <>
              <div className="flow-loading-pulse-ring" />
              <div className="flow-loading-pulse-ring-delayed" />
              <div className="flow-loading-center-icon">
                <MapPin size={32} color="#FF7900" />
              </div>
            </>
          )}
        </div>

        {/* Copy */}
        <div>
          <h2 className="flow-loading-title">{title}</h2>
          <p className="flow-loading-subtitle">{subtitle}</p>
        </div>

        {/* Progress Bar */}
        <div className="flow-loading-progress-track">
          <div className="flow-loading-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Sub-status */}
        <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={12} color="#4ADE80" />
          <span>Details secured locally • Initializing map data</span>
        </span>
      </div>
    </div>
  );
};
