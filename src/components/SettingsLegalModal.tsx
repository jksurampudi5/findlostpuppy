import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { consentService } from '../services/consentService';
import { storageService } from '../services/storageService';
import {
  TERMS_AND_CONDITIONS,
  PRIVACY_POLICY,
  DISCLAIMER,
  USER_GUIDELINES,
  type LegalDocument,
} from '../data/legal/legalContent';
import type { BlockedUserRecord } from '../types';

interface SettingsLegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'legal' | 'consent' | 'blocked' | 'delete';
}

export const SettingsLegalModal: React.FC<SettingsLegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'legal',
}) => {
  const { user, deleteAccount, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'legal' | 'consent' | 'blocked' | 'delete'>(initialTab);
  const [selectedDoc, setSelectedDoc] = useState<'terms' | 'privacy' | 'disclaimer' | 'guidelines'>('terms');
  
  // Deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInputConfirmation, setDeleteInputConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Blocked users state
  const [blockedUsers, setBlockedUsers] = useState(() => storageService.getBlockedUsers());

  if (!isOpen) return null;

  const consentRecord = consentService.getConsentRecord();

  const getDoc = (type: string): LegalDocument => {
    switch (type) {
      case 'terms':
        return TERMS_AND_CONDITIONS;
      case 'privacy':
        return PRIVACY_POLICY;
      case 'disclaimer':
        return DISCLAIMER;
      case 'guidelines':
      default:
        return USER_GUIDELINES;
    }
  };

  const currentDoc = getDoc(selectedDoc);

  const handleUnblock = (userId: string) => {
    storageService.unblockUser(userId);
    setBlockedUsers(storageService.getBlockedUsers());
  };

  const handleDeleteAccount = async () => {
    if (deleteInputConfirmation.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type "DELETE" exactly to confirm.');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteAccount();
      setIsDeleting(false);
      onClose();
      // Page will reactively redirect to ConsentPage
    } catch (err) {
      console.error('Account deletion failed:', err);
      setDeleteError('Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-legal-title"
    >
      <div
        className="modal-card settings-legal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-text">
            <span className="modal-badge-info">⚙️ App Settings & Legal</span>
            <h2 id="settings-legal-title">Settings & Legal Center</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close settings dialog"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="settings-tab-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'legal'}
            className={`settings-tab-btn ${activeTab === 'legal' ? 'active' : ''}`}
            onClick={() => setActiveTab('legal')}
          >
            📜 Legal Documents
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'consent'}
            className={`settings-tab-btn ${activeTab === 'consent' ? 'active' : ''}`}
            onClick={() => setActiveTab('consent')}
          >
            ✓ Consent Record
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'blocked'}
            className={`settings-tab-btn ${activeTab === 'blocked' ? 'active' : ''}`}
            onClick={() => {
              setBlockedUsers(storageService.getBlockedUsers());
              setActiveTab('blocked');
            }}
          >
            🚫 Blocked Users ({blockedUsers.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'delete'}
            className={`settings-tab-btn tab-danger ${activeTab === 'delete' ? 'active' : ''}`}
            onClick={() => setActiveTab('delete')}
          >
            🗑️ Delete Account
          </button>
        </div>

        {/* Tab 1: Legal Documents */}
        {activeTab === 'legal' && (
          <div className="settings-tab-content">
            <div className="doc-selector-pills">
              <button
                type="button"
                className={`doc-pill ${selectedDoc === 'terms' ? 'selected' : ''}`}
                onClick={() => setSelectedDoc('terms')}
              >
                Terms & Conditions
              </button>
              <button
                type="button"
                className={`doc-pill ${selectedDoc === 'privacy' ? 'selected' : ''}`}
                onClick={() => setSelectedDoc('privacy')}
              >
                Privacy Policy
              </button>
              <button
                type="button"
                className={`doc-pill ${selectedDoc === 'disclaimer' ? 'selected' : ''}`}
                onClick={() => setSelectedDoc('disclaimer')}
              >
                Disclaimer
              </button>
              <button
                type="button"
                className={`doc-pill ${selectedDoc === 'guidelines' ? 'selected' : ''}`}
                onClick={() => setSelectedDoc('guidelines')}
              >
                User Guidelines
              </button>
            </div>

            <div className="legal-doc-reader">
              <div className="doc-meta-header">
                <h3>{currentDoc.title}</h3>
                <span className="doc-meta-tag">
                  v{currentDoc.version} • {currentDoc.lastUpdated}
                </span>
              </div>
              <div className="doc-sections-list">
                {currentDoc.sections.map((sec, idx) => (
                  <div key={idx} className="doc-section-card">
                    <h4>{sec.heading}</h4>
                    {Array.isArray(sec.content) ? (
                      <ul>
                        {sec.content.map((bullet, bIdx) => (
                          <li key={bIdx}>{bullet}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>{sec.content}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Consent Record */}
        {activeTab === 'consent' && (
          <div className="settings-tab-content consent-record-view">
            <div className="consent-status-banner">
              <span className="status-badge-verified">✓ Current Consent Verified</span>
              <p>
                Your consent record acknowledges and binds your use of Find Lost Puppy to the
                agreed version of the legal terms and disclaimers.
              </p>
            </div>

            <div className="consent-details-grid">
              <div className="consent-detail-card">
                <span className="detail-label">Consent Agreement Version</span>
                <span className="detail-value">{consentRecord?.consentVersion || '1.0'}</span>
              </div>
              <div className="consent-detail-card">
                <span className="detail-label">Terms & Conditions</span>
                <span className="detail-value">v{consentRecord?.termsVersion || '1.0'}</span>
              </div>
              <div className="consent-detail-card">
                <span className="detail-label">Privacy Policy</span>
                <span className="detail-value">v{consentRecord?.privacyVersion || '1.0'}</span>
              </div>
              <div className="consent-detail-card">
                <span className="detail-label">Platform Disclaimer</span>
                <span className="detail-value">v{consentRecord?.disclaimerVersion || '1.0'}</span>
              </div>
              <div className="consent-detail-card">
                <span className="detail-label">Application Version</span>
                <span className="detail-value">v{consentRecord?.appVersion || '0.1.0'}</span>
              </div>
              <div className="consent-detail-card">
                <span className="detail-label">Date & Time Acknowledged</span>
                <span className="detail-value highlight">
                  {consentRecord?.agreedAt
                    ? new Date(consentRecord.agreedAt).toLocaleString()
                    : 'Active in session'}
                </span>
              </div>
            </div>

            <div className="consent-info-box">
              <p>
                📌 If our Terms, Disclaimers, or Privacy Policy materially change in the future,
                you will be prompted to review and accept the updated version upon opening the app.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Blocked Users */}
        {activeTab === 'blocked' && (
          <div className="settings-tab-content">
            <div className="blocked-users-header">
              <h3>Blocked Accounts</h3>
              <p>
                Listings and sightings posted by blocked accounts are hidden from your feed.
                Blocked users cannot contact you regarding your pet listings.
              </p>
            </div>

            {blockedUsers.length === 0 ? (
              <div className="empty-state-card">
                <span className="empty-icon">🛡️</span>
                <p>You have not blocked any accounts.</p>
                <small>You can block users directly from their dog listings or profile reports.</small>
              </div>
            ) : (
              <div className="blocked-list">
                {blockedUsers.map((b: BlockedUserRecord) => (
                  <div key={b.blockedUserId} className="blocked-item">
                    <div className="blocked-info">
                      <span className="blocked-avatar">🚫</span>
                      <div>
                        <strong>{b.blockedUserName || `User ID: ${b.blockedUserId.slice(0, 8)}...`}</strong>
                        <div className="blocked-date">
                          Blocked on {new Date(b.blockedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-unblock"
                      onClick={() => handleUnblock(b.blockedUserId)}
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Delete Account */}
        {activeTab === 'delete' && (
          <div className="settings-tab-content delete-account-view">
            <div className="delete-warning-card">
              <div className="warning-icon">⚠️</div>
              <div className="warning-body">
                <h3>Permanent Account & Data Deletion</h3>
                <p>
                  Deleting your account will permanently purge your personal profile, registered pet
                  profiles, missing dog listings, photos, and associated sighting records.
                </p>
              </div>
            </div>

            <div className="deletion-impact-breakdown">
              <h4>What happens when you delete your account:</h4>
              <ul className="deletion-impact-list">
                <li>
                  <span className="impact-bullet danger">✕</span>
                  <div>
                    <strong>User Account & Credentials:</strong> Your sign-in profile, parent contact
                    details, and stored email are erased.
                  </div>
                </li>
                <li>
                  <span className="impact-bullet danger">✕</span>
                  <div>
                    <strong>Pet Profiles & Missing Reports:</strong> All registered dogs, missing reports,
                    and community alert flyers created by you are removed from the community feed.
                  </div>
                </li>
                <li>
                  <span className="impact-bullet danger">✕</span>
                  <div>
                    <strong>Photographs & Sightings:</strong> Uploaded dog photos and sighting comments
                    submitted under this account are permanently removed.
                  </div>
                </li>
                <li>
                  <span className="impact-bullet info">ℹ</span>
                  <div>
                    <strong>Consent & Session:</strong> Your active session is terminated, and your consent
                    record is revoked. Returning in the future will require fresh consent acceptance.
                  </div>
                </li>
              </ul>
            </div>

            {!showDeleteConfirm ? (
              <div className="delete-action-trigger">
                <button
                  type="button"
                  className="btn-danger-large"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Request Account Deletion
                </button>
              </div>
            ) : (
              <div className="delete-confirm-box">
                <h4>Are you absolutely sure?</h4>
                <p>
                  This action is <strong>irreversible</strong>. Type <strong>DELETE</strong> in the box
                  below to confirm immediate deletion of your account and pet data:
                </p>

                {deleteError && <div className="delete-error-msg">{deleteError}</div>}

                <div className="delete-confirm-input-row">
                  <input
                    type="text"
                    placeholder="Type DELETE"
                    value={deleteInputConfirmation}
                    onChange={(e) => {
                      setDeleteInputConfirmation(e.target.value);
                      setDeleteError('');
                    }}
                    className="delete-input"
                  />
                  <button
                    type="button"
                    className="btn-confirm-delete"
                    disabled={isDeleting || deleteInputConfirmation.trim().toUpperCase() !== 'DELETE'}
                    onClick={handleDeleteAccount}
                  >
                    {isDeleting ? 'Deleting Data...' : 'Confirm Permanent Deletion'}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    disabled={isDeleting}
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteInputConfirmation('');
                      setDeleteError('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="settings-modal-footer">
          {user && (
            <button
              type="button"
              className="btn-secondary-link"
              onClick={() => {
                logout();
                onClose();
              }}
            >
              Sign Out of Account
            </button>
          )}
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
