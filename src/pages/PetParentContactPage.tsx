import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Check, ArrowRight, Camera, Trash2, Edit3, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import type { ContactMethod, OwnerProfile } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { validateIndianPhoneNumber } from '../utils/phoneValidator';
import { sanitizePersonName } from '../utils/privacyUtils';
import { storageBucketService } from '../services/storageBucketService';
import { isPetPhotoUrl } from '../utils/dogPhotoHelper';

interface PetParentContactPageProps {
  onSuccess?: () => void;
}

export const PetParentContactPage: React.FC<PetParentContactPageProps> = ({ onSuccess }) => {
  const { user, refreshProgress, setActiveOnboardingTab } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const existingProfile = user ? storageService.getOwnerProfileByUserId(user.id, user.email) : null;
  const initialCleanName = sanitizePersonName(existingProfile?.fullName || user?.name, user?.email || existingProfile?.email);

  const rawInitialPhoto = existingProfile?.photo || user?.avatar || '';
  const initialPhoto = isPetPhotoUrl(rawInitialPhoto) ? '' : rawInitialPhoto;

  const [fullName, setFullName] = useState(initialCleanName);
  const [phone, setPhone] = useState(existingProfile?.phone || user?.phone || '');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string>(initialPhoto);
  const [preferredContact, setPreferredContact] = useState<ContactMethod>(
    existingProfile?.preferredContact || 'phone'
  );

  const [savedSnapshot, setSavedSnapshot] = useState({
    name: initialCleanName,
    phone: existingProfile?.phone || user?.phone || '',
    photo: initialPhoto,
    contact: existingProfile?.preferredContact || 'phone',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync when user or profile loads
  useEffect(() => {
    if (user) {
      if (user.avatar && isPetPhotoUrl(user.avatar)) {
        authService.updateCurrentUser({ avatar: undefined });
      }

      const p = storageService.getOwnerProfileByUserId(user.id, user.email);
      if (p) {
        const cleanedName = sanitizePersonName(p.fullName, user.email || p.email);
        setFullName(cleanedName);
        if (p.phone) setPhone(p.phone);
        const effectivePhoto = isPetPhotoUrl(p.photo)
          ? ''
          : p.photo || (!isPetPhotoUrl(user.avatar) ? user.avatar : '') || '';
        setPhoto(effectivePhoto);
        if (p.preferredContact) setPreferredContact(p.preferredContact);

        setSavedSnapshot({
          name: cleanedName,
          phone: p.phone || user.phone || '',
          photo: effectivePhoto,
          contact: p.preferredContact || 'phone',
        });
      } else {
        const cleanedName = sanitizePersonName(user.name, user.email);
        setFullName(cleanedName);
        if (user.phone) setPhone(user.phone);
        const userAvatar = !isPetPhotoUrl(user.avatar) ? user.avatar : '';
        if (userAvatar) setPhoto(userAvatar);

        setSavedSnapshot({
          name: cleanedName,
          phone: user.phone || '',
          photo: userAvatar || '',
          contact: 'phone',
        });
      }
    }
  }, [user?.id, user?.email]);

  const hasChanges = Boolean(
    fullName.trim() !== savedSnapshot.name.trim() ||
    phone.trim() !== savedSnapshot.phone.trim() ||
    photo.trim() !== savedSnapshot.photo.trim()
  );

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    try {
      showToast('Compressing photo for lightning-fast save...', 'info');
      const compressed = await compressImage(file, 600, 600, 0.85);
      setPhoto(compressed);

      let finalPhotoUrl = compressed;
      if (user?.id) {
        try {
          const publicUrl = await storageBucketService.uploadProfileAvatar(user.id, compressed);
          if (publicUrl) {
            finalPhotoUrl = publicUrl;
            setPhoto(publicUrl);
          }
        } catch (uploadErr) {
          console.warn('[PetParentContactPage] Cloud upload fallback to local preview:', uploadErr);
        }
      }

      authService.updateCurrentUser({ avatar: finalPhotoUrl });
      if (user) {
        const p = storageService.getOwnerProfileByUserId(user.id, user.email);
        const updated: OwnerProfile = {
          ...(p || {}),
          id: user.id,
          userId: user.id,
          fullName: fullName.trim() || user.name || '',
          phone: phone.trim() || user.phone || '',
          email: user.email,
          photo: finalPhotoUrl,
          preferredContact,
          address: p?.address || '',
          state: p?.state || '',
          district: p?.district || '',
          city: p?.city || '',
          hasLocationConsent: p?.hasLocationConsent ?? true,
          updatedAt: new Date().toISOString(),
        };
        storageService.saveOwnerProfile(updated);
        refreshProgress();
      }
      setSavedSnapshot((prev) => ({ ...prev, photo: finalPhotoUrl }));
      showToast('✓ Photo updated!', 'success');
    } catch {
      showToast('Could not process photo. Please try another image.', 'error');
    }
  };

  const handlePhotoRemove = () => {
    setPhoto('');
    authService.updateCurrentUser({ avatar: undefined });
    if (user) {
      const p = storageService.getOwnerProfileByUserId(user.id, user.email);
      if (p) {
        const updated: OwnerProfile = {
          ...p,
          photo: undefined,
          updatedAt: new Date().toISOString(),
        };
        storageService.saveOwnerProfile(updated, true);
        refreshProgress();
      }
    }
    setSavedSnapshot((prev) => ({ ...prev, photo: '' }));
    showToast('Photo removed.', 'info');
  };

  const saveProfileInternal = (showNotification = true): boolean => {
    if (!fullName.trim()) {
      showToast('Please enter your full name.', 'warning');
      return false;
    }
    if (!phone.trim()) {
      setPhoneError('Please enter your contact phone number.');
      showToast('Please enter your contact phone number.', 'warning');
      return false;
    }

    const phoneValidation = validateIndianPhoneNumber(phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || 'Please enter a valid 10-digit Indian phone number.');
      showToast(phoneValidation.error || 'Please enter a valid 10-digit Indian phone number.', 'warning');
      return false;
    }

    setPhoneError(null);
    const effectiveUserId = user?.id || existingProfile?.userId || 'user-parent-' + Date.now();
    const effectiveEmail = user?.email || existingProfile?.email || 'parent@findlostpuppy.com';
    const cleanPhoneNumber = phoneValidation.cleanDigits;

    const profile: OwnerProfile = {
      ...(existingProfile || {}),
      id: effectiveUserId,
      userId: effectiveUserId,
      fullName: fullName.trim(),
      phone: cleanPhoneNumber,
      email: effectiveEmail,
      photo: photo.trim() || undefined,
      preferredContact,
      address: existingProfile?.address || '',
      state: existingProfile?.state || '',
      district: existingProfile?.district || '',
      city: existingProfile?.city || '',
      hasLocationConsent: existingProfile?.hasLocationConsent ?? true,
      updatedAt: new Date().toISOString(),
    };

    storageService.saveOwnerProfile(profile, !photo.trim());
    authService.updateCurrentUser({
      name: fullName.trim(),
      phone: cleanPhoneNumber,
      avatar: photo.trim() || undefined,
    });
    refreshProgress();
    setSavedSnapshot({
      name: fullName.trim(),
      phone: cleanPhoneNumber,
      photo: photo.trim(),
      contact: preferredContact,
    });
    if (showNotification) {
      showToast('🐾 Pet Parent profile updated successfully!', 'success');
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = saveProfileInternal(true);
    if (ok) {
      handleContinueToLocation();
    }
  };

  const handleContinueToLocation = () => {
    if (hasChanges) {
      const ok = saveProfileInternal(false);
      if (!ok) return;
    }
    if (onSuccess) {
      onSuccess();
    } else {
      setActiveOnboardingTab('location');
      navigate('/location');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="onboarding-page owner-profile-page">
      <div className="app-container onboarding-container owner-onboarding-container">
        <div className="onboarding-card card owner-theme-card owner-combined-card">
          <form onSubmit={handleSubmit} className="onboarding-form owner-combined-form">
            {/* 1. ENLARGED PROFILE PICTURE HERO (Unified, No Split Box) */}
            <div className="owner-unified-avatar-hero">
              <div className="owner-center-avatar-box">
                <div
                  className="owner-center-avatar-ring"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  title="Tap to change profile picture"
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt={fullName || 'Owner Profile'}
                      className="owner-center-avatar-img"
                    />
                  ) : (
                    <div className="owner-center-avatar-placeholder">
                      <UserIcon size={64} />
                    </div>
                  )}
                </div>

                {/* Quick Camera Action Badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="owner-center-camera-btn"
                  title="Upload or change photo"
                  aria-label="Upload or change photo"
                >
                  <Camera size={18} />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>

              {photo && (
                <button
                  type="button"
                  onClick={handlePhotoRemove}
                  className="btn btn-ghost btn-xs remove-photo-link"
                >
                  <Trash2 size={13} />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>

            {/* 2. FORM INPUTS (Flows Directly from Avatar in the Same Card) */}
            <div className="owner-combined-fields">
              {/* Full Name input */}
              <div className="owner-modern-form-group">
                <label className="owner-modern-label" htmlFor="owner-full-name">
                  <span>Full Name</span>
                  <span className="required-tag" style={{ color: 'var(--color-primary)', marginLeft: '3px' }}>*</span>
                </label>
                <div className="owner-modern-input-wrapper">
                  <div className="owner-input-icon-prefix">
                    <UserIcon size={18} />
                  </div>
                  <input
                    id="owner-full-name"
                    type="text"
                    required
                    className="owner-modern-input"
                    placeholder="e.g. Jaya Krishna"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              {/* 10-Digit Indian Phone Number */}
              <div className="owner-modern-form-group">
                <label className="owner-modern-label" htmlFor="owner-phone">
                  <span>Mobile Phone Number</span>
                  <span className="required-tag" style={{ color: 'var(--color-primary)', marginLeft: '3px' }}>*</span>
                </label>
                <div className={`owner-modern-input-wrapper ${phoneError ? 'input-error' : ''}`}>
                  <div className="owner-input-badge-prefix">
                    <span>+91</span>
                  </div>
                  <input
                    id="owner-phone"
                    type="tel"
                    required
                    className="owner-modern-input"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(val);
                      if (phoneError) setPhoneError(null);
                    }}
                  />
                </div>
                {phoneError ? (
                  <span className="form-hint input-error-text" style={{ color: 'var(--color-lost)', fontWeight: 600, fontSize: '0.82rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertCircle size={14} />
                    <span>{phoneError}</span>
                  </span>
                ) : phone.trim() && validateIndianPhoneNumber(phone).isValid ? (
                  <span className="phone-validation-success" style={{ color: 'var(--color-reunited)', fontSize: '0.82rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                    <CheckCircle2 size={14} />
                    <span>Valid 10-digit Indian Mobile: {validateIndianPhoneNumber(phone).formatted}</span>
                  </span>
                ) : (
                  <span className="form-hint" style={{ marginTop: '0.35rem', display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Protected with owner privacy masking on public dashboards.
                  </span>
                )}
              </div>
            </div>

            {/* 3. ACTIONS: DYNAMIC UPDATE BUTTON WHEN EDITED + ALWAYS ORANGE CONTINUE BUTTON */}
            <div className="owner-actions-bottom-row">
              {hasChanges ? (
                <button
                  type="submit"
                  className="btn btn-outline btn-lg update-profile-btn has-pending-changes"
                >
                  <Edit3 size={16} />
                  <span>Update Details</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => showToast('Profile details are synced!', 'info')}
                  className="btn btn-ghost btn-sm text-muted synced-status-btn"
                >
                  <Check size={14} />
                  <span>Details Synced</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleContinueToLocation}
                className="btn btn-primary btn-lg continue-to-location-orange-btn"
              >
                <span>Continue to Location</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
