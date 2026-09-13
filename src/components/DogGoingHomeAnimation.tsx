import React, { useEffect, useState } from 'react';
import { Sparkles, ShieldCheck, RotateCcw, Heart } from 'lucide-react';
import { triggerStarCelebration } from '../utils/confettiHelper';

interface DogGoingHomeAnimationProps {
  dogName?: string;
}

interface StoryFrame {
  image: string;
  badge: string;
  speech?: string;
  speechType?: 'dog' | 'owner';
  title: string;
  subtitle: string;
  durationMs: number;
}

export const DogGoingHomeAnimation: React.FC<DogGoingHomeAnimationProps> = ({ dogName = 'Your Pup' }) => {
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const FRAMES: StoryFrame[] = [
    {
      image: '/images/reunion/phase1_surprise.jpg',
      badge: '1. Overjoyed Surprise',
      speech: `${dogName}! 🥹💖`,
      speechType: 'owner',
      title: `Hearing the "Bow Bow!" Bark Across the Meadow`,
      subtitle: `The front door swings open as the pet parent hears their lost pup's bark and gasps with tears of joyful relief!`,
      durationMs: 3400,
    },
    {
      image: '/images/reunion/phase2_running.jpg',
      badge: '2. The Excited Sprint',
      speech: `Bow Bow! 🐾`,
      speechType: 'dog',
      title: `${dogName} Bounds Towards the Porch`,
      subtitle: `Spotting their loving owner, the happy dog accelerates into a bounding full-speed run across the grass!`,
      durationMs: 3200,
    },
    {
      image: '/images/reunion/phase3_hug.jpg',
      badge: '3. Loving Embrace & Petting',
      speech: `I missed you so much! 🥰`,
      speechType: 'owner',
      title: `Loving Arms, Tears of Joy & Gentle Pets`,
      subtitle: `Kneeling down on the lawn, the owner wraps their arms around ${dogName} in a tight embrace, gently stroking and petting their head.`,
      durationMs: 3800,
    },
    {
      image: '/images/reunion/phase4_inside.jpg',
      badge: '4. Safe at Home 🏡',
      title: `Together Inside the Cozy Home as the Door Shuts`,
      subtitle: `Walking through the doorway side-by-side into the warm living room, safely reunited as the front door gently closes.`,
      durationMs: 3600,
    },
  ];

  useEffect(() => {
    triggerStarCelebration();
  }, []);

  useEffect(() => {
    if (isHovered) return;

    const currentDuration = FRAMES[currentFrameIndex]?.durationMs || 3500;
    const timer = setTimeout(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % FRAMES.length);
    }, currentDuration);

    return () => clearTimeout(timer);
  }, [currentFrameIndex, isHovered, FRAMES]);

  const handleReplay = () => {
    triggerStarCelebration();
    setCurrentFrameIndex(0);
  };

  const currentFrame = FRAMES[currentFrameIndex];

  return (
    <div
      className="dog-home-animation-card premium-story-card relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Atmosphere Floating Particles */}
      <div className="animation-atmosphere" aria-hidden="true">
        <span className="floating-anim-particle p-heart-1">💖</span>
        <span className="floating-anim-particle p-heart-2">💕</span>
        <span className="floating-anim-particle p-heart-3">✨</span>
        <span className="floating-anim-particle p-star-1">⭐</span>
        <span className="floating-anim-particle p-star-2">🌟</span>
        <span className="floating-anim-particle p-heart-4">🐾</span>
      </div>

      {/* Cinematic Real Photo Stage */}
      <div className="relative w-full aspect-16/9 rounded-2xl overflow-hidden shadow-xl border border-amber-200/80 bg-stone-900 group">
        {/* Layered Crossfading Real Images */}
        {FRAMES.map((frame, index) => {
          const isActive = index === currentFrameIndex;
          return (
            <div
              key={frame.image}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={frame.image}
                alt={frame.title}
                className={`w-full h-full object-cover transform transition-transform duration-6000 ease-out ${
                  isActive ? 'scale-105 translate-y-[-1%]' : 'scale-100'
                }`}
                loading="eager"
              />
              {/* Subtle Cinematic Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />
            </div>
          );
        })}

        {/* Top Header Badge & Replay Control */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold tracking-wide border border-white/20 shadow-md">
            <Sparkles size={12} className="text-amber-400 animate-spin-slow" />
            <span>{currentFrame.badge}</span>
          </span>

          <button
            type="button"
            onClick={handleReplay}
            className="pointer-events-auto btn btn-xs btn-circle bg-white/85 hover:bg-white text-stone-800 shadow-lg border border-white/60 backdrop-blur-md transition-transform active:scale-90"
            title="Replay Story"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* Dynamic Speech Dialogue Bubble */}
        {currentFrame.speech && (
          <div className="absolute top-12 left-6 z-20 animate-bounce-subtle pointer-events-none">
            <div className="relative px-4 py-2 bg-white/95 backdrop-blur-md text-stone-900 font-extrabold text-sm md:text-base rounded-2xl shadow-xl border-2 border-amber-400 flex items-center gap-1.5">
              <span>{currentFrame.speech}</span>
              <Heart size={14} className="text-rose-500 fill-rose-500 inline" />
              {/* Bubble Tail */}
              <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-r-2 border-b-2 border-amber-400 transform rotate-45" />
            </div>
          </div>
        )}

        {/* Bottom Subtitle Caption Overlay */}
        <div className="absolute bottom-3 left-4 right-4 z-20 pointer-events-none text-white">
          <h4 className="text-base md:text-lg font-bold drop-shadow-md text-amber-200 flex items-center gap-1.5">
            <span>{currentFrame.title}</span>
          </h4>
          <p className="text-xs md:text-sm text-stone-200 line-clamp-2 drop-shadow-sm font-medium">
            {currentFrame.subtitle}
          </p>
        </div>

        {/* Frame Progress Indicators */}
        <div className="absolute bottom-1 left-4 right-4 z-30 flex items-center gap-1.5 py-1">
          {FRAMES.map((_, idx) => (
            <div
              key={`dot-${FRAMES[idx].badge}`}
              onClick={() => setCurrentFrameIndex(idx)}
              className="flex-1 h-1 rounded-full overflow-hidden bg-white/30 cursor-pointer pointer-events-auto"
            >
              <div
                className={`h-full bg-amber-400 transition-all duration-300 ${
                  idx === currentFrameIndex
                    ? 'w-full'
                    : idx < currentFrameIndex
                    ? 'w-full opacity-60'
                    : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Narrative Footer Banner */}
      <div className="animation-details-banner mt-3">
        <div className="home-badge-row">
          <span className="safe-home-glow-badge">
            <ShieldCheck size={16} />
            <span>REUNITED SAFELY AT HOME</span>
          </span>
          <span className="happiness-stars">
            <Sparkles size={14} className="text-amber-500" />
            <span>Real Life Reunion Moments</span>
          </span>
        </div>

        <h3 className="animation-hero-title">
          {dogName} Barks &quot;Bow Bow!&quot;, Reunited in Loving Arms &amp; Safe at Home! 🏡🐶❤️
        </h3>
        <p className="animation-hero-desc">
          Hearing the joyful bark across the lawn, the owner rushed out to embrace {dogName} with happy tears, gentle pets, and warm cuddles before heading inside their cozy home!
        </p>
      </div>
    </div>
  );
};
