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
  ChevronDown,
  Trash2,
  Camera,
  Calendar,
  Scale,
  Palette,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { storageBucketService } from '../services/storageBucketService';
import type { DogGender, DogSize, DogProfile } from '../types';
import { handleDogImageError, getDogPhotoUrl, resolveGenericMediaUrl } from '../utils/dogPhotoHelper';
import { compressImage } from '../utils/imageCompressor';
import {
  DOG_AGE_OPTIONS,
  DOG_SIZE_OPTIONS,
  DOG_COLOR_OPTIONS,
} from '../data/dogBreeds';
import {
  getAllBreedItems,
  DOG_COLOR_SWATCHES,
} from '../utils/breedAssetHelper';
import { PetProfileSelector, type SelectorOption } from '../components/PetProfileSelector';
import './DogOnboardingPage.css';

interface DogOnboardingPageProps {
  onBackToLocation?: () => void;
  onBackToOwner?: () => void;
  onSuccess?: () => void;
}

// Dog Head SVG Icon for Breed tile
const DogHeadIcon = ({ size = 22 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 5.172a2 2 0 0 0-3.414-1.414l-3.871 3.87A1 1 0 0 0 2.414 9H4v5a2 2 0 0 0 2 2h1" />
    <path d="M14 5.172a2 2 0 0 1 3.414-1.414l3.871 3.87A1 1 0 0 1 21.586 9H20v5a2 2 0 0 1-2 2h-1" />
    <circle cx="9" cy="10" r="1" fill="currentColor" />
    <circle cx="15" cy="10" r="1" fill="currentColor" />
    <path d="M10 14a2 2 0 0 0 4 0" />
    <path d="M12 11.5v1" />
  </svg>
);

// Gender Glyph SVG Icon for Gender tile
const GenderSymbolIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9.5" cy="14.5" r="5" />
    <path d="m13 11 7-7" />
    <path d="M15 4h5v5" />
    <path d="M9.5 19.5v3" />
    <path d="M8 21h3" />
  </svg>
);

