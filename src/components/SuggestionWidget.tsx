import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  X,
  Send,
  CheckCircle2,
  Star,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import type { SuggestionCategory } from '../types';

export const PLAY_STORE_DETAILS_URL = 'https://play.google.com/store/apps/details?id=om.findlostpuppy.app';
export const PLAY_STORE_TESTING_URL = 'https://play.google.com/apps/testing/om.findlostpuppy.app';
export const PLAY_STORE_REVIEW_URL =
  import.meta.env.VITE_PLAY_STORE_URL || PLAY_STORE_DETAILS_URL;
export const PLAY_STORE_MARKET_URL = 'market://details?id=om.findlostpuppy.app';

export const SuggestionWidget: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const pathname = location.pathname;

  // Auto-open on feedback routes or when query parameter indicates feedback
  useEffect(() => {
    const isFeedbackRoute = pathname === '/feedback' || pathname === '/suggest';
    const searchParams = new URLSearchParams(location.search);
    const hasFeedbackParam =
      searchParams.get('feedback') === 'true' || searchParams.get('openFeedback') === 'true';

    if (isFeedbackRoute || hasFeedbackParam) {
      setIsOpen(true);
      setIsSuccess(false);
    }
  }, [pathname, location.search]);

  // Form states
  const [suggestionText, setSuggestionText] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);

  // Identity states (prefilled silently)
  const [name, setName] = useState(user?.name || '');
  const [contact, setContact] = useState(user?.email || user?.phone || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync user info when auth updates
  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name || '');
      setContact((prev) => prev || user.email || user.phone || '');
    }
  }, [user?.name, user?.email, user?.phone]);

  // Global listener to open suggestion modal from any button in navbar, drawer, or footer
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setIsSuccess(false);
    };
    window.addEventListener('open-suggestion-modal', handleOpen);
    return () => window.removeEventListener('open-suggestion-modal', handleOpen);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Record the timestamp of the last shown popup
    localStorage.setItem('suggestion_last_shown', Date.now().toString());
    // Preserve old flags for backward compatibility
    localStorage.setItem('suggestion_shown', 'true');
    localStorage.setItem('findlostpuppy_suggestion_shown', 'true');
    if (pathname === '/feedback' || pathname === '/suggest') {
      navigate('/homepage');
    }
  };

  const handleRatingClick = (val: number) => {
    setRating(val);
  };

  const handleOpenPlayStore = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const isCapacitor =
        typeof (window as any).Capacitor !== 'undefined' &&
        (window as any).Capacitor?.isNativePlatform?.();

      if (isCapacitor) {
        window.location.href = PLAY_STORE_MARKET_URL;
      } else {
        const win = window.open(PLAY_STORE_REVIEW_URL, '_blank', 'noopener,noreferrer');
        if (!win || win.closed || typeof win.closed === 'undefined') {
          window.location.href = PLAY_STORE_REVIEW_URL;
        }
      }
      showToast('⭐ Opening Google Play Store...', 'info');
    } catch {
      window.open(PLAY_STORE_REVIEW_URL, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShareEarlyAccess = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const shareData = {
      title: 'FindLostPuppy 🐾 (Early Access Testing)',
      text: 'Help test FindLostPuppy! Review the app and rate us on Google Play:',
      url: PLAY_STORE_DETAILS_URL,
    };
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('🔗 Early Access link shared successfully!', 'success');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(PLAY_STORE_DETAILS_URL);
      showToast('📋 Early Access link copied to clipboard! Share with testers to rate.', 'success');
    } catch {
      showToast('Could not copy link.', 'warning');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      const trimmed = suggestionText.trim();
      const firstLine = trimmed ? trimmed.split('\n')[0].trim() : `App Rating: ${rating} Stars`;
      const derivedTitle = firstLine.length > 70 ? `${firstLine.substring(0, 67)}...` : firstLine;

      const descriptionWithContext = trimmed || `User rated ${rating} out of 5 stars.`;

      const derivedCategory: SuggestionCategory =
        rating <= 2 ? 'bug' : rating === 3 ? 'improvement' : 'praise';

      storageService.saveSuggestion({
        userId: user?.id,
        userName: name.trim() || user?.name || 'Community Member',
        userEmail: contact.includes('@') ? contact.trim() : user?.email,
        userPhone: !contact.includes('@') && contact.trim() ? contact.trim() : user?.phone,
        category: derivedCategory,
        title: derivedTitle,
        description: descriptionWithContext,
        rating,
        pageUrl: location.pathname,
      });

      // Record timestamp so popup won't re-appear for 5 days
      localStorage.setItem('suggestion_last_shown', Date.now().toString());
      localStorage.setItem('suggestion_shown', 'true');
      localStorage.setItem('findlostpuppy_suggestion_shown', 'true');

      setIsSuccess(true);
      showToast('🎉 Thank you! Your rating was recorded.', 'success');

      // Auto close after 2s
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
        setSuggestionText('');
        if (pathname === '/feedback' || pathname === '/suggest') {
          navigate('/homepage');
        }
      }, 2000);
    } catch {
      showToast('Could not save rating. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingDescriptions = [
    '',
    'Needs attention 🛠️',
    'Fair, could be better 💡',
    'Good experience 👍',
    'Great experience! 🌟',
    'Loved it! ❤️',
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* ========================================================================= */}
      {/* APP RATING POPUP MODAL                                                    */}
      {/* ========================================================================= */}
      {isOpen && (
        <div className="suggestion-modal-overlay" onClick={handleClose}>
          <div
            className="suggestion-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="suggestion-modal-title"
          >
            {/* Modal Header: Clean title with Star Badge and Close button */}
            <div className="suggestion-modal-header suggestion-clean-header">
              <div className="suggestion-modal-title-wrap">
                <span className="suggestion-modal-star-badge" aria-hidden="true">
                  <Star size={18} fill="#FFB800" stroke="#FFB800" />
                </span>
                <h3 id="suggestion-modal-title" className="suggestion-modal-title">
                  App Rating
                </h3>
              </div>
              <button
                type="button"
                className="suggestion-modal-close"
                onClick={handleClose}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            {isSuccess ? (
              <div className="suggestion-success-view">
                <div className="suggestion-success-icon-wrap">
                  <CheckCircle2 size={54} className="text-success" />
                </div>
                <h4>Thank You for Rating! 🎉</h4>
                <p>
                  You rated FindLostPuppy {rating} out of 5 stars. Thank you for helping keep community pets safe!
                </p>
                <div className="suggestion-success-actions">
                  <a
                    href={PLAY_STORE_REVIEW_URL}
                    onClick={handleOpenPlayStore}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    ⭐ Review on Google Play <ExternalLink size={14} />
                  </a>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleShareEarlyAccess}
                  >
                    <Share2 size={14} /> Share Link
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleClose}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="suggestion-form">
                {/* 1. Rating & Direct Review Link Row */}
                <div className="suggestion-rating-review-card">
                  <div className="rating-review-top">
                    <span className="rating-question-label">Rate your app experience:</span>
                    <span className="suggestion-rating-desc">
                      {ratingDescriptions[hoverRating || rating]}
                    </span>
                  </div>

                  <div className="rating-review-row">
                    {/* Stars */}
                    <div className="suggestion-stars-row">
                      {[1, 2, 3, 4, 5].map((val) => {
                        const active = (hoverRating || rating) >= val;
                        return (
                          <button
                            key={val}
                            type="button"
                            className={`suggestion-star-btn ${active ? 'star-active' : ''}`}
                            onClick={() => handleRatingClick(val)}
                            onMouseEnter={() => setHoverRating(val)}
                            onMouseLeave={() => setHoverRating(0)}
                            aria-label={`Rate ${val} out of 5 stars`}
                          >
                            <Star
                              size={26}
                              fill={active ? '#FFB800' : 'none'}
                              stroke={active ? '#FFB800' : '#94a3b8'}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* Direct Review Link & Share Buttons */}
                    <div className="suggestion-action-links-row">
                      <a
                        href={PLAY_STORE_REVIEW_URL}
                        onClick={handleOpenPlayStore}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="suggestion-playstore-link-btn"
                        title="Rate on Google Play Store"
                      >
                        <span>⭐ Rate on Play Store</span>
                        <ExternalLink size={13} />
                      </a>
                      <button
                        type="button"
                        onClick={handleShareEarlyAccess}
                        className="suggestion-share-link-btn"
                        title="Share Early Access App Link with testers"
                      >
                        <Share2 size={13} />
                        <span>Share Link</span>
                      </button>
                    </div>
                  </div>

                  {/* Early Access Testing Program Link */}
                  <div className="suggestion-early-access-subrow">
                    <span className="early-access-badge">🧪 Early Access:</span>
                    <a
                      href={PLAY_STORE_TESTING_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="early-access-anchor"
                    >
                      Join Google Play Testing Program <ExternalLink size={11} />
                    </a>
                  </div>
                </div>

                {/* 2. Review Text Input Bar */}
                <div className="suggestion-field-group">
                  <textarea
                    id="suggestion-desc-input"
                    rows={4}
                    className="suggestion-textarea simplified-textarea"
                    value={suggestionText}
                    onChange={(e) => setSuggestionText(e.target.value)}
                    placeholder="Share any review, thoughts, or suggestions (optional)..."
                    maxLength={1500}
                    autoFocus
                  />
                </div>

                {/* 3. Centered Submit Button */}
                <div className="suggestion-modal-footer suggestion-footer-centered">
                  <button
                    type="submit"
                    className="btn btn-primary suggestion-submit-btn"
                    disabled={isSubmitting}
                  >
                    <Send size={15} />
                    <span>{isSubmitting ? 'Sending...' : 'Submit Rating ⭐'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
