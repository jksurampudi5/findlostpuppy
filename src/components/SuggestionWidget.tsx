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
  Palette,
  Rocket,
  MessageSquareQuote,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { triggerStarCelebration } from '../utils/confettiHelper';
import type { SuggestionCategory } from '../types';

export const SuggestionWidget: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [hasDismissedCallout, setHasDismissedCallout] = useState(() => {
    return localStorage.getItem('findlostpuppy_suggestion_callout_dismissed') === 'true';
  });

  // Form states
  const [category, setCategory] = useState<SuggestionCategory>('feature');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
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

    if (!title.trim()) {
      showToast('Please enter a short title or summary for your suggestion.', 'warning');
      return;
    }

    if (!description.trim()) {
      showToast('Please describe your idea or feedback.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      storageService.saveSuggestion({
        userId: user?.id,
        userName: name.trim() || user?.name || 'Community Member',
        userEmail: contact.includes('@') ? contact.trim() : user?.email,
        userPhone: !contact.includes('@') && contact.trim() ? contact.trim() : user?.phone,
        category,
        title: title.trim(),
        description: description.trim(),
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
        setTitle('');
        setDescription('');
      }, 2500);
    } catch {
      showToast('Could not save suggestion. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: { key: SuggestionCategory; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'feature', label: 'New Feature', icon: <Rocket size={15} />, color: '#f97316' },
    { key: 'improvement', label: 'Improvement', icon: <Sparkles size={15} />, color: '#3b82f6' },
    { key: 'ui_ux', label: 'UI & Design', icon: <Palette size={15} />, color: '#8b5cf6' },
    { key: 'bug', label: 'Report Bug', icon: <Bug size={15} />, color: '#ef4444' },
    { key: 'praise', label: 'Praise & Love', icon: <Heart size={15} />, color: '#ec4899' },
    { key: 'other', label: 'Other Idea', icon: <MessageSquareQuote size={15} />, color: '#10b981' },
  ];

  const ratingDescriptions = [
    '',
    'Needs attention 🛠️',
    'Fair, could be better 💡',
    'Good experience 👍',
    'Really great! 🌟',
    'Incredible app! ❤️',
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. EYE-CATCHER FLOATING WIDGET BUTTON                                     */}
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
            <Lightbulb size={20} className="suggestion-bulb-icon" />
          </span>
          <span className="suggestion-btn-label">
            <span className="suggestion-btn-badge">✨ Idea</span>
            <span className="suggestion-btn-text">Suggest</span>
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. MODERN EYE-CATCHER SUGGESTION MODAL                                    */}
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
                  <Flame size={20} className="suggestion-header-flame" />
                </div>
                <div>
                  <h3 id="suggestion-modal-title" className="suggestion-modal-title">
                    💡 Got a Suggestion?
                  </h3>
                  <p className="suggestion-modal-subtitle">
                    Your ideas shape FindLostPuppy. Tell us what you'd love to see!
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="suggestion-modal-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close dialog"
              >
                <X size={19} />
              </button>
            </div>

            {/* Modal Body */}
            {isSuccess ? (
              <div className="suggestion-success-view">
                <div className="suggestion-success-icon-wrap">
                  <CheckCircle2 size={54} className="text-success" />
                </div>
                <h4>Thank You So Much! 🎉</h4>
                <p>
                  Your suggestion has been captured in our backend system. Our team reviews every idea
                  to make pet recovery faster and safer for our community!
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="suggestion-form">
                {/* 1. Category Chips */}
                <div className="suggestion-field-group">
                  <label className="suggestion-label">
                    <span>What type of suggestion is this?</span>
                  </label>
                  <div className="suggestion-categories-grid">
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

                {/* 2. Rating / Experience Vibe */}
                <div className="suggestion-field-group">
                  <label className="suggestion-label">
                    <span>How would you rate your app experience today?</span>
                    <span className="suggestion-rating-desc">
                      {ratingDescriptions[hoverRating || rating]}
                    </span>
                  </label>
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
                          <Star size={24} fill={active ? '#FFB800' : 'none'} stroke={active ? '#FFB800' : '#94a3b8'} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Suggestion Title */}
                <div className="suggestion-field-group">
                  <label htmlFor="suggestion-title-input" className="suggestion-label">
                    <span>Title / Idea summary *</span>
                  </label>
                  <input
                    id="suggestion-title-input"
                    type="text"
                    className="suggestion-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Add WhatsApp alert group, Dog birthday reminder, Sound alert..."
                    required
                    maxLength={120}
                  />
                </div>

                {/* 4. Suggestion Description */}
                <div className="suggestion-field-group">
                  <label htmlFor="suggestion-desc-input" className="suggestion-label">
                    <span>Your Details & Thoughts *</span>
                  </label>
                  <textarea
                    id="suggestion-desc-input"
                    rows={3}
                    className="suggestion-textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain what you have in mind or what could be improved. Any detail is super helpful!"
                    required
                    maxLength={1500}
                  />
                </div>

                {/* 5. Submitter Info (Optional) */}
                <div className="suggestion-user-row">
                  <div className="suggestion-user-col">
                    <label htmlFor="suggestion-name-input" className="suggestion-sublabel">Your Name</label>
                    <input
                      id="suggestion-name-input"
                      type="text"
                      className="suggestion-subinput"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Jaya Krishna"
                    />
                  </div>
                  <div className="suggestion-user-col">
                    <label htmlFor="suggestion-contact-input" className="suggestion-sublabel">Email or Phone (Optional)</label>
                    <input
                      id="suggestion-contact-input"
                      type="text"
                      className="suggestion-subinput"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="For updates on your idea"
                    />
                  </div>
                </div>

                {/* Context Metadata Pill */}
                <div className="suggestion-context-pill">
                  <span>📍 Page: <code>{location.pathname}</code></span>
                  <span>🔒 Captured securely in backend</span>
                </div>

                {/* Actions */}
                <div className="suggestion-modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm suggestion-submit-btn"
                    disabled={isSubmitting || !title.trim() || !description.trim()}
                  >
                    <Send size={15} />
                    {isSubmitting ? 'Submitting...' : 'Send Suggestion 🚀'}
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
