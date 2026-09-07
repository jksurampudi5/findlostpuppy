import React, { useState, useMemo } from 'react';
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
import type { OwnerProfile } from '../types';
import {
  SUPPORTED_STATES,
  getDistrictsForState,
  getMandalsForDistrict,
  getVillagesForMandal,
  normalizeSupportedState,
} from '../utils/geoData';
import { triggerStarCelebration } from '../utils/confettiHelper';

interface LocationOnboardingPageProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

// Clean Mandal / Taluk string from postal block (e.g. "Vundrajavaram (mdl)" -> "Undrajavaram")
const cleanMandal = (rawBlock?: string): string => {
  if (!rawBlock || rawBlock.toUpperCase() === 'NA') return '';
  return rawBlock.replace(/\s*\(mdl\)/i, '').replace(/\s*mandal/i, '').replace(/\s*taluk/i, '').trim();
};

// Auto-derive primary town/city name from mandal selection
const getCleanCityFromMandal = (mandalName: string): string => {
  if (!mandalName || mandalName === 'CUSTOM') return '';
  const parenMatch = mandalName.match(/\(([^)]+)\)/);
  if (
    parenMatch &&
    !parenMatch[1].toLowerCase().includes('urban') &&
    !parenMatch[1].toLowerCase().includes('rural')
  ) {
    const firstPart = parenMatch[1].split('/')[0].trim();
    if (firstPart) return firstPart;
  }
  return mandalName.replace(/\s*\([^)]*\)/g, '').trim();
};

// Normalize district based on recent reorganizations in AP (2022 26 districts), Telangana (33), Karnataka (31)
const normalizeRecentDistrict = (stateName: string, distName: string, areaHint: string): string => {
  const normState = stateName.trim().toLowerCase();
  const hint = `${distName} ${areaHint}`.toLowerCase();

  // Check direct match with official state districts first
  const stateDistricts = getDistrictsForState(stateName);
  const directMatch = stateDistricts.find(
    (d) => d.toLowerCase() === distName.trim().toLowerCase()
  );
  if (directMatch) return directMatch;

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
    if (hint.includes('nellore') || hint.includes('kavali')) {
      return 'SPSR Nellore';
    }
    if (hint.includes('anantapur') || hint.includes('guntakal')) {
      return 'Ananthapuramu (Anantapur)';
    }
    if (hint.includes('kadapa') || hint.includes('proddatur')) {
      return 'YSR Kadapa';
    }
  }

  // 2. Telangana (33 Districts)
  if (normState.includes('telangana')) {
    if (hint.includes('vikarabad') || hint.includes('tandur') || hint.includes('parigi') || hint.includes('kodangal')) {
      return 'Vikarabad';
    }
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
    if (hint.includes('gadwal') || hint.includes('alampur')) {
      return 'Jogulamba Gadwal';
    }
    if (hint.includes('bhupalpally')) {
      return 'Jayashankar Bhupalpally';
    }
    if (hint.includes('asifabad') || hint.includes('kagaznagar')) {
      return 'Kumuram Bheem Asifabad';
    }
    if (hint.includes('sircilla')) {
      return 'Rajanna Sircilla';
    }
    if (hint.includes('bhuvanagiri') || hint.includes('yadadri')) {
      return 'Yadadri Bhuvanagiri';
    }
  }

  // 3. Karnataka (31 Districts)
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

  // Fallback: check if distName matches any district in state
  const partial = stateDistricts.find((d) => d.toLowerCase().includes(distName.toLowerCase()));
  return partial || distName;
};

