import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
import { firebaseSyncService } from '../services/firebaseSyncService';
import type { DogGender, DogSize, DogProfile } from '../types';
import { handleDogImageError, resolveGenericMediaUrl } from '../utils/dogPhotoHelper';
import { compressImage } from '../utils/imageCompressor';
import { applyPhotoChangeTracking, canChangePhoto } from '../utils/photoChangePolicy';
import { BackButton } from '../components/ui/back-button';
import { VillageDogTransition } from '../components/ui/VillageDogTransition';
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
import './PetDetails.css';

interface PetDetailsProps {
  onBackToLocation?: () => void;
  onBackToOwner?: () => void;
  onSuccess?: () => void;
}

/** Displays saved pet details or the pet registration form, including photo upload and removal actions. */
export const PetDetails: React.FC<PetDetailsProps> = ({
  onBackToLocation,
  onBackToOwner,
  onSuccess,
}) => {
  const { user, refreshProgress, setActiveOnboardingTab } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isTransitioningBack, setIsTransitioningBack] = useState(false);
  const [isTransitioningForward, setIsTransitioningForward] = useState(false);

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
  const [gender, setGender] = useState<DogGender | ''>(existingPet?.gender || '');
  const [age, setAge] = useState(existingPet?.age || '');
  const [size, setSize] = useState<DogSize | ''>(existingPet?.size || '');
  const [color, setColor] = useState(existingPet?.color || '');
  const [distinguishingMarks, setDistinguishingMarks] = useState(
    existingPet?.distinguishingMarks || ''
  );

  const isPetFilled = Boolean(existingPet?.id && (existingPet?.name || existingPet?.breed));
  const [isEditing, setIsEditing] = useState<boolean>(!isPetFilled);
  const initialPetModeSetRef = useRef(false);

  // Collar, Tag, or Microchip: Yes/No + companion detail
  const [collarChoice, setCollarChoice] = useState<'Yes' | 'No' | ''>(() => {
    if (!existingPet?.collarInfo) return '';
    const lower = existingPet.collarInfo.toLowerCase().trim();
    if (lower === 'no' || lower === 'none' || lower === 'no collar') return 'No';
    return 'Yes';
  });
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
      setGender(existingPet.gender || '');
      setAge(existingPet.age || '');
      setSize(existingPet.size || '');
      setColor(existingPet.color || '');
      setDistinguishingMarks(existingPet.distinguishingMarks || '');
      setPrimaryPhoto(existingPet.primaryPhoto || '');
      setAdditionalPhotos(existingPet.photos || []);
      if (existingPet.collarInfo) {
        const lower = existingPet.collarInfo.toLowerCase().trim();
        const isNo = lower === 'no' || lower === 'none' || lower === 'no collar';
        setCollarChoice(isNo ? 'No' : 'Yes');
        setHasCollarOrChip(!isNo);
        setCollarDetails(lower === 'yes' ? '' : existingPet.collarInfo);
      } else {
        setCollarChoice('');
        setHasCollarOrChip(false);
        setCollarDetails('');
      }

      if (!initialPetModeSetRef.current && (existingPet.name || existingPet.breed)) {
        initialPetModeSetRef.current = true;
        setIsEditing(false);
      }
    }
  }, [existingPet?.id, existingPet?.name, existingPet?.breed, existingPet?.primaryPhoto]);

  // Strict validation and compression for pet photos from camera or gallery
  const processAndValidateImage = async (
    input: File | Blob | string
  ): Promise<{ valid: boolean; error?: string; compressed?: string }> => {
    if (!input) {
      return { valid: false, error: 'Photo cannot be uploaded: No image provided. Please select or capture a photo.' };
    }

    if (input instanceof File || input instanceof Blob) {
      const type = (input.type || '').toLowerCase();
      if (!type.startsWith('image/')) {
        return { valid: false, error: 'Photo cannot be uploaded: Unsupported file format. Please upload a clear JPG, PNG, or WebP photo of your pet.' };
      }
      if (input.size <= 0) {
        return { valid: false, error: 'Photo cannot be uploaded: Selected photo is empty (0 bytes). Please choose or capture a valid photo.' };
      }
      if (input.size > 5 * 1024 * 1024) {
        return { valid: false, error: 'Photo cannot be uploaded due to size problem: File exceeds 5MB limit. Please choose a smaller photo.' };
      }
    } else if (typeof input === 'string') {
      if (!input.startsWith('data:image/') && !input.startsWith('http://') && !input.startsWith('https://')) {
        return { valid: false, error: 'Photo cannot be uploaded: Invalid photo data format. Please upload or capture a new photo.' };
      }
      if (input.startsWith('data:image/')) {
        const approxBytes = Math.round((input.length - input.indexOf(',') - 1) * 0.75);
        if (approxBytes > 5 * 1024 * 1024) {
          return { valid: false, error: 'Photo cannot be uploaded due to size problem: File exceeds 5MB limit. Please choose a smaller photo.' };
        }
      }
    }

    // Integrity and decoding test (catches corrupt bytes, invalid headers)
    try {
      let testSrc = '';
      let revokeUrl = false;
      if (typeof input === 'string') {
        testSrc = input;
      } else {
        testSrc = URL.createObjectURL(input);
        revokeUrl = true;
      }

      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const testImg = new Image();
        testImg.onload = () => resolve({ width: testImg.naturalWidth, height: testImg.naturalHeight });
        testImg.onerror = () => reject(new Error('IMAGE_DECODE_FAILED'));
        testImg.src = testSrc;
      });

      if (revokeUrl) {
        URL.revokeObjectURL(testSrc);
      }

      if (dimensions.width < 50 || dimensions.height < 50) {
        return { valid: false, error: 'Photo cannot be uploaded: Resolution is too low. Please upload a clear photo of your pet.' };
      }
    } catch {
      return { valid: false, error: 'Photo cannot be uploaded: File is corrupted or unreadable. Please choose or capture a new clear photo.' };
    }

    // Compress image
    try {
      let fileToCompress: File | string;
      if (typeof input === 'string') {
        fileToCompress = input;
      } else if (input instanceof File) {
        fileToCompress = input;
      } else {
        fileToCompress = new File([input], 'pet_photo.jpg', { type: input.type || 'image/jpeg' });
      }

      const compressed = await compressImage(fileToCompress, 800, 800, 0.82);
      if (!compressed) {
        return { valid: false, error: 'Photo cannot be uploaded: Could not process image. Please try another photo.' };
      }
      return { valid: true, compressed };
    } catch {
      return { valid: false, error: 'Photo cannot be uploaded: Failed to process image. Please try another photo.' };
    }
  };

  // Handle Photo File Upload with compression & storage persistence
  /** Validates and compresses the chosen pet photo, uploading directly to Cloudinary. */
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const policy = canChangePhoto(existingPet);
    if (!policy.allowed) {
      showToast('Pet photo can be changed twice per month. Please contact admin approval for another update.', 'warning');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Fast-path checks before doing heavy async work
    if (!file.type.startsWith('image/')) {
      showToast('Photo cannot be uploaded: Unsupported file format. Please upload a JPG, PNG, or WebP photo.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size <= 0) {
      showToast('Photo cannot be uploaded: File is empty (0 bytes).', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Photo cannot be uploaded due to size problem: File exceeds 5MB limit. Please choose a smaller photo.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadingPhoto(true);
    showToast('🐾 Uploading pet photo to Cloudinary... Please wait.', 'info');
    try {
      const result = await processAndValidateImage(file);
      if (!result.valid || !result.compressed) {
        showToast(result.error || 'Photo cannot be uploaded. Please choose a clear JPG or PNG photo.', 'error');
        setUploadingPhoto(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (!user) throw new Error('AUTH_REQUIRED');

      // Set instantaneous preview
      setPrimaryPhoto(result.compressed);

      // Upload directly to Cloudinary and await result
      const uploadedUrl = await storageBucketService.uploadPetPhoto(user.id, petId, result.compressed, 0);
      if (uploadedUrl) {
        setPrimaryPhoto(uploadedUrl);
        showToast('🐾 Pet photo saved to Cloudinary!', 'success');
      } else {
        showToast('Photo saved locally and queued for Cloudinary sync.', 'info');
      }
    } catch (err: any) {
      console.error('[PetDetails] Photo error:', err);
      showToast(err?.message || 'Could not process photo. Please choose or capture a new clear image.', 'error');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  /** Deletes the pet's profile picture from Cloudinary and clears it from Firestore and local storage. */
  const handleRemovePetPhoto = async () => {
    if (!primaryPhoto && !existingPet?.primaryPhoto) return;
    const photoToDelete = primaryPhoto || existingPet?.primaryPhoto || '';

    // 1. Optimistically clear local state immediately so UI updates without lag
    setPrimaryPhoto('');
    setAdditionalPhotos([]);
    if (existingPet) {
      existingPet.primaryPhoto = '';
      existingPet.photos = [];
      const updatedPet: DogProfile = {
        ...existingPet,
        primaryPhoto: '',
        photos: [],
        updatedAt: new Date().toISOString(),
      };
      storageService.savePetProfile(updatedPet);
    }

    refreshProgress();
    window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
    window.dispatchEvent(new CustomEvent('findlostpuppy_data_synced'));
    window.dispatchEvent(new Event('storage'));

    try {
      showToast('🐾 Deleting pet photo from Cloudinary & Firestore... Please wait.', 'info');

      // 2. Delete from Cloudinary
      if (photoToDelete) {
        await storageBucketService.deleteMedia(photoToDelete).catch((err) => {
          console.warn('[PetDetails] Cloudinary delete notice:', err);
        });
      }

      // 3. Delete from Firestore & update pet records
      if (user?.id) {
        await firebaseSyncService.deletePetPhoto(user.id, petId, photoToDelete).catch((err) => {
          console.warn('[PetDetails] Firestore delete notice:', err);
        });
      }

      showToast('🐾 Pet photo deleted from Cloudinary & Firestore!', 'success');
    } catch (err) {
      console.error('[PetDetails] Delete pet photo error:', err);
      showToast('Failed to delete pet photo. Please try again.', 'error');
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

    // 2. Clear all pet details
    setPrimaryPhoto('');
    setAdditionalPhotos([]);
    setDogName('');
    setBreed('');
    setGender('');
    setAge('');
    setSize('');
    setColor('');
    setDistinguishingMarks('');
    setCollarChoice('');
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

    showToast('Pet details reset', 'info');
  };


  // Resolve best available pet photo URL
  const displayPhotoUrl = useMemo(() => {
    if (primaryPhoto) {
      return resolveGenericMediaUrl(primaryPhoto);
    }
    // If primaryPhoto is empty string, user deleted the photo
    if (primaryPhoto === '') {
      return '';
    }
    if (existingPet?.primaryPhoto) {
      return resolveGenericMediaUrl(existingPet.primaryPhoto);
    }
    return '';
  }, [primaryPhoto, existingPet?.primaryPhoto]);

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

    if (!dogName.trim()) {
      showToast('Please provide a name for your pet.', 'error');
      setSubmitting(false);
      return;
    }

    // Convert any remaining base64 images to Cloudinary URLs if not yet uploaded
    let finalPrimary = primaryPhoto;
    const finalAdditionals = [...additionalPhotos];

    if (finalPrimary && finalPrimary.startsWith('data:')) {
      try {
        const uploaded = await storageBucketService.uploadPetPhoto(ownerId, petId, finalPrimary, 0);
        finalPrimary = uploaded || '';
      } catch (err) {
        console.warn('[PetDetails] Primary photo upload notice:', err);
        finalPrimary = '';
      }
    }

    for (let i = 0; i < finalAdditionals.length; i++) {
      if (finalAdditionals[i] && finalAdditionals[i].startsWith('data:')) {
        try {
          const uploaded = await storageBucketService.uploadPetPhoto(ownerId, petId, finalAdditionals[i], i + 1);
          finalAdditionals[i] = uploaded || '';
        } catch (err) {
          console.warn('[PetDetails] Gallery photo upload notice:', err);
          finalAdditionals[i] = '';
        }
      }
    }

    const finalCollar = collarChoice === 'Yes'
      ? (collarDetails.trim() || 'Collar / Tag / Microchip equipped')
      : collarChoice === 'No'
        ? 'No'
        : undefined;

    const profile: DogProfile = {
      ...(existingPet || {}),
      id: petId,
      ownerId,
      name: dogName.trim(),
      breed: breed.trim() || 'Street Dog / Desi / Indie',
      gender: (gender || 'Male') as DogGender,
      age: age.trim() || 'Young Adult (1-3 yrs)',
      size: (size || 'Medium (10-25kg)') as DogSize,
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
      if (photoChanged && existingPet?.primaryPhoto) {
        await storageBucketService.deleteMedia(existingPet.primaryPhoto).catch(() => false);
      }

      // Explicit direct sync to Firebase Firestore backend
      await firebaseSyncService.syncPet(profileToSave).catch((e) => console.warn('[Firebase Sync Pet Notice]:', e));
      const allReports = storageService.getAllReports();
      const associatedReport = allReports.find(
        (r) => r.dogId === petId || r.dog?.id === petId || r.ownerId === ownerId
      );
      if (associatedReport) {
        await firebaseSyncService.syncLostReport(associatedReport).catch((e) => console.warn('[Firebase Sync Report Notice]:', e));
      }

      refreshProgress();
      setSubmitting(false);

      showToast(`🐾 ${profileToSave.name}'s profile saved & synced to Firestore!`, 'success');
      setIsEditing(false);
      setIsTransitioningForward(true);
    } catch (saveErr) {
      console.error('[PetDetails] Save pet profile error:', saveErr);
      setSubmitting(false);
      showToast('Could not save pet profile. Please try again.', 'error');
    }
  };

  // Handle Cancel / Reset changes
  const handleCancel = () => {
    if (existingPet) {
      setDogName(existingPet.name || 'Buddy');
      setBreed(existingPet.breed || 'Golden Retriever');
      setGender(existingPet.gender || '');
      setAge(existingPet.age || '');
      setSize(existingPet.size || '');
      setColor(existingPet.color || 'Golden / Fawn');
      setDistinguishingMarks(existingPet.distinguishingMarks || 'White chest patch, one floppy ear');
      setPrimaryPhoto(existingPet.primaryPhoto || '');
      setAdditionalPhotos(existingPet.photos || []);
      if (existingPet.collarInfo) {
        const lower = existingPet.collarInfo.toLowerCase().trim();
        const isNo = lower === 'no' || lower === 'none' || lower === 'no collar';
        setCollarChoice(isNo ? 'No' : 'Yes');
        setHasCollarOrChip(!isNo);
        setCollarDetails(lower === 'yes' ? '' : existingPet.collarInfo);
      } else {
        setCollarChoice('');
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
    setGender('');
    setAge('');
    setSize('');
    setColor('');
    setDistinguishingMarks('');
    setCollarChoice('');
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
    if (isTransitioningBack || isTransitioningForward) return;
    setIsTransitioningBack(true);
  };

  const handleBackTransitionComplete = () => {
    setIsTransitioningBack(false);
    if (onBackToLocation) {
      onBackToLocation();
    } else if (onBackToOwner) {
      onBackToOwner();
    } else {
      setActiveOnboardingTab('choice');
      navigate('/choice');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };


  const handleForwardTransitionComplete = () => {
    setIsTransitioningForward(false);
    if (onSuccess) {
      onSuccess();
    } else {
      setActiveOnboardingTab('report');
      navigate('/alert');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
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
          <div className="onboarding-top-nav-row">
            <div className="onboarding-top-nav-left">
              <BackButton
                onClick={handleBack}
                title="Go back"
                aria-label="Back"
              />
            </div>
            <div className="section-card-title-block onboarding-top-nav-title">
              <h1>Pet Details</h1>
            </div>
            <button
              type="button"
              className="onboarding-exit-btn onboarding-top-nav-close"
              onClick={handleExitToDashboard}
              aria-label="Exit pet details and go to dashboard"
              title="Exit to dashboard"
            >
              <X size={19} />
            </button>
          </div>

          <div className="pet-details-top-action-row">
            <button
              type="button"
              onClick={handleExitToDashboard}
              className="pet-skip-direct-btn pet-skip-top-btn"
              title="Skip pet details and go to dashboard"
            >
              <span>Skip to Dashboard</span>
            </button>

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
                      {gender && (
                        <span className={`pet-view-gender-badge gender-${gender.toLowerCase()}`}>
                          {gender === 'Male' ? '♂ Male' : '♀ Female'}
                        </span>
                      )}
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
                        {collarChoice === 'Yes' || hasCollarOrChip
                          ? (collarDetails && collarDetails.toLowerCase().trim() !== 'yes'
                            ? `Yes (${collarDetails})`
                            : 'Yes (Equipped with collar / ID tag)')
                          : (collarChoice === 'No' ? 'No collar or microchip' : 'Not specified')}
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
                    if (isTransitioningBack || isTransitioningForward) return;
                    setIsTransitioningForward(true);
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
                  <div className="pet-photo-circle-inner" style={{ position: 'relative' }}>
                    {displayPhotoUrl ? (
                      <img
                        src={displayPhotoUrl}
                        alt={dogName || 'Pet Photo'}
                        className="pet-photo-main-img"
                        onError={handleDogImageError}
                        style={{ filter: uploadingPhoto ? 'brightness(0.6)' : undefined }}
                      />
                    ) : (
                      <div className="pet-photo-main-placeholder">
                        <Dog size={56} />
                      </div>
                    )}
                    {uploadingPhoto && (
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
                        if (photoPolicy.allowed && !uploadingPhoto) fileInputRef.current?.click();
                      }}
                      disabled={!photoPolicy.allowed || uploadingPhoto}
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
                        if (photoPolicy.allowed && !uploadingPhoto) setIsCameraOpen(true);
                      }}
                      disabled={!photoPolicy.allowed || uploadingPhoto}
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

                {/* Remove / Delete Photo Actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                  {displayPhotoUrl && (
                    <button
                      type="button"
                      className="pet-photo-remove-btn"
                      onClick={handleRemovePetPhoto}
                      disabled={uploadingPhoto || submitting}
                      title="Delete pet photo from Cloudinary and Firestore"
                      style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      <Trash2 size={13} />
                      <span>Delete Photo</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="pet-photo-remove-btn"
                    onClick={handleHardReset}
                    disabled={uploadingPhoto || submitting}
                    title="Reset all pet form fields"
                    style={{ opacity: 0.75 }}
                  >
                    <X size={13} />
                    <span>Reset Fields</span>
                  </button>
                </div>

                {uploadingPhoto && (
                  <span className="pet-photo-upload-status" style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <Loader2 size={13} className="animate-spin" /> Uploading to Cloudinary... Please wait
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
                        {gender || 'Select Gender'}
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
                        {size ? (size.includes('Large') && !size.includes('Extra') ? 'Large (> 25 kg)' : size) : 'Select size'}
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
                      <span className={`pet-info-value ${!collarChoice ? 'placeholder' : ''}`}>
                        {collarChoice
                          ? (collarChoice === 'Yes'
                              ? (collarDetails && collarDetails.toLowerCase().trim() !== 'yes' ? `Yes (${collarDetails})` : 'Yes')
                              : 'No')
                          : 'Select Collar, Tag or Microchip'}
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
                    disabled={submitting || uploadingPhoto}
                    className="pet-save-btn"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Syncing to Firestore...</span>
                      </>
                    ) : uploadingPhoto ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Uploading to Cloudinary...</span>
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        <span>Save Pet Details</span>
                      </>
                    )}
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
        searchable={true}
        searchPlaceholder="Search gender..."
      />

      {/* 4. Size Category Selector Popup (Smallest to Largest) */}
      <PetProfileSelector
        isOpen={activeModal === 'size'}
        onClose={() => setActiveModal(null)}
        title="Select Size Category"
        options={sizeOptions}
        selectedValue={size}
        onSelect={(val) => setSize(val as DogSize)}
        searchable={true}
        searchPlaceholder="Search size..."
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
        selectedValue={collarChoice}
        onSelect={(val) => {
          setCollarChoice(val as 'Yes' | 'No');
          if (val === 'Yes') {
            setHasCollarOrChip(true);
          } else {
            setHasCollarOrChip(false);
            setCollarDetails('');
          }
        }}
        searchable={true}
        searchPlaceholder="Search collar status..."
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
          const policy = canChangePhoto(existingPet);
          if (!policy.allowed) {
            showToast('Pet photo can be changed twice per month. Please contact admin approval for another update.', 'warning');
            return;
          }

          setUploadingPhoto(true);
          showToast('🐾 Uploading captured photo to Cloudinary... Please wait.', 'info');
          try {
            const result = await processAndValidateImage(photoData);
            if (!result.valid || !result.compressed) {
              showToast(result.error || 'Captured photo could not be verified. Please capture again.', 'error');
              setUploadingPhoto(false);
              return;
            }

            if (!user) throw new Error('AUTH_REQUIRED');

            // Set instantaneous preview
            setPrimaryPhoto(result.compressed);

            // Upload directly to Cloudinary and await
            const uploadedUrl = await storageBucketService.uploadPetPhoto(user.id, petId, result.compressed, 0);
            if (uploadedUrl) {
              setPrimaryPhoto(uploadedUrl);
              showToast('🐾 Pet photo captured and saved to Cloudinary!', 'success');
            } else {
              showToast('Photo saved locally and queued for Cloudinary sync.', 'info');
            }
          } catch (e: any) {
            console.error('Failed to process camera photo', e);
            showToast(e?.message || 'Could not process camera photo. Please try capturing again.', 'error');
          } finally {
            setUploadingPhoto(false);
          }
        }} 
      />

      {isTransitioningBack && (
        <VillageDogTransition
          direction="backward"
          fromStep="Pet Details"
          toStep={onBackToLocation ? "Location" : onBackToOwner ? "Owner Profile" : "Pet Choice"}
          durationMs={1100}
          onComplete={handleBackTransitionComplete}
        />
      )}

      {isTransitioningForward && (
        <VillageDogTransition
          direction="forward"
          fromStep="Pet Details"
          toStep="Pet Safety"
          durationMs={1600}
          onComplete={handleForwardTransitionComplete}
        />
      )}
    </div>
  );
};
