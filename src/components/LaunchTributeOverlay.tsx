import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, PawPrint, Palette, ArrowRight, X } from 'lucide-react';
import './LaunchTributeOverlay.css';

interface LaunchTributeOverlayProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const LaunchTributeOverlay: React.FC<LaunchTributeOverlayProps> = ({ forceOpen = false, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<'logo' | 'tribute'>('logo');
  const [countdown, setCountdown] = useState(20);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);

  const paragraph1Words = [
    "A", "very", "special", "note", "of", "gratitude", "to", "Priyanka", "Sharma", "—",
    "a", "gifted", "artist,", "inspiring", "educator,", "and", "devoted", "pet", "lover."
  ];

  const paragraph2Words = [
    "Your", "boundless", "love", "for", "animals", "and", "creative", "perspective", "were", "a",
    "guiding", "light", "in", "shaping", "this", "app.", "Thank", "you", "for", "your", "warmth,",
    "insight,", "and", "faith", "in", "this", "journey", "to", "ensure", "no", "lost", "pet", "is",
    "ever", "forgotten", "and", "every", "puppy", "finds", "its", "way", "home."
  ];

  const totalWords = paragraph1Words.length + paragraph2Words.length;

  useEffect(() => {
    if (forceOpen) {
      setVisible(true);
      setPhase('tribute');
      setCountdown(20);
      setCurrentWordIndex(0);
      return;
    }

    // Always show on initial page load / refresh
    setVisible(true);
    setPhase('logo');

    // Logo stage for 2.6 seconds
    const logoTimer = setTimeout(() => {
      setPhase('tribute');
    }, 2600);

    return () => clearTimeout(logoTimer);
  }, [forceOpen]);

  // Global event listener to re-open from footer button
  useEffect(() => {
    const handleReopen = () => {
      setVisible(true);
      setPhase('tribute');
      setCountdown(20);
      setCurrentWordIndex(0);
    };

    window.addEventListener('open-tribute-modal', handleReopen);
    return () => window.removeEventListener('open-tribute-modal', handleReopen);
  }, []);

  // Lock body scroll when overlay is active to eliminate background judder
  useEffect(() => {
    if (visible) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [visible]);

  // Word-by-word reading progression (syncs across the 18-second reading window)
  useEffect(() => {
    if (visible && phase === 'tribute') {
      setCurrentWordIndex(0);
      // Read 61 words across ~17 seconds (~275ms per word)
      const wordInterval = setInterval(() => {
        setCurrentWordIndex((prev) => {
          if (prev < totalWords) return prev + 1;
          return prev;
        });
      }, 275);

      return () => clearInterval(wordInterval);
    }
  }, [visible, phase, totalWords]);

  // Auto-countdown timer during tribute phase (20 seconds for comfortable reading)
  useEffect(() => {
    if (visible && phase === 'tribute') {
      if (countdown <= 0) {
        handleDismiss();
        return;
      }
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [visible, phase, countdown]);

  const handleDismiss = () => {
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    setVisible(false);
    if (onClose) onClose();
  };

  if (!visible) return null;

  return (
    <div className={`launch-overlay-backdrop ${phase}`} role="dialog" aria-modal="true" aria-label="Launch dedication">
      {/* Background ambient orbs */}
      <div className="launch-ambient-glow glow-1" />
      <div className="launch-ambient-glow glow-2" />
      <div className="launch-ambient-glow glow-3" />

      {phase === 'logo' ? (
        <div className="launch-logo-stage animate-fade-in">
          <div className="launch-logo-container">
            <div className="launch-radar-pulse pulse-1" />
            <div className="launch-radar-pulse pulse-2" />
            <div className="launch-logo-badge">
              <span className="launch-paw-emoji">🐶</span>
            </div>
          </div>
          <h1 className="launch-brand-title">
            <span className="brand-find">find</span>
            <span className="brand-lost">lost</span>
            <span className="brand-puppy">puppy</span>
          </h1>
          <p className="launch-brand-tagline">
            Every puppy deserves to find its way home 🐾
          </p>
          <div className="launch-progress-bar-wrap">
            <div className="launch-progress-bar-fill" />
          </div>
        </div>
      ) : (
        <div className="launch-tribute-stage animate-slide-up">
          <div className="launch-tribute-card">
            {/* Top close button */}
            <button
              type="button"
              className="tribute-close-btn"
              onClick={handleDismiss}
              aria-label="Enter app directly"
            >
              <X size={18} />
            </button>

            {/* Glowing artistic badge */}
            <div className="tribute-header-badge">
              <Palette size={15} className="badge-icon-palette" />
              <span>A SPECIAL NOTE OF GRATITUDE</span>
              <Sparkles size={15} className="badge-icon-sparkle" />
            </div>

            {/* Launch greeting */}
            <h2 className="tribute-launch-title">
              Welcome to the initial launch of <span className="highlight-brand">findlostpuppy</span>! 🐶✨
            </h2>

            {/* Dedicated Hero Card */}
            <div className="tribute-honoree-card">
              <div className="tribute-avatar-ring">
                <div className="tribute-avatar-inner">
                  <Palette size={26} className="avatar-art-icon" />
                  <Heart size={16} className="avatar-heart-icon" />
                </div>
              </div>
              <div className="tribute-honoree-details">
                <span className="honoree-label">HONORING & DEDICATED TO</span>
                <h3 className="honoree-name">Priyanka Sharma</h3>
                <p className="honoree-roles">
                  <span>🎨 Inspiring Art Teacher & Pet Lover 🐾</span>
                </p>
              </div>
              <div className="tribute-art-sticker">
                <span className="art-palette-float">🎨</span>
                <span className="art-paw-float">🐶</span>
              </div>
            </div>

            {/* Word-by-Word Illuminated Reading Container (Zero-Reflow Guaranteed) */}
            <div className="tribute-quote-container reading-container">
              <div className="artistic-ribbon-bar">
                <span className="ribbon-art-icon">🎨</span>
                <span className="ribbon-title-text">A Tribute to Priyanka Sharma</span>
                <span className="ribbon-sparkle-icon">🐾✨</span>
              </div>

              {/* Paragraph 1 */}
              <p className="tribute-quote-paragraph illuminated-text">
                <span className="quote-mark">“</span>
                {paragraph1Words.map((word, idx) => {
                  const globalIdx = idx;
                  let wordClass = 'word-upcoming';
                  if (globalIdx < currentWordIndex) {
                    wordClass = 'word-read';
                  } else if (globalIdx === currentWordIndex) {
                    wordClass = 'word-active';
                  }
                  const isSpecialName = word === 'Priyanka' || word === 'Sharma';
                  return (
                    <React.Fragment key={idx}>
                      <span
                        className={`reading-word ${wordClass} ${isSpecialName ? 'word-name' : ''}`}
                        style={{
                          '--art-color': isSpecialName
                            ? '#FB7185'
                            : ['#FB923C', '#F472B6', '#38BDF8', '#4ADE80', '#A78BFA', '#FBBF24'][globalIdx % 6]
                        } as React.CSSProperties}
                        onClick={() => setCurrentWordIndex(globalIdx)}
                      >
                        {word}
                      </span>{' '}
                    </React.Fragment>
                  );
                })}
              </p>

              {/* Paragraph 2 */}
              <p className="tribute-quote-paragraph illuminated-text">
                {paragraph2Words.map((word, idx) => {
                  const globalIdx = paragraph1Words.length + idx;
                  let wordClass = 'word-upcoming';
                  if (globalIdx < currentWordIndex) {
                    wordClass = 'word-read';
                  } else if (globalIdx === currentWordIndex) {
                    wordClass = 'word-active';
                  }
                  return (
                    <React.Fragment key={idx}>
                      <span
                        className={`reading-word ${wordClass}`}
                        style={{
                          '--art-color': ['#FB923C', '#F472B6', '#38BDF8', '#4ADE80', '#A78BFA', '#FBBF24'][globalIdx % 6]
                        } as React.CSSProperties}
                        onClick={() => setCurrentWordIndex(globalIdx)}
                      >
                        {word}
                      </span>{' '}
                    </React.Fragment>
                  );
                })}
                <span className="quote-mark">”</span>
              </p>
            </div>

            {/* Footer / CTA Actions */}
            <div className="tribute-actions-row">
              <button
                type="button"
                className="tribute-enter-btn"
                onClick={handleDismiss}
              >
                <span>Continue to Home Page</span>
                <PawPrint size={18} className="btn-paw-icon" />
                <ArrowRight size={18} className="btn-arrow-icon" />
              </button>

              {!forceOpen && (
                <span className="tribute-auto-timer">
                  Continuing to home in {countdown}s...
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
