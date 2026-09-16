import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PawPrint,
  ArrowLeft,
  Sparkles,
  Check,
  Edit3,
  Heart,
  Tag,
  Smile,
  Search,
  ChevronDown,
} from 'lucide-react';
import { triggerStarCelebration } from '../utils/confettiHelper';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ImageUploader } from '../components/ImageUploader';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import { storageBucketService } from '../services/storageBucketService';
import type { DogGender, DogSize, DogProfile } from '../types';
import { handleDogImageError, getDogPhotoUrl } from '../utils/dogPhotoHelper';
import { sanitizePersonName } from '../utils/privacyUtils';
import {
  searchDogBreeds,
  DOG_AGE_OPTIONS,
  DOG_SIZE_OPTIONS,
  DOG_COLOR_OPTIONS,
} from '../data/dogBreeds';

interface DogOnboardingPageProps {
  onBackToLocation?: () => void;
  onBackToOwner?: () => void;
  onSuccess?: () => void;
}

export const DogOnboardingPage: React.FC<DogOnboardingPageProps> = ({
  onBackToLocation,
  onBackToOwner,
  onSuccess,
}) => {
  const { user, refreshProgress, setActiveOnboardingTab } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const existingPet = user ? storageService.getPetProfileByUserId(user.id, user.email) : null;
  const hasSkipped = user ? storageService.hasSkippedPetProfile(user.id) : false;
  const isInitiallyComplete = !!existingPet || hasSkipped;

  // Stable pet ID draft for uploads before initial save
  const [petDraftId] = useState<string>(() => existingPet?.id || `pet-${Date.now()}`);
  const petId = existingPet?.id || petDraftId;

  // Form Field States
  const [dogName, setDogName] = useState(existingPet?.name || '');
  const [breed, setBreed] = useState(existingPet?.breed || '');
  const [isBreedOpen, setIsBreedOpen] = useState(false);
  const breedRef = useRef<HTMLDivElement>(null);

  const [gender, setGender] = useState<DogGender>(existingPet?.gender || 'Male');
  const [age, setAge] = useState(existingPet?.age || '2 years');
  const [size, setSize] = useState<DogSize>(existingPet?.size || 'Medium (10-25kg)');
  const [color, setColor] = useState(existingPet?.color || 'Golden / Fawn');
  const [distinguishingMarks, setDistinguishingMarks] = useState(
    existingPet?.distinguishingMarks || ''
  );

  // Collar, Tag, or Microchip: Yes/No + companion detail
  const [hasCollarOrChip, setHasCollarOrChip] = useState<boolean>(() => {
    if (!existingPet?.collarInfo) return false;
    const lower = existingPet.collarInfo.toLowerCase().trim();
    return lower !== 'no' && lower !== 'none' && lower !== 'no collar';
  });
  const [collarDetails, setCollarDetails] = useState(existingPet?.collarInfo || '');

  const [primaryPhoto, setPrimaryPhoto] = useState(existingPet?.primaryPhoto || '');
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>(
    existingPet?.photos || []
  );

  // Flow States
  const [isSubmitted, setIsSubmitted] = useState<boolean>(isInitiallyComplete);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);

  // Search & filter dog breeds
  const filteredBreeds = useMemo(() => {
    return searchDogBreeds(breed);
  }, [breed]);

  // Click outside to close breed dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (breedRef.current && !breedRef.current.contains(e.target as Node)) {
        setIsBreedOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Handle Save / Submit Pet Profile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    const ownerId = user.id;

    // Convert any remaining base64 images if not yet uploaded
    let finalPrimary = primaryPhoto;
    const finalAdditionals = [...additionalPhotos];

    if (finalPrimary && finalPrimary.startsWith('data:')) {
      try {
        const uploaded = await storageBucketService.uploadPetPhoto(ownerId, petId, finalPrimary, 0);
        if (uploaded) finalPrimary = uploaded;
      } catch (err) {
        console.warn('[DogOnboardingPage] Primary photo upload retry fallback:', err);
      }
    }

    for (let i = 0; i < finalAdditionals.length; i++) {
      if (finalAdditionals[i] && finalAdditionals[i].startsWith('data:')) {
        try {
          const uploaded = await storageBucketService.uploadPetPhoto(ownerId, petId, finalAdditionals[i], i + 1);
          if (uploaded) finalAdditionals[i] = uploaded;
        } catch (err) {
          console.warn('[DogOnboardingPage] Gallery photo upload retry fallback:', err);
        }
      }
    }

    const finalCollar = hasCollarOrChip
      ? (collarDetails.trim() || 'Collar / Tag / Microchip equipped')
      : undefined;

    const profile: DogProfile = {
      id: petId,
      ownerId,
      name: dogName.trim() || 'Bruno',
      breed: breed.trim() || 'Street Dog / Desi / Indie',
      gender,
      age: age.trim() || '2 years',
      size,
      color: color.trim() || 'Golden / Fawn',
      distinguishingMarks: distinguishingMarks.trim() || '',
      collarInfo: finalCollar,
      primaryPhoto: finalPrimary || '',
      photos: finalAdditionals,
      createdAt: existingPet?.createdAt || new Date().toISOString(),
    };

    try {
      storageService.savePetProfile(profile);
      refreshProgress();
      setIsSubmitted(true);
      setIsEditing(false);
      setSubmitting(false);

      // Star celebration animation
      triggerStarCelebration();

      showToast(`🐾 ${profile.name}'s profile saved!`, 'success');
    } catch {
      setSubmitting(false);
      showToast('Could not save pet profile. Please try again.', 'error');
    }
  };

  // Handle Skip / Deny Pet Profile
  const handleSkip = () => {
    if (!user) return;
    storageService.skipPetProfile(user.id);
    refreshProgress();
    setIsSubmitted(true);
    setIsEditing(false);
    showToast('Skipped pet details. You can add a pet anytime!', 'info');
  };

  const handleBack = () => {
    if (onBackToLocation) {
      onBackToLocation();
    } else if (onBackToOwner) {
      onBackToOwner();
    } else {
      setActiveOnboardingTab('location');
      navigate('/location');
    }
  };

  const handleProceedToAlert = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      setActiveOnboardingTab('report');
      navigate('/alert');
    }
  };

  return (
    <div className="onboarding-page">
      <div className="app-container onboarding-container">
        {/* CASE 1: SUBMITTED STATE -> SHOWCASE PREVIEW */}
        {isSubmitted && !isEditing ? (
          <div className="onboarding-card card owner-theme-card pet-combined-card">
            <div className="pet-profile-showcase">
              {/* Owner & Pet Family Banner */}
              {(() => {
                const ownerProfile = user ? storageService.getOwnerProfileByUserId(user.id, user.email) : null;
                if (!ownerProfile && !existingPet) return null;

                // Multi-tier owner photo resolution:
                // 1. ownerProfile.photo
                // 2. user.avatar
                // 3. storageService.getOwnerProfileByEmail(user?.email)?.photo
                // 4. storageService.getOwnerProfileByUserId(existingPet?.ownerId)?.photo
                // 5. authService.getCurrentUser()?.avatar
                const ownerPhoto =
                  ownerProfile?.photo ||
                  user?.avatar ||
                  (user?.email ? storageService.getOwnerProfileByEmail(user.email)?.photo : '') ||
                  (existingPet?.ownerId ? storageService.getOwnerProfileByUserId(existingPet.ownerId)?.photo : '') ||
                  authService.getCurrentUser()?.avatar ||
                  '';

                const ownerName =
                  sanitizePersonName(ownerProfile?.fullName || user?.name, user?.email || ownerProfile?.email) ||
                  'Pet Parent';

                return (
                  <div className="owner-pet-family-banner">
                    <div className="family-banner-header">
                      <Sparkles size={16} className="text-amber" />
                      <h3 className="family-banner-title">Pet Parent & Furry Friend</h3>
                    </div>
                    <div className="family-avatars-row">
                      {/* Owner Avatar */}
                      <div className="family-avatar-card owner-avatar-card">
                        <div className="family-avatar-img-wrap">
                          {ownerPhoto ? (
                            <img
                              src={ownerPhoto}
                              alt={ownerName}
                              className="family-avatar-img"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                                const placeholder = e.currentTarget.parentElement?.querySelector('.family-avatar-placeholder');
                                if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
                              }}
                            />
                          ) : (
                            <div className="family-avatar-placeholder">🧑‍🦱</div>
                          )}
                          {ownerPhoto && (
                            <div className="family-avatar-placeholder" style={{ display: 'none' }}>
                              🧑‍🦱
                            </div>
                          )}
                        </div>
                        <div className="family-avatar-info">
                          <span className="family-avatar-role">Pet Parent</span>
                          <span className="family-avatar-name">{ownerName}</span>
                          {ownerProfile?.phone && (
                            <span className="family-avatar-detail">📞 {ownerProfile.phone}</span>
                          )}
                          {ownerProfile?.approximateArea && (
                            <span className="family-avatar-detail">📍 {ownerProfile.approximateArea}</span>
                          )}
                        </div>
                      </div>

                      {/* Heart Connector */}
                      <div className="family-connector">
                        <Heart size={22} className="family-heart-icon" />
                      </div>

                      {/* Pet Avatar */}
                      {existingPet && (
                        <div className="family-avatar-card pet-avatar-card">
                          <div className="family-avatar-img-wrap">
                            {existingPet.primaryPhoto ? (
                              <img
                                src={getDogPhotoUrl(existingPet)}
                                alt={existingPet.name}
                                className="family-avatar-img"
                                onError={handleDogImageError}
                              />
                            ) : (
                              <div className="family-avatar-placeholder">🐶</div>
                            )}
                          </div>
                          <div className="family-avatar-info">
                            <span className="family-avatar-role">Furry Friend</span>
                            <span className="family-avatar-name">{existingPet.name}</span>
                            <span className="family-avatar-detail">🐕 {existingPet.breed}</span>
                            <span className="family-avatar-detail">
                              {existingPet.gender === 'Male' ? '♂ Male' : '♀ Female'}
                              {existingPet.age ? ` • ${existingPet.age}` : ''}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {existingPet ? (
                <>
                  <div className="pet-showcase-card">
                    <div className="pet-showcase-top">
                      <div className="pet-photo-hero-wrap">
                        {existingPet.primaryPhoto ? (
                          <img
                            src={getDogPhotoUrl(existingPet)}
                            alt={existingPet.name}
                            className="pet-showcase-hero-img"
                            onError={handleDogImageError}
                          />
                        ) : (
                          <div className="pet-photo-hero-placeholder">🐶</div>
                        )}
                      </div>
                      <div className="pet-showcase-title-block">
                        <div className="pet-showcase-badge-row">
                          <span className="badge badge-success">✓ Profile Synced</span>
                          <span className="badge badge-primary">{existingPet.gender === 'Male' ? '♂ Male' : '♀ Female'}</span>
                        </div>
                        <h2 className="pet-showcase-name">{existingPet.name}</h2>
                        <span className="pet-showcase-breed">🐕 {existingPet.breed}</span>
                      </div>
                    </div>

                    <div className="pet-showcase-grid">
                      <div className="pet-showcase-stat">
                        <span className="stat-label">Age</span>
                        <span className="stat-value">{existingPet.age || 'Not specified'}</span>
                      </div>
                      <div className="pet-showcase-stat">
                        <span className="stat-label">Size</span>
                        <span className="stat-value">{existingPet.size}</span>
                      </div>
                      <div className="pet-showcase-stat">
                        <span className="stat-label">Color</span>
                        <span className="stat-value">{existingPet.color}</span>
                      </div>
                      {existingPet.collarInfo && (
                        <div className="pet-showcase-stat">
                          <span className="stat-label">Collar / Chip</span>
                          <span className="stat-value">{existingPet.collarInfo}</span>
                        </div>
                      )}
                    </div>

                    {existingPet.distinguishingMarks && (
                      <div className="pet-showcase-note">
                        <span className="note-label">✨ Special Traits & Markings</span>
                        <p className="note-text">{existingPet.distinguishingMarks}</p>
                      </div>
                    )}
                  </div>

                  <div className="pet-showcase-actions">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="btn btn-outline btn-md"
                    >
                      <Edit3 size={16} />
                      <span>Edit Pet Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToAlert}
                      className="btn btn-primary btn-md continue-to-location-orange-btn"
                    >
                      <span>Proceed to Pet Safety Check 🐾 →</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-pet-showcase">
                  <span className="empty-pet-icon">🐾</span>
                  <h3>No Pet Profile Added</h3>
                  <p>You can add your pet details anytime to generate instant lost pet alerts.</p>
                  <div className="pet-showcase-actions">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="btn btn-primary btn-md"
                    >
                      <span>+ Add Pet Details Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToAlert}
                      className="btn btn-outline btn-md"
                    >
                      <span>Continue →</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* CASE 2: UNIFIED MODERN PET PROFILE FORM (Same Pattern as Owner Profile) */
          <div className="onboarding-card card owner-theme-card pet-combined-card">
            {/* 1. Header Banner */}
            <div className="pet-unified-header">
              <div className="pet-header-left">
                <span className="pet-header-icon">🐾</span>
                <div>
                  <h2 className="pet-header-title">
                    {isEditing ? 'Update Pet Details' : 'Pet Profile (Optional)'}
                  </h2>
                  <p className="pet-header-subtitle">
                    Select your pet’s details below. You can skip anytime.
                  </p>
                </div>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="btn btn-ghost btn-sm pet-skip-header-link"
                >
                  <span>Skip for now →</span>
                </button>
              )}
            </div>

            {/* 2. Unified Form */}
            <form onSubmit={handleSubmit} className="pet-combined-form">
              <div className="pet-combined-fields">
                {/* 1. Pet Name */}
                <div className="owner-modern-form-group">
                  <label className="owner-modern-label" htmlFor="pet-name">
                    <span>🐶 1. Pet Name</span>
                    <span className="optional-tag">Optional</span>
                  </label>
                  <div className="owner-modern-input-wrapper">
                    <div className="owner-input-icon-prefix">
                      <Smile size={18} />
                    </div>
                    <input
                      id="pet-name"
                      type="text"
                      className="owner-modern-input"
                      placeholder="e.g. Bruno, Bella, Luna, Charlie"
                      value={dogName}
                      onChange={(e) => setDogName(e.target.value)}
                    />
                  </div>
                </div>

                {/* 2. Photos */}
                <div className="owner-modern-form-group">
                  <label className="owner-modern-label">
                    <span>📸 2. Pet Photos</span>
                    <span className="optional-tag">Optional</span>
                  </label>
                  <ImageUploader
                    primaryPhoto={primaryPhoto}
                    additionalPhotos={additionalPhotos}
                    onChange={(primary, additionals) => {
                      setPrimaryPhoto(primary);
                      setAdditionalPhotos(additionals);
                    }}
                    dogName={dogName || 'your pet'}
                    userId={user?.id}
                    petId={petId}
                  />
                </div>

                {/* 3. Breed (Interactive Autocomplete Dropdown, Sorted A to Z, Includes Street Dog) */}
                <div className="owner-modern-form-group" ref={breedRef} style={{ position: 'relative' }}>
                  <label className="owner-modern-label" htmlFor="pet-breed">
                    <span>🏷️ 3. Breed</span>
                    <span className="optional-tag">Search or select</span>
                  </label>
                  <div
                    className="owner-modern-input-wrapper breed-autocomplete-wrapper"
                    onClick={() => setIsBreedOpen(true)}
                  >
                    <div className="owner-input-icon-prefix">
                      <Search size={18} />
                    </div>
                    <input
                      id="pet-breed"
                      type="text"
                      className="owner-modern-input"
                      placeholder="Type a letter (e.g. 's') or click for all breeds..."
                      value={breed}
                      onChange={(e) => {
                        setBreed(e.target.value);
                        if (!isBreedOpen) setIsBreedOpen(true);
                      }}
                      onFocus={() => setIsBreedOpen(true)}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="breed-dropdown-toggle-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsBreedOpen(!isBreedOpen);
                      }}
                      title="Toggle breeds list"
                    >
                      <ChevronDown
                        size={18}
                        style={{
                          transform: isBreedOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      />
                    </button>
                  </div>

                  {/* Autocomplete Dropdown Popover */}
                  {isBreedOpen && (
                    <div className="breed-dropdown-menu">
                      <div className="breed-dropdown-header">
                        <span>Showing {filteredBreeds.length} breeds (A to Z)</span>
                      </div>
                      <div className="breed-dropdown-list">
                        {filteredBreeds.length > 0 ? (
                          filteredBreeds.map((b) => (
                            <button
                              key={b}
                              type="button"
                              className={`breed-dropdown-item ${breed === b ? 'selected' : ''}`}
                              onClick={() => {
                                setBreed(b);
                                setIsBreedOpen(false);
                              }}
                            >
                              <span className="breed-item-icon">🐕</span>
                              <span className="breed-item-name">{b}</span>
                              {breed === b && <Check size={14} className="breed-check-icon" />}
                            </button>
                          ))
                        ) : (
                          <div className="breed-dropdown-empty">
                            <span>No breeds found for "{breed}". You can still use this as custom breed!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Gender (Modern Segmented Button) */}
                <div className="owner-modern-form-group">
                  <label className="owner-modern-label">
                    <span>⚧ 4. Gender</span>
                    <span className="optional-tag">Optional</span>
                  </label>
                  <div className="pet-segmented-row">
                    <button
                      type="button"
                      className={`pet-segmented-btn ${gender === 'Male' ? 'active' : ''}`}
                      onClick={() => setGender('Male')}
                    >
                      <span className="gender-glyph">♂</span>
                      <span>Male</span>
                    </button>
                    <button
                      type="button"
                      className={`pet-segmented-btn ${gender === 'Female' ? 'active' : ''}`}
                      onClick={() => setGender('Female')}
                    >
                      <span className="gender-glyph">♀</span>
                      <span>Female</span>
                    </button>
                  </div>
                </div>

                {/* 5. Age Dropdown (1 to 30) */}
                <div className="owner-modern-form-group">
                  <label className="owner-modern-label" htmlFor="pet-age-select">
                    <span>🎂 5. Age</span>
                    <span className="optional-tag">1 to 30 years</span>
                  </label>
                  <div className="owner-modern-input-wrapper">
                    <div className="owner-input-icon-prefix">
                      <Sparkles size={18} />
                    </div>
                    <select
                      id="pet-age-select"
                      className="owner-modern-input owner-modern-select"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    >
                      {DOG_AGE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <div className="owner-select-chevron">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>

                {/* 6. Size Category Dropdown */}
                <div className="owner-modern-form-group">
                  <label className="owner-modern-label" htmlFor="pet-size-select">
                    <span>📏 6. Size Category</span>
                    <span className="optional-tag">Weight class</span>
                  </label>
                  <div className="owner-modern-input-wrapper">
                    <div className="owner-input-icon-prefix">
                      <PawPrint size={18} />
                    </div>
                    <select
                      id="pet-size-select"
                      className="owner-modern-input owner-modern-select"
                      value={size}
                      onChange={(e) => setSize(e.target.value as DogSize)}
                    >
                      {DOG_SIZE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="owner-select-chevron">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>

                {/* 7. Color & Distinctive Markings (Dropdown + Custom Input) */}
                <div className="owner-modern-form-group">
                  <label className="owner-modern-label" htmlFor="pet-color-select">
                    <span>🎨 7. Color & Distinctive Markings</span>
                    <span className="optional-tag">Coat & pattern</span>
                  </label>
                  <div className="owner-modern-input-wrapper">
                    <div className="owner-input-icon-prefix">
                      <Tag size={18} />
                    </div>
                    <select
                      id="pet-color-select"
                      className="owner-modern-input owner-modern-select"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    >
                      {DOG_COLOR_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <div className="owner-select-chevron">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>

                {/* 8. Special Traits & Personality */}
                <div className="owner-modern-form-group">
                  <label className="owner-modern-label" htmlFor="pet-marks">
                    <span>✨ 8. Special Traits & Identifying Marks</span>
                    <span className="optional-tag">Optional details</span>
                  </label>
                  <div className="owner-modern-input-wrapper">
                    <div className="owner-input-icon-prefix">
                      <Heart size={18} />
                    </div>
                    <input
                      id="pet-marks"
                      type="text"
                      className="owner-modern-input"
                      placeholder="e.g. White chest patch, one floppy ear, friendly, loves balls"
                      value={distinguishingMarks}
                      onChange={(e) => setDistinguishingMarks(e.target.value)}
                    />
                  </div>
                </div>

                {/* 9. Collar, Tag, or Microchip (Yes/No Toggle + Custom Input to Side) */}
                <div className="owner-modern-form-group">
                  <label className="owner-modern-label">
                    <span>🔖 9. Collar, Tag, or Microchip</span>
                    <span className="optional-tag">Yes or No</span>
                  </label>
                  <div className="collar-chip-control-row">
                    <div className="pet-yes-no-toggle">
                      <button
                        type="button"
                        className={`pet-yes-no-btn ${hasCollarOrChip ? 'active' : ''}`}
                        onClick={() => setHasCollarOrChip(true)}
                      >
                        <Check size={16} />
                        <span>Yes</span>
                      </button>
                      <button
                        type="button"
                        className={`pet-yes-no-btn ${!hasCollarOrChip ? 'active' : ''}`}
                        onClick={() => {
                          setHasCollarOrChip(false);
                          setCollarDetails('');
                        }}
                      >
                        <span>No</span>
                      </button>
                    </div>

                    {hasCollarOrChip && (
                      <div className="owner-modern-input-wrapper collar-details-wrapper">
                        <div className="owner-input-icon-prefix">
                          <Tag size={16} />
                        </div>
                        <input
                          type="text"
                          className="owner-modern-input"
                          placeholder="e.g. Red collar with bell, QR Tag, Microchip #..."
                          value={collarDetails}
                          onChange={(e) => setCollarDetails(e.target.value)}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTIONS FOOTER */}
              <div className="owner-actions-bottom-row" style={{ marginTop: '2.5rem' }}>
                <div className="pet-actions-left">
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn btn-outline btn-md"
                    >
                      <span>Cancel</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="btn btn-outline btn-md"
                    >
                      <ArrowLeft size={16} />
                      <span>Back to Location</span>
                    </button>
                  )}

                  {!isEditing && (
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="btn btn-ghost btn-sm skip-pet-btn"
                    >
                      <span>Skip Step</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-lg continue-to-location-orange-btn"
                >
                  <Check size={18} />
                  <span>{isEditing ? '✓ Update Pet Details' : '🐾 Save Pet Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
