import React, { useEffect, useRef } from 'react';
import { Sparkles, ShieldCheck, RotateCcw } from 'lucide-react';
import gsap from 'gsap';

interface DogGoingHomeAnimationProps {
  dogName?: string;
}

export const DogGoingHomeAnimation: React.FC<DogGoingHomeAnimationProps> = ({ dogName = 'Bruno' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const masterTimeline = useRef<gsap.core.Timeline | null>(null);

  // SVG element references
  const dogGroupRef = useRef<SVGGElement>(null);
  const dogHeadRef = useRef<SVGGElement>(null);
  const dogTailRef = useRef<SVGPathElement>(null);
  const dogBarkBubbleRef = useRef<SVGGElement>(null);
  const soundWave1Ref = useRef<SVGPathElement>(null);
  const soundWave2Ref = useRef<SVGPathElement>(null);

  const legFrontNearRef = useRef<SVGPathElement>(null);
  const legFrontFarRef = useRef<SVGPathElement>(null);
  const legBackNearRef = useRef<SVGPathElement>(null);
  const legBackFarRef = useRef<SVGPathElement>(null);

  const ownerGroupRef = useRef<SVGGElement>(null);
  const ownerSurpriseBubbleRef = useRef<SVGGElement>(null);
  const armLeftRef = useRef<SVGGElement>(null);
  const armRightPettingRef = useRef<SVGGElement>(null);

  const frontDoorRef = useRef<SVGGElement>(null);
  const celebrationHaloRef = useRef<SVGGElement>(null);
  const chimneySmokeRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Continuous organic micro-animations
      // Tail Wagging
      if (dogTailRef.current) {
        gsap.to(dogTailRef.current, {
          rotation: 32,
          transformOrigin: '8px 24px',
          duration: 0.14,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });
      }

      // Continuous 4-beat leg trot kinematics
      if (legFrontNearRef.current && legBackNearRef.current && legFrontFarRef.current && legBackFarRef.current) {
        gsap.to([legFrontNearRef.current, legBackFarRef.current], {
          rotation: 24,
          transformOrigin: 'center top',
          duration: 0.2,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });
        gsap.to([legFrontFarRef.current, legBackNearRef.current], {
          rotation: -24,
          transformOrigin: 'center top',
          duration: 0.2,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });
      }

      // Chimney Smoke Continuous Rising
      if (chimneySmokeRef.current) {
        const puffs = chimneySmokeRef.current.querySelectorAll('.anim-smoke-puff');
        puffs.forEach((puff, idx) => {
          gsap.to(puff, {
            y: -32,
            x: 12,
            opacity: 0,
            scale: 1.5,
            duration: 2.6,
            repeat: -1,
            delay: idx * 0.8,
            ease: 'power1.out',
          });
        });
      }

      // 2. Master Story Timeline (10.0s total cycle)
      const tl = gsap.timeline({
        repeat: -1,
        repeatDelay: 0.8,
      });

      masterTimeline.current = tl;

      // Initial State Setters
      gsap.set(dogGroupRef.current, { x: 30, y: 195, scale: 0.9, opacity: 0 });
      gsap.set(dogBarkBubbleRef.current, { scale: 0.88, opacity: 0, transformOrigin: 'center center' });
      gsap.set([soundWave1Ref.current, soundWave2Ref.current], { opacity: 0, scale: 0.8, transformOrigin: 'center center' });
      gsap.set(ownerGroupRef.current, { x: 20, y: 0, opacity: 0 });
      gsap.set(ownerSurpriseBubbleRef.current, { scale: 0.88, opacity: 0, transformOrigin: 'center center' });
      gsap.set(frontDoorRef.current, { scaleX: 1, transformOrigin: '96px 80px' });
      gsap.set(celebrationHaloRef.current, { scale: 0.88, opacity: 0, transformOrigin: 'center center' });
      gsap.set(armLeftRef.current, { rotation: 0, transformOrigin: '-2px 18px' });
      gsap.set(armRightPettingRef.current, { rotation: 0, transformOrigin: '18px 14px' });

      // ===================================================================
      // 1. MEADOW SEARCH (0.0s - 2.0s): Lost dog trotting looking for home
      // ===================================================================
      tl.addLabel('meadow', 0)
        .to(dogGroupRef.current, { opacity: 1, duration: 0.35, ease: 'power1.out' }, 'meadow')
        .to(dogGroupRef.current, { x: 190, duration: 2.0, ease: 'sine.inOut' }, 'meadow');

      // ===================================================================
      // 2. BARKING "BOW BOW!" (2.0s - 3.2s): Dog halts & barks with soundwaves
      // ===================================================================
      tl.addLabel('bark', 2.0)
        .to(dogHeadRef.current, { y: -4, rotation: -10, duration: 0.2, yoyo: true, repeat: 3, transformOrigin: '50px 16px', ease: 'power1.inOut' }, 'bark')
        .to(dogBarkBubbleRef.current, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.8)' }, 'bark')
        .to(soundWave1Ref.current, { opacity: 1, scale: 1.25, duration: 0.5, repeat: 1, yoyo: true, ease: 'sine.inOut' }, 'bark+=0.1')
        .to(soundWave2Ref.current, { opacity: 1, scale: 1.4, duration: 0.5, repeat: 1, yoyo: true, ease: 'sine.inOut' }, 'bark+=0.25')
        .to(dogBarkBubbleRef.current, { opacity: 0, scale: 0.9, duration: 0.3, ease: 'power2.in' }, 'bark+=1.0');

      // ===================================================================
      // 3. DOOR OPENS & OVERJOYED SURPRISE (3.2s - 4.6s)
      // ===================================================================
      tl.addLabel('surprise', 3.2)
        // Door hinges open with golden warm light
        .to(frontDoorRef.current, { scaleX: 0.08, duration: 0.5, ease: 'power2.out' }, 'surprise')
        // Owner steps out on porch with wide joyful eyes
        .to(ownerGroupRef.current, { x: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }, 'surprise+=0.1')
        // Joyful Speech Bubble: "{dogName}! 🥹💖"
        .to(ownerSurpriseBubbleRef.current, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.8)' }, 'surprise+=0.25')
        // Arms open wide welcoming the pup
        .to(armLeftRef.current, { rotation: -20, duration: 0.5, ease: 'power1.out' }, 'surprise+=0.35')
        .to(armRightPettingRef.current, { rotation: 18, duration: 0.5, ease: 'power1.out' }, 'surprise+=0.35')
        .to(ownerSurpriseBubbleRef.current, { opacity: 0, scale: 0.9, duration: 0.3, ease: 'power2.in' }, 'surprise+=1.2');

      // ===================================================================
      // 4. THE SPRINT (4.6s - 6.2s): Dog runs fast across grass to porch
      // ===================================================================
      tl.addLabel('sprint', 4.6)
        .to(dogGroupRef.current, {
          x: 480,
          y: 195,
          scale: 0.82,
          duration: 1.6,
          ease: 'power2.inOut',
        }, 'sprint');

      // ===================================================================
      // 5. LOVING HUG & HEAD PETTING (6.2s - 8.2s): Reunion embrace
      // ===================================================================
      tl.addLabel('hug', 6.2)
        // Dog reaches owner on porch
        .to(dogGroupRef.current, { x: 495, y: 195, scale: 0.8, duration: 0.3, ease: 'power1.out' }, 'hug')
        // Owner kneels/leans down to pup
        .to(ownerGroupRef.current, { x: -16, y: 5, duration: 0.4, ease: 'power2.out' }, 'hug')
        // Left arm wraps in warm hug
        .to(armLeftRef.current, { rotation: -28, duration: 0.4, ease: 'power2.out' }, 'hug')
        // Burst of celebration hearts & stars halo
        .to(celebrationHaloRef.current, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.6)' }, 'hug+=0.1')
        // Right hand gently strokes/pets the dog's head
        .to(armRightPettingRef.current, {
          rotation: 30,
          y: 3,
          duration: 0.2,
          yoyo: true,
          repeat: 7,
          ease: 'sine.inOut',
        }, 'hug+=0.15')
        // Halo gently fades
        .to(celebrationHaloRef.current, { opacity: 0, scale: 0.92, duration: 0.4, ease: 'power2.in' }, 'hug+=1.7');

      // ===================================================================
      // 6. GOING INSIDE TOGETHER & DOOR SHUT (8.2s - 9.8s)
      // ===================================================================
      tl.addLabel('inside', 8.2)
        // Owner stands up happily
        .to(ownerGroupRef.current, { y: 0, duration: 0.35, ease: 'power2.out' }, 'inside')
        .to(armLeftRef.current, { rotation: 0, duration: 0.3 }, 'inside')
        .to(armRightPettingRef.current, { rotation: 0, y: 0, duration: 0.3 }, 'inside')
        // Dog happily trots into the warm glowing doorway
        .to(dogGroupRef.current, { x: 545, y: 192, scale: 0.68, opacity: 0.9, duration: 0.5, ease: 'power1.in' }, 'inside+=0.2')
        .to(dogGroupRef.current, { x: 575, y: 190, scale: 0.54, opacity: 0, duration: 0.5, ease: 'power1.in' }, 'inside+=0.7')
        // Owner steps in right behind
        .to(ownerGroupRef.current, { x: 14, scale: 0.88, opacity: 0, duration: 0.6, ease: 'power1.in' }, 'inside+=0.6')
        // Front door swings shut with satisfying click
        .to(frontDoorRef.current, { scaleX: 1, duration: 0.45, ease: 'power3.in' }, 'inside+=1.1');
    }, containerRef);

    return () => ctx.revert();
  }, [dogName]);

  const handleReplay = () => {
    if (masterTimeline.current) {
      masterTimeline.current.restart();
    }
  };

  return (
    <div className="dog-home-animation-card premium-story-card relative overflow-hidden" ref={containerRef}>
      {/* Floating Atmosphere Particles */}
      <div className="animation-atmosphere" aria-hidden="true">
        <span className="floating-anim-particle p-heart-1">💖</span>
        <span className="floating-anim-particle p-heart-2">💕</span>
        <span className="floating-anim-particle p-heart-3">✨</span>
        <span className="floating-anim-particle p-star-1">⭐</span>
        <span className="floating-anim-particle p-star-2">🌟</span>
        <span className="floating-anim-particle p-heart-4">🐾</span>
      </div>

      {/* Main Storybook Canvas Stage */}
      <div className="animation-scene-stage storybook-stage relative rounded-2xl overflow-hidden shadow-lg border border-amber-200/60 bg-sky-100">
        <svg
          viewBox="0 0 760 300"
          className="scene-svg reunion-stage-svg w-full h-auto block"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Sky Gradient */}
            <linearGradient id="storybookSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="30%" stopColor="#93C5FD" />
              <stop offset="65%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#FEF3C7" />
            </linearGradient>

            {/* Sun Glow */}
            <radialGradient id="sunGlowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFBEB" stopOpacity="1" />
              <stop offset="35%" stopColor="#FEF08A" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#FDE047" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
            </radialGradient>

            {/* Lush Meadow Grass Gradients */}
            <linearGradient id="distantHillsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="100%" stopColor="#6EE7B7" />
            </linearGradient>

            <linearGradient id="meadowGrassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="30%" stopColor="#4ADE80" />
              <stop offset="70%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>

            {/* House Wall Cream Wood */}
            <linearGradient id="cottageWallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="45%" stopColor="#FEF3C7" />
              <stop offset="100%" stopColor="#FDE68A" />
            </linearGradient>

            {/* Cedar Tile Roof Gradient */}
            <linearGradient id="cedarRoofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FB923C" />
              <stop offset="50%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#9A3412" />
            </linearGradient>

            {/* Doorway Cozy Amber Interior Light */}
            <radialGradient id="doorwayWarmth" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFBEB" stopOpacity="1" />
              <stop offset="35%" stopColor="#FEF08A" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#FDE047" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.5" />
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
          <rect width="760" height="300" rx="16" fill="url(#storybookSky)" />

          {/* Golden Sun with Radiant Beams */}
          <g className="anim-sun-group" transform="translate(100, 56)">
            <circle cx="0" cy="0" r="54" fill="url(#sunGlowGrad)" />
            <circle cx="0" cy="0" r="30" fill="#FDE047" opacity="0.95" />
            <circle cx="0" cy="0" r="23" fill="#FACC15" />
          </g>

          {/* Drifting Clouds */}
          <g className="anim-cloud-1" opacity="0.92">
            <path d="M120,40 Q135,24 155,28 Q168,12 192,16 Q216,10 230,28 Q248,26 254,42 Q260,58 242,62 L128,62 Q110,58 120,40 Z" fill="#FFFFFF" />
          </g>
          <g className="anim-cloud-2" opacity="0.85">
            <path d="M320,52 Q332,38 348,42 Q362,28 382,32 Q400,26 412,42 Q428,40 432,54 Q436,68 420,72 L326,72 Q312,68 320,52 Z" fill="#FFFFFF" />
          </g>

          {/* 2. Layered Rolling Green Hills */}
          <path d="M0,185 Q200,125 400,165 T760,152 L760,300 L0,300 Z" fill="url(#distantHillsGrad)" opacity="0.75" />
          <path d="M0,195 Q240,150 480,185 T760,172 L760,300 L0,300 Z" fill="#6EE7B7" opacity="0.65" />

          {/* 3. Lush Green Meadow Ground */}
          <path d="M0,180 Q230,155 460,180 T760,168 L760,300 L0,300 Z" fill="url(#meadowGrassGrad)" />

          {/* Wildflowers */}
          <g opacity="0.95">
            <circle cx="55" cy="255" r="4.5" fill="#FFFFFF" />
            <circle cx="55" cy="255" r="2" fill="#FBBF24" />
            <circle cx="140" cy="240" r="5" fill="#FFFFFF" />
            <circle cx="140" cy="240" r="2.2" fill="#F59E0B" />
            <circle cx="245" cy="265" r="5.5" fill="#FFFFFF" />
            <circle cx="245" cy="265" r="2.5" fill="#FBBF24" />
            <circle cx="360" cy="235" r="4.5" fill="#FFFFFF" />
            <circle cx="360" cy="235" r="2" fill="#F59E0B" />
            <circle cx="455" cy="255" r="5" fill="#FFFFFF" />
            <circle cx="455" cy="255" r="2.2" fill="#FBBF24" />

            <circle cx="95" cy="245" r="4" fill="#C084FC" />
            <circle cx="190" cy="232" r="4.5" fill="#FB7185" />
            <circle cx="295" cy="250" r="4.5" fill="#F43F5E" />
            <circle cx="405" cy="242" r="4" fill="#C084FC" />
          </g>

          {/* Grass Blades */}
          <g stroke="#166534" strokeWidth="2" strokeLinecap="round" opacity="0.75">
            <path d="M85,260 L81,246 M85,260 L89,248" />
            <path d="M175,245 L172,231 M175,245 L179,233" />
            <path d="M280,256 L276,242 M280,256 L283,244" />
            <path d="M380,238 L377,225 M380,238 L384,227" />
            <path d="M470,246 L467,234 M470,246 L473,236" />
          </g>

          {/* Butterflies */}
          <g className="anim-butterfly-1" transform="translate(200, 165)">
            <path d="M0,0 Q-4,-8 -8,-6 Q-10,-2 -4,0 Q-10,2 -6,6 Q-2,4 0,0" fill="#F472B6" opacity="0.85" />
            <path d="M0,0 Q4,-8 8,-6 Q10,-2 4,0 Q10,2 6,6 Q2,4 0,0" fill="#FB7185" opacity="0.85" />
          </g>
          <g className="anim-butterfly-2" transform="translate(390, 155)">
            <path d="M0,0 Q-4,-8 -8,-6 Q-10,-2 -4,0 Q-10,2 -6,6 Q-2,4 0,0" fill="#FBBF24" opacity="0.85" />
            <path d="M0,0 Q4,-8 8,-6 Q10,-2 4,0 Q10,2 6,6 Q2,4 0,0" fill="#F59E0B" opacity="0.85" />
          </g>

          {/* ------------------------------------------------------------------ */}
          {/* 4. THE CHARMING STORYBOOK COTTAGE */}
          {/* ------------------------------------------------------------------ */}
          <g id="storybookCottageGroup" transform="translate(510, 48)">
            {/* Chimney & Smoke */}
            <g ref={chimneySmokeRef}>
              <rect x="130" y="6" width="26" height="48" rx="3" fill="#9A3412" stroke="#78350F" strokeWidth="1.5" />
              <rect x="127" y="4" width="32" height="6" rx="2" fill="#78350F" />
              <circle cx="143" cy="-4" r="8" fill="#FFFFFF" opacity="0.75" className="anim-smoke-puff" />
              <circle cx="148" cy="-24" r="10" fill="#FFFFFF" opacity="0.55" className="anim-smoke-puff" />
              <circle cx="155" cy="-46" r="12" fill="#FFFFFF" opacity="0.35" className="anim-smoke-puff" />
            </g>

            {/* Main Cottage Body */}
            <rect x="20" y="55" width="190" height="135" rx="8" fill="url(#cottageWallGrad)" stroke="#FDE68A" strokeWidth="2.5" />

            {/* Cedar Tile Roof */}
            <polygon points="10,60 115,2 220,60" fill="url(#cedarRoofGrad)" />
            <polygon points="14,60 115,6 216,60" fill="#FB923C" opacity="0.35" />
            <line x1="35" y1="48" x2="195" y2="48" stroke="#78350F" strokeWidth="1.5" opacity="0.4" />
            <line x1="60" y1="32" x2="170" y2="32" stroke="#78350F" strokeWidth="1.5" opacity="0.4" />

            {/* Attic Heart Window */}
            <circle cx="115" cy="34" r="14" fill="#FEF3C7" stroke="#EA580C" strokeWidth="2" />
            <text x="115" y="40" textAnchor="middle" fontSize="15">💖</text>

            {/* Side Bay Window with Golden Amber Light */}
            <rect x="36" y="86" width="40" height="44" rx="4" fill="#FEF08A" stroke="#F59E0B" strokeWidth="2" />
            <line x1="56" y1="86" x2="56" y2="130" stroke="#F59E0B" strokeWidth="1.8" />
            <line x1="36" y1="108" x2="76" y2="108" stroke="#F59E0B" strokeWidth="1.8" />
            <path d="M36,86 Q46,102 36,120 L36,86 Z" fill="#FB923C" opacity="0.85" />
            <path d="M76,86 Q66,102 76,120 L76,86 Z" fill="#FB923C" opacity="0.85" />

            {/* Porch Steps Level with Ground */}
            <rect x="80" y="176" width="90" height="15" rx="3" fill="#D97706" />
            <rect x="74" y="184" width="102" height="9" rx="2" fill="#B45309" />

            {/* Cozy Doorway Amber Light */}
            <rect x="96" y="80" width="58" height="110" rx="4" fill="url(#doorwayWarmth)" stroke="#B45309" strokeWidth="1.5" />

            {/* Front Door (Hinged GSAP element) */}
            <g ref={frontDoorRef} style={{ transformOrigin: '96px 80px' }}>
              <rect x="96" y="80" width="58" height="110" rx="4" fill="#78350F" stroke="#451A03" strokeWidth="2" />
              <rect x="103" y="89" width="20" height="44" rx="2" fill="#92400E" />
              <rect x="127" y="89" width="20" height="44" rx="2" fill="#92400E" />
              <rect x="103" y="139" width="20" height="42" rx="2" fill="#92400E" />
              <rect x="127" y="139" width="20" height="42" rx="2" fill="#92400E" />
              <circle cx="104" cy="138" r="3.8" fill="#FDE047" />
            </g>

            {/* Welcome Porch Mat */}
            <ellipse cx="125" cy="184" rx="28" ry="6" fill="#78350F" opacity="0.75" />

            {/* Porch Lantern */}
            <circle cx="82" cy="94" r="8" fill="#FDE047" className="anim-lantern-glow" />
            <rect x="79" y="86" width="6" height="12" rx="1.5" fill="#1F2937" />

            {/* Flower Planter Pots */}
            <circle cx="26" cy="180" r="15" fill="#22C55E" />
            <circle cx="22" cy="172" r="5" fill="#F43F5E" />
            <circle cx="30" cy="176" r="4.5" fill="#FB7185" />
            <circle cx="200" cy="180" r="16" fill="#22C55E" />
            <circle cx="196" cy="172" r="5.5" fill="#F43F5E" />
            <circle cx="206" cy="174" r="5" fill="#FBBF24" />
          </g>

          {/* ------------------------------------------------------------------ */}
          {/* 5. PET OWNER FIGURE (Slender human model driven by GSAP) */}
          {/* ------------------------------------------------------------------ */}
          <g id="ownerFigureGroup" ref={ownerGroupRef}>
            {/* Joyful Surprise Bubble */}
            <g ref={ownerSurpriseBubbleRef} transform="translate(635, 102)">
              <ellipse cx="0" cy="0" rx="38" ry="20" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2.2" />
              <polygon points="-8,18 0,28 6,18" fill="#FFFFFF" />
              <text x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="900" fill="#B45309">
                {dogName}! 🥹💖
              </text>
            </g>

            {/* Owner Standing / Kneeling Figure */}
            <g transform="translate(605, 155)">
              <ellipse cx="10" cy="74" rx="17" ry="5" fill="#78350F" opacity="0.3" />

              {/* Slim Navy Jeans */}
              <path d="M6,40 L4,70 L0,72" fill="none" stroke="#1E3A8A" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M14,40 L16,70 L20,72" fill="none" stroke="#1E40AF" strokeWidth="4.5" strokeLinecap="round" />
              <ellipse cx="0" cy="72" rx="4.5" ry="2.2" fill="#0F172A" />
              <ellipse cx="20" cy="72" rx="4.5" ry="2.2" fill="#0F172A" />

              {/* Terracotta Jacket */}
              <path d="M2,12 L18,12 Q20,24 16,40 L4,40 Q0,24 2,12 Z" fill="#EA580C" stroke="#C2410C" strokeWidth="1.2" />
              <path d="M6,12 Q10,17 14,12 Z" fill="#F8FAFC" />
              <line x1="10" y1="16" x2="10" y2="40" stroke="#C2410C" strokeWidth="1" strokeDasharray="2 2" />

              {/* Neck & Head */}
              <rect x="8" y="7" width="4" height="6" rx="1.5" fill="#FBD5B5" />
              <ellipse cx="10" cy="1" rx="8" ry="9.5" fill="#FBD5B5" />
              <path d="M2,-3 Q10,-12 18,-3 Q20,4 17,7 Q15,-6 3, -1 Z" fill="#3B1D0E" />
              <path d="M3,0 L2,4 L4,2 Z" fill="#3B1D0E" />

              {/* Smiling Happy Eyes & Smile */}
              <path d="M6,0 Q8,-2.5 10,0" fill="none" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M11,0 Q13,-2.5 15,0" fill="none" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8,4.5 Q10.5,8 13,4.5 Z" fill="#DC2626" />
              <ellipse cx="5,3.5" rx="2" ry="1.2" fill="#F87171" opacity="0.8" />
              <ellipse cx="15,3.5" rx="2" ry="1.2" fill="#F87171" opacity="0.8" />

              {/* Left Hugging Arm */}
              <g ref={armLeftRef}>
                <path d="M2,14 Q-10,22 -16,34" fill="none" stroke="#EA580C" strokeWidth="4" strokeLinecap="round" />
                <circle cx="-17" cy="36" r="3" fill="#FBD5B5" />
                <path d="M-19,35 L-22,37" stroke="#FBD5B5" strokeWidth="1.2" strokeLinecap="round" />
              </g>

              {/* Right Petting Arm */}
              <g ref={armRightPettingRef}>
                <path d="M18,14 Q26,22 24,34" fill="none" stroke="#C2410C" strokeWidth="4" strokeLinecap="round" />
                <circle cx="23" cy="36" r="3" fill="#FBD5B5" />
                <path d="M25,35 L28,37" stroke="#FBD5B5" strokeWidth="1.2" strokeLinecap="round" />
              </g>
            </g>
          </g>

          {/* ------------------------------------------------------------------ */}
          {/* 6. THE DOG (Lean athletic Golden Retriever pup) */}
          {/* ------------------------------------------------------------------ */}
          <g id="groundedDogGroup" ref={dogGroupRef}>
            {/* Bark Speech Bubble */}
            <g ref={dogBarkBubbleRef} transform="translate(68, -18)">
              <ellipse cx="0" cy="0" rx="36" ry="19" fill="#FFFFFF" stroke="#EA580C" strokeWidth="2.2" />
              <polygon points="-6,17 -16,29 3,18" fill="#FFFFFF" />
              <text x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="900" fill="#C2410C">
                Bow Bow! 🐾
              </text>
              <path ref={soundWave1Ref} d="M40,-10 A14,14 0 0,1 40,10" fill="none" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
              <path ref={soundWave2Ref} d="M48,-15 A21,21 0 0,1 48,15" fill="none" stroke="#F97316" strokeWidth="2.4" strokeLinecap="round" />
            </g>

            {/* Grass Shadow */}
            <ellipse cx="32" cy="53" rx="19" ry="5.5" fill="#15803D" opacity="0.38" />

            {/* Tail */}
            <path
              ref={dogTailRef}
              d="M16,26 Q2,11 6,-3"
              fill="none"
              stroke="#D97706"
              strokeWidth="4.8"
              strokeLinecap="round"
            />

            {/* Back Legs */}
            <path ref={legBackFarRef} d="M16,30 L14,42 L10,50 L6,51" fill="none" stroke="#B45309" strokeWidth="3.8" strokeLinecap="round" />
            <path ref={legBackNearRef} d="M22,30 L24,42 L28,50 L32,51" fill="none" stroke="#D97706" strokeWidth="3.8" strokeLinecap="round" />

            {/* Slender Contoured Torso */}
            <path d="M16,28 Q24,19 38,21 Q46,23 48,29 Q46,36 36,35 Q22,36 16,28 Z" fill="#F59E0B" />
            <ellipse cx="40" cy="30" rx="7.5" ry="6.5" fill="#FBBF24" opacity="0.75" />

            {/* Front Legs */}
            <path ref={legFrontFarRef} d="M38,30 L36,42 L33,50 L30,51" fill="none" stroke="#B45309" strokeWidth="3.8" strokeLinecap="round" />
            <path ref={legFrontNearRef} d="M44,30 L46,42 L49,50 L53,51" fill="none" stroke="#D97706" strokeWidth="3.8" strokeLinecap="round" />

            {/* Neck & Collar */}
            <path d="M38,24 L46,15 L50,21 L42,28 Z" fill="#F59E0B" />
            <path d="M43,19 Q46,23 45,28" fill="none" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
            <circle cx="46" cy="28" r="2.4" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.6" />

            {/* Puppy Head */}
            <g ref={dogHeadRef}>
              <circle cx="50" cy="15" r="11" fill="#FBBF24" />
              {/* Snout & Smiling Mouth */}
              <ellipse cx="59" cy="17" rx="6.2" ry="4.5" fill="#FDE68A" />
              <circle cx="64" cy="15.5" r="2.2" fill="#1F2937" />
              <path d="M60,19 Q62.5,22.5 65,19" fill="none" stroke="#1F2937" strokeWidth="1.3" strokeLinecap="round" />
              <ellipse cx="62.5" cy="21" rx="2.4" ry="1.8" fill="#FB7185" />
              {/* Sparkling Eyes */}
              <path d="M51,11 Q53.5,8.5 56,11" fill="none" stroke="#1F2937" strokeWidth="1.7" strokeLinecap="round" />
              {/* Silky Floppy Ear */}
              <ellipse cx="43" cy="13" rx="4.5" ry="8.5" fill="#D97706" transform="rotate(-15 43 13)" className="anim-floppy-ear" />
            </g>
          </g>

          {/* ------------------------------------------------------------------ */}
          {/* 7. CELEBRATION HALO */}
          {/* ------------------------------------------------------------------ */}
          <g ref={celebrationHaloRef} transform="translate(565, 205)">
            <circle cx="0" cy="0" r="58" fill="url(#reunionHaloGlow)" />
            <text x="-28" y="-34" fontSize="20" className="hug-heart h1">💖</text>
            <text x="26" y="-40" fontSize="22" className="hug-heart h2">💕</text>
            <text x="-38" y="8" fontSize="17" className="hug-heart h3">✨</text>
            <text x="32" y="4" fontSize="18" className="hug-heart h4">🐾</text>
            <text x="0" y="-52" fontSize="24" className="hug-heart h5">🥰</text>
            <text x="-18" y="-64" fontSize="15" className="hug-heart h6">⭐</text>
            <text x="20" y="-62" fontSize="15" className="hug-heart h7">🌟</text>
          </g>
        </svg>

        {/* Minimal Floating Replay Button */}
        <button
          type="button"
          onClick={handleReplay}
          className="absolute top-3 right-3 btn btn-xs btn-circle bg-white/80 hover:bg-white text-stone-700 shadow-md border border-amber-200/60 backdrop-blur-xs transition-transform active:scale-90"
          title="Replay Story"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Narrative Summary Banner */}
      <div className="animation-details-banner mt-3">
        <div className="home-badge-row">
          <span className="safe-home-glow-badge">
            <ShieldCheck size={16} />
            <span>REUNITED SAFELY AT HOME</span>
          </span>
          <span className="happiness-stars">
            <Sparkles size={14} className="text-amber-500" />
            <span>Pure Happiness &amp; Emotional Relief</span>
          </span>
        </div>

        <h3 className="animation-hero-title">
          {dogName} Barks &quot;Bow Bow!&quot;, Reunited in Loving Arms &amp; Safe at Home! 🏡🐶❤️
        </h3>
        <p className="animation-hero-desc">
          Barking &quot;Bow Bow!&quot; across the meadow, {dogName} was spotted by their overjoyed owner, ran straight into a warm loving hug with gentle head pets on the porch, and happily walked inside home as the front door safely closed!
        </p>
      </div>
    </div>
  );
};
