import React, { useState, useEffect } from 'react';
import { Sparkles, PawPrint, ArrowRight, X } from 'lucide-react';
import logoTopHandImg from '../assets/logo_top_hand.png';
import logoBottomHandImg from '../assets/logo_bottom_hand.png';
import logoCenterSanctuaryImg from '../assets/logo_center_sanctuary.png';
import './LaunchTributeOverlay.css';

interface LaunchTributeOverlayProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const LaunchTributeOverlay: React.FC<LaunchTributeOverlayProps> = ({ forceOpen = false, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<'logo' | 'tribute'>('logo');
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [showProceedBtn, setShowProceedBtn] = useState(false);

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

  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setVisible(true);
      setPhase('tribute');
      setShowProceedBtn(false);
      setCurrentWordIndex(0);
      return;
    }

    setVisible(true);
    setPhase('logo');
    setIsFadingOut(false);

    // Splash animation runs smoothly for ~3.6s so user can clearly enjoy the hands coming in from outside the orange border
    const logoTimer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setVisible(false);
        setIsFadingOut(false);
        if (onClose) onClose();
      }, 400);
    }, 3600);

    return () => clearTimeout(logoTimer);
  }, [forceOpen, onClose]);

  // Global event listener to re-open from footer button
  useEffect(() => {
    const handleReopen = () => {
      setVisible(true);
      setPhase('tribute');
      setShowProceedBtn(false);
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

  // Word-by-word reading progression at a relaxed, comfortable cadence (~380ms per word)
  useEffect(() => {
    if (visible && phase === 'tribute') {
      setCurrentWordIndex(0);
      setShowProceedBtn(false);

      const wordInterval = setInterval(() => {
        setCurrentWordIndex((prev) => {
          if (prev < totalWords) {
            return prev + 1;
          }
          return prev;
        });
      }, 380);

      return () => clearInterval(wordInterval);
    }
  }, [visible, phase, totalWords]);

  // Once reading finishes ("finds its way home."), pause for 3 seconds then gracefully reveal the proceed button
  useEffect(() => {
    if (visible && phase === 'tribute' && currentWordIndex >= totalWords) {
      const pauseTimer = setTimeout(() => {
        setShowProceedBtn(true);
      }, 3000);

      return () => clearTimeout(pauseTimer);
    }
  }, [visible, phase, currentWordIndex, totalWords]);

  const handleDismiss = () => {
    sessionStorage.setItem('findlostpuppy_launch_seen', 'true');
    setVisible(false);
    if (onClose) onClose();
  };

  if (!visible) return null;

  return (
    <div className={`launch-overlay-backdrop ${phase} ${isFadingOut ? 'fade-out' : ''}`} role="dialog" aria-modal="true" aria-label="Launch dedication">
      {/* Background ambient orbs */}
      <div className="launch-ambient-glow glow-1" />
      <div className="launch-ambient-glow glow-2" />
      <div className="launch-ambient-glow glow-3" />

      {phase === 'logo' ? (
        <div className="launch-logo-stage animate-fade-in" onClick={handleDismiss} title="Click anywhere to enter app">
          <div className="launch-logo-container">
            {/* The Badge Container */}
            <div className="launch-logo-badge protective-sanctuary-card">
              {/* Warm Hearth Fire Glow behind dog inside home */}
              <div className="safe-dog-hearth-glow" />

              {/* 1. Center Sanctuary: Home, Locator Pin & Safe Dog with Leash */}
              <img
                src={logoCenterSanctuaryImg}
                alt="Dog safe at home in locator"
                className="sanctuary-center-img"
              />

              {/* 2. Top Hand: Comes in from outside above to shelter over home */}
              <img
                src={logoTopHandImg}
                alt="Protective hand sheltering dog from above"
                className="protective-hand-img hand-top-incoming"
              />

              {/* 3. Bottom Hand: Comes in from outside below to cradle under locator */}
              <img
                src={logoBottomHandImg}
                alt="Protective hand cradling dog from below"
                className="protective-hand-img hand-bottom-incoming"
              />
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
            {/* Top Close Button */}
            <button
              type="button"
              className="tribute-close-btn"
              onClick={handleDismiss}
              aria-label="Close and continue to home"
            >
              <X size={18} />
            </button>

            {/* Header: Inaugural Launch & Brand */}
            <div className="tribute-editorial-header">
              <div className="tribute-header-eyebrow">
                <Sparkles size={13} className="eyebrow-sparkle" />
                <span>INAUGURAL LAUNCH • 2026</span>
              </div>
              <h2 className="tribute-launch-title">
                Welcome to <span className="highlight-brand">findlostpuppy</span>
              </h2>
            </div>

            {/* Prestigious Honoree Hero Presentation */}
            <div className="tribute-honoree-banner">
              <div className="honoree-eyebrow-chip">
                <Sparkles size={12} className="chip-sparkle" />
                <span>A SPECIAL NOTE OF GRATITUDE</span>
                <Sparkles size={12} className="chip-sparkle" />
              </div>
              <h3 className="honoree-signature-name">Priyanka Sharma</h3>
              <p className="honoree-signature-subtitle">
                Inspiring Art Teacher & Devoted Pet Lover
              </p>
            </div>

            {/* Editorial Quote Passage (Liquid Light Typography) */}
            <div className="tribute-passage-section">
              <div className="passage-quote-mark top-mark">“</div>

              {/* Paragraph 1 */}
              <p className="tribute-paragraph illuminated-text">
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
                        onClick={() => setCurrentWordIndex(globalIdx)}
                      >
                        {word}
                      </span>{' '}
                    </React.Fragment>
                  );
                })}
              </p>

              {/* Paragraph 2 */}
              <p className="tribute-paragraph illuminated-text">
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
                        onClick={() => setCurrentWordIndex(globalIdx)}
                      >
                        {word}
                      </span>{' '}
                    </React.Fragment>
                  );
                })}
              </p>

              <div className="passage-quote-mark bottom-mark">”</div>
            </div>

            {/* Actions Bar - Gracefully reveals Continue button after tribute finishes */}
            <div className="tribute-actions-row">
              {showProceedBtn ? (
                <button
                  type="button"
                  className="tribute-enter-btn animate-proceed-reveal"
                  onClick={handleDismiss}
                  autoFocus
                >
                  <span>Continue to Home Page</span>
                  <PawPrint size={18} className="btn-paw-icon" />
                  <ArrowRight size={18} className="btn-arrow-icon" />
                </button>
              ) : (
                <div 
                  className="tribute-actions-holding" 
                  onClick={() => setShowProceedBtn(true)}
                  title="Click to proceed immediately"
                  role="button"
                  tabIndex={0}
                >
                  <span className="holding-pulse-dot" />
                  <span className="holding-text">Reading tribute note...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
