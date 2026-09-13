import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Phone, Check, ArrowRight, Camera, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import type { ContactMethod, OwnerProfile } from '../types';
import { triggerStarCelebration } from '../utils/confettiHelper';
import { compressImage } from '../utils/imageCompressor';
import { validateIndianPhoneNumber } from '../utils/phoneValidator';

interface PetParentContactPageProps {
  onSuccess?: () => void;
}

export const PetParentContactPage: React.FC<PetParentContactPageProps> = ({ onSuccess }) => {
  const { user, hasCompletedOwner, refreshProgress, setActiveOnboardingTab } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const existingProfile = user ? storageService.getOwnerProfileByUserId(user.id, user.email) : null;

  const [fullName, setFullName] = useState(existingProfile?.fullName || user?.name || '');
  const [phone, setPhone] = useState(existingProfile?.phone || user?.phone || '');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string>(existingProfile?.photo || user?.avatar || '');
  const [preferredContact, setPreferredContact] = useState<ContactMethod>(
    existingProfile?.preferredContact || 'phone'
  );

  const fullNameRef = useRef(fullName);
  const phoneRef = useRef(phone);
  const photoRef = useRef(photo);

  useEffect(() => {
    fullNameRef.current = fullName;
    phoneRef.current = phone;
    photoRef.current = photo;
  }, [fullName, phone, photo]);

  const saveDraft = (nameVal: string, phoneVal: string, photoVal: string) => {
    if (!user) return;
    const cleanName = nameVal.trim();
    const cleanPhone = phoneVal.trim();
    const cleanPhoto = photoVal.trim();

    const p = storageService.getOwnerProfileByUserId(user.id, user.email);
    const prevName = p?.fullName || user.name || '';
    const prevPhone = p?.phone || user.phone || '';
    const prevPhoto = p?.photo || user.avatar || '';

    if (cleanName === prevName && cleanPhone === prevPhone && cleanPhoto === prevPhoto) {
      return;
    }

    if (cleanName || cleanPhone || cleanPhoto) {
      authService.updateCurrentUser({
        name: cleanName || user.name,
        phone: cleanPhone || user.phone,
        avatar: cleanPhoto || undefined,
      });
      const draft: OwnerProfile = {
        ...(p || {}),
        id: p?.id || `owner-${user.id}`,
        userId: user.id,
        fullName: cleanName || p?.fullName || user.name || '',
        phone: cleanPhone || p?.phone || user.phone || '',
        email: user.email,
        photo: cleanPhoto || undefined,
        preferredContact,
        address: p?.address || '',
        state: p?.state || '',
        district: p?.district || '',
        city: p?.city || '',
        hasLocationConsent: p?.hasLocationConsent ?? true,
        updatedAt: new Date().toISOString(),
      };
      storageService.saveOwnerProfile(draft);
      refreshProgress();
    }
  };

  useEffect(() => {
    if (user) {
      const p = storageService.getOwnerProfileByUserId(user.id, user.email);
      if (p) {
        if (p.fullName && p.fullName !== fullNameRef.current) setFullName(p.fullName);
        else if (user.name && !fullNameRef.current) setFullName(user.name);

        if (p.phone && p.phone !== phoneRef.current) setPhone(p.phone);
        else if (user.phone && !phoneRef.current) setPhone(user.phone);

        if (p.photo && p.photo !== photoRef.current) setPhoto(p.photo);
        else if (user.avatar && !photoRef.current) setPhoto(user.avatar);

        if (p.preferredContact) setPreferredContact(p.preferredContact);
      } else {
        if (user.name && !fullNameRef.current) setFullName(user.name);
        if (user.phone && !phoneRef.current) setPhone(user.phone);
        if (user.avatar && !photoRef.current) setPhoto(user.avatar);
      }
    }
    return () => {
      saveDraft(fullNameRef.current, phoneRef.current, photoRef.current);
    };
  }, [user?.id, user?.email]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file (JPG, PNG, WebP).', 'warning');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size should be under 10MB.', 'warning');
      return;
    }
    try {
      showToast('Compressing photo for lightning-fast save...', 'info');
      const compressed = await compressImage(file, 600, 600, 0.85);
      setPhoto(compressed);

      authService.updateCurrentUser({ avatar: compressed });
      if (user) {
        const p = storageService.getOwnerProfileByUserId(user.id, user.email);
        const updated: OwnerProfile = {
          ...(p || {}),
          id: p?.id || `owner-${user.id}`,
          userId: user.id,
          fullName: fullNameRef.current.trim() || user.name || '',
          phone: phoneRef.current.trim() || user.phone || '',
          email: user.email,
          photo: compressed,
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
      showToast('✓ Photo saved & attached to your profile!', 'success');
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
        storageService.saveOwnerProfile(updated);
        refreshProgress();
      }
    }
    showToast('Photo removed.', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showToast('Please enter your full name.', 'warning');
      return;
    }
    if (!phone.trim()) {
      setPhoneError('Please enter your contact phone number.');
      showToast('Please enter your contact phone number.', 'warning');
      return;
    }

    const phoneValidation = validateIndianPhoneNumber(phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || 'Please enter a valid 10-digit Indian phone number.');
      showToast(phoneValidation.error || 'Please enter a valid 10-digit Indian phone number.', 'warning');
      return;
    }

    setPhoneError(null);
    if (!user) return;

    const cleanPhoneNumber = phoneValidation.cleanDigits;

    const profile: OwnerProfile = {
      ...(existingProfile || {}),
      id: existingProfile?.id || `owner-${user.id}`,
      userId: user.id,
      fullName: fullName.trim(),
      phone: cleanPhoneNumber,
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
    authService.updateCurrentUser({
      name: fullName.trim(),
      phone: cleanPhoneNumber,
      avatar: photo.trim() || undefined,
    });
    refreshProgress();
    triggerStarCelebration();
    showToast('🐾 Pet Parent profile saved with verified phone number!', 'success');

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
                            onClick={handlePhotoRemove}
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
                      onChange={(e) => {
                        setFullName(e.target.value);
                      }}
                      onBlur={() => saveDraft(fullName, phone, photo)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label cute-label" htmlFor="parent-phone">
                    <span>📞 10-Digit Indian Phone Number</span> <span className="required-tag">*</span>
                  </label>
                  <div className="input-with-icon">
                    <Phone size={16} className="input-icon text-terracotta" />
                    <input
                      id="parent-phone"
                      type="tel"
                      maxLength={15}
                      className={`form-input cute-input ${phoneError ? 'input-field-error' : ''}`}
                      placeholder="+91 98480 12345 (Starts with 6, 7, 8, 9)"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPhone(val);
                        if (val.trim()) {
                          const res = validateIndianPhoneNumber(val);
                          if (res.isValid) {
                            setPhoneError(null);
                          }
                        } else {
                          setPhoneError(null);
                        }
                      }}
                      onBlur={() => {
                        if (phone.trim()) {
                          const res = validateIndianPhoneNumber(phone);
                          if (!res.isValid) {
                            setPhoneError(res.error || 'Invalid Indian phone number');
                          } else {
                            setPhoneError(null);
                            saveDraft(fullName, res.cleanDigits, photo);
                          }
                        } else {
                          setPhoneError(null);
                          saveDraft(fullName, phone, photo);
                        }
                      }}
                      required
                    />
                  </div>
                  {phoneError ? (
                    <span className="phone-validation-error" style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                      ⚠️ {phoneError}
                    </span>
                  ) : phone.trim() && validateIndianPhoneNumber(phone).isValid ? (
                    <span className="phone-validation-success" style={{ color: '#16A34A', fontSize: '0.78rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                      ✓ Valid 10-digit Indian Mobile: {validateIndianPhoneNumber(phone).formatted}
                    </span>
                  ) : (
                    <span className="form-hint" style={{ marginTop: '0.3rem', display: 'block', fontSize: '0.76rem', color: '#64748B' }}>
                      🇮🇳 10-digit mobile number starting with 6, 7, 8, or 9 (Protected with privacy masking on public dashboard).
                    </span>
                  )}
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
