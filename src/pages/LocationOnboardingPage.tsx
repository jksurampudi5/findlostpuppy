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
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { locationService } from '../services/locationService';
import { SearchableSelect, type SelectOption } from '../components/SearchableSelect';
import type { OwnerProfile, LocationLocality } from '../types';
import { getDogDisplayName, isPetPhotoUrl } from '../utils/dogPhotoHelper';
import { detectResilientLocation } from '../utils/geolocationHelper';
import safePuppyImg from '../assets/safe_puppy.jpg';
import missingPuppyImg from '../assets/missing_puppy.jpg';

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
  const existingPet = user ? storageService.getPetProfileByUserId(user.id, user.email) : null;
  const existingReport = user ? storageService.getLatestReportByUserId(user.id, user.email) : null;
  const isLost =
    petSafetyStatus === 'LOST' ||
    existingReport?.status === 'LOST';
  const dogPhoto =
    existingPet?.primaryPhoto ||
    existingReport?.dog?.primaryPhoto ||
    (isLost ? missingPuppyImg : safePuppyImg);
  const dogName = getDogDisplayName(existingPet, existingReport);
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
  const [userRequestedEdit, setUserRequestedEdit] = useState<boolean>(false);
  const [hasDetected, setHasDetected] = useState<boolean>(hasExistingData || hasSavedLocation);
  const [locationSource, setLocationSource] = useState<'gps' | 'manual' | 'pin'>('manual');
  const [pinConflictNote, setPinConflictNote] = useState<string>('');
  const [accuracyRadius, setAccuracyRadius] = useState<number | undefined>();
  const [detectionConfidence, setDetectionConfidence] = useState<'HIGH' | 'MEDIUM' | 'LOW' | null>(null);
  const [confidenceReason, setConfidenceReason] = useState<string>('');
  const isEditing = userRequestedEdit || !hasSavedLocation;

  const [detecting, setDetecting] = useState(false);
  const [lookingUpPin, setLookingUpPin] = useState(false);
  const isDetectingRef = useRef(false);

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

  // Cascading Selection Handlers with Strict Reset
  const handleStateChange = (newState: string) => {
    setState(newState);
    setDistrict('');
    setMandalOrMunicipality('');
    setCity('');
    setLocalities([]);
  };

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    setMandalOrMunicipality('');
    setCity('');
    setLocalities([]);
  };

  const handleMandalSelect = (newMandal: string) => {
    setMandalOrMunicipality(newMandal);
    setCity('');
    setLocalities([]);
  };

  const handleCitySelect = (newCity: string) => {
    setCity(newCity);
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

  // 6-digit PIN code auto lookup with GPS priority preservation
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

              // If location was populated via GPS detection, do NOT silently overwrite!
              if (locationSource === 'gps' && district.trim()) {
                if (rawDistrict && district.toLowerCase() !== rawDistrict.toLowerCase()) {
                  setPinConflictNote(
                    `PIN ${pinValue.trim()} maps to ${rawDistrict}, while GPS verified ${district}. Keeping GPS location.`
                  );
                }
                return;
              }

              const match = await locationService.matchLocation({
                state: detectedState,
                district: rawDistrict,
                mandal: detectedMandal,
                locality: detectedLocality,
                pinCode: pinValue.trim(),
              });

              if (match) {
                setLocationSource('pin');
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

  // Direct native location detector (prompts OS/Browser permission directly on button click)
  const handleDetectClick = () => {
    executeDetectLocation();
  };

  // Hardware GPS & Native Geolocation Detection (Single-pass, zero flash, prefill form for user verification)
  const executeDetectLocation = async () => {
    if (isDetectingRef.current) return;
    isDetectingRef.current = true;
    setDetecting(true);
    setPinConflictNote('');

    try {
      const geo = await detectResilientLocation();
      setAccuracyRadius(geo.accuracyMeters);
      setDetectionConfidence(geo.confidence);
      setConfidenceReason(geo.confidenceReason);

      // Low-confidence IP fallback requires manual verification
      if (geo.source === 'ip') {
        setHasDetected(true);
        setUserRequestedEdit(true);
        setLocationSource('manual');
        showToast('Approximate location only (IP network). Please select your District and Mandal below.', 'info');
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
        if (detectedPin) setPinCode(detectedPin);

        setLocationSource('gps');
        setHasDetected(true);
        // Keep form visible so user can verify and adjust if needed
        setUserRequestedEdit(true);

        const accText = geo.accuracyMeters ? ` (±${Math.round(geo.accuracyMeters)}m)` : '';
        if (geo.confidence === 'HIGH') {
          showToast(
            `🎯 Detected${accText}: ${match.subDistrict.subDistrictName}, ${match.district.districtName}. Confirm or adjust below!`,
            'success'
          );
        } else if (geo.confidence === 'MEDIUM') {
          showToast(
            `📍 Detected${accText}: ${match.subDistrict.subDistrictName}, ${match.district.districtName}. Please confirm your Mandal below.`,
            'info'
          );
        } else {
          showToast(
            `⚠️ Coarse location${accText}: ${match.subDistrict.subDistrictName}, ${match.district.districtName}. Please verify details below.`,
            'warning'
          );
        }
      } else {
        setHasDetected(true);
        setUserRequestedEdit(true);
        showToast(
          'Please select your District and Mandal from the dropdowns below.',
          'info'
        );
      }
    } catch (hardErr: any) {
      setHasDetected(true);
      setUserRequestedEdit(true);
      showToast(
        hardErr?.message || 'Location permission denied or unavailable. Please select details below.',
        'error'
      );
    } finally {
      isDetectingRef.current = false;
      setDetecting(false);
    }
  };

  // Direct Submission: Saves to background and transitions to preview
  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();

    if (!district.trim()) {
      showToast('Please select your District.', 'warning');
      return;
    }
    if (!mandalOrMunicipality.trim()) {
      showToast('Please select your Mandal / Taluk.', 'warning');
      return;
    }
    if (!city.trim()) {
      showToast('Please select your City / Village.', 'warning');
      return;
    }

    if (!user) return;

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
    setUserRequestedEdit(false);

    showToast('✓ Location details saved to your profile!', 'success');
    handleProceedToPup();
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
          </div>

          {/* Direct native location flow - no redundant blocking modal */}

          {/* CASE 1: SUBMITTED STATE -> ULTRA PET-FRIENDLY SHOWCASE */}
          {hasSavedLocation && !userRequestedEdit ? (
            <div className={`location-preview-showcase pet-friendly-showcase ${isLost ? 'showcase-lost-active' : ''}`}>
              {/* TOP ACTION BAR: Verified Badge / Emergency Alert Badge & Re-Detect GPS */}
              <div className="showcase-top-bar">
                {isLost ? (
                  <div className="showcase-verified-badge lost-area-badge">
                    <AlertTriangle size={14} className="badge-alert-icon text-red-600" />
                    <span>🚨 Missing Pet Alert Active • Search Radar Broadcast</span>
                  </div>
                ) : (
                  <div className="showcase-verified-badge">
                    <Check size={14} className="badge-check-icon" />
                    <span>Verified Safe Area</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleDetectClick}
                  disabled={detecting}
                  className="btn btn-outline btn-sm showcase-redetect-btn"
                  title="Re-detect location using GPS"
                >
                  <RefreshCw size={14} className={detecting ? 'spin' : ''} />
                  <span>Re-Detect GPS</span>
                </button>
              </div>

              {/* PET SAFE-ZONE / LOST SEARCH RADAR HUB */}
              <div className={`pet-safe-radar-hub ${isLost ? 'pet-lost-radar-hub' : ''}`}>
                <div className={`radar-avatar-wrapper ${isLost ? 'radar-lost-wrapper' : ''}`}>
                  <div className={`radar-pulse-ring ring-outer ${isLost ? 'pulse-lost-outer' : ''}`}></div>
                  <div className={`radar-pulse-ring ring-inner ${isLost ? 'pulse-lost-inner' : ''}`}></div>
                  <div className={`pet-avatar-circle ${isLost ? 'pet-avatar-lost' : ''}`}>
                    <img
                      src={dogPhoto}
                      alt={dogName}
                      className="pet-radar-avatar-img"
                      onError={(e) => {
                        e.currentTarget.src = isLost ? missingPuppyImg : safePuppyImg;
                      }}
                    />
                  </div>
                </div>
                <div className={`pet-radar-status-pill ${isLost ? 'lost-status-pill' : ''}`}>
                  <span className={`radar-live-dot ${isLost ? 'dot-lost' : ''}`}></span>
                  <span>
                    {isLost
                      ? `🚨 Search Radar Active • ${dogName} Away From Home`
                      : 'Safe Zone Active • 100% Pet-Safe'}
                  </span>
                </div>
              </div>

              {/* VISUAL 4-STEP LOCATION JOURNEY FLOW */}
              <div className="showcase-journey-flow">
                {/* 1. State */}
                <div className="journey-card">
                  <div className="journey-card-icon-wrap journey-icon-state">
                    <Landmark size={20} className="journey-icon" />
                  </div>
                  <div className="journey-card-content">
                    <span className="journey-step-label">State</span>
                    <strong className="journey-step-value">{state || 'Not set'}</strong>
                  </div>
                </div>

                <div className="journey-step-arrow" aria-hidden="true">
                  <ChevronRight size={18} />
                </div>

                {/* 2. District */}
                <div className="journey-card">
                  <div className="journey-card-icon-wrap journey-icon-district">
                    <Building2 size={20} className="journey-icon" />
                  </div>
                  <div className="journey-card-content">
                    <span className="journey-step-label">District</span>
                    <strong className="journey-step-value">{district || 'Not set'}</strong>
                  </div>
                </div>

                <div className="journey-step-arrow" aria-hidden="true">
                  <ChevronRight size={18} />
                </div>

                {/* 3. Mandal */}
                <div className="journey-card">
                  <div className="journey-card-icon-wrap journey-icon-mandal">
                    <MapPin size={20} className="journey-icon" />
                  </div>
                  <div className="journey-card-content">
                    <span className="journey-step-label">Mandal</span>
                    <strong className="journey-step-value">{mandalOrMunicipality || 'Not set'}</strong>
                  </div>
                </div>

                <div className="journey-step-arrow" aria-hidden="true">
                  <ChevronRight size={18} />
                </div>

                {/* 4. Home Base (Locality) */}
                <div className="journey-card journey-card-home-base">
                  <div className="journey-card-icon-wrap journey-icon-locality">
                    <Home size={20} className="journey-icon" />
                  </div>
                  <div className="journey-card-content">
                    <span className="journey-step-label home-base-label">Home Base</span>
                    <strong className="journey-step-value home-base-value">{city || 'Not set'}</strong>
                    {pinCode && (
                      <span className="journey-pin-badge home-base-pin">
                        PIN {pinCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* BOTTOM ACTIONS BAR */}
              <div className="showcase-bottom-bar">
                <div className="showcase-privacy-note">
                  <ShieldCheck size={15} className="privacy-note-icon" />
                  <span>Exact home address is never public</span>
                </div>

                <div className="showcase-action-buttons">
                  <button
                    type="button"
                    onClick={() => setUserRequestedEdit(true)}
                    className="btn btn-outline btn-md edit-details-btn showcase-center-edit-btn"
                  >
                    <Edit3 size={16} />
                    <span>Update Location</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedToPup}
                    className="btn btn-primary btn-lg continue-to-pup-btn"
                  >
                    <span>Continue to Pup Profile</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* CASE 2: NOT YET SUBMITTED OR CURRENTLY EDITING */
            <>
              {/* SINGLE ORANGE DETECT BUTTON */}
              <div className="single-detect-action-wrap">
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
                  ) : hasDetected ? (
                    <>
                      <RefreshCw size={18} />
                      <span>Re-Detect Location</span>
                    </>
                  ) : (
                    <>
                      <Navigation size={18} />
                      <span>Detect Location</span>
                    </>
                  )}
                </button>
              </div>

              {/* LOCATION ACCURACY & CONFIDENCE STATUS BADGE */}
              {detectionConfidence && !detecting && (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    margin: '0.75rem auto 0 auto',
                    maxWidth: '480px',
                    padding: '0.65rem 0.95rem',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    lineHeight: '1.4',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor:
                      detectionConfidence === 'HIGH'
                        ? 'rgba(34, 197, 94, 0.14)'
                        : detectionConfidence === 'MEDIUM'
                        ? 'rgba(59, 130, 246, 0.14)'
                        : 'rgba(255, 121, 0, 0.14)',
                    border: `1.5px solid ${
                      detectionConfidence === 'HIGH'
                        ? 'rgba(34, 197, 94, 0.65)'
                        : detectionConfidence === 'MEDIUM'
                        ? 'rgba(59, 130, 246, 0.65)'
                        : 'rgba(255, 121, 0, 0.65)'
                    }`,
                    color: '#FFFFFF',
                  }}
                >
                  <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <span style={{ fontWeight: 700 }}>
                      {detectionConfidence === 'HIGH'
                        ? 'High-Accuracy Boundary Verified'
                        : detectionConfidence === 'MEDIUM'
                        ? 'Detected Location'
                        : 'Approximate Location'}
                      {accuracyRadius ? ` (±${Math.round(accuracyRadius)}m)` : ''}
                    </span>
                    <div style={{ fontSize: '0.76rem', opacity: 0.9, marginTop: '2px' }}>
                      {confidenceReason}
                    </div>
                  </div>
                </div>
              )}

              {/* LOCATION DETAILS FORM — AUTO-FILLED VIA GPS OR SELECTABLE MANUALLY */}
              {!detecting && (
                <form
                  onSubmit={handleSaveLocation}
                  className="onboarding-form"
                  style={{ marginTop: '1.5rem' }}
                >
                  <div className="form-section-card cute-section-card">
                    <h3 className="section-title-sm cute-section-title">
                      <MapPin size={18} className="cute-title-icon text-primary" />
                      <span>{isEditing ? 'Update Pet Location' : 'Select Pet Location'}</span>
                    </h3>

                    <div className="form-vertical-stack">
                      {/* 1. State Dropdown */}
                      <div className="form-group">
                        <label className="form-label cute-label" htmlFor="loc-state">
                          <span>1. State</span> <span className="required-tag">*</span>
                        </label>
                        <SearchableSelect
                          id="loc-state"
                          value={state}
                          onChange={handleStateChange}
                          options={stateOptions}
                          placeholder="Select State..."
                          searchPlaceholder="Search state..."
                          icon={<Building size={16} className="text-terracotta" />}
                          required
                        />
                      </div>

                      {/* 2. District Dropdown (Cascading based on State) */}
                      <div className="form-group">
                        <label className="form-label cute-label" htmlFor="loc-district">
                          <span>2. District ({state})</span> <span className="required-tag">*</span>
                        </label>
                        <SearchableSelect
                          id="loc-district"
                          value={district}
                          onChange={handleDistrictChange}
                          options={districtOptions}
                          placeholder={`-- Select District under ${state} --`}
                          searchPlaceholder="Search district..."
                          disabled={!state}
                          icon={<MapPin size={16} className="text-terracotta" />}
                          required
                        />
                      </div>

                      {/* 3. Mandal / Taluk Single Searchable Dropdown */}
                      <div className="form-group">
                        <label className="form-label cute-label" htmlFor="loc-mandal">
                          <span>3. Mandal / Taluk {district ? `(${district})` : ''}</span>{' '}
                          <span className="required-tag">*</span>
                        </label>
                        <SearchableSelect
                          id="loc-mandal"
                          value={mandalOrMunicipality}
                          onChange={handleMandalSelect}
                          options={mandalOptions}
                          placeholder={
                            district
                              ? `-- Select Mandal / Taluk under ${district} --`
                              : '-- Select District first --'
                          }
                          searchPlaceholder="Search mandal / taluk..."
                          disabled={!district}
                          icon={<Landmark size={16} className="text-terracotta" />}
                          allowCustom={true}
                          onCustomLocation={(customName) => {
                            setMandalOrMunicipality(customName);
                            setCity('');
                          }}
                          required
                        />
                      </div>

                      {/* 4. City / Village Single Searchable Dropdown */}
                      <div className="form-group">
                        <label className="form-label cute-label" htmlFor="loc-city">
                          <span>
                            4. City / Village{' '}
                            {mandalOrMunicipality ? `(${mandalOrMunicipality})` : ''}
                          </span>{' '}
                          <span className="required-tag">*</span>
                          {mandalOrMunicipality && (
                            <span
                              className="auto-populated-badge"
                              style={{
                                marginLeft: '0.5rem',
                                fontSize: '0.75rem',
                                color: '#E06D44',
                                fontWeight: 600,
                                background: '#FFF7ED',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '9999px',
                                border: '1px solid #FFEDD5',
                              }}
                            >
                              ✨ Official Localities ({villageOptions.length})
                            </span>
                          )}
                        </label>
                        <SearchableSelect
                          id="loc-city"
                          value={city}
                          onChange={handleCitySelect}
                          options={villageOptions}
                          placeholder={
                            mandalOrMunicipality
                              ? `-- Select City / Village under ${mandalOrMunicipality} --`
                              : '-- Select Mandal first --'
                          }
                          searchPlaceholder="Search city / village / locality..."
                          disabled={!mandalOrMunicipality}
                          loading={loadingVillages}
                          icon={<Navigation size={16} className="text-terracotta" />}
                          allowCustom={true}
                          onCustomLocation={(customName) => setCity(customName)}
                          required
                        />
                      </div>

                      {/* 5. PIN / ZIP Code */}
                      <div className="form-group">
                        <label className="form-label cute-label" htmlFor="loc-pin">
                          <span>5. PIN / ZIP Code</span>
                          {lookingUpPin && (
                            <span className="pin-lookup-indicator">
                              Matching official sub-district...
                            </span>
                          )}
                        </label>
                        <div className="input-with-icon">
                          <Sparkles size={16} className="input-icon text-amber" />
                          <input
                            id="loc-pin"
                            type="text"
                            maxLength={6}
                            className="form-input cute-input"
                            placeholder="e.g. 534216 (Auto-detects State, District & Mandal)"
                            value={pinCode}
                            onChange={(e) => handlePinChange(e.target.value)}
                          />
                        </div>
                        <span className="form-hint">
                          Type 6 digits to automatically select State, District, Mandal, and Locality.
                        </span>
                        {pinConflictNote && (
                          <div
                            className="pin-conflict-inline-note"
                            style={{
                              marginTop: '0.5rem',
                              fontSize: '0.8rem',
                              color: '#B45309',
                              background: '#FEF3C7',
                              padding: '0.45rem 0.75rem',
                              borderRadius: '8px',
                              border: '1px solid #FDE68A',
                            }}
                          >
                            ℹ️ {pinConflictNote}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DIRECT SUBMIT ACTIONS FOOTER */}
                  <div className="wizard-actions-footer location-actions-centered">
                    {hasSavedLocation ? (
                      <button
                        type="button"
                        onClick={() => setUserRequestedEdit(false)}
                        className="btn btn-outline btn-lg location-action-btn"
                      >
                        <span>Cancel Edit</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleBackToOwner}
                        className="btn btn-outline btn-lg location-action-btn"
                      >
                        <ArrowLeft size={16} />
                        <span>Back to Owner Profile</span>
                      </button>
                    )}

                    <button type="submit" className="btn btn-primary btn-lg submit-location-main-btn location-action-btn">
                      <Check size={18} />
                      <span>{hasSavedLocation ? 'Update Location' : 'Submit Location'}</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
