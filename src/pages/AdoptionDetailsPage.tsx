import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Camera,
  Upload,
  X,
  MapPin,
  Heart,
  Landmark,
  Building2,
  Home,
  Navigation,
  Check,
  AlertCircle,
  Phone,
  User as UserIcon,
  Mail,
  ShieldCheck,
  Dog,
  Bone,
  Calendar,
  VenusAndMars,
  Ruler,
  FileText,
  Trash2,
  ChevronDown,
  Shield,
  Edit3,
  Stethoscope,
  Sparkles,
  Eye,
  RefreshCw,
  RotateCcw,
  Maximize2,
  ArrowRight,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { storageBucketService, isUploadablePhoto, isCloudinaryUrl } from '../services/storageBucketService';
import { locationService } from '../services/locationService';
import { extractAdoptionDataFromFlyer } from '../services/flyerExtractionService';
import { compressImage } from '../utils/imageCompressor';
import { DOG_AGE_OPTIONS, DOG_SIZE_OPTIONS } from '../data/dogBreeds';
import { getAllBreedItems } from '../utils/breedAssetHelper';
import { BackButton } from '../components/ui/back-button';
import { PetProfileSelector, type SelectorOption } from '../components/PetProfileSelector';
import { AdoptionShareModal } from '../components/AdoptionShareModal';
import { PermissionRationaleModal } from '../components/PermissionRationaleModal';
import { useLocationDetection, type LocationDetectionResult } from '../hooks/useLocationDetection';
import { adoptionApiService } from '../services/adoptionApiService';
import type { DogGender, DogSize, AdoptionPet, LocationLocality, ExtractedPetItem } from '../types';
import './PetDetails.css';

