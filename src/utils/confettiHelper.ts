import confetti from 'canvas-confetti';

/**
 * Triggers a golden star & joyful confetti celebration animation.
 * Used when Owner Profile, Location Details, Pet Profile are completed/saved,
 * and when Pet is marked Safe or Reunited.
 * (EXPLICITLY NOT used when broadcasting a lost dog alert).
 */
export const triggerStarCelebration = () => {
  try {
    // 1. Golden stars burst
    confetti({
      particleCount: 55,
      spread: 75,
      origin: { y: 0.6 },
      shapes: ['star'],
      colors: ['#FFB703', '#F59E0B', '#E06D44', '#10B981', '#6366F1'],
      scalar: 1.25,
      ticks: 200,
    });

    // 2. Secondary festive color cascade
    setTimeout(() => {
      try {
        confetti({
          particleCount: 45,
          spread: 85,
          origin: { y: 0.65 },
          colors: ['#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#8338EC'],
          scalar: 0.9,
          ticks: 180,
        });
      } catch {}
    }, 120);
  } catch (err) {
    console.warn('Star celebration error:', err);
  }
};
