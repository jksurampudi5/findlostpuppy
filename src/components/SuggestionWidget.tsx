import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Lightbulb,
  X,
  Send,
  CheckCircle2,
  Star,
  ExternalLink,
  Edit2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import type { SuggestionCategory } from '../types';

const PLAY_STORE_REVIEW_URL = 'https://play.google.com/store/apps/details?id=om.findlostpuppy.app';

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
      return;
    }

    // Automatic App Suggestion Popup on Dashboard — once every 5 days
    const isDashboard = pathname === '/homepage' || pathname === '/dashboard';
    const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
    const lastShownStr = localStorage.getItem('suggestion_last_shown');
    const lastShown = lastShownStr ? parseInt(lastShownStr, 10) : 0;

    if (isDashboard && (Date.now() - lastShown > FIVE_DAYS_MS)) {
      setIsOpen(true);
    }
  }, [pathname, location.search]);

  // Form states
  const [suggestionText, setSuggestionText] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);

  // Identity states (prefilled silently)
  const [name, setName] = useState(user?.name || '');
  const [contact, setContact] = useState(user?.email || user?.phone || '');
  const [isEditingContact, setIsEditingContact] = useState(false);

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
      showToast('🎉 Thank you! Your feedback was recorded.', 'success');

      // Auto close after 1.5s
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
        setSuggestionText('');
        if (pathname === '/feedback' || pathname === '/suggest') {
          navigate('/homepage');
        }
      }, 1500);
    } catch {
      showToast('Could not save suggestion. Please try again.', 'error');
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
      {/* APP SUGGESTION & REVIEW POPUP MODAL                                       */}
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
            {/* Modal Header */}
            <div className="suggestion-modal-header">
              <div className="suggestion-header-badge-row">
                <div className="suggestion-header-icon-box">
                  <Lightbulb size={28} className="suggestion-header-flame" />
                </div>
                <div>
                  <h3 id="suggestion-modal-title" className="suggestion-modal-title">
                    💡 App Suggestion & Feedback
                  </h3>
                  <p className="suggestion-modal-subtitle">
                    Share a rating, review, feature idea, or bug report!
                  </p>
                </div>
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
                <h4>Thank You! 🎉</h4>
                <p>
                  Your suggestion was captured directly into our backend system. Our team reviews
                  every community idea to make pet reunions faster and smoother!
                </p>
                <div className="suggestion-success-actions">
                  <a
                    href={PLAY_STORE_REVIEW_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    ⭐ Leave a Public Play Store Review <ExternalLink size={14} />
                  </a>
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
                {/* Categories removed as requested, focusing only on Rating */}

                {/* 2. Rating & Direct Review Link Row */}
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
                              size={24}
                              fill={active ? '#FFB800' : 'none'}
                              stroke={active ? '#FFB800' : '#94a3b8'}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* Direct Review Link Button */}
                    <a
                      href={PLAY_STORE_REVIEW_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="suggestion-playstore-link-btn"
                      title="Rate or write a public review on Google Play"
                    >
                      <span>⭐ Review Page</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>

                  {/* High Rating Callout */}
                  {rating >= 4 && (
                    <div className="rating-sweet-callout">
                      <span>Loved the app? You can also share your public feedback on Google Play!</span>
                      <a
                        href={PLAY_STORE_REVIEW_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="callout-review-link"
                      >
                        Leave a Review ➔
                      </a>
                    </div>
                  )}
                </div>

                <div className="suggestion-field-group">
                  <textarea
                    id="suggestion-desc-input"
                    rows={3}
                    className="suggestion-textarea simplified-textarea"
                    value={suggestionText}
                    onChange={(e) => setSuggestionText(e.target.value)}
                    placeholder="Share any bug, suggestion, or review text (optional)..."
                    maxLength={1500}
                    autoFocus
                  />
                </div>

                {/* 4. Subtle Submitter Identity (Compact & Non-intrusive) */}
                <div className="suggestion-identity-subtle">
                  {!isEditingContact ? (
                    <div className="identity-display-row">
                      <span className="identity-text">
                        👤 Submitting as{' '}
                        <strong>{name.trim() || user?.name || 'Pet Parent'}</strong>
                        {contact ? ` (${contact})` : ''}
                      </span>
                      <button
                        type="button"
                        className="identity-edit-btn"
                        onClick={() => setIsEditingContact(true)}
                        title="Change contact info"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </div>
                  ) : (
                    <div className="suggestion-user-row compact-user-row">
                      <div className="suggestion-user-col">
                        <input
                          type="text"
                          className="suggestion-subinput"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your Name (Optional)"
                        />
                      </div>
                      <div className="suggestion-user-col">
                        <input
                          type="text"
                          className="suggestion-subinput"
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          placeholder="Email or Phone (Optional)"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Modal Footer Actions */}
                <div className="suggestion-modal-footer">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm suggestion-submit-btn"
                    disabled={isSubmitting}
                  >
                    <Send size={15} />
                    {isSubmitting ? 'Sending...' : 'Submit Feedback 🚀'}
                  </button>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: '0.75rem 0 0', textAlign: 'center' }}>
                  💡 Note: Feedback is always available from Nav Bar &gt; Feedback for future reference.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
