import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Navigation,
  RefreshCw,
  Building,
  Building2,
  Home,
  MapPin,
  Landmark,
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Edit3,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { locationService } from '../services/locationService';
import { SearchableSelect, type SelectOption } from '../components/SearchableSelect';
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
  const { user, hasCompletedLocation, refreshProgress, setActiveOnboardingTab, petSafetyStatus } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [, setForceUpdate] = useState(0);
  useEffect(() => {
    const handleUpdate = () => {
      setForceUpdate((prev) => prev + 1);
      refreshProgress();
    };
    window.addEventListener('findlostpuppy_reports_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('findlostpuppy_reports_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshProgress]);

  const existingProfile = user ? storageService.getOwnerProfileByUserId(user.id, user.email) : null;
  const existingReport = user ? storageService.getLatestReportByUserId(user.id, user.email) : null;
  const isLost =
    petSafetyStatus === 'LOST' ||
    existingReport?.status === 'LOST';
  const hasExistingData = !!(existingProfile && (existingProfile.district || existingProfile.city));

  // Initial values from saved profile
  const initialValidState =
    locationService.getState(existingProfile?.state || 'Andhra Pradesh')?.name || 'Andhra Pradesh';

  const [state, setState] = useState<string>(initialValidState);
  const [district, setDistrict] = useState<string>(existingProfile?.district || '');
  const [mandalOrMunicipality, setMandalOrMunicipality] = useState<string>(
    existingProfile?.mandalOrMunicipality || ''
  );
  const [city, setCity] = useState<string>(existingProfile?.city || '');
  const [pinCode, setPinCode] = useState(existingProfile?.pinCode || '');
  const [latitude, setLatitude] = useState<number | undefined>(existingProfile?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(existingProfile?.longitude);

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
  const [lookingUpPin, setLookingUpPin] = useState(false);
  const isDetectingRef = useRef(false);

  // Track which location chip field is being inline-edited
  const [editingField, setEditingField] = useState<'state' | 'district' | 'mandal' | 'city' | 'pin' | null>(null);

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
  const stateOptions: SelectOption[] = useMemo(() => {
    return locationService.getStates().map((s) => ({
      value: s.name,
      label: s.name,
      subLabel: `${locationService.getDistricts(s.code).length} Districts`,
    }));
  }, []);

  // 2. District Options (Cascades under State)
  const districtOptions: SelectOption[] = useMemo(() => {
    if (!state) return [];
    return locationService.getDistricts(state).map((d) => ({
      value: d.districtName,
      label: d.districtName,
      subLabel: `${locationService.getSubDistricts(d.districtCode).length} Mandals/Taluks`,
      meta: d,
    }));
  }, [state]);

  // 3. Mandal Options (Cascades under District)
  const mandalOptions: SelectOption[] = useMemo(() => {
    if (!district) return [];
    return locationService.getSubDistricts(district, state).map((m) => ({
      value: m.subDistrictName,
      label: m.subDistrictName,
      subLabel: m.subDistrictType || 'Mandal',
      meta: m,
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
  const villageOptions: SelectOption[] = useMemo(() => {
    return localities.map((l) => ({
      value: l.localityName,
      label: l.localityName,
      subLabel: l.localityType ? `${l.localityType}` : undefined,
      meta: l,
    }));
  }, [localities]);

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
    setEditingField('district');
  };

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    setMandalOrMunicipality('');
    setCity('');
    setPinCode('');
    setLocalities([]);
    setEditingField('mandal');
  };

  const handleMandalSelect = (newMandal: string) => {
    setMandalOrMunicipality(newMandal);
    setCity('');
    setPinCode('');
    setLocalities([]);
    setEditingField('city');
  };

  const handleCitySelect = (newCity: string) => {
    setCity(newCity);
    setEditingField(null);
    resolvePinCodeForLocality(newCity, mandalOrMunicipality, district);
  };

  // Compute safe public preview string
  const calculatePublicArea = () => {
    const parts = [
      city.trim(),
      mandalOrMunicipality.trim() ? `${mandalOrMunicipality.trim()} (Mandal)` : '',
      district.trim(),
      state.trim(),
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Your Community Area';
  };

  // 6-digit PIN code manual change & lookup
  const handlePinChange = async (pinValue: string) => {
    setPinCode(pinValue);
    setPinConflictNote('');

    if (pinValue.trim().length === 6 && /^\d{6}$/.test(pinValue.trim())) {
      setLookingUpPin(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pinValue.trim()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data[0]?.Status === 'Success') {
            const po = data[0].PostOffice?.[0];
            if (po) {
              const detectedState = po.State || state;
              const rawDistrict = po.District || district;
              const detectedMandal = po.Block || mandalOrMunicipality;
              const detectedLocality = po.Name;

              const match = await locationService.matchLocation({
                state: detectedState,
                district: rawDistrict,
                mandal: detectedMandal,
                locality: detectedLocality,
                pinCode: pinValue.trim(),
              });

              if (match) {
                setState(match.state.name);
                setDistrict(match.district.districtName);
                setMandalOrMunicipality(match.subDistrict.subDistrictName);
                if (match.locality) {
                  setCity(match.locality.localityName);
                } else {
                  setCity(match.subDistrict.subDistrictName);
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('PIN lookup failed', err);
      } finally {
        setLookingUpPin(false);
      }
    }
  };

  // Direct native location detector
  const handleDetectClick = () => {
    executeDetectLocation();
  };

  // Hardware GPS & Native Geolocation Detection
  const executeDetectLocation = async () => {
    if (isDetectingRef.current) return;
    isDetectingRef.current = true;
    setDetecting(true);
    setPinConflictNote('');

    try {
      const geo = await detectResilientLocation();

      // Low-confidence IP fallback requires manual verification
      if (geo.source === 'ip') {
        setHasDetected(true);
        setEditingField('district');
        showToast('Approximate location only. Tap District & Mandal below to confirm.', 'info');
        return;
      }

      setLatitude(geo.latitude);
      setLongitude(geo.longitude);

      const detectedState = geo.state || state;
      const rawDistrict = geo.district || district;
      const detectedMandal = geo.mandal || mandalOrMunicipality;
      const detectedCity = geo.city || city;
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
        const finalCity = match.locality ? match.locality.localityName : match.subDistrict.subDistrictName;
        setState(match.state.name);
        setDistrict(match.district.districtName);
        setMandalOrMunicipality(match.subDistrict.subDistrictName);
        setCity(finalCity);
        if (detectedPin) {
          setPinCode(detectedPin);
        } else {
          resolvePinCodeForLocality(finalCity, match.subDistrict.subDistrictName, match.district.districtName);
        }

        setHasDetected(true);
        setEditingField(null);

        const accText = geo.accuracyMeters ? ` (±${Math.round(geo.accuracyMeters)}m)` : '';
        if (geo.confidence === 'HIGH') {
          showToast(
            `🎯 Detected${accText}: ${match.subDistrict.subDistrictName}, ${match.district.districtName}. Directly edit any square below!`,
            'success'
          );
        } else if (geo.confidence === 'MEDIUM') {
          showToast(
            `📍 Detected${accText}: ${match.subDistrict.subDistrictName}, ${match.district.districtName}. Tap to adjust any square.`,
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
        setEditingField('district');
        showToast('Please select your District and Mandal from the squares below.', 'info');
      }
    } catch (hardErr: any) {
      setHasDetected(true);
      setEditingField('district');
      showToast(
        hardErr?.message || 'Location permission unavailable. Select details from squares below.',
        'warning'
      );
    } finally {
      isDetectingRef.current = false;
      setDetecting(false);
    }
  };

  // Sync / Save Location: Updates local storage and broadcasts to whole application
  const [syncing, setSyncing] = useState(false);

  const handleSyncLocation = async () => {
    if (!district.trim()) {
      showToast('Please select your District.', 'warning');
      setEditingField('district');
      return;
    }
    if (!mandalOrMunicipality.trim()) {
      showToast('Please select your Mandal / Taluk.', 'warning');
      setEditingField('mandal');
      return;
    }
    if (!city.trim()) {
      showToast('Please select your Home Base (City / Village).', 'warning');
      setEditingField('city');
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
      setEditingField(null);
      setSavedSnapshot({
        state: state.trim(),
        district: district.trim(),
        mandal: mandalOrMunicipality.trim(),
        city: city.trim(),
        pinCode: pinCode.trim(),
      });

      // Synchronize changes across active components & tabs
      window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
      window.dispatchEvent(new Event('storage'));

      showToast('✓ Location synced with pet profile & alerts!', 'success');
    } finally {
      setSyncing(false);
    }
  };

  const handleProceedToPup = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      setActiveOnboardingTab('dog');
      navigate('/pet');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToOwner = () => {
    if (onBack) {
      onBack();
    } else {
      setActiveOnboardingTab('owner');
      navigate('/owner');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="onboarding-page-container">
      <div className="onboarding-card-wrapper">
        <div className="card onboarding-card location-onboarding-card">
          <div className="onboarding-header">
            <div className="cute-welcome-banner">
              <div className="cute-welcome-icon">🐾</div>
              <div className="cute-welcome-text">
                <h1 className="cute-page-title">Pet Location 🐾</h1>
                <p className="cute-page-sub">
                  Where your pet stays to connect with local neighbors
                </p>
              </div>
            </div>
            {/* Re-Detect button — centered below heading, always visible once detected */}
            {(hasDetected || hasSavedLocation) && (
              <div className="loc-redetect-header-wrap">
                <button
                  type="button"
                  onClick={handleDetectClick}
                  disabled={detecting}
                  className="loc-redetect-header-btn"
                >
                  <RefreshCw size={14} className={detecting ? 'spin' : ''} />
                  <span>{detecting ? 'Detecting...' : 'Re-Detect Location'}</span>
                </button>
              </div>
            )}
          </div>

          {/* MAIN VIEW: 2×2 DIRECTLY EDITABLE LOCATION GRID */}
          {hasDetected || hasSavedLocation ? (
            <div className="loc-grid-showcase">
              {/* STATUS BADGE */}
              <div className="loc-grid-status-badge">
                {isLost ? (
                  <>
                    <AlertTriangle size={13} />
                    <span>🚨 Missing Pet Alert Active</span>
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    <span>✓ Verified Safe Area</span>
                  </>
                )}
              </div>

              {/* 2×2 INTERACTIVE SQUARE GRID */}
              <div className="loc-grid-2x2">
                {/* 1. STATE SQUARE */}
                <div
                  className={`loc-grid-square loc-gsq-state ${editingField === 'state' ? 'is-editing' : ''}`}
                  onClick={() => {
                    if (editingField !== 'state') setEditingField('state');
                  }}
                  title="Click to change State"
                >
                  <div className="loc-gsq-top">
                    <div className="loc-gsq-icon">
                      <Landmark size={20} />
                    </div>
                    <span className="loc-gsq-label">State</span>
                    <button
                      type="button"
                      className="loc-gsq-edit-hint"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingField(editingField === 'state' ? null : 'state');
                      }}
                      aria-label="Edit State"
                    >
                      {editingField === 'state' ? <Check size={13} /> : <Edit3 size={13} />}
                    </button>
                  </div>

                  {editingField === 'state' ? (
                    <div className="loc-gsq-dropdown-host" onClick={(e) => e.stopPropagation()}>
                      <SearchableSelect
                        id="grid-state"
                        value={state}
                        onChange={handleStateChange}
                        options={stateOptions}
                        placeholder="Select State..."
                        searchPlaceholder="Search state..."
                        icon={<Building size={14} />}
                        autoOpen
                        onClose={() => setEditingField(null)}
                        required
                      />
                    </div>
                  ) : (
                    <div className="loc-gsq-value-wrap">
                      <strong className="loc-gsq-value">{state || <span className="loc-gsq-placeholder">Select State</span>}</strong>
                    </div>
                  )}
                </div>

                {/* 2. DISTRICT SQUARE */}
                <div
                  className={`loc-grid-square loc-gsq-district ${editingField === 'district' ? 'is-editing' : ''}`}
                  onClick={() => {
                    if (editingField !== 'district') setEditingField('district');
                  }}
                  title="Click to change District"
                >
                  <div className="loc-gsq-top">
                    <div className="loc-gsq-icon">
                      <Building2 size={20} />
                    </div>
                    <span className="loc-gsq-label">District</span>
                    <button
                      type="button"
                      className="loc-gsq-edit-hint"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingField(editingField === 'district' ? null : 'district');
                      }}
                      aria-label="Edit District"
                    >
                      {editingField === 'district' ? <Check size={13} /> : <Edit3 size={13} />}
                    </button>
                  </div>

                  {editingField === 'district' ? (
                    <div className="loc-gsq-dropdown-host" onClick={(e) => e.stopPropagation()}>
                      <SearchableSelect
                        id="grid-district"
                        value={district}
                        onChange={handleDistrictChange}
                        options={districtOptions}
                        placeholder={`Select District (${state})...`}
                        searchPlaceholder="Search district..."
                        icon={<MapPin size={14} />}
                        disabled={!state}
                        autoOpen
                        onClose={() => setEditingField(null)}
                        required
                      />
                    </div>
                  ) : (
                    <div className="loc-gsq-value-wrap">
                      <strong className="loc-gsq-value">{district || <span className="loc-gsq-placeholder">Select District</span>}</strong>
                    </div>
                  )}
                </div>

                {/* 3. MANDAL SQUARE */}
                <div
                  className={`loc-grid-square loc-gsq-mandal ${editingField === 'mandal' ? 'is-editing' : ''}`}
                  onClick={() => {
                    if (editingField !== 'mandal') setEditingField('mandal');
                  }}
                  title="Click to change Mandal"
                >
                  <div className="loc-gsq-top">
                    <div className="loc-gsq-icon">
                      <MapPin size={20} />
                    </div>
                    <span className="loc-gsq-label">Mandal</span>
                    <button
                      type="button"
                      className="loc-gsq-edit-hint"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingField(editingField === 'mandal' ? null : 'mandal');
                      }}
                      aria-label="Edit Mandal"
                    >
                      {editingField === 'mandal' ? <Check size={13} /> : <Edit3 size={13} />}
                    </button>
                  </div>

                  {editingField === 'mandal' ? (
                    <div className="loc-gsq-dropdown-host" onClick={(e) => e.stopPropagation()}>
                      <SearchableSelect
                        id="grid-mandal"
                        value={mandalOrMunicipality}
                        onChange={handleMandalSelect}
                        options={mandalOptions}
                        placeholder={district ? `Select Mandal (${district})...` : 'Select District first'}
                        searchPlaceholder="Search mandal..."
                        icon={<Landmark size={14} />}
                        disabled={!district}
                        allowCustom
                        onCustomLocation={(c) => {
                          setMandalOrMunicipality(c);
                          setCity('');
                          setEditingField('city');
                        }}
                        autoOpen
                        onClose={() => setEditingField(null)}
                        required
                      />
                    </div>
                  ) : (
                    <div className="loc-gsq-value-wrap">
                      <strong className="loc-gsq-value">{mandalOrMunicipality || <span className="loc-gsq-placeholder">Select Mandal</span>}</strong>
                    </div>
                  )}
                </div>

                {/* 4. HOME BASE SQUARE */}
                <div
                  className={`loc-grid-square loc-gsq-home ${editingField === 'city' ? 'is-editing' : ''}`}
                  onClick={() => {
                    if (editingField !== 'city' && editingField !== 'pin') setEditingField('city');
                  }}
                  title="Click to change Home Base (City / Village)"
                >
                  <div className="loc-gsq-top">
                    <div className="loc-gsq-icon">
                      <Home size={20} />
                    </div>
                    <span className="loc-gsq-label">Home Base</span>
                    <button
                      type="button"
                      className="loc-gsq-edit-hint"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingField(editingField === 'city' ? null : 'city');
                      }}
                      aria-label="Edit Home Base"
                    >
                      {editingField === 'city' ? <Check size={13} /> : <Edit3 size={13} />}
                    </button>
                  </div>

                  {editingField === 'city' ? (
                    <div className="loc-gsq-dropdown-host" onClick={(e) => e.stopPropagation()}>
                      <SearchableSelect
                        id="grid-city"
                        value={city}
                        onChange={handleCitySelect}
                        options={villageOptions}
                        placeholder={mandalOrMunicipality ? `Select Village (${mandalOrMunicipality})...` : 'Select Mandal first'}
                        searchPlaceholder="Search village / locality..."
                        icon={<Navigation size={14} />}
                        disabled={!mandalOrMunicipality}
                        loading={loadingVillages}
                        allowCustom
                        onCustomLocation={(c) => {
                          setCity(c);
                          setEditingField(null);
                          resolvePinCodeForLocality(c, mandalOrMunicipality, district);
                        }}
                        autoOpen
                        onClose={() => setEditingField(null)}
                        required
                      />
                    </div>
                  ) : (
                    <div className="loc-gsq-value-wrap">
                      <strong className="loc-gsq-value">{city || <span className="loc-gsq-placeholder">Select Home Base</span>}</strong>

                      {/* PIN Badge or Direct Inline PIN Edit */}
                      {editingField === 'pin' ? (
                        <div className="loc-gsq-pin-edit" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            maxLength={6}
                            className="loc-gsq-pin-input"
                            value={pinCode}
                            onChange={(e) => handlePinChange(e.target.value)}
                            placeholder="PIN code"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingField(null);
                            }}
                          />
                          <button
                            type="button"
                            className="loc-gsq-pin-save-btn"
                            onClick={() => setEditingField(null)}
                            aria-label="Save PIN"
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="loc-gsq-pin-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingField('pin');
                          }}
                          title="Click to edit PIN code"
                        >
                          <span>{pinCode ? `PIN ${pinCode}` : '+ Add PIN'}</span>
                          <Edit3 size={10} style={{ opacity: 0.6 }} />
                        </button>
                      )}
                      {lookingUpPin && (
                        <span style={{ fontSize: '0.68rem', color: '#FF7900' }}>
                          Resolving PIN...
                        </span>
                      )}
                    </div>
                  )}
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
                    <Sparkles size={13} />
                    <span>Location changed • Tap Sync to save & broadcast</span>
                  </div>
                )}

                <div className="showcase-privacy-note">
                  <ShieldCheck size={13} className="privacy-note-icon" />
                  <span>Exact address is never public</span>
                </div>

                <div className="showcase-action-buttons">
                  <button
                    type="button"
                    onClick={handleBackToOwner}
                    className="btn btn-outline btn-md back-to-owner-btn"
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>

                  {hasUnsavedChanges ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSyncLocation}
                        disabled={syncing}
                        className="btn btn-primary btn-lg sync-location-main-btn"
                      >
                        <RefreshCw size={18} className={syncing ? 'spin' : ''} />
                        <span>{syncing ? 'Syncing Location...' : 'Sync Location'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleProceedToPup}
                        className="btn btn-outline btn-md continue-secondary-btn"
                      >
                        <span>Continue to Pup Profile</span>
                        <ArrowRight size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleSyncLocation}
                        disabled={syncing}
                        className="btn btn-outline btn-md sync-secondary-btn"
                        title="Location is in sync with pet profile. Tap to re-sync anytime."
                      >
                        <Check size={15} color="#4ADE80" />
                        <span>Location Synced</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleProceedToPup}
                        className="btn btn-primary btn-lg continue-to-pup-btn"
                      >
                        <span>Continue to Pup Profile</span>
                        <ArrowRight size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* INITIAL STATE: NOT YET DETECTED */
            <div className="single-detect-action-wrap" style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleDetectClick}
                disabled={detecting}
                className="btn btn-primary btn-lg auto-locate-main-btn"
              >
                {detecting ? (
                  <>
                    <RefreshCw size={18} className="spin" />
                    <span>Detecting Your Location...</span>
                  </>
                ) : (
                  <>
                    <Navigation size={18} />
                    <span>Detect Location</span>
                  </>
                )}
              </button>
              <p
                style={{
                  color: 'rgba(255,255,255,0.45)',
                  fontSize: '0.82rem',
                  marginTop: '1rem',
                }}
              >
                Tap "Detect Location" to automatically identify your State, District, Mandal & Home Base.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

