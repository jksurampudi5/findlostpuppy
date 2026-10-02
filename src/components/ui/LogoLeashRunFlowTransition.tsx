import React, { useEffect, useState } from 'react';
import { Sparkles, MapPin, Compass, Heart, CheckCircle2 } from 'lucide-react';
import logoTopHandImg from '../../assets/logo_top_hand.png';
import logoBottomHandImg from '../../assets/logo_bottom_hand.png';
import logoCenterSanctuaryImg from '../../assets/logo_center_sanctuary.png';
import './logo-leash-run-transition.css';

export interface LogoLeashRunFlowTransitionProps {
  fromStep?: string;
  toStep?: string;
  direction?: 'forward' | 'backward';
  title?: string;
  subtitle?: string;
  durationMs?: number;
  onComplete: () => void;
}

/**
 * FindLostPuppy Official Logo Leash-Release & Run Flow Transition
 *
 * FORWARD:
 * 1. Logo sanctuary center: Protective caring hands gently open.
 * 2. Puppy drops/releases its leash with physics bounce.
 * 3. Puppy leaps onto the glowing road and runs happily left-to-right (4-beat trot).
 * 4. Leaves glowing amber paw prints in its wake.
 * 5. Reaches target destination pin & completes smoothly.
 *
 * BACKWARD:
 * 1. Puppy trots back happily right-to-left along the road.
 * 2. Arrives back at home sanctuary house.
 * 3. Hops back inside the locator circle and picks up its leash.
 * 4. Protective hands gently cradle and embrace the sanctuary once more.
 */
