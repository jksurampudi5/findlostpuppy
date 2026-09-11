import React, { useEffect, useState } from 'react';
import { Sparkles, ShieldCheck, RotateCcw } from 'lucide-react';
import { triggerStarCelebration } from '../utils/confettiHelper';

interface DogGoingHomeAnimationProps {
  dogName?: string;
}

export const DogGoingHomeAnimation: React.FC<DogGoingHomeAnimationProps> = ({ dogName = 'Your Pup' }) => {
  const [animationKey, setAnimationKey] = useState<number>(0);

  useEffect(() => {
    // Trigger celebration confetti on mount/replay
    triggerStarCelebration();
  }, [animationKey]);

  const handleReplay = () => {
    setAnimationKey((prev) => prev + 1);
  };

  return (
    <div className="dog-home-animation-card premium-story-card" key={animationKey}>
      {/* Atmosphere Floating Particles */}
      <div className="animation-atmosphere" aria-hidden="true">
        <span className="floating-anim-particle p-heart-1">💖</span>
        <span className="floating-anim-particle p-heart-2">💕</span>
        <span className="floating-anim-particle p-heart-3">✨</span>
        <span className="floating-anim-particle p-star-1">⭐</span>
        <span className="floating-anim-particle p-star-2">🌟</span>
        <span className="floating-anim-particle p-heart-4">🐾</span>
      </div>

      {/* Main Animated Stage (SVG Canvas) */}
      <div className="animation-scene-stage storybook-stage">
        <svg
          viewBox="0 0 720 280"
          className="scene-svg reunion-stage-svg"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Sky Gradient */}
            <linearGradient id="storybookSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7DD3FC" />
              <stop offset="35%" stopColor="#BAE6FD" />
              <stop offset="70%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#FEF3C7" />
            </linearGradient>

            {/* Sun Glow */}
            <radialGradient id="sunBeams" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFBEB" stopOpacity="1" />
              <stop offset="30%" stopColor="#FEF08A" stopOpacity="0.85" />
              <stop offset="65%" stopColor="#FDE047" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
            </radialGradient>

            {/* Lush Meadow Grass Gradients */}
            <linearGradient id="distantHillsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="100%" stopColor="#6EE7B7" />
            </linearGradient>

            <linearGradient id="meadowGrassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="35%" stopColor="#4ADE80" />
              <stop offset="75%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>

            {/* House Wall Wood Gradient */}
            <linearGradient id="cottageWallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="40%" stopColor="#FEF3C7" />
              <stop offset="100%" stopColor="#FDE68A" />
            </linearGradient>

            {/* Cedar Tile Roof Gradient */}
            <linearGradient id="cedarRoofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FB923C" />
              <stop offset="50%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#C2410C" />
            </linearGradient>

            {/* Doorway Cozy Amber Interior Light */}
            <radialGradient id="doorwayWarmth" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFBEB" stopOpacity="1" />
              <stop offset="35%" stopColor="#FEF08A" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#FDE047" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.4" />
            </radialGradient>

            {/* Hug Celebration Glow */}
            <radialGradient id="reunionHaloGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFBEB" stopOpacity="1" />
              <stop offset="35%" stopColor="#FEF08A" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 1. Sky Canvas */}
          <rect width="720" height="280" rx="20" fill="url(#storybookSky)" />

          {/* Golden Morning Sun with Rotating Ray Beams */}
          <g className="anim-sun-group" transform="translate(90, 52)">
            <circle cx="0" cy="0" r="50" fill="url(#sunBeams)" />
            <circle cx="0" cy="0" r="28" fill="#FDE047" opacity="0.95" />
            <circle cx="0" cy="0" r="22" fill="#FACC15" />
          </g>

          {/* Animated Drifting Soft Clouds */}
          <g className="anim-cloud-1" opacity="0.9">
            <path d="M120,38 Q132,24 150,28 Q162,14 184,18 Q206,12 218,28 Q234,26 240,40 Q246,54 230,58 L126,58 Q110,54 120,38 Z" fill="#FFFFFF" />
          </g>
          <g className="anim-cloud-2" opacity="0.8">
            <path d="M300,50 Q310,38 324,42 Q336,30 354,34 Q370,28 380,42 Q394,40 398,52 Q402,64 388,68 L306,68 Q294,64 300,50 Z" fill="#FFFFFF" />
          </g>

          {/* 2. Layered Rolling Green Hills */}
          <path d="M0,175 Q180,120 360,158 T720,146 L720,280 L0,280 Z" fill="url(#distantHillsGrad)" opacity="0.75" />
          <path d="M0,185 Q220,145 440,175 T720,165 L720,280 L0,280 Z" fill="#6EE7B7" opacity="0.6" />

          {/* 3. Lush Green Meadow Lawn (Dog walks firmly on ground y: 205-210) */}
          <path d="M0,170 Q210,148 420,170 T720,160 L720,280 L0,280 Z" fill="url(#meadowGrassGrad)" />

          {/* Wildflower Meadow Flowers */}
          <g opacity="0.95">
            {/* Daisies */}
            <circle cx="50" cy="240" r="4.5" fill="#FFFFFF" />
            <circle cx="50" cy="240" r="2" fill="#FBBF24" />
            <circle cx="130" cy="225" r="5" fill="#FFFFFF" />
            <circle cx="130" cy="225" r="2.2" fill="#F59E0B" />
            <circle cx="230" cy="250" r="5.5" fill="#FFFFFF" />
            <circle cx="230" cy="250" r="2.5" fill="#FBBF24" />
            <circle cx="340" cy="220" r="4.5" fill="#FFFFFF" />
            <circle cx="340" cy="220" r="2" fill="#F59E0B" />
            <circle cx="430" cy="240" r="5" fill="#FFFFFF" />
            <circle cx="430" cy="240" r="2.2" fill="#FBBF24" />

            {/* Lavender & Tulips */}
            <circle cx="90" cy="232" r="4" fill="#C084FC" />
            <circle cx="180" cy="218" r="4.5" fill="#FB7185" />
            <circle cx="280" cy="236" r="4.5" fill="#F43F5E" />
            <circle cx="385" cy="228" r="4" fill="#C084FC" />
            <circle cx="475" cy="224" r="4.5" fill="#FB7185" />
          </g>

          {/* Meadow Grass Tuft Blades */}
          <g stroke="#166534" strokeWidth="2" strokeLinecap="round" opacity="0.7">
            <path d="M80,245 L76,233 M80,245 L84,235" />
            <path d="M165,230 L162,218 M165,230 L169,220" />
            <path d="M265,242 L261,230 M265,242 L268,232" />
            <path d="M360,225 L357,214 M360,225 L364,216" />
            <path d="M445,232 L442,222 M445,232 L448,224" />
          </g>

          {/* Fluttering Garden Butterflies */}
          <g className="anim-butterfly-1" transform="translate(190, 160)">
            <path d="M0,0 Q-4,-8 -8,-6 Q-10,-2 -4,0 Q-10,2 -6,6 Q-2,4 0,0" fill="#F472B6" opacity="0.85" />
            <path d="M0,0 Q4,-8 8,-6 Q10,-2 4,0 Q10,2 6,6 Q2,4 0,0" fill="#FB7185" opacity="0.85" />
          </g>
          <g className="anim-butterfly-2" transform="translate(370, 150)">
            <path d="M0,0 Q-4,-8 -8,-6 Q-10,-2 -4,0 Q-10,2 -6,6 Q-2,4 0,0" fill="#FBBF24" opacity="0.85" />
            <path d="M0,0 Q4,-8 8,-6 Q10,-2 4,0 Q10,2 6,6 Q2,4 0,0" fill="#F59E0B" opacity="0.85" />
          </g>

          {/* ------------------------------------------------------------------ */}
          {/* 4. THE CHARMING STORYBOOK COTTAGE */}
          {/* ------------------------------------------------------------------ */}
          <g id="storybookCottageGroup" transform="translate(480, 48)">
            {/* Brick Chimney & Rising Smoke Rings */}
            <rect x="120" y="6" width="24" height="46" rx="3" fill="#9A3412" stroke="#78350F" strokeWidth="1.5" />
            <rect x="118" y="4" width="28" height="6" rx="2" fill="#78350F" />
            {/* Brick Lines */}
            <line x1="120" y1="18" x2="144" y2="18" stroke="#78350F" strokeWidth="1" />
            <line x1="120" y1="30" x2="144" y2="30" stroke="#78350F" strokeWidth="1" />
            <line x1="120" y1="42" x2="144" y2="42" stroke="#78350F" strokeWidth="1" />
            {/* Smoke Puffs */}
            <circle cx="132" cy="-4" r="8" fill="#FFFFFF" opacity="0.75" className="anim-smoke puff-1" />
            <circle cx="137" cy="-22" r="10" fill="#FFFFFF" opacity="0.55" className="anim-smoke puff-2" />
            <circle cx="143" cy="-42" r="12" fill="#FFFFFF" opacity="0.35" className="anim-smoke puff-3" />

            {/* Main Cottage Body */}
            <rect x="20" y="55" width="170" height="120" rx="8" fill="url(#cottageWallGrad)" stroke="#FDE68A" strokeWidth="2.5" />

            {/* Cedar Shingle Pitched Roof */}
            <polygon points="10,60 105,4 200,60" fill="url(#cedarRoofGrad)" />
            <polygon points="14,60 105,8 196,60" fill="#FB923C" opacity="0.4" />
            {/* Roof Shingle Ridges */}
            <line x1="35" y1="48" x2="175" y2="48" stroke="#78350F" strokeWidth="1.5" opacity="0.4" />
            <line x1="55" y1="34" x2="155" y2="34" stroke="#78350F" strokeWidth="1.5" opacity="0.4" />
            <line x1="80" y1="20" x2="130" y2="20" stroke="#78350F" strokeWidth="1.5" opacity="0.4" />

            {/* Attic Heart Rose Window */}
            <circle cx="105" cy="36" r="13" fill="#FEF3C7" stroke="#EA580C" strokeWidth="2" />
            <text x="105" y="41" textAnchor="middle" fontSize="14">💖</text>

            {/* Side Multi-Pane Window with Curtains & Golden Light */}
            <rect x="36" y="80" width="36" height="38" rx="4" fill="#FEF08A" stroke="#F59E0B" strokeWidth="2" />
            {/* Window Glass Grid */}
            <line x1="54" y1="80" x2="54" y2="118" stroke="#F59E0B" strokeWidth="1.8" />
            <line x1="36" y1="99" x2="72" y2="99" stroke="#F59E0B" strokeWidth="1.8" />
            {/* Cozy Curtains */}
            <path d="M36,80 Q45,95 36,110 L36,80 Z" fill="#FB923C" opacity="0.85" />
            <path d="M72,80 Q63,95 72,110 L72,80 Z" fill="#FB923C" opacity="0.85" />

            {/* Front Porch Wooden Base & Step Level (Aligned with ground level) */}
            <rect x="80" y="160" width="80" height="15" rx="3" fill="#D97706" />
            <rect x="74" y="168" width="92" height="9" rx="2" fill="#B45309" />

            {/* Doorway Cozy Interior Golden Light */}
            <rect x="94" y="74" width="52" height="98" rx="4" fill="url(#doorwayWarmth)" stroke="#B45309" strokeWidth="1.5" />

            {/* The Front Door (Hinged opening) */}
            <g className="anim-front-door">
              <rect x="94" y="74" width="52" height="98" rx="4" fill="#78350F" stroke="#451A03" strokeWidth="2" />
              {/* Door Carvings */}
              <rect x="100" y="82" width="18" height="40" rx="2" fill="#92400E" />
              <rect x="122" y="82" width="18" height="40" rx="2" fill="#92400E" />
              <rect x="100" y="128" width="18" height="38" rx="2" fill="#92400E" />
              <rect x="122" y="128" width="18" height="38" rx="2" fill="#92400E" />
              {/* Brass Knob */}
              <circle cx="101" cy="126" r="3.5" fill="#FDE047" />
            </g>

            {/* Porch Welcome Mat (Clean, no text labels) */}
            <ellipse cx="120" cy="168" rx="24" ry="6" fill="#78350F" opacity="0.75" />

            {/* Glowing Porch Lantern */}
            <circle cx="80" cy="88" r="7" fill="#FDE047" className="anim-lantern-glow" />
            <rect x="77" y="81" width="6" height="11" rx="1.5" fill="#1F2937" />

            {/* Flower Pots & Hanging Baskets by Porch */}
            <circle cx="26" cy="165" r="14" fill="#22C55E" />
            <circle cx="22" cy="158" r="4.5" fill="#F43F5E" />
            <circle cx="30" cy="162" r="4" fill="#FB7185" />
            <circle cx="180" cy="165" r="15" fill="#22C55E" />
            <circle cx="176" cy="158" r="5" fill="#F43F5E" />
            <circle cx="186" cy="160" r="4.5" fill="#FBBF24" />
          </g>

          {/* ------------------------------------------------------------------ */}
          {/* 5. PET OWNER FIGURE (Warm Greeting, Welcoming Hands, Ground Hug & Walks Inside) */}
          {/* ------------------------------------------------------------------ */}
          <g id="ownerFigureGroup" className="anim-owner-reunion-flow">
            {/* Listening Sound Bubble when hearing dog bark */}
            <g className="anim-owner-listening-bubble" transform="translate(595, 96)">
              <ellipse cx="0" cy="0" rx="28" ry="17" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.8" />
              <polygon points="-8,15 0,25 5,15" fill="#FFFFFF" />
              <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="#B45309">
                {dogName}! 👂💖
              </text>
            </g>

            {/* Owner standing firmly on porch floor */}
            <g transform="translate(570, 142)">
              {/* Owner Ground Shadow */}
              <ellipse cx="10" cy="72" rx="20" ry="6" fill="#78350F" opacity="0.32" />

              {/* Legs / Trousers (Navy) */}
              <path d="M4,42 L2,70 L-4,72" fill="none" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round" />
              <path d="M14,42 L16,70 L22,72" fill="none" stroke="#1E40AF" strokeWidth="6" strokeLinecap="round" />

              {/* Cozy Knitted Sweater (Terracotta Orange) */}
              <ellipse cx="10" cy="28" rx="15" ry="18" fill="#EA580C" />
              <ellipse cx="10" cy="12" rx="7" ry="3.5" fill="#C2410C" />

              {/* Head */}
              <circle cx="10" cy="0" r="11.5" fill="#FCD34D" />
              {/* Hair */}
              <path d="M-2,-7 Q10,-15 22,-7 Q23,6 19,10 Q16,-8 2, -2 Z" fill="#78350F" />
              {/* Smiling Happy Eyes */}
              <path d="M5,-1 Q7,-4 9,-1" fill="none" stroke="#1F2937" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M12,-1 Q14,-4 16,-1" fill="none" stroke="#1F2937" strokeWidth="1.6" strokeLinecap="round" />
              {/* Joyful Beaming Smile */}
              <path d="M7,4 Q10,9 13,4 Z" fill="#DC2626" />
              {/* Cheerful Blushing Cheeks */}
              <ellipse cx="3,3" rx="2.8" ry="1.8" fill="#F87171" opacity="0.85" />
              <ellipse cx="17,3" rx="2.8" ry="1.8" fill="#F87171" opacity="0.85" />

              {/* Left Welcoming Arm & Hand (Open palm welcoming pet inside) */}
              <g className="anim-welcoming-arm-left">
                <path d="M-2,20 Q-14,28 -18,40" fill="none" stroke="#EA580C" strokeWidth="5.5" strokeLinecap="round" />
                <circle cx="-19" cy="42" r="3.8" fill="#FCD34D" />
                <path d="M-21,41 L-25,43" stroke="#FCD34D" strokeWidth="1.6" strokeLinecap="round" />
              </g>

              {/* Right Welcoming Arm & Hand (Gently reaching down to pet/hug dog on ground) */}
              <g className="anim-welcoming-arm-right">
                <path d="M22,20 Q28,28 24,40" fill="none" stroke="#C2410C" strokeWidth="5.5" strokeLinecap="round" />
                <circle cx="23" cy="42" r="3.8" fill="#FCD34D" />
                <path d="M25,41 L28,43" stroke="#FCD34D" strokeWidth="1.6" strokeLinecap="round" />
              </g>
            </g>
          </g>

          {/* ------------------------------------------------------------------ */}
          {/* 6. THE DOG: Grounded Walking on Grass, Barking, Welcomed & Walks Inside */}
          {/* ------------------------------------------------------------------ */}
          <g id="groundedDogGroup" className="anim-dog-grounded-flow">
            {/* Barking Speech Bubble & Sound Notes */}
            <g className="anim-dog-bark-bubble" transform="translate(68, -16)">
              <ellipse cx="0" cy="0" rx="32" ry="17" fill="#FFFFFF" stroke="#EA580C" strokeWidth="2" />
              <polygon points="-6,15 -15,26 3,16" fill="#FFFFFF" />
              <text x="0" y="4" textAnchor="middle" fontSize="12" fontWeight="800" fill="#C2410C">
                Woof! 🐾
              </text>
              <path d="M36,-9 A13,13 0 0,1 36,9" fill="none" stroke="#EA580C" strokeWidth="2.2" strokeLinecap="round" className="anim-wave-1" />
              <path d="M43,-14 A19,19 0 0,1 43,14" fill="none" stroke="#F97316" strokeWidth="2.2" strokeLinecap="round" className="anim-wave-2" />
            </g>

            {/* Ground Shadow on Grass (Stays firmly on ground at all times!) */}
            <ellipse cx="30" cy="52" rx="22" ry="6" fill="#15803D" opacity="0.4" className="pup-shadow-ground" />

            {/* Wagging Tail */}
            <path
              d="M8,26 Q-10,12 -5,-2"
              fill="none"
              stroke="#D97706"
              strokeWidth="6"
              strokeLinecap="round"
              className="anim-excited-tail"
            />

            {/* Back Legs (Walking step movement on ground) */}
            <path d="M14,36 L12,50 L6,51" fill="none" stroke="#B45309" strokeWidth="5" strokeLinecap="round" className="leg-back-far" />
            <path d="M21,36 L23,50 L30,51" fill="none" stroke="#D97706" strokeWidth="5" strokeLinecap="round" className="leg-back-near" />

            {/* Dog Body (Golden Retriever Fur) */}
            <ellipse cx="32" cy="30" rx="21" ry="14.5" fill="#F59E0B" />

            {/* Front Legs (Walking step movement on ground) */}
            <path d="M40,36 L38,50 L33,51" fill="none" stroke="#B45309" strokeWidth="5" strokeLinecap="round" className="leg-front-far" />
            <path d="M47,36 L49,50 L56,51" fill="none" stroke="#D97706" strokeWidth="5" strokeLinecap="round" className="leg-front-near" />

            {/* Red Collar & Golden Medallion Bell */}
            <path d="M46,24 Q49,29 48,34" fill="none" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="49" cy="34" r="2.8" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.8" />

            {/* Dog Head */}
            <circle cx="52" cy="20" r="13.5" fill="#FBBF24" />

            {/* Snout & Cute Face */}
            <ellipse cx="62" cy="23" rx="7.2" ry="5.5" fill="#FDE68A" />
            <circle cx="68" cy="21" r="2.5" fill="#1F2937" />
            {/* Smiling Mouth & Happy Pink Tongue */}
            <path d="M63,25 Q66,30 69,25" fill="none" stroke="#1F2937" strokeWidth="1.4" strokeLinecap="round" />
            <ellipse cx="66" cy="27" rx="2.8" ry="2.2" fill="#FB7185" />

            {/* Sparkling Happy Curved Eyes */}
            <path d="M54,15 Q57,12 60,15" fill="none" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />

            {/* Floppy Ear Bobbing */}
            <ellipse cx="44" cy="18" rx="5.5" ry="10" fill="#D97706" transform="rotate(-18 44 18)" className="anim-floppy-ear" />
          </g>

          {/* ------------------------------------------------------------------ */}
          {/* 7. REUNION CELEBRATION HEARTS BURST (Around the ground reunion) */}
          {/* ------------------------------------------------------------------ */}
          <g className="anim-hug-celebration-burst" transform="translate(540, 190)">
            <circle cx="0" cy="0" r="55" fill="url(#reunionHaloGlow)" />
            <text x="-28" y="-32" fontSize="19" className="hug-heart h1">💖</text>
            <text x="24" y="-38" fontSize="20" className="hug-heart h2">💕</text>
            <text x="-36" y="8" fontSize="16" className="hug-heart h3">✨</text>
            <text x="30" y="4" fontSize="17" className="hug-heart h4">🐾</text>
            <text x="0" y="-48" fontSize="22" className="hug-heart h5">🥰</text>
            <text x="-16" y="-60" fontSize="14" className="hug-heart h6">⭐</text>
            <text x="18" y="-58" fontSize="14" className="hug-heart h7">🌟</text>
          </g>
        </svg>
      </div>

      {/* Joyous Header & Happiness Banner */}
      <div className="animation-details-banner">
        <div className="home-badge-row">
          <span className="safe-home-glow-badge">
            <ShieldCheck size={16} />
            <span>REUNITED SAFELY AT HOME</span>
          </span>
          <span className="happiness-stars">
            <Sparkles size={14} className="text-amber-500" />
            <span>Pure Happiness & Emotional Relief</span>
          </span>
          <button
            type="button"
            onClick={handleReplay}
            className="btn btn-xs btn-outline ml-auto flex items-center gap-1 replay-anim-btn"
            title="Replay Reunion Animation"
          >
            <RotateCcw size={12} />
            <span>Replay Story</span>
          </button>
        </div>

        <h3 className="animation-hero-title">
          {dogName} Walked Across the Meadow into Loving Arms and Safely Inside! 🏡🐶❤️
        </h3>
        <p className="animation-hero-desc">
          Barking with excitement across the grass, {dogName} was welcomed with open arms by {dogName}&apos;s owner, received a loving hug on the porch, and both happily walked inside the cozy home!
        </p>
      </div>
    </div>
  );
};
