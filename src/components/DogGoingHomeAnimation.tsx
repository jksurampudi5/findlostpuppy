import React, { useEffect } from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { triggerStarCelebration } from '../utils/confettiHelper';

interface DogGoingHomeAnimationProps {
  dogName?: string;
}

export const DogGoingHomeAnimation: React.FC<DogGoingHomeAnimationProps> = ({ dogName = 'Your Pup' }) => {
  useEffect(() => {
    // Trigger star celebration whenever dog going home animation mounts
    triggerStarCelebration();
  }, []);

  return (
    <div className="dog-home-animation-card">
      {/* Atmosphere Sparkles & Floating Hearts */}
      <div className="animation-atmosphere" aria-hidden="true">
        <span className="floating-anim-particle p-heart-1">💖</span>
        <span className="floating-anim-particle p-heart-2">💕</span>
        <span className="floating-anim-particle p-heart-3">✨</span>
        <span className="floating-anim-particle p-star-1">⭐</span>
        <span className="floating-anim-particle p-star-2">🌟</span>
      </div>

      {/* Main Animated Stage (SVG Canvas) */}
      <div className="animation-scene-stage">
        <svg
          viewBox="0 0 600 240"
          className="scene-svg"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="60%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#FEF3C7" />
            </linearGradient>

            <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="100%" stopColor="#4ADE80" />
            </linearGradient>

            <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FED7AA" />
              <stop offset="100%" stopColor="#FDBA74" />
            </linearGradient>

            <linearGradient id="houseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="100%" stopColor="#FEF3C7" />
            </linearGradient>

            <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>

            <radialGradient id="doorGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="1" />
              <stop offset="70%" stopColor="#FDE047" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#CA8A04" stopOpacity="0.3" />
            </radialGradient>

            {/* Chimney smoke filter */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Sky background */}
          <rect width="600" height="240" rx="16" fill="url(#skyGrad)" />

          {/* Warm Sun in background */}
          <circle cx="90" cy="55" r="32" fill="#FDE047" opacity="0.9" />
          <circle cx="90" cy="55" r="42" fill="#FEF08A" opacity="0.4" />

          {/* Soft distant rolling green hills */}
          <path d="M0,170 Q160,110 320,150 T600,140 L600,240 L0,240 Z" fill="#BBF7D0" opacity="0.7" />

          {/* Foreground Grass Lawn */}
          <path d="M0,165 Q180,145 360,165 T600,155 L600,240 L0,240 Z" fill="url(#grassGrad)" />

          {/* Winding Garden Cobblestone Path to the Front Door */}
          <path
            d="M-20,230 Q120,225 240,205 T475,175 L515,175 Q310,215 150,240 Z"
            fill="url(#pathGrad)"
            opacity="0.85"
          />

          {/* ---------------------------------------------------- */}
          {/* THE COZY HOUSE (Destination) */}
          {/* ---------------------------------------------------- */}
          <g id="cozyHouse" transform="translate(430, 70)">
            {/* Chimney */}
            <rect x="75" y="10" width="18" height="35" rx="3" fill="#B45309" />
            {/* Chimney Smoke Puffs */}
            <circle cx="84" cy="2" r="6" fill="#FFFFFF" opacity="0.8" className="anim-smoke puff-1" />
            <circle cx="88" cy="-12" r="8" fill="#FFFFFF" opacity="0.6" className="anim-smoke puff-2" />
            <circle cx="93" cy="-28" r="10" fill="#FFFFFF" opacity="0.4" className="anim-smoke puff-3" />

            {/* House Wall Body */}
            <rect x="15" y="45" width="110" height="85" rx="6" fill="url(#houseGrad)" stroke="#FDE68A" strokeWidth="2" />

            {/* Pitch Roof */}
            <polygon points="10,50 70,5 130,50" fill="url(#roofGrad)" />
            <polygon points="12,50 70,8 128,50" fill="#FB923C" opacity="0.4" />

            {/* Attic Window */}
            <circle cx="70" cy="32" r="9" fill="#FEF3C7" stroke="#EA580C" strokeWidth="2" />
            <line x1="70" y1="23" x2="70" y2="41" stroke="#EA580C" strokeWidth="1.5" />
            <line x1="61" y1="32" x2="79" y2="32" stroke="#EA580C" strokeWidth="1.5" />

            {/* Side Window with cozy golden light */}
            <rect x="25" y="60" width="24" height="24" rx="4" fill="#FEF08A" stroke="#F59E0B" strokeWidth="2" />
            <line x1="37" y1="60" x2="37" y2="84" stroke="#F59E0B" strokeWidth="1.5" />
            <line x1="25" y1="72" x2="49" y2="72" stroke="#F59E0B" strokeWidth="1.5" />

            {/* Warm Welcoming Open Front Door */}
            <rect x="65" y="58" width="34" height="72" rx="4" fill="url(#doorGlow)" stroke="#CA8A04" strokeWidth="2" />
            {/* Heart symbol on the door mat / header */}
            <text x="82" y="52" textAnchor="middle" fontSize="11" fill="#EA580C">💖</text>

            {/* Welcome Door Mat */}
            <ellipse cx="82" cy="130" rx="20" ry="5" fill="#92400E" opacity="0.7" />
            <text x="82" y="133" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#FFFFFF">HOME</text>

            {/* Cute Flower Bushes */}
            <circle cx="15" cy="130" r="10" fill="#34D399" />
            <circle cx="15" cy="125" r="4" fill="#F43F5E" />
            <circle cx="125" cy="130" r="10" fill="#34D399" />
            <circle cx="125" cy="125" r="4" fill="#FB7185" />
          </g>

          {/* ---------------------------------------------------- */}
          {/* ANIMATED PAW PRINTS ALONG THE PATH */}
          {/* ---------------------------------------------------- */}
          <g id="pawTrail" className="anim-paw-trail">
            {/* Paw print 1 */}
            <g transform="translate(60, 222) rotate(-8) scale(0.65)" className="anim-paw p-step-1">
              <ellipse cx="0" cy="0" rx="7" ry="5.5" fill="#C2410C" opacity="0.6" />
              <circle cx="-6" cy="-7" r="2.2" fill="#C2410C" opacity="0.6" />
              <circle cx="-2" cy="-9" r="2.2" fill="#C2410C" opacity="0.6" />
              <circle cx="3" cy="-9" r="2.2" fill="#C2410C" opacity="0.6" />
              <circle cx="7" cy="-7" r="2.2" fill="#C2410C" opacity="0.6" />
            </g>

            {/* Paw print 2 */}
            <g transform="translate(130, 214) rotate(-6) scale(0.62)" className="anim-paw p-step-2">
              <ellipse cx="0" cy="0" rx="7" ry="5.5" fill="#C2410C" opacity="0.65" />
              <circle cx="-6" cy="-7" r="2.2" fill="#C2410C" opacity="0.65" />
              <circle cx="-2" cy="-9" r="2.2" fill="#C2410C" opacity="0.65" />
              <circle cx="3" cy="-9" r="2.2" fill="#C2410C" opacity="0.65" />
              <circle cx="7" cy="-7" r="2.2" fill="#C2410C" opacity="0.65" />
            </g>

            {/* Paw print 3 */}
            <g transform="translate(200, 204) rotate(-8) scale(0.58)" className="anim-paw p-step-3">
              <ellipse cx="0" cy="0" rx="7" ry="5.5" fill="#C2410C" opacity="0.7" />
              <circle cx="-6" cy="-7" r="2.2" fill="#C2410C" opacity="0.7" />
              <circle cx="-2" cy="-9" r="2.2" fill="#C2410C" opacity="0.7" />
              <circle cx="3" cy="-9" r="2.2" fill="#C2410C" opacity="0.7" />
              <circle cx="7" cy="-7" r="2.2" fill="#C2410C" opacity="0.7" />
            </g>

            {/* Paw print 4 */}
            <g transform="translate(270, 194) rotate(-6) scale(0.55)" className="anim-paw p-step-4">
              <ellipse cx="0" cy="0" rx="7" ry="5.5" fill="#C2410C" opacity="0.75" />
              <circle cx="-6" cy="-7" r="2.2" fill="#C2410C" opacity="0.75" />
              <circle cx="-2" cy="-9" r="2.2" fill="#C2410C" opacity="0.75" />
              <circle cx="3" cy="-9" r="2.2" fill="#C2410C" opacity="0.75" />
              <circle cx="7" cy="-7" r="2.2" fill="#C2410C" opacity="0.75" />
            </g>

            {/* Paw print 5 near the doorstep */}
            <g transform="translate(350, 185) rotate(-5) scale(0.52)" className="anim-paw p-step-5">
              <ellipse cx="0" cy="0" rx="7" ry="5.5" fill="#C2410C" opacity="0.8" />
              <circle cx="-6" cy="-7" r="2.2" fill="#C2410C" opacity="0.8" />
              <circle cx="-2" cy="-9" r="2.2" fill="#C2410C" opacity="0.8" />
              <circle cx="3" cy="-9" r="2.2" fill="#C2410C" opacity="0.8" />
              <circle cx="7" cy="-7" r="2.2" fill="#C2410C" opacity="0.8" />
            </g>
          </g>

          {/* ---------------------------------------------------- */}
          {/* THE HAPPY TROTTING PUPPY (Moving along the path) */}
          {/* ---------------------------------------------------- */}
          <g id="happyPupGroup" className="anim-trotting-pup">
            {/* Pup Shadow */}
            <ellipse cx="30" cy="50" rx="22" ry="6" fill="#78350F" opacity="0.25" className="pup-shadow" />

            {/* Tail (Wagging happily!) */}
            <path
              d="M10,25 Q-6,14 -2,2"
              fill="none"
              stroke="#D97706"
              strokeWidth="6"
              strokeLinecap="round"
              className="anim-tail-wag"
            />

            {/* Back Leg (Far) */}
            <path d="M16,36 L14,48 L8,49" fill="none" stroke="#B45309" strokeWidth="5" strokeLinecap="round" className="leg-back-far" />

            {/* Back Leg (Near) */}
            <path d="M22,36 L24,48 L30,49" fill="none" stroke="#D97706" strokeWidth="5" strokeLinecap="round" className="leg-back-near" />

            {/* Dog Body (Warm golden fur) */}
            <ellipse cx="32" cy="30" rx="20" ry="14" fill="#F59E0B" />

            {/* Front Leg (Far) */}
            <path d="M40,36 L38,48 L34,49" fill="none" stroke="#B45309" strokeWidth="5" strokeLinecap="round" className="leg-front-far" />

            {/* Front Leg (Near) */}
            <path d="M46,36 L48,48 L54,49" fill="none" stroke="#D97706" strokeWidth="5" strokeLinecap="round" className="leg-front-near" />

            {/* Red Collar with Little Golden Bell */}
            <path d="M46,24 Q49,29 48,34" fill="none" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
            <circle cx="49" cy="34" r="2.5" fill="#FDE047" />

            {/* Dog Head */}
            <circle cx="52" cy="20" r="13" fill="#FBBF24" />

            {/* Muzzle / Snout */}
            <ellipse cx="61" cy="23" rx="7" ry="5.5" fill="#FDE68A" />
            {/* Cute Black Nose */}
            <circle cx="67" cy="21" r="2.5" fill="#1F2937" />
            {/* Smiling Mouth */}
            <path d="M63,25 Q65,28 68,25" fill="none" stroke="#1F2937" strokeWidth="1.2" strokeLinecap="round" />
            {/* Happy Little Tongue */}
            <ellipse cx="65" cy="27" rx="2.5" ry="2" fill="#FB7185" />

            {/* Happy Closed Wink / Curved Eye */}
            <path d="M54,16 Q57,13 60,16" fill="none" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />

            {/* Cute Floppy Ear (Bouncing in the wind) */}
            <ellipse cx="44" cy="18" rx="5.5" ry="10" fill="#D97706" transform="rotate(-20 44 18)" className="anim-floppy-ear" />

            {/* Little floating heart from the pup */}
            <text x="58" y="4" fontSize="12" className="pup-love-heart">💖</text>
          </g>
        </svg>
      </div>

      {/* Joyous Header & Happiness Banner */}
      <div className="animation-details-banner">
        <div className="home-badge-row">
          <span className="safe-home-glow-badge">
            <ShieldCheck size={16} />
            <span>SAFE AT HOME WITH FAMILY</span>
          </span>
          <span className="happiness-stars">
            <Sparkles size={14} className="text-amber-500" />
            <span>Pure Happiness & Relief</span>
          </span>
        </div>

        <h3 className="animation-hero-title">
          {dogName} is Happily Relaxing at Home! 🏡🐶💖
        </h3>
        <p className="animation-hero-desc">
          Tail wagging, warm meal, and all the love in the world! Your pet is safe and protected indoors. No active search alert is broadcasted to the community network.
        </p>
      </div>
    </div>
  );
};