export const AdoptionDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Check if editing an existing adoption pet (only when explicitly provided via navigation state)
  const stateAdoptionPetId = (location.state as any)?.adoptionPetId;
  const existingAdoptionPet = useMemo(() => {
    if (stateAdoptionPetId) {
      return storageService.getAdoptionPetById(stateAdoptionPetId);
    }
    return undefined;
  }, [stateAdoptionPetId]);

  const isEditingExisting = Boolean(existingAdoptionPet?.id);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(user ? '/choice' : '/homepage');
    }
  };

  // Form State: Pet Details (Prefilled from existing adoption pet if present)
  const [petName, setPetName] = useState(existingAdoptionPet?.petName || '');
  const [breed, setBreed] = useState(existingAdoptionPet?.breed || 'Indie / Desi Dog');
  const [gender, setGender] = useState<DogGender>(existingAdoptionPet?.gender || 'Male');
  const [age, setAge] = useState(existingAdoptionPet?.age || 'Puppy (under 1 yr)');
  const [size, setSize] = useState<DogSize>(existingAdoptionPet?.size || 'Medium (10-25kg)');
  const [description, setDescription] = useState(existingAdoptionPet?.description || '');
  const [healthNotes, setHealthNotes] = useState(existingAdoptionPet?.healthNotes || '');
  const [vaccinated, setVaccinated] = useState(existingAdoptionPet?.vaccinated ?? true);
  const [dewormed, setDewormed] = useState(existingAdoptionPet?.dewormed ?? true);
  const [spayedOrNeutered, setSpayedOrNeutered] = useState(existingAdoptionPet?.spayedOrNeutered ?? false);

  // Form State: Photo
  const [photo, setPhoto] = useState<string>(existingAdoptionPet?.photo || '');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Entry Mode: 'flyer' (Upload Poster & AI Auto-Fill) | 'manual' (Manual Dog Photo & Form Fill) | null (unselected at starting stage)
  const [entryMode, setEntryMode] = useState<'flyer' | 'manual' | null>(null);

  // Form State: Adoption Poster / Flyer
  const [flyerPhoto, setFlyerPhoto] = useState<string>(existingAdoptionPet?.flyerPhoto || '');
  const [isScanningFlyer, setIsScanningFlyer] = useState(false);
  const [scanProgressText, setScanProgressText] = useState('');
  const [extractedFieldsCount, setExtractedFieldsCount] = useState<number>(0);
  const [isFlyerLightboxOpen, setIsFlyerLightboxOpen] = useState(false);
  const flyerFileInputRef = useRef<HTMLInputElement>(null);

  // Step Progression State: 1: Pet Details | 2: Caretaker Contact | 3: Pet Location
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const handleProceedToStep2 = () => {
    if (!petName.trim()) {
      setErrorMsg('Please enter the pet name.');
      showToast('Please enter the pet name', 'error');
      return;
    }
    if (!breed.trim()) {
      setErrorMsg('Please select a dog breed.');
      showToast('Please select a dog breed', 'error');
      return;
    }
    if (!age.trim()) {
      setErrorMsg('Please select pet age / life stage.');
      showToast('Please select age', 'error');
      return;
    }
    if (!gender) {
      setErrorMsg('Please select gender.');
      showToast('Please select gender', 'error');
      return;
    }
    if (!size) {
      setErrorMsg('Please select approximate size.');
      showToast('Please select size', 'error');
      return;
    }
    setErrorMsg(null);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToStep3 = () => {
    if (!contactName.trim()) {
      setErrorMsg('Please enter caretaker name.');
      showToast('Please enter caretaker name', 'error');
      openTextModal('contactName');
      return;
    }
    const cleanPhone = contactPhone.replace(/\D/g, '');
    if (!contactPhone.trim() || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit caretaker phone number.');
      showToast('Please enter a valid 10-digit phone number', 'error');
      openTextModal('contactPhone');
      return;
    }
    if (!contactEmail.trim()) {
      setErrorMsg('Please enter caretaker email address.');
      showToast('Please enter caretaker email address', 'error');
      openTextModal('contactEmail');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail.trim())) {
      setErrorMsg('Please enter a valid email address (e.g. caretaker@example.com).');
      showToast('Please enter a valid email address', 'error');
      openTextModal('contactEmail');
      return;
    }
    setErrorMsg(null);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Form State: Caretaker Contact Info (explicitly entered by user or loaded from existing listing)
  const [contactName, setContactName] = useState(
    existingAdoptionPet?.contactName || ''
  );
  const [contactPhone, setContactPhone] = useState(
    existingAdoptionPet?.contactPhone || ''
  );
  const [contactEmail, setContactEmail] = useState(
    existingAdoptionPet?.contactEmail || ''
  );

  // Form State: Location (initially empty; auto-detects and fills automatically, or prefilled if editing)
  const [state, setState] = useState(existingAdoptionPet?.state || '');
  const [district, setDistrict] = useState(existingAdoptionPet?.district || '');
  const [mandalOrMunicipality, setMandalOrMunicipality] = useState(existingAdoptionPet?.mandal || '');
  const [city, setCity] = useState(existingAdoptionPet?.village || existingAdoptionPet?.city || '');
  const [pinCode, setPinCode] = useState(existingAdoptionPet?.pinCode || '');
  const [latitude, setLatitude] = useState<number | undefined>(existingAdoptionPet?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(existingAdoptionPet?.longitude);

  // Interactive Selector Modals: 'breed' | 'age' | 'gender' | 'size' | 'medical' | null
  const [activeModal, setActiveModal] = useState<'breed' | 'age' | 'gender' | 'size' | 'medical' | null>(null);

  // Interactive Text Modals for Pet Details & Caretaker: 'name' | 'description' | 'healthNotes' | 'contactName' | 'contactPhone' | 'contactEmail' | 'pinCode' | null
  const [activeTextModal, setActiveTextModal] = useState<
    'name' | 'description' | 'healthNotes' | 'contactName' | 'contactPhone' | 'contactEmail' | 'pinCode' | null
  >(null);
  const [textModalValue, setTextModalValue] = useState('');

  // Location Selector Modals: 'state' | 'district' | 'mandal' | 'city' | null
  const [activeLocationModal, setActiveLocationModal] = useState<'state' | 'district' | 'mandal' | 'city' | null>(null);
  // Multi-Pet State
  const [extractedPets, setExtractedPets] = useState<ExtractedPetItem[]>([]);
  const [selectedPetIndex, setSelectedPetIndex] = useState<number>(0);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [newPetNameInput, setNewPetNameInput] = useState('');

  // Field Edit & AI Badging State
  const [userEditedFields, setUserEditedFields] = useState<Set<string>>(new Set());
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());
  const [fieldConfidences, setFieldConfidences] = useState<Record<string, number>>({});

  // Location Hint & Permission Rationale State
  const [locationHint, setLocationHint] = useState<string>('');
  const [locationPermissionDenied, setLocationPermissionDenied] = useState<boolean>(false);
  const [showRescanConfirmModal, setShowRescanConfirmModal] = useState(false);
  const submissionIdRef = useRef<string>('');

  const [localities, setLocalities] = useState<LocationLocality[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Adoption Share Card Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [createdOrUpdatedPet, setCreatedOrUpdatedPet] = useState<AdoptionPet | null>(null);

  // Reset Form: Clears all form fields, photos, location, and resets entry mode to unselected
  const handleResetForm = () => {
    setEntryMode(null);
    setCurrentStep(1);
    setPetName('');
    setBreed('Indie / Desi Dog');
    setGender('Male');
    setAge('Puppy (under 1 yr)');
    setSize('Medium (10-25kg)');
    setDescription('');
    setHealthNotes('');
    setVaccinated(true);
    setDewormed(true);
    setSpayedOrNeutered(false);
    setPhoto('');
    setFlyerPhoto('');
    setIsScanningFlyer(false);
    setScanProgressText('');
    setExtractedFieldsCount(0);
    setExtractedPets([]);
    setSelectedPetIndex(0);
    setShowAddPetModal(false);
    setNewPetNameInput('');
    setUserEditedFields(new Set());
    setAiFilledFields(new Set());
    setFieldConfidences({});
    setLocationHint('');
    setLocationPermissionDenied(false);
    setShowRescanConfirmModal(false);
    submissionIdRef.current = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (flyerFileInputRef.current) flyerFileInputRef.current.value = '';
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setState('');
    setDistrict('');
    setMandalOrMunicipality('');
    setCity('');
    setPinCode('');
    setLatitude(undefined);
    setLongitude(undefined);
    setLocalities([]);
    setErrorMsg(null);
    showToast('🔄 All adoption details and selections have been reset.', 'info');
  };

  // Load localities dynamically when district and mandal change
  useEffect(() => {
    let active = true;
    if (state && district && mandalOrMunicipality) {
      const distObj = locationService.getDistrict(state, district);
      if (distObj) {
        const subObj = locationService.getSubDistrict(distObj.districtCode, mandalOrMunicipality);
        if (subObj) {
          locationService
            .getLocalities(distObj.districtCode, subObj.subDistrictCode)
            .then((list) => {
              if (active) setLocalities(list);
            })
            .catch(() => {
              if (active) setLocalities([]);
            });
          return () => {
            active = false;
          };
        }
      }
    }
    return () => {
      active = false;
    };
  }, [state, district, mandalOrMunicipality]);

  // Options for Breed Selector (with images/avatars)
  const breedOptions: SelectorOption[] = useMemo(() => {
    return getAllBreedItems().map((b) => ({
      id: b.name,
      label: b.name,
      avatarUrl: b.avatarUrl,
      letter: b.letter,
    }));
  }, []);

  // Options for Age Selector
  const ageOptions: SelectorOption[] = useMemo(() => {
    return DOG_AGE_OPTIONS.map((opt) => ({
      id: opt,
      label: opt,
      icon: <Calendar size={18} />,
    }));
  }, []);

  // Options for Gender Selector
  const genderOptions: SelectorOption[] = useMemo(() => [
    { id: 'Male', label: 'Male', icon: <span style={{ fontSize: '18px', fontWeight: 'bold' }}>♂</span> },
    { id: 'Female', label: 'Female', icon: <span style={{ fontSize: '18px', fontWeight: 'bold' }}>♀</span> },
  ], []);

  // Options for Size Selector
  const sizeOptions: SelectorOption[] = useMemo(() => {
    return DOG_SIZE_OPTIONS.map((opt) => ({
      id: opt.value,
      label: opt.value,
      secondaryLabel: opt.label.replace(/^.* - /, ''),
      icon: <Ruler size={18} />,
    }));
  }, []);

  // Options for Location Selectors
  const stateOptions = useMemo(() => {
    return locationService.getStates().map((s) => ({
      id: s.name,
      value: s.name,
      label: s.name,
      secondaryLabel: `${locationService.getDistricts(s.code).length} Districts`,
    }));
  }, []);

  const districtOptions = useMemo(() => {
    if (!state) return [];
    return locationService.getDistricts(state).map((d) => ({
      id: d.districtName,
      value: d.districtName,
      label: d.districtName,
      secondaryLabel: `${locationService.getSubDistricts(d.districtCode).length} Mandals/Taluks`,
    }));
  }, [state]);

  const mandalOptions = useMemo(() => {
    if (!district || !state) return [];
    return locationService.getSubDistricts(district, state).map((m) => ({
      id: m.subDistrictName,
      value: m.subDistrictName,
      label: m.subDistrictName,
    }));
  }, [district, state]);

  const villageOptions = useMemo(() => {
    if (!localities || localities.length === 0) {
      return city ? [{ id: city, value: city, label: city }] : [];
    }
    return localities.map((l) => ({
      id: l.localityName,
      value: l.localityName,
      label: l.localityName,
      secondaryLabel: l.localityType ? l.localityType.replace('_', ' ') : undefined,
    }));
  }, [localities, city]);

  // Open Text Modal (acts identically to PetDetails.tsx)
  const openTextModal = (
    field: 'name' | 'description' | 'healthNotes' | 'contactName' | 'contactPhone' | 'contactEmail' | 'pinCode'
  ) => {
    setActiveTextModal(field);
    if (field === 'name') setTextModalValue(petName);
    else if (field === 'description') setTextModalValue(description);
    else if (field === 'healthNotes') setTextModalValue(healthNotes);
    else if (field === 'contactName') setTextModalValue(contactName);
    else if (field === 'contactPhone') setTextModalValue(contactPhone);
    else if (field === 'contactEmail') setTextModalValue(contactEmail);
    else if (field === 'pinCode') setTextModalValue(pinCode);
  };

  // Track fields edited manually by user to protect against overwriting
  const markFieldEdited = (field: string) => {
    setUserEditedFields((prev) => {
      const next = new Set(prev);
      next.add(field);
      return next;
    });
  };

  const handleTextModalUpdate = () => {
    if (activeTextModal === 'name') {
      setPetName(textModalValue.trim());
      markFieldEdited('petName');
    } else if (activeTextModal === 'description') {
      setDescription(textModalValue.trim());
      markFieldEdited('description');
    } else if (activeTextModal === 'healthNotes') {
      setHealthNotes(textModalValue.trim());
      markFieldEdited('healthNotes');
    } else if (activeTextModal === 'contactName') {
      setContactName(textModalValue.trim());
      markFieldEdited('contactName');
    } else if (activeTextModal === 'contactPhone') {
      setContactPhone(textModalValue.trim());
      markFieldEdited('contactPhone');
    } else if (activeTextModal === 'contactEmail') {
      setContactEmail(textModalValue.trim());
      markFieldEdited('contactEmail');
    } else if (activeTextModal === 'pinCode') {
      setPinCode(textModalValue.trim());
      markFieldEdited('pinCode');
    }
    setActiveTextModal(null);
  };

  // Synchronize current working form values to the active index in extractedPets
  const syncCurrentPetToExtractedList = (idx: number) => {
    setExtractedPets((prev) => {
      if (!prev || prev.length <= idx) return prev;
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        petName,
        breed,
        gender,
        age,
        size,
        description,
        healthNotes,
        vaccinated,
        dewormed,
        spayedOrNeutered,
        photo: photo || flyerPhoto,
      };
      return updated;
    });
  };

  // Load a pet from extractedPets into active form fields
  const loadPetAtIndex = (targetIndex: number) => {
    if (!extractedPets[targetIndex]) return;
    const target = extractedPets[targetIndex];
    setPetName(target.petName || target.name || '');
    if (target.breed) setBreed(target.breed);
    if (target.gender) setGender(target.gender as DogGender);
    if (target.age || target.age_text) setAge(target.age || target.age_text || '');
    if (target.size) setSize(target.size as DogSize);
    setDescription(target.description || target.about || '');
    setHealthNotes(target.healthNotes || target.health_notes || '');
    if (typeof target.vaccinated === 'boolean') setVaccinated(target.vaccinated);
    if (typeof target.dewormed === 'boolean') setDewormed(target.dewormed);
    if (typeof target.spayedOrNeutered === 'boolean') setSpayedOrNeutered(target.spayedOrNeutered);
    if (target.photo) setPhoto(target.photo);
    setSelectedPetIndex(targetIndex);
  };

  // Add another pet name from poster or user
  const handleAddNewPetName = () => {
    const trimmed = newPetNameInput.trim();
    if (!trimmed) {
      showToast('Please enter a pet name', 'error');
      return;
    }

    const currentPetItem: ExtractedPetItem = {
      petName: petName || 'Pet 1',
      breed: breed || 'Indie / Desi Dog',
      gender,
      age,
      size,
      description,
      healthNotes,
      vaccinated,
      dewormed,
      spayedOrNeutered,
      photo: photo || flyerPhoto,
    };

    const newPetItem: ExtractedPetItem = {
      petName: trimmed,
      breed: breed || 'Indie / Desi Dog',
      gender: 'Male',
      age: age || '< 1 year (Puppy / Months)',
      size: size || 'Medium (10-25kg)',
      description: '',
      healthNotes: '',
      vaccinated: true,
      dewormed: true,
      spayedOrNeutered: false,
      photo: flyerPhoto || photo,
    };

    setExtractedPets((prev) => {
      const base = prev && prev.length > 0 ? [...prev] : [currentPetItem];
      base[selectedPetIndex] = currentPetItem;
      const next = [...base, newPetItem];
      const newIndex = next.length - 1;
      setTimeout(() => {
        setPetName(trimmed);
        setDescription('');
        setHealthNotes('');
        setSelectedPetIndex(newIndex);
      }, 0);
      return next;
    });

    setNewPetNameInput('');
    setShowAddPetModal(false);
    showToast(`🐾 Added "${trimmed}" to adoption listing`, 'success');
  };

  // Remove a pet from extracted multi-pet list
  const handleRemovePet = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation();
    if (extractedPets.length <= 1) return;
    const petToRemove = extractedPets[indexToRemove];
    const newPets = extractedPets.filter((_, i) => i !== indexToRemove);
    setExtractedPets(newPets);
    const nextIndex = selectedPetIndex >= newPets.length ? newPets.length - 1 : selectedPetIndex;
    setSelectedPetIndex(nextIndex);
    const target = newPets[nextIndex];
    if (target) {
      setPetName(target.petName || target.name || '');
      if (target.breed) setBreed(target.breed);
      if (target.gender) setGender(target.gender as DogGender);
      if (target.age || target.age_text) setAge(target.age || target.age_text || '');
      if (target.size) setSize(target.size as DogSize);
      setDescription(target.description || target.about || '');
      setHealthNotes(target.healthNotes || target.health_notes || '');
      if (typeof target.vaccinated === 'boolean') setVaccinated(target.vaccinated);
      if (typeof target.dewormed === 'boolean') setDewormed(target.dewormed);
      if (typeof target.spayedOrNeutered === 'boolean') setSpayedOrNeutered(target.spayedOrNeutered);
      if (target.photo) setPhoto(target.photo);
    }
    showToast(`Removed "${petToRemove.petName || `Dog ${indexToRemove + 1}`}"`, 'info');
  };

  // Helper for rendering AI-filled and low-confidence indicator badges
  const renderFieldAIBadge = (fieldName: string) => {
    const isAi = aiFilledFields.has(fieldName);
    const conf = fieldConfidences[fieldName];
    const isLowConf = conf !== undefined && conf < 0.75;

    if (!isAi && !isLowConf) return null;

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
        {isAi && <span className="ai-filled-badge">✨ AI-filled</span>}
        {isLowConf && <span className="low-confidence-warn">⚠️ Verify</span>}
      </span>
    );
  };

  // Handle Re-scan action with confirmation if manual edits exist
  const handleRescanClick = () => {
    if (userEditedFields.size > 0) {
      setShowRescanConfirmModal(true);
    } else {
      flyerFileInputRef.current?.click();
    }
  };

  // Handle Photo Upload
  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP).', 'error');
      return;
    }

    try {
      setIsCompressing(true);
      const compressed = await compressImage(file, 800, 800, 0.82);
      setPhoto(compressed);
      markFieldEdited('photo');
      showToast('🐾 Pet adoption photo added successfully!', 'success');
    } catch (err) {
      console.warn('Image compression error:', err);
      showToast('Could not process photo. Please try a different photo.', 'error');
    } finally {
      setIsCompressing(false);
      if (e.target) e.target.value = '';
    }
  };

  // Handle Flyer Upload & AI Information Extraction
  const handleFlyerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid flyer or poster image (JPG, PNG, WebP).', 'error');
      return;
    }

    try {
      setIsScanningFlyer(true);
      setScanProgressText('Compressing and optimizing poster...');
      const compressed = await compressImage(file, 1200, 1200, 0.85);
      setFlyerPhoto(compressed);

      setScanProgressText('Scanning flyer text & details with AI...');
      const extracted = await extractAdoptionDataFromFlyer(compressed);

      setScanProgressText('Auto-populating pet details...');
      let filled = 0;
      const newAiFilled = new Set<string>();
      const confidences: Record<string, number> = extracted.fieldConfidence || {};

      // If allPets has items, set multi-pet list
      const petsList: ExtractedPetItem[] =
        Array.isArray(extracted.allPets) && extracted.allPets.length > 0
          ? extracted.allPets
          : [
              {
                petName: extracted.petName || '',
                breed: extracted.breed,
                gender: extracted.gender,
                age: extracted.age,
                size: extracted.size,
                description: extracted.description,
                healthNotes: extracted.healthNotes,
                vaccinated: extracted.vaccinated,
                dewormed: extracted.dewormed,
                spayedOrNeutered: extracted.spayedOrNeutered,
              },
            ];

      setExtractedPets(petsList);
      setSelectedPetIndex(0);

      const firstPet = petsList[0];

      if (!userEditedFields.has('petName') && (firstPet.petName || firstPet.name)) {
        setPetName(firstPet.petName || firstPet.name || '');
        newAiFilled.add('petName');
        filled++;
      }
      if (!userEditedFields.has('breed') && firstPet.breed) {
        setBreed(firstPet.breed);
        newAiFilled.add('breed');
        filled++;
      }
      if (!userEditedFields.has('gender') && firstPet.gender) {
        setGender(firstPet.gender);
        newAiFilled.add('gender');
        filled++;
      }
      if (!userEditedFields.has('age') && (firstPet.age || firstPet.age_text)) {
        setAge(firstPet.age || firstPet.age_text || '');
        newAiFilled.add('age');
        filled++;
      }
      if (!userEditedFields.has('size') && firstPet.size) {
        setSize(firstPet.size as DogSize);
        newAiFilled.add('size');
        filled++;
      }
      if (!userEditedFields.has('description') && (firstPet.description || firstPet.about)) {
        setDescription(firstPet.description || firstPet.about || '');
        newAiFilled.add('description');
        filled++;
      }
      if (!userEditedFields.has('healthNotes') && (firstPet.healthNotes || firstPet.health_notes)) {
        setHealthNotes(firstPet.healthNotes || firstPet.health_notes || '');
        newAiFilled.add('healthNotes');
        filled++;
      }
      if (!userEditedFields.has('vaccinated') && typeof firstPet.vaccinated === 'boolean') {
        setVaccinated(firstPet.vaccinated);
        newAiFilled.add('vaccinated');
      }
      if (!userEditedFields.has('dewormed') && typeof firstPet.dewormed === 'boolean') {
        setDewormed(firstPet.dewormed);
        newAiFilled.add('dewormed');
      }
      if (!userEditedFields.has('spayedOrNeutered') && typeof firstPet.spayedOrNeutered === 'boolean') {
        setSpayedOrNeutered(firstPet.spayedOrNeutered);
        newAiFilled.add('spayedOrNeutered');
      }

      // Shared Caretaker Info
      if (!userEditedFields.has('contactName') && extracted.contactName) {
        setContactName(extracted.contactName);
        newAiFilled.add('contactName');
        filled++;
      }
      if (!userEditedFields.has('contactPhone') && extracted.contactPhone) {
        setContactPhone(extracted.contactPhone);
        newAiFilled.add('contactPhone');
        filled++;
      }
      if (!userEditedFields.has('contactEmail') && extracted.contactEmail) {
        setContactEmail(extracted.contactEmail);
        newAiFilled.add('contactEmail');
        filled++;
      }

      // Location Handling: If poster mentions city / location, save as locationHint
      // and leave State / District / Mandal / Village unselected for user to choose or tap GPS
      const posterLocHint = extracted.locationHint || extracted.city || '';
      if (posterLocHint) {
        setLocationHint(posterLocHint);
      }

      // If no photo was set, set photo to flyer
      if (!photo) {
        setPhoto(compressed);
      }

      setAiFilledFields(newAiFilled);
      setFieldConfidences(confidences);
      setExtractedFieldsCount(filled);
      submissionIdRef.current = `ADOPT_GRP_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      setCurrentStep(1);

      const petsCountMsg = petsList.length > 1 ? ` (${petsList.length} pets detected)` : '';
      showToast(
        `✨ Poster scanned! Auto-filled ${filled > 0 ? `${filled} details` : 'details'}${petsCountMsg} from poster.`,
        'success'
      );
    } catch (err) {
      console.warn('Flyer scan error:', err);
      showToast('Could not extract flyer text. You can still fill details manually.', 'error');
    } finally {
      setIsScanningFlyer(false);
      setScanProgressText('');
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveFlyer = () => {
    setFlyerPhoto('');
    setExtractedFieldsCount(0);
    showToast('Poster removed. Form details retained.', 'info');
  };

  // Auto-lookup postal pincode for village / mandal
  const resolvePinCodeForLocality = async (
    villageName: string,
    mandalName?: string,
    distName?: string
  ) => {
    if (!villageName) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(
        `https://api.postalpincode.in/postoffice/${encodeURIComponent(villageName.trim())}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0].PostOffice)) {
          const poList = data[0].PostOffice;
          const match =
            poList.find(
              (p: any) =>
                (distName && p.District?.toLowerCase() === distName.toLowerCase()) ||
                (mandalName && p.Block?.toLowerCase() === mandalName.toLowerCase())
            ) || poList[0];
          if (match?.Pincode) {
            setPinCode(match.Pincode);
          }
        }
      }
    } catch (err) {
      console.warn('Locality PIN lookup error:', err);
    }
  };

  // Location Detection using useLocationDetection hook (following Location.tsx component logic)
  const handleLocationDetected = useCallback(
    (result: LocationDetectionResult) => {
      const { geo, match, detectedState, detectedDistrict, detectedMandal, detectedCity, detectedPin } = result;

      setLatitude(geo.latitude);
      setLongitude(geo.longitude);

      const effectiveState = match?.state?.name || detectedState || state || 'Andhra Pradesh';
      const effectiveDistrict = match?.district?.districtName || detectedDistrict || district;
      const effectiveMandal = match?.subDistrict?.subDistrictName || detectedMandal || mandalOrMunicipality;
      const effectiveCity = match?.locality?.localityName || detectedCity || city;
      const effectivePin = detectedPin && /^\d{6}$/.test(detectedPin.trim()) ? detectedPin.trim() : pinCode;

      setState(effectiveState);
      if (effectiveDistrict) setDistrict(effectiveDistrict);
      if (effectiveMandal) setMandalOrMunicipality(effectiveMandal);
      if (effectiveCity) setCity(effectiveCity);
      if (effectivePin) setPinCode(effectivePin);
      setLocationPermissionDenied(false);

      showToast(`📍 Location detected: ${effectiveCity || effectiveMandal || effectiveDistrict || effectiveState}`, 'success');
    },
    [state, district, mandalOrMunicipality, city, pinCode, showToast]
  );

  const {
    detecting: isDetectingLocation,
    showPermissionRationaleModal,
    setShowPermissionRationaleModal,
    showPermissionBlockedModal,
    setShowPermissionBlockedModal,
    showTurnOnModal,
    setShowTurnOnModal,
    triggerDetectLocation,
    handlePermissionRationaleContinue,
    handleOpenLocationSettings,
  } = useLocationDetection({
    onSuccess: handleLocationDetected,
    onError: () => {
      setLocationPermissionDenied(true);
    },
  });

  // Submit Handler: Supports batch submissions for multi-pet posters & single pet submissions
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    const finalPetName = petName.trim();

    // Validation
    const finalPhoto = photo || flyerPhoto;
    if (!finalPhoto) {
      const msg =
        entryMode === 'flyer'
          ? 'Please upload an adoption poster or flyer image.'
          : 'Please upload a photo of the pet for adoption.';
      setErrorMsg(msg);
      showToast(msg, 'error');
      return;
    }
    if (!finalPetName) {
      setErrorMsg('Please provide a name for the pet (e.g. Bella, Bruno, or Indie Puppy).');
      showToast('Please provide a name for the pet.', 'error');
      return;
    }
    if (!state || !district) {
      setErrorMsg('Please select State and District where the pet is available.');
      showToast('Please select State and District.', 'error');
      return;
    }
    if (!contactName.trim()) {
      setErrorMsg('Please enter the caretaker full name.');
      showToast('Caretaker name is required.', 'error');
      openTextModal('contactName');
      return;
    }
    const cleanPhone = contactPhone.replace(/\D/g, '');
    if (!contactPhone.trim() || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit caretaker phone number.');
      showToast('Caretaker phone number is required.', 'error');
      openTextModal('contactPhone');
      return;
    }
    if (!contactEmail.trim()) {
      setErrorMsg('Please enter the caretaker email address.');
      showToast('Caretaker email address is required.', 'error');
      openTextModal('contactEmail');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail.trim())) {
      setErrorMsg('Please enter a valid email address (e.g. caretaker@example.com).');
      showToast('Please enter a valid email address.', 'error');
      openTextModal('contactEmail');
      return;
    }

    try {
      setIsSubmitting(true);
      const now = new Date().toISOString();
      const locationParts = [city, mandalOrMunicipality, district, state].filter(Boolean);
      const deduplicatedParts = locationParts.filter((item, index) => locationParts.indexOf(item) === index);
      const approxLocation = deduplicatedParts.join(', ');

      const listingGroupId = submissionIdRef.current || `ADOPT_GRP_${Date.now()}`;
      submissionIdRef.current = listingGroupId;


      // Sync active pet before packaging
      const currentPetItem: ExtractedPetItem = {
        petName: finalPetName,
        breed,
        gender,
        age: age.trim() || 'Young',
        size,
        photo: finalPhoto,
        description: description.trim() || 'Friendly dog looking for a loving forever family.',
        healthNotes: healthNotes.trim() || '',
        vaccinated,
        dewormed,
        spayedOrNeutered,
      };

      const petsToSaveList: ExtractedPetItem[] =
        extractedPets.length > 1
          ? extractedPets.map((p, idx) => (idx === selectedPetIndex ? currentPetItem : p))
          : [currentPetItem];

      // Prepare AdoptionPet records with strict duplicate prevention and upsert linking
      const existingMatchMap = new Map<string, AdoptionPet>();
      const savedPets: AdoptionPet[] = petsToSaveList.map((p, idx) => {
        const petNameToMatch = p.petName || (idx === selectedPetIndex ? finalPetName : `Pet ${idx + 1}`);
        const existingMatch =
          (isEditingExisting && existingAdoptionPet?.id && idx === 0 ? existingAdoptionPet : null) ||
          storageService.findMatchingAdoptionPet({
            id: p.id,
            userId: user?.id,
            petName: petNameToMatch,
            rawContactPhone: contactPhone.trim(),
            contactPhone: contactPhone.trim(),
            contactEmail: contactEmail.trim(),
            flyerPhoto: flyerPhoto || undefined,
            listingGroupId,
          });

        const petId = existingMatch?.id || `ADOPT-${Date.now()}-${idx}`;
        if (existingMatch) {
          existingMatchMap.set(petId, existingMatch);
        }

        return {
          id: petId,
          userId: user?.id || existingMatch?.userId,
          listingGroupId,
          petName: petNameToMatch,
          breed: p.breed || breed,
          gender: (p.gender as DogGender) || gender,
          age: p.age || age,
          size: (p.size as DogSize) || size,
          photo: p.photo || finalPhoto,
          photos: [p.photo || finalPhoto],
          flyerPhoto: flyerPhoto || existingMatch?.flyerPhoto || undefined,
          isFlyerUpload: Boolean(flyerPhoto || existingMatch?.flyerPhoto),
          description: p.description || description || 'Friendly dog looking for a loving forever family.',
          healthNotes: p.healthNotes || healthNotes || '',
          vaccinated: typeof p.vaccinated === 'boolean' ? p.vaccinated : vaccinated,
          dewormed: typeof p.dewormed === 'boolean' ? p.dewormed : dewormed,
          spayedOrNeutered: typeof p.spayedOrNeutered === 'boolean' ? p.spayedOrNeutered : spayedOrNeutered,
          state,
          district,
          mandal: mandalOrMunicipality,
          village: city,
          city,
          pinCode,
          latitude,
          longitude,
          approximateLocation: approxLocation,
          locationHint: locationHint || undefined,
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          contactEmail: contactEmail.trim(),
          rawContactPhone: contactPhone.trim(),
          rawContactEmail: contactEmail.trim(),
          fieldConfidence: fieldConfidences,
          status: 'AVAILABLE',
          createdAt: existingMatch?.createdAt || existingAdoptionPet?.createdAt || now,
          updatedAt: now,
        };
      });

      // Save via API service (backend endpoint)
      await adoptionApiService.saveAdoptionListings({
        submissionId: listingGroupId,
        pets: savedPets,
        caretaker: {
          name: contactName.trim(),
          phone: contactPhone.trim(),
          email: contactEmail.trim(),
        },
        location: {
          state,
          district,
          mandal: mandalOrMunicipality,
          village: city,
          city,
          pinCode,
          latitude,
          longitude,
          locationHint: locationHint || undefined,
        },
        flyerPhoto: flyerPhoto || undefined,
        userId: user?.id,
      });

      // Update local storage and Cloudinary with duplicate prevention
      for (const petRecord of savedPets) {
        const prevMatch = existingMatchMap.get(petRecord.id);
        const prevPhoto = prevMatch?.photo;
        const prevFlyer = prevMatch?.flyerPhoto;

        if (petRecord.photo && isUploadablePhoto(petRecord.photo)) {
          storageBucketService
            .uploadAdoptionPetPhoto(petRecord.id, petRecord.photo, 0, prevPhoto)
            .then((cloudUrl) => {
              if (cloudUrl) {
                if (prevPhoto && prevPhoto !== cloudUrl && isCloudinaryUrl(prevPhoto)) {
                  storageBucketService.deleteMedia(prevPhoto).catch(() => {});
                }
                petRecord.photo = cloudUrl;
                petRecord.photos = [cloudUrl];
                storageService.addAdoptionPet(petRecord);
              }
            })
            .catch((err) => console.warn('[storageBucketService] Adoption pet photo upload notice:', err));
        }

        if (flyerPhoto && isUploadablePhoto(flyerPhoto)) {
          storageBucketService
            .uploadAdoptionFlyer(petRecord.id, flyerPhoto, prevFlyer)
            .then((cloudFlyer) => {
              if (cloudFlyer) {
                if (prevFlyer && prevFlyer !== cloudFlyer && isCloudinaryUrl(prevFlyer)) {
                  storageBucketService.deleteMedia(prevFlyer).catch(() => {});
                }
                petRecord.flyerPhoto = cloudFlyer;
                storageService.addAdoptionPet(petRecord);
              }
            })
            .catch((err) => console.warn('[storageBucketService] Background flyer upload notice:', err));
        }

        storageService.addAdoptionPet(petRecord);
      }

      const primarySaved = savedPets[0];
      setCreatedOrUpdatedPet(primarySaved);

      const successMsg =
        savedPets.length > 1
          ? `🎉 All ${savedPets.length} pets saved for adoption! (Existing records updated, no duplicates created)`
          : `🎉 "${finalPetName}" adoption details updated successfully! (No duplicates created)`;

      showToast(successMsg, 'success');

      navigate('/homepage', {
        state: {
          tab: 'ADOPTION',
          adoptionSuccess: true,
          petName: primarySaved.petName,
          adoptionPetId: primarySaved.id,
        },
        replace: true,
      });
    } catch (err: any) {
      console.error('Failed to submit adoption pet:', err);
      setErrorMsg('Failed to save adoption pet details. Please try again.');
      showToast('Error submitting adoption details.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const medicalSummary = [
    vaccinated ? 'Vaccinated' : null,
    dewormed ? 'Dewormed' : null,
    spayedOrNeutered ? 'Neutered / Spayed' : null,
  ].filter(Boolean).join(' • ') || 'None specified';

  return (
    <div className="onboarding-page onboarding-adoption-page">
      <div className="app-container onboarding-container" style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '3rem' }}>
        <section className="onboarding-card card owner-theme-card" style={{ border: '1.5px solid rgba(236, 72, 153, 0.35)', background: 'linear-gradient(180deg, #181119 0%, #0F0B10 100%)' }}>
          {/* TOP NAV BAR */}
          <div className="onboarding-top-nav-row">
            <div className="onboarding-top-nav-left">
              <BackButton
                onClick={handleBack}
                title="Go Back"
                aria-label="Go Back"
              />
            </div>
            <div className="section-card-title-block onboarding-top-nav-title">
              <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                <Heart size={24} style={{ color: '#F472B6', fill: '#F472B6' }} />
                <span>{isEditingExisting ? 'Update Adoption Pet' : 'Pet Adoption Details'}</span>
              </h1>
            </div>
            <button
              type="button"
              className="onboarding-exit-btn onboarding-top-nav-close"
              onClick={handleBack}
              aria-label="Cancel and return"
              title="Return to previous screen"
            >
              <X size={19} />
            </button>
          </div>

          <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', margin: '-0.3rem 0 1.25rem' }}>
            {isEditingExisting
              ? `Review or update adoption listing details for ${existingAdoptionPet?.petName || 'your pet'}.`
              : 'List a loving pet looking for a forever home. Adopters in your area can connect safely.'}
          </p>

          {errorMsg && (
            <div
              className="alert alert-error"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#FCA5A5',
              }}
            >
              <AlertCircle size={18} />
              <span style={{ fontSize: '0.85rem' }}>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 🎯 ONLY 2 RADIO BUTTONS AT TOP */}
            <div className="adoption-mode-radio-group">
              <div
                className={`adoption-mode-radio-pill ${entryMode === 'flyer' ? 'is-active' : ''}`}
                onClick={() => {
                  setEntryMode('flyer');
                  if (flyerPhoto) {
                    setCurrentStep(1);
                  }
                }}
                role="radio"
                aria-checked={entryMode === 'flyer'}
                tabIndex={0}
              >
                <div className="adoption-radio-circle">
                  <div className="adoption-radio-circle-dot" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={17} style={{ color: entryMode === 'flyer' ? '#EC4899' : '#94A3B8' }} />
                  <span style={{ fontSize: '0.94rem', fontWeight: 700, color: entryMode === 'flyer' ? '#FFFFFF' : '#CBD5E1' }}>
                    Upload Poster / Flyer
                  </span>
                  <span style={{ fontSize: '0.66rem', padding: '1px 7px', borderRadius: '8px', background: 'rgba(236,72,153,0.25)', color: '#F472B6', fontWeight: 700 }}>
                    AI Auto-Fill
                  </span>
                </div>
              </div>

              <div
                className={`adoption-mode-radio-pill ${entryMode === 'manual' ? 'is-active' : ''}`}
                onClick={() => {
                  setEntryMode('manual');
                  setCurrentStep(1);
                }}
                role="radio"
                aria-checked={entryMode === 'manual'}
                tabIndex={0}
              >
                <div className="adoption-radio-circle">
                  <div className="adoption-radio-circle-dot" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Dog size={17} style={{ color: entryMode === 'manual' ? '#EC4899' : '#94A3B8' }} />
                  <span style={{ fontSize: '0.94rem', fontWeight: 700, color: entryMode === 'manual' ? '#FFFFFF' : '#CBD5E1' }}>
                    Manual Entry
                  </span>
                </div>
              </div>
            </div>

            {/* 🔄 CENTERED RESET BUTTON DIRECTLY DOWN TO THE 2 RADIO BUTTONS */}
            <div className="adoption-reset-btn-wrapper">
              <button
                type="button"
                onClick={handleResetForm}
                className="adoption-reset-btn"
                title="Reset selection and clear all form data"
                aria-label="Reset all adoption form data"
              >
                <RotateCcw size={14} />
                <span>Reset Form</span>
              </button>
            </div>

            {/* 💡 HELPFUL INITIAL PROMPT WHEN NOTHING IS SELECTED YET */}
            {entryMode === null && (
              <div
                className="adoption-step-container"
                style={{
                  textAlign: 'center',
                  padding: '2.5rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)',
                    border: '1.5px solid rgba(244, 114, 182, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F472B6',
                    marginBottom: '1rem',
                  }}
                >
                  <Sparkles size={26} />
                </div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Please Select an Option
                </h3>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#94A3B8', maxWidth: '380px', lineHeight: 1.5 }}>
                  Choose <strong>Upload Poster / Flyer</strong> for AI auto-fill or <strong>Manual Entry</strong> above to begin filling the pet details.
                </p>
              </div>
            )}

            {/* Hidden file input for flyer upload */}
            <input
              type="file"
              ref={flyerFileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFlyerUpload}
            />

            {/* 🌀 DEDICATED AI FLYER SCANNING ANIMATION WHILE READING POSTER */}
            {entryMode === 'flyer' && isScanningFlyer && (
              <div
                className="adoption-step-container"
                style={{
                  border: '2px solid #EC4899',
                  padding: '3rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 0 45px rgba(236, 72, 153, 0.35)',
                }}
              >
                {/* Sweeping laser scanner beam */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, transparent, #EC4899, #F472B6, #8B5CF6, transparent)',
                    boxShadow: '0 0 16px #EC4899, 0 0 32px #F472B6',
                    animation: 'scanLineSweep 2.2s ease-in-out infinite alternate',
                  }}
                />

                {/* Pulsing radar icon */}
                <div
                  style={{
                    position: 'relative',
                    width: '84px',
                    height: '84px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      border: '2px solid rgba(236, 72, 153, 0.5)',
                      animation: 'radarPing 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: '6px',
                      borderRadius: '50%',
                      border: '2px dashed rgba(244, 114, 182, 0.6)',
                      animation: 'spinSlow 6s linear infinite',
                    }}
                  />
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      boxShadow: '0 0 24px rgba(236, 72, 153, 0.65)',
                    }}
                  >
                    <Sparkles size={28} />
                  </div>
                </div>

                <h3 style={{ margin: '1.4rem 0 0.4rem', fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Extracting Adoption Poster Details...
                </h3>
                <p style={{ margin: '0 0 1.35rem', fontSize: '0.88rem', color: '#F472B6', fontWeight: 600, minHeight: '22px' }}>
                  {scanProgressText || 'Extracting pet name, breed, caretaker contacts & location...'}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '999px', background: 'rgba(236, 72, 153, 0.15)', color: '#F472B6', border: '1px solid rgba(236, 72, 153, 0.35)', fontWeight: 600 }}>
                    🐾 Pet Profile
                  </span>
                  <span style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.35)', fontWeight: 600 }}>
                    📞 Caretaker Info
                  </span>
                  <span style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '999px', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.35)', fontWeight: 600 }}>
                    📍 Location &amp; PIN
                  </span>
                </div>
              </div>
            )}

            {/* 📸 FLYER UPLOAD DROPZONE (SHOWN WHEN FLYER MODE IS SELECTED BUT NO FLYER UPLOADED YET) */}
            {entryMode === 'flyer' && !flyerPhoto && !isScanningFlyer && (
              <div
                className="adoption-step-container card"
                style={{
                  border: '1.5px dashed rgba(244, 114, 182, 0.55)',
                  padding: '2.5rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => flyerFileInputRef.current?.click()}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 8px 24px rgba(236, 72, 153, 0.45)',
                    marginBottom: '1rem',
                  }}
                >
                  <Upload size={28} />
                </div>

                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Upload Adoption Poster / Flyer
                  <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.25)', color: '#F472B6', border: '1px solid rgba(236, 72, 153, 0.4)' }}>
                    AI Auto-Fill
                  </span>
                </h3>
                <p style={{ margin: '8px 0 1.5rem', fontSize: '0.86rem', color: '#CBD5E1', maxWidth: '380px', lineHeight: 1.45 }}>
                  Have a WhatsApp flyer or rescue poster? Upload it here and we'll extract pet details, caretaker contacts &amp; location automatically!
                </p>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    flyerFileInputRef.current?.click();
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0.8rem 1.6rem',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.94rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(236, 72, 153, 0.45)',
                  }}
                >
                  <Upload size={17} />
                  <span>Choose Poster Image</span>
                </button>
              </div>
            )}

            {/* 🌟 PROGRESSIVE 3-CONTAINER ADOPTION FORM: STEP 1 ➔ STEP 2 ➔ STEP 3 */}
            {(entryMode === 'manual' || (entryMode === 'flyer' && flyerPhoto)) && !isScanningFlyer && (
              <>
                {/* 3-STEP PROGRESS HEADER */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem', padding: '0 0.5rem' }}>
                  {[
                    { num: 1, label: entryMode === 'flyer' ? '1. Review Pet' : '1. Pet Details' },
                    { num: 2, label: '2. Caretaker' },
                    { num: 3, label: '3. Location' },
                  ].map((s) => {
                    const isCurrent = currentStep === s.num;
                    const isDone = currentStep > s.num;
                    return (
                      <div
                        key={s.num}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: isDone ? 'pointer' : 'default',
                        }}
                        onClick={() => {
                          if (isDone) setCurrentStep(s.num as 1 | 2 | 3);
                        }}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isCurrent
                              ? 'linear-gradient(135deg, #EC4899, #BE185D)'
                              : isDone
                              ? 'rgba(16, 185, 129, 0.25)'
                              : 'rgba(255, 255, 255, 0.08)',
                            border: isCurrent
                              ? '2px solid #F472B6'
                              : isDone
                              ? '1.5px solid #10B981'
                              : '1px solid rgba(255, 255, 255, 0.15)',
                            color: isCurrent ? '#FFFFFF' : isDone ? '#34D399' : '#94A3B8',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            boxShadow: isCurrent ? '0 0 12px rgba(236, 72, 153, 0.5)' : 'none',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {isDone ? <Check size={15} /> : s.num}
                        </div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: isCurrent ? 700 : 500,
                            color: isCurrent ? '#F472B6' : isDone ? '#34D399' : '#64748B',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 🐾 CONTAINER 1: 1. REVIEW EXTRACTED PET DETAILS / PET DETAILS */}
                {currentStep === 1 && (
                  <div className="adoption-step-container">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(244, 114, 182, 0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Dog size={20} style={{ color: '#F472B6' }} />
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#FDF2F8' }}>
                          {entryMode === 'flyer' ? '1. Review Extracted Pet Details' : '1. Pet Details'}
                        </h3>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#F472B6', background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.3)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                        Step 1 of 3
                      </span>
                    </div>

                    {/* Flyer Preview Badge (when in flyer mode) */}
                    {entryMode === 'flyer' && flyerPhoto && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.85rem',
                          padding: '0.75rem 0.95rem',
                          background: 'rgba(236, 72, 153, 0.08)',
                          border: '1px solid rgba(236, 72, 153, 0.28)',
                          borderRadius: '16px',
                          marginBottom: '1.25rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            onClick={() => setIsFlyerLightboxOpen(true)}
                            style={{
                              position: 'relative',
                              width: '52px',
                              height: '52px',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              border: '2px solid #EC4899',
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                            title="Click to view full poster"
                          >
                            <img src={flyerPhoto} alt="Adoption Flyer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                              <Maximize2 size={14} />
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>Adoption Poster Attached</span>
                              <span style={{ fontSize: '0.66rem', padding: '1px 6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
                                ✨ Auto-filled
                              </span>
                            </div>
                            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                              {extractedFieldsCount > 0 ? `${extractedFieldsCount} fields auto-populated.` : 'Original poster saved for direct sharing.'} Tap to view.
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setIsFlyerLightboxOpen(true)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '8px',
                              background: 'rgba(255,255,255,0.08)',
                              color: '#F1F5F9',
                              border: '1px solid rgba(255,255,255,0.15)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleRescanClick}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '8px',
                              background: 'rgba(236,72,153,0.15)',
                              color: '#F472B6',
                              border: '1px solid rgba(236,72,153,0.3)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <RefreshCw size={12} />
                            <span>Re-scan</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleRemoveFlyer}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.35rem 0.55rem',
                              borderRadius: '8px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#F87171',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              cursor: 'pointer',
                            }}
                            title="Remove Poster"
                            aria-label="Remove Poster"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Multi-Pet Selector (shown when 2 or more pets detected in poster) */}
                    {entryMode === 'flyer' && extractedPets.length > 1 && (
                      <div className="adoption-multi-pet-container">
                        <div className="adoption-multi-pet-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Dog size={17} style={{ color: '#F472B6' }} />
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                              Pets found in this poster ({extractedPets.length} dogs)
                            </span>
                          </div>
                          <button
                            type="button"
                            className="adoption-add-pet-btn"
                            onClick={() => setShowAddPetModal(true)}
                          >
                            <Plus size={13} />
                            <span>+ Add Pet Name</span>
                          </button>
                        </div>

                        {/* Dropdown for selecting dogs and adding names */}
                        <div className="adoption-pet-dropdown-wrap">
                          <Dog size={18} style={{ color: '#F472B6', flexShrink: 0 }} />
                          <select
                            value={selectedPetIndex}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'add_new') {
                                setShowAddPetModal(true);
                              } else {
                                const idx = parseInt(val, 10);
                                syncCurrentPetToExtractedList(selectedPetIndex);
                                loadPetAtIndex(idx);
                              }
                            }}
                            className="adoption-pet-dropdown-select"
                            aria-label="Select Dog from Poster"
                          >
                            {extractedPets.map((p, idx) => (
                              <option key={idx} value={idx}>
                                {`Dog ${idx + 1}: ${p.petName || `Puppy ${idx + 1}`} ${p.gender ? `(${p.gender})` : ''} ${selectedPetIndex === idx ? '✓ Currently Editing' : ''}`}
                              </option>
                            ))}
                            <option value="add_new">➕ + Add another pet name to this poster...</option>
                          </select>
                          <ChevronDown size={18} className="adoption-dropdown-chevron" />
                        </div>

                        {/* Quick switch tabs */}
                        <div className="adoption-multi-pet-pills">
                          {extractedPets.map((p, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className={`adoption-pet-tab-pill ${selectedPetIndex === idx ? 'is-active' : ''}`}
                              onClick={() => {
                                syncCurrentPetToExtractedList(selectedPetIndex);
                                loadPetAtIndex(idx);
                              }}
                            >
                              <span>{p.petName || `Pet ${idx + 1}`}</span>
                              {p.gender && <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>({p.gender})</span>}
                              {extractedPets.length > 1 && (
                                <span
                                  className="adoption-remove-pet-pill-btn"
                                  onClick={(e) => handleRemovePet(e, idx)}
                                  title={`Remove ${p.petName || `Dog ${idx + 1}`}`}
                                >
                                  ×
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.74rem', color: '#94A3B8' }}>
                          Select or switch dogs above to customize individual details. Caretaker and location details are shared.
                        </p>
                      </div>
                    )}

                    {/* Option to add more dogs if poster contains multiple pets */}
                    {entryMode === 'flyer' && flyerPhoto && extractedPets.length <= 1 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.6rem 0.95rem',
                          background: 'rgba(236, 72, 153, 0.08)',
                          borderRadius: '14px',
                          border: '1px dashed rgba(236, 72, 153, 0.35)',
                          marginBottom: '1.25rem',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Dog size={16} style={{ color: '#F472B6' }} />
                          <span style={{ fontSize: '0.8rem', color: '#FDF2F8' }}>
                            Does this poster have more puppies or dogs?
                          </span>
                        </div>
                        <button
                          type="button"
                          className="adoption-add-pet-btn"
                          onClick={() => {
                            if (extractedPets.length === 0) {
                              setExtractedPets([
                                {
                                  petName: petName || 'Dog 1',
                                  breed,
                                  gender,
                                  age,
                                  size,
                                  description,
                                  healthNotes,
                                  vaccinated,
                                  dewormed,
                                  spayedOrNeutered,
                                  photo: photo || flyerPhoto,
                                },
                              ]);
                            }
                            setShowAddPetModal(true);
                          }}
                        >
                          <Plus size={13} />
                          <span>+ Add Pet Name</span>
                        </button>
                      </div>
                    )}

                    {/* Circular Photo Picker (when in manual mode) */}
                    {entryMode === 'manual' && (
                      <div className="pet-profile-photo-center" style={{ margin: '0.25rem 0 1.25rem' }}>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handlePhotoFile}
                        />

                        <div
                          className="pet-photo-circle-wrap"
                          style={{
                            background: 'linear-gradient(135deg, #F472B6 0%, #EC4899 50%, #BE185D 100%)',
                            boxShadow: '0 0 28px rgba(236, 72, 153, 0.45), 0 8px 24px rgba(0, 0, 0, 0.7)',
                          }}
                        >
                          <div className="pet-photo-circle-inner" style={{ position: 'relative' }}>
                            {photo ? (
                              <img
                                src={photo}
                                alt={petName || 'Adoption Pet'}
                                className="pet-photo-main-img"
                              />
                            ) : (
                              <div className="pet-photo-main-placeholder" style={{ background: 'rgba(236,72,153,0.12)', color: '#F472B6' }}>
                                <Dog size={54} />
                              </div>
                            )}
                            {isCompressing && (
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: 'rgba(0,0,0,0.6)',
                                  borderRadius: '50%',
                                  color: '#FFFFFF',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                }}
                              >
                                <span>PROCESSING</span>
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
                            }}
                          >
                            <button
                              type="button"
                              className="pet-photo-camera-badge"
                              style={{ position: 'static', transform: 'none', background: '#EC4899' }}
                              onClick={() => fileInputRef.current?.click()}
                              title="Upload Pet Photo"
                              aria-label="Upload Pet Photo"
                            >
                              <Upload size={16} />
                            </button>
                            <button
                              type="button"
                              className="pet-photo-camera-badge"
                              style={{ position: 'static', transform: 'none', background: '#BE185D' }}
                              onClick={() => fileInputRef.current?.click()}
                              title="Take Photo"
                              aria-label="Take Photo"
                            >
                              <Camera size={16} />
                            </button>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.82rem', color: '#F472B6', marginTop: '1.25rem', fontWeight: 600 }}>
                          {photo ? 'Photo added! Tap buttons to change' : 'Add Pet Adoption Photo *'}
                        </div>

                        {photo && (
                          <button
                            type="button"
                            className="pet-photo-remove-btn"
                            onClick={() => setPhoto('')}
                            style={{ color: '#F87171', marginTop: '0.25rem' }}
                          >
                            <Trash2 size={13} />
                            <span>Remove Photo</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Pet Details Input Bars */}
                    <div className="pet-info-rows-container">
                      {/* ROW 1: Pet Name */}
                      <div className="pet-info-row" onClick={() => openTextModal('name')}>
                        <div className="pet-info-icon-tile" style={{ background: 'linear-gradient(145deg, rgba(236,72,153,0.3), rgba(190,24,93,0.2))', borderColor: 'rgba(244,114,182,0.4)', color: '#F472B6' }}>
                          <Dog size={20} />
                        </div>
                        <div className="pet-info-content">
                          <span className="pet-info-label">
                            Pet Name <span className="required-star" style={{ color: '#F472B6' }}>*</span>
                            {renderFieldAIBadge('petName')}
                          </span>
                          <span className={`pet-info-value ${!petName ? 'placeholder' : ''}`}>
                            {petName || 'Enter pet name (e.g. Bella, Bruno)'}
                          </span>
                          {extractedPets.length > 1 && (
                            <div className="adoption-name-chips-container" onClick={(e) => e.stopPropagation()}>
                              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Choose:</span>
                              {extractedPets.map((ep, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className={`adoption-name-chip ${selectedPetIndex === idx ? 'is-active' : ''}`}
                                  onClick={() => {
                                    syncCurrentPetToExtractedList(selectedPetIndex);
                                    loadPetAtIndex(idx);
                                  }}
                                  title={`Switch to ${ep.petName || `Dog ${idx + 1}`}`}
                                >
                                  <span>{ep.petName || `Dog ${idx + 1}`}</span>
                                </button>
                              ))}
                              <button
                                type="button"
                                className="adoption-name-chip"
                                onClick={() => setShowAddPetModal(true)}
                                style={{ borderStyle: 'dashed' }}
                                title="Add another pet name"
                              >
                                <Plus size={11} />
                                <span>Add Name</span>
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="pet-info-action">
                          <Edit3 size={17} style={{ color: '#9CA3AF' }} />
                        </div>
                      </div>

                      {/* ROW 2: Breed */}
                      <div className="pet-info-row" onClick={() => setActiveModal('breed')}>
                        <div className="pet-info-icon-tile" style={{ background: 'linear-gradient(145deg, rgba(236,72,153,0.3), rgba(190,24,93,0.2))', borderColor: 'rgba(244,114,182,0.4)', color: '#F472B6' }}>
                          <Bone size={20} />
                        </div>
                        <div className="pet-info-content">
                          <span className="pet-info-label">
                            Breed <span className="required-star" style={{ color: '#F472B6' }}>*</span>
                            {renderFieldAIBadge('breed')}
                          </span>
                          <span className={`pet-info-value ${!breed ? 'placeholder' : ''}`}>
                            {breed || 'Select breed'}
                          </span>
                        </div>
                        <div className="pet-info-action">
                          <ChevronDown size={18} />
                        </div>
                      </div>

                      {/* ROW 3: Age / Life Stage */}
                      <div className="pet-info-row" onClick={() => setActiveModal('age')}>
                        <div className="pet-info-icon-tile" style={{ background: 'linear-gradient(145deg, rgba(236,72,153,0.3), rgba(190,24,93,0.2))', borderColor: 'rgba(244,114,182,0.4)', color: '#F472B6' }}>
                          <Calendar size={19} />
                        </div>
                        <div className="pet-info-content">
                          <span className="pet-info-label">
                            Age / Life Stage <span className="required-star" style={{ color: '#F472B6' }}>*</span>
                            {renderFieldAIBadge('age')}
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
                      <div className="pet-info-row" onClick={() => setActiveModal('gender')}>
                        <div className="pet-info-icon-tile" style={{ background: 'linear-gradient(145deg, rgba(236,72,153,0.3), rgba(190,24,93,0.2))', borderColor: 'rgba(244,114,182,0.4)', color: '#F472B6' }}>
                          <VenusAndMars size={19} />
                        </div>
                        <div className="pet-info-content">
                          <span className="pet-info-label">
                            Gender <span className="required-star" style={{ color: '#F472B6' }}>*</span>
                            {renderFieldAIBadge('gender')}
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
                      <div className="pet-info-row" onClick={() => setActiveModal('size')}>
                        <div className="pet-info-icon-tile" style={{ background: 'linear-gradient(145deg, rgba(236,72,153,0.3), rgba(190,24,93,0.2))', borderColor: 'rgba(244,114,182,0.4)', color: '#F472B6' }}>
                          <Ruler size={19} />
                        </div>
                        <div className="pet-info-content">
                          <span className="pet-info-label">
                            Approximate Size <span className="required-star" style={{ color: '#F472B6' }}>*</span>
                            {renderFieldAIBadge('size')}
                          </span>
                          <span className={`pet-info-value ${!size ? 'placeholder' : ''}`}>
                            {size || 'Select size'}
                          </span>
                        </div>
                        <div className="pet-info-action">
                          <ChevronDown size={18} />
                        </div>
                      </div>

                      {/* ROW 6: Medical & Vaccination Status */}
                      <div className="pet-info-row" onClick={() => setActiveModal('medical')}>
                        <div className="pet-info-icon-tile" style={{ background: 'linear-gradient(145deg, rgba(16,185,129,0.25), rgba(5,150,105,0.2))', borderColor: 'rgba(16,185,129,0.4)', color: '#34D399' }}>
                          <ShieldCheck size={19} />
                        </div>
                        <div className="pet-info-content">
                          <span className="pet-info-label">
                            Medical & Care Status
                            {renderFieldAIBadge('vaccinated')}
                          </span>
                          <span className="pet-info-value">
                            {medicalSummary}
                          </span>
                        </div>
                        <div className="pet-info-action">
                          <ChevronDown size={18} />
                        </div>
                      </div>

                      {/* ROW 7: About Pet / Adoption Story */}
                      <div className="pet-info-row" onClick={() => openTextModal('description')}>
                        <div className="pet-info-icon-tile" style={{ background: 'linear-gradient(145deg, rgba(236,72,153,0.3), rgba(190,24,93,0.2))', borderColor: 'rgba(244,114,182,0.4)', color: '#F472B6' }}>
                          <FileText size={19} />
                        </div>
                        <div className="pet-info-content">
                          <span className="pet-info-label">
                            About Pet / Adoption Story
                            {renderFieldAIBadge('description')}
                          </span>
                          <span className={`pet-info-value ${!description ? 'placeholder' : ''}`}>
                            {description || 'Tell adopters about pet temperament, habits...'}
                          </span>
                        </div>
                        <div className="pet-info-action">
                          <Edit3 size={17} style={{ color: '#9CA3AF' }} />
                        </div>
                      </div>

                      {/* ROW 8: Health Notes */}
                      <div className="pet-info-row" onClick={() => openTextModal('healthNotes')}>
                        <div className="pet-info-icon-tile" style={{ background: 'linear-gradient(145deg, rgba(236,72,153,0.3), rgba(190,24,93,0.2))', borderColor: 'rgba(244,114,182,0.4)', color: '#F472B6' }}>
                          <Stethoscope size={19} />
                        </div>
                        <div className="pet-info-content">
                          <span className="pet-info-label">
                            Health & Medical Notes (Optional)
                            {renderFieldAIBadge('healthNotes')}
                          </span>
                          <span className={`pet-info-value ${!healthNotes ? 'placeholder' : ''}`}>
                            {healthNotes || 'Any special diet, treatments, or health needs'}
                          </span>
                        </div>
                        <div className="pet-info-action">
                          <Edit3 size={17} style={{ color: '#9CA3AF' }} />
                        </div>
                      </div>
                    </div>

                    {/* Step 1 Action Button */}
                    <div style={{ marginTop: '1.5rem' }}>
                      <button
                        type="button"
                        onClick={handleProceedToStep2}
                        style={{
                          width: '100%',
                          padding: '0.92rem 1.25rem',
                          borderRadius: '16px',
                          background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
                          border: 'none',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.98rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 18px rgba(236, 72, 153, 0.42)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span>Continue to Caretaker Contact Information</span>
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 📞 CONTAINER 2: 2. CARETAKER CONTACT INFORMATION */}
                {currentStep === 2 && (
                  <div className="adoption-step-container">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(244, 114, 182, 0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <UserIcon size={20} style={{ color: '#F472B6' }} />
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#FDF2F8' }}>
                          2. Caretaker Contact Information
                        </h3>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#10B981', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Shield size={11} /> Masked for Privacy
                      </span>
                    </div>

                    <div className="pet-info-rows-container">
                      {/* ROW 1: Caretaker Name */}
                      <div className="pet-info-row" onClick={() => openTextModal('contactName')}>
                        <div className="pet-info-icon-tile" style={{ background: 'linear-gradient(145deg, rgba(236,72,153,0.3), rgba(190,24,93,0.2))', borderColor: 'rgba(244,114,182,0.4)', color: '#F472B6' }}>
                          <UserIcon size={19} />
                        </div>
                        <div className="pet-info-content">
                          <span className="pet-info-label">
                            Caretaker Full Name <span className="required-star" style={{ color: '#F472B6' }}>*</span>
                            {renderFieldAIBadge('contactName')}
                          </span>
                          <span className={`pet-info-value ${!contactName ? 'placeholder' : ''}`}>
                            {contactName || 'Enter caretaker name'}
                          </span>
                        </div>
                        <div className="pet-info-action">
                          <Edit3 size={17} style={{ color: '#9CA3AF' }} />
                        </div>
                      </div>

                      {/* ROW 2: Caretaker Phone Number */}
                      <div className="pet-info-row" onClick={() => openTextModal('contactPhone')}>
                        <div className="pet-info-icon-tile" style={{ background: 'linear-gradient(145deg, rgba(16,185,129,0.25), rgba(5,150,105,0.2))', borderColor: 'rgba(16,185,129,0.4)', color: '#34D399' }}>
                          <Phone size={19} />
                        </div>
                        <div className="pet-info-content">
                          <span className="pet-info-label">
                            Caretaker Phone Number <span className="required-star" style={{ color: '#F472B6' }}>*</span>
                            {renderFieldAIBadge('contactPhone')}
                          </span>
                          <span className={`pet-info-value ${!contactPhone ? 'placeholder' : ''}`}>
                            {contactPhone || 'Enter 10-digit phone number'}
                          </span>
                        </div>
                        <div className="pet-info-action">
                          <Edit3 size={17} style={{ color: '#9CA3AF' }} />
                        </div>
                      </div>

                      {/* ROW 3: Caretaker Email Address */}
                      <div className="pet-info-row" onClick={() => openTextModal('contactEmail')}>
                        <div className="pet-info-icon-tile" style={{ background: 'linear-gradient(145deg, rgba(59,130,246,0.25), rgba(37,99,235,0.2))', borderColor: 'rgba(59,130,246,0.4)', color: '#60A5FA' }}>
                          <Mail size={19} />
                        </div>
                        <div className="pet-info-content">
                          <span className="pet-info-label">
                            Caretaker Email Address <span className="required-star" style={{ color: '#F472B6' }}>*</span>
                            {renderFieldAIBadge('contactEmail')}
                          </span>
                          <span className={`pet-info-value ${!contactEmail ? 'placeholder' : ''}`}>
                            {contactEmail || 'Enter contact email address (e.g. caretaker@example.com)'}
                          </span>
                        </div>
                        <div className="pet-info-action">
                          <Edit3 size={17} style={{ color: '#9CA3AF' }} />
                        </div>
                      </div>
                    </div>

                    {/* Privacy Shield Active Banner */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.65rem',
                        padding: '0.75rem 1rem',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.28)',
                        borderRadius: '12px',
                        color: '#D1FAE5',
                        fontSize: '0.8rem',
                        lineHeight: '1.45',
                        marginTop: '0.35rem',
                      }}
                    >
                      <Shield size={16} style={{ color: '#10B981', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#FFFFFF', display: 'block', marginBottom: '2px' }}>
                          📞 Direct Adoption Contact
                        </strong>
                        <span>
                          Your contact phone number will be displayed on the adoption listing card and WhatsApp share links so interested adopters can connect with you directly.
                        </span>
                      </div>
                    </div>

                    {/* Step 2 Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.85rem', marginTop: '1.5rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          setCurrentStep(1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{
                          flex: 1,
                          padding: '0.9rem 1rem',
                          borderRadius: '16px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1.5px solid rgba(255, 255, 255, 0.16)',
                          color: '#E2E8F0',
                          fontWeight: 600,
                          fontSize: '0.92rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.45rem',
                        }}
                      >
                        <ArrowLeft size={16} />
                        <span>Back</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleProceedToStep3}
                        style={{
                          flex: 2,
                          padding: '0.9rem 1.25rem',
                          borderRadius: '16px',
                          background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
                          border: 'none',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.96rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 18px rgba(236, 72, 153, 0.42)',
                        }}
                      >
                        <span>Continue to Pet Location</span>
                        <ArrowRight size={17} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 📍 CONTAINER 3: 3. PET LOCATION */}
                {currentStep === 3 && (
                  <div className="adoption-step-container">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(244, 114, 182, 0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <MapPin size={20} style={{ color: '#FF7900' }} />
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#FDF2F8' }}>
                          3. Pet Location
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => triggerDetectLocation()}
                        disabled={isDetectingLocation}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.4rem 0.85rem',
                          background: 'rgba(255, 121, 0, 0.14)',
                          border: '1px solid rgba(255, 121, 0, 0.4)',
                          borderRadius: '999px',
                          color: '#FF9A3C',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Navigation size={13} className={isDetectingLocation ? 'spin' : ''} />
                        <span>{isDetectingLocation ? 'Detecting...' : 'Auto Detect GPS'}</span>
                      </button>
                    </div>

                    {/* Location Permission Denied Warning Banner */}
                    {locationPermissionDenied && (
                      <div className="adoption-permission-denied-banner">
                        <AlertCircle size={16} style={{ flexShrink: 0, color: '#F59E0B' }} />
                        <span>Location permission is off. Please select manually.</span>
                      </div>
                    )}

                    {/* Poster Location Hint Banner */}
                    {locationHint && (
                      <div className="poster-location-hint-banner">
                        <MapPin size={18} style={{ color: '#FF7900', flexShrink: 0 }} />
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.86rem', color: '#FFFFFF', marginBottom: '2px' }}>
                            Poster mentions: {locationHint}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: '#E2E8F0', opacity: 0.9 }}>
                            Select your State and District below to confirm the adoption area, or tap Auto Detect GPS.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 2×2 Location Grid */}
                    <div className="loc-grid-2x2">
                      {/* 1. STATE SQUARE */}
                      <button
                        type="button"
                        className="loc-grid-square loc-gsq-state"
                        onClick={() => setActiveLocationModal('state')}
                        title="Click to select State"
                      >
                        <div className="loc-gsq-top">
                          <div className="loc-gsq-icon">
                            <Landmark size={20} />
                          </div>
                          <span className="loc-gsq-label">State</span>
                        </div>
                        <div className="loc-gsq-value-wrap">
                          <strong className="loc-gsq-value">{state || <span className="loc-gsq-placeholder">Select State</span>}</strong>
                        </div>
                      </button>

                      {/* 2. DISTRICT SQUARE */}
                      <button
                        type="button"
                        className="loc-grid-square loc-gsq-district"
                        onClick={() => setActiveLocationModal('district')}
                        title="Click to select District"
                      >
                        <div className="loc-gsq-top">
                          <div className="loc-gsq-icon">
                            <Building2 size={20} />
                          </div>
                          <span className="loc-gsq-label">District</span>
                        </div>
                        <div className="loc-gsq-value-wrap">
                          <strong className="loc-gsq-value">
                            {district || <span className="loc-gsq-placeholder">Select District</span>}
                          </strong>
                        </div>
                      </button>

                      {/* 3. MANDAL SQUARE */}
                      <button
                        type="button"
                        className="loc-grid-square loc-gsq-mandal"
                        onClick={() => setActiveLocationModal('mandal')}
                        title="Click to select Mandal"
                      >
                        <div className="loc-gsq-top">
                          <div className="loc-gsq-icon">
                            <MapPin size={20} />
                          </div>
                          <span className="loc-gsq-label">Mandal</span>
                        </div>
                        <div className="loc-gsq-value-wrap">
                          <strong className="loc-gsq-value">
                            {mandalOrMunicipality || <span className="loc-gsq-placeholder">Select Mandal</span>}
                          </strong>
                        </div>
                      </button>

                      {/* 4. VILLAGE / HOME BASE SQUARE */}
                      <button
                        type="button"
                        className="loc-grid-square loc-gsq-home"
                        onClick={() => setActiveLocationModal('city')}
                        title="Click to select Village / Locality"
                      >
                        <div className="loc-gsq-top">
                          <div className="loc-gsq-icon">
                            <Home size={20} />
                          </div>
                          <span className="loc-gsq-label">Village / Locality</span>
                        </div>
                        <div className="loc-gsq-value-wrap">
                          <strong className="loc-gsq-value">
                            {city || <span className="loc-gsq-placeholder">Select Village</span>}
                          </strong>
                          {pinCode ? (
                            <span className="loc-gsq-pin-pill">PIN {pinCode}</span>
                          ) : (
                            <span className="loc-gsq-placeholder" style={{ fontSize: '0.74rem', color: '#9CA3AF' }}>PIN auto-detects</span>
                          )}
                        </div>
                      </button>
                    </div>

                    {/* Postal PIN Code */}
                    <div className="pet-info-rows-container" style={{ marginTop: '0.85rem' }}>
                      <div className="pet-info-row" onClick={() => openTextModal('pinCode')}>
                        <div className="pet-info-icon-tile" style={{ background: 'linear-gradient(145deg, rgba(255,121,0,0.25), rgba(234,88,12,0.15))', borderColor: 'rgba(255,121,0,0.35)', color: '#FF9432' }}>
                          <MapPin size={19} />
                        </div>
                        <div className="pet-info-content">
                          <span className="pet-info-label">Postal PIN Code</span>
                          <span className={`pet-info-value ${!pinCode ? 'placeholder' : ''}`}>
                            {pinCode || 'Enter 6-digit postal PIN'}
                          </span>
                        </div>
                        <div className="pet-info-action">
                          <Edit3 size={17} style={{ color: '#9CA3AF' }} />
                        </div>
                      </div>
                    </div>

                    {/* Step 3 Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.85rem', marginTop: '1.5rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          setCurrentStep(2);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{
                          flex: 1,
                          padding: '0.9rem 1rem',
                          borderRadius: '16px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1.5px solid rgba(255, 255, 255, 0.16)',
                          color: '#E2E8F0',
                          fontWeight: 600,
                          fontSize: '0.92rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.45rem',
                        }}
                      >
                        <ArrowLeft size={16} />
                        <span>Back</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                          flex: 2,
                          padding: '0.9rem 1.25rem',
                          borderRadius: '16px',
                          background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
                          border: 'none',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.98rem',
                          cursor: isSubmitting ? 'wait' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 18px rgba(236, 72, 153, 0.45)',
                          opacity: isSubmitting ? 0.7 : 1,
                        }}
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw size={18} className="animate-spin" />
                            <span>Saving Adoption Pet...</span>
                          </>
                        ) : (
                          <>
                            <Heart size={18} style={{ fill: '#FFFFFF' }} />
                            <span>{isEditingExisting ? 'Save & Update Adoption Pet' : 'Complete & Post for Adoption'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', marginTop: '1rem' }}>
                      <button
                        type="button"
                        onClick={handleBack}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(255, 255, 255, 0.65)',
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          padding: '0.3rem',
                        }}
                      >
                        Cancel and go back
                      </button>

                      {isEditingExisting && (
                        <button
                          type="button"
                          onClick={() => {
                            navigate('/adoption-details', { state: { isNew: true }, replace: true });
                            setPetName('');
                            setPhoto('');
                            setDescription('');
                            setHealthNotes('');
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#F472B6',
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                            padding: '0.2rem',
                            textDecoration: 'underline',
                            textUnderlineOffset: '3px',
                          }}
                        >
                          + Post a new / different pet for adoption instead
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </form>
        </section>
      </div>

      {/* POPUP SELECTORS (SAME COMPONENT & MODALS USED IN PET DETAILS) */}

      {/* 1. Breed Selector Popup */}
      <PetProfileSelector
        isOpen={activeModal === 'breed'}
        onClose={() => setActiveModal(null)}
        title="Select Dog Breed"
        options={breedOptions}
        selectedValue={breed}
        onSelect={(val) => {
          setBreed(val);
          markFieldEdited('breed');
        }}
        searchable={true}
        searchPlaceholder="Search breeds (e.g. Indie, Golden, Lab)..."
      />

      {/* 2. Age Selector Popup */}
      <PetProfileSelector
        isOpen={activeModal === 'age'}
        onClose={() => setActiveModal(null)}
        title="Select Age / Life Stage"
        options={ageOptions}
        selectedValue={age}
        onSelect={(val) => {
          setAge(val);
          markFieldEdited('age');
        }}
        searchable={true}
        searchPlaceholder="Search age category..."
      />

      {/* 3. Gender Selector Popup */}
      <PetProfileSelector
        isOpen={activeModal === 'gender'}
        onClose={() => setActiveModal(null)}
        title="Select Gender"
        options={genderOptions}
        selectedValue={gender}
        onSelect={(val) => {
          setGender(val as DogGender);
          markFieldEdited('gender');
        }}
        searchable={false}
      />

      {/* 4. Size Category Selector Popup */}
      <PetProfileSelector
        isOpen={activeModal === 'size'}
        onClose={() => setActiveModal(null)}
        title="Select Size Category"
        options={sizeOptions}
        selectedValue={size}
        onSelect={(val) => {
          setSize(val as DogSize);
          markFieldEdited('size');
        }}
        searchable={true}
        searchPlaceholder="Search size..."
      />

      {/* 5. Medical & Vaccination Modal */}
      {activeModal === 'medical' && (
        <div className="pet-text-modal-overlay" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true">
          <div className="pet-text-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="pet-text-modal-header">
              <h3>Medical & Care Status</h3>
              <button type="button" onClick={() => setActiveModal(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1rem 0' }}>
              <button
                type="button"
                onClick={() => {
                  setVaccinated(!vaccinated);
                  markFieldEdited('vaccinated');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: vaccinated ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255,255,255,0.05)',
                  border: vaccinated ? '1.5px solid #10B981' : '1.5px solid rgba(255,255,255,0.1)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} style={{ color: vaccinated ? '#34D399' : '#9CA3AF' }} />
                  <span style={{ fontWeight: 600 }}>Vaccinated</span>
                </div>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: vaccinated ? '#10B981' : 'transparent', border: '1.5px solid ' + (vaccinated ? '#10B981' : '#6B7280'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {vaccinated && <Check size={14} color="#FFF" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDewormed(!dewormed);
                  markFieldEdited('dewormed');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: dewormed ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255,255,255,0.05)',
                  border: dewormed ? '1.5px solid #3B82F6' : '1.5px solid rgba(255,255,255,0.1)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={18} style={{ color: dewormed ? '#60A5FA' : '#9CA3AF' }} />
                  <span style={{ fontWeight: 600 }}>Dewormed</span>
                </div>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: dewormed ? '#3B82F6' : 'transparent', border: '1.5px solid ' + (dewormed ? '#3B82F6' : '#6B7280'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {dewormed && <Check size={14} color="#FFF" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSpayedOrNeutered(!spayedOrNeutered);
                  markFieldEdited('spayedOrNeutered');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: spayedOrNeutered ? 'rgba(168, 85, 247, 0.18)' : 'rgba(255,255,255,0.05)',
                  border: spayedOrNeutered ? '1.5px solid #A855F7' : '1.5px solid rgba(255,255,255,0.1)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={18} style={{ color: spayedOrNeutered ? '#C084FC' : '#9CA3AF' }} />
                  <span style={{ fontWeight: 600 }}>Spayed / Neutered</span>
                </div>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: spayedOrNeutered ? '#A855F7' : 'transparent', border: '1.5px solid ' + (spayedOrNeutered ? '#A855F7' : '#6B7280'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {spayedOrNeutered && <Check size={14} color="#FFF" />}
                </div>
              </button>
            </div>
            <button
              type="button"
              className="pet-text-modal-update-btn"
              onClick={() => setActiveModal(null)}
            >
              <Check size={17} />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Active Text Modal (Same focused interactive editor used in PetDetails.tsx) */}
      {activeTextModal && (
        <div className="pet-text-modal-overlay" onClick={() => setActiveTextModal(null)} role="dialog" aria-modal="true">
          <div className="pet-text-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pet-text-modal-header">
              <h3>
                {activeTextModal === 'name' ? 'Pet Name' :
                 activeTextModal === 'description' ? 'About Pet / Adoption Story' :
                 activeTextModal === 'healthNotes' ? 'Health & Medical Notes' :
                 activeTextModal === 'contactName' ? 'Caretaker Full Name' :
                 activeTextModal === 'contactPhone' ? 'Caretaker Phone Number' :
                 activeTextModal === 'contactEmail' ? 'Caretaker Email Address' :
                 'Postal PIN Code'}
              </h3>
              <button type="button" onClick={() => setActiveTextModal(null)} aria-label="Close editor">
                <X size={18} />
              </button>
            </div>

            {activeTextModal === 'description' || activeTextModal === 'healthNotes' ? (
              <textarea
                className="pet-text-modal-textarea"
                value={textModalValue}
                placeholder={
                  activeTextModal === 'description'
                    ? 'Tell adopters about pet temperament, habits, friendliness with children or other pets...'
                    : 'Any special diet, allergies, recent vaccination dates, or medical history...'
                }
                autoFocus
                rows={4}
                onChange={(e) => setTextModalValue(e.target.value)}
              />
            ) : (
              <input
                type={activeTextModal === 'contactPhone' ? 'tel' : activeTextModal === 'contactEmail' ? 'email' : activeTextModal === 'pinCode' ? 'number' : 'text'}
                className="pet-text-modal-input"
                value={textModalValue}
                maxLength={activeTextModal === 'pinCode' ? 6 : undefined}
                placeholder={
                  activeTextModal === 'name' ? 'Enter pet name' :
                  activeTextModal === 'contactName' ? 'e.g. Rahul Sharma' :
                  activeTextModal === 'contactPhone' ? 'e.g. 9848012345' :
                  activeTextModal === 'pinCode' ? 'e.g. 534216' :
                  'e.g. caretaker@example.com'
                }
                autoFocus
                onChange={(e) => setTextModalValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTextModalUpdate();
                  }
                }}
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

      {/* 7. Location Cascading Selectors (State, District, Mandal, Village) */}
      <PetProfileSelector
        isOpen={activeLocationModal === 'state'}
        onClose={() => setActiveLocationModal(null)}
        title="Select State"
        options={stateOptions}
        selectedValue={state}
        onSelect={(val) => {
          setState(val);
          setDistrict('');
          setMandalOrMunicipality('');
          setCity('');
        }}
        searchable={true}
        searchPlaceholder="Search state..."
      />

      <PetProfileSelector
        isOpen={activeLocationModal === 'district'}
        onClose={() => setActiveLocationModal(null)}
        title="Select District"
        options={districtOptions}
        selectedValue={district}
        onSelect={(val) => {
          setDistrict(val);
          setMandalOrMunicipality('');
          setCity('');
        }}
        searchable={true}
        searchPlaceholder="Search district..."
      />

      <PetProfileSelector
        isOpen={activeLocationModal === 'mandal'}
        onClose={() => setActiveLocationModal(null)}
        title="Select Mandal / Municipality"
        options={mandalOptions}
        selectedValue={mandalOrMunicipality}
        onSelect={(val) => {
          setMandalOrMunicipality(val);
          setCity('');
        }}
        searchable={true}
        searchPlaceholder="Search mandal..."
      />

      <PetProfileSelector
        isOpen={activeLocationModal === 'city'}
        onClose={() => setActiveLocationModal(null)}
        title="Select Village / Locality"
        options={villageOptions}
        selectedValue={city}
        onSelect={(val) => {
          setCity(val);
          resolvePinCodeForLocality(val, mandalOrMunicipality, district);
        }}
        searchable={true}
        searchPlaceholder="Search village or locality..."
      />

      {/* 8. Public Adoption Share Card Modal (Image, WhatsApp, Native Share) */}
      <AdoptionShareModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          navigate('/homepage', {
            state: {
              tab: 'ADOPTION',
              adoptionSuccess: true,
              petName: createdOrUpdatedPet?.petName,
              adoptionPetId: createdOrUpdatedPet?.id,
            },
            replace: true,
          });
        }}
        pet={createdOrUpdatedPet || existingAdoptionPet || null}
        onContinue={() => {
          setIsShareModalOpen(false);
          navigate('/homepage', {
            state: {
              tab: 'ADOPTION',
              adoptionSuccess: true,
              petName: createdOrUpdatedPet?.petName,
              adoptionPetId: createdOrUpdatedPet?.id,
            },
            replace: true,
          });
        }}
        continueLabel="View in Adoption Dashboard"
      />

      {/* 9. Full-Screen Adoption Poster Lightbox Modal */}
      {isFlyerLightboxOpen && flyerPhoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
          }}
          onClick={() => setIsFlyerLightboxOpen(false)}
        >
          <div
            style={{
              maxWidth: '92vw',
              maxHeight: '88vh',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsFlyerLightboxOpen(false)}
              style={{
                position: 'absolute',
                top: '-46px',
                right: '0',
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
              aria-label="Close Lightbox"
            >
              <X size={20} />
            </button>

            <img
              src={flyerPhoto}
              alt="Adoption Flyer Poster"
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                borderRadius: '16px',
                boxShadow: '0 12px 48px rgba(0, 0, 0, 0.85)',
                objectFit: 'contain',
              }}
            />

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <a
                href={flyerPhoto}
                download={`adoption_poster_${petName || 'dog'}.jpg`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(236, 72, 153, 0.4)',
                }}
              >
                <Upload size={16} style={{ transform: 'rotate(180deg)' }} />
                <span>Download Poster</span>
              </a>

              <button
                type="button"
                onClick={() => setIsFlyerLightboxOpen(false)}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Turn On Location Modal (when device GPS is off) */}
      <PermissionRationaleModal
        isOpen={showTurnOnModal}
        title="Turn On Location / లొకేషన్ ఆన్ చేయండి"
        message="Location is turned off on your device. Turn it on to auto-detect your pet adoption area."
        continueLabel="Open Settings"
        cancelLabel="Not Now"
        onCancel={() => {
          setShowTurnOnModal(false);
          setLocationPermissionDenied(true);
        }}
        onContinue={handleOpenLocationSettings}
      />

      {/* 11. In-App Pre-Permission Rationale Modal (Location.tsx component pattern) */}
      <PermissionRationaleModal
        isOpen={showPermissionRationaleModal}
        title="Location Access / లొకేషన్ వివరాలు"
        message="Location access is needed to detect pet adoption area (State, District, Mandal, and Locality) automatically. Your exact coordinates are never publicly shown."
        continueLabel="Continue"
        cancelLabel="Not Now"
        onCancel={() => {
          setShowPermissionRationaleModal(false);
          setLocationPermissionDenied(true);
        }}
        onContinue={handlePermissionRationaleContinue}
      />

      {/* 12. In-App Permission Blocked Modal */}
      <PermissionRationaleModal
        isOpen={showPermissionBlockedModal}
        title="Location Access Needed"
        message="Location access is needed. Please ensure location is turned on in your device settings to detect adoption location automatically."
        continueLabel="Open Settings"
        cancelLabel="Select Location Manually"
        onCancel={() => {
          setShowPermissionBlockedModal(false);
          setLocationPermissionDenied(true);
          if (!state) setActiveLocationModal('state');
        }}
        onContinue={handleOpenLocationSettings}
      />

      {/* 13. Re-scan Confirmation Modal */}
      <PermissionRationaleModal
        isOpen={showRescanConfirmModal}
        title="Re-scan Adoption Poster?"
        message="You have manually edited details. Re-scanning will preserve your custom edits while re-extracting unmodified fields from the poster."
        continueLabel="Continue Re-scan"
        cancelLabel="Keep Current"
        onCancel={() => setShowRescanConfirmModal(false)}
        onContinue={() => {
          setShowRescanConfirmModal(false);
          flyerFileInputRef.current?.click();
        }}
      />

      {/* 14. Add Pet Name Modal (Multi-Pet in Poster) */}
      {showAddPetModal && (
        <div
          className="pet-text-modal-overlay"
          onClick={() => setShowAddPetModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="pet-text-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px' }}
          >
            <div className="pet-text-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Dog size={20} style={{ color: '#F472B6' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#FDF2F8' }}>
                  Add Another Pet Name
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPetModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#CBD5E1', margin: '0.65rem 0 1rem', lineHeight: '1.45' }}>
              If this poster has multiple dogs or puppies for adoption, enter each dog's name below. You can customize details for each pet while sharing caretaker and location info.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#F472B6',
                  marginBottom: '0.4rem',
                }}
              >
                Dog / Puppy Name
              </label>
              <input
                type="text"
                className="pet-text-modal-input"
                value={newPetNameInput}
                onChange={(e) => setNewPetNameInput(e.target.value)}
                placeholder="e.g. Bella, Rocky, Puppy 2..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewPetName();
                  }
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowAddPetModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  color: '#CBD5E1',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="pet-text-modal-update-btn"
                style={{ flex: 1.5, margin: 0 }}
                onClick={handleAddNewPetName}
              >
                <Plus size={16} />
                <span>Add Dog</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
