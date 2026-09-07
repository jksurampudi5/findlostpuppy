import { useState } from 'react';
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

// Clean Mandal / Taluk string from postal block (e.g. "Vundrajavaram (mdl)" -> "Undrajavaram")
const cleanMandal = (rawBlock?: string): string => {
  if (!rawBlock || rawBlock.toUpperCase() === 'NA') return '';
  return rawBlock.replace(/\s*\(mdl\)/i, '').replace(/\s*mandal/i, '').replace(/\s*taluk/i, '').trim();
};

// Normalize district based on recent reorganizations in Andhra Pradesh (2022), Telangana (2016-2019), and Karnataka (2021)
const normalizeRecentDistrict = (stateName: string, distName: string, areaHint: string): string => {
  const normState = stateName.trim().toLowerCase();
  const hint = `${distName} ${areaHint}`.toLowerCase();

  // 1. Andhra Pradesh (2022 Reorganization - 26 Districts)
  if (normState.includes('andhra')) {
    if (hint.includes('vijayawada') || hint.includes('ibrahimpatnam') || hint.includes('mylavaram') || hint.includes('jaggaiahpet') || hint.includes('tiruvuru') || hint.includes('nandigama')) {
      return 'NTR (Vijayawada)';
    }
    if (hint.includes('machilipatnam') || hint.includes('gudivada') || hint.includes('vuyyuru') || hint.includes('avanimagadda') || hint.includes('kaikaluru')) {
      return 'Krishna';
    }
    if (hint.includes('eluru') || hint.includes('jangareddigudem') || hint.includes('nuzvid') || hint.includes('chintalapudi') || hint.includes('denduluru')) {
      return 'Eluru';
    }
    if (hint.includes('bhimavaram') || hint.includes('tanuku') || hint.includes('palangi') || hint.includes('undrajavaram') || hint.includes('narasapuram') || hint.includes('tadepalligudem') || hint.includes('akividu') || hint.includes('achanta')) {
      return 'West Godavari';
    }
    if (hint.includes('rajamahendravaram') || hint.includes('rajahmundry') || hint.includes('anaparthi') || hint.includes('kovvur') || hint.includes('nidadavole')) {
      return 'East Godavari';
    }
    if (hint.includes('kakinada') || hint.includes('pithapuram') || hint.includes('peddapuram') || hint.includes('samalkota') || hint.includes('tuni')) {
      return 'Kakinada';
    }
    if (hint.includes('amalapuram') || hint.includes('ravulapalem') || hint.includes('ramachandrapuram') || hint.includes('mandapeta') || hint.includes('kothapeta') || hint.includes('razole')) {
      return 'Dr. B.R. Ambedkar Konaseema';
    }
    if (hint.includes('narasaraopet') || hint.includes('sattenapalle') || hint.includes('vinukonda') || hint.includes('gurazala') || hint.includes('machaerla') || hint.includes('chilakaluripet')) {
      return 'Palnadu';
    }
    if (hint.includes('bapatla') || hint.includes('chirala') || hint.includes('repalle') || hint.includes('parchur') || hint.includes('addanki')) {
      return 'Bapatla';
    }
    if (hint.includes('tirupati') || hint.includes('srikalahasti') || hint.includes('chandragiri') || hint.includes('gudur') || hint.includes('sullurpeta') || hint.includes('venkatagiri')) {
      return 'Tirupati';
    }
    if (hint.includes('rayachoti') || hint.includes('madanapalle') || hint.includes('rajampet') || hint.includes('pileru')) {
      return 'Annamayya';
    }
    if (hint.includes('nandyal') || hint.includes('allagadda') || hint.includes('banaganapalle') || hint.includes('dhone') || hint.includes('nandikotkur')) {
      return 'Nandyal';
    }
    if (hint.includes('puttaparthi') || hint.includes('dharmavaram') || hint.includes('kadiri') || hint.includes('hindupur') || hint.includes('penukonda')) {
      return 'Sri Sathya Sai';
    }
    if (hint.includes('anakapalle') || hint.includes('anakapalli') || hint.includes('yelamanchili') || hint.includes('payakaraopeta') || hint.includes('chintapalli')) {
      return 'Anakapalli';
    }
    if (hint.includes('parvathipuram') || hint.includes('salur') || hint.includes('kurupam') || hint.includes('palakonda')) {
      return 'Parvathipuram Manyam';
    }
    if (hint.includes('alluri') || hint.includes('paderu') || hint.includes('aruku') || hint.includes('rampadachodavaram')) {
      return 'Alluri Sitharama Raju';
    }
  }

  // 2. Telangana (33 Districts Reorganization)
  if (normState.includes('telangana')) {
    if (hint.includes('gachibowli') || hint.includes('kondapur') || hint.includes('madhapur') || hint.includes('serilingampally') || hint.includes('rajendranagar') || hint.includes('shamshabad') || hint.includes('maheshwaram') || hint.includes('ibrahimpatnam')) {
      return 'Rangareddy';
    }
    if (hint.includes('kukatpally') || hint.includes('balanagar') || hint.includes('medchal') || hint.includes('malkajgiri') || hint.includes('alwal') || hint.includes('quthbullapur') || hint.includes('uppal') || hint.includes('ghatkesar') || hint.includes('kapra')) {
      return 'Medchal-Malkajgiri';
    }
    if (hint.includes('ameerpet') || hint.includes('banjara') || hint.includes('jubilee') || hint.includes('khairatabad') || hint.includes('secunderabad') || hint.includes('begumpet') || hint.includes('musheerabad') || hint.includes('charminar') || hint.includes('shaikpet') || hint.includes('nampally')) {
      return 'Hyderabad';
    }
    if (hint.includes('patancheru') || hint.includes('sangareddy') || hint.includes('zaheerabad') || hint.includes('ameenpur') || hint.includes('tellapur')) {
      return 'Sangareddy';
    }
    if (hint.includes('hanumakonda') || hint.includes('kazipet') || hint.includes('hanamkonda')) {
      return 'Hanamkonda';
    }
  }

  // 3. Karnataka (31 Districts Reorganization)
  if (normState.includes('karnataka')) {
    if (hint.includes('koramangala') || hint.includes('indiranagar') || hint.includes('jayanagar') || hint.includes('whitefield') || hint.includes('bellandur') || hint.includes('marathahalli') || hint.includes('hebbal') || hint.includes('malleshwaram') || hint.includes('rajajinagar') || hint.includes('electronic city')) {
      return 'Bengaluru Urban';
    }
    if (hint.includes('devanahalli') || hint.includes('doddaballapura') || hint.includes('hosakote') || hint.includes('nelamangala')) {
      return 'Bengaluru Rural';
    }
    if (hint.includes('hosapete') || hint.includes('hampi') || hint.includes('kudligi') || hint.includes('harapanahalli')) {
      return 'Vijayanagara';
    }
  }

  return distName;
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
  state,
  district,
  city = '',
  mandalOrMunicipality = '',
  streetOrLocality: _streetOrLocality = '',
  pinCode = '',
  privateAddress,
  hasLocationConsent,
  latitude,
  longitude,
  approximateArea,
  onChange,
}) => {
  const { showToast } = useToast();
  const [detecting, setDetecting] = useState(false);
  const [accuracyRadius, setAccuracyRadius] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [lookingUpPin, setLookingUpPin] = useState(false);

  // Flow state: Auto-locate first, then review & confirm or edit manually
  const hasCoordinates = latitude !== undefined && longitude !== undefined;
  const [isEditing, setIsEditing] = useState<boolean>(!hasCoordinates && !district && !city);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(hasCoordinates && (!!district || !!city) && !isEditing);

  const calculateApproximate = (stName: string, distName: string, mnlName: string, cityName: string) => {
    const parts = [cityName, mnlName ? `${mnlName} Mandal` : '', distName, stName].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Approximate Local Area';
  };

  const handleFieldChange = (field: string, value: string) => {
    const updated = {
      state,
      district,
      city,
      mandalOrMunicipality,
      streetOrLocality: '',
      pinCode,
      privateAddress,
      hasLocationConsent,
      latitude,
      longitude,
      approximateArea,
      [field]: value,
    };

    if (field === 'state' || field === 'district' || field === 'mandalOrMunicipality' || field === 'city') {
      updated.approximateArea = calculateApproximate(
        field === 'state' ? value : state,
        field === 'district' ? value : district,
        field === 'mandalOrMunicipality' ? value : mandalOrMunicipality,
        field === 'city' ? value : city
      );
    }

    onChange(updated);

    // Auto lookup when user enters 6-digit PIN code
    if (field === 'pinCode' && value.trim().length === 6 && /^\d{6}$/.test(value.trim())) {
      lookupByPincode(value.trim(), updated);
    }
  };

  // Instant Indian Postal PIN Code Lookup (Fetches State, District, Mandal, and City)
  const lookupByPincode = async (pincodeStr: string, currentValues: typeof currentFields) => {
    setLookingUpPin(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincodeStr}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data[0]?.Status === 'Success') {
          const postOffices = data[0].PostOffice || [];
          if (postOffices.length > 0) {
            const po = postOffices[0];
            const detectedState = po.State || currentValues.state;
            const rawDistrict = po.District || currentValues.district;
            const detectedMandal = cleanMandal(po.Block) || currentValues.mandalOrMunicipality;
            const detectedCity = currentValues.city || po.Name;

            // Normalize district to reflect post-2022 AP, Telangana & Karnataka boundaries
            const normalizedDistrict = normalizeRecentDistrict(
              detectedState,
              rawDistrict,
              `${detectedCity} ${detectedMandal}`
            );

            const safeArea = calculateApproximate(detectedState, normalizedDistrict, detectedMandal, detectedCity);

            onChange({
              ...currentValues,
              pinCode: pincodeStr,
              state: detectedState,
              district: normalizedDistrict,
              mandalOrMunicipality: detectedMandal,
              city: detectedCity,
              approximateArea: safeArea,
            });

            showToast(`✨ Auto-detected: ${detectedMandal} (Mandal), ${normalizedDistrict} (${detectedState})`, 'success');
            setLookingUpPin(false);
            return;
          }
        }
      }
    } catch {
      // Graceful fallback
    }
    setLookingUpPin(false);
  };

  const currentFields = {
    state,
    district,
    city,
    mandalOrMunicipality,
    streetOrLocality: '',
    pinCode,
    privateAddress,
    hasLocationConsent,
    latitude,
    longitude,
    approximateArea,
  };

  // City-based District & Mandal Lookup
  const handleCityBlur = async () => {
    if (!city.trim() || city.trim().length < 3) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city.trim())}&format=json&addressdetails=1&limit=1`,
        { headers: { Accept: 'application/json' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const addr = data[0]?.address || {};
          const detectedState = addr.state || state;
          const rawDistrict = addr.state_district || addr.county || addr.district || district;
          const detectedMandal = addr.county || addr.subdistrict || mandalOrMunicipality;
          const detectedPin = addr.postcode || pinCode;

          const normalizedDistrict = normalizeRecentDistrict(
            detectedState,
            rawDistrict,
            `${city} ${detectedMandal}`
          );

          onChange({
            ...currentFields,
            state: detectedState,
            district: normalizedDistrict,
            mandalOrMunicipality: detectedMandal,
            pinCode: detectedPin,
            approximateArea: calculateApproximate(detectedState, normalizedDistrict, detectedMandal, city),
          });

          showToast(`✓ Resolved: ${detectedMandal ? `${detectedMandal} (Mandal), ` : ''}${normalizedDistrict}`, 'info');
        }
      }
    } catch {
      // Graceful fallback
    }
  };

  // Trigger permission modal first whenever user clicks Detect Location
  const handleDetectClick = () => {
    setShowPermissionModal(true);
  };

  // Execute hardware-level GPS detection after user confirms in popup
  const executeHighAccuracyLocation = () => {
    setShowPermissionModal(false);

    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser. Please enter location below.', 'warning');
      setIsEditing(true);
      return;
    }

    setDetecting(true);
    setGeoError(null);

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const exactLat = parseFloat(pos.coords.latitude.toFixed(6));
        const exactLng = parseFloat(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy * 10) / 10;
        setAccuracyRadius(accuracy);

        let detectedState = state;
        let detectedDistrict = district;
        let detectedMandal = mandalOrMunicipality;
        let detectedCity = city;
        let detectedPin = pinCode;

        // Step 1: Reverse Geocode via OpenStreetMap Nominatim
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${exactLat}&lon=${exactLng}&zoom=18&addressdetails=1`,
            {
              headers: { Accept: 'application/json' },
              signal: controller.signal,
            }
          );
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const addr = data?.address || {};

            detectedState = addr.state || detectedState;
            detectedCity = addr.village || addr.town || addr.city || addr.suburb || detectedCity;
            detectedMandal = addr.county || addr.subdistrict || detectedMandal;
            detectedDistrict = addr.state_district || addr.county || addr.district || detectedDistrict;
            detectedPin = addr.postcode || detectedPin;
          }
        } catch {
          // Graceful fallback
        }

        // Step 2: Cross-reference with Indian Postal PIN API for accurate Mandal and revenue District
        if (detectedPin && /^\d{6}$/.test(detectedPin.trim())) {
          try {
            const pinRes = await fetch(`https://api.postalpincode.in/pincode/${detectedPin.trim()}`);
            if (pinRes.ok) {
              const pinData = await pinRes.json();
              if (Array.isArray(pinData) && pinData[0]?.Status === 'Success') {
                const poList = pinData[0].PostOffice || [];
                if (poList.length > 0) {
                  detectedState = poList[0].State || detectedState;
                  detectedDistrict = poList[0].District || detectedDistrict;
                  detectedMandal = cleanMandal(poList[0].Block) || detectedMandal;
                  if (!detectedCity) detectedCity = poList[0].Name;
                }
              }
            }
          } catch {}
        }

        // Step 3: Apply post-2022 AP, Telangana & Karnataka district normalization
        detectedDistrict = normalizeRecentDistrict(
          detectedState,
          detectedDistrict,
          `${detectedCity} ${detectedMandal}`
        );

        const safeArea = calculateApproximate(detectedState, detectedDistrict, detectedMandal, detectedCity);

        onChange({
          state: detectedState,
          district: detectedDistrict,
          mandalOrMunicipality: detectedMandal,
          city: detectedCity,
          streetOrLocality: '',
          pinCode: detectedPin,
          privateAddress,
          hasLocationConsent: true,
          latitude: exactLat,
          longitude: exactLng,
          approximateArea: safeArea,
        });

        setDetecting(false);
        setIsEditing(false); // Move to review step
        setIsConfirmed(false); // Ask user to review details
        showToast(`🎯 Exact GPS locked (±${accuracy}m)! Please review details below.`, 'success');
      },
      (err) => {
        setDetecting(false);
        let message = 'Could not acquire GPS fix. Please enter location manually.';
        if (err.code === err.PERMISSION_DENIED) {
          message = 'Location access was denied. Please fill in your details manually.';
        } else if (err.code === err.TIMEOUT) {
          message = 'GPS detection timed out. Please enter your location manually.';
        }
        setGeoError(message);
        setIsEditing(true); // Open manual entry form
        showToast(message, 'info');
      },
      geoOptions
    );
  };

  const handleConfirmLocation = () => {
    setIsConfirmed(true);
    setIsEditing(false);
    showToast('✓ Location confirmed!', 'success');
  };

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

      {/* Permission Confirmation Modal (Appears every time user clicks Detect Location) */}
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
              FindLostPuppy requires access to your device's high-accuracy GPS to automatically identify your{' '}
              <strong>State, District, Mandal, and City</strong> for precision lost puppy alerts.
            </p>

            <div className="permission-modal-privacy-box">
              <ShieldCheck size={16} className="privacy-shield-icon" />
              <span>
                <strong>100% Confidential:</strong> Your exact house/flat address is never sent or visible to the public.
              </span>
            </div>

            <div className="permission-modal-actions">
              <button
                type="button"
                className="btn btn-primary btn-lg allow-gps-btn"
                onClick={executeHighAccuracyLocation}
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
      {(hasCoordinates || district || city) && !isEditing && (
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
                <span className="coord-text">{latitude?.toFixed(6)}° N, {longitude?.toFixed(6)}° E</span>
                {accuracyRadius !== null && (
                  <span className="accuracy-text">(±{accuracyRadius}m)</span>
                )}
              </div>
            )}
          </div>

          <div className="detected-details-summary">
            <div className="summary-area-title">
              <MapPin size={18} className="summary-pin-icon" />
              {state && <span className="summary-state-lead">{state}</span>}
              {district && <span className="summary-district-lead">› {district}</span>}
              {mandalOrMunicipality && <span className="summary-mandal-lead">› {mandalOrMunicipality} (Mandal)</span>}
              <strong className="summary-city-lead">› {city || 'City or Village'}</strong>
              {pinCode && <span className="summary-pin">({pinCode})</span>}
            </div>
            <p className="summary-hint">
              Safe public preview: <em>"{approximateArea || calculateApproximate(state, district, mandalOrMunicipality, city)}"</em>
            </p>
          </div>

          {/* Decision Buttons: Option to Submit or Update */}
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

      {/* STEP 3: Manual Edit Form (1. State -> 2. District -> 3. Mandal / Taluk -> 4. City or Village -> 5. ZIP Code -> 6. Update or Submit) */}
      {isEditing && (
        <div className="location-edit-panel">
          <div className="edit-panel-header">
            <h5 className="edit-panel-title">
              <Edit3 size={15} />
              <span>Enter / Update Location Details</span>
            </h5>
            <span className="edit-panel-desc">
              State, District, Mandal/Taluk, City or Village, and ZIP Code updated for recent state reorganizations.
            </span>
          </div>

          <div className="form-vertical-stack">
            {/* 1. State / Region */}
            <div className="form-group">
              <label className="form-label" htmlFor="loc-state">
                1. State / Region <span className="required-tag">*</span>
              </label>
              <div className="input-with-icon">
                <Building size={16} className="input-icon" />
                <input
                  id="loc-state"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Andhra Pradesh, Telangana, Karnataka"
                  value={state}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 2. District (With recent reorganization support) */}
            <div className="form-group">
              <label className="form-label" htmlFor="loc-district">
                2. District <span className="required-tag">*</span>
              </label>
              <div className="input-with-icon">
                <MapPin size={16} className="input-icon" />
                <input
                  id="loc-district"
                  type="text"
                  className="form-input"
                  placeholder="e.g. West Godavari, NTR, Rangareddy, Bengaluru Urban"
                  value={district}
                  onChange={(e) => handleFieldChange('district', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 3. Mandal / Taluk */}
            <div className="form-group">
              <label className="form-label" htmlFor="loc-mandal">
                3. Mandal / Taluk <span className="required-tag">*</span>
              </label>
              <div className="input-with-icon">
                <Landmark size={16} className="input-icon" />
                <input
                  id="loc-mandal"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Undrajavaram, Tanuku, Serilingampally, Bangalore South"
                  value={mandalOrMunicipality}
                  onChange={(e) => handleFieldChange('mandalOrMunicipality', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 4. City or Village */}
            <div className="form-group">
              <label className="form-label" htmlFor="loc-city">
                4. City or Village <span className="required-tag">*</span>
              </label>
              <div className="input-with-icon">
                <Navigation size={16} className="input-icon" />
                <input
                  id="loc-city"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Palangi, Madhapur, Koramangala"
                  value={city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  onBlur={handleCityBlur}
                  required
                />
              </div>
            </div>

            {/* 5. PIN / ZIP Code */}
            <div className="form-group">
              <label className="form-label" htmlFor="loc-pin">
                <span>5. PIN / ZIP Code</span>
                {lookingUpPin && <span className="pin-lookup-indicator">Looking up District & Mandal...</span>}
              </label>
              <div className="input-with-icon">
                <Sparkles size={15} className="input-icon text-amber" />
                <input
                  id="loc-pin"
                  type="text"
                  maxLength={6}
                  className="form-input"
                  placeholder="e.g. 534216 (Auto-detects State, District & Mandal)"
                  value={pinCode}
                  onChange={(e) => handleFieldChange('pinCode', e.target.value)}
                />
              </div>
              <span className="form-hint">Type 6 digits to automatically detect State, District & Mandal.</span>
            </div>
          </div>

          {/* 6. Option to Update or Submit */}
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
                if (pinCode && /^\d{6}$/.test(pinCode.trim())) {
                  lookupByPincode(pinCode.trim(), currentFields);
                } else if (city) {
                  handleCityBlur();
                }
                showToast('Location details updated.', 'info');
              }}
              className="btn btn-outline update-loc-btn"
            >
              <RefreshCw size={14} />
              <span>Update Details</span>
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
            {approximateArea || calculateApproximate(state, district, mandalOrMunicipality, city)}
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
            value={privateAddress}
            onChange={(e) => handleFieldChange('privateAddress', e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
};
