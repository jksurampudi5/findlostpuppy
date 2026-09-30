import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Check,
  MapPin,
  Navigation,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Video,
  X,
  Landmark,
  Building2,
  Home,
  Calendar,
  Info,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { storageBucketService } from '../services/storageBucketService';
import { locationService } from '../services/locationService';
import type { LostReport, Sighting, OwnerProfile, LocationLocality } from '../types';
import { detectResilientLocation } from '../utils/geolocationHelper';
import { getDogDisplayName, getDogPhotoUrl, handleDogImageError } from '../utils/dogPhotoHelper';
import { PermissionRationaleModal } from '../components/PermissionRationaleModal';
import { PetProfileSelector, type SelectorOption } from '../components/PetProfileSelector';
import { compressImage } from '../utils/imageCompressor';

interface ReportGeoLocation {
  state: string;
  district: string;
  mandal: string;
  village: string;
}

const getReportGeo = (r: LostReport, profiles: OwnerProfile[]): ReportGeoLocation => {
  const cleanOwnerId = (r.ownerId || '').replace(/^owner-/, '').toLowerCase().trim();
  const safeContact = (r.contactMechanism?.safeContactEmail || '').toLowerCase().trim();

  const p = profiles.find((pr) => {
    const prId = (pr.id || '').replace(/^owner-/, '').toLowerCase().trim();
    const prUserId = (pr.userId || '').replace(/^owner-/, '').toLowerCase().trim();
    const prEmail = (pr.email || '').toLowerCase().trim();
    return (
      (prId && prId === cleanOwnerId) ||
      (prUserId && prUserId === cleanOwnerId) ||
      (prEmail && safeContact && prEmail === safeContact)
    );
  });

  let state = (p?.state || '').trim();
  let district = (p?.district || '').trim();
  let mandal = (p?.mandalOrMunicipality || '').trim();
  let village = (p?.city || p?.streetOrLocality || '').trim();

  const combinedText = `${r.lastKnownLocation || ''} ${r.ownerApproximateLocation || ''} ${p?.approximateArea || ''} ${p?.address || ''}`.trim();

  // If state is missing, infer from combinedText
  if (!state) {
    if (/andhra pradesh|\bap\b/i.test(combinedText)) state = 'Andhra Pradesh';
    else if (/telangana|\bts\b/i.test(combinedText)) state = 'Telangana';
    else if (/karnataka|\bka\b/i.test(combinedText)) state = 'Karnataka';
    else if (/tamil nadu|\btn\b/i.test(combinedText)) state = 'Tamil Nadu';
    else if (/maharashtra/i.test(combinedText)) state = 'Maharashtra';
    else if (/kerala/i.test(combinedText)) state = 'Kerala';
    else if (/vikarabad|hyderabad|rangareddy|yennaepally/i.test(combinedText)) state = 'Telangana';
    else if (/godavari|palangi|undrajavaram|tanuku|guntur|krishna/i.test(combinedText)) state = 'Andhra Pradesh';
    else if (/bengaluru|bangalore|mysuru|mysore/i.test(combinedText)) state = 'Karnataka';
  }

  // If district is missing, infer
  if (!district && combinedText) {
    if (/west godavari/i.test(combinedText)) district = 'West Godavari';
    else if (/east godavari/i.test(combinedText)) district = 'East Godavari';
    else if (/vikarabad|yennaepally/i.test(combinedText)) district = 'Vikarabad';
    else if (/hyderabad/i.test(combinedText)) district = 'Hyderabad';
    else if (/rangareddy|ranga reddy/i.test(combinedText)) district = 'Rangareddy';
    else if (/bengaluru|bangalore/i.test(combinedText)) district = 'Bengaluru Urban';
    else if (/palangi|undrajavaram|tanuku/i.test(combinedText)) district = 'West Godavari';
  }

  // If mandal is missing, infer
  if (!mandal && combinedText) {
    if (/undrajavaram/i.test(combinedText)) mandal = 'Undrajavaram';
    else if (/vikarabad|yennaepally/i.test(combinedText)) mandal = 'Vikarabad';
    else if (/tanuku/i.test(combinedText)) mandal = 'Tanuku';
    else if (/palangi/i.test(combinedText)) mandal = 'Undrajavaram';
  }

  // If village is missing, infer
  if (!village && combinedText) {
    if (/palangi/i.test(combinedText)) village = 'Palangi';
    else if (/yennaepally/i.test(combinedText)) village = 'Yennaepally';
  }

  return { state, district, mandal, village };
};

const isMatchState = (r: LostReport, targetState: string, profiles: OwnerProfile[]): boolean => {
  if (!targetState) return true;
  const geo = getReportGeo(r, profiles);
  const ts = targetState.trim().toLowerCase();
  if (geo.state && geo.state.toLowerCase() === ts) return true;
  const combinedText = `${r.lastKnownLocation || ''} ${r.ownerApproximateLocation || ''}`.toLowerCase();
  return combinedText.includes(ts);
};

const isMatchDistrict = (r: LostReport, targetState: string, targetDistrict: string, profiles: OwnerProfile[]): boolean => {
  if (!isMatchState(r, targetState, profiles)) return false;
  if (!targetDistrict) return true;
  const geo = getReportGeo(r, profiles);
  const td = targetDistrict.trim().toLowerCase();
  if (geo.district && geo.district.toLowerCase() === td) return true;
  const combinedText = `${r.lastKnownLocation || ''} ${r.ownerApproximateLocation || ''}`.toLowerCase();
  return combinedText.includes(td);
};

const isMatchMandal = (r: LostReport, targetState: string, targetDistrict: string, targetMandal: string, profiles: OwnerProfile[]): boolean => {
  if (!isMatchDistrict(r, targetState, targetDistrict, profiles)) return false;
  if (!targetMandal) return true;
  const geo = getReportGeo(r, profiles);
  const tm = targetMandal.trim().toLowerCase();
  if (geo.mandal && geo.mandal.toLowerCase() === tm) return true;
  const combinedText = `${r.lastKnownLocation || ''} ${r.ownerApproximateLocation || ''}`.toLowerCase();
  return combinedText.includes(tm);
};