export const LocationOnboardingPage: React.FC<LocationOnboardingPageProps> = ({ onSuccess, onBack }) => {
  const { user, refreshProgress, setActiveOnboardingTab } = useAuth();
  const { showToast } = useToast();

  const existingProfile = user ? storageService.getOwnerProfileByUserId(user.id) : null;
  const hasExistingData = !!(existingProfile && (existingProfile.district || existingProfile.city));

  // Initialized supported state
  const initialValidState = normalizeSupportedState(existingProfile?.state || 'Andhra Pradesh');
  const initialDistricts = getDistrictsForState(initialValidState);
  const initialValidDistrict =
    existingProfile?.district && initialDistricts.includes(existingProfile.district)
      ? existingProfile.district
      : (initialDistricts[0] || '');
  const initialMandals = getMandalsForDistrict(initialValidState, initialValidDistrict);
  const initialMandal = existingProfile?.mandalOrMunicipality || initialMandals[0] || '';
  const initialIsCustom = !!(initialMandal && !initialMandals.includes(initialMandal));

  const initialVillages = getVillagesForMandal(initialValidState, initialValidDistrict, initialMandal);
  const initialValidCity =
    existingProfile?.city || initialVillages[0] || getCleanCityFromMandal(initialMandal) || '';
  const initialIsCustomCity = !!(initialValidCity && !initialVillages.includes(initialValidCity));

  // Form Field States
  const [state, setState] = useState<string>(initialValidState);
  const [district, setDistrict] = useState<string>(initialValidDistrict);
  const [mandalOrMunicipality, setMandalOrMunicipality] = useState<string>(initialMandal);
  const [isCustomMandal, setIsCustomMandal] = useState<boolean>(initialIsCustom);
  const [customMandalText, setCustomMandalText] = useState<string>(initialIsCustom ? initialMandal : '');

  const [city, setCity] = useState<string>(initialValidCity);
  const [isCustomCity, setIsCustomCity] = useState<boolean>(initialIsCustomCity);
  const [customCityText, setCustomCityText] = useState<string>(initialIsCustomCity ? initialValidCity : '');

  const [pinCode, setPinCode] = useState(existingProfile?.pinCode || '');
  const [latitude, setLatitude] = useState<number | undefined>(existingProfile?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(existingProfile?.longitude);

  // Dynamic available districts, mandals, and villages based on cascading selection
  const availableDistricts = useMemo(() => getDistrictsForState(state), [state]);
  const availableMandals = useMemo(() => getMandalsForDistrict(state, district), [state, district]);
  const availableVillages = useMemo(
    () => getVillagesForMandal(state, district, mandalOrMunicipality),
    [state, district, mandalOrMunicipality]
  );

  // UI Flow States
  const [hasDetected, setHasDetected] = useState<boolean>(hasExistingData);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(hasExistingData);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [detecting, setDetecting] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [lookingUpPin, setLookingUpPin] = useState(false);

  // Cascading Selection Handlers with Full State -> District -> Mandal -> City/Village Hierarchy
  const handleStateChange = (newState: string) => {
    setState(newState);
    const newDistricts = getDistrictsForState(newState);
    const defaultDistrict = newDistricts[0] || '';
    setDistrict(defaultDistrict);
    const newMandals = getMandalsForDistrict(newState, defaultDistrict);
    const defaultMandal = newMandals[0] || '';
    setMandalOrMunicipality(defaultMandal);
    setIsCustomMandal(false);
    setCustomMandalText('');

    const villages = getVillagesForMandal(newState, defaultDistrict, defaultMandal);
    const defaultCity = villages[0] || getCleanCityFromMandal(defaultMandal) || '';
    setCity(defaultCity);
    setIsCustomCity(false);
    setCustomCityText('');
  };

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    const newMandals = getMandalsForDistrict(state, newDistrict);
    const defaultMandal = newMandals[0] || '';
    setMandalOrMunicipality(defaultMandal);
    setIsCustomMandal(false);
    setCustomMandalText('');

    const villages = getVillagesForMandal(state, newDistrict, defaultMandal);
    const defaultCity = villages[0] || getCleanCityFromMandal(defaultMandal) || '';
    setCity(defaultCity);
    setIsCustomCity(false);
    setCustomCityText('');
  };

  const handleMandalSelect = (selectedVal: string) => {
    if (selectedVal === 'CUSTOM') {
      setIsCustomMandal(true);
      setMandalOrMunicipality(customMandalText.trim());
      const villages = getVillagesForMandal(state, district, customMandalText.trim());
      const defaultCity = villages[0] || customMandalText.trim() || '';
      setCity(defaultCity);
      setIsCustomCity(false);
      setCustomCityText('');
    } else {
      setIsCustomMandal(false);
      setMandalOrMunicipality(selectedVal);
      // Automatically populate villages under this selected Mandal!
      const villages = getVillagesForMandal(state, district, selectedVal);
      const defaultCity = villages[0] || getCleanCityFromMandal(selectedVal) || '';
      setCity(defaultCity);
      setIsCustomCity(false);
      setCustomCityText('');
    }
  };

  const handleCustomMandalChange = (val: string) => {
    setCustomMandalText(val);
    setMandalOrMunicipality(val);
    const villages = getVillagesForMandal(state, district, val);
    const defaultCity = villages[0] || val.trim() || '';
    setCity(defaultCity);
    setIsCustomCity(false);
    setCustomCityText('');
  };

  const handleCitySelect = (selectedVal: string) => {
    if (selectedVal === 'CUSTOM') {
      setIsCustomCity(true);
      setCity(customCityText.trim());
    } else {
      setIsCustomCity(false);
      setCity(selectedVal);
    }
  };

  const handleCustomCityChange = (val: string) => {
    setCustomCityText(val);
    setCity(val);
  };

  // Compute safe public preview string
  const calculatePublicArea = () => {
    const finalCity = isCustomCity ? customCityText.trim() : city.trim();
    const finalMandal = isCustomMandal ? customMandalText.trim() : mandalOrMunicipality.trim();
    const parts = [finalCity, finalMandal ? `${finalMandal} (Mandal)` : '', district, state].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Your City / District Area';
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
              const detectedState = normalizeSupportedState(po.State || state);
              const rawDistrict = po.District || district;
              const detectedMandal = cleanMandal(po.Block) || mandalOrMunicipality;
              const detectedCity = city || po.Name;
              const normalizedDist = normalizeRecentDistrict(detectedState, rawDistrict, `${detectedCity} ${detectedMandal}`);

              setState(detectedState);
              setDistrict(normalizedDist);
              setCity(detectedCity);

              const mandals = getMandalsForDistrict(detectedState, normalizedDist);
              if (mandals.includes(detectedMandal)) {
                setMandalOrMunicipality(detectedMandal);
                setIsCustomMandal(false);
              } else if (detectedMandal) {
                setMandalOrMunicipality(detectedMandal);
                setIsCustomMandal(true);
                setCustomMandalText(detectedMandal);
              }

              const villages = getVillagesForMandal(detectedState, normalizedDist, detectedMandal);
              if (villages.includes(detectedCity)) {
                setIsCustomCity(false);
              } else if (detectedCity) {
                setIsCustomCity(true);
                setCustomCityText(detectedCity);
              }

              showToast(`✨ Auto-detected: ${detectedMandal || detectedCity}, ${normalizedDist}`, 'success');
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
            const detectedState = normalizeSupportedState(addr.state || state);
            const rawDistrict = addr.state_district || addr.county || addr.district || district;
            const detectedMandal = cleanMandal(addr.subdistrict || addr.county) || mandalOrMunicipality;
            const detectedCity = addr.city || addr.town || addr.village || addr.suburb || city;
            const detectedPin = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : pinCode;
            const normalizedDist = normalizeRecentDistrict(detectedState, rawDistrict, `${detectedCity} ${detectedMandal}`);

            setState(detectedState);
            setDistrict(normalizedDist);
            setCity(detectedCity);
            if (detectedPin) setPinCode(detectedPin);

            const mandals = getMandalsForDistrict(detectedState, normalizedDist);
            if (mandals.includes(detectedMandal)) {
              setMandalOrMunicipality(detectedMandal);
              setIsCustomMandal(false);
            } else if (detectedMandal) {
              setMandalOrMunicipality(detectedMandal);
              setIsCustomMandal(true);
              setCustomMandalText(detectedMandal);
            }

            const villages = getVillagesForMandal(detectedState, normalizedDist, detectedMandal);
            if (villages.includes(detectedCity)) {
              setIsCustomCity(false);
            } else if (detectedCity) {
              setIsCustomCity(true);
              setCustomCityText(detectedCity);
            }

            setHasDetected(true);
            showToast('🎯 Location detected! Details populated below.', 'success');
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

    if (!district.trim() && !city.trim()) {
      showToast('Please enter your District or City / Village.', 'warning');
      return;
    }

    if (!user) return;

    const finalMandal = isCustomMandal ? customMandalText.trim() : mandalOrMunicipality.trim();
    const finalCity = isCustomCity ? customCityText.trim() : city.trim();

    const profile: OwnerProfile = {
      ...(existingProfile || {}),
      id: existingProfile?.id || `owner-${user.id}`,
      userId: user.id,
      fullName: existingProfile?.fullName || user.name || 'Pet Parent',
      phone: existingProfile?.phone || user.phone || '',
      email: user.email,
      state: state.trim(),
      district: district.trim(),
      mandalOrMunicipality: finalMandal,
      city: finalCity,
      pinCode: pinCode.trim(),
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
  };

  return (
    <div className="onboarding-page">
      <div className="app-container onboarding-container">
        <div className="onboarding-card card owner-theme-card">
          {/* Header Greeting */}
          <div className="onboarding-header">
            <div className="cute-welcome-banner">
              <div className="cute-welcome-icon">📍</div>
              <div className="cute-welcome-text">
                <h1 className="cute-page-title">Location Details 🐾</h1>
                <p className="cute-page-sub">
                  One-click auto detection for your State, District, Mandal, and City.
                </p>
              </div>
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
                  FindLostPuppy uses device GPS to automatically fill your State, District, Mandal, and City so neighbors nearby can help search for your puppy.
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
                <div className="preview-highlight-text">
                  {calculatePublicArea()}
                </div>
                <div className="preview-highlight-meta">
                  <span>State: <strong>{state}</strong></span>
                  <span>•</span>
                  <span>District: <strong>{district}</strong></span>
                  {mandalOrMunicipality && (
                    <>
                      <span>•</span>
                      <span>Mandal: <strong>{mandalOrMunicipality}</strong></span>
                    </>
                  )}
                  {pinCode && (
                    <>
                      <span>•</span>
                      <span>PIN: <strong>{pinCode}</strong></span>
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
                <form onSubmit={handleSaveLocation} className="onboarding-form" style={{ marginTop: '1.5rem' }}>
                  <div className="form-section-card cute-section-card">
                    <h3 className="section-title-sm cute-section-title">
                      <span className="cute-title-icon">📝</span>
                      <span>{isEditing ? 'Edit Location Details' : 'Review & Confirm Details'}</span>
                    </h3>

                    <div className="form-vertical-stack">
                      {/* 1. State / Region Dropdown */}
                      <div className="form-group">
                        <label className="form-label cute-label" htmlFor="loc-state">
                          <span>1. State / Region</span> <span className="required-tag">*</span>
                        </label>
                        <div className="input-with-icon">
                          <Building size={16} className="input-icon text-terracotta" />
                          <select
                            id="loc-state"
                            className="form-input cute-input cute-select"
                            value={state}
                            onChange={(e) => handleStateChange(e.target.value)}
                            required
                          >
                            {SUPPORTED_STATES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 2. District Dropdown (Cascading based on State) */}
                      <div className="form-group">
                        <label className="form-label cute-label" htmlFor="loc-district">
                          <span>2. District ({state})</span> <span className="required-tag">*</span>
                        </label>
                        <div className="input-with-icon">
                          <MapPin size={16} className="input-icon text-terracotta" />
                          <select
                            id="loc-district"
                            className="form-input cute-input cute-select"
                            value={district}
                            onChange={(e) => handleDistrictChange(e.target.value)}
                            required
                          >
                            <option value="" disabled>-- Select District under {state} --</option>
                            {availableDistricts.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 3. Mandal / Taluk Dropdown (Cascading based on State & District) */}
                      <div className="form-group">
                        <label className="form-label cute-label" htmlFor="loc-mandal">
                          <span>3. Mandal / Taluk {district ? `(${district})` : ''}</span> <span className="required-tag">*</span>
                        </label>
                        <div className="input-with-icon">
                          <Landmark size={16} className="input-icon text-terracotta" />
                          <select
                            id="loc-mandal"
                            className="form-input cute-input cute-select"
                            value={
                              isCustomMandal
                                ? 'CUSTOM'
                                : availableMandals.includes(mandalOrMunicipality)
                                ? mandalOrMunicipality
                                : (mandalOrMunicipality ? 'CUSTOM' : '')
                            }
                            onChange={(e) => handleMandalSelect(e.target.value)}
                            required={!isCustomMandal}
                          >
                            <option value="" disabled>-- Select Mandal / Taluk --</option>
                            {availableMandals.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                            <option value="CUSTOM">✏️ Other / Custom Mandal</option>
                          </select>
                        </div>

                        {/* Custom Mandal Input if chosen or auto-detected rural block */}
                        {isCustomMandal && (
                          <div className="custom-mandal-input-wrap" style={{ marginTop: '0.65rem' }}>
                            <input
                              type="text"
                              className="form-input cute-input"
                              placeholder="Enter custom Mandal / Municipality name"
                              value={customMandalText}
                              onChange={(e) => handleCustomMandalChange(e.target.value)}
                              required
                            />
                            <span className="form-hint">Enter your specific Mandal, Taluk, or Municipal block.</span>
                          </div>
                        )}
                      </div>

                      {/* 4. City or Village Dropdown (Cascades under Mandal) */}
                      <div className="form-group">
                        <label className="form-label cute-label" htmlFor="loc-city">
                          <span>4. City or Village {mandalOrMunicipality ? `(${mandalOrMunicipality})` : ''}</span> <span className="required-tag">*</span>
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
                            ✨ Cascading from {mandalOrMunicipality || 'Mandal'}
                          </span>
                        </label>
                        <div className="input-with-icon">
                          <Navigation size={16} className="input-icon text-terracotta" />
                          <select
                            id="loc-city"
                            className="form-input cute-input cute-select"
                            value={
                              isCustomCity
                                ? 'CUSTOM'
                                : availableVillages.includes(city)
                                ? city
                                : (city ? 'CUSTOM' : '')
                            }
                            onChange={(e) => handleCitySelect(e.target.value)}
                            required={!isCustomCity}
                          >
                            <option value="" disabled>-- Select City / Village under {mandalOrMunicipality || 'Mandal'} --</option>
                            {availableVillages.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                            <option value="CUSTOM">✏️ Other / Custom Village or Locality</option>
                          </select>
                        </div>

                        {/* Custom Village Input if chosen or rural hamlet */}
                        {isCustomCity && (
                          <div className="custom-city-input-wrap" style={{ marginTop: '0.65rem' }}>
                            <input
                              type="text"
                              className="form-input cute-input"
                              placeholder="Enter custom Village, Colony or Locality name"
                              value={customCityText}
                              onChange={(e) => handleCustomCityChange(e.target.value)}
                              required
                            />
                            <span className="form-hint">Enter your specific village, colony, or street locality.</span>
                          </div>
                        )}
                      </div>

                      {/* 5. PIN / ZIP Code */}
                      <div className="form-group">
                        <label className="form-label cute-label" htmlFor="loc-pin">
                          <span>5. PIN / ZIP Code</span>
                          {lookingUpPin && <span className="pin-lookup-indicator">Detecting District & Mandal...</span>}
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
                        <span className="form-hint">Type 6 digits to automatically detect State, District & Mandal.</span>
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
