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

/** Keep saved streets readable without displaying machine-generated Plus Codes. */
const cleanSavedStreet = (value?: string) => {
  if (!value || /^[A-Z0-9]{2,8}\+[A-Z0-9]{2,}/i.test(value.trim())) return '';
  return normalizeToEnglishText(value.trim());
};

/** Supports manual or detected owner-location entry with separate state, district, mandal, and locality fields. */
export const Location: React.FC<LocationProps> = ({
  onSuccess,
  onBack,
}) => {
  const { user, hasCompletedLocation, refreshProgress, setActiveOnboardingTab } = useAuth();
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

  // Storage returns a newly parsed object. Keep hydration stable until its contents change.
  const profileJson = JSON.stringify(user ? storageService.getOwnerProfileByUserId(user.id, user.email) || null : null);
  const existingProfile = useMemo<OwnerProfile | null>(() => JSON.parse(profileJson), [profileJson]);
  const hasExistingData = !!(existingProfile && (existingProfile.district || existingProfile.city));

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
  const [city, setCity] = useState<string>(
    savedCity && savedCity.toLowerCase() !== savedMandal.toLowerCase() ? savedCity : ''
  );
  const [streetOrLocality, setStreetOrLocality] = useState<string>(
    cleanSavedStreet(existingProfile?.streetOrLocality || (existingProfile as any)?.street)
  );
  const [pinCode, setPinCode] = useState(existingProfile?.pinCode || '');
  const [latitude, setLatitude] = useState<number | undefined>(existingProfile?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(existingProfile?.longitude);

  const [savedSnapshot, setSavedSnapshot] = useState({
    state: existingProfile?.state || initialValidState,
    district: existingProfile?.district || '',
    mandal: existingProfile?.mandalOrMunicipality || '',
    city: existingProfile?.city || '',
    street: existingProfile?.streetOrLocality || existingProfile?.street || '',
    pinCode: existingProfile?.pinCode || '',
  });

  const [showOutsideDeliveryModal, setShowOutsideDeliveryModal] = useState(false);
  const hasManuallyResetRef = useRef(false);
  const hasEditedLocationRef = useRef(false);
  const autoDetectAttemptedRef = useRef(false);
  const pinLookupIdRef = useRef(0);

  // Redirect to Owner Profile if owner profile components (Photo, Name, Phone) are not yet complete
  useEffect(() => {
    if (user && !storageService.hasCompletedOwnerProfile(user.id, user.email)) {
      showToast('⚠️ Please complete your Owner Profile first (Photo, Name, and Phone are mandatory).', 'warning');
      navigate('/owner', { replace: true });
    }
  }, [user, navigate, showToast]);

  // Auto-populate when profile data arrives from cloud/Firestore (unless user manually clicked reset)
  useEffect(() => {
    if (hasManuallyResetRef.current || hasEditedLocationRef.current) return;
    if (existingProfile) {
      const rawStreet = existingProfile.streetOrLocality || (existingProfile as any).street || '';
      const pStreet = cleanSavedStreet(rawStreet);
      const nextState = normalizeToEnglishText(existingProfile.state || '');
      const nextDistrict = normalizeToEnglishText(existingProfile.district || '');
      const nextMandal = normalizeToEnglishText(existingProfile.mandalOrMunicipality || '');
      const rawCity = normalizeToEnglishText(existingProfile.city || '');
      const nextCity = rawCity.trim().toLowerCase() !== nextMandal.trim().toLowerCase() ? rawCity : '';
      setState(nextState);
      setDistrict(nextDistrict);
      setMandalOrMunicipality(nextMandal);
      setCity(nextCity);
      setStreetOrLocality(pStreet);
      setPinCode(existingProfile.pinCode || '');
      setLatitude(existingProfile.latitude);
      setLongitude(existingProfile.longitude);
      setSavedSnapshot({ state: nextState, district: nextDistrict, mandal: nextMandal,
        city: nextCity, street: pStreet, pinCode: existingProfile.pinCode || '' });
    }
  }, [existingProfile]);

  // Ensure current street is always in English if non-Latin script was present
  useEffect(() => {
    if (streetOrLocality && hasNonLatinScript(streetOrLocality)) {
      setStreetOrLocality(normalizeToEnglishText(streetOrLocality));
    }
  }, [streetOrLocality]);

  // Dynamic localities loaded for currently selected district and mandal
  const [localities, setLocalities] = useState<LocationLocality[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Dynamic reactive check: Has location data been saved or loaded?
  const hasSavedLocation = Boolean(
    hasCompletedLocation ||
    (existingProfile && (existingProfile.district || existingProfile.city)) ||
    (district && (mandalOrMunicipality || city))
  );

  // UI Flow States
  const [hasDetected, setHasDetected] = useState<boolean>(hasExistingData || hasSavedLocation);
  const [pinConflictNote, setPinConflictNote] = useState<string>('');
  const [lookingUpPin, setLookingUpPin] = useState(false);
  const locationCardsRef = useRef<HTMLDivElement | null>(null);
  const initialLocationActionScrollRef = useRef(false);
  const autoSyncTimerRef = useRef<number | null>(null);

  const [activeLocationModal, setActiveLocationModal] = useState<'state' | 'district' | 'mandal' | 'city' | null>(null);

  const hasUnsavedChanges =
    state !== savedSnapshot.state ||
    district !== savedSnapshot.district ||
    mandalOrMunicipality !== savedSnapshot.mandal ||
    city !== savedSnapshot.city ||
    streetOrLocality !== savedSnapshot.street ||
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
  const resolvePinCodeForLocality = useCallback(async (
    villageName: string,
    mandalName?: string,
    distName?: string
  ) => {
    if (!villageName) return;
    const lookupId = ++pinLookupIdRef.current;
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
        if (lookupId !== pinLookupIdRef.current) return;
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
    if (lookupId !== pinLookupIdRef.current) return;

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
          if (lookupId !== pinLookupIdRef.current) return;
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
    if (lookupId === pinLookupIdRef.current) setLookingUpPin(false);
  }, []);

  const beginLocationEdit = () => {
    hasEditedLocationRef.current = true;
    autoDetectAttemptedRef.current = true;
    pinLookupIdRef.current++;
    setLookingUpPin(false);
    cancelDetection();
  };

  // Cascading Selection Handlers with Strict Reset
  const handleStateChange = (newState: string) => {
    beginLocationEdit();
    setStreetOrLocality('');
    setLatitude(undefined);
    setLongitude(undefined);
    setState(newState);
    setDistrict('');
    setMandalOrMunicipality('');
    setCity('');
    setPinCode('');
    setLocalities([]);
    setActiveLocationModal('district');
  };

  const handleDistrictChange = (newDistrict: string) => {
    beginLocationEdit();
    setStreetOrLocality('');
    setLatitude(undefined);
    setLongitude(undefined);
    setDistrict(newDistrict);
    setMandalOrMunicipality('');
    setCity('');
    setPinCode('');
    setLocalities([]);
    setActiveLocationModal('mandal');
  };

  const handleMandalSelect = (newMandal: string) => {
    beginLocationEdit();
    setStreetOrLocality('');
    setLatitude(undefined);
    setLongitude(undefined);
    setMandalOrMunicipality(newMandal);
    setCity('');
    setPinCode('');
    setLocalities([]);
    setActiveLocationModal('city');
  };

  /** Selects a locality, closes the picker, and resolves its PIN code. */
  const handleCitySelect = (newCity: string) => {
    beginLocationEdit();
    setLatitude(undefined);
    setLongitude(undefined);
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
  const handleLocationDetected = useCallback((result: LocationDetectionResult) => {
    const { geo, match, detectedState, detectedDistrict, detectedMandal, detectedCity, detectedStreet, detectedPin } = result;

    setLatitude(geo.latitude);
    setLongitude(geo.longitude);

    hasEditedLocationRef.current = true;
    hasManuallyResetRef.current = false;
    // Keep unresolved levels editable; never substitute an arbitrary district or village.
    const effectiveState = match?.state?.name || detectedState;
    const effectiveDistrict = match?.district?.districtName || detectedDistrict;
    const effectiveMandal = match?.subDistrict?.subDistrictName || detectedMandal;
    const finalCity = [detectedCity, match?.locality?.localityName || ''].find(
      (value) => value.trim() && value.trim().toLowerCase() !== effectiveMandal.trim().toLowerCase()
    ) || '';

    // PIN code handling:
    const finalPin = detectedPin && /^\d{6}$/.test(detectedPin.trim()) ? detectedPin.trim() : '';

    // Only set street if it doesn't look like a Plus Code and was actually detected
    const PLUS_CODE_RE = /^[A-Z0-9]{2,8}\+[A-Z0-9]{2,}/i;
    const cleanStreet = detectedStreet && !PLUS_CODE_RE.test(detectedStreet.trim()) ? detectedStreet : '';
    const resolvedStreet = cleanStreet;

    // 1. POPULATE ALL 4 PRIMARY SQUARES IMMEDIATELY AND SYNCHRONOUSLY
    setState(effectiveState);
    setDistrict(effectiveDistrict);
    setMandalOrMunicipality(effectiveMandal);
    setCity(finalCity);
    setStreetOrLocality(normalizeToEnglishText(resolvedStreet));
    setPinCode(finalPin);
    if (finalPin) {
      setLookingUpPin(false);
    } else if (finalCity || effectiveMandal) {
      resolvePinCodeForLocality(finalCity || effectiveMandal, effectiveMandal, effectiveDistrict);
    }
    setHasDetected(true);
    setActiveLocationModal(null);

    // The selection effect loads localities with a stale-result guard.

    // Persist to local storage profile immediately so background sync never wipes values back to blank
    if (user) {
      const currentProf = storageService.getOwnerProfileByUserId(user.id, user.email);
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
        streetOrLocality: normalizeToEnglishText(resolvedStreet),
        street: normalizeToEnglishText(resolvedStreet),
        pinCode: finalPin,
        stateCode: match?.state.code,
        districtCode: match?.district.districtCode,
        subDistrictCode: match?.subDistrict?.subDistrictCode,
        localityCode: match?.locality?.localityCode === 999999 ? undefined : match?.locality?.localityCode,
        approximateArea: [finalCity, effectiveMandal, effectiveDistrict, effectiveState].filter(Boolean).join(', '),
        preferredContact: currentProf?.preferredContact || 'phone',
        hasLocationConsent: true,
        latitude: geo.latitude,
        longitude: geo.longitude,
        updatedAt: new Date().toISOString(),
      });
      refreshProgress();
      window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    window.setTimeout(() => {
      locationCardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);

    const isFallback = geo.confidenceReason?.includes('Fallback') || geo.source === 'ip';
    if (isFallback) {
      showToast('⚠️ Could not detect exact GPS coordinates. Loaded default area cards. Please verify details.', 'warning');
    } else {
      const accText = geo.accuracyMeters ? ` (±${Math.round(geo.accuracyMeters)}m)` : '';
      const complete = Boolean(effectiveState && effectiveDistrict && effectiveMandal && finalCity);
      showToast(complete
        ? `🎯 Location detected${accText}. Please verify the four cards below.`
        : 'Location detected partially. Select the missing State, District, Mandal, or Home Base below.',
      complete ? 'success' : 'info');
    }
  }, [
    user,
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
    hasEditedLocationRef.current = true;
    autoDetectAttemptedRef.current = true;
    hasManuallyResetRef.current = false;
    pinLookupIdRef.current++;
    setLookingUpPin(false);
    triggerDetectLocation();
  }, [triggerDetectLocation]);

  useEffect(() => {
    if (!user || autoDetectAttemptedRef.current || hasEditedLocationRef.current || activeLocationModal) return;
    if (state && district && mandalOrMunicipality && city) return;
    if (!storageService.hasCompletedOwnerProfile(user.id, user.email)) return;
    // Deferring lets hydration and StrictMode's effect replay settle before requesting permission.
    const timer = window.setTimeout(() => {
      autoDetectAttemptedRef.current = true;
      hasEditedLocationRef.current = true;
      triggerDetectLocation();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [user, state, district, mandalOrMunicipality, city, activeLocationModal, triggerDetectLocation]);

  const handleResetLocation = async () => {
    hasManuallyResetRef.current = true;
    hasEditedLocationRef.current = true;
    autoDetectAttemptedRef.current = true;
    pinLookupIdRef.current++;
    setLookingUpPin(false);
    cancelDetection();
    if (autoSyncTimerRef.current) {
      window.clearTimeout(autoSyncTimerRef.current);
      autoSyncTimerRef.current = null;
    }
    setState('');
    setDistrict('');
    setMandalOrMunicipality('');
    setCity('');
    setStreetOrLocality('');
    setPinCode('');
    setLatitude(undefined);
    setLongitude(undefined);
    setLocalities([]);
    setPinConflictNote('');
    setHasDetected(false);
    setActiveLocationModal(null);

    setSavedSnapshot({
      state: '',
      district: '',
      mandal: '',
      city: '',
      street: '',
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
        stateCode: undefined,
        districtCode: undefined,
        updatedAt: new Date().toISOString(),
      });
      refreshProgress();
      window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    triggerDetectLocation();
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
        streetOrLocality: normalizeToEnglishText(streetOrLocality.trim()),
        street: normalizeToEnglishText(streetOrLocality.trim()),
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
        street: normalizeToEnglishText(streetOrLocality.trim()),
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
    streetOrLocality,
    user,
  ]);

  useEffect(() => {
    if (autoSyncTimerRef.current) {
      window.clearTimeout(autoSyncTimerRef.current);
      autoSyncTimerRef.current = null;
    }

    const canAutoSync =
      user &&
      !detecting &&
      hasUnsavedChanges &&
      state.trim() &&
      district.trim() &&
      mandalOrMunicipality.trim() &&
      city.trim() && city.trim().toLowerCase() !== mandalOrMunicipality.trim().toLowerCase();

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
  }, [user, detecting, hasUnsavedChanges, state, district, mandalOrMunicipality, city, pinCode, handleSyncLocation]);

  const isLocationValid = Boolean(
    state.trim() &&
    district.trim() &&
    mandalOrMunicipality.trim() &&
    city.trim() && city.trim().toLowerCase() !== mandalOrMunicipality.trim().toLowerCase()
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
      showToast('Please select State, District, Mandal, and Home Base before continuing.', 'warning');
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
    setActiveOnboardingTab('dashboard');
    navigate('/dashboard');
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
                    <span>{hasDetected || hasSavedLocation ? 'Detect Location Again' : 'Detect Location'}</span>
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
                onClick={() => { beginLocationEdit(); setActiveLocationModal('state'); }}
                title="Click to change State"
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
                onClick={() => { beginLocationEdit(); setActiveLocationModal('district'); }}
                title="Click to change District"
              >
                <div className="loc-gsq-top">
                  <div className="loc-gsq-icon">
                    <Building2 size={20} />
                  </div>
                  <span className="loc-gsq-label">District</span>
                </div>
                <div className="loc-gsq-value-wrap">
                  <strong className="loc-gsq-value">{district || <span className="loc-gsq-placeholder">Select District</span>}</strong>
                </div>
              </button>

              {/* 3. MANDAL SQUARE */}
              <button
                type="button"
                className="loc-grid-square loc-gsq-mandal"
                onClick={() => { beginLocationEdit(); setActiveLocationModal('mandal'); }}
                title="Click to change Mandal"
              >
                <div className="loc-gsq-top">
                  <div className="loc-gsq-icon">
                    <MapPin size={20} />
                  </div>
                  <span className="loc-gsq-label">Mandal</span>
                </div>
                <div className="loc-gsq-value-wrap">
                  <strong className="loc-gsq-value">{mandalOrMunicipality || <span className="loc-gsq-placeholder">Select Mandal</span>}</strong>
                </div>
              </button>

              {/* 4. HOME BASE SQUARE */}
              <button
                type="button"
                className="loc-grid-square loc-gsq-home"
                onClick={() => { beginLocationEdit(); setActiveLocationModal('city'); }}
                title="Click to change Home Base (City / Village)"
              >
                <div className="loc-gsq-top">
                  <div className="loc-gsq-icon">
                    <Home size={20} />
                  </div>
                  <span className="loc-gsq-label">Village / Home Base</span>
                </div>
                <div className="loc-gsq-value-wrap">
                  <strong className="loc-gsq-value">{city || <span className="loc-gsq-placeholder">Select Village</span>}</strong>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', padding: '0.75rem 0.25rem 0' }}>
              {/* 5. STREET / LOCALITY SQUARE */}
              <div
                className="loc-grid-square loc-gsq-street"
                style={{ cursor: 'text' }}
              >
                <div className="loc-gsq-top">
                  <div className="loc-gsq-icon">
                    <MapPin size={20} />
                  </div>
                  <span className="loc-gsq-label">Street / Precise Area</span>
                </div>
                <div className="loc-gsq-value-wrap" style={{ width: '100%' }}>
                  <input
                    type="text"
                    value={streetOrLocality}
                    onChange={(e) => { beginLocationEdit(); setStreetOrLocality(e.target.value); }}
                    onBlur={() => {
                      if (hasNonLatinScript(streetOrLocality)) {
                        setStreetOrLocality(normalizeToEnglishText(streetOrLocality));
                      }
                    }}
                    placeholder="Enter street or auto-detect"
                    className="loc-gsq-value"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      width: '100%',
                      outline: 'none',
                      padding: 0,
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}
                  />
                  <span className="loc-gsq-pin-btn" style={{ cursor: 'text' }}>
                    {streetOrLocality ? 'Editable street / colony' : 'Auto-detected or type street'}
                  </span>
                </div>
              </div>
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
                      title={isLocationValid ? 'Continue to Pet Details' : 'Please select State, District, Mandal, and Home Base'}
                      style={!isLocationValid ? { opacity: 0.65, cursor: 'not-allowed' } : {}}
                    >
                      <span>Continue to Pet Details</span>
                      <ArrowRight size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="sync-secondary-btn location-auto-synced-pill" title="Complete all four fields to save your location.">
                      <Check size={15} />
                      <span>{isLocationValid ? 'Location Saved' : 'Select your location'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleProceedToPup}
                      disabled={!isLocationValid}
                      className="btn btn-primary btn-lg continue-to-pup-btn"
                      title={isLocationValid ? 'Continue to Pet Details' : 'Please select State, District, Mandal, and Home Base'}
                      style={!isLocationValid ? { opacity: 0.65, cursor: 'not-allowed' } : {}}
                    >
                      <span>Continue to Pet Details</span>
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
        message="Allow location access for FindLostPuppy in your app or browser permissions, then try detecting again."
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
