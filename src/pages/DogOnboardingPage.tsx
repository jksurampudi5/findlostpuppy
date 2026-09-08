import React, { useState } from 'react';
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
} from 'lucide-react';
import { triggerStarCelebration } from '../utils/confettiHelper';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ImageUploader } from '../components/ImageUploader';
import { storageService } from '../services/storageService';
import type { DogGender, DogSize, DogProfile } from '../types';
import { handleDogImageError, getDogPhotoUrl } from '../utils/dogPhotoHelper';

interface DogOnboardingPageProps {
  onBackToLocation?: () => void;
  onBackToOwner?: () => void;
  onSuccess?: () => void;
}

const DOG_SIZES: { label: DogSize; icon: string; desc: string }[] = [
  { label: 'Toy (under 5kg)', icon: '🐕', desc: 'Under 5kg' },
  { label: 'Small (5-10kg)', icon: '🐶', desc: '5-10kg' },
  { label: 'Medium (10-25kg)', icon: '🐕‍🦺', desc: '10-25kg' },
  { label: 'Large (25-45kg)', icon: '🦮', desc: '25-45kg' },
  { label: 'Extra Large (45kg+)', icon: '🐾', desc: '45kg+' },
];

export const DogOnboardingPage: React.FC<DogOnboardingPageProps> = ({
  onBackToLocation,
  onBackToOwner,
  onSuccess,
}) => {
  const { user, refreshProgress, setActiveOnboardingTab } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const existingPet = user ? storageService.getPetProfileByUserId(user.id) : null;
  const hasSkipped = user ? storageService.hasSkippedPetProfile(user.id) : false;
  const isInitiallyComplete = !!existingPet || hasSkipped;

  // Form Field States (All optional)
  const [dogName, setDogName] = useState(existingPet?.name || '');
  const [breed, setBreed] = useState(existingPet?.breed || '');
  const [gender, setGender] = useState<DogGender>(existingPet?.gender || 'Male');
  const [age, setAge] = useState(existingPet?.age || '');
  const [size, setSize] = useState<DogSize>(existingPet?.size || 'Medium (10-25kg)');
  const [color, setColor] = useState(existingPet?.color || '');
  const [distinguishingMarks, setDistinguishingMarks] = useState(
    existingPet?.distinguishingMarks || ''
  );
  const [collarInfo, setCollarInfo] = useState(existingPet?.collarInfo || '');
  const [primaryPhoto, setPrimaryPhoto] = useState(existingPet?.primaryPhoto || '');
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>(
    existingPet?.photos || []
  );

  // Flow States
  const [isSubmitted, setIsSubmitted] = useState<boolean>(isInitiallyComplete);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);

  // Handle Save / Submit Pet Profile
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    const petId = existingPet?.id || `pet-${Date.now()}`;
    const ownerId = `owner-${user.id}`;

    const profile: DogProfile = {
      id: petId,
      ownerId,
      name: dogName.trim() || 'My Pup',
      breed: breed.trim() || 'Companion Pet',
      gender,
      age: age.trim() || 'Unknown',
      size,
      color: color.trim() || 'Not specified',
      distinguishingMarks: distinguishingMarks.trim() || '',
      collarInfo: collarInfo.trim() || undefined,
      primaryPhoto: primaryPhoto || '',
      photos: additionalPhotos,
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
        <div className="onboarding-card card owner-theme-card">
          {/* Header Greeting */}
          <div className="onboarding-header">
            <div className="cute-welcome-banner">
              <div className="cute-welcome-icon">🐾</div>
              <div className="cute-welcome-text">
                <h1 className="cute-page-title">Pet Profile (Optional) 🐶</h1>
                <p className="cute-page-sub">
                  Tell us about your pet. This is completely optional — you can add details now or skip anytime.
                </p>
              </div>
            </div>
          </div>

          {/* CASE 1: SUBMITTED STATE -> SHOWCASE PREVIEW */}
          {isSubmitted && !isEditing ? (
            <div className="pet-profile-showcase">
              {/* Owner & Pet Family Banner */}
              {(() => {
                const ownerProfile = user ? storageService.getOwnerProfileByUserId(user.id) : null;
                if (!ownerProfile && !existingPet) return null;
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
                          {ownerProfile?.photo ? (
                            <img src={ownerProfile.photo} alt={ownerProfile.fullName} className="family-avatar-img" />
                          ) : (
                            <div className="family-avatar-placeholder">🧑‍🦱</div>
                          )}
                        </div>
                        <div className="family-avatar-info">
                          <span className="family-avatar-role">Pet Parent</span>
                          <span className="family-avatar-name">{ownerProfile?.fullName || user?.name || 'Owner'}</span>
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
                /* Registered Pet Showcase Card */
                <div className="pet-card-summary">
                  <div className="pet-summary-photo-wrap">
                    {existingPet.primaryPhoto ? (
                      <img
                        src={getDogPhotoUrl(existingPet)}
                        alt={existingPet.name}
                        className="pet-summary-photo"
                        onError={handleDogImageError}
                      />
                    ) : (
                      <div className="pet-summary-avatar-placeholder">
                        <PawPrint size={40} />
                      </div>
                    )}
                  </div>

                  <div className="pet-summary-info">
                    <div className="pet-summary-header-row">
                      <h2 className="pet-summary-name">{existingPet.name}</h2>
                      <span className="pet-badge-tag">
                        <Heart size={12} />
                        <span>Registered Pet</span>
                      </span>
                    </div>

                    <div className="pet-summary-tags-row">
                      <span className="pet-meta-pill">🐕 {existingPet.breed}</span>
                      <span className="pet-meta-pill">
                        {existingPet.gender === 'Male' ? '♂ Male' : '♀ Female'}
                      </span>
                      {existingPet.age && (
                        <span className="pet-meta-pill">🎂 {existingPet.age}</span>
                      )}
                      <span className="pet-meta-pill">📏 {existingPet.size}</span>
                    </div>

                    {existingPet.color && (
                      <p className="pet-summary-desc">
                        <strong>Color & Markings:</strong> {existingPet.color}
                      </p>
                    )}

                    {existingPet.distinguishingMarks && (
                      <p className="pet-summary-desc">
                        <strong>Special Traits:</strong> {existingPet.distinguishingMarks}
                      </p>
                    )}

                    {existingPet.collarInfo && (
                      <p className="pet-summary-desc">
                        <strong>Collar / Tags:</strong> {existingPet.collarInfo}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Skipped Pet Placeholder Card */
                <div className="pet-skipped-card">
                  <div className="pet-skipped-icon">🐕</div>
                  <div className="pet-skipped-content">
                    <h3 className="pet-skipped-title">No Pet Registered Yet</h3>
                    <p className="pet-skipped-desc">
                      You chose to skip adding a pet during onboarding. You can add your furry friend’s details anytime!
                    </p>
                  </div>
                </div>
              )}

              {/* Showcase Actions */}
              <div className="showcase-actions-row">
                <div className="action-buttons-wrap">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="btn btn-outline btn-md"
                  >
                    <Edit3 size={15} />
                    <span>{existingPet ? '✏️ Update Pet Details' : '+ Add Pet Profile Now'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedToAlert}
                    className="btn btn-primary btn-md"
                  >
                    <span>Proceed to Pet Safety Check 🐾 →</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* CASE 2: FORM FOR ADDING / EDITING PET DETAILS */
            <form onSubmit={handleSubmit} className="onboarding-form">
              {/* Optional Prompt Banner */}
              <div className="optional-step-banner">
                <div className="optional-banner-text">
                  <Smile size={18} className="optional-icon" />
                  <span>
                    <strong>Optional Step:</strong> If you don’t have a pet or wish to add details later, you can skip anytime.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="btn btn-ghost btn-sm skip-step-link"
                >
                  <span>Skip for now →</span>
                </button>
              </div>

              <div className="form-section-card cute-section-card">
                <h3 className="section-title-sm cute-section-title">
                  <span className="cute-title-icon">🐶</span>
                  <span>{isEditing ? 'Update Pet Details' : 'Pet Information (Optional)'}</span>
                </h3>

                <div className="form-vertical-stack">
                  {/* 1. Pet Name */}
                  <div className="form-group">
                    <label className="form-label cute-label" htmlFor="pet-name">
                      <span>1. Pet Name</span>
                      <span className="optional-tag">Optional</span>
                    </label>
                    <div className="input-with-icon">
                      <Smile size={16} className="input-icon text-terracotta" />
                      <input
                        id="pet-name"
                        type="text"
                        className="form-input cute-input"
                        placeholder="e.g. Bruno, Bella, Luna, Charlie"
                        value={dogName}
                        onChange={(e) => setDogName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* 2. Photos */}
                  <div className="form-group">
                    <label className="form-label cute-label">
                      <span>2. Pet Photos</span>
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
                    />
                  </div>

                  {/* 3. Breed */}
                  <div className="form-group">
                    <label className="form-label cute-label" htmlFor="pet-breed">
                      <span>3. Breed</span>
                      <span className="optional-tag">Optional</span>
                    </label>
                    <div className="input-with-icon">
                      <Tag size={16} className="input-icon text-terracotta" />
                      <input
                        id="pet-breed"
                        type="text"
                        className="form-input cute-input"
                        placeholder="e.g. Golden Retriever, Indie / Desi, Beagle, Labrador, Pomeranian"
                        value={breed}
                        onChange={(e) => setBreed(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* 4. Gender */}
                  <div className="form-group">
                    <label className="form-label cute-label">
                      <span>4. Gender</span>
                      <span className="optional-tag">Optional</span>
                    </label>
                    <div className="gender-selector-grid">
                      <button
                        type="button"
                        className={`gender-option-btn ${gender === 'Male' ? 'selected' : ''}`}
                        onClick={() => setGender('Male')}
                      >
                        <span className="gender-symbol">♂</span>
                        <span className="gender-name">Male</span>
                      </button>

                      <button
                        type="button"
                        className={`gender-option-btn ${gender === 'Female' ? 'selected' : ''}`}
                        onClick={() => setGender('Female')}
                      >
                        <span className="gender-symbol">♀</span>
                        <span className="gender-name">Female</span>
                      </button>
                    </div>
                  </div>

                  {/* 5. Age */}
                  <div className="form-group">
                    <label className="form-label cute-label" htmlFor="pet-age">
                      <span>5. Age</span>
                      <span className="optional-tag">Optional</span>
                    </label>
                    <div className="input-with-icon">
                      <Sparkles size={16} className="input-icon text-terracotta" />
                      <input
                        id="pet-age"
                        type="text"
                        className="form-input cute-input"
                        placeholder="e.g. 2 years, 6 months, Puppy"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* 6. Size Category */}
                  <div className="form-group">
                    <label className="form-label cute-label">
                      <span>6. Size Category</span>
                      <span className="optional-tag">Optional</span>
                    </label>
                    <div className="dog-size-pills-row">
                      {DOG_SIZES.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          className={`size-pill-btn ${size === s.label ? 'active' : ''}`}
                          onClick={() => setSize(s.label)}
                        >
                          <span className="size-icon">{s.icon}</span>
                          <span className="size-label">{s.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 7. Color & Markings */}
                  <div className="form-group">
                    <label className="form-label cute-label" htmlFor="pet-color">
                      <span>7. Color & Distinctive Markings</span>
                      <span className="optional-tag">Optional</span>
                    </label>
                    <div className="input-with-icon">
                      <PawPrint size={16} className="input-icon text-terracotta" />
                      <input
                        id="pet-color"
                        type="text"
                        className="form-input cute-input"
                        placeholder="e.g. Golden brown with white chest, black ears"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* 8. Distinguishing Marks or Personality */}
                  <div className="form-group">
                    <label className="form-label cute-label" htmlFor="pet-marks">
                      <span>8. Special Traits & Unique Features</span>
                      <span className="optional-tag">Optional</span>
                    </label>
                    <div className="input-with-icon">
                      <Heart size={16} className="input-icon text-terracotta" />
                      <input
                        id="pet-marks"
                        type="text"
                        className="form-input cute-input"
                        placeholder="e.g. One floppy ear, loves belly rubs, shy with strangers"
                        value={distinguishingMarks}
                        onChange={(e) => setDistinguishingMarks(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* 9. Distinguishing Marks or Collar */}
                  <div className="form-group">
                    <label className="form-label cute-label" htmlFor="pet-collar">
                      <span>9. Collar, Tag, or Microchip</span>
                      <span className="optional-tag">Optional</span>
                    </label>
                    <div className="input-with-icon">
                      <Tag size={16} className="input-icon text-terracotta" />
                      <input
                        id="pet-collar"
                        type="text"
                        className="form-input cute-input"
                        placeholder="e.g. Red collar with bell, Microchipped"
                        value={collarInfo}
                        onChange={(e) => setCollarInfo(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTIONS FOOTER */}
              <div className="wizard-actions-footer">
                <div className="action-buttons-wrap">
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn btn-outline btn-lg"
                    >
                      <span>Cancel</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="btn btn-outline btn-lg"
                    >
                      <ArrowLeft size={16} />
                      <span>Back to Location</span>
                    </button>
                  )}

                  {!isEditing && (
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="btn btn-ghost btn-md skip-pet-btn"
                    >
                      <span>Skip Step</span>
                    </button>
                  )}
                </div>

                <div className="action-buttons-wrap">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary btn-lg save-pet-btn"
                  >
                    <Check size={18} />
                    <span>{isEditing ? '✓ Update Pet Details' : '🐾 Save Pet Profile'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
