import confetti from 'canvas-confetti';

/**
 * Triggers a golden star & joyful celebration animation.
 * EXCLUSIVELY triggered when a lost pet is marked SAFE or REUNITED with its owner.
 */
export const triggerStarCelebration = () => {
  try {
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.65 },
      shapes: ['star'],
      colors: ['#FFB703', '#F59E0B', '#E06D44', '#10B981'],
      scalar: 1.1,
      ticks: 120,
      disableForReducedMotion: true,
    });
  } catch (err) {
    console.warn('Star celebration error:', err);
  }
};
