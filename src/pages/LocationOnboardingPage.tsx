import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
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
import { PermissionRationaleModal } from '../components/PermissionRationaleModal';
import type { OwnerProfile, LocationLocality } from '../types';
import { isPetPhotoUrl } from '../utils/dogPhotoHelper';
import { detectResilientLocation } from '../utils/geolocationHelper';

interface LocationOnboardingPageProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export const LocationOnboardingPage: React.FC<LocationOnboardingPageProps> = ({
  onSuccess,
  onBack,
}) => {
  const { user, hasCompletedLocation, refreshProgress, setActiveOnboardingTab } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

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
  // Google Plus Code filter — these are machine-generated Open Location Codes, not street names
  const PLUS_CODE_RE = /^[A-Z0-9]{2,8}\+[A-Z0-9]{2,}/i;
  const cleanSavedStreet = (v?: string) =>
    v && !PLUS_CODE_RE.test(v.trim()) ? v.trim() : '';

  const [streetOrLocality, setStreetOrLocality] = useState<string>(
    cleanSavedStreet(existingProfile?.streetOrLocality || (existingProfile as any)?.street)
  );
  const [pinCode, setPinCode] = useState(existingProfile?.pinCode || '');
  const [latitude, setLatitude] = useState<number | undefined>(existingProfile?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(existingProfile?.longitude);

  const hasManuallyResetRef = useRef(false);

  // Auto-populate when profile data arrives from cloud/Firestore (unless user manually clicked reset)
  useEffect(() => {
    if (hasManuallyResetRef.current) return;
    if (existingProfile) {
      const rawStreet = existingProfile.streetOrLocality || (existingProfile as any).street || '';
      // Strip Plus Codes from previously saved street values
      const PLUS_CODE_RE = /^[A-Z0-9]{2,8}\+[A-Z0-9]{2,}/i;
      const pStreet = rawStreet && !PLUS_CODE_RE.test(rawStreet.trim()) ? rawStreet.trim() : '';
      if (!streetOrLocality && pStreet) {
        setStreetOrLocality(pStreet);
      }
      if (!state && existingProfile.state) setState(existingProfile.state);
      if (!district && existingProfile.district) setDistrict(existingProfile.district);
      if (!mandalOrMunicipality && existingProfile.mandalOrMunicipality) {
        setMandalOrMunicipality(existingProfile.mandalOrMunicipality);
      }
      if (
        !city &&
        existingProfile.city &&
        existingProfile.city.trim().toLowerCase() !==
          (existingProfile.mandalOrMunicipality || '').trim().toLowerCase()
      ) {
        setCity(existingProfile.city.trim());
      }
      if (!pinCode && existingProfile.pinCode) setPinCode(existingProfile.pinCode);
    }
  }, [existingProfile]);

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
  const [detecting, setDetecting] = useState(false);
  const [showLocationRationale, setShowLocationRationale] = useState(false);
  const [showGpsOffModal, setShowGpsOffModal] = useState(false);
  const [showPermissionDeniedDialog, setShowPermissionDeniedDialog] = useState(false);
  const [lookingUpPin, setLookingUpPin] = useState(false);
  const isDetectingRef = useRef(false);
  const autoSyncTimerRef = useRef<number | null>(null);

  const [activeLocationModal, setActiveLocationModal] = useState<'state' | 'district' | 'mandal' | 'city' | null>(null);

  // Snapshot of saved values — used to detect dirty/unsaved changes (Owner Profile pattern)
  const [savedSnapshot, setSavedSnapshot] = useState({
    state: existingProfile?.state || initialValidState,
    district: existingProfile?.district || '',
    mandal: existingProfile?.mandalOrMunicipality || '',
    city: existingProfile?.city || '',
    street: existingProfile?.streetOrLocality || (existingProfile as any)?.street || '',
    pinCode: existingProfile?.pinCode || '',
  });

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
  const resolvePinCodeForLocality = async (
    villageName: string,
    mandalName?: string,
    distName?: string
  ) => {
    if (!villageName) return;
    setLookingUpPin(true);
    try {
      // 1. Try postoffice by villageName
      const res = await fetch(
        `https://api.postalpincode.in/postoffice/${encodeURIComponent(villageName.trim())}`
      );
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
        const res = await fetch(
          `https://api.postalpincode.in/postoffice/${encodeURIComponent(mandalName.trim())}`
        );
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

  const handleCitySelect = (newCity: string) => {
    setCity(newCity);
    // Only auto-fill street if there is no human-readable street already
    // (and the existing value is not a Plus Code which we should treat as empty)
    const PLUS_CODE_RE = /^[A-Z0-9]{2,8}\+[A-Z0-9]{2,}/i;
    const currentStreet = streetOrLocality.trim();
    if (!currentStreet || PLUS_CODE_RE.test(currentStreet)) {
      setStreetOrLocality(`${newCity} Main Road`);
    }
    setActiveLocationModal(null);
    resolvePinCodeForLocality(newCity, mandalOrMunicipality, district);
  };

  // Compute safe public preview string
  const calculatePublicArea = useCallback(() => {
    const parts = [
      streetOrLocality.trim(),
      city.trim(),
      mandalOrMunicipality.trim() ? `${mandalOrMunicipality.trim()} (Mandal)` : '',
      district.trim(),
      state.trim(),
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Your Community Area';
  }, [city, district, mandalOrMunicipality, state, streetOrLocality]);

  // Direct native location detector
  const handleDetectClick = () => {
    setShowLocationRationale(true);
  };

  const handleLocationRationaleContinue = () => {
    setShowLocationRationale(false);
    executeDetectLocation();
  };

  const handleResetLocation = () => {
    hasManuallyResetRef.current = true;
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
    setDetecting(false);

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

    showToast('Location fields reset. Choose manually or detect again.', 'info');
  };

  // Hardware GPS & Native Geolocation Detection
  const executeDetectLocation = async () => {
    hasManuallyResetRef.current = false;
    if (isDetectingRef.current) return;
    isDetectingRef.current = true;
    setDetecting(true);
    setPinConflictNote('');

    try {
      const geo = await detectResilientLocation();

      // Low-confidence IP fallback requires manual verification
      if (geo.source === 'ip') {
        setHasDetected(true);
        setActiveLocationModal('district');
        showToast('Approximate location only. Tap District & Mandal below to confirm.', 'info');
        return;
      }

      setLatitude(geo.latitude);
      setLongitude(geo.longitude);

      const detectedState = geo.state || state;
      const rawDistrict = geo.district || district;
      const detectedMandal = geo.mandal || mandalOrMunicipality;
      const detectedCity = geo.city || city;
      const detectedStreet = geo.street || streetOrLocality || (detectedCity ? `${detectedCity} Main Road` : '');
      const detectedPin = geo.pinCode || pinCode;

      const match = await locationService.matchLocation({
        state: detectedState,
        district: rawDistrict,
        mandal: detectedMandal,
        locality: detectedCity,
        pinCode: detectedPin,
        stateCode: geo.stateCode,
        districtCode: geo.districtCode,
        subDistrictCode: geo.subDistrictCode,
      });

      if (match && match.state && match.district && match.subDistrict) {
        // If geocoder detected a specific village/city use it; otherwise leave blank so user picks it.
        // NEVER set city = mandal name — that causes village and mandal squares to show the same value.
        const geocoderCity = detectedCity && detectedCity.toLowerCase() !== match.subDistrict.subDistrictName.toLowerCase()
          ? detectedCity
          : undefined;
        const finalCity = match.locality ? match.locality.localityName : (geocoderCity || '');
        setState(match.state.name);
        setDistrict(match.district.districtName);
        setMandalOrMunicipality(match.subDistrict.subDistrictName);
        setCity(finalCity);
        // Only set street if it doesn't look like a Plus Code
        const PLUS_CODE_RE = /^[A-Z0-9]{2,8}\+[A-Z0-9]{2,}/i;
        const cleanStreet = detectedStreet && !PLUS_CODE_RE.test(detectedStreet.trim()) ? detectedStreet : '';
        const resolvedStreet = cleanStreet || (finalCity ? `${finalCity} Main Road` : '');
        if (resolvedStreet) setStreetOrLocality(resolvedStreet);
        if (detectedPin) {
          setPinCode(detectedPin);
        } else if (finalCity) {
          resolvePinCodeForLocality(finalCity, match.subDistrict.subDistrictName, match.district.districtName);
        }

        setHasDetected(true);
        setShowPermissionDeniedDialog(false);
        // If city/village is still unknown, open the village picker after detection
        setActiveLocationModal(finalCity ? null : 'city');

        const accText = geo.accuracyMeters ? ` (±${Math.round(geo.accuracyMeters)}m)` : '';
        if (geo.confidence === 'HIGH') {
          showToast(
            finalCity
              ? `🎯 Detected${accText}: ${finalCity}, ${match.subDistrict.subDistrictName}. Directly edit any square below!`
              : `🎯 Mandal detected${accText}: ${match.subDistrict.subDistrictName}. Please select your village below!`,
            'success'
          );
        } else if (geo.confidence === 'MEDIUM') {
          showToast(
            finalCity
              ? `📍 Detected${accText}: ${finalCity}, ${match.subDistrict.subDistrictName}. Tap to adjust any square.`
              : `📍 Mandal detected${accText}: ${match.subDistrict.subDistrictName}. Please select your village.`,
            'info'
          );
        } else {
          showToast(
            `⚠️ Coarse location${accText}: ${match.subDistrict.subDistrictName}, ${match.district.districtName}. Verify your squares below.`,
            'warning'
          );
        }
      } else {
        setHasDetected(true);
        setActiveLocationModal('district');
        showToast('Please select your District and Mandal from the squares below.', 'info');
        
        // Fallback: populate raw detected values
        if (detectedState) setState(detectedState);
        if (rawDistrict) setDistrict(rawDistrict);
        if (detectedMandal) setMandalOrMunicipality(detectedMandal);
        if (
          detectedCity &&
          detectedCity.trim().toLowerCase() !== detectedMandal.trim().toLowerCase()
        ) {
          setCity(detectedCity.trim());
        } else {
          setCity('');
          setActiveLocationModal('city');
        }
        const resolvedStreet = detectedStreet || (detectedCity ? `${detectedCity} Main Road` : '');
        setStreetOrLocality(resolvedStreet);
        if (detectedPin) setPinCode(detectedPin);
      }
    } catch (hardErr: any) {
      setHasDetected(true);
      const errorMsg = String(hardErr?.message || '');
      const isGpsOff =
        hardErr?.code === 'LOCATION_SERVICES_DISABLED' ||
        (errorMsg.toLowerCase().includes('location') && (errorMsg.toLowerCase().includes('off') || errorMsg.toLowerCase().includes('disabled')));

      const isDenied = hardErr?.code === 'PERMISSION_DENIED' || hardErr?.name === 'NotAllowedError' || /denied/i.test(errorMsg);

      if (isGpsOff) {
        setShowGpsOffModal(true);
        showToast('📍 Device Location is turned off. Please enable Location in phone quick settings.', 'warning');
      } else if (isDenied) {
        setShowPermissionDeniedDialog(true);
        showToast('Location permission denied. Please enable Precise Location in settings.', 'warning');
      } else {
        setActiveLocationModal('district');
        showToast(
          hardErr?.message || 'Location permission unavailable. Select details from squares below.',
          'warning'
        );
      }
    } finally {
      isDetectingRef.current = false;
      setDetecting(false);
    }
  };

  // Auto-recheck location permission on app resume / window focus until granted
  useEffect(() => {
    if (!showPermissionDeniedDialog) return;

    const handleRecheckOnResume = () => {
      if (showPermissionDeniedDialog && !isDetectingRef.current) {
        executeDetectLocation();
      }
    };

    window.addEventListener('focus', handleRecheckOnResume);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleRecheckOnResume();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleRecheckOnResume);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [showPermissionDeniedDialog]);

  // Sync / Save Location: Updates local storage and broadcasts to whole application
  const [syncing, setSyncing] = useState(false);

  const handleSyncLocation = useCallback(async (options?: { silent?: boolean; auto?: boolean }) => {
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
    if (!city.trim()) {
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
        photo: (!isPetPhotoUrl(existingProfile?.photo) ? existingProfile?.photo : undefined) || (!isPetPhotoUrl(user.avatar) ? user.avatar : undefined),
        email: user.email,
        state: state.trim(),
        district: district.trim(),
        mandalOrMunicipality: mandalOrMunicipality.trim(),
        city: city.trim(),
        streetOrLocality: streetOrLocality.trim(),
        street: streetOrLocality.trim(),
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
        state: state.trim(),
        district: district.trim(),
        mandal: mandalOrMunicipality.trim(),
        city: city.trim(),
        street: streetOrLocality.trim(),
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
      city.trim();

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
    city.trim()
  );

  const handleProceedToPup = () => {
    if (!isLocationValid) {
      showToast('Please select State, District, Mandal, and Home Base before continuing.', 'warning');
      return;
    }
    handleSyncLocation({ silent: true });
    if (onSuccess) {
      onSuccess();
    } else {
      setActiveOnboardingTab('choice');
      navigate('/choice');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setActiveOnboardingTab('owner');
      navigate('/owner');
    }
  };

  const handleExitToDashboard = () => {
    setActiveOnboardingTab('dashboard');
    navigate('/dashboard');
  };

  return (
    <div className="onboarding-page-container">
      <div className="onboarding-card-wrapper">
        <div className="card onboarding-card location-onboarding-card">
          <button
            type="button"
            className="onboarding-exit-btn"
            onClick={handleExitToDashboard}
            aria-label="Exit location and go to dashboard"
            title="Exit to dashboard"
          >
            <X size={19} />
          </button>
          <div className="section-card-title-block">
            <h1>Location</h1>
          </div>
          {/* Top-left back button inside container for going back to Owner Profile */}
          <div className="pet-profile-header-bar location-header-bar">
            <div className="pet-profile-header-left">
              <button
                type="button"
                className="pet-profile-back-btn location-back-btn"
                onClick={handleBack}
                title="Go back to Owner Profile"
                aria-label="Back to Owner Profile"
              >
                <ArrowLeft size={18} />
              </button>
            </div>
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
                disabled={detecting || syncing}
                className="btn btn-outline btn-lg location-reset-btn"
              >
                <RefreshCw size={16} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* MAIN VIEW: 2×2 LOCATION GRID */}
          <div className="loc-grid-showcase">
              <div className="loc-grid-2x2">
                {/* 1. STATE SQUARE */}
                <button
                  type="button"
                  className="loc-grid-square loc-gsq-state"
                  onClick={() => setActiveLocationModal('state')}
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
                  onClick={() => setActiveLocationModal('district')}
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
                  onClick={() => setActiveLocationModal('mandal')}
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
                  onClick={() => setActiveLocationModal('city')}
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
                      onChange={(e) => setStreetOrLocality(e.target.value)}
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
                      <div className="sync-secondary-btn location-auto-synced-pill" title="Location is saved automatically.">
                        <Check size={15} />
                        <span>Location Synced</span>
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

      <PermissionRationaleModal
        isOpen={showLocationRationale}
        title="Location Permission"
        message="Location access is needed only when you choose Detect Location. It helps identify your State, District, Mandal and Home Base. Your exact coordinates are not publicly displayed."
        onCancel={() => setShowLocationRationale(false)}
        onContinue={handleLocationRationaleContinue}
      />

      <PermissionRationaleModal
        isOpen={showGpsOffModal}
        title="Turn On Device Location"
        message="Your device Location (GPS) is currently turned off. To automatically detect your State, District, and Mandal, swipe down from the top of your screen to open Quick Settings, turn on Location, and tap Detect Again."
        continueLabel="Detect Again"
        cancelLabel="Choose Manually"
        onCancel={() => {
          setShowGpsOffModal(false);
          setActiveLocationModal('district');
        }}
        onContinue={() => {
          setShowGpsOffModal(false);
          executeDetectLocation();
        }}
      />

      <PermissionRationaleModal
        isOpen={showPermissionDeniedDialog}
        title="Location Permission Needed"
        message="Location helps us capture the correct last-seen place for your pet. Enable it in device or browser settings, or enter your location manually."
        continueLabel="Try Again"
        cancelLabel="Enter Location Manually"
        onCancel={() => {
          setShowPermissionDeniedDialog(false);
          setActiveLocationModal('state');
        }}
        onContinue={() => {
          setShowPermissionDeniedDialog(false);
          executeDetectLocation();
        }}
      />
    </div>
  );
};
