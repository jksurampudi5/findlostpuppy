import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import type { ListingReportCategory, UserReportCategory } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'listing' | 'user';
  targetId: string;
  targetTitle?: string; // e.g. dog name or user name
  targetUserId?: string;
  onSuccess?: () => void;
}

const LISTING_CATEGORIES: { label: string; value: ListingReportCategory }[] = [
  { label: 'Fake or misleading listing', value: 'Fake or misleading listing' },
  { label: 'Incorrect information', value: 'Incorrect information' },
  { label: 'Incorrect location', value: 'Incorrect location' },
  { label: 'Inappropriate photograph', value: 'Inappropriate photograph' },
  { label: 'Privacy concern', value: 'Privacy concern' },
  { label: 'Harassment or abuse', value: 'Harassment or abuse' },
  { label: 'Suspicious activity', value: 'Suspicious activity' },
  { label: 'Other', value: 'Other' },
];

const USER_CATEGORIES: { label: string; value: UserReportCategory }[] = [
  { label: 'Harassment', value: 'Harassment' },
  { label: 'Fraud', value: 'Fraud' },
  { label: 'Impersonation', value: 'Impersonation' },
  { label: 'Abuse', value: 'Abuse' },
  { label: 'Spam', value: 'Spam' },
  { label: 'Suspicious behavior', value: 'Suspicious behavior' },
  { label: 'Other', value: 'Other' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  type,
  targetId,
  targetTitle,
  targetUserId,
  onSuccess,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) {
      setError('Please select a report category.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (type === 'listing') {
        storageService.submitListingReport(
          targetId,
          targetTitle || 'Listing',
          selectedCategory as ListingReportCategory,
          details.trim(),
          targetUserId
        );
      } else {
        storageService.submitUserReport(
          targetId,
          targetTitle || 'User',
          selectedCategory as UserReportCategory,
          details.trim()
        );
      }

      setSubmitted(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitted(false);
        setSelectedCategory('');
        setDetails('');
        if (onSuccess) onSuccess();
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Failed to submit report:', err);
      setError('Failed to submit report. Please try again.');
      setIsSubmitting(false);
    }
  };

  const categories = type === 'listing' ? LISTING_CATEGORIES : USER_CATEGORIES;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        className="modal-card report-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-text">
            <span className="modal-badge-alert">🛡️ Community Safety</span>
            <h2 id="report-modal-title">
              {type === 'listing' ? 'Report Listing' : 'Report User'}
            </h2>
            {targetTitle && (
              <p className="modal-subtitle">
                Target: <strong>{targetTitle}</strong>
              </p>
            )}
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close report dialog"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="report-success-state">
            <div className="report-success-icon">✓</div>
            <h3>Report Submitted</h3>
            <p>
              Thank you for helping keep Find Lost Puppy safe. Our moderation team
              will inspect this report in accordance with our community guidelines.
            </p>
            <p className="report-success-disclaimer">
              Note: Submitting a report is reviewed by moderators and does not guarantee
              automatic content removal.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="report-form">
            <p className="report-instruction">
              Select the reason why you are reporting this{' '}
              {type === 'listing' ? 'listing' : 'user'}:
            </p>

            {error && <div className="report-error-msg">{error}</div>}

            <div className="report-category-group" role="radiogroup">
              {categories.map((cat) => (
                <label
                  key={cat.value}
                  className={`report-category-item ${
                    selectedCategory === cat.value ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="reportCategory"
                    value={cat.value}
                    checked={selectedCategory === cat.value}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setError('');
                    }}
                  />
                  <span>{cat.label}</span>
                </label>
              ))}
            </div>

            <div className="report-details-group">
              <label htmlFor="report-details-input">
                Additional Details (Optional)
              </label>
              <textarea
                id="report-details-input"
                rows={3}
                placeholder="Provide any relevant context to help our moderation review..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={500}
              />
              <span className="char-count">{details.length}/500</span>
            </div>

            <div className="report-modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-submit-report"
                disabled={isSubmitting || !selectedCategory}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