export const LogoLeashRunFlowTransition: React.FC<LogoLeashRunFlowTransitionProps> = ({
  fromStep = 'owner',
  toStep = 'location',
  direction = 'forward',
  title,
  subtitle,
  durationMs = 1750,
  onComplete,
}) => {
  const [phase, setPhase] = useState<'start' | 'running' | 'arriving' | 'done'>('start');
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [pawPrints, setPawPrints] = useState<{ id: number; left: string; top: string }[]>([]);

  const defaultForwardTitle = 'Pet Parent Profile Secured!';
  const defaultForwardSubtitle = 'The puppy happily releases its leash and dashes off to map your local rescue radius… 🐾';
  const defaultBackwardTitle = 'Returning Back Home!';
  const defaultBackwardSubtitle = 'The puppy trots safely back home to your Pet Parent profile sanctuary… 🏡';

  const effectiveTitle = title || (direction === 'forward' ? defaultForwardTitle : defaultBackwardTitle);
  const effectiveSubtitle = subtitle || (direction === 'forward' ? defaultForwardSubtitle : defaultBackwardSubtitle);

  useEffect(() => {
    const startTime = Date.now();

    // Phase 1: Unleash & start trot
    const tStart = setTimeout(() => {
      setPhase('running');
    }, 280);

    // Paw prints emitter during run
    const pawInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      if (pct > 20 && pct < 85) {
        setPawPrints((prev) => [
          ...prev.slice(-8),
          {
            id: Date.now() + Math.random(),
            left: direction === 'forward' ? `${pct}%` : `${100 - pct}%`,
            top: `${50 + (Math.sin(pct) * 6)}%`,
          },
        ]);
      }

      if (elapsed >= durationMs - 220) {
        setPhase('arriving');
      }

      if (elapsed >= durationMs) {
        clearInterval(pawInterval);
        setIsExiting(true);
        setTimeout(() => {
          onComplete();
        }, 220);
      }
    }, 30);

    return () => {
      clearTimeout(tStart);
      clearInterval(pawInterval);
    };
  }, [durationMs, onComplete, direction]);

  return (
    <div
      className={`logo-flow-transition-overlay ${isExiting ? 'is-exiting' : ''}`}
      style={{ '--run-duration': `${(durationMs / 1000).toFixed(2)}s` } as React.CSSProperties}
      role="status"
      aria-live="polite"
    >
      {/* Ambient Glow */}
      <div className="logo-ambient-aura" />

      {/* Main Cinematic Stage */}
      <div className="logo-flow-stage">
        {/* 1. HOME SANCTUARY LOGO DOCK (Left) */}
        <div
          className={`logo-home-dock ${phase !== 'start' && direction === 'forward' ? 'hands-open' : ''
            } ${phase === 'arriving' && direction === 'backward' ? '' : ''}`}
        >
          {/* Top Protective Hand */}
          <img
            src={logoTopHandImg}
            alt="Protective caring hand"
            className="dock-hand-top"
          />

          {/* Center Sanctuary House & Locator Ring */}
          <img
            src={logoCenterSanctuaryImg}
            alt="Home sanctuary house logo"
            className="dock-sanctuary-img"
          />

          {/* Bottom Protective Hand */}
          <img
            src={logoBottomHandImg}
            alt="Protective supporting hand"
            className="dock-hand-bottom"
          />

          {/* Released Leash Falling Animation (Only when moving forward) */}
          {direction === 'forward' && phase !== 'start' && (
            <svg
              className="falling-leash-svg"
              viewBox="0 0 50 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 5 C 15 15, 25 22, 22 35 C 19 46, 32 52, 38 55"
                stroke="#FF7900"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="4 2"
              />
              <circle cx="10" cy="5" r="3.5" fill="#FFA726" />
              <rect x="35" y="52" width="6" height="5" rx="1.5" fill="#E65100" />
            </svg>
          )}
        </div>

        {/* 2. THE ANIMATED ROAD */}
        <div className="road-track-container">
          <div className="road-surface">
            <div className="road-dash-line" />
            <div className="road-curb-glow" />
          </div>

          {/* Glowing Paw Prints Track */}
          {pawPrints.map((paw) => (
            <span
              key={paw.id}
              className="paw-print-particle"
              style={{ left: paw.left, top: paw.top }}
            >
              🐾
            </span>
          ))}
        </div>

        {/* 3. THE RUNNING CANINE CHARACTER ACTOR */}
        {phase !== 'start' && (
          <div
            className={`running-dog-actor ${direction === 'forward' ? 'moving-forward' : 'moving-backward'
              }`}
          >
            <svg
              viewBox="0 0 90 70"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', height: '100%' }}
            >
              {/* Rear Legs */}
              <g className="canine-leg-rear-left">
                <path
                  d="M26 38 L24 54 L20 64 L25 64"
                  stroke="#FF7900"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <g className="canine-leg-rear-right">
                <path
                  d="M30 38 L32 52 L36 64 L31 64"
                  stroke="#E65100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>

              {/* Wagging Happy Tail */}
              <g className="canine-tail">
                <path
                  d="M18 36 C 10 32, 6 22, 10 14"
                  stroke="#FF9800"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle cx="10" cy="14" r="3" fill="#FFA726" />
              </g>

              {/* Main Body Torso */}
              <g className="canine-torso">
                {/* Athletic torso silhouette */}
                <ellipse cx="40" cy="36" rx="20" ry="12" fill="#181D24" stroke="#FF7900" strokeWidth="2" />
                {/* Chest Highlight */}
                <path d="M48 30 C 54 34, 52 44, 46 46" stroke="#FFA726" strokeWidth="2" strokeLinecap="round" />

                {/* Head & Snout */}
                <circle cx="60" cy="24" r="10" fill="#181D24" stroke="#FF7900" strokeWidth="2" />
                <path d="M66 22 L76 25 L73 29 L64 29 Z" fill="#181D24" stroke="#FF7900" strokeWidth="1.5" />
                {/* Little Nose */}
                <circle cx="75" cy="25" r="2" fill="#FFA726" />
                {/* Happy Eye */}
                <path d="M61 21 Q 63 19 65 21" stroke="#FFA726" strokeWidth="1.5" strokeLinecap="round" />

                {/* Floppy Ear */}
                <g className="canine-ear">
                  <path
                    d="M58 18 C 54 18, 50 26, 52 32 C 54 36, 58 35, 59 30 Z"
                    fill="#FF7900"
                    stroke="#E65100"
                    strokeWidth="1.2"
                  />
                </g>

                {/* Collar */}
                <rect x="52" y="28" width="5" height="4" rx="1.5" fill="#E65100" />
                <circle cx="54.5" cy="32" r="1.5" fill="#FFA726" />
              </g>

              {/* Front Legs */}
              <g className="canine-leg-front-left">
                <path
                  d="M52 38 L54 52 L50 64 L55 64"
                  stroke="#FF7900"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <g className="canine-leg-front-right">
                <path
                  d="M56 38 L60 50 L64 64 L60 64"
                  stroke="#E65100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          </div>
        )}

        {/* 4. TARGET DESTINATION PIN (Right) */}
        <div className="logo-dest-dock">
          <div className="dest-pin-glow">
            {toStep === 'location' ? (
              <MapPin size={28} color="#FF7900" />
            ) : toStep === 'choice' ? (
              <Compass size={28} color="#FF7900" />
            ) : (
              <Heart size={28} color="#FF7900" />
            )}
          </div>
          <span className="dest-pin-label">
            {toStep === 'location' ? 'Location Radar' : toStep}
          </span>
        </div>
      </div>

      {/* FOOTER & DYNAMIC STATUS */}
      <div className="logo-flow-footer">
        <div className="logo-flow-status-pill">
          <Sparkles size={13} color="#FF7900" />
          <span>
            {direction === 'forward'
              ? `Step Flow: ${fromStep.toUpperCase()} → ${toStep.toUpperCase()}`
              : `Returning: ${fromStep.toUpperCase()} ← ${toStep.toUpperCase()}`}
          </span>
        </div>

        <h2 className="logo-flow-headline">{effectiveTitle}</h2>
        <p className="logo-flow-subtext">{effectiveSubtitle}</p>

        {/* Smooth Linear Progress */}
        <div className="logo-flow-progress-bar">
          <div className="logo-flow-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={12} color="#4ADE80" />
          <span>Official FindLostPuppy Motion Transition</span>
        </span>
      </div>
    </div>
  );
};
