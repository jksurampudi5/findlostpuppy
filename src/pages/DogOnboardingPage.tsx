import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Tag,
  ChevronDown,
  Trash2,
  Camera,
  Calendar,
  Palette,
  Loader2,
  Bone,
  Dog,
  Fingerprint,
  Ruler,
  VenusAndMars,
  X,
  Upload,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { storageBucketService } from '../services/storageBucketService';
import type { DogGender, DogSize, DogProfile } from '../types';
import { handleDogImageError, getDogPhotoUrl, resolveGenericMediaUrl } from '../utils/dogPhotoHelper';
import { compressImage } from '../utils/imageCompressor';
import { applyPhotoChangeTracking, canChangePhoto } from '../utils/photoChangePolicy';
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
import { CameraModal } from '../components/CameraModal';
import './DogOnboardingPage.css';

interface DogOnboardingPageProps {
  onBackToLocation?: () => void;
  onBackToOwner?: () => void;
  onSuccess?: () => void;
}

/** Displays saved pet details or the pet registration form, including photo upload and removal actions. */
export const DogOnboardingPage: React.FC<DogOnboardingPageProps> = ({
  onBackToLocation,
  onBackToOwner,
  onSuccess,
}) => {
  const { user, refreshProgress, setActiveOnboardingTab } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const existingPet = user ? storageService.getPetProfileByUserId(user.id, user.email) : null;
  const photoPolicy = canChangePhoto(existingPet);
  const photoLimitText = photoPolicy.isInitialPhoto
    ? 'First pet photo upload is free.'
    : photoPolicy.allowed
      ? `${photoPolicy.remaining} pet photo change${photoPolicy.remaining === 1 ? '' : 's'} left this month.`
      : 'Pet photo change limit reached. Admin approval is required.';

  // Stable pet ID draft for uploads before initial save
  const [petDraftId] = useState<string>(() => existingPet?.id || `pet-${Date.now()}`);
  const petId = existingPet?.id || petDraftId;

  // Form Field States
  const [dogName, setDogName] = useState(existingPet?.name || '');
  const [breed, setBreed] = useState(existingPet?.breed || '');
  const [gender, setGender] = useState<DogGender>(existingPet?.gender || 'Male');
  const [age, setAge] = useState(existingPet?.age || '');
  const [size, setSize] = useState<DogSize>(existingPet?.size || ('Large (25-40 kg)' as DogSize));
  const [color, setColor] = useState(existingPet?.color || '');
  const [distinguishingMarks, setDistinguishingMarks] = useState(
    existingPet?.distinguishingMarks || ''
  );

  const isPetFilled = Boolean(existingPet?.id && (existingPet?.name || existingPet?.breed));
  const [isEditing, setIsEditing] = useState<boolean>(!isPetFilled);
  const initialPetModeSetRef = useRef(false);

  // Collar, Tag, or Microchip: Yes/No + companion detail
  const [hasCollarOrChip, setHasCollarOrChip] = useState<boolean>(() => {
    if (!existingPet?.collarInfo) return false;
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showPetAvatarIcons, setShowPetAvatarIcons] = useState(!primaryPhoto);

  useEffect(() => {
    if (!primaryPhoto) setShowPetAvatarIcons(true);
  }, [primaryPhoto]);

  // Active selector popup modal: 'breed' | 'age' | 'gender' | 'size' | 'color' | 'collar' | null
  const [activeModal, setActiveModal] = useState<'breed' | 'age' | 'gender' | 'size' | 'color' | 'collar' | null>(
    null
  );
  const [activeTextModal, setActiveTextModal] = useState<'name' | 'marks' | null>(null);
  const [textModalValue, setTextModalValue] = useState('');

  // Synchronize form fields whenever existing pet updates
  useEffect(() => {
    if (existingPet) {
      setDogName(existingPet.name || '');
      setBreed(existingPet.breed || '');
      setGender(existingPet.gender || 'Male');
      setAge(existingPet.age || '');
      setSize(existingPet.size || ('Large (25-40 kg)' as DogSize));
      setColor(existingPet.color || '');
      setDistinguishingMarks(existingPet.distinguishingMarks || '');
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

      if (!initialPetModeSetRef.current && (existingPet.name || existingPet.breed)) {
        initialPetModeSetRef.current = true;
        setIsEditing(false);
      }
    }
  }, [existingPet?.id, existingPet?.name, existingPet?.breed, existingPet?.primaryPhoto]);

  // Handle Photo File Upload with compression & storage persistence
  /** Compresses the chosen pet photo and uploads it, queuing the image when upload cannot complete. */
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

    const policy = canChangePhoto(existingPet);
    if (!policy.allowed) {
      showToast('Pet photo can be changed twice per month. Please contact admin approval for another update.', 'warning');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadingPhoto(true);
    try {
      const compressed = await compressImage(file, 800, 800, 0.82);
      if (!compressed) {
        throw new Error('Compression failed');
      }

      if (user) {
        const uploadedUrl = await storageBucketService.uploadPetPhoto(user.id, petId, compressed, 0, existingPet?.primaryPhoto);
        if (!uploadedUrl) {
          storageBucketService.enqueueItem({
            category: 'pet', referenceId: petId, ownerId: user.id, index: 0,
            base64Data: compressed, previousUrl: existingPet?.primaryPhoto,
          });
          showToast('Pet photo is queued for secure upload. Please retry after the connection returns.', 'info');
          return;
        }
        setPrimaryPhoto(uploadedUrl);
      } else {
        throw new Error('AUTH_REQUIRED');
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

  const handleHardReset = () => {
    // 1. Harvest all pet photos to delete from Cloudinary
    const photosToDelete = [
      primaryPhoto,
      ...additionalPhotos,
      existingPet?.primaryPhoto,
      ...(existingPet?.photos || []),
    ].filter(Boolean) as string[];

    for (const photo of photosToDelete) {
      if (photo && (photo.includes('cloudinary.com') || photo.includes('findlostpuppy/'))) {
        storageBucketService.deleteMedia(photo).catch(() => {});
      }
    }

    // 2. Clear all pet details EXCEPT gender and size category
    setPrimaryPhoto('');
    setAdditionalPhotos([]);
    setDogName('');
    setBreed('');
    // Gender is preserved as per user requirement
    setAge('');
    // Size Category is preserved as per user requirement
    setColor('');
    setDistinguishingMarks('');
    setHasCollarOrChip(false);
    setCollarDetails('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    // 3. Purge existing pet profile in storage & backend if registered
    if (user && existingPet) {
      storageService.deletePetProfile(petId, user.id);
    }
    
    refreshProgress();
    window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
    window.dispatchEvent(new CustomEvent('findlostpuppy_data_synced'));
    window.dispatchEvent(new Event('storage'));

    showToast('Pet details reset (gender & size category preserved)', 'info');
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
      icon: <Ruler size={18} />,
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
  /** Validates and saves pet details, handling media uploads before completing the form flow. */
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
        const uploaded = await storageBucketService.uploadPetPhoto(ownerId, petId, finalPrimary, 0, existingPet?.primaryPhoto);
        if (uploaded) finalPrimary = uploaded;
        else throw new Error('PRIMARY_UPLOAD_FAILED');
      } catch (err) {
        console.warn('[DogOnboardingPage] Primary photo queued for retry:', err);
        storageBucketService.enqueueItem({
          category: 'pet', referenceId: petId, ownerId, index: 0,
          base64Data: finalPrimary, previousUrl: existingPet?.primaryPhoto,
        });
        showToast('Pet photo is still uploading. Please retry saving when the connection is available.', 'info');
        setSubmitting(false);
        return;
      }
    }

    for (let i = 0; i < finalAdditionals.length; i++) {
      if (finalAdditionals[i] && finalAdditionals[i].startsWith('data:')) {
        try {
          const uploaded = await storageBucketService.uploadPetPhoto(ownerId, petId, finalAdditionals[i], i + 1);
          if (uploaded) finalAdditionals[i] = uploaded;
          else {
            storageBucketService.enqueueItem({
              category: 'pet', referenceId: petId, ownerId, index: i + 1,
              base64Data: finalAdditionals[i],
            });
            finalAdditionals[i] = '';
          }
        } catch (err) {
          console.warn('[DogOnboardingPage] Gallery photo queued for retry:', err);
          storageBucketService.enqueueItem({
            category: 'pet', referenceId: petId, ownerId, index: i + 1,
            base64Data: finalAdditionals[i],
          });
          finalAdditionals[i] = '';
        }
      }
    }

    const finalCollar = hasCollarOrChip
      ? (collarDetails.trim() || 'Collar / Tag / Microchip equipped')
      : undefined;

    if (!dogName.trim()) {
      showToast('Please provide a name for your pet.', 'error');
      setSubmitting(false);
      return;
    }

    const profile: DogProfile = {
      ...(existingPet || {}),
      id: petId,
      ownerId,
      name: dogName.trim(),
      breed: breed.trim() || 'Street Dog / Desi / Indie',
      gender,
      age: age.trim() || 'Young Adult (1-3 yrs)',
      size,
      color: color.trim() || 'Golden / Fawn',
      distinguishingMarks: distinguishingMarks.trim() || '',
      collarInfo: finalCollar,
      primaryPhoto: finalPrimary || '',
      photos: finalAdditionals.filter(Boolean),
      createdAt: existingPet?.createdAt || new Date().toISOString(),
    };
    const photoChanged = Boolean(finalPrimary) && finalPrimary !== existingPet?.primaryPhoto;
    const profileToSave = photoChanged ? applyPhotoChangeTracking(profile, existingPet) : profile;

    try {
      storageService.savePetProfile(profileToSave);
      refreshProgress();
      setSubmitting(false);

      showToast(`🐾 ${profileToSave.name}'s profile saved!`, 'success');
      setIsEditing(false);
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
    }
    setIsEditing(false);
  };

  const handleResetPetForm = () => {
    const confirmed = window.confirm(
      'Reset all pet details on this screen? This clears the photo and fields here. Use Delete Pet to permanently remove a saved pet profile.'
    );
    if (!confirmed) return;

    setDogName('');
    setBreed('');
    setGender('Male');
    setAge('');
    setSize('Medium (10-25kg)' as DogSize);
    setColor('');
    setDistinguishingMarks('');
    setHasCollarOrChip(false);
    setCollarDetails('');
    setPrimaryPhoto('');
    setAdditionalPhotos([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Pet form reset. Saved profile is unchanged until you update or delete it.', 'info');
  };

  // Handle Delete Pet Profile immediately
  const handleDeletePetProfile = () => {
    if (!user) return;
    const petNameToDelete = existingPet?.name || dogName || 'your pet';
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${petNameToDelete}'s pet profile? All saved pet details, photo links, and missing reports for this pet will be removed immediately.`
    );
    if (!confirmed) return;

    const targetId = existingPet?.id || petId;

    // Harvest all pet photos to delete from Cloudinary / Storage
    const photosToDelete = [
      primaryPhoto,
      ...additionalPhotos,
      existingPet?.primaryPhoto,
      ...(existingPet?.photos || []),
    ].filter(Boolean) as string[];

    for (const photo of photosToDelete) {
      if (photo && (photo.includes('cloudinary.com') || photo.includes('findlostpuppy/'))) {
        storageBucketService.deleteMedia(photo).catch(() => {});
      }
    }

    storageService.deletePetProfile(targetId, user.id);

    // Reset local form states to empty for refilling or skipping
    setDogName('');
    setBreed('');
    setGender('Male');
    setAge('');
    setSize('Medium (10-25kg)' as DogSize);
    setColor('');
    setDistinguishingMarks('');
    setHasCollarOrChip(false);
    setCollarDetails('');
    setPrimaryPhoto('');
    setAdditionalPhotos([]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Switch to editing empty form so user can refill or skip
    setIsEditing(true);

    refreshProgress();
    window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
    window.dispatchEvent(new CustomEvent('findlostpuppy_data_synced'));
    window.dispatchEvent(new Event('storage'));

    showToast(`🗑️ ${petNameToDelete}'s pet profile and images removed. You can enter new pet details or skip to Dashboard.`, 'info');
  };


  void handleResetPetForm;

  const handleBack = () => {
    if (onBackToLocation) {
      onBackToLocation();
    } else if (onBackToOwner) {
      onBackToOwner();
    } else {
      setActiveOnboardingTab('choice');
      navigate('/choice');
    }
  };

  const handleExitToDashboard = () => {
    setActiveOnboardingTab('dashboard');
    navigate('/homepage');
  };

  const openTextModal = (field: 'name' | 'marks') => {
    setTextModalValue(field === 'name' ? dogName : distinguishingMarks);
    setActiveTextModal(field);
  };

  const handleTextModalUpdate = () => {
    if (activeTextModal === 'name') {
      setDogName(textModalValue.trim());
    }
    if (activeTextModal === 'marks') {
      setDistinguishingMarks(textModalValue.trim());
    }
    setActiveTextModal(null);
  };

  return (
    <div className="onboarding-page">
      <div className="app-container onboarding-container">
        {/* APPROVED OUTER CONTAINER - CSS & GLOW PRESERVED EXACTLY AS-IS */}
        <div className="onboarding-card card owner-theme-card pet-combined-card">
          <button
            type="button"
            className="onboarding-exit-btn"
            onClick={handleExitToDashboard}
            aria-label="Exit pet details and go to dashboard"
            title="Exit to dashboard"
          >
            <X size={19} />
          </button>
          <div className="section-card-title-block">
            <h1>Pet Details</h1>
          </div>
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
            </div>

            {isPetFilled && (
              <button
                type="button"
                className="pet-profile-remove-btn"
                onClick={handleDeletePetProfile}
                title="Remove Pet Profile"
                aria-label="Remove Pet Profile"
              >
                <Trash2 size={15} />
                <span>Remove Pet</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleExitToDashboard}
            className="pet-skip-direct-btn pet-skip-top-btn"
            title="Skip pet details and go to dashboard"
          >
            <span>Skip to Dashboard</span>
          </button>

          {!isEditing ? (
            <div className="pet-profile-view-content">
              {/* Existing Pet Status Pill */}
              <div className="existing-pet-status-pill pet-view-status-pill">
                <span className="existing-pet-status-dot"></span>
                <span>
                  🐾 You already had a pet: <strong>{dogName || 'Buddy'}</strong> {breed ? `(${breed})` : ''}
                </span>
              </div>

              {/* Clean Pet Photo Circle (No floating camera/upload badges) */}
              <div className="pet-profile-photo-center pet-photo-view-center">
                <div
                  className="pet-photo-circle-wrap pet-photo-view-wrap"
                  onClick={() => {
                    if (photoPolicy.allowed) {
                      setIsEditing(true);
                    } else {
                      showToast('Photo change limit reached. Click Modify Pet Details below to edit info.', 'info');
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  title="Click to modify photo or details"
                >
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
                        <Dog size={56} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Clean Pet Profile Summary Card (Click to edit) */}
              <div className="pet-profile-view-wrap">
                <div
                  className="pet-view-card"
                  onClick={() => setIsEditing(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsEditing(true); }}
                  title="Click to edit pet details"
                  style={{ cursor: 'pointer' }}
                >
                  <div className="pet-view-header">
                    <div className="pet-view-name-wrap">
                      <h2 className="pet-view-name">{dogName || 'Buddy'}</h2>
                      <span className={`pet-view-gender-badge gender-${gender.toLowerCase()}`}>
                        {gender === 'Male' ? '♂ Male' : '♀ Female'}
                      </span>
                    </div>
                  </div>

                  <div className="pet-view-grid">
                    <div className="pet-view-stat-cell">
                      <div className="pet-view-stat-icon"><Bone size={16} /></div>
                      <div className="pet-view-stat-info">
                        <span className="pet-view-stat-label">Breed</span>
                        <span className="pet-view-stat-value">{breed || 'Street Dog / Indie'}</span>
                      </div>
                    </div>

                    <div className="pet-view-stat-cell">
                      <div className="pet-view-stat-icon"><Calendar size={16} /></div>
                      <div className="pet-view-stat-info">
                        <span className="pet-view-stat-label">Age</span>
                        <span className="pet-view-stat-value">{age || '2 years'}</span>
                      </div>
                    </div>

                    <div className="pet-view-stat-cell">
                      <div className="pet-view-stat-icon"><Ruler size={16} /></div>
                      <div className="pet-view-stat-info">
                        <span className="pet-view-stat-label">Size</span>
                        <span className="pet-view-stat-value">
                          {size && size.includes('Large') && !size.includes('Extra') ? 'Large (> 25 kg)' : size || 'Large (> 25 kg)'}
                        </span>
                      </div>
                    </div>

                    <div className="pet-view-stat-cell">
                      <div className="pet-view-stat-icon"><Palette size={16} /></div>
                      <div className="pet-view-stat-info">
                        <span className="pet-view-stat-label">Color</span>
                        <span className="pet-view-stat-value">{color || 'Golden / Fawn'}</span>
                      </div>
                    </div>
                  </div>

                  {distinguishingMarks && (
                    <div className="pet-view-extra-row">
                      <div className="pet-view-stat-icon"><Fingerprint size={16} /></div>
                      <div className="pet-view-stat-info">
                        <span className="pet-view-stat-label">Distinctive Marks</span>
                        <span className="pet-view-stat-value">{distinguishingMarks}</span>
                      </div>
                    </div>
                  )}

                  <div className="pet-view-extra-row">
                    <div className="pet-view-stat-icon"><Tag size={16} /></div>
                    <div className="pet-view-stat-info">
                      <span className="pet-view-stat-label">Collar / Tag / ID</span>
                      <span className="pet-view-stat-value">
                        {hasCollarOrChip
                          ? (collarDetails && collarDetails.toLowerCase().trim() !== 'yes'
                            ? `Yes (${collarDetails})`
                            : 'Yes (Equipped with collar / ID tag)')
                          : 'No collar or microchip'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Mode Actions */}
              <div className="pet-profile-actions-bottom view-mode-actions">
                <button
                  type="button"
                  onClick={() => {
                    if (onSuccess) {
                      onSuccess();
                    } else {
                      setActiveOnboardingTab('report');
                      navigate('/alert');
                    }
                  }}
                  className="btn btn-primary btn-lg continue-to-location-orange-btn pet-view-continue-btn"
                >
                  <span>Continue to Pet Safety Status</span>
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="pet-modify-btn"
                >
                  <Edit3 size={16} />
                  <span>Modify Pet Details / Photo</span>
                </button>

              </div>
            </div>
          ) : (
            <>
              {/* 2. Centered Pet Profile Photo (With Edit Badges & Actions) */}
              <div className="pet-profile-photo-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoSelect}
                />

                <div
                  className="pet-photo-circle-wrap"
                  onMouseEnter={() => setShowPetAvatarIcons(true)}
                  onMouseLeave={() => { if (displayPhotoUrl) setShowPetAvatarIcons(false); }}
                  onTouchStart={() => setShowPetAvatarIcons(true)}
                  onFocus={() => setShowPetAvatarIcons(true)}
                  tabIndex={0}
                >
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
                        <Dog size={56} />
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
                      opacity: (!displayPhotoUrl || showPetAvatarIcons) ? 1 : 0,
                      pointerEvents: (!displayPhotoUrl || showPetAvatarIcons) ? 'auto' : 'none',
                      transition: 'opacity 0.2s ease, transform 0.2s ease',
                    }}
                  >
                    <button
                      type="button"
                      className="pet-photo-camera-badge"
                      style={{ position: 'static', transform: 'none' }}
                      onClick={() => {
                        setShowPetAvatarIcons(true);
                        if (photoPolicy.allowed) fileInputRef.current?.click();
                      }}
                      disabled={!photoPolicy.allowed}
                      title={photoPolicy.allowed ? 'Upload from Gallery' : 'Photo change limit reached'}
                      aria-label={photoPolicy.allowed ? 'Upload from Gallery' : 'Photo change limit reached'}
                    >
                      <Upload size={16} />
                    </button>
                    <button
                      type="button"
                      className="pet-photo-camera-badge"
                      style={{ position: 'static', transform: 'none' }}
                      onClick={() => {
                        setShowPetAvatarIcons(true);
                        if (photoPolicy.allowed) setIsCameraOpen(true);
                      }}
                      disabled={!photoPolicy.allowed}
                      title={photoPolicy.allowed ? 'Change pet photo' : 'Photo change limit reached'}
                      aria-label={photoPolicy.allowed ? 'Upload photo' : 'Photo change limit reached'}
                    >
                      {uploadingPhoto ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                    </button>
                  </div>
                </div>

                <div className={`photo-change-limit-note pet-photo-limit-note ${photoPolicy.allowed ? '' : 'is-locked'}`}>
                  {photoLimitText}
                </div>

                {/* Remove Photo Link */}
                {displayPhotoUrl && (
                  <button
                    type="button"
                    className="pet-photo-remove-btn"
                    onClick={handleHardReset}
                    title="Remove current pet photo and reset form"
                  >
                    <Trash2 size={13} />
                    <span>Hard Reset</span>
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
                    onClick={() => openTextModal('name')}
                  >
                    <div className="pet-info-icon-tile">
                      <Dog size={20} />
                    </div>
                    <div className="pet-info-content">
                      <span className="pet-info-label">
                        Pet Name <span className="required-star">*</span>
                      </span>
                      <span className={`pet-info-value ${!dogName ? 'placeholder' : ''}`}>
                        {dogName || 'Enter pet name'}
                      </span>
                    </div>
                  </div>

                  {/* ROW 2: Breed */}
                  <div
                    className="pet-info-row"
                    onClick={() => setActiveModal('breed')}
                  >
                    <div className="pet-info-icon-tile">
                      <Bone size={20} />
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
                        {age || 'Select age'}
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
                      <VenusAndMars size={19} />
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
                      <Ruler size={19} />
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
                        {color || 'Select color'}
                      </span>
                    </div>
                    <div className="pet-info-action">
                      <ChevronDown size={18} />
                    </div>
                  </div>

                  {/* ROW 7: Distinctive Marks */}
                  <div
                    className="pet-info-row"
                    onClick={() => openTextModal('marks')}
                  >
                    <div className="pet-info-icon-tile">
                      <Fingerprint size={19} />
                    </div>
                    <div className="pet-info-content">
                      <span className="pet-info-label">
                        Distinctive Marks (Optional)
                      </span>
                      <span className={`pet-info-value ${!distinguishingMarks ? 'placeholder' : ''}`}>
                        {distinguishingMarks || 'None (optional)'}
                      </span>
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

                {/* 4. Bottom Actions in Edit Mode */}
                <div className="pet-profile-actions-bottom edit-mode-actions">
                  {isPetFilled && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="pet-cancel-edit-btn"
                    >
                      <X size={16} />
                      <span>Cancel</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="pet-save-btn"
                  >
                    {submitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Check size={18} />
                    )}
                    <span>Save Pet Details</span>
                  </button>
                </div>

              </form>
            </>
          )}
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

      {activeTextModal && (
        <div className="pet-text-modal-overlay" onClick={() => setActiveTextModal(null)} role="dialog" aria-modal="true">
          <div className="pet-text-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pet-text-modal-header">
              <h3>{activeTextModal === 'name' ? 'Pet Name' : 'Distinctive Marks'}</h3>
              <button type="button" onClick={() => setActiveTextModal(null)} aria-label="Close editor">
                X
              </button>
            </div>
            {activeTextModal === 'name' ? (
              <input
                type="text"
                className="pet-text-modal-input"
                value={textModalValue}
                placeholder="Enter pet name"
                autoFocus
                onChange={(e) => setTextModalValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTextModalUpdate();
                  }
                }}
              />
            ) : (
              <textarea
                className="pet-text-modal-textarea"
                value={textModalValue}
                placeholder="e.g. White chest patch, one floppy ear"
                autoFocus
                onChange={(e) => setTextModalValue(e.target.value)}
              />
            )}
            <button
              type="button"
              className="pet-text-modal-update-btn"
              onClick={handleTextModalUpdate}
            >
              <Check size={17} />
              <span>Update</span>
            </button>
          </div>
        </div>
      )}

      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        title="Pet Profile Photo"
        captureButtonText="Capture Pet Photo"
        onCapture={async (photoData) => {
          try {
            setUploadingPhoto(true);
            const res = await fetch(photoData);
            const blob = await res.blob();
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            
            const compressed = await compressImage(file, 800, 800, 0.82);
            if (!compressed) throw new Error('Compression failed');

            if (user) {
              const uploadedUrl = await storageBucketService.uploadPetPhoto(user.id, petId, compressed, 0, existingPet?.primaryPhoto);
              if (!uploadedUrl) {
                storageBucketService.enqueueItem({
                  category: 'pet', referenceId: petId, ownerId: user.id, index: 0,
                  base64Data: compressed, previousUrl: existingPet?.primaryPhoto,
                });
                showToast('Pet photo is queued for secure upload. Please retry after the connection returns.', 'info');
                return;
              }
              setPrimaryPhoto(uploadedUrl);
            } else {
              throw new Error('AUTH_REQUIRED');
            }
            showToast('🐾 Pet photo updated!', 'success');
          } catch (e) {
            console.error('Failed to process camera photo', e);
            showToast('Could not process photo. Please try another image.', 'error');
          } finally {
            setUploadingPhoto(false);
          }
        }} 
      />
    </div>
  );
};
