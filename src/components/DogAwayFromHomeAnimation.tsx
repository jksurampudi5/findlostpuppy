import React from 'react';
import { Radio, Navigation } from 'lucide-react';

interface DogAwayFromHomeAnimationProps {
  dogName?: string;
  lastSeenArea?: string;
}

export const DogAwayFromHomeAnimation: React.FC<DogAwayFromHomeAnimationProps> = ({
  dogName = 'Your Pup',
  lastSeenArea = 'Area nearby',
}) => {
  return (
    <div className="dog-away-animation-card">
      {/* Search Radar & Alert Signals Atmosphere */}
      <div className="animation-atmosphere" aria-hidden="true">
        <span className="floating-anim-particle p-alert-1">🚨</span>
        <span className="floating-anim-particle p-radar-1">📡</span>
        <span className="floating-anim-particle p-pin-1">📍</span>
      </div>

      {/* Main Animated Scene (SVG Canvas) */}
      <div className="animation-scene-stage away-stage">
        <svg
          viewBox="0 0 600 250"
          className="scene-svg away-svg"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Dusk / Evening sky gradient */}
            <linearGradient id="duskSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="50%" stopColor="#312E81" />
              <stop offset="85%" stopColor="#831843" />
              <stop offset="100%" stopColor="#FB923C" />
            </linearGradient>

            {/* Hill gradients */}
            <linearGradient id="duskHillGradFar" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4338CA" />
              <stop offset="100%" stopColor="#1E1B4B" />
            </linearGradient>

            <linearGradient id="duskHillGradNear" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1F2937" />
              <stop offset="100%" stopColor="#111827" />
            </linearGradient>

            {/* Road gradient */}
            <linearGradient id="duskRoadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="100%" stopColor="#4B5563" />
            </linearGradient>

            {/* Pulsing Radar Glow */}
            <radialGradient id="radarPulseGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#F97316" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Dusk Sky Background */}
          <rect width="600" height="250" rx="16" fill="url(#duskSkyGrad)" />

          {/* Evening Stars */}
          <circle cx="80" cy="35" r="1.5" fill="#FFFFFF" opacity="0.9" />
          <circle cx="160" cy="25" r="1.2" fill="#FFFFFF" opacity="0.7" />
          <circle cx="280" cy="40" r="1.6" fill="#FDE047" opacity="0.8" />
          <circle cx="420" cy="30" r="1.3" fill="#FFFFFF" opacity="0.75" />
          <circle cx="510" cy="45" r="1.8" fill="#FDE047" opacity="0.85" />

          {/* Evening Moon */}
          <circle cx="530" cy="45" r="18" fill="#FEF08A" opacity="0.9" />
          <circle cx="538" cy="42" r="15" fill="#312E81" />

          {/* Distant Hills */}
          <path d="M0,135 Q140,95 280,125 T600,115 L600,250 L0,250 Z" fill="url(#duskHillGradFar)" opacity="0.75" />
          <path d="M0,155 Q200,135 400,165 T600,150 L600,250 L0,250 Z" fill="url(#duskHillGradNear)" />

          {/* ---------------------------------------------------- */}
          {/* DISTANT COZY HOME (Far away across the hills) */}
          {/* ---------------------------------------------------- */}
          <g id="distantHome" transform="translate(65, 95) scale(0.65)">
            {/* Warm beacon reaching across sky from home */}
            <line
              x1="45"
              y1="25"
              x2="480"
              y2="120"
              stroke="#FDE047"
              strokeWidth="2.5"
              strokeDasharray="8 6"
              className="anim-beacon-trace"
              opacity="0.65"
            />

            {/* Small house silhouette with glowing warm windows */}
            <rect x="15" y="30" width="60" height="40" rx="3" fill="#312E81" stroke="#4338CA" strokeWidth="1.5" />
            <polygon points="10,30 45,5 80,30" fill="#BE185D" />
            <rect x="25" y="40" width="14" height="14" rx="2" fill="#FDE047" />
            <rect x="48" y="45" width="16" height="25" rx="2" fill="#FDE047" />

            {/* Floating Home Icon & Label */}
            <text x="45" y="-6" textAnchor="middle" fontSize="16">🏡</text>
            <rect x="8" y="75" width="74" height="18" rx="9" fill="#1E1B4B" stroke="#6366F1" strokeWidth="1" />
            <text x="45" y="87" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#E0E7FF">Home</text>
          </g>

          {/* Distance Indicator Arrow between Home and Pup */}
          <g transform="translate(230, 150)">
            <rect x="-10" y="-12" width="120" height="22" rx="11" fill="rgba(17, 24, 39, 0.85)" stroke="#F97316" strokeWidth="1" />
            <text x="50" y="3" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#FED7AA">
              🐾 Away From Home
            </text>
          </g>

          {/* ---------------------------------------------------- */}
          {/* ROAD / CROSSING IN THE FOREGROUND */}
          {/* ---------------------------------------------------- */}
          <path d="M220,250 Q360,200 480,185 L560,185 Q460,215 320,250 Z" fill="url(#duskRoadGrad)" opacity="0.9" />

          {/* ---------------------------------------------------- */}
          {/* COMMUNITY EMERGENCY RADAR PULSING FROM PUP */}
          {/* ---------------------------------------------------- */}
          <g id="radarRings" transform="translate(420, 180)">
            {/* Animated Pulsing Radar Rings */}
            <circle cx="0" cy="0" r="28" fill="url(#radarPulseGlow)" className="radar-wave wave-1" />
            <circle cx="0" cy="0" r="54" fill="none" stroke="#EF4444" strokeWidth="1.5" className="radar-wave wave-2" />
            <circle cx="0" cy="0" r="82" fill="none" stroke="#F97316" strokeWidth="1" strokeDasharray="4 4" className="radar-wave wave-3" />
          </g>

          {/* ---------------------------------------------------- */}
          {/* THE PUPPY LOOKING AROUND (Away from home) */}
          {/* ---------------------------------------------------- */}
          <g id="awayPupGroup" transform="translate(390, 140)" className="anim-away-pup">
            {/* Pup Shadow on the ground */}
            <ellipse cx="30" cy="56" rx="24" ry="7" fill="#000000" opacity="0.45" />

            {/* Back Legs */}
            <path d="M14,42 L13,54 L8,55" fill="none" stroke="#B45309" strokeWidth="5" strokeLinecap="round" />
            <path d="M22,42 L23,54 L28,55" fill="none" stroke="#D97706" strokeWidth="5" strokeLinecap="round" />

            {/* Tail (Low or curled, cautious) */}
            <path
              d="M10,32 Q-2,36 2,46"
              fill="none"
              stroke="#D97706"
              strokeWidth="5.5"
              strokeLinecap="round"
              className="anim-curious-tail"
            />

            {/* Body */}
            <ellipse cx="30" cy="35" rx="19" ry="14" fill="#F59E0B" />

            {/* Front Legs */}
            <path d="M38,42 L37,54 L33,55" fill="none" stroke="#B45309" strokeWidth="5" strokeLinecap="round" />
            <path d="M46,42 L47,54 L52,55" fill="none" stroke="#D97706" strokeWidth="5" strokeLinecap="round" />

            {/* Collar */}
            <path d="M44,28 Q47,33 46,38" fill="none" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
            <circle cx="47" cy="38" r="2.5" fill="#FDE047" />

            {/* Pup Head (Animated looking left & right) */}
            <g className="anim-pup-head-curious">
              <circle cx="50" cy="22" r="14" fill="#FBBF24" />

              {/* Muzzle */}
              <ellipse cx="58" cy="25" rx="7" ry="5.5" fill="#FDE68A" />
              <circle cx="64" cy="23" r="2.5" fill="#1F2937" />

              {/* Questioning mouth */}
              <path d="M60,27 Q63,28 65,27" fill="none" stroke="#1F2937" strokeWidth="1.2" strokeLinecap="round" />

              {/* Curious Big Eyes looking up / around */}
              <circle cx="47" cy="18" r="3" fill="#1F2937" />
              <circle cx="48" cy="17" r="1" fill="#FFFFFF" />

              <circle cx="56" cy="18" r="3" fill="#1F2937" />
              <circle cx="57" cy="17" r="1" fill="#FFFFFF" />

              {/* Floppy Alert Ears */}
              <ellipse
                cx="42"
                cy="14"
                rx="5"
                ry="10"
                fill="#D97706"
                transform="rotate(-28 42 14)"
                className="anim-alert-ear"
              />

              {/* Little wondering question mark / thought */}
              <text x="48" y="-2" fontSize="13" className="anim-wondering-mark">❓</text>
            </g>
          </g>

          {/* Search Pins / Alert Badges */}
          <g transform="translate(480, 115) scale(0.85)">
            <circle cx="0" cy="0" r="14" fill="#DC2626" className="anim-alert-glow" />
            <text x="0" y="4" textAnchor="middle" fontSize="13" fill="#FFFFFF">🚨</text>
          </g>
        </svg>
      </div>

      {/* Emergency Active Radar Banner */}
      <div className="animation-details-banner away-details-banner">
        <div className="home-badge-row">
          <span className="missing-radar-badge">
            <Radio size={15} className="pulse-icon" />
            <span>COMMUNITY SEARCH RADAR ACTIVE</span>
          </span>
          <span className="search-range-tag">
            <Navigation size={13} />
            <span>Scanning 5km Radius</span>
          </span>
        </div>

        <h3 className="animation-hero-title text-red-700">
          {dogName} is Away From Home — Let's Bring Them Back! 🚨🐾
        </h3>
        <p className="animation-hero-desc">
          Your puppy was reported missing from {lastSeenArea}. Broadcast your SOS flyer below so neighbors, walkers, and pet clinics receive instant WhatsApp alerts and spot {dogName} quickly.
        </p>
      </div>
    </div>
  );
};
