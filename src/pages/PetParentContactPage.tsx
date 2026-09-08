import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Phone, Check, ArrowRight, Camera, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import type { ContactMethod, OwnerProfile } from '../types';
import { triggerStarCelebration } from '../utils/confettiHelper';

interface PetParentContactPageProps {
  onSuccess?: () => void;
}

export const PetParentContactPage: React.FC<PetParentContactPageProps> = ({ onSuccess }) => {
  const { user, hasCompletedOwner, refreshProgress, setActiveOnboardingTab } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const existingProfile = user ? storageService.getOwnerProfileByUserId(user.id) : null;

  const [fullName, setFullName] = useState(existingProfile?.fullName || user?.name || '');
  const [phone, setPhone] = useState(existingProfile?.phone || user?.phone || '');
  const [photo, setPhoto] = useState<string>(existingProfile?.photo || '');
  const [preferredContact, setPreferredContact] = useState<ContactMethod>(
    existingProfile?.preferredContact || 'phone'
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file (JPG, PNG, WebP).', 'warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be under 5MB.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result as string);
      showToast('✓ Photo attached! Click Save to apply.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showToast('Please enter your full name.', 'warning');
      return;
    }
    if (!phone.trim()) {
      showToast('Please enter your contact phone number.', 'warning');
      return;
    }

    if (!user) return;

    const profile: OwnerProfile = {
      ...(existingProfile || {}),
      id: existingProfile?.id || `owner-${user.id}`,
      userId: user.id,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: user.email,
      photo: photo.trim() || undefined,
      preferredContact,
      address: existingProfile?.address || '',
      state: existingProfile?.state || '',
      district: existingProfile?.district || '',
      city: existingProfile?.city || '',
      hasLocationConsent: existingProfile?.hasLocationConsent ?? true,
      updatedAt: new Date().toISOString(),
    };

    storageService.saveOwnerProfile(profile);
    refreshProgress();
    triggerStarCelebration();
    showToast('🐾 Pet Parent profile saved!', 'success');

    if (onSuccess) {
      onSuccess();
    } else {
      setActiveOnboardingTab('location');
      navigate('/location');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="onboarding-page">
      <div className="app-container onboarding-container">
        <div className="onboarding-card card owner-theme-card">
          <div className="onboarding-header">
            <div className="cute-welcome-banner">
              <div className="cute-welcome-icon">🐶</div>
              <div className="cute-welcome-text">
                <h1 className="cute-page-title">Pet Parent Contact 🐾</h1>
                <p className="cute-page-sub">
                  Simple details so kind neighbors can reach you when your puppy is found! 💛
                </p>
              </div>
            </div>

            {hasCompletedOwner && (
              <div className="already-saved-banner cute-saved-banner">
                <span>✓ Pet Parent details saved on file.</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveOnboardingTab('location');
                    navigate('/location');
                  }}
                  className="btn btn-outline btn-xs skip-to-dog-btn"
                >
                  <span>Go to Location Form 📍</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="onboarding-form">
            <div className="form-section-card cute-section-card">
              <h3 className="section-title-sm cute-section-title">
                <span className="cute-title-icon">🐾</span>
                <span>Contact Details</span>
              </h3>

              <div className="form-vertical-stack">
                {/* Optional Owner Photo Upload */}
                <div className="owner-avatar-field-card">
                  <label className="form-label cute-label">
                    <span>📸 Owner Profile Photo</span>
                    <span className="optional-tag" style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: '#9CA3AF' }}>
                      (Optional)
                    </span>
                  </label>

                  <div className="owner-avatar-control-row">
                    <div className="avatar-preview-wrap">
                      {photo ? (
                        <div className="avatar-img-circle">
                          <img src={photo} alt={fullName || 'Owner'} className="owner-avatar-img" />
                          <button
                            type="button"
                            onClick={() => setPhoto('')}
                            className="avatar-remove-btn"
                            title="Remove photo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="avatar-placeholder-circle"
                          onClick={() => fileInputRef.current?.click()}
                          role="button"
                          tabIndex={0}
                          title="Click to select photo"
                        >
                          <UserIcon size={34} className="avatar-placeholder-icon" />
                          <div className="avatar-camera-badge">
                            <Camera size={13} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="avatar-meta-info">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-outline btn-sm cute-upload-btn"
                      >
                        <Camera size={14} />
                        <span>{photo ? 'Change Photo' : 'Upload Your Photo'}</span>
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      <span className="form-hint" style={{ marginTop: '0.35rem', display: 'block' }}>
                        Displayed at top in the navigation bar & flyers. JPG/PNG under 5MB.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label cute-label" htmlFor="parent-name">
                    <span>👤 Your Full Name</span> <span className="required-tag">*</span>
                  </label>
                  <div className="input-with-icon">
                    <UserIcon size={16} className="input-icon text-terracotta" />
                    <input
                      id="parent-name"
                      type="text"
                      className="form-input cute-input"
                      placeholder="e.g. Suresh Varma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label cute-label" htmlFor="parent-phone">
                    <span>📞 Phone Number to Call</span> <span className="required-tag">*</span>
                  </label>
                  <div className="input-with-icon">
                    <Phone size={16} className="input-icon text-terracotta" />
                    <input
                      id="parent-phone"
                      type="tel"
                      className="form-input cute-input"
                      placeholder="+91 98480 •••••"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label cute-label">
                    <span>💬 Preferred Reach Out Channel</span>
                  </label>
                  <div className="contact-method-chips cute-chips">
                    <button
                      type="button"
                      className={`method-chip cute-chip ${preferredContact === 'phone' ? 'active' : ''}`}
                      onClick={() => setPreferredContact('phone')}
                    >
                      <span>📞 Direct Call</span>
                      {preferredContact === 'phone' && <Check size={14} className="check-icon" />}
                    </button>

                    <button
                      type="button"
                      className={`method-chip cute-chip ${preferredContact === 'whatsapp' ? 'active' : ''}`}
                      onClick={() => setPreferredContact('whatsapp')}
                    >
                      <span>💬 WhatsApp</span>
                      {preferredContact === 'whatsapp' && <Check size={14} className="check-icon" />}
                    </button>

                    <button
                      type="button"
                      className={`method-chip cute-chip ${preferredContact === 'email' ? 'active' : ''}`}
                      onClick={() => setPreferredContact('email')}
                    >
                      <span>✉️ Email</span>
                      {preferredContact === 'email' && <Check size={14} className="check-icon" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="wizard-actions-footer">
              <div />
              <button type="submit" className="btn btn-primary btn-lg">
                <span>Save & Continue to Location</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