export const DogOnboardingPage: React.FC<DogOnboardingPageProps> = ({
  onBackToLocation,
  onBackToOwner,
  onSuccess,
}) => {
  const { user, refreshProgress, setActiveOnboardingTab } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const existingPet = user ? storageService.getPetProfileByUserId(user.id, user.email) : null;

  // Stable pet ID draft for uploads before initial save
  const [petDraftId] = useState<string>(() => existingPet?.id || `pet-${Date.now()}`);
  const petId = existingPet?.id || petDraftId;

  // Form Field States
  const [dogName, setDogName] = useState(existingPet?.name || 'Buddy');
  const [breed, setBreed] = useState(existingPet?.breed || 'Golden Retriever');
  const [gender, setGender] = useState<DogGender>(existingPet?.gender || 'Male');
  const [age, setAge] = useState(existingPet?.age || '2 years');
  const [size, setSize] = useState<DogSize>(existingPet?.size || 'Large (25-40 kg)' as DogSize);
  const [color, setColor] = useState(existingPet?.color || 'Golden / Fawn');
  const [distinguishingMarks, setDistinguishingMarks] = useState(
    existingPet?.distinguishingMarks || 'White chest patch, one floppy ear'
  );

  // Collar, Tag, or Microchip: Yes/No + companion detail
  const [hasCollarOrChip, setHasCollarOrChip] = useState<boolean>(() => {
    if (!existingPet?.collarInfo) return true; // Default Yes to match mockup
    const lower = existingPet.collarInfo.toLowerCase().trim();
    return lower !== 'no' && lower !== 'none' && lower !== 'no collar';
  });
  const [collarDetails, setCollarDetails] = useState(() => {
    const info = existingPet?.collarInfo || '';
    return info.toLowerCase().trim() === 'yes' ? '' : info;
  });

  const [primaryPhoto, setPrimaryPhoto] = useState(existingPet?.primaryPhoto || '');
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>(
    existingPet?.photos || []
  );

  // Flow & UI States
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Inline editing states for text-based rows
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingMarks, setIsEditingMarks] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const marksInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active selector popup modal: 'breed' | 'age' | 'gender' | 'size' | 'color' | 'collar' | null
  const [activeModal, setActiveModal] = useState<'breed' | 'age' | 'gender' | 'size' | 'color' | 'collar' | null>(
    null
  );

  // Synchronize form fields whenever existing pet updates
  useEffect(() => {
    if (existingPet) {
      setDogName(existingPet.name || 'Buddy');
      setBreed(existingPet.breed || 'Golden Retriever');
      setGender(existingPet.gender || 'Male');
      setAge(existingPet.age || '2 years');
      setSize(existingPet.size || ('Large (25-40 kg)' as DogSize));
      setColor(existingPet.color || 'Golden / Fawn');
      setDistinguishingMarks(existingPet.distinguishingMarks || 'White chest patch, one floppy ear');
      setPrimaryPhoto(existingPet.primaryPhoto || '');
      setAdditionalPhotos(existingPet.photos || []);
      if (existingPet.collarInfo) {
        const lower = existingPet.collarInfo.toLowerCase().trim();
        const hasCollar = lower !== 'no' && lower !== 'none' && lower !== 'no collar';
        setHasCollarOrChip(hasCollar);
        setCollarDetails(lower === 'yes' ? '' : existingPet.collarInfo);
      } else {
        setHasCollarOrChip(false);
        setCollarDetails('');
      }
    }
  }, [existingPet?.id, existingPet?.name, existingPet?.breed, existingPet?.primaryPhoto]);

  // Focus inline inputs when activated
  useEffect(() => {
    if (isEditingName) {
      nameInputRef.current?.focus();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (isEditingMarks) {
      marksInputRef.current?.focus();
    }
  }, [isEditingMarks]);

  // Handle Photo File Upload with compression & storage persistence
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP)', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be under 10MB', 'error');
      return;
    }

    setUploadingPhoto(true);
    try {
      const compressed = await compressImage(file, 800, 800, 0.82);
      if (!compressed) {
        throw new Error('Compression failed');
      }

      if (user) {
        try {
          const uploadedUrl = await storageBucketService.uploadPetPhoto(user.id, petId, compressed, 0);
          setPrimaryPhoto(uploadedUrl || compressed);
        } catch (uploadErr) {
          console.warn('[DogOnboardingPage] Storage upload fallback to local data:', uploadErr);
          setPrimaryPhoto(compressed);
        }
      } else {
        setPrimaryPhoto(compressed);
      }

      showToast('🐾 Pet photo updated!', 'success');
    } catch (err) {
      console.error('[DogOnboardingPage] Photo error:', err);
      showToast('Could not process photo. Please try another image.', 'error');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setPrimaryPhoto('');
    showToast('Pet photo removed', 'info');
  };

  // Resolve best available pet photo URL
  const displayPhotoUrl = useMemo(() => {
    if (primaryPhoto) {
      return resolveGenericMediaUrl(primaryPhoto);
    }
    if (existingPet) {
      return getDogPhotoUrl(existingPet);
    }
    return '';
  }, [primaryPhoto, existingPet]);

  // Selector Options
  const breedOptions: SelectorOption[] = useMemo(() => {
    return getAllBreedItems().map((b) => ({
      id: b.name,
      label: b.name,
      avatarUrl: b.avatarUrl,
      letter: b.letter,
    }));
  }, []);

  const ageOptions: SelectorOption[] = useMemo(() => {
    return DOG_AGE_OPTIONS.map((opt) => ({
      id: opt,
      label: opt,
      icon: <Calendar size={18} />,
    }));
  }, []);

  const genderOptions: SelectorOption[] = useMemo(() => [
    { id: 'Male', label: 'Male', icon: <span style={{ fontSize: '18px', fontWeight: 'bold' }}>♂</span> },
    { id: 'Female', label: 'Female', icon: <span style={{ fontSize: '18px', fontWeight: 'bold' }}>♀</span> },
  ], []);

  const sizeOptions: SelectorOption[] = useMemo(() => {
    return DOG_SIZE_OPTIONS.map((opt) => ({
      id: opt.value,
      label: opt.value,
      secondaryLabel: opt.label.replace(/^.* - /, ''),
      icon: <Scale size={18} />,
    }));
  }, []);

  const colorOptions: SelectorOption[] = useMemo(() => {
    return DOG_COLOR_OPTIONS.map((opt) => ({
      id: opt,
      label: opt,
      swatchColor: DOG_COLOR_SWATCHES[opt]?.bg,
      swatchBorder: DOG_COLOR_SWATCHES[opt]?.border,
    }));
  }, []);

  const collarOptions: SelectorOption[] = useMemo(() => [
    { id: 'Yes', label: 'Yes', secondaryLabel: 'Equipped with collar, tag, or microchip', icon: <Tag size={18} /> },
    { id: 'No', label: 'No', secondaryLabel: 'No collar, tag, or microchip', icon: <Tag size={18} /> },
  ], []);

  // Handle Save / Submit Pet Profile
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      showToast('Please sign in to save pet details.', 'error');
      return;
    }

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
      name: dogName.trim() || 'Buddy',
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
      setSubmitting(false);

      showToast(`🐾 ${profile.name}'s profile saved!`, 'success');
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      setSubmitting(false);
      showToast('Could not save pet profile. Please try again.', 'error');
    }
  };

  // Handle Cancel / Reset changes
  const handleCancel = () => {
    if (existingPet) {
      setDogName(existingPet.name || 'Buddy');
      setBreed(existingPet.breed || 'Golden Retriever');
      setGender(existingPet.gender || 'Male');
      setAge(existingPet.age || '2 years');
      setSize(existingPet.size || ('Large (25-40 kg)' as DogSize));
      setColor(existingPet.color || 'Golden / Fawn');
      setDistinguishingMarks(existingPet.distinguishingMarks || 'White chest patch, one floppy ear');
      setPrimaryPhoto(existingPet.primaryPhoto || '');
      setAdditionalPhotos(existingPet.photos || []);
      if (existingPet.collarInfo) {
        const lower = existingPet.collarInfo.toLowerCase().trim();
        const hasCollar = lower !== 'no' && lower !== 'none' && lower !== 'no collar';
        setHasCollarOrChip(hasCollar);
        setCollarDetails(lower === 'yes' ? '' : existingPet.collarInfo);
      } else {
        setHasCollarOrChip(false);
        setCollarDetails('');
      }
      showToast('Changes discarded', 'info');
    } else {
      handleBack();
    }
  };

  // Handle Delete Pet Profile immediately
  const handleDeletePetProfile = () => {
    if (!user) return;
    const petNameToDelete = existingPet?.name || dogName || 'your pet';
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${petNameToDelete}'s pet profile? All pet details and community dashboard listings will be removed immediately.`
    );
    if (!confirmed) return;

    const targetId = existingPet?.id || petId;
    storageService.deletePetProfile(targetId, user.id);

    // Reset local form states
    setDogName('');
    setBreed('');
    setGender('Male');
    setAge('2 years');
    setSize('Medium (10-25kg)' as DogSize);
    setColor('Golden / Fawn');
    setDistinguishingMarks('');
    setHasCollarOrChip(false);
    setCollarDetails('');
    setPrimaryPhoto('');
    setAdditionalPhotos([]);

    refreshProgress();
    showToast(`🗑️ ${petNameToDelete}'s pet profile was deleted immediately.`, 'info');
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

  return (
    <div className="onboarding-page">
      <div className="app-container onboarding-container">
        {/* APPROVED OUTER CONTAINER - CSS & GLOW PRESERVED EXACTLY AS-IS */}
        <div className="onboarding-card card owner-theme-card pet-combined-card">
          {/* 1. Header Bar */}
          <div className="pet-profile-header-bar">
            <div className="pet-profile-header-left">
              <button
                type="button"
                className="pet-profile-back-btn"
                onClick={handleBack}
                title="Go back"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="pet-profile-title-wrap">
                <h2 className="pet-profile-title">Update Pet Details</h2>
                <p className="pet-profile-subtitle">Keep your pet’s information up to date.</p>
              </div>
            </div>

            <div className="pet-profile-brand-badge" title="Happy Pets Safer Tomorrows">
              <PawPrint size={14} className="text-amber" />
              <span className="pet-profile-brand-text">Happy Pets Safer Tomorrows</span>
              <Heart size={14} className="pet-profile-brand-heart" />
            </div>
          </div>

          {/* 2. Centered Pet Profile Photo */}
          <div className="pet-profile-photo-center">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoSelect}
            />

            <div className="pet-photo-circle-wrap">
              <div className="pet-photo-circle-inner">
                {displayPhotoUrl ? (
                  <img
                    src={displayPhotoUrl}
                    alt={dogName || 'Pet Photo'}
                    className="pet-photo-main-img"
                    onError={handleDogImageError}
                  />
                ) : (
                  <div className="pet-photo-main-placeholder">
                    <DogHeadIcon size={52} />
                  </div>
                )}
              </div>

              {/* Overlapping Camera Badge */}
              <button
                type="button"
                className="pet-photo-camera-badge"
                onClick={() => fileInputRef.current?.click()}
                title="Change pet photo"
                aria-label="Upload photo"
              >
                {uploadingPhoto ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              </button>
            </div>

            {/* Remove Photo Link */}
            {displayPhotoUrl && (
              <button
                type="button"
                className="pet-photo-remove-btn"
                onClick={handleRemovePhoto}
                title="Remove current pet photo"
              >
                <Trash2 size={13} />
                <span>Remove Photo</span>
              </button>
            )}

            {uploadingPhoto && (
              <span className="pet-photo-upload-status">
                <Loader2 size={12} className="animate-spin" /> Uploading & compressing photo...
              </span>
            )}
          </div>

          {/* 3. Fixed Information Row System */}
          <form onSubmit={handleSubmit} className="pet-info-form">
            <div className="pet-info-rows-container">
              {/* ROW 1: Pet Name */}
              <div
                className="pet-info-row"
                onClick={() => {
                  if (!isEditingName) setIsEditingName(true);
                }}
              >
                <div className="pet-info-icon-tile">
                  <PawPrint size={20} />
                </div>
                <div className="pet-info-content">
                  <span className="pet-info-label">
                    Pet Name <span className="required-star">*</span>
                  </span>
                  {isEditingName ? (
                    <div
                      className="pet-inline-edit-form"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        ref={nameInputRef}
                        type="text"
                        className="pet-inline-edit-input"
                        value={dogName}
                        placeholder="Enter pet name..."
                        onChange={(e) => setDogName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setIsEditingName(false);
                          }
                        }}
                        onBlur={() => setIsEditingName(false)}
                      />
                      <button
                        type="button"
                        className="pet-inline-confirm-btn"
                        onClick={() => setIsEditingName(false)}
                        title="Save pet name"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  ) : (
                    <span className={`pet-info-value ${!dogName ? 'placeholder' : ''}`}>
                      {dogName || 'Buddy'}
                    </span>
                  )}
                </div>
                <div className="pet-info-action">
                  <Edit3 size={17} />
                </div>
              </div>

              {/* ROW 2: Breed */}
              <div
                className="pet-info-row"
                onClick={() => setActiveModal('breed')}
              >
                <div className="pet-info-icon-tile">
                  <DogHeadIcon size={20} />
                </div>
                <div className="pet-info-content">
                  <span className="pet-info-label">
                    Breed <span className="required-star">*</span>
                  </span>
                  <span className={`pet-info-value ${!breed ? 'placeholder' : ''}`}>
                    {breed || 'Select breed'}
                  </span>
                </div>
                <div className="pet-info-action">
                  <ChevronDown size={18} />
                </div>
              </div>

              {/* ROW 3: Age */}
              <div
                className="pet-info-row"
                onClick={() => setActiveModal('age')}
              >
                <div className="pet-info-icon-tile">
                  <Calendar size={19} />
                </div>
                <div className="pet-info-content">
                  <span className="pet-info-label">
                    Age <span className="required-star">*</span>
                  </span>
                  <span className={`pet-info-value ${!age ? 'placeholder' : ''}`}>
                    {age || '2 years'}
                  </span>
                </div>
                <div className="pet-info-action">
                  <ChevronDown size={18} />
                </div>
              </div>

              {/* ROW 4: Gender */}
              <div
                className="pet-info-row"
                onClick={() => setActiveModal('gender')}
              >
                <div className="pet-info-icon-tile">
                  <GenderSymbolIcon size={19} />
                </div>
                <div className="pet-info-content">
                  <span className="pet-info-label">
                    Gender <span className="required-star">*</span>
                  </span>
                  <span className={`pet-info-value ${!gender ? 'placeholder' : ''}`}>
                    {gender || 'Male'}
                  </span>
                </div>
                <div className="pet-info-action">
                  <ChevronDown size={18} />
                </div>
              </div>

              {/* ROW 5: Size Category */}
              <div
                className="pet-info-row"
                onClick={() => setActiveModal('size')}
              >
                <div className="pet-info-icon-tile">
                  <Scale size={19} />
                </div>
                <div className="pet-info-content">
                  <span className="pet-info-label">
                    Size Category <span className="required-star">*</span>
                  </span>
                  <span className={`pet-info-value ${!size ? 'placeholder' : ''}`}>
                    {size && size.includes('Large') && !size.includes('Extra') ? 'Large (> 25 kg)' : size || 'Large (> 25 kg)'}
                  </span>
                </div>
                <div className="pet-info-action">
                  <ChevronDown size={18} />
                </div>
              </div>

              {/* ROW 6: Color & Markings */}
              <div
                className="pet-info-row"
                onClick={() => setActiveModal('color')}
              >
                <div className="pet-info-icon-tile">
                  <Palette size={19} />
                </div>
                <div className="pet-info-content">
                  <span className="pet-info-label">
                    Color & Markings <span className="required-star">*</span>
                  </span>
                  <span className={`pet-info-value ${!color ? 'placeholder' : ''}`}>
                    {color || 'Golden / Fawn'}
                  </span>
                </div>
                <div className="pet-info-action">
                  <ChevronDown size={18} />
                </div>
              </div>

              {/* ROW 7: Distinctive Marks */}
              <div
                className="pet-info-row"
                onClick={() => {
                  if (!isEditingMarks) setIsEditingMarks(true);
                }}
              >
                <div className="pet-info-icon-tile">
                  <Sparkles size={19} />
                </div>
                <div className="pet-info-content">
                  <span className="pet-info-label">
                    Distinctive Marks (Optional)
                  </span>
                  {isEditingMarks ? (
                    <div
                      className="pet-inline-edit-form"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        ref={marksInputRef}
                        type="text"
                        className="pet-inline-edit-input"
                        value={distinguishingMarks}
                        placeholder="e.g. White chest patch, one floppy ear..."
                        onChange={(e) => setDistinguishingMarks(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setIsEditingMarks(false);
                          }
                        }}
                        onBlur={() => setIsEditingMarks(false)}
                      />
                      <button
                        type="button"
                        className="pet-inline-confirm-btn"
                        onClick={() => setIsEditingMarks(false)}
                        title="Save markings"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  ) : (
                    <span className={`pet-info-value ${!distinguishingMarks ? 'placeholder' : ''}`}>
                      {distinguishingMarks || 'White chest patch, one floppy ear'}
                    </span>
                  )}
                </div>
                <div className="pet-info-action">
                  <Edit3 size={17} />
                </div>
              </div>

              {/* ROW 8: Collar, Tag, or Microchip */}
              <div
                className="pet-info-row"
                onClick={() => setActiveModal('collar')}
              >
                <div className="pet-info-icon-tile">
                  <Tag size={19} />
                </div>
                <div className="pet-info-content">
                  <span className="pet-info-label">
                    Collar, Tag, or Microchip
                  </span>
                  <span className="pet-info-value">
                    {hasCollarOrChip ? (collarDetails && collarDetails.toLowerCase().trim() !== 'yes' ? `Yes (${collarDetails})` : 'Yes') : 'No'}
                  </span>
                </div>
                <div className="pet-info-action">
                  <ChevronDown size={18} />
                </div>
              </div>

              {/* Optional companion detail input when Collar/Tag is Yes */}
              {hasCollarOrChip && (
                <div className="collar-inline-detail-wrap">
                  <input
                    type="text"
                    className="collar-inline-input"
                    placeholder="e.g. Red collar with bell, QR Tag, Microchip #..."
                    value={collarDetails.toLowerCase().trim() === 'yes' ? '' : collarDetails}
                    onChange={(e) => setCollarDetails(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* 4. Bottom Actions */}
            <div className="pet-profile-actions-bottom">
              <div className="pet-profile-actions-left">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-outline pet-cancel-btn"
                >
                  Cancel
                </button>

                {existingPet && (
                  <button
                    type="button"
                    onClick={handleDeletePetProfile}
                    className="pet-delete-link-btn"
                    title="Permanently remove pet profile"
                  >
                    <Trash2 size={14} />
                    <span>Delete Pet</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary pet-update-submit-btn"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                <span>Update Pet Details</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ===================================================
          GENERIC POPUP MODALS (PetProfileSelector)
          =================================================== */}

      {/* 1. Breed Selector Popup (Searchable, A-Z Scrubber, Fallback Avatars) */}
      <PetProfileSelector
        isOpen={activeModal === 'breed'}
        onClose={() => setActiveModal(null)}
        title="Select Breed"
        options={breedOptions}
        selectedValue={breed}
        onSelect={(val) => setBreed(val)}
        searchable={true}
        searchPlaceholder="Search breed..."
        showAlphabetScrubber={true}
      />

      {/* 2. Age Selector Popup (Logical/Numerical Order) */}
      <PetProfileSelector
        isOpen={activeModal === 'age'}
        onClose={() => setActiveModal(null)}
        title="Select Age"
        options={ageOptions}
        selectedValue={age}
        onSelect={(val) => setAge(val)}
        searchable={false}
      />

      {/* 3. Gender Selector Popup */}
      <PetProfileSelector
        isOpen={activeModal === 'gender'}
        onClose={() => setActiveModal(null)}
        title="Select Gender"
        options={genderOptions}
        selectedValue={gender}
        onSelect={(val) => setGender(val as DogGender)}
        searchable={false}
      />

      {/* 4. Size Category Selector Popup (Smallest to Largest) */}
      <PetProfileSelector
        isOpen={activeModal === 'size'}
        onClose={() => setActiveModal(null)}
        title="Select Size Category"
        options={sizeOptions}
        selectedValue={size}
        onSelect={(val) => setSize(val as DogSize)}
        searchable={false}
      />

      {/* 5. Color & Markings Selector Popup (With Visual Swatches) */}
      <PetProfileSelector
        isOpen={activeModal === 'color'}
        onClose={() => setActiveModal(null)}
        title="Select Color & Markings"
        options={colorOptions}
        selectedValue={color}
        onSelect={(val) => setColor(val)}
        searchable={false}
      />

      {/* 6. Collar / Tag / Microchip Selector Popup */}
      <PetProfileSelector
        isOpen={activeModal === 'collar'}
        onClose={() => setActiveModal(null)}
        title="Collar, Tag, or Microchip"
        options={collarOptions}
        selectedValue={hasCollarOrChip ? 'Yes' : 'No'}
        onSelect={(val) => {
          if (val === 'Yes') {
            setHasCollarOrChip(true);
          } else {
            setHasCollarOrChip(false);
            setCollarDetails('');
          }
        }}
        searchable={false}
      />
    </div>
  );
};
