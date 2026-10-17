import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Navigation,
  RefreshCw,
  Building,
  Building2,
  Home,
  MapPin,
  Landmark,
  Check,
  ArrowRight,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { locationService } from '../services/locationService';
import { PetProfileSelector, type SelectorOption } from '../components/PetProfileSelector';
import type { OwnerProfile, LocationLocality } from '../types';
import { isValidOwnerPhoto } from '../utils/dogPhotoHelper';
import { BackButton } from '../components/ui/back-button';
import { VillageDogTransition } from '../components/ui/VillageDogTransition';
import { PermissionRationaleModal } from '../components/PermissionRationaleModal';
import { normalizeToEnglishText, hasNonLatinScript } from '../utils/indicTransliteration';
import { useLocationDetection, type LocationDetectionResult } from '../hooks/useLocationDetection';

interface LocationProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

/** Supports manual or detected owner-location entry with separate state, district, mandal, and locality fields. */
export const Location: React.FC<LocationProps> = ({
  onSuccess,
  onBack,
}) => {
  const { user, refreshProgress, setActiveOnboardingTab } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isTransitioningBack, setIsTransitioningBack] = useState(false);
  const [isTransitioningForward, setIsTransitioningForward] = useState(false);

  const [, setForceUpdate] = useState(0);
  useEffect(() => {
    const handleUpdate = () => {
      setForceUpdate((prev) => prev + 1);
      refreshProgress();
    };
    window.addEventListener('findlostpuppy_reports_updated', handleUpdate);
    window.addEventListener('findlostpuppy_data_synced', handleUpdate);
    window.addEventListener('findlostpuppy_session_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('findlostpuppy_reports_updated', handleUpdate);
      window.removeEventListener('findlostpuppy_data_synced', handleUpdate);
      window.removeEventListener('findlostpuppy_session_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshProgress]);

  const existingProfile = user ? storageService.getOwnerProfileByUserId(user.id, user.email) : null;

  // Initial values from saved profile
  const initialValidState =
    existingProfile?.state && locationService.getState(existingProfile.state)
      ? existingProfile.state
      : '';

  const [state, setState] = useState<string>(initialValidState);
  const [district, setDistrict] = useState<string>(existingProfile?.district || '');
  const [mandalOrMunicipality, setMandalOrMunicipality] = useState<string>(
    existingProfile?.mandalOrMunicipality || ''
  );
  const savedMandal = existingProfile?.mandalOrMunicipality?.trim() || '';
  const savedCity = existingProfile?.city?.trim() || '';
  const initialCity =
    savedCity && savedCity.toLowerCase() !== savedMandal.toLowerCase()
      ? savedCity
      : '';
  const [city, setCity] = useState<string>(initialCity);
  const [pinCode, setPinCode] = useState(existingProfile?.pinCode || '');
  const [latitude, setLatitude] = useState<number | undefined>(existingProfile?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(existingProfile?.longitude);

  const [showOutsideDeliveryModal, setShowOutsideDeliveryModal] = useState(false);
  const hasManuallyResetRef = useRef(false);

  // Redirect to Owner Profile if owner profile components (Photo, Name, Phone) are not yet complete
  useEffect(() => {
    if (user && !storageService.hasCompletedOwnerProfile(user.id, user.email)) {
      showToast('⚠️ Please complete your Owner Profile first (Photo, Name, and Phone are mandatory).', 'warning');
      navigate('/owner', { replace: true });
    }
  }, [user, navigate, showToast]);

  // Auto-populate when profile data arrives from cloud/Firestore (unless user manually clicked reset)
  useEffect(() => {
    if (hasManuallyResetRef.current) return;
    if (existingProfile) {
      if (existingProfile.state) setState(normalizeToEnglishText(existingProfile.state));
      if (existingProfile.district) setDistrict(normalizeToEnglishText(existingProfile.district));
      if (existingProfile.mandalOrMunicipality) {
        setMandalOrMunicipality(normalizeToEnglishText(existingProfile.mandalOrMunicipality));
      }
      const pMandal = (existingProfile.mandalOrMunicipality || '').trim();
      const pCity = (existingProfile.city || '').trim();
      if (pCity && pCity.toLowerCase() !== pMandal.toLowerCase()) {
        const normCity = normalizeToEnglishText(pCity);
        if (!city || hasNonLatinScript(city)) {
          setCity(normCity);
        }
      }
      if (!pinCode && existingProfile.pinCode) setPinCode(existingProfile.pinCode);
    }
  }, [existingProfile]);

  // Dynamic localities loaded for currently selected district and mandal
  const [localities, setLocalities] = useState<LocationLocality[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Live reactive check: Has any location field been populated?
  const hasAnyLocationData = Boolean(
    state.trim() ||
    district.trim() ||
    mandalOrMunicipality.trim() ||
    city.trim()
  );

  const [pinConflictNote, setPinConflictNote] = useState<string>('');
  const [lookingUpPin, setLookingUpPin] = useState(false);
  const locationCardsRef = useRef<HTMLDivElement | null>(null);
  const initialLocationActionScrollRef = useRef(false);
  const autoSyncTimerRef = useRef<number | null>(null);

  const [activeLocationModal, setActiveLocationModal] = useState<'state' | 'district' | 'mandal' | 'city' | null>(null);

  // Snapshot of saved values — used to detect dirty/unsaved changes (Owner Profile pattern)
  const [savedSnapshot, setSavedSnapshot] = useState({
    state: existingProfile?.state || initialValidState,
    district: existingProfile?.district || '',
    mandal: existingProfile?.mandalOrMunicipality || '',
    city: existingProfile?.city || '',
    pinCode: existingProfile?.pinCode || '',
  });

  const hasUnsavedChanges =
    state !== savedSnapshot.state ||
    district !== savedSnapshot.district ||
    mandalOrMunicipality !== savedSnapshot.mandal ||
    city !== savedSnapshot.city ||
    pinCode !== savedSnapshot.pinCode;

  // 1. State Options
  const stateOptions: SelectorOption[] = useMemo(() => {
    return locationService.getStates().map((s) => ({
      id: s.name,
      label: s.name,
      secondaryLabel: `${locationService.getDistricts(s.code).length} Districts`,
      icon: <Building size={18} />,
    }));
  }, []);

  // 2. District Options (Cascades under State)
  const districtOptions: SelectorOption[] = useMemo(() => {
    if (!state) return [];
    return locationService.getDistricts(state).map((d) => ({
      id: d.districtName,
      label: d.districtName,
      secondaryLabel: `${locationService.getSubDistricts(d.districtCode).length} Mandals/Taluks`,
      icon: <Building2 size={18} />,
    }));
  }, [state]);

  // 3. Mandal Options (Cascades under District)
  const mandalOptions: SelectorOption[] = useMemo(() => {
    if (!district) return [];
    return locationService.getSubDistricts(district, state).map((m) => ({
      id: m.subDistrictName,
      label: m.subDistrictName,
      secondaryLabel: m.subDistrictType || 'Mandal',
      icon: <Landmark size={18} />,
    }));
  }, [state, district]);

  // Load localities whenever state, district, or mandal changes
  useEffect(() => {
    let isMounted = true;
    if (state && district && mandalOrMunicipality) {
      const distObj = locationService.getDistrict(state, district);
      if (distObj) {
        const subObj = locationService.getSubDistrict(distObj.districtCode, mandalOrMunicipality);
        if (subObj) {
          setLoadingVillages(true);
          locationService
            .getLocalities(distObj.districtCode, subObj.subDistrictCode)
            .then((list) => {
              if (isMounted) {
                setLocalities(list);
                setLoadingVillages(false);
              }
            })
            .catch(() => {
              if (isMounted) setLoadingVillages(false);
            });
          return () => {
            isMounted = false;
          };
        }
      }
    }
    setLocalities([]);
    setLoadingVillages(false);
    return () => {
      isMounted = false;
    };
  }, [state, district, mandalOrMunicipality]);

  // 4. City / Village Options (Cascades under Mandal)
  const villageOptions: SelectorOption[] = useMemo(() => {
    return localities
      .filter(
        (l) =>
          l.localityName.trim().toLowerCase() !== mandalOrMunicipality.trim().toLowerCase()
      )
      .map((l) => ({
        id: l.localityName,
        label: l.localityName,
        secondaryLabel: l.localityType ? `${l.localityType}` : undefined,
        icon: <Home size={18} />,
      }));
  }, [localities, mandalOrMunicipality]);

  // Auto-lookup postal pincode for village / mandal
  const resolvePinCodeForLocality = async (
    villageName: string,
    mandalName?: string,
    distName?: string
  ) => {
    if (!villageName) return;
    setLookingUpPin(true);
    try {
      // 1. Try postoffice by villageName
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
            setLookingUpPin(false);
            return match.Pincode;
          }
        }
      }
    } catch (err) {
      console.warn('Locality PIN lookup error:', err);
    }

    // 2. Fallback to Mandal post office if village has no post office
    if (mandalName && mandalName.toLowerCase() !== villageName.toLowerCase()) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(
          `https://api.postalpincode.in/postoffice/${encodeURIComponent(mandalName.trim())}`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0].PostOffice)) {
            const match =
              data[0].PostOffice.find(
                (p: any) => distName && p.District?.toLowerCase() === distName.toLowerCase()
              ) || data[0].PostOffice[0];
            if (match?.Pincode) {
              setPinCode(match.Pincode);
              setLookingUpPin(false);
              return match.Pincode;
            }
          }
        }
      } catch (err) {
        console.warn('Mandal PIN fallback error:', err);
      }
    }
    setLookingUpPin(false);
  };

  // Cascading Selection Handlers with Strict Reset
  const handleStateChange = (newState: string) => {
    setState(newState);
    setDistrict('');
    setMandalOrMunicipality('');
    setCity('');
    setPinCode('');
    setLocalities([]);
    setActiveLocationModal('district');
  };

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    setMandalOrMunicipality('');
    setCity('');
    setPinCode('');
    setLocalities([]);
    setActiveLocationModal('mandal');
  };

  const handleMandalSelect = (newMandal: string) => {
    setMandalOrMunicipality(newMandal);
    setCity('');
    setPinCode('');
    setLocalities([]);
    setActiveLocationModal('city');
  };

  /** Selects a locality, closes the picker, and resolves PIN code. */
  const handleCitySelect = (newCity: string) => {
    setCity(newCity);
    setActiveLocationModal(null);
    resolvePinCodeForLocality(newCity, mandalOrMunicipality, district);
  };

  // Compute safe public preview string
  const calculatePublicArea = useCallback(() => {
    const parts = [
      city.trim(),
      mandalOrMunicipality.trim() ? `${mandalOrMunicipality.trim()} (Mandal)` : '',
      district.trim(),
      state.trim(),
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Your Community Area';
  }, [city, district, mandalOrMunicipality, state]);

  // Handle successful detection from unified hook
  const handleLocationDetected = useCallback(async (result: LocationDetectionResult) => {
    const { geo, match, detectedState, detectedDistrict, detectedMandal, detectedCity, detectedPin } = result;

    setLatitude(geo.latitude);
    setLongitude(geo.longitude);

    // Resolve authoritative or detected values for all 4 primary levels:
    const effectiveState = match?.state?.name || detectedState || state || 'Andhra Pradesh';
    let effectiveDistrict = match?.district?.districtName || detectedDistrict || district;
    let effectiveMandal = match?.subDistrict?.subDistrictName || detectedMandal || mandalOrMunicipality;

    if (!effectiveDistrict) {
      const stateObj = locationService.getState(effectiveState);
      const dists = stateObj ? locationService.getDistricts(stateObj.code) : [];
      if (dists.length > 0) {
        effectiveDistrict = dists[0].districtName;
      } else {
        effectiveDistrict = 'Krishna';
      }
    }

    if (!effectiveMandal && effectiveDistrict) {
      const subs = locationService.getSubDistricts(effectiveDistrict, effectiveState);
      if (subs.length > 0) {
        effectiveMandal = subs[0].subDistrictName;
      } else {
        effectiveMandal = 'Vijayawada Urban';
      }
    }

    const candidateVillage =
      (detectedCity && detectedCity.toLowerCase() !== effectiveMandal.toLowerCase() ? detectedCity : '') ||
      (detectedMandal && detectedMandal.toLowerCase() !== effectiveMandal.toLowerCase() ? detectedMandal : '') ||
      '';

    const districtCode = match?.district?.districtCode || (effectiveDistrict ? locationService.getDistrict(effectiveState, effectiveDistrict)?.districtCode : undefined);
    const subDistrictCode = match?.subDistrict?.subDistrictCode || (districtCode && effectiveMandal ? locationService.getSubDistrict(districtCode, effectiveMandal)?.subDistrictCode : undefined);

    let finalCity = candidateVillage;

    if (!finalCity && match?.locality?.localityName && match.locality.localityName.trim().toLowerCase() !== effectiveMandal.trim().toLowerCase()) {
      finalCity = match.locality.localityName.trim();
    }

    if (!finalCity && detectedCity && detectedCity.trim().toLowerCase() !== effectiveMandal.trim().toLowerCase()) {
      finalCity = detectedCity.trim();
    }

    // Try finding a distinct locality from locationService for this district and subdistrict
    if (!finalCity && districtCode && subDistrictCode) {
      const localList = locationService.getLocalitiesSync(districtCode, subDistrictCode);
      const distinctLoc = localList.find((l) => l.localityName.trim().toLowerCase() !== effectiveMandal.trim().toLowerCase());
      if (distinctLoc) {
        finalCity = distinctLoc.localityName;
      }
    }

    if (!finalCity || finalCity.trim().toLowerCase() === effectiveMandal.trim().toLowerCase()) {
      finalCity = `${effectiveMandal} Central`;
    }

    // PIN code handling:
    let finalPin = detectedPin && /^\d{6}$/.test(detectedPin.trim()) ? detectedPin.trim() : '';

    // 1. POPULATE ALL 4 PRIMARY SQUARES IMMEDIATELY AND SYNCHRONOUSLY
    setState(effectiveState);
    setDistrict(effectiveDistrict);
    setMandalOrMunicipality(effectiveMandal);
    setCity(finalCity);
    if (finalPin) {
      setPinCode(finalPin);
      setLookingUpPin(false);
    } else if (finalCity || effectiveMandal) {
      resolvePinCodeForLocality(finalCity || effectiveMandal, effectiveMandal, effectiveDistrict);
    }
    setActiveLocationModal(null);

    // 2. Load dropdown localities in background (non-blocking)
    if (districtCode) {
      locationService
        .getLocalities(districtCode, subDistrictCode)
        .then((list) => {
          if (list && list.length > 0) {
            setLocalities(list);
          }
        })
        .catch((e) => console.warn('Non-blocking locality fetch notice:', e));
    }

    // Persist to local storage profile immediately so background sync never wipes values back to blank
    if (user) {
      const currentProf = existingProfile || storageService.getOwnerProfileByUserId(user.id, user.email);
      storageService.saveOwnerProfile({
        ...(currentProf || {}),
        id: user.id,
        userId: user.id,
        fullName: currentProf?.fullName || user.name || 'Pet Parent',
        phone: currentProf?.phone || user.phone || '',
        photo: (currentProf?.photo && isValidOwnerPhoto(currentProf.photo)) ? currentProf.photo : undefined,
        email: user.email,
        state: effectiveState,
        district: effectiveDistrict,
        mandalOrMunicipality: effectiveMandal,
        city: finalCity,
        streetOrLocality: normalizeToEnglishText(finalCity),
        street: normalizeToEnglishText(finalCity),
        pinCode: finalPin || currentProf?.pinCode || '',
        preferredContact: currentProf?.preferredContact || 'phone',
        hasLocationConsent: true,
        latitude: geo.latitude,
        longitude: geo.longitude,
        updatedAt: new Date().toISOString(),
      });
      setSavedSnapshot({
        state: effectiveState,
        district: effectiveDistrict,
        mandal: effectiveMandal,
        city: finalCity,
        pinCode: finalPin || currentProf?.pinCode || '',
      });
      refreshProgress();
      window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    window.setTimeout(() => {
      locationCardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);

    const accText = geo.accuracyMeters ? ` (±${Math.round(geo.accuracyMeters)}m)` : '';
    showToast(
      `🎯 Detected${accText}: ${finalCity || effectiveMandal}, ${effectiveDistrict}. All location squares populated!`,
      'success'
    );
  }, [
    state,
    district,
    mandalOrMunicipality,
    user,
    existingProfile,
    refreshProgress,
    resolvePinCodeForLocality,
    showToast,
  ]);

  const {
    detecting,
    showPermissionRationaleModal,
    setShowPermissionRationaleModal,
    showPermissionBlockedModal,
    setShowPermissionBlockedModal,
    showTurnOnModal,
    setShowTurnOnModal,
    triggerDetectLocation,
    handlePermissionRationaleContinue,
    handleOpenLocationSettings,
    cancelDetection,
  } = useLocationDetection({
    onSuccess: handleLocationDetected,
    onClearFieldsForNewDetection: () => {
      setPinConflictNote('');
    },
  });

  // User taps "Detect Location" or "Detect Location Again"
  const handleDetectClick = useCallback((_e?: React.SyntheticEvent) => {
    hasManuallyResetRef.current = false;
    triggerDetectLocation();
  }, [triggerDetectLocation]);

  const handleResetLocation = async () => {
    hasManuallyResetRef.current = true;
    cancelDetection();
    if (autoSyncTimerRef.current) {
      window.clearTimeout(autoSyncTimerRef.current);
      autoSyncTimerRef.current = null;
    }
    setState('');
    setDistrict('');
    setMandalOrMunicipality('');
    setCity('');
    setPinCode('');
    setLatitude(undefined);
    setLongitude(undefined);
    setLocalities([]);
    setPinConflictNote('');
    setActiveLocationModal(null);

    setSavedSnapshot({
      state: '',
      district: '',
      mandal: '',
      city: '',
      pinCode: '',
    });

    if (user && existingProfile) {
      storageService.saveOwnerProfile({
        ...existingProfile,
        state: '',
        district: '',
        mandalOrMunicipality: '',
        city: '',
        streetOrLocality: '',
        street: '',
        pinCode: '',
        latitude: undefined,
        longitude: undefined,
        approximateArea: '',
        subDistrictCode: undefined,
        localityCode: undefined,
        updatedAt: new Date().toISOString(),
      });
      refreshProgress();
      window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    showToast('Location fields have been reset. You can detect again or enter manually.', 'info');
  };

  // Sync / Save Location: Updates local storage and broadcasts to whole application
  const [syncing, setSyncing] = useState(false);

  const handleSyncLocation = useCallback(async (options?: { silent?: boolean; auto?: boolean }) => {
    if (!state.trim()) {
      if (!options?.silent) showToast('Please select your State.', 'warning');
      setActiveLocationModal('state');
      return;
    }
    if (!district.trim()) {
      if (!options?.silent) showToast('Please select your District.', 'warning');
      setActiveLocationModal('district');
      return;
    }
    if (!mandalOrMunicipality.trim()) {
      if (!options?.silent) showToast('Please select your Mandal / Taluk.', 'warning');
      setActiveLocationModal('mandal');
      return;
    }
    if (!city.trim() || city.trim().toLowerCase() === mandalOrMunicipality.trim().toLowerCase()) {
      if (!options?.silent) showToast('Please select your Home Base (City / Village).', 'warning');
      setActiveLocationModal('city');
      return;
    }

    if (!user) return;

    setSyncing(true);
    try {
      const distObj = locationService.getDistrict(state, district);
      const subObj = distObj
        ? locationService.getSubDistrict(distObj.districtCode, mandalOrMunicipality)
        : undefined;
      const locObj = localities.find(
        (l) => l.localityName.toLowerCase() === city.trim().toLowerCase()
      );

      const profile: OwnerProfile = {
        ...(existingProfile || {}),
        id: user.id,
        userId: user.id,
        fullName: existingProfile?.fullName || user.name || 'Pet Parent',
        phone: existingProfile?.phone || user.phone || '',
        photo: (existingProfile?.photo && isValidOwnerPhoto(existingProfile.photo)) ? existingProfile.photo : undefined,
        email: user.email,
        state: normalizeToEnglishText(state.trim()),
        district: normalizeToEnglishText(district.trim()),
        mandalOrMunicipality: normalizeToEnglishText(mandalOrMunicipality.trim()),
        city: normalizeToEnglishText(city.trim()),
        streetOrLocality: normalizeToEnglishText(city.trim()),
        street: normalizeToEnglishText(city.trim()),
        pinCode: pinCode.trim(),
        stateCode: distObj?.stateCode,
        districtCode: distObj?.districtCode,
        subDistrictCode: subObj?.subDistrictCode,
        localityCode: locObj?.localityCode,
        localityType: locObj?.localityType || 'VILLAGE',
        latitude,
        longitude,
        approximateArea: calculatePublicArea(),
        preferredContact: existingProfile?.preferredContact || 'phone',
        hasLocationConsent: true,
        updatedAt: new Date().toISOString(),
      };

      storageService.saveOwnerProfile(profile);
      refreshProgress();
      setActiveLocationModal(null);
      setSavedSnapshot({
        state: normalizeToEnglishText(state.trim()),
        district: normalizeToEnglishText(district.trim()),
        mandal: normalizeToEnglishText(mandalOrMunicipality.trim()),
        city: normalizeToEnglishText(city.trim()),
        pinCode: pinCode.trim(),
      });

      // Synchronize changes across active components & tabs
      window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
      window.dispatchEvent(new Event('storage'));

      if (!options?.silent) {
        showToast(
          options?.auto ? '✓ Location auto-synced with pet profile!' : '✓ Location synced with pet profile & alerts!',
          'success'
        );
      }
    } finally {
      setSyncing(false);
    }
  }, [
    calculatePublicArea,
    city,
    district,
    existingProfile,
    latitude,
    localities,
    longitude,
    mandalOrMunicipality,
    pinCode,
    refreshProgress,
    showToast,
    state,
    user,
  ]);

  useEffect(() => {
    if (autoSyncTimerRef.current) {
      window.clearTimeout(autoSyncTimerRef.current);
      autoSyncTimerRef.current = null;
    }

    const canAutoSync =
      user &&
      hasUnsavedChanges &&
      state.trim() &&
      district.trim() &&
      mandalOrMunicipality.trim() &&
      city.trim() &&
      city.trim().toLowerCase() !== mandalOrMunicipality.trim().toLowerCase();

    if (!canAutoSync) return;

    autoSyncTimerRef.current = window.setTimeout(() => {
      handleSyncLocation({ silent: true, auto: true });
    }, 650);

    return () => {
      if (autoSyncTimerRef.current) {
        window.clearTimeout(autoSyncTimerRef.current);
        autoSyncTimerRef.current = null;
      }
    };
  }, [user, hasUnsavedChanges, state, district, mandalOrMunicipality, city, pinCode, handleSyncLocation]);

  const isLocationValid = Boolean(
    state.trim() &&
    district.trim() &&
    mandalOrMunicipality.trim() &&
    city.trim() &&
    city.trim().toLowerCase() !== mandalOrMunicipality.trim().toLowerCase()
  );

  useEffect(() => {
    if (initialLocationActionScrollRef.current || !isLocationValid || detecting || activeLocationModal) return;

    const scrollTimer = window.setTimeout(() => {
      if (!locationCardsRef.current) return;
      initialLocationActionScrollRef.current = true;
      locationCardsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 2500);

    return () => window.clearTimeout(scrollTimer);
  }, [isLocationValid, detecting, activeLocationModal]);

  const handleProceedToPup = () => {
    if (isTransitioningBack || isTransitioningForward) return;
    if (!isLocationValid) {
      if (!state.trim()) {
        showToast('🔒 Location component is locked: State is mandatory before continuing.', 'warning');
        setActiveLocationModal('state');
      } else if (!district.trim()) {
        showToast('🔒 Location component is locked: District is mandatory before continuing.', 'warning');
        setActiveLocationModal('district');
      } else if (!mandalOrMunicipality.trim()) {
        showToast('🔒 Location component is locked: Mandal is mandatory before continuing.', 'warning');
        setActiveLocationModal('mandal');
      } else if (!city.trim() || city.trim().toLowerCase() === mandalOrMunicipality.trim().toLowerCase()) {
        showToast('🔒 Location component is locked: Home Base (Village / City) is mandatory before continuing.', 'warning');
        setActiveLocationModal('city');
      }
      return;
    }
    handleSyncLocation({ silent: true });
    setIsTransitioningForward(true);
  };

  const handleForwardTransitionComplete = () => {
    setIsTransitioningForward(false);
    if (onSuccess) {
      onSuccess();
    } else {
      setActiveOnboardingTab('choice');
      navigate('/choice');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleBack = () => {
    if (isTransitioningBack || isTransitioningForward) return;
    setIsTransitioningBack(true);
  };

  const handleBackTransitionComplete = () => {
    setIsTransitioningBack(false);
    if (onBack) {
      onBack();
    } else {
      setActiveOnboardingTab('owner');
      navigate('/owner');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleExitToDashboard = () => {
    if (!isLocationValid) {
      showToast('🔒 Location component is locked. Please complete State, District, Mandal, and Home Base before exiting to another component.', 'warning');
      if (!state.trim()) {
        setActiveLocationModal('state');
      } else if (!district.trim()) {
        setActiveLocationModal('district');
      } else if (!mandalOrMunicipality.trim()) {
        setActiveLocationModal('mandal');
      } else if (!city.trim() || city.trim().toLowerCase() === mandalOrMunicipality.trim().toLowerCase()) {
        setActiveLocationModal('city');
      }
      return;
    }
    setActiveOnboardingTab('dashboard');
    navigate('/homepage');
  };

  return (
    <div className="onboarding-page-container">
      <div className="onboarding-card-wrapper">
        <div className="card onboarding-card location-onboarding-card">
          <div className="onboarding-top-nav-row">
            <div className="onboarding-top-nav-left">
              <BackButton
                onClick={handleBack}
                title="Go back to Owner Profile"
                aria-label="Back to Owner Profile"
              />
            </div>
            <div className="section-card-title-block onboarding-top-nav-title">
              <h1>Location</h1>
            </div>
            <button
              type="button"
              className="onboarding-exit-btn onboarding-top-nav-close"
              onClick={handleExitToDashboard}
              aria-label="Exit location and go to dashboard"
              title="Exit to dashboard"
            >
              <X size={19} />
            </button>
          </div>
          <div className="location-profile-header">
            <div className="location-header-actions">
              <button
                type="button"
                onClick={handleDetectClick}
                disabled={detecting}
                className="btn btn-primary btn-lg location-detect-primary-btn"
              >
                {detecting ? (
                  <>
                    <RefreshCw size={18} className="spin" />
                    <span>Detecting Location...</span>
                  </>
                ) : (
                  <>
                    <Navigation size={18} />
                    <span>{hasAnyLocationData ? 'Detect Location Again' : 'Detect Location'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleResetLocation}
                disabled={syncing}
                className="btn btn-outline btn-lg location-reset-btn"
              >
                <RefreshCw size={16} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* MAIN VIEW: 2×2 LOCATION GRID */}
          <div className="loc-grid-showcase" ref={locationCardsRef}>
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

              {/* 4. HOME BASE SQUARE */}
              <button
                type="button"
                className="loc-grid-square loc-gsq-home"
                onClick={() => setActiveLocationModal('city')}
                title="Click to select Home Base (City / Village)"
              >
                <div className="loc-gsq-top">
                  <div className="loc-gsq-icon">
                    <Home size={20} />
                  </div>
                  <span className="loc-gsq-label">Village / Home Base</span>
                </div>
                <div className="loc-gsq-value-wrap">
                  <strong className="loc-gsq-value">
                    {city || <span className="loc-gsq-placeholder">Select Village</span>}
                  </strong>
                  <span className="loc-gsq-pin-btn">
                    {loadingVillages
                      ? 'Loading home bases...'
                      : lookingUpPin
                        ? 'Resolving PIN...'
                        : pinCode
                          ? `PIN ${pinCode}`
                          : 'PIN appears after selection'}
                  </span>
                </div>
              </button>
            </div>

            {pinConflictNote && (
              <div
                style={{
                  margin: '0.25rem 0.5rem 0',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.78rem',
                  color: '#B45309',
                  background: 'rgba(254, 243, 199, 0.12)',
                  border: '1px solid rgba(253, 230, 138, 0.3)',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                ℹ️ {pinConflictNote}
              </div>
            )}

            {/* BOTTOM ACTIONS & SYNC */}
            <div className="loc-grid-footer">
              {hasUnsavedChanges && (
                <div className="loc-sync-pending-badge">
                  <RefreshCw size={13} className={syncing ? 'spin' : ''} />
                  <span>{syncing ? 'Auto syncing location...' : 'Location changes save automatically'}</span>
                </div>
              )}

              <div className="showcase-action-buttons">
                {hasUnsavedChanges ? (
                  <>
                    <button
                      type="button"
                      onClick={handleProceedToPup}
                      disabled={!isLocationValid}
                      className="btn btn-primary btn-lg continue-to-pup-btn"
                      title={isLocationValid ? 'Continue to Pet Choice' : '🔒 Location component is locked: Please complete State, District, Mandal, and Home Base'}
                      style={!isLocationValid ? { opacity: 0.65, cursor: 'not-allowed' } : {}}
                    >
                      <span>Continue to Pet Choice</span>
                      <ArrowRight size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="sync-secondary-btn location-auto-synced-pill" title="Location is saved automatically.">
                      <Check size={15} />
                      <span>Location Synced</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleProceedToPup}
                      disabled={!isLocationValid}
                      className="btn btn-primary btn-lg continue-to-pup-btn"
                      title={isLocationValid ? 'Continue to Pet Choice' : '🔒 Location component is locked: Please complete State, District, Mandal, and Home Base'}
                      style={!isLocationValid ? { opacity: 0.65, cursor: 'not-allowed' } : {}}
                    >
                      <span>Continue to Pet Choice</span>
                      <ArrowRight size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PetProfileSelector
        isOpen={activeLocationModal === 'state'}
        onClose={() => setActiveLocationModal(null)}
        title="Select State"
        options={stateOptions}
        selectedValue={state}
        onSelect={handleStateChange}
        searchable
        searchPlaceholder="Search state..."
        closeOnSelect={false}
      />

      <PetProfileSelector
        isOpen={activeLocationModal === 'district'}
        onClose={() => setActiveLocationModal(null)}
        title="Select District"
        options={districtOptions}
        selectedValue={district}
        onSelect={handleDistrictChange}
        searchable
        searchPlaceholder={state ? 'Search district...' : 'Select state first'}
        closeOnSelect={false}
      />

      <PetProfileSelector
        isOpen={activeLocationModal === 'mandal'}
        onClose={() => setActiveLocationModal(null)}
        title="Select Mandal"
        options={mandalOptions}
        selectedValue={mandalOrMunicipality}
        onSelect={handleMandalSelect}
        searchable
        searchPlaceholder={district ? 'Search mandal...' : 'Select district first'}
        closeOnSelect={false}
      />

      <PetProfileSelector
        isOpen={activeLocationModal === 'city'}
        onClose={() => setActiveLocationModal(null)}
        title="Select Village / Home Base"
        options={villageOptions}
        selectedValue={city}
        onSelect={handleCitySelect}
        searchable
        searchPlaceholder={mandalOrMunicipality ? 'Search village...' : 'Select mandal first'}
      />

      {/* 1. Turn On Location Modal (when device location is turned off) */}
      <PermissionRationaleModal
        isOpen={showTurnOnModal}
        title="Turn On Location / లొకేషన్ ఆన్ చేయండి"
        message="Location is turned off on your device. Turn it on to find your area automatically."
        continueLabel="Open Settings"
        cancelLabel="Not Now"
        onCancel={() => setShowTurnOnModal(false)}
        onContinue={handleOpenLocationSettings}
      />

      {/* 2. In-App Pre-Permission Rationale Modal (Capture Pet camera pattern) */}
      <PermissionRationaleModal
        isOpen={showPermissionRationaleModal}
        title="Location Access / లొకేషన్ వివరాలు"
        message="Location access is needed to detect your State, District, Mandal, and Home Base automatically. Your exact coordinates are never publicly shown."
        continueLabel="Continue"
        cancelLabel="Not Now"
        onCancel={() => setShowPermissionRationaleModal(false)}
        onContinue={handlePermissionRationaleContinue}
      />

      {/* 3. In-App Permission Blocked Modal (Direct link to location settings) */}
      <PermissionRationaleModal
        isOpen={showPermissionBlockedModal}
        title="Location Access Needed"
        message="Location access is needed. Please ensure location is turned on in your device settings to detect your area automatically."
        continueLabel="Open Settings"
        cancelLabel="Enter Location Manually"
        onCancel={() => {
          setShowPermissionBlockedModal(false);
          if (!state) setActiveLocationModal('state');
        }}
        onContinue={handleOpenLocationSettings}
      />

      {/* 4. Outside Delivery Area Modal (No dead-end error) */}
      <PermissionRationaleModal
        isOpen={showOutsideDeliveryModal}
        title="We don't deliver to this area yet"
        message="We don't deliver to this area yet. You can enter your location manually or try detecting your location again."
        continueLabel="Detect Location Again"
        cancelLabel="Enter Location Manually"
        onCancel={() => {
          setShowOutsideDeliveryModal(false);
          setActiveLocationModal('state');
        }}
        onContinue={() => {
          setShowOutsideDeliveryModal(false);
          triggerDetectLocation({ bypassRationale: true });
        }}
      />



      {isTransitioningBack && (
        <VillageDogTransition
          direction="backward"
          fromStep="Location"
          toStep="Owner Profile"
          durationMs={1100}
          onComplete={handleBackTransitionComplete}
        />
      )}

      {isTransitioningForward && (
        <VillageDogTransition
          direction="forward"
          fromStep="Location"
          toStep="Pet Choice"
          durationMs={1600}
          onComplete={handleForwardTransitionComplete}
        />
      )}
    </div>
  );
};
