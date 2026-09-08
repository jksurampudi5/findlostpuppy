import React, { useState, useMemo, useEffect } from 'react';
import {
  MapPin,
  ShieldCheck,
  Navigation,
  Lock,
  Crosshair,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Check,
  Building,
  Sparkles,
  X,
  Compass,
  Landmark,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { locationService } from '../services/locationService';
import { SearchableSelect, type SelectOption } from './SearchableSelect';
import type { LocationLocality } from '../types';

interface LocationPickerProps {
  state: string;
  district: string;
  city?: string;
  mandalOrMunicipality?: string;
  streetOrLocality?: string;
  pinCode?: string;
  privateAddress: string;
  hasLocationConsent: boolean;
  latitude?: number;
  longitude?: number;
  approximateArea: string;
  onChange: (fields: {
    state: string;
    district: string;
    city?: string;
    mandalOrMunicipality: string;
    streetOrLocality: string;
    pinCode: string;
    privateAddress: string;
    hasLocationConsent: boolean;
    latitude?: number;
    longitude?: number;
    approximateArea: string;
  }) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  state: propState,
  district: propDistrict,
  city: propCity,
  mandalOrMunicipality: propMandal,
  streetOrLocality: propStreet = '',
  pinCode: propPin = '',
  privateAddress: propPrivate = '',
  hasLocationConsent: _hasLocationConsent = true,
  latitude,
  longitude,
  approximateArea,
  onChange,
}) => {
  const { showToast } = useToast();

  const [detecting, setDetecting] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [accuracyRadius, setAccuracyRadius] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [lookingUpPin, setLookingUpPin] = useState(false);

  // Field values
  const currentState = propState || 'Andhra Pradesh';
  const currentDistrict = propDistrict || '';
  const currentMandal = propMandal || '';
  const currentCity = propCity || '';
  const currentPin = propPin || '';
  const currentPrivate = propPrivate || '';

  const [localities, setLocalities] = useState<LocationLocality[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // 1. State Options
  const stateOptions: SelectOption[] = useMemo(() => {
    return locationService.getStates().map((s) => ({
      value: s.name,
      label: s.name,
      subLabel: `${locationService.getDistricts(s.code).length} Districts`,
    }));
  }, []);

  // 2. District Options
  const districtOptions: SelectOption[] = useMemo(() => {
    if (!currentState) return [];
    return locationService.getDistricts(currentState).map((d) => ({
      value: d.districtName,
      label: d.districtName,
      subLabel: `${locationService.getSubDistricts(d.districtCode).length} Mandals/Taluks`,
      meta: d,
    }));
  }, [currentState]);

  // 3. Mandal Options
  const mandalOptions: SelectOption[] = useMemo(() => {
    if (!currentDistrict) return [];
    return locationService.getSubDistricts(currentDistrict, currentState).map((m) => ({
      value: m.subDistrictName,
      label: m.subDistrictName,
      subLabel: m.subDistrictType || 'Mandal',
      meta: m,
    }));
  }, [currentState, currentDistrict]);

  // Dynamic localities load
  useEffect(() => {
    let isMounted = true;
    if (currentState && currentDistrict && currentMandal) {
      const distObj = locationService.getDistrict(currentState, currentDistrict);
      if (distObj) {
        const subObj = locationService.getSubDistrict(distObj.districtCode, currentMandal);
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
  }, [currentState, currentDistrict, currentMandal]);

  // 4. Village Options
  const villageOptions: SelectOption[] = useMemo(() => {
    return localities.map((l) => ({
      value: l.localityName,
      label: l.localityName,
      subLabel: l.localityType ? `${l.localityType}` : undefined,
      meta: l,
    }));
  }, [localities]);

  const calculateApproximate = (st: string, dt: string, mdl: string, cty: string): string => {
    const parts = [
      cty.trim(),
      mdl.trim() ? `${mdl.trim()} (Mandal)` : '',
      dt.trim(),
      st.trim(),
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Your Community Area';
  };

  const updateFields = (updates: Partial<{
    state: string;
    district: string;
    city: string;
    mandalOrMunicipality: string;
    streetOrLocality: string;
    pinCode: string;
    privateAddress: string;
    latitude: number;
    longitude: number;
    approximateArea: string;
  }>) => {
    const nextState = updates.state !== undefined ? updates.state : currentState;
    const nextDistrict = updates.district !== undefined ? updates.district : currentDistrict;
    const nextMandal =
      updates.mandalOrMunicipality !== undefined ? updates.mandalOrMunicipality : currentMandal;
    const nextCity = updates.city !== undefined ? updates.city : currentCity;
    const nextPin = updates.pinCode !== undefined ? updates.pinCode : currentPin;
    const nextPrivate =
      updates.privateAddress !== undefined ? updates.privateAddress : currentPrivate;
    const nextLat = updates.latitude !== undefined ? updates.latitude : latitude;
    const nextLng = updates.longitude !== undefined ? updates.longitude : longitude;
    const nextArea =
      updates.approximateArea !== undefined
        ? updates.approximateArea
        : calculateApproximate(nextState, nextDistrict, nextMandal, nextCity);

    onChange({
      state: nextState,
      district: nextDistrict,
      mandalOrMunicipality: nextMandal,
      city: nextCity,
      streetOrLocality: updates.streetOrLocality ?? propStreet,
      pinCode: nextPin,
      privateAddress: nextPrivate,
      hasLocationConsent: true,
      latitude: nextLat,
      longitude: nextLng,
      approximateArea: nextArea,
    });
  };

  // Cascading Selection Handlers with Strict Reset
  const handleStateChange = (newState: string) => {
    updateFields({
      state: newState,
      district: '',
      mandalOrMunicipality: '',
      city: '',
    });
  };

  const handleDistrictChange = (newDistrict: string) => {
    updateFields({
      district: newDistrict,
      mandalOrMunicipality: '',
      city: '',
    });
  };

  const handleMandalSelect = (newMandal: string) => {
    updateFields({
      mandalOrMunicipality: newMandal,
      city: '',
    });
  };

  const handleCitySelect = (newCity: string) => {
    updateFields({
      city: newCity,
    });
  };

  // 6-digit PIN lookup
  const handlePinChange = async (pinValue: string) => {
    updateFields({ pinCode: pinValue });
    if (pinValue.trim().length === 6 && /^\d{6}$/.test(pinValue.trim())) {
      setLookingUpPin(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pinValue.trim()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data[0]?.Status === 'Success') {
            const po = data[0].PostOffice?.[0];
            if (po) {
              const detectedState = po.State || currentState;
              const rawDistrict = po.District || currentDistrict;
              const detectedMandal = po.Block || currentMandal;
              const detectedLocality = po.Name;

              const match = await locationService.matchLocation({
                state: detectedState,
                district: rawDistrict,
                mandal: detectedMandal,
                locality: detectedLocality,
                pinCode: pinValue.trim(),
              });

              if (match) {
                updateFields({
                  state: match.state.name,
                  district: match.district.districtName,
                  mandalOrMunicipality: match.subDistrict.subDistrictName,
                  city: match.locality ? match.locality.localityName : match.subDistrict.subDistrictName,
                  pinCode: pinValue.trim(),
                });
                showToast(
                  `✨ Auto-detected: ${match.locality?.localityName || match.subDistrict.subDistrictName}, ${match.district.districtName}`,
                  'success'
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

  // Hardware GPS detection
  const executeDetectLocation = () => {
    setShowPermissionModal(false);
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setDetecting(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const exactLat = pos.coords.latitude;
        const exactLng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);
        setAccuracyRadius(acc);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${exactLat}&lon=${exactLng}&zoom=18&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const detectedState = addr.state || currentState;
            const rawDistrict = addr.state_district || addr.county || addr.district || currentDistrict;
            const detectedMandal = addr.subdistrict || addr.county || currentMandal;
            const detectedCity = addr.city || addr.town || addr.village || addr.suburb || currentCity;
            const detectedPin = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : currentPin;

            const match = await locationService.matchLocation({
              state: detectedState,
              district: rawDistrict,
              mandal: detectedMandal,
              locality: detectedCity,
              pinCode: detectedPin,
            });

            if (match) {
              updateFields({
                state: match.state.name,
                district: match.district.districtName,
                mandalOrMunicipality: match.subDistrict.subDistrictName,
                city: match.locality ? match.locality.localityName : match.subDistrict.subDistrictName,
                pinCode: detectedPin,
                latitude: exactLat,
                longitude: exactLng,
              });
              setIsEditing(false);
              setIsConfirmed(false);
              showToast(
                `🎯 Location detected: ${match.locality?.localityName || match.subDistrict.subDistrictName}, ${match.district.districtName}`,
                'success'
              );
            } else {
              updateFields({
                latitude: exactLat,
                longitude: exactLng,
              });
              setIsEditing(true);
              showToast(
                'Could not automatically match this location against official records. Please select below.',
                'warning'
              );
            }
          }
        } catch {
          updateFields({ latitude: exactLat, longitude: exactLng });
          setIsEditing(true);
          showToast('GPS locked. Please confirm details below.', 'info');
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        setDetecting(false);
        let message = 'Could not acquire GPS fix. Please select location manually.';
        if (err.code === err.PERMISSION_DENIED) {
          message = 'Location access was denied. Please select your location below.';
        }
        setGeoError(message);
        setIsEditing(true);
        showToast(message, 'info');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleConfirmLocation = () => {
    setIsConfirmed(true);
    setIsEditing(false);
    showToast('✓ Location confirmed!', 'success');
  };

  const hasCoordinates = !!(latitude && longitude);

  return (
    <div className="location-picker-component neat-flow">
      {/* STEP 1: Auto-Locate Hero Button Card */}
      <div className="auto-locate-hero-card">
        <div className="auto-locate-header">
          <div className="auto-locate-icon-wrap">
            <Crosshair size={24} className={detecting ? 'radar-sweep' : 'gps-pulse-icon'} />
          </div>
          <div className="auto-locate-text">
            <h4 className="auto-locate-title">Step 1: Auto-Detect Your Location</h4>
            <p className="auto-locate-subtitle">
              One-click hardware GPS detection with exact coordinates and automatic address lookup.
            </p>
          </div>
        </div>

        <div className="auto-locate-actions">
          <button
            type="button"
            onClick={handleDetectClick}
            disabled={detecting}
            className="btn btn-primary auto-locate-main-btn"
          >
            {detecting ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Acquiring Exact Coordinates...</span>
              </>
            ) : hasCoordinates ? (
              <>
                <RefreshCw size={16} />
                <span>Re-Detect Location (GPS)</span>
              </>
            ) : (
              <>
                <Navigation size={16} />
                <span>🎯 Auto-Locate My Exact Coordinates</span>
              </>
            )}
          </button>

          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setIsConfirmed(false);
              }}
              className="btn btn-ghost btn-sm manual-switch-btn"
            >
              <span>Or enter details manually</span>
            </button>
          )}
        </div>

        {geoError && (
          <div className="gps-error-banner">
            <AlertCircle size={15} />
            <span>{geoError}</span>
          </div>
        )}
      </div>

      {/* Permission Confirmation Modal */}
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
              FindLostPuppy requires access to your device's high-accuracy GPS to automatically
              identify your <strong>State, District, Mandal, and City</strong> for precision lost puppy
              alerts.
            </p>

            <div className="permission-modal-privacy-box">
              <ShieldCheck size={16} className="privacy-shield-icon" />
              <span>
                <strong>100% Confidential:</strong> Your exact house/flat address is never sent or
                visible to the public.
              </span>
            </div>

            <div className="permission-modal-actions">
              <button
                type="button"
                className="btn btn-primary btn-lg allow-gps-btn"
                onClick={executeDetectLocation}
              >
                <Navigation size={16} />
                <span>Allow & Detect Exact Location</span>
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-sm cancel-gps-btn"
                onClick={() => {
                  setShowPermissionModal(false);
                  setIsEditing(true);
                }}
              >
                <span>Enter Manually Instead</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Review & Verification Card */}
      {(hasCoordinates || currentDistrict || currentCity) && !isEditing && (
        <div className={`location-review-card ${isConfirmed ? 'is-confirmed' : 'needs-review'}`}>
          <div className="review-card-top">
            <div className="review-status-indicator">
              {isConfirmed ? (
                <div className="status-badge-confirmed">
                  <CheckCircle2 size={16} />
                  <span>✓ Location Confirmed</span>
                </div>
              ) : (
                <div className="status-badge-review">
                  <span className="pulsing-review-dot" />
                  <span>Please Review Detected Details</span>
                </div>
              )}
            </div>

            {hasCoordinates && (
              <div className="review-coords-pill">
                <span className="coord-text">
                  {latitude?.toFixed(6)}° N, {longitude?.toFixed(6)}° E
                </span>
                {accuracyRadius !== null && (
                  <span className="accuracy-text">(±{accuracyRadius}m)</span>
                )}
              </div>
            )}
          </div>

          <div className="detected-details-summary">
            <div className="summary-area-title">
              <MapPin size={18} className="summary-pin-icon" />
              {currentState && <span className="summary-state-lead">{currentState}</span>}
              {currentDistrict && <span className="summary-district-lead">› {currentDistrict}</span>}
              {currentMandal && (
                <span className="summary-mandal-lead">› {currentMandal} (Mandal)</span>
              )}
              <strong className="summary-city-lead">› {currentCity || 'City or Village'}</strong>
              {currentPin && <span className="summary-pin">({currentPin})</span>}
            </div>
            <p className="summary-hint">
              Safe public preview: <em>"{approximateArea || calculateApproximate(currentState, currentDistrict, currentMandal, currentCity)}"</em>
            </p>
          </div>

          <div className="review-action-buttons">
            {!isConfirmed ? (
              <>
                <button
                  type="button"
                  onClick={handleConfirmLocation}
                  className="btn btn-success confirm-loc-btn"
                >
                  <Check size={16} />
                  <span>✓ Submit & Confirm Location</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn btn-outline edit-loc-btn"
                >
                  <Edit3 size={15} />
                  <span>Update Details Manually</span>
                </button>
              </>
            ) : (
              <div className="confirmed-row">
                <span className="confirmed-note">Details verified for this report.</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmed(false);
                    setIsEditing(true);
                  }}
                  className="btn btn-ghost btn-xs edit-confirmed-btn"
                >
                  <Edit3 size={13} />
                  <span>Edit Details</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Manual Edit Form using Single Searchable Dropdowns */}
      {isEditing && (
        <div className="location-edit-panel">
          <div className="edit-panel-header">
            <h5 className="edit-panel-title">
              <Edit3 size={15} />
              <span>Enter / Update Location Details</span>
            </h5>
            <span className="edit-panel-desc">
              State, District, Mandal/Taluk, City/Village updated for September 2026 directory.
            </span>
          </div>

          <div className="form-vertical-stack">
            {/* 1. State Dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="picker-state">
                1. State / Region <span className="required-tag">*</span>
              </label>
              <SearchableSelect
                id="picker-state"
                value={currentState}
                onChange={handleStateChange}
                options={stateOptions}
                placeholder="Select State..."
                searchPlaceholder="Search state..."
                icon={<Building size={16} className="text-terracotta" />}
                required
              />
            </div>

            {/* 2. District Dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="picker-district">
                2. District <span className="required-tag">*</span>
              </label>
              <SearchableSelect
                id="picker-district"
                value={currentDistrict}
                onChange={handleDistrictChange}
                options={districtOptions}
                placeholder={`-- Select District under ${currentState} --`}
                searchPlaceholder="Search district..."
                disabled={!currentState}
                icon={<MapPin size={16} className="text-terracotta" />}
                required
              />
            </div>

            {/* 3. Mandal / Taluk Dropdown (Single control) */}
            <div className="form-group">
              <label className="form-label" htmlFor="picker-mandal">
                3. Mandal / Taluk <span className="required-tag">*</span>
              </label>
              <SearchableSelect
                id="picker-mandal"
                value={currentMandal}
                onChange={handleMandalSelect}
                options={mandalOptions}
                placeholder={
                  currentDistrict
                    ? `-- Select Mandal / Taluk under ${currentDistrict} --`
                    : '-- Select District first --'
                }
                searchPlaceholder="Search mandal / taluk..."
                disabled={!currentDistrict}
                icon={<Landmark size={16} className="text-terracotta" />}
                allowCustom={true}
                onCustomLocation={(name) => updateFields({ mandalOrMunicipality: name, city: '' })}
                required
              />
            </div>

            {/* 4. City or Village Dropdown (Single control) */}
            <div className="form-group">
              <label className="form-label" htmlFor="picker-city">
                4. City or Village <span className="required-tag">*</span>
              </label>
              <SearchableSelect
                id="picker-city"
                value={currentCity}
                onChange={handleCitySelect}
                options={villageOptions}
                placeholder={
                  currentMandal
                    ? `-- Select City / Village under ${currentMandal} --`
                    : '-- Select Mandal first --'
                }
                searchPlaceholder="Search city / village / locality..."
                disabled={!currentMandal}
                loading={loadingVillages}
                icon={<Navigation size={16} className="text-terracotta" />}
                allowCustom={true}
                onCustomLocation={(name) => updateFields({ city: name })}
                required
              />
            </div>

            {/* 5. PIN / ZIP Code */}
            <div className="form-group">
              <label className="form-label" htmlFor="picker-pin">
                <span>5. PIN / ZIP Code</span>
                {lookingUpPin && (
                  <span className="pin-lookup-indicator">Looking up official location...</span>
                )}
              </label>
              <div className="input-with-icon">
                <Sparkles size={15} className="input-icon text-amber" />
                <input
                  id="picker-pin"
                  type="text"
                  maxLength={6}
                  className="form-input"
                  placeholder="e.g. 534216 (Auto-detects State, District & Mandal)"
                  value={currentPin}
                  onChange={(e) => handlePinChange(e.target.value)}
                />
              </div>
              <span className="form-hint">
                Type 6 digits to automatically select State, District, Mandal, and Locality.
              </span>
            </div>
          </div>

          <div className="edit-panel-actions-row">
            <button
              type="button"
              onClick={handleConfirmLocation}
              className="btn btn-primary submit-loc-btn"
            >
              <Check size={15} />
              <span>Submit & Confirm Location</span>
            </button>
            <button
              type="button"
              onClick={() => {
                showToast('Location details updated.', 'info');
                setIsEditing(false);
              }}
              className="btn btn-outline update-loc-btn"
            >
              <span>Close Edit</span>
            </button>
          </div>
        </div>
      )}

      {/* Live Safe Public Area Preview Card */}
      <div className="safe-public-preview-card">
        <div className="preview-card-header">
          <span className="preview-badge-label">Public Card Preview</span>
          <span className="preview-note">Shown on community flyers and search filters</span>
        </div>
        <div className="preview-badge-pill">
          <MapPin size={15} className="preview-pin-icon" />
          <span className="preview-text">
            {approximateArea || calculateApproximate(currentState, currentDistrict, currentMandal, currentCity)}
          </span>
        </div>
      </div>

      {/* Confidential Residential Address Vault */}
      <div className="confidential-address-vault">
        <div className="vault-header">
          <div className="vault-title-wrap">
            <div className="vault-icon-circle">
              <Lock size={15} />
            </div>
            <div>
              <div className="vault-heading-row">
                <span className="vault-title">Exact Residential Address</span>
                <span className="vault-confidential-tag">
                  <ShieldCheck size={12} />
                  <span>100% Confidential</span>
                </span>
              </div>
              <p className="vault-desc">
                Protected by strict privacy controls. Searchers and public visitors <strong>never</strong> see your home address.
              </p>
            </div>
          </div>
        </div>

        <div className="form-group">
          <input
            id="loc-private-addr"
            type="text"
            className="form-input vault-input"
            placeholder="House/Flat #, Building name, Street name"
            value={currentPrivate}
            onChange={(e) => updateFields({ privateAddress: e.target.value })}
            required
          />
        </div>
      </div>
    </div>
  );
};
