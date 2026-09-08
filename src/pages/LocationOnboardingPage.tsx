import React, { useState, useMemo, useEffect } from 'react';
import {
  Navigation,
  RefreshCw,
  Building,
  MapPin,
  Landmark,
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Compass,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { locationService } from '../services/locationService';
import { SearchableSelect, type SelectOption } from '../components/SearchableSelect';
import type { OwnerProfile, LocationLocality } from '../types';
import { triggerStarCelebration } from '../utils/confettiHelper';

interface LocationOnboardingPageProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export const LocationOnboardingPage: React.FC<LocationOnboardingPageProps> = ({
  onSuccess,
  onBack,
}) => {
  const { user, refreshProgress, setActiveOnboardingTab } = useAuth();
  const { showToast } = useToast();

  const existingProfile = user ? storageService.getOwnerProfileByUserId(user.id) : null;
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

  // UI Flow States
  const [hasDetected, setHasDetected] = useState<boolean>(hasExistingData);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(hasExistingData);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [detecting, setDetecting] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [lookingUpPin, setLookingUpPin] = useState(false);

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

  // 6-digit PIN code auto lookup
  const handlePinChange = async (pinValue: string) => {
    setPinCode(pinValue);
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
                showToast(
                  `✨ Auto-detected: ${match.locality?.localityName || match.subDistrict.subDistrictName}, ${match.district.districtName}`,
                  'success'
                );
              } else {
                showToast(
                  'PIN code found, but could not match official sub-district. Please select below.',
                  'info'
                );
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

  // Trigger permission popup before detecting GPS
  const handleDetectClick = () => {
    setShowPermissionModal(true);
  };

  // Hardware GPS Detection
  const executeDetectLocation = () => {
    setShowPermissionModal(false);
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      setHasDetected(true);
      return;
    }

    setDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const exactLat = pos.coords.latitude;
        const exactLng = pos.coords.longitude;
        setLatitude(exactLat);
        setLongitude(exactLng);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${exactLat}&lon=${exactLng}&zoom=18&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const detectedState = addr.state || state;
            const rawDistrict = addr.state_district || addr.county || addr.district || district;
            const detectedMandal = addr.subdistrict || addr.county || mandalOrMunicipality;
            const detectedCity = addr.city || addr.town || addr.village || addr.suburb || city;
            const detectedPin = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : pinCode;

            const match = await locationService.matchLocation({
              state: detectedState,
              district: rawDistrict,
              mandal: detectedMandal,
              locality: detectedCity,
              pinCode: detectedPin,
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
              if (detectedPin) setPinCode(detectedPin);
              setHasDetected(true);
              showToast(
                `🎯 Location detected: ${match.locality?.localityName || match.subDistrict.subDistrictName}, ${match.district.districtName}`,
                'success'
              );
            } else {
              setHasDetected(true);
              showToast(
                'Could not automatically match this location against official records. Please select below.',
                'warning'
              );
            }
          }
        } catch {
          setHasDetected(true);
          showToast('GPS locked. Please confirm details below.', 'info');
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        setDetecting(false);
        setHasDetected(true);
        if (err.code === err.PERMISSION_DENIED) {
          showToast('Location permission denied. Please enter details below.', 'info');
        } else {
          showToast('Could not acquire GPS fix. Please enter details below.', 'info');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
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
      id: existingProfile?.id || `owner-${user.id}`,
      userId: user.id,
      fullName: existingProfile?.fullName || user.name || 'Pet Parent',
      phone: existingProfile?.phone || user.phone || '',
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
    setIsSubmitted(true);
    setIsEditing(false);

    // Star celebration animation on saving location!
    triggerStarCelebration();

    showToast('✓ Location details saved to your profile!', 'success');
  };

  const handleProceedToPup = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      setActiveOnboardingTab('dog');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToOwner = () => {
    if (onBack) {
      onBack();
    } else {
      setActiveOnboardingTab('owner');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="onboarding-page-container">
      <div className="onboarding-card-wrapper">
        <div className="card onboarding-card location-onboarding-card">
          <div className="onboarding-header text-center">
            <div className="badge badge-accent mb-2">
              <Sparkles size={14} className="mr-1" />
              <span>Step 2 of 4 • Community Search Radius</span>
            </div>
            <h1 className="onboarding-title">Where is Your Pet's Neighborhood?</h1>
            <p className="onboarding-subtitle">
              Set your official State, District, Mandal/Taluk, and Village so verified local pet lovers
              nearby can instantly receive search alerts if your dog ever goes missing.
            </p>
          </div>

          {/* PRIVACY SHIELD CALLOUT */}
          <div className="privacy-callout-banner">
            <div className="privacy-callout-icon-wrap">
              <ShieldCheck size={20} className="text-terracotta" />
            </div>
            <div className="privacy-callout-content">
              <h4 className="privacy-callout-heading">100% Pet-Safe Community Radius</h4>
              <p className="privacy-callout-text">
                Your private home address is never shown publicly. Only your safe public area (
                <em>e.g. "{calculatePublicArea()}"</em>) will be visible on community search alerts.
              </p>
            </div>
          </div>

          {/* PERMISSION MODAL */}
          {showPermissionModal && (
            <div className="permission-modal-overlay" onClick={() => setShowPermissionModal(false)}>
              <div className="permission-modal-card" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="permission-modal-close"
                  onClick={() => setShowPermissionModal(false)}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>

                <div className="permission-modal-icon-circle">
                  <Compass size={32} className="compass-pulse" />
                </div>

                <h3 className="permission-modal-title">Allow Location Access?</h3>
                <p className="permission-modal-desc">
                  FindLostPuppy uses device GPS to automatically match your official State, District,
                  Mandal, and City from the September 2026 directory so neighbors nearby can help search
                  for your puppy.
                </p>

                <div className="permission-modal-privacy-box">
                  <ShieldCheck size={16} className="privacy-shield-icon" />
                  <span>
                    <strong>100% Pet-Safe:</strong> Used only for community radius search filters.
                  </span>
                </div>

                <div className="permission-modal-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-lg allow-gps-btn"
                    onClick={executeDetectLocation}
                  >
                    <Navigation size={16} />
                    <span>Allow & Detect Location</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost btn-sm cancel-gps-btn"
                    onClick={() => setShowPermissionModal(false)}
                  >
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CASE 1: SUBMITTED STATE -> SHOW PREVIEW WITH DIRECT UPDATE OPTION */}
          {isSubmitted && !isEditing ? (
            <div className="location-preview-showcase">
              <div className="preview-showcase-header">
                <div className="preview-showcase-icon">📍</div>
                <div>
                  <h3 className="preview-showcase-title">Your Location Preview</h3>
                  <p className="preview-showcase-sub">
                    This community area is shown on search alerts and flyers to help find your puppy.
                  </p>
                </div>
              </div>

              <div className="preview-highlight-box">
                <div className="preview-highlight-label">
                  <Check size={14} />
                  <span>Verified Public Area</span>
                </div>
                <div className="preview-highlight-text">{calculatePublicArea()}</div>
                <div className="preview-highlight-meta">
                  <span>
                    State: <strong>{state}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    District: <strong>{district}</strong>
                  </span>
                  {mandalOrMunicipality && (
                    <>
                      <span>•</span>
                      <span>
                        Mandal: <strong>{mandalOrMunicipality}</strong>
                      </span>
                    </>
                  )}
                  {city && (
                    <>
                      <span>•</span>
                      <span>
                        Locality: <strong>{city}</strong>
                      </span>
                    </>
                  )}
                  {pinCode && (
                    <>
                      <span>•</span>
                      <span>
                        PIN: <strong>{pinCode}</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons on Preview */}
              <div className="preview-actions-row">
                <div className="action-buttons-wrap">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="btn btn-outline btn-md edit-details-btn"
                  >
                    <Edit3 size={16} />
                    <span>✏️ Update Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDetectClick}
                    disabled={detecting}
                    className="btn btn-ghost btn-sm"
                  >
                    <RefreshCw size={15} className={detecting ? 'spin' : ''} />
                    <span>Re-Detect (GPS)</span>
                  </button>
                </div>

                <div className="action-buttons-wrap">
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
                      <span>🔄 Re-Detect Location</span>
                    </>
                  ) : (
                    <>
                      <Navigation size={18} />
                      <span>🎯 Detect Location</span>
                    </>
                  )}
                </button>
              </div>

              {/* FORM ONLY COMES DOWN ONCE DETECT LOCATION IS CLICKED (hasDetected is true) */}
              {hasDetected && (
                <form
                  onSubmit={handleSaveLocation}
                  className="onboarding-form"
                  style={{ marginTop: '1.5rem' }}
                >
                  <div className="form-section-card cute-section-card">
                    <h3 className="section-title-sm cute-section-title">
                      <span className="cute-title-icon">📝</span>
                      <span>{isEditing ? 'Edit Location Details' : 'Review & Confirm Details'}</span>
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
                      </div>
                    </div>
                  </div>

                  {/* DIRECT SUBMIT ACTIONS FOOTER */}
                  <div className="wizard-actions-footer">
                    <div className="action-buttons-wrap">
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="btn btn-outline btn-lg"
                        >
                          <span>Cancel Edit</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleBackToOwner}
                          className="btn btn-outline btn-lg"
                        >
                          <ArrowLeft size={16} />
                          <span>Back to Owner Profile</span>
                        </button>
                      )}
                    </div>

                    <div className="action-buttons-wrap">
                      <button type="submit" className="btn btn-primary btn-lg">
                        <Check size={18} />
                        <span>{isEditing ? '✓ Update Location' : '✓ Submit Location'}</span>
                      </button>
                    </div>
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