const isMatchCity = (r: LostReport, targetState: string, targetDistrict: string, targetMandal: string, targetCity: string, profiles: OwnerProfile[]): boolean => {
  if (!isMatchMandal(r, targetState, targetDistrict, targetMandal, profiles)) return false;
  if (!targetCity) return true;
  const geo = getReportGeo(r, profiles);
  const tc = targetCity.trim().toLowerCase();
  if (geo.village && (geo.village.toLowerCase() === tc || geo.village.toLowerCase().includes(tc) || tc.includes(geo.village.toLowerCase()))) return true;
  const combinedText = `${r.lastKnownLocation || ''} ${r.ownerApproximateLocation || ''}`.toLowerCase();
  return combinedText.includes(tc);
};

export const CapturePetPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [reports, setReports] = useState<LostReport[]>([]);
  const [profiles, setProfiles] = useState<OwnerProfile[]>([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [detailReport, setDetailReport] = useState<LostReport | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [activeReviewPhotoIndex, setActiveReviewPhotoIndex] = useState(0);
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [showCameraRationale, setShowCameraRationale] = useState(false);
  const [showLocationRationale, setShowLocationRationale] = useState(false);
  const [cameraConsentAccepted, setCameraConsentAccepted] = useState(false);
  const [locationConsentAccepted, setLocationConsentAccepted] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [showCameraPermissionDialog, setShowCameraPermissionDialog] = useState(false);
  const [showSuccessTick, setShowSuccessTick] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [detectedLocation, setDetectedLocation] = useState({
    state: '',
    district: '',
    mandal: '',
    village: '',
    pinCode: '',
  });
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();

  // Capture filters always start blank. The person reporting the sighting must
  // deliberately choose each level for the area where the pet was seen.
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [mandalOrMunicipality, setMandalOrMunicipality] = useState('');
  const [city, setCity] = useState('');

  const [activeLocationModal, setActiveLocationModal] = useState<'state' | 'district' | 'mandal' | 'city' | null>(null);
  const [localities, setLocalities] = useState<LocationLocality[]>([]);

  const handleResetAreaFilters = () => {
    setState('');
    setDistrict('');
    setMandalOrMunicipality('');
    setCity('');
    setSelectedReportId('');
    showToast('Location filters reset. Please manually select State, District, Mandal, and Home Base.', 'info');
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera capture is not available in this browser.');
      return;
    }

    try {
      setCameraError('');
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: cameraFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch (err: any) {
      setCameraReady(false);
      const isDenied = err?.name === 'NotAllowedError' || /permission|denied/i.test(err?.message || '');
      setCameraError(
        isDenied
          ? 'Camera permission is blocked. Please allow camera access in browser or device settings.'
          : 'Could not open the camera. Please try again.'
      );
      if (isDenied) {
        setShowCameraPermissionDialog(true);
      }
      showToast('Camera permission is needed to capture the missing pet.', 'warning');
    }
  }, [cameraFacingMode, showToast, stopCamera]);

  useEffect(() => {
    const loadReports = () => {
      setReports(storageService.getAllReports().filter((report) => report.status === 'LOST'));
      setProfiles(storageService.getAllOwnerProfiles());
    };
    loadReports();
    window.addEventListener('findlostpuppy_reports_updated', loadReports);
    window.addEventListener('storage', loadReports);
    return () => {
      window.removeEventListener('findlostpuppy_reports_updated', loadReports);
      window.removeEventListener('storage', loadReports);
    };
  }, []);

  // Alert counts for the currently selected location squares
  const stateAlertCount = useMemo(
    () => (state ? reports.filter((r) => isMatchState(r, state, profiles)).length : 0),
    [state, reports, profiles]
  );
  const districtAlertCount = useMemo(
    () => (state && district ? reports.filter((r) => isMatchDistrict(r, state, district, profiles)).length : 0),
    [state, district, reports, profiles]
  );
  const mandalAlertCount = useMemo(
    () => (state && mandalOrMunicipality ? reports.filter((r) => isMatchMandal(r, state, district, mandalOrMunicipality, profiles)).length : 0),
    [state, district, mandalOrMunicipality, reports, profiles]
  );
  const cityAlertCount = useMemo(
    () => (state && city ? reports.filter((r) => isMatchCity(r, state, district, mandalOrMunicipality, city, profiles)).length : 0),
    [state, district, mandalOrMunicipality, city, reports, profiles]
  );

  // Cascading Location Selectors with Green Alert Indicators
  const stateOptions: SelectorOption[] = useMemo(() => {
    return locationService.getStates().map((s) => {
      const count = reports.filter((r) => isMatchState(r, s.name, profiles)).length;
      return {
        id: s.name,
        label: s.name,
        icon: <Landmark size={18} />,
        hasPetAlert: count > 0,
        alertCount: count,
        secondaryLabel: count > 0 ? `${count} active missing pet ${count === 1 ? 'alert' : 'alerts'}` : undefined,
      };
    }).sort((a, b) => {
      if (a.hasPetAlert && !b.hasPetAlert) return -1;
      if (!a.hasPetAlert && b.hasPetAlert) return 1;
      return a.label.localeCompare(b.label);
    });
  }, [reports, profiles]);

  const districtOptions: SelectorOption[] = useMemo(() => {
    if (!state) return [];
    return locationService.getDistricts(state).map((d) => {
      const count = reports.filter((r) => isMatchDistrict(r, state, d.districtName, profiles)).length;
      return {
        id: d.districtName,
        label: d.districtName,
        icon: <Building2 size={18} />,
        hasPetAlert: count > 0,
        alertCount: count,
        secondaryLabel: count > 0 ? `${count} active missing pet ${count === 1 ? 'alert' : 'alerts'}` : undefined,
      };
    }).sort((a, b) => {
      if (a.hasPetAlert && !b.hasPetAlert) return -1;
      if (!a.hasPetAlert && b.hasPetAlert) return 1;
      return a.label.localeCompare(b.label);
    });
  }, [state, reports, profiles]);

  const mandalOptions: SelectorOption[] = useMemo(() => {
    if (!state || !district) return [];
    return locationService.getSubDistricts(district, state).map((m) => {
      const count = reports.filter((r) => isMatchMandal(r, state, district, m.subDistrictName, profiles)).length;
      return {
        id: m.subDistrictName,
        label: m.subDistrictName,
        icon: <MapPin size={18} />,
        hasPetAlert: count > 0,
        alertCount: count,
        secondaryLabel: count > 0 ? `${count} active missing pet ${count === 1 ? 'alert' : 'alerts'}` : undefined,
      };
    }).sort((a, b) => {
      if (a.hasPetAlert && !b.hasPetAlert) return -1;
      if (!a.hasPetAlert && b.hasPetAlert) return 1;
      return a.label.localeCompare(b.label);
    });
  }, [state, district, reports, profiles]);

  useEffect(() => {
    let isMounted = true;
    if (state && district && mandalOrMunicipality) {
      const distObj = locationService.getDistrict(state, district);
      if (distObj) {
        const subObj = locationService.getSubDistrict(distObj.districtCode, mandalOrMunicipality);
        if (subObj) {
          locationService
            .getLocalities(distObj.districtCode, subObj.subDistrictCode)
            .then((list) => {
              if (isMounted) setLocalities(list);
            })
            .catch(() => {
              if (isMounted) setLocalities([]);
            });
          return () => {
            isMounted = false;
          };
        }
      }
    }
    setLocalities([]);
    return () => {
      isMounted = false;
    };
  }, [state, district, mandalOrMunicipality]);

  const villageOptions: SelectorOption[] = useMemo(() => {
    const villageNames = new Set<string>();
    localities.forEach((l) => villageNames.add(l.localityName));

    // Also include any villages directly reported on dogs in this mandal/district/state
    reports.forEach((r) => {
      const geo = getReportGeo(r, profiles);
      if (geo.village && isMatchMandal(r, state, district, mandalOrMunicipality, profiles)) {
        villageNames.add(geo.village);
      }
    });

    const selectedMandal = mandalOrMunicipality.trim().toLowerCase();
    const list = Array.from(villageNames).filter(
      (villageName) => villageName.trim().toLowerCase() !== selectedMandal
    );

    return list.map((vName) => {
      const count = reports.filter((r) => isMatchCity(r, state, district, mandalOrMunicipality, vName, profiles)).length;
      return {
        id: vName,
        label: vName,
        icon: <Home size={18} />,
        hasPetAlert: count > 0,
        alertCount: count,
        secondaryLabel: count > 0 ? `${count} active missing pet ${count === 1 ? 'alert' : 'alerts'}` : undefined,
      };
    }).sort((a, b) => {
      if (a.hasPetAlert && !b.hasPetAlert) return -1;
      if (!a.hasPetAlert && b.hasPetAlert) return 1;
      return a.label.localeCompare(b.label);
    });
  }, [localities, reports, profiles, state, district, mandalOrMunicipality]);

  // Hierarchical Strict Filtered Reports:
  // ONLY show pets present in the selected location filter, or 0 if none are present!
  const { displayedReports, filterContextText } = useMemo(() => {
    if (!state && !district && !mandalOrMunicipality && !city) {
      return {
        displayedReports: reports,
        filterContextText: 'Showing all active missing pet alerts',
      };
    }

    if (city) {
      const matches = reports.filter((r) => isMatchCity(r, state, district, mandalOrMunicipality, city, profiles));
      return {
        displayedReports: matches,
        filterContextText: matches.length > 0 ? `Showing pets in ${city}` : `No active missing pets reported in ${city}`,
      };
    }

    if (mandalOrMunicipality) {
      const matches = reports.filter((r) => isMatchMandal(r, state, district, mandalOrMunicipality, profiles));
      return {
        displayedReports: matches,
        filterContextText: matches.length > 0 ? `Showing pets across ${mandalOrMunicipality} Mandal` : `No active missing pets reported in ${mandalOrMunicipality} Mandal`,
      };
    }

    if (district) {
      const matches = reports.filter((r) => isMatchDistrict(r, state, district, profiles));
      return {
        displayedReports: matches,
        filterContextText: matches.length > 0 ? `Showing pets in ${district} District` : `No active missing pets reported in ${district} District`,
      };
    }

    if (state) {
      const matches = reports.filter((r) => isMatchState(r, state, profiles));
      return {
        displayedReports: matches,
        filterContextText: matches.length > 0 ? `Showing pets in ${state}` : `No active missing pets reported in ${state}`,
      };
    }

    return {
      displayedReports: reports,
      filterContextText: 'Showing all active missing pet alerts',
    };
  }, [reports, profiles, state, district, mandalOrMunicipality, city]);

  const selectedReport: LostReport | null = useMemo(
    () => displayedReports.find((report) => report.id === selectedReportId) || displayedReports[0] || null,
    [displayedReports, selectedReportId]
  );

  useEffect(() => {
    if (displayedReports.length > 0) {
      if (!selectedReportId || !displayedReports.some((r) => r.id === selectedReportId)) {
        setSelectedReportId(displayedReports[0].id);
      }
    } else {
      setSelectedReportId('');
    }
  }, [displayedReports, selectedReportId]);

  // Stop camera on unmount (navigation away)
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Stop camera when user switches tabs, minimizes app, or the page is hidden
  // This ensures the camera indicator light turns off when not actively using the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopCamera();
      }
    };
    const handlePageHide = () => {
      stopCamera();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [stopCamera]);

  const handleEnableCamera = () => {
    setShowCameraRationale(false);
    setCameraConsentAccepted(true);
    startCamera();
  };

  const handleCaptureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraReady) {
      showToast('Please allow the camera before capturing.', 'warning');
      return;
    }

    if (capturedPhotos.length >= 3) {
      showToast('Maximum 3 photos can be captured.', 'info');
      setShowReviewPopup(true);
      stopCamera();
      return;
    }

    const width = video.videoWidth || 900;
    const height = video.videoHeight || 900;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, width, height);
    const newPhoto = canvas.toDataURL('image/jpeg', 0.86);
    const updated = [...capturedPhotos, newPhoto];
    setCapturedPhotos(updated);

    if (updated.length >= 3) {
      setShowReviewPopup(true);
      setActiveReviewPhotoIndex(0);
      stopCamera();
      showToast('All 3 photos captured! Review your sighting.', 'success');
    } else {
      showToast(`Photo ${updated.length} of 3 captured. Take another or tap Done/Skip.`, 'success');
    }
  };

  const handleGalleryPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (capturedPhotos.length >= 3) {
      showToast('Maximum 3 photos can be added.', 'info');
      return;
    }
    try {
      const compressed = await compressImage(file, 900, 900, 0.82);
      setCapturedPhotos((current) => [...current, compressed].slice(0, 3));
      setShowCameraPermissionDialog(false);
      showToast('Photo added from gallery.', 'success');
    } catch {
      showToast('We could not process that image. Please choose another photo.', 'error');
    }
  };

  const handleRemovePhoto = (idxToRemove: number) => {
    const updated = capturedPhotos.filter((_, i) => i !== idxToRemove);
    setCapturedPhotos(updated);
    if (activeReviewPhotoIndex >= updated.length) {
      setActiveReviewPhotoIndex(Math.max(0, updated.length - 1));
    }
    if (updated.length === 0) {
      setShowReviewPopup(false);
      // Don't auto-restart camera — user must click "Turn on Camera" again
      // This prevents unintended camera access
    }
  };

  const handleProceedToReview = () => {
    if (capturedPhotos.length === 0) {
      showToast('Please capture at least 1 photo first.', 'warning');
      return;
    }
    setShowReviewPopup(true);
    setActiveReviewPhotoIndex(0);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedPhotos([]);
    setActiveReviewPhotoIndex(0);
    setLocationText('');
    setDetectedLocation({ state: '', district: '', mandal: '', village: '', pinCode: '' });
    setLatitude(undefined);
    setLongitude(undefined);
    setShowReviewPopup(false);
    // Reset consent so user must explicitly click "Turn on Camera" again
    // This gives clear, intentional control over when camera is active
    setCameraConsentAccepted(false);
    stopCamera();
  };

  const handleCloseReview = () => {
    setShowReviewPopup(false);
    // Don't auto-restart camera — user must click "Turn on Camera" again
    // Camera should only be on when explicitly requested
  };

  const handleRotateCamera = () => {
    // Only switch and restart if camera is currently running
    // If camera is off, just update the mode for when they turn it on next
    const wasRunning = cameraReady;
    setCameraFacingMode((current) => (current === 'environment' ? 'user' : 'environment'));
    if (wasRunning) {
      // startCamera will pick up the new facingMode in the next render cycle
      // We stop immediately and let the user see the "Turn on Camera" button briefly,
      // then restart automatically since they clearly want the camera on (they just rotated it)
      stopCamera();
      // Small timeout so facingMode state update is committed before startCamera reads it
      setTimeout(() => { startCamera(); }, 80);
    }
  };

  const handleDetectLocation = async (hasConfirmed = locationConsentAccepted) => {
    if (!hasConfirmed) {
      setShowLocationRationale(true);
      return;
    }
    setDetecting(true);
    try {
      const geo = await detectResilientLocation();
      setLatitude(geo.latitude);
      setLongitude(geo.longitude);
      const parts = [geo.street, geo.city, geo.mandal, geo.district, geo.state, geo.pinCode ? `PIN ${geo.pinCode}` : ''].filter(Boolean);
      setLocationText(parts.join(', ') || 'Detected nearby area');
      setDetectedLocation({
        state: geo.state || state,
        district: geo.district || district,
        mandal: geo.mandal || mandalOrMunicipality,
        village: geo.street || geo.city || city,
        pinCode: geo.pinCode || '',
      });
      showToast('Location detected for this sighting.', 'success');
    } catch (err: any) {
      const message = err?.message || 'Could not detect location. Try again near the pet.';
      const isDenied = /permission|denied|NotAllowedError/i.test(message) || err?.code === 'PERMISSION_DENIED';
      const isDisabled = /disabled|unavailable|provider|location/i.test(message);
      if (isDenied) {
        alert('Location access is denied. Please enable location permissions in your browser settings to allow auto-detection.');
      }
      showToast(
        isDenied
          ? 'Location permission was not granted. Please allow it in settings.'
          : isDisabled
          ? 'Please turn on Location in Android settings to detect your location.'
          : message,
        'warning'
      );
    } finally {
      setDetecting(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedReport) return;
    if (capturedPhotos.length === 0) {
      showToast('Please capture at least 1 pet photo first.', 'warning');
      return;
    }

    const finalLocationText =
      locationText.trim() || [city, mandalOrMunicipality, district, state].filter(Boolean).join(', ');

    setSubmitting(true);
    const now = new Date();
    const sightingId = `sight-${Date.now()}`;
    const uploadedPhotos: string[] = [];
    for (let index = 0; index < capturedPhotos.length; index += 1) {
      const capturedPhoto = capturedPhotos[index];
      try {
        const uploadedUrl = await storageBucketService.uploadSightingPhoto(selectedReport.id, capturedPhoto);
        if (uploadedUrl) {
          uploadedPhotos.push(uploadedUrl);
        } else {
          storageBucketService.enqueueItem({
            category: 'sighting',
            referenceId: selectedReport.id,
            ownerId: user.id,
            index,
            base64Data: capturedPhoto,
          });
        }
      } catch {
        storageBucketService.enqueueItem({
          category: 'sighting',
          referenceId: selectedReport.id,
          ownerId: user.id,
          index,
          base64Data: capturedPhoto,
        });
      }
    }

    const sighting: Sighting = {
      id: sightingId,
      reportId: selectedReport.id,
      dogName: getDogDisplayName(selectedReport.dog, selectedReport),
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: finalLocationText,
      state: detectedLocation.state || state,
      district: detectedLocation.district || district,
      mandal: detectedLocation.mandal || mandalOrMunicipality,
      village: detectedLocation.village || city,
      pinCode: detectedLocation.pinCode,
      latitude,
      longitude,
      photo: uploadedPhotos[0],
      photos: uploadedPhotos,
      description: 'Photo sighting submitted from Capture Pet. Reporter contact remains private.',
      reporterUserId: user.id,
      isGuest: false,
      createdAt: now.toISOString(),
    };

    storageService.addSighting(sighting);
    window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
    window.dispatchEvent(new Event('storage'));
    setCapturedPhotos([]);
    setLocationText('');
    setDetectedLocation({ state: '', district: '', mandal: '', village: '', pinCode: '' });
    setSubmitting(false);
    stopCamera();
    showToast(
      uploadedPhotos.length === capturedPhotos.length
        ? 'Sighting captured privately and shared with the pet alert.'
        : 'Sighting saved. Pending photos are queued for secure upload.',
      uploadedPhotos.length === capturedPhotos.length ? 'success' : 'info',
    );
    setShowSuccessTick(true);
    setTimeout(() => {
      setShowSuccessTick(false);
      navigate('/homepage');
    }, 1000);
  };

  const handleExitToDashboard = () => {
    stopCamera();
    navigate('/homepage');
  };

  if (!user) {
    return (
      <div className="capture-pet-page">
        <section className="capture-pet-card">
          <button
            type="button"
            className="onboarding-exit-btn"
            onClick={handleExitToDashboard}
            aria-label="Exit capture pet and go to dashboard"
            title="Exit to dashboard"
          >
            <X size={19} />
          </button>
          <h1>Capture Pet</h1>
          <p>Please sign in to submit a private sighting.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="capture-pet-page">
      <section className="capture-pet-card">
        <button
          type="button"
          className="onboarding-exit-btn"
          onClick={handleExitToDashboard}
          aria-label="Exit capture pet and go to dashboard"
          title="Exit to dashboard"
        >
          <X size={19} />
        </button>
        <div className="section-card-title-block">
          <h1>Capture Pet</h1>
        </div>
        <div className="capture-consent-box">
          <ShieldCheck size={18} />
          <span>Capture only the missing pet. Avoid people, faces, homes, vehicle plates, or private details.</span>
        </div>

        {/* 2×2 LOCATION GRID: 4 CONTAINERS PRE-POPULATED (EXACT MATCH WITH LOCATION ONBOARDING) */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={16} color="#FF7900" />
              Sighting Location Area:
            </span>
          </div>

          <div className="loc-grid-2x2">
            {/* 1. STATE SQUARE */}
            <button
              type="button"
              className={`loc-grid-square loc-gsq-state ${stateAlertCount > 0 ? 'has-dog-alert' : ''}`}
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
                {state && stateAlertCount > 0 ? (
                  <span className="loc-gsq-alert-pill">
                    <span className="loc-gsq-alert-dot" />
                    <span>{stateAlertCount} {stateAlertCount === 1 ? 'dog' : 'dogs'} present</span>
                  </span>
                ) : state ? (
                  <span className="loc-gsq-zero-pill">0 dogs present</span>
                ) : null}
              </div>
            </button>

            {/* 2. DISTRICT SQUARE */}
            <button
              type="button"
              className={`loc-grid-square loc-gsq-district ${districtAlertCount > 0 ? 'has-dog-alert' : ''}`}
              onClick={() => {
                if (!state) {
                  setActiveLocationModal('state');
                } else {
                  setActiveLocationModal('district');
                }
              }}
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
                {district && districtAlertCount > 0 ? (
                  <span className="loc-gsq-alert-pill">
                    <span className="loc-gsq-alert-dot" />
                    <span>{districtAlertCount} {districtAlertCount === 1 ? 'dog' : 'dogs'} present</span>
                  </span>
                ) : district ? (
                  <span className="loc-gsq-zero-pill">0 dogs present</span>
                ) : null}
              </div>
            </button>

            {/* 3. MANDAL SQUARE */}
            <button
              type="button"
              className={`loc-grid-square loc-gsq-mandal ${mandalAlertCount > 0 ? 'has-dog-alert' : ''}`}
              onClick={() => {
                if (!state) {
                  setActiveLocationModal('state');
                } else if (!district) {
                  setActiveLocationModal('district');
                } else {
                  setActiveLocationModal('mandal');
                }
              }}
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
                {mandalOrMunicipality && mandalAlertCount > 0 ? (
                  <span className="loc-gsq-alert-pill">
                    <span className="loc-gsq-alert-dot" />
                    <span>{mandalAlertCount} {mandalAlertCount === 1 ? 'dog' : 'dogs'} present</span>
                  </span>
                ) : mandalOrMunicipality ? (
                  <span className="loc-gsq-zero-pill">0 dogs present</span>
                ) : null}
              </div>
            </button>

            {/* 4. HOME BASE SQUARE */}
            <button
              type="button"
              className={`loc-grid-square loc-gsq-home ${cityAlertCount > 0 ? 'has-dog-alert' : ''}`}
              onClick={() => {
                if (!state) {
                  setActiveLocationModal('state');
                } else if (!district) {
                  setActiveLocationModal('district');
                } else if (!mandalOrMunicipality) {
                  setActiveLocationModal('mandal');
                } else {
                  setActiveLocationModal('city');
                }
              }}
              title="Click to change Home Base (City / Village)"
            >
              <div className="loc-gsq-top">
                <div className="loc-gsq-icon">
                  <Home size={20} />
                </div>
                <span className="loc-gsq-label">Home Base</span>
              </div>
              <div className="loc-gsq-value-wrap">
                <strong className="loc-gsq-value">{city || <span className="loc-gsq-placeholder">Select Home Base</span>}</strong>
                {city && cityAlertCount > 0 ? (
                  <span className="loc-gsq-alert-pill">
                    <span className="loc-gsq-alert-dot" />
                    <span>{cityAlertCount} {cityAlertCount === 1 ? 'dog' : 'dogs'} present</span>
                  </span>
                ) : city ? (
                  <span className="loc-gsq-zero-pill">0 dogs present</span>
                ) : null}
              </div>
            </button>
          </div>

          {/* Centered Orange Reset Button */}
          <div className="capture-reset-container">
            <button
              type="button"
              className="capture-orange-reset-btn"
              onClick={handleResetAreaFilters}
              title="Reset location filters to manually select dropdowns"
            >
              <RotateCcw size={16} />
              <span>Reset Location Filters (Select Manually)</span>
            </button>
          </div>
        </div>

        {/* Missing Pets Header */}
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', color: '#fff', margin: 0, fontWeight: '600' }}>
            Select Missing Pet ({displayedReports.length})
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
            {filterContextText}
          </span>
        </div>

        {displayedReports.length === 0 ? (
          <div className="capture-empty-state" style={{ marginBottom: '20px', padding: '1.25rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.12)', textAlign: 'center' }}>
            <p style={{ margin: 0, fontWeight: 600, color: '#f3f4f6', fontSize: '0.92rem' }}>
              No active missing pets reported in {city || mandalOrMunicipality || district || state || 'selected area'}.
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
              You can still photograph any pet in need below to submit a sighting!
            </p>
          </div>
        ) : (
          <div className="capture-report-grid" style={{ marginBottom: '18px' }}>
            {displayedReports.map((report) => {
              const name = getDogDisplayName(report.dog, report);
              const isSelected = selectedReport?.id === report.id;
              const breed = report.dog?.breed || 'Companion Dog';
              return (
                <div
                  key={report.id}
                  className={`capture-report-tile-wrap ${isSelected ? 'active' : ''}`}
                >
                  <button
                    type="button"
                    className={`capture-report-tile ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedReportId(report.id)}
                    title={`Select ${name} for sighting capture`}
                  >
                    <div className="capture-report-tile-photo-wrap">
                      <img src={getDogPhotoUrl(report.dog, report)} alt={name} onError={handleDogImageError} />
                      <span className="capture-report-tile-lost-pill">LOST</span>
                    </div>
                    <div className="capture-report-tile-info">
                      <div className="capture-report-tile-name-row">
                        <span className="capture-report-tile-name">{name}</span>
                        {isSelected && (
                          <span className="capture-report-tile-target-tag">
                            <Check size={12} /> Target Pet
                          </span>
                        )}
                      </div>
                      <span className="capture-report-tile-breed">{breed}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="capture-report-tile-popup-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailReport(report);
                    }}
                    aria-label={`View details popup for ${name}`}
                    title={`View details popup for ${name}`}
                  >
                    <Info size={14} />
                    <span>Pet Details</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Live Camera View (Always Available, Never Blocked) */}
        <div className="capture-camera-frame">
          {cameraConsentAccepted && (
            <video
              ref={videoRef}
              className="capture-camera-video"
              autoPlay
              muted
              playsInline
              aria-label="Live camera preview for pet sighting"
            />
          )}
          {!cameraConsentAccepted ? (
            <div className="capture-permission-panel">
              <ShieldCheck size={34} />
              <strong>Camera permission required</strong>
              <span>We use your camera only to capture the missing pet photo for this private sighting. Do not capture people, faces, homes, vehicle plates, or private details.</span>
              <button type="button" className="capture-main-button" onClick={() => setShowCameraRationale(true)}>
                <Video size={18} />
                <span>Turn On Camera</span>
              </button>
            </div>
          ) : !cameraReady && (
            <div className="capture-camera-placeholder">
              <Video size={34} />
              <span>{cameraError || 'Waiting for camera permission...'}</span>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} hidden />

        {/* 3-Photo Slots Status Bar */}
        <div className="capture-photos-status-bar">
          <div className="capture-slots-list">
            {[0, 1, 2].map((slotIdx) => {
              const hasPhoto = !!capturedPhotos[slotIdx];
              const isCurrent = capturedPhotos.length === slotIdx;
              return (
                <div
                  key={slotIdx}
                  className={`capture-slot-box ${hasPhoto ? 'is-filled' : ''} ${isCurrent ? 'is-active' : ''}`}
                  title={hasPhoto ? `Photo ${slotIdx + 1} captured (Click to view)` : `Photo ${slotIdx + 1} ${slotIdx === 0 ? '(Required)' : '(Optional)'}`}
                  onClick={() => {
                    if (hasPhoto) {
                      setActiveReviewPhotoIndex(slotIdx);
                      setShowReviewPopup(true);
                      stopCamera();
                    }
                  }}
                >
                  {hasPhoto ? (
                    <>
                      <img src={capturedPhotos[slotIdx]} alt={`Photo ${slotIdx + 1}`} className="capture-slot-img" />
                      <button
                        type="button"
                        className="capture-slot-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(slotIdx);
                        }}
                        title={`Delete Photo ${slotIdx + 1}`}
                        aria-label={`Delete Photo ${slotIdx + 1}`}
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <span className="capture-slot-num">#{slotIdx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>

          {capturedPhotos.length >= 1 && (
            <button
              type="button"
              className="capture-skip-proceed-btn"
              onClick={handleProceedToReview}
              title="Proceed with current photos without taking more"
            >
              <Check size={16} />
              <span>Done / Skip Remaining ({capturedPhotos.length}/3)</span>
            </button>
          )}
        </div>

        <div className="capture-button-row">
          <button
            type="button"
            className="capture-main-button"
            onClick={handleCaptureFrame}
            disabled={capturedPhotos.length >= 3}
          >
            <Camera size={18} />
            <span>
              {capturedPhotos.length === 0
                ? 'Capture Photo 1 of 3'
                : capturedPhotos.length === 1
                ? 'Capture Photo 2 of 3'
                : capturedPhotos.length === 2
                ? 'Capture Photo 3 of 3'
                : 'All 3 Photos Captured'}
            </span>
          </button>
          {cameraReady && (
            <button type="button" className="capture-rotate-button" onClick={handleRotateCamera}>
              <RefreshCw size={18} />
              <span>{cameraFacingMode === 'environment' ? 'Use Front Camera' : 'Use Back Camera'}</span>
            </button>
          )}
          {cameraConsentAccepted && !cameraReady && (
            <button type="button" className="capture-location-button" onClick={startCamera}>
              <Video size={18} />
              <span>Open Camera</span>
            </button>
          )}
        </div>
      </section>

      {/* Sighting Photo Review & Sighting Location Detection */}
      {showReviewPopup && capturedPhotos.length > 0 && (
        <div className="capture-review-backdrop" role="dialog" aria-modal="true" aria-labelledby="capture-review-title">
          <section className="capture-review-modal">
            <button type="button" className="capture-review-close" onClick={handleCloseReview} aria-label="Close captured photo review">
              <X size={20} />
              <span>Close</span>
            </button>
            <div className="capture-review-title-block">
              <h2 id="capture-review-title">
                Captured Pet {capturedPhotos.length > 1 ? `Photos (${capturedPhotos.length} / 3)` : 'Photo'}
              </h2>
              <span>Detect the sighting location, then submit privately.</span>
            </div>

            <div className="capture-review-image-panel">
              <img
                src={capturedPhotos[activeReviewPhotoIndex] || capturedPhotos[0]}
                alt={`Captured pet sighting ${activeReviewPhotoIndex + 1}`}
              />
            </div>

            {capturedPhotos.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '4px 0', alignItems: 'center' }}>
                {capturedPhotos.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveReviewPhotoIndex(idx)}
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      padding: 0,
                      border: activeReviewPhotoIndex === idx ? '2.5px solid #FF7900' : '1.5px solid rgba(255,255,255,0.2)',
                      background: '#000',
                      cursor: 'pointer',
                      opacity: activeReviewPhotoIndex === idx ? 1 : 0.6,
                      position: 'relative',
                    }}
                    title={`View Photo ${idx + 1}`}
                  >
                    <img src={p} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}

            {!locationConsentAccepted ? (
              <div className="capture-location-consent-panel">
                <MapPin size={22} />
                <div>
                  <strong>Location permission required</strong>
                  <span>Turn on Location Services and allow precise location so the pet owner receives the correct sighting area. You can turn location off again after submitting.</span>
                </div>
                <button type="button" className="capture-location-button" onClick={() => setShowLocationRationale(true)}>
                  <Navigation size={18} />
                  <span>Continue</span>
                </button>
              </div>
            ) : (
              <div className="capture-location-action-stack">
                <button type="button" className="capture-location-button" onClick={() => handleDetectLocation()} disabled={detecting}>
                  {detecting ? <Navigation size={18} className="spin" /> : <MapPin size={18} />}
                  <span>{detecting ? 'Detecting Location...' : 'Detect Location'}</span>
                </button>
                {detecting && (
                  <p className="capture-location-wait-text" aria-live="polite">
                    Please wait while we capture the pet sighting location.
                  </p>
                )}
              </div>
            )}

            {locationText ? (
              <div className="capture-location-preview">{locationText}</div>
            ) : (
              <div className="capture-location-preview muted">
                Using area: {[city, mandalOrMunicipality, district, state].filter(Boolean).join(', ')}
              </div>
            )}

            <div className="capture-review-actions">
              <button type="button" className="capture-rotate-button" onClick={handleRetake}>
                <RotateCcw size={18} />
                <span>Retake Photo</span>
              </button>
              <button type="button" className="capture-submit-button" onClick={handleSubmit} disabled={submitting}>
                <Check size={18} />
                <span>{submitting ? 'Submitting...' : 'Submit Private Sighting'}</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Cascading Modals for Location Containers */}
      <PetProfileSelector
        isOpen={activeLocationModal === 'state'}
        onClose={() => setActiveLocationModal(null)}
        title="Select State"
        options={stateOptions}
        selectedValue={state}
        onSelect={(newState) => {
          setState(newState);
          setDistrict('');
          setMandalOrMunicipality('');
          setCity('');
          setSelectedReportId('');
          setActiveLocationModal(null);
        }}
        searchable
        searchPlaceholder="Search state..."
      />

      <PetProfileSelector
        isOpen={activeLocationModal === 'district'}
        onClose={() => setActiveLocationModal(null)}
        title="Select District"
        options={districtOptions}
        selectedValue={district}
        onSelect={(newDistrict) => {
          setDistrict(newDistrict);
          setMandalOrMunicipality('');
          setCity('');
          setSelectedReportId('');
          setActiveLocationModal(null);
        }}
        searchable
        searchPlaceholder="Search district..."
      />

      <PetProfileSelector
        isOpen={activeLocationModal === 'mandal'}
        onClose={() => setActiveLocationModal(null)}
        title="Select Mandal"
        options={mandalOptions}
        selectedValue={mandalOrMunicipality}
        onSelect={(newMandal) => {
          setMandalOrMunicipality(newMandal);
          setCity('');
          setSelectedReportId('');
          setActiveLocationModal(null);
        }}
        searchable
        searchPlaceholder="Search mandal..."
      />

      <PetProfileSelector
        isOpen={activeLocationModal === 'city'}
        onClose={() => setActiveLocationModal(null)}
        title="Select Home Base (Village)"
        options={villageOptions}
        selectedValue={city}
        onSelect={(newCity) => {
          setCity(newCity);
          setSelectedReportId('');
          setActiveLocationModal(null);
        }}
        searchable
        searchPlaceholder="Search village / home base..."
      />

      {/* Missing Pet Detail Modal Popup */}
      {detailReport && (() => {
        const displayName = getDogDisplayName(detailReport.dog, detailReport);
        const photoUrl = getDogPhotoUrl(detailReport.dog, detailReport);
        const location =
          detailReport.lastKnownLocation ||
          detailReport.ownerApproximateLocation ||
          'Location not specified';
        const traits = [
          detailReport.dog?.color,
          detailReport.dog?.size,
          detailReport.dog?.gender,
        ].filter(Boolean).join(' • ');

        return (
          <div
            className="capture-pet-detail-backdrop"
            onClick={() => setDetailReport(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="capture-pet-detail-title"
          >
            <div
              className="capture-pet-detail-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="capture-pet-detail-header">
                <div className="capture-pet-detail-header-text">
                  <span className="capture-pet-detail-badge">🚨 MISSING PET PROFILE</span>
                  <h2 id="capture-pet-detail-title">{displayName}</h2>
                </div>
                <button
                  type="button"
                  className="capture-pet-detail-close-btn"
                  onClick={() => setDetailReport(null)}
                  aria-label="Close missing pet details"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="capture-pet-detail-body">
                <div className="capture-pet-detail-photo-stage">
                  <img
                    src={photoUrl}
                    alt={displayName}
                    className="capture-pet-detail-photo"
                    onError={handleDogImageError}
                  />
                  <span className="capture-pet-detail-status-pill">LOST</span>
                </div>

                <div className="capture-pet-detail-info-list">
                  <div className="capture-pet-detail-field">
                    <span className="capture-pet-detail-field-label">Breed</span>
                    <strong className="capture-pet-detail-field-value">{detailReport.dog?.breed || 'Companion Pet'}</strong>
                  </div>

                  {traits && (
                    <div className="capture-pet-detail-field">
                      <span className="capture-pet-detail-field-label">Physical Traits</span>
                      <span className="capture-pet-detail-field-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={14} color="#FF7900" />
                        {traits}
                      </span>
                    </div>
                  )}

                  <div className="capture-pet-detail-field">
                    <span className="capture-pet-detail-field-label">Last Known Location</span>
                    <span className="capture-pet-detail-field-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="#FF7900" />
                      {location}
                    </span>
                  </div>

                  {detailReport.dateLost && (
                    <div className="capture-pet-detail-field">
                      <span className="capture-pet-detail-field-label">Date When Lost</span>
                      <span className="capture-pet-detail-field-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="#FF7900" />
                        {detailReport.dateLost} {detailReport.timeLost ? `• ${detailReport.timeLost}` : ''}
                      </span>
                    </div>
                  )}

                  {detailReport.dog?.distinguishingMarks && (
                    <div className="capture-pet-detail-field">
                      <span className="capture-pet-detail-field-label">Distinguishing Marks</span>
                      <p className="capture-pet-detail-notes">{detailReport.dog.distinguishingMarks}</p>
                    </div>
                  )}

                  {detailReport.additionalNotes && (
                    <div className="capture-pet-detail-field">
                      <span className="capture-pet-detail-field-label">Additional Notes</span>
                      <p className="capture-pet-detail-notes">{detailReport.additionalNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="capture-pet-detail-actions">
                <button
                  type="button"
                  className={`capture-pet-detail-select-btn ${selectedReportId === detailReport.id ? 'is-selected' : ''}`}
                  onClick={() => {
                    setSelectedReportId(detailReport.id);
                    setDetailReport(null);
                    showToast(`Selected ${displayName} for sighting capture.`, 'info');
                  }}
                >
                  <Check size={18} />
                  <span>
                    {selectedReportId === detailReport.id
                      ? `✓ ${displayName} Is Selected Target Pet (Close)`
                      : `Select ${displayName} For Sighting`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <PermissionRationaleModal
        isOpen={showCameraRationale}
        title="Camera Permission"
        message="Camera access is needed only when you choose to capture a pet or profile photo. FindLostPuppy does not use the camera in the background."
        onCancel={() => setShowCameraRationale(false)}
        onContinue={handleEnableCamera}
      />

      <PermissionRationaleModal
        isOpen={showLocationRationale}
        title="Location Permission"
        message="Location access is needed only when you choose Detect Location. It helps identify your State, District, Mandal and Home Base. Your exact coordinates are not publicly displayed."
        onCancel={() => setShowLocationRationale(false)}
        onContinue={() => {
          setShowLocationRationale(false);
          setLocationConsentAccepted(true);
          handleDetectLocation(true);
        }}
      />

      <PermissionRationaleModal
        isOpen={showCameraPermissionDialog}
        title="Camera Permission Required"
        message="Camera access is needed to capture photos of the missing pet. Please allow camera access in your device or browser settings and tap Try Again."
        continueLabel="Try Again"
        cancelLabel="Stay on Page"
        onCancel={() => setShowCameraPermissionDialog(false)}
        onContinue={() => {
          setShowCameraPermissionDialog(false);
          startCamera();
        }}
        alternativeLabel="Upload from Gallery"
        onAlternative={() => galleryInputRef.current?.click()}
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleGalleryPhoto}
        hidden
      />

      {/* 1 SEC SUCCESS TICK ANIMATION */}
      {showSuccessTick && (
        <div
          className="success-tick-overlay"
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: '#18181B',
              border: '2px solid #10B981',
              borderRadius: '20px',
              padding: '2.5rem 3rem',
              textAlign: 'center',
              boxShadow: '0 20px 45px rgba(16, 185, 129, 0.35)',
            }}
          >
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.16)',
                border: '3px solid #10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: '#10B981',
              }}
            >
              <Check size={46} strokeWidth={3.5} />
            </div>
            <h2 style={{ color: '#F9FAFB', fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
              Sighting Submitted!
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '0.95rem', margin: 0 }}>
              ✓ Photo shared securely with pet alert
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
