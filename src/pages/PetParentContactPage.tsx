import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Check, ArrowRight, Camera, Trash2, Edit3, AlertCircle, CheckCircle2, X, Upload, Phone, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import type { ContactMethod, OwnerProfile } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { validateIndianPhoneNumber } from '../utils/phoneValidator';
import { sanitizePersonName } from '../utils/privacyUtils';
import { storageBucketService } from '../services/storageBucketService';
import { firebaseSyncService } from '../services/firebaseSyncService';
import { isPetPhotoUrl } from '../utils/dogPhotoHelper';
import { applyPhotoChangeTracking, canChangePhoto } from '../utils/photoChangePolicy';
import { CameraModal } from '../components/CameraModal';

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

  const isProfileFilled = Boolean(
    (existingProfile?.fullName && existingProfile?.phone) ||
    (user?.name && user?.phone)
  );
  const [isEditing, setIsEditing] = useState<boolean>(!isProfileFilled);
  const initialModeSetRef = useRef(false);

  const [savedSnapshot, setSavedSnapshot] = useState({
    name: initialCleanName,
    phone: existingProfile?.phone || user?.phone || '',
    photo: initialPhoto,
    contact: existingProfile?.preferredContact || 'phone',
  });

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showAvatarIcons, setShowAvatarIcons] = useState(!photo);

  useEffect(() => {
    if (!photo) setShowAvatarIcons(true);
  }, [photo]);

  useEffect(() => {
    const handleRetriedUpload = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!user || detail?.category !== 'profile' || detail?.referenceId !== user.id || !detail?.publicUrl) return;
      const currentProfile = storageService.getOwnerProfileByUserId(user.id, user.email);
      if (!currentProfile) return;
      const updated = applyPhotoChangeTracking({
        ...currentProfile,
        photo: detail.publicUrl,
        updatedAt: new Date().toISOString(),
      }, currentProfile);
      storageService.saveOwnerProfile(updated);
      authService.updateCurrentUser({ avatar: detail.publicUrl });
      setPhoto(detail.publicUrl);
      setSavedSnapshot((prev) => ({ ...prev, photo: detail.publicUrl }));
      refreshProgress();
      showToast('✓ Queued owner photo uploaded!', 'success');
    };
    window.addEventListener('findlostpuppy_media_uploaded', handleRetriedUpload);
    return () => window.removeEventListener('findlostpuppy_media_uploaded', handleRetriedUpload);
  }, [refreshProgress, showToast, user]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

        if (!initialModeSetRef.current && (cleanedName || user.name) && (p.phone || user.phone)) {
          initialModeSetRef.current = true;
          setIsEditing(false);
        }
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

        if (!initialModeSetRef.current && cleanedName && user.phone) {
          initialModeSetRef.current = true;
          setIsEditing(false);
        }
      }
    }
  }, [user?.id, user?.email]);

  const hasProfileData = Boolean(
    (fullName.trim() && phone.trim()) ||
    (existingProfile?.fullName && existingProfile?.phone) ||
    (user?.name && user?.phone)
  );

  const photoPolicy = canChangePhoto(existingProfile);
  const photoLimitText = photoPolicy.isInitialPhoto
    ? 'First owner photo upload is free.'
    : photoPolicy.allowed
      ? `${photoPolicy.remaining} owner photo change${photoPolicy.remaining === 1 ? '' : 's'} left this month.`
      : 'Owner photo change limit reached. Admin approval is required.';

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
    const existingOwnerProfile = user ? storageService.getOwnerProfileByUserId(user.id, user.email) : null;
    const policy = canChangePhoto(existingOwnerProfile);
    if (!policy.allowed) {
      showToast('Owner photo can be changed twice per month. Please contact admin approval for another update.', 'warning');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    try {
      showToast('Compressing photo for lightning-fast save...', 'info');
      const compressed = await compressImage(file, 600, 600, 0.85);
      if (!user?.id) throw new Error('AUTH_REQUIRED');
      const finalPhotoUrl = await storageBucketService.uploadProfileAvatar(user.id, compressed, existingOwnerProfile?.photo);
      if (!finalPhotoUrl) {
        const queued = storageBucketService.enqueueItem({
          category: 'profile',
          referenceId: user.id,
          base64Data: compressed,
          previousUrl: existingOwnerProfile?.photo,
        });
        showToast(
          queued
            ? 'Photo upload is queued and will retry when the connection is available.'
            : 'Could not upload the photo. Please check your connection and try again.',
          queued ? 'info' : 'error',
        );
        return;
      }
      setPhoto(finalPhotoUrl);

      authService.updateCurrentUser({ avatar: finalPhotoUrl });
      if (user) {
        const updated: OwnerProfile = {
          ...(existingOwnerProfile || {}),
          id: user.id,
          userId: user.id,
          fullName: fullName.trim() || user.name || '',
          phone: phone.trim() || user.phone || '',
          email: user.email,
          photo: finalPhotoUrl,
          preferredContact,
          address: existingOwnerProfile?.address || '',
          state: existingOwnerProfile?.state || '',
          district: existingOwnerProfile?.district || '',
          city: existingOwnerProfile?.city || '',
          hasLocationConsent: existingOwnerProfile?.hasLocationConsent ?? true,
          updatedAt: new Date().toISOString(),
        };
        storageService.saveOwnerProfile(applyPhotoChangeTracking(updated, existingOwnerProfile));
        refreshProgress();
      }
      setSavedSnapshot((prev) => ({ ...prev, photo: finalPhotoUrl }));
      showToast('✓ Photo updated!', 'success');
    } catch {
      showToast('Could not process photo. Please try another image.', 'error');
    }
  };

  const handleHardReset = async () => {
    const isAppManagedPhoto = photo.includes('cloudinary.com') || photo.includes('firebasestorage');
    if (isAppManagedPhoto) {
      try {
        const deleted = await storageBucketService.deleteMedia(photo);
        if (!deleted) {
          showToast('Could not remove the stored photo. Check your connection and try again.', 'error');
          return;
        }
      } catch {
        showToast('Could not remove the stored photo. Check your connection and try again.', 'error');
        return;
      }
    }
    setFullName('');
    setPhone('');
    setPhoneError(null);
    setPhoto('');
    authService.updateCurrentUser({ name: undefined, phone: undefined, avatar: undefined });
    if (user) {
      const p = storageService.getOwnerProfileByUserId(user.id, user.email);
      if (p) {
        const updated: OwnerProfile = {
          ...p,
          fullName: '',
          phone: '',
          photo: undefined,
          updatedAt: new Date().toISOString(),
        };
        storageService.saveOwnerProfile(updated, true);
        refreshProgress();
      }
    }
    setSavedSnapshot((prev) => ({ ...prev, name: '', phone: '', photo: '' }));
    showToast('Profile hard reset.', 'info');
  };

  const handleCancelEdit = () => {
    setFullName(savedSnapshot.name);
    setPhone(savedSnapshot.phone);
    setPhoto(savedSnapshot.photo);
    setPreferredContact(savedSnapshot.contact);
    setPhoneError(null);
    setIsEditing(false);
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
    if (!photo.trim()) {
      showToast('Please upload a profile photo. A photo is required to verify your identity.', 'warning');
      return false;
    }
    if (photo.startsWith('data:')) {
      showToast('This photo has not finished uploading. Please reconnect or choose the photo again.', 'warning');
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
      mandalOrMunicipality: existingProfile?.mandalOrMunicipality || '',
      city: existingProfile?.city || '',
      streetOrLocality: existingProfile?.streetOrLocality || existingProfile?.street || '',
      street: existingProfile?.street || existingProfile?.streetOrLocality || '',
      pinCode: existingProfile?.pinCode || '',
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
    setIsEditing(false);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfileInternal(true);
  };

  const handleContinueToLocation = async () => {
    // Auto-sync profile and avatar to Cloudinary & Firebase cloud
    try {
      const currentProfile = storageService.getOwnerProfileByUserId(user?.id || '');
      if (currentProfile) {
        firebaseSyncService.syncOwnerProfile(currentProfile, currentProfile.id || '').catch(() => {});
        showToast('✓ Pet Parent details & photo synced to cloud!', 'success');
      }
    } catch {}

    if (onSuccess) {
      onSuccess();
    } else {
      setActiveOnboardingTab('location');
      navigate('/location');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitToDashboard = () => {
    setActiveOnboardingTab('dashboard');
    navigate('/dashboard');
  };

  return (
    <div className="onboarding-page owner-profile-page">
      <div className="app-container onboarding-container owner-onboarding-container">
        <div className="onboarding-card card owner-theme-card owner-combined-card">
          <button
            type="button"
            className="onboarding-exit-btn"
            onClick={handleExitToDashboard}
            aria-label="Exit owner details and go to dashboard"
            title="Exit to dashboard"
          >
            <X size={19} />
          </button>
          <div className="section-card-title-block">
            <h1>Owner Details</h1>
          </div>

          {!isEditing ? (
            <div className="owner-profile-view-content">
              {/* Clean Avatar Hero (No floating action badges) */}
              <div className="owner-unified-avatar-hero owner-avatar-view-hero">
                <div className="owner-center-avatar-box">
                  <div
                    className="owner-center-avatar-ring owner-view-avatar-ring"
                    onClick={() => {
                      if (photoPolicy.allowed) {
                        setIsEditing(true);
                      } else {
                        showToast('Photo change limit reached. Click Modify Details below to edit text details.', 'info');
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    title="Click to modify photo or details"
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
                </div>
              </div>

              {/* Saved owner details are read-only; use the single Modify action below. */}
              <div className="owner-profile-view-wrap">
                <div className="owner-view-details-card">
                  <div className="owner-view-row">
                    <div className="owner-view-icon-badge">
                      <UserIcon size={20} />
                    </div>
                    <div className="owner-view-data">
                      <span className="owner-view-label">Full Name</span>
                      <span className="owner-view-value">{fullName || user?.name || 'Owner Name'}</span>
                    </div>
                  </div>

                  <div className="owner-view-row">
                    <div className="owner-view-icon-badge">
                      <Phone size={20} />
                    </div>
                    <div className="owner-view-data">
                      <span className="owner-view-label">Mobile Phone Number</span>
                      <div className="owner-view-phone-row">
                        <span className="owner-view-value">
                          {validateIndianPhoneNumber(phone).isValid
                            ? `+91 ${validateIndianPhoneNumber(phone).cleanDigits}`
                            : (phone ? `+91 ${phone}` : 'Not provided')}
                        </span>
                        {phone && validateIndianPhoneNumber(phone).isValid && (
                          <span className="owner-view-verified-pill">
                            <CheckCircle2 size={13} />
                            <span>Verified Mobile</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {(user?.email || existingProfile?.email) && (
                    <div className="owner-view-row">
                      <div className="owner-view-icon-badge">
                        <Mail size={20} />
                      </div>
                      <div className="owner-view-data">
                        <span className="owner-view-label">Email Address</span>
                        <span className="owner-view-value">{user?.email || existingProfile?.email}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions for View Mode */}
              <div className="owner-actions-bottom-row view-mode-actions">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="owner-modify-btn"
                >
                  <Edit3 size={16} />
                  <span>Modify Details / Photo</span>
                </button>

                <button
                  type="button"
                  onClick={handleContinueToLocation}
                  className="btn btn-primary btn-lg continue-to-location-orange-btn"
                >
                  <span>Continue to Location</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="onboarding-form owner-combined-form">
              {/* 1. ENLARGED PROFILE PICTURE HERO (With Edit Badges & Actions) */}
              <div className="owner-unified-avatar-hero">
                <div
                  className="owner-center-avatar-box"
                  onMouseEnter={() => setShowAvatarIcons(true)}
                  onMouseLeave={() => { if (photo) setShowAvatarIcons(false); }}
                  onTouchStart={() => setShowAvatarIcons(true)}
                  onFocus={() => setShowAvatarIcons(true)}
                  tabIndex={0}
                >
                  <div
                    className={`owner-center-avatar-ring ${!photoPolicy.allowed ? 'photo-upload-locked' : ''}`}
                    onClick={() => {
                      setShowAvatarIcons(true);
                      if (photoPolicy.allowed) fileInputRef.current?.click();
                    }}
                    role="button"
                    tabIndex={0}
                    title={photoPolicy.allowed ? 'Tap to change profile picture' : 'Photo change limit reached'}
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

                  <div
                    className="owner-avatar-actions-group"
                    style={{
                      display: 'flex',
                      gap: '8px',
                      position: 'absolute',
                      bottom: '-15px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      opacity: (!photo || showAvatarIcons) ? 1 : 0,
                      pointerEvents: (!photo || showAvatarIcons) ? 'auto' : 'none',
                      transition: 'opacity 0.2s ease, transform 0.2s ease',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (photoPolicy.allowed) fileInputRef.current?.click();
                      }}
                      className="owner-center-camera-btn"
                      style={{ position: 'static', transform: 'none' }}
                      disabled={!photoPolicy.allowed}
                      title={photoPolicy.allowed ? 'Upload from Gallery' : 'Photo change limit reached'}
                      aria-label={photoPolicy.allowed ? 'Upload from Gallery' : 'Photo change limit reached'}
                    >
                      <Upload size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (photoPolicy.allowed) setIsCameraOpen(true);
                      }}
                      className="owner-center-camera-btn"
                      style={{ position: 'static', transform: 'none' }}
                      disabled={!photoPolicy.allowed}
                      title={photoPolicy.allowed ? 'Take Photo with Camera' : 'Photo change limit reached'}
                      aria-label={photoPolicy.allowed ? 'Take Photo with Camera' : 'Photo change limit reached'}
                    >
                      <Camera size={18} />
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <input
                    type="file"
                    ref={cameraInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    capture="user"
                    style={{ display: 'none' }}
                  />
                </div>

                <div className={`photo-change-limit-note ${photoPolicy.allowed ? '' : 'is-locked'}`}>
                  {photoLimitText}
                </div>

                <button
                  type="button"
                  onClick={handleHardReset}
                  className="btn btn-ghost btn-xs remove-photo-link"
                >
                  <Trash2 size={13} />
                  <span>Hard Reset</span>
                </button>
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

              {/* 3. ACTIONS IN EDIT MODE */}
              <div className="owner-actions-bottom-row edit-mode-actions">
                {hasProfileData && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="owner-cancel-edit-btn"
                  >
                    <X size={16} />
                    <span>Cancel</span>
                  </button>
                )}

                <button
                  type="submit"
                  className="owner-save-btn"
                >
                  <Check size={16} />
                  <span>Save & Update Details</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        title="Owner Profile Photo"
        captureButtonText="Capture Owner Photo"
        onCapture={async (photoData) => {
          try {
            const res = await fetch(photoData);
            const blob = await res.blob();
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            const compressed = await compressImage(file, 600, 600, 0.85);
            if (!user?.id) throw new Error('AUTH_REQUIRED');
            const currentProfile = storageService.getOwnerProfileByUserId(user.id, user.email);
            const uploadedUrl = await storageBucketService.uploadProfileAvatar(
              user.id,
              compressed,
              currentProfile?.photo,
            );
            if (!uploadedUrl) {
              const queued = storageBucketService.enqueueItem({
                category: 'profile',
                referenceId: user.id,
                base64Data: compressed,
                previousUrl: currentProfile?.photo,
              });
              showToast(
                queued
                  ? 'Photo upload is queued and will retry when the connection is available.'
                  : 'Could not upload the photo. Please check your connection and try again.',
                queued ? 'info' : 'error',
              );
              return;
            }
            setPhoto(uploadedUrl);
            showToast('✓ Owner photo uploaded securely!', 'success');
          } catch {
            showToast('Could not process the camera photo. Please try again.', 'error');
          }
        }} 
      />
    </div>
  );
};
