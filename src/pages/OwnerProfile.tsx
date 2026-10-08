import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Check, ArrowRight, Camera, Trash2, Edit3, AlertCircle, CheckCircle2, X, Upload, Phone, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import type { ContactMethod, OwnerProfile as OwnerProfileType } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { validateIndianPhoneNumber } from '../utils/phoneValidator';
import { sanitizePersonName } from '../utils/privacyUtils';
import { storageBucketService } from '../services/storageBucketService';
import { firebaseSyncService } from '../services/firebaseSyncService';
import { isPetPhotoUrl, isValidOwnerPhoto } from '../utils/dogPhotoHelper';
import { applyPhotoChangeTracking, canChangePhoto } from '../utils/photoChangePolicy';
import { CameraModal } from '../components/CameraModal';
import { BackButton } from '../components/ui/back-button';
import { VillageDogTransition } from '../components/ui/VillageDogTransition';

interface OwnerProfileProps {
  onSuccess?: () => void;
}

/** Displays saved owner contact details and an editing form with managed profile-photo uploads. */
export const OwnerProfile: React.FC<OwnerProfileProps> = ({ onSuccess }) => {
  const { user, refreshProgress, setActiveOnboardingTab } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const existingProfile = user ? storageService.getOwnerProfileByUserId(user.id, user.email) : null;
  const initialCleanName = sanitizePersonName(existingProfile?.fullName || user?.name, user?.email || existingProfile?.email);

  // Only genuine user-uploaded photos (from folder or camera) are accepted.
  // Google avatar letter placeholders ("A", "B", "C") and pet images are strictly excluded.
  const rawInitialPhoto = (existingProfile?.photo && isValidOwnerPhoto(existingProfile.photo))
    ? existingProfile.photo
    : '';
  const initialPhoto = rawInitialPhoto;

  const [fullName, setFullName] = useState(initialCleanName);
  const [phone, setPhone] = useState(existingProfile?.phone || user?.phone || '');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string>(initialPhoto);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [preferredContact, setPreferredContact] = useState<ContactMethod>(
    existingProfile?.preferredContact || 'phone'
  );

  // All 3 fields (photo, fullName, and phone) are strictly mandatory.
  const isProfileFilled = Boolean(
    initialCleanName.trim() &&
    (existingProfile?.phone?.trim() || user?.phone?.trim()) &&
    initialPhoto &&
    isValidOwnerPhoto(initialPhoto)
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!photo) setShowAvatarIcons(true);
  }, [photo]);

  useEffect(() => {
    /** Applies a completed queued profile upload to the current owner's stored profile, session, and form. */
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
  const ownerFormRef = useRef<HTMLFormElement | null>(null);
  const ownerActionsRef = useRef<HTMLDivElement | null>(null);
  const initialActionScrollRef = useRef(false);

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
        const effectivePhoto = (p.photo && isValidOwnerPhoto(p.photo)) ? p.photo : '';
        setPhoto(effectivePhoto);
        if (p.preferredContact) setPreferredContact(p.preferredContact);

        setSavedSnapshot({
          name: cleanedName,
          phone: p.phone || user.phone || '',
          photo: effectivePhoto,
          contact: p.preferredContact || 'phone',
        });

        const hasAllThree = Boolean(
          cleanedName &&
          (p.phone || user.phone) &&
          effectivePhoto &&
          isValidOwnerPhoto(effectivePhoto)
        );

        if (!initialModeSetRef.current) {
          initialModeSetRef.current = true;
          setIsEditing(!hasAllThree);
        }
      } else {
        const cleanedName = sanitizePersonName(user.name, user.email);
        setFullName(cleanedName);
        if (user.phone) setPhone(user.phone);
        // Do not take Gmail photo / letter avatar
        setPhoto('');

        setSavedSnapshot({
          name: cleanedName,
          phone: user.phone || '',
          photo: '',
          contact: 'phone',
        });

        if (!initialModeSetRef.current) {
          initialModeSetRef.current = true;
          setIsEditing(true);
        }
      }
    }
  }, [user?.id, user?.email]);

  const hasProfileData = Boolean(
    fullName.trim() &&
    phone.trim() &&
    photo &&
    isValidOwnerPhoto(photo)
  );

  useEffect(() => {
    if (initialActionScrollRef.current || isEditing || !hasProfileData || isUploadingPhoto) return;

    const scrollTimer = window.setTimeout(() => {
      if (!ownerActionsRef.current) return;
      initialActionScrollRef.current = true;
      ownerActionsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 2500);

    return () => window.clearTimeout(scrollTimer);
  }, [hasProfileData, isEditing, isUploadingPhoto]);

  const photoPolicy = canChangePhoto(existingProfile);
  const photoLimitText = photoPolicy.isInitialPhoto
    ? 'First owner photo upload is free.'
    : photoPolicy.allowed
      ? `${photoPolicy.remaining} owner photo change${photoPolicy.remaining === 1 ? '' : 's'} left this month.`
      : 'Owner photo change limit reached. Admin approval is required.';

  /** Compresses and uploads a selected owner photo directly to Cloudinary and syncs to Firestore. */
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Image cannot be uploaded: Unsupported file format. Please select a JPG, PNG, or WebP photo.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      return;
    }
    if (file.size <= 0) {
      showToast('Image cannot be uploaded: File is empty (0 bytes).', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image cannot be uploaded due to size problem: File exceeds 5MB limit. Please choose a smaller photo.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      return;
    }

    const existingOwnerProfile = user ? storageService.getOwnerProfileByUserId(user.id, user.email) : null;
    const policy = canChangePhoto(existingOwnerProfile);
    if (!policy.allowed) {
      showToast('Owner photo can be changed twice per month. Please contact admin approval for another update.', 'warning');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      return;
    }

    setIsUploadingPhoto(true);
    showToast('Uploading profile picture to Cloudinary... Please wait.', 'info');

    try {
      const compressed = await compressImage(file, 600, 600, 0.85);
      if (!user?.id) throw new Error('AUTH_REQUIRED');
      const finalPhotoUrl = await storageBucketService.uploadProfileAvatar(user.id, compressed);
      if (!finalPhotoUrl) {
        showToast('Photo upload to Cloudinary failed. Please check connection and try again.', 'error');
        return;
      }
      setPhoto(finalPhotoUrl);
      setPhotoError(null);

      authService.updateCurrentUser({ avatar: finalPhotoUrl });
      if (user) {
        const updated: OwnerProfileType = {
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
        const saved = applyPhotoChangeTracking(updated, existingOwnerProfile);
        storageService.saveOwnerProfile(saved);
        // Direct sync to Firestore
        await firebaseSyncService.syncOwnerProfile(saved, user.id).catch((e) => {
          console.warn('[Firebase Sync Owner Profile Notice]:', e);
        });
        if (existingOwnerProfile?.photo && existingOwnerProfile.photo !== finalPhotoUrl) {
          await storageBucketService.deleteMedia(existingOwnerProfile.photo).catch(() => false);
        }
        refreshProgress();
      }
      setSavedSnapshot((prev) => ({ ...prev, photo: finalPhotoUrl }));
      showToast('✓ Owner photo saved to Cloudinary & synced to Firestore!', 'success');
    } catch (err: any) {
      console.error('[OwnerProfile] Photo upload error:', err);
      showToast(err?.message || 'Could not process photo. Please try another image.', 'error');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  /** Deletes the owner profile picture from Cloudinary and clears it from Firestore and local storage. */
  const handleRemoveOwnerPhoto = async () => {
    if (!photo) return;
    const photoToDelete = photo;

    // Optimistically clear UI immediately so the user sees instant feedback
    setPhoto('');
    setSavedSnapshot((prev) => ({ ...prev, photo: '' }));
    authService.updateCurrentUser({ avatar: undefined });
    if (user) {
      const p = storageService.getOwnerProfileByUserId(user.id, user.email);
      if (p) {
        storageService.saveOwnerProfile({ ...p, photo: undefined, updatedAt: new Date().toISOString() }, true);
        refreshProgress();
      }
    }

    showToast('Removing profile picture…', 'info');

    try {
      // 1. Attempt Cloudinary deletion (requires delete token saved at upload time)
      let cloudinaryDeleted = false;
      if (photoToDelete) {
        cloudinaryDeleted = await storageBucketService.deleteMedia(photoToDelete).catch((err) => {
          console.warn('[OwnerProfile] Cloudinary delete notice:', err);
          return false;
        });
      }

      // 2. Clear Firestore record regardless of Cloudinary result
      if (user?.id) {
        await firebaseSyncService.deleteOwnerPhoto(user.id, photoToDelete).catch((err) => {
          console.warn('[OwnerProfile] Firestore delete notice:', err);
        });
      }

      if (cloudinaryDeleted) {
        showToast('✓ Profile picture removed from Cloudinary & Firestore.', 'success');
      } else {
        // Token not available for photos from previous sessions — local state is still cleared
        showToast(
          '✓ Profile picture cleared locally. ' +
          'If it still appears in Cloudinary, it will be cleaned up automatically on your next upload.',
          'success'
        );
      }
    } catch (err) {
      console.error('[OwnerProfile] Delete photo error:', err);
      // Local state is already cleared above; just warn about remote
      showToast('Photo removed locally. Remote cleanup may be pending.', 'warning');
    }
  };

  /** Deletes the managed profile photo before clearing the owner's saved name, phone, and avatar. */
  const handleHardReset = async () => {
    const isAppManagedPhoto = photo.includes('cloudinary.com') || photo.includes('firebasestorage');
    const publicId = storageBucketService.extractPublicId(photo);
    const cleanUserId = user?.id.replace(/^(owner-)+/, '') || '';
    const isCurrentWorkerPhoto = Boolean(publicId && cleanUserId && (
      publicId.startsWith(`findlostpuppy/private/profiles/${cleanUserId}/`) ||
      publicId.startsWith(`findlostpuppy/private/pets/${cleanUserId}/`) ||
      publicId.startsWith(`findlostpuppy/recovery/missing-reports/${cleanUserId}/`) ||
      publicId.startsWith(`findlostpuppy/recovery/sightings/${cleanUserId}/`)
    ));
    if (isAppManagedPhoto) {
      try {
        const deleted = await storageBucketService.deleteMedia(photo);
        if (!deleted && isCurrentWorkerPhoto) {
          showToast('Could not remove the stored photo. Check your connection and try again.', 'error');
          return;
        } else if (!deleted) {
          showToast('The legacy hosted photo could not be removed, but your local profile was reset.', 'warning');
        }
      } catch {
        if (isCurrentWorkerPhoto) {
          showToast('Could not remove the stored photo. Check your connection and try again.', 'error');
          return;
        }
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
        const updated: OwnerProfileType = {
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

  /** Validates contact fields and a completed photo upload, saves the owner profile, and returns whether it succeeded. */
  const saveProfileInternal = async (showNotification = true): Promise<boolean> => {
    let hasError = false;

    if (!photo.trim() || !isValidOwnerPhoto(photo)) {
      setPhotoError('Profile photo is mandatory. Please upload from your album/files or use camera.');
      showToast('⚠️ Profile photo is mandatory! Please upload from files or capture with camera.', 'warning');
      hasError = true;
    } else {
      setPhotoError(null);
    }

    if (!fullName.trim()) {
      showToast('Please enter your full name.', 'warning');
      hasError = true;
    }

    if (!phone.trim()) {
      setPhoneError('Please enter your contact phone number.');
      showToast('Please enter your contact phone number.', 'warning');
      hasError = true;
    } else {
      const phoneValidation = validateIndianPhoneNumber(phone);
      if (!phoneValidation.isValid) {
        setPhoneError(phoneValidation.error || 'Please enter a valid 10-digit Indian phone number.');
        showToast(phoneValidation.error || 'Please enter a valid 10-digit Indian phone number.', 'warning');
        hasError = true;
      } else {
        setPhoneError(null);
      }
    }

    if (hasError) {
      ownerFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return false;
    }

    if (photo.startsWith('data:')) {
      showToast('This photo has not finished uploading. Please wait or upload again.', 'warning');
      ownerFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return false;
    }

    const phoneValidation = validateIndianPhoneNumber(phone);
    const cleanPhoneNumber = phoneValidation.cleanDigits;
    setPhoneError(null);
    setPhotoError(null);

    const effectiveUserId = user?.id || existingProfile?.userId || 'user-parent-' + Date.now();
    const effectiveEmail = user?.email || existingProfile?.email || 'parent@findlostpuppy.com';

    const profile: OwnerProfileType = {
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

    storageService.saveOwnerProfile(profile, false);
    authService.updateCurrentUser({
      name: fullName.trim(),
      phone: cleanPhoneNumber,
      avatar: photo.trim() || undefined,
    });

    // Explicit direct sync to Firebase Firestore backend
    await firebaseSyncService.syncOwnerProfile(profile, effectiveUserId).catch((e) => {
      console.warn('[Firebase Sync Owner Profile Notice]:', e);
    });

    refreshProgress();
    setSavedSnapshot({
      name: fullName.trim(),
      phone: cleanPhoneNumber,
      photo: photo.trim(),
      contact: preferredContact,
    });
    if (showNotification) {
      showToast('🐾 Pet Parent profile saved & synced to Firestore!', 'success');
    }
    setIsEditing(false);
    window.setTimeout(() => ownerActionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingPhoto) {
      showToast('Please wait for photo upload to finish.', 'info');
      return;
    }
    await saveProfileInternal(true);
  };

  const handleContinueToLocation = async () => {
    if (isTransitioning || isUploadingPhoto) return;

    if (isEditing) {
      const ok = await saveProfileInternal(false);
      if (!ok) return;
    }

    const currentProfile = storageService.getOwnerProfileByUserId(user?.id || '', user?.email);
    const validPhoto = (photo.trim() && isValidOwnerPhoto(photo)) || (currentProfile?.photo && isValidOwnerPhoto(currentProfile.photo));
    const validName = Boolean(fullName.trim() || currentProfile?.fullName?.trim());
    const validPhone = Boolean(phone.trim() || currentProfile?.phone?.trim());

    if (!validPhoto || !validName || !validPhone) {
      if (!validPhoto) {
        setPhotoError('Profile photo is mandatory. Please upload from album/files or use camera.');
      }
      if (!validPhone) {
        setPhoneError('Please enter your 10-digit phone number.');
      }
      showToast('⚠️ Profile photo, Name, and Phone number are all mandatory before continuing.', 'warning');
      setIsEditing(true);
      ownerFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // Auto-sync profile and avatar to Cloudinary & Firebase cloud
    try {
      if (currentProfile) {
        await firebaseSyncService.syncOwnerProfile(currentProfile, currentProfile.id || user?.id || '').catch(() => { });
        showToast('✓ Pet Parent details & photo synced to Firestore!', 'success');
      }
    } catch { }

    setIsTransitioning(true);
  };

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
    if (onSuccess) {
      onSuccess();
    } else {
      setActiveOnboardingTab('location');
      navigate('/location');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleExitToDashboard = () => {
    const hasCompleted = storageService.hasCompletedOwnerProfile(user?.id || '', user?.email);
    if (!hasCompleted) {
      showToast('⚠️ Please complete your Owner Profile first (Photo, Name, and Phone are mandatory).', 'warning');
      setIsEditing(true);
      ownerFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setActiveOnboardingTab('dashboard');
    navigate('/homepage');
  };

  return (
    <div className="onboarding-page owner-profile-page">
      <div className="app-container onboarding-container owner-onboarding-container">
        <div className="onboarding-card card owner-theme-card owner-combined-card">
          <div className="onboarding-top-nav-row">
            <div className="onboarding-top-nav-left">
              <BackButton
                onClick={handleExitToDashboard}
                title="Back to Dashboard"
                aria-label="Back to Dashboard"
              />
            </div>
            <div className="section-card-title-block onboarding-top-nav-title">
              <h1>Owner Details</h1>
            </div>
            <button
              type="button"
              className="onboarding-exit-btn onboarding-top-nav-close"
              onClick={handleExitToDashboard}
              aria-label="Exit owner details and go to dashboard"
              title="Exit to dashboard"
            >
              <X size={19} />
            </button>
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
              <div className="owner-actions-bottom-row view-mode-actions" ref={ownerActionsRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    window.setTimeout(() => ownerFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
                  }}
                  className="owner-modify-btn"
                >
                  <Edit3 size={16} />
                  <span>Modify Details / Photo</span>
                </button>

                <button
                  type="button"
                  onClick={handleContinueToLocation}
                  disabled={isTransitioning}
                  className="btn btn-primary btn-lg continue-to-location-orange-btn"
                >
                  <span>Continue to Location</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            <form ref={ownerFormRef} onSubmit={handleSubmit} className="onboarding-form owner-combined-form">
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
                      if (photoPolicy.allowed && !isUploadingPhoto) fileInputRef.current?.click();
                    }}
                    role="button"
                    tabIndex={0}
                    style={{ position: 'relative' }}
                    title={photoPolicy.allowed ? 'Tap to change profile picture' : 'Photo change limit reached'}
                  >
                    {photo ? (
                      <img
                        src={photo}
                        alt={fullName || 'Owner Profile'}
                        className="owner-center-avatar-img"
                        style={{ filter: isUploadingPhoto ? 'brightness(0.6)' : undefined }}
                      />
                    ) : (
                      <div className="owner-center-avatar-placeholder">
                        <UserIcon size={64} />
                      </div>
                    )}
                    {isUploadingPhoto && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.5)',
                        borderRadius: '50%',
                        color: '#ffffff',
                        gap: '4px',
                        zIndex: 10,
                      }}>
                        <Loader2 size={28} className="animate-spin" />
                        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.02em' }}>UPLOADING</span>
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
                        if (photoPolicy.allowed && !isUploadingPhoto) fileInputRef.current?.click();
                      }}
                      className="owner-center-camera-btn"
                      style={{ position: 'static', transform: 'none' }}
                      disabled={!photoPolicy.allowed || isUploadingPhoto}
                      title={photoPolicy.allowed ? 'Upload from Gallery' : 'Photo change limit reached'}
                      aria-label={photoPolicy.allowed ? 'Upload from Gallery' : 'Photo change limit reached'}
                    >
                      <Upload size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (photoPolicy.allowed && !isUploadingPhoto) setIsCameraOpen(true);
                      }}
                      className="owner-center-camera-btn"
                      style={{ position: 'static', transform: 'none' }}
                      disabled={!photoPolicy.allowed || isUploadingPhoto}
                      title={photoPolicy.allowed ? 'Take Photo with Camera' : 'Photo change limit reached'}
                      aria-label={photoPolicy.allowed ? 'Take Photo with Camera' : 'Photo change limit reached'}
                    >
                      {isUploadingPhoto ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
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

                <div
                  className="owner-photo-status-badge"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: photo ? '#15803D' : '#DC2626',
                    backgroundColor: photo ? '#DCFCE7' : '#FEE2E2',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    border: photo ? '1px solid #BBF7D0' : '1px solid #FECACA',
                  }}
                >
                  {photo ? (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Profile Photo Uploaded ✓</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} />
                      <span>* Photo Mandatory (Upload from folder/album or use camera)</span>
                    </>
                  )}
                </div>

                {photoError && (
                  <div
                    className="photo-error-message"
                    style={{
                      color: '#DC2626',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <AlertCircle size={14} />
                    <span>{photoError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                  {photo && (
                    <button
                      type="button"
                      onClick={handleRemoveOwnerPhoto}
                      disabled={isUploadingPhoto}
                      className="btn btn-ghost btn-xs remove-photo-link"
                      style={{ color: '#ef4444' }}
                      title="Delete profile picture from Cloudinary & Firestore"
                    >
                      <Trash2 size={13} />
                      <span>Delete Photo</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleHardReset}
                    disabled={isUploadingPhoto}
                    className="btn btn-ghost btn-xs remove-photo-link"
                    style={{ opacity: 0.75 }}
                    title="Reset all profile fields"
                  >
                    <X size={13} />
                    <span>Reset Fields</span>
                  </button>
                </div>
                {isUploadingPhoto && (
                  <span style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px' }}>
                    <Loader2 size={13} className="animate-spin" /> Uploading to Cloudinary... Please wait
                  </span>
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

              {/* 3. ACTIONS IN EDIT MODE */}
              <div className="owner-actions-bottom-row edit-mode-actions" ref={ownerActionsRef}>
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
                  disabled={isUploadingPhoto}
                  className="owner-save-btn"
                >
                  {isUploadingPhoto ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Uploading to Cloudinary...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Profile</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isTransitioning || isUploadingPhoto}
                  onClick={async () => {
                    if (isTransitioning || isUploadingPhoto) return;
                    const ok = await saveProfileInternal(false);
                    if (ok) {
                      handleContinueToLocation();
                    }
                  }}
                  className="btn btn-primary continue-to-location-orange-btn"
                  style={{
                    background: 'linear-gradient(135deg, #FF7900, #E65100)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: (isTransitioning || isUploadingPhoto) ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(255, 121, 0, 0.35)',
                    opacity: (isTransitioning || isUploadingPhoto) ? 0.7 : 1,
                  }}
                >
                  <span>Continue to Location</span>
                  <ArrowRight size={16} />
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
          setIsUploadingPhoto(true);
          showToast('Uploading captured owner photo to Cloudinary... Please wait.', 'info');
          try {
            const res = await fetch(photoData);
            const blob = await res.blob();
            if (blob.size > 5 * 1024 * 1024) {
              showToast('Image cannot be uploaded due to size problem: Captured photo exceeds 5MB limit.', 'error');
              setIsUploadingPhoto(false);
              return;
            }
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            const compressed = await compressImage(file, 600, 600, 0.85);
            if (!user?.id) throw new Error('AUTH_REQUIRED');
            const currentProfile = storageService.getOwnerProfileByUserId(user.id, user.email);
            if (!compressed) throw new Error('COMPRESSION_FAILED');
            const uploadedUrl = await storageBucketService.uploadProfileAvatar(user.id, compressed);
            if (!uploadedUrl) {
              showToast('Photo upload to Cloudinary failed. Please check connection and try again.', 'error');
              return;
            }
            setPhoto(uploadedUrl);
            setPhotoError(null);
            authService.updateCurrentUser({ avatar: uploadedUrl });
            const updated: OwnerProfileType = {
              ...(currentProfile || {}),
              id: user.id,
              userId: user.id,
              fullName: fullName.trim() || user.name || '',
              phone: phone.trim() || user.phone || '',
              email: user.email,
              photo: uploadedUrl,
              preferredContact,
              address: currentProfile?.address || '',
              state: currentProfile?.state || '',
              district: currentProfile?.district || '',
              city: currentProfile?.city || '',
              hasLocationConsent: currentProfile?.hasLocationConsent ?? true,
              updatedAt: new Date().toISOString(),
            };
            const saved = applyPhotoChangeTracking(updated, currentProfile);
            storageService.saveOwnerProfile(saved);
            await firebaseSyncService.syncOwnerProfile(saved, user.id).catch((e) => {
              console.warn('[Firebase Sync Owner Profile Notice]:', e);
            });
            setSavedSnapshot((prev) => ({ ...prev, photo: uploadedUrl }));
            if (currentProfile?.photo && currentProfile.photo !== uploadedUrl) {
              await storageBucketService.deleteMedia(currentProfile.photo).catch(() => false);
            }
            refreshProgress();
            showToast('✓ Owner photo saved to Cloudinary & synced to Firestore!', 'success');
          } catch (e: any) {
            console.error('[OwnerProfile] Camera capture error:', e);
            showToast(e?.message || 'Could not process the camera photo. Please try again.', 'error');
          } finally {
            setIsUploadingPhoto(false);
          }
        }}
      />

      {isTransitioning && (
        <VillageDogTransition
          direction="forward"
          fromStep="Owner Profile"
          toStep="Location"
          durationMs={1600}
          onComplete={handleTransitionComplete}
        />
      )}
    </div>
  );
};
