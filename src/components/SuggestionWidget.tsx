import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Lightbulb,
  Sparkles,
  X,
  Send,
  CheckCircle2,
  Star,
  Bug,
  Heart,
  Rocket,
  ExternalLink,
  Edit2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { triggerStarCelebration } from '../utils/confettiHelper';
import type { SuggestionCategory } from '../types';

const PLAY_STORE_REVIEW_URL = 'https://play.google.com/store/apps/details?id=om.findlostpuppy.app';

export const SuggestionWidget: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [hasDismissedCallout, setHasDismissedCallout] = useState(() => {
    return localStorage.getItem('findlostpuppy_suggestion_callout_dismissed') === 'true';
  });

  // Simplified form states
  const [category, setCategory] = useState<SuggestionCategory>('feature');
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

  // Global listener to open suggestion modal from any button in navbar or drawer
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setIsSuccess(false);
    };
    window.addEventListener('open-suggestion-modal', handleOpen);
    return () => window.removeEventListener('open-suggestion-modal', handleOpen);
  }, []);

  const handleDismissCallout = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasDismissedCallout(true);
    localStorage.setItem('findlostpuppy_suggestion_callout_dismissed', 'true');
  };

  const handleRatingClick = (val: number) => {
    setRating(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = suggestionText.trim();
    if (!trimmed) {
      showToast('Please share your idea or suggestion.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      // Derive a short summary title from first sentence or up to 60 chars
      const firstLine = trimmed.split('\n')[0].trim();
      const derivedTitle = firstLine.length > 70 ? `${firstLine.substring(0, 67)}...` : firstLine;

      storageService.saveSuggestion({
        userId: user?.id,
        userName: name.trim() || user?.name || 'Community Member',
        userEmail: contact.includes('@') ? contact.trim() : user?.email,
        userPhone: !contact.includes('@') && contact.trim() ? contact.trim() : user?.phone,
        category,
        title: derivedTitle,
        description: trimmed,
        rating,
        pageUrl: location.pathname,
      });

      triggerStarCelebration();
      setIsSuccess(true);
      showToast('🎉 Thank you! Your suggestion was recorded.', 'success');

      // Auto close after 2.5s
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
        setSuggestionText('');
      }, 2500);
    } catch {
      showToast('Could not save suggestion. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4 simplified, punchy categories
  const categories: { key: SuggestionCategory; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'feature', label: 'Feature Idea', icon: <Rocket size={16} />, color: '#f97316' },
    { key: 'improvement', label: 'Improvement', icon: <Sparkles size={16} />, color: '#3b82f6' },
    { key: 'bug', label: 'Report Issue', icon: <Bug size={16} />, color: '#ef4444' },
    { key: 'praise', label: 'Praise & Other', icon: <Heart size={16} />, color: '#ec4899' },
  ];

  const ratingDescriptions = [
    '',
    'Needs attention 🛠️',
    'Fair, could be better 💡',
    'Good experience 👍',
    'Great experience! 🌟',
    'Loved it! ❤️',
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. EYE-CATCHER FLOATING WIDGET BUTTON (Larger & Vibrant)                   */}
      {/* ========================================================================= */}
      <div className="suggestion-floating-container" aria-label="App Suggestions">
        {!hasDismissedCallout && !isOpen && (
          <div className="suggestion-floating-callout" onClick={() => setIsOpen(true)}>
            <span className="callout-sparkle">✨</span>
            <div className="callout-text">
              <strong>Have an idea?</strong>
              <span>Help us shape FindLostPuppy!</span>
            </div>
            <button
              type="button"
              className="callout-close-btn"
              onClick={handleDismissCallout}
              title="Dismiss note"
              aria-label="Dismiss note"
            >
              ✕
            </button>
          </div>
        )}

        <button
          type="button"
          className="suggestion-floating-btn"
          onClick={() => {
            setIsOpen(true);
            setIsSuccess(false);
          }}
          title="Share an idea, feature request, or suggestion"
          aria-label="Open suggestion dialog"
        >
          <span className="suggestion-pulse-ring" />
          <span className="suggestion-btn-icon-wrap">
            <Lightbulb size={26} className="suggestion-bulb-icon" />
          </span>
          <span className="suggestion-btn-label">
            <span className="suggestion-btn-badge">✨ Idea</span>
            <span className="suggestion-btn-text">Suggest</span>
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. SIMPLIFIED & STREAMLINED SUGGESTION MODAL                              */}
      {/* ========================================================================= */}
      {isOpen && (
        <div className="suggestion-modal-overlay" onClick={() => setIsOpen(false)}>
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
                    💡 Got a Suggestion?
                  </h3>
                  <p className="suggestion-modal-subtitle">
                    Share an idea, request a feature, or tell us what we can improve!
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="suggestion-modal-close"
                onClick={() => setIsOpen(false)}
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
                    onClick={() => setIsOpen(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="suggestion-form">
                {/* 1. Simplified Category Chips */}
                <div className="suggestion-field-group">
                  <div className="suggestion-categories-grid simplified-categories">
                    {categories.map((cat) => {
                      const isSelected = category === cat.key;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          className={`suggestion-cat-chip ${isSelected ? 'cat-chip-active' : ''}`}
                          onClick={() => setCategory(cat.key)}
                          style={{
                            borderColor: isSelected ? cat.color : undefined,
                            backgroundColor: isSelected ? `${cat.color}15` : undefined,
                          }}
                        >
                          <span className="cat-chip-icon" style={{ color: cat.color }}>
                            {cat.icon}
                          </span>
                          <span className="cat-chip-label">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

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

                {/* 3. Single Streamlined Suggestion Textarea */}
                <div className="suggestion-field-group">
                  <textarea
                    id="suggestion-desc-input"
                    rows={4}
                    className="suggestion-textarea simplified-textarea"
                    value={suggestionText}
                    onChange={(e) => setSuggestionText(e.target.value)}
                    placeholder="💡 What would make FindLostPuppy even better for you? Share any idea, feature request, or suggestion..."
                    required
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
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm suggestion-submit-btn"
                    disabled={isSubmitting || !suggestionText.trim()}
                  >
                    <Send size={15} />
                    {isSubmitting ? 'Sending...' : 'Send Suggestion 🚀'}
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
