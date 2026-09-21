import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, MapPin, Navigation, RefreshCw, RotateCcw, ShieldCheck, Video, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import type { LostReport, Sighting } from '../types';
import { detectResilientLocation } from '../utils/geolocationHelper';
import { getDogDisplayName, getDogPhotoUrl, handleDogImageError } from '../utils/dogPhotoHelper';
import { PermissionRationaleModal } from '../components/PermissionRationaleModal';

export const CapturePetPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [reports, setReports] = useState<LostReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [photo, setPhoto] = useState('');
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [showCameraRationale, setShowCameraRationale] = useState(false);
  const [showLocationRationale, setShowLocationRationale] = useState(false);
  const [cameraConsentAccepted, setCameraConsentAccepted] = useState(false);
  const [locationConsentAccepted, setLocationConsentAccepted] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
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
      setCameraError(err?.name === 'NotAllowedError'
        ? 'Camera permission is blocked. Please allow camera access in Chrome for this site.'
        : 'Could not open the camera. Please try again.');
      showToast('Camera permission is needed to capture the missing pet.', 'warning');
    }
  }, [cameraFacingMode, showToast, stopCamera]);

  useEffect(() => {
    const loadReports = () => {
      setReports(storageService.getAllReports().filter((report) => report.status === 'LOST'));
    };
    loadReports();
    window.addEventListener('findlostpuppy_reports_updated', loadReports);
    window.addEventListener('storage', loadReports);
    return () => {
      window.removeEventListener('findlostpuppy_reports_updated', loadReports);
      window.removeEventListener('storage', loadReports);
    };
  }, []);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) || reports[0],
    [reports, selectedReportId]
  );

  useEffect(() => {
    if (!selectedReportId && reports[0]) {
      setSelectedReportId(reports[0].id);
    }
  }, [reports, selectedReportId]);

  useEffect(() => {
    return () => {
      stopCamera();
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

    const width = video.videoWidth || 900;
    const height = video.videoHeight || 900;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, width, height);
    setPhoto(canvas.toDataURL('image/jpeg', 0.86));
    setShowReviewPopup(true);
    stopCamera();
    showToast('Pet photo captured. Detect the location and submit privately.', 'success');
  };

  const handleRetake = () => {
    setPhoto('');
    setLocationText('');
    setDetectedLocation({ state: '', district: '', mandal: '', village: '', pinCode: '' });
    setLatitude(undefined);
    setLongitude(undefined);
    setShowReviewPopup(false);
    startCamera();
  };

  const handleCloseReview = () => {
    setShowReviewPopup(false);
    setPhoto('');
    setLocationText('');
    setDetectedLocation({ state: '', district: '', mandal: '', village: '', pinCode: '' });
    setLatitude(undefined);
    setLongitude(undefined);
    setLocationConsentAccepted(false);
    if (cameraConsentAccepted) {
      startCamera();
    }
  };

  const handleRotateCamera = () => {
    setPhoto('');
    setCameraFacingMode((current) => (current === 'environment' ? 'user' : 'environment'));
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
      const parts = [geo.city, geo.mandal, geo.district, geo.state, geo.pinCode ? `PIN ${geo.pinCode}` : ''].filter(Boolean);
      setLocationText(parts.join(', ') || 'Detected nearby area');
      setDetectedLocation({
        state: geo.state || '',
        district: geo.district || '',
        mandal: geo.mandal || '',
        village: geo.city || '',
        pinCode: geo.pinCode || '',
      });
      showToast('Location detected for this sighting.', 'success');
    } catch (err: any) {
      const message = err?.message || 'Could not detect location. Try again near the pet.';
      const isDenied = /permission|denied/i.test(message);
      const isDisabled = /disabled|unavailable|provider|location/i.test(message);
      showToast(
        isDenied
          ? 'Location permission was not granted. You can allow it later from Android Settings.'
          : isDisabled
            ? 'Please turn on Location in Android settings to detect your location.'
            : message,
        'warning'
      );
    } finally {
      setDetecting(false);
    }
  };

  const handleSubmit = () => {
    if (!user || !selectedReport) return;
    if (!photo) {
      showToast('Please capture the pet photo first.', 'warning');
      return;
    }
    if (!locationText.trim()) {
      showToast('Please detect location before submitting.', 'warning');
      return;
    }

    setSubmitting(true);
    const now = new Date();
    const sighting: Sighting = {
      id: `sight-${Date.now()}`,
      reportId: selectedReport.id,
      dogName: getDogDisplayName(selectedReport.dog, selectedReport),
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: locationText.trim(),
      state: detectedLocation.state,
      district: detectedLocation.district,
      mandal: detectedLocation.mandal,
      village: detectedLocation.village,
      pinCode: detectedLocation.pinCode,
      latitude,
      longitude,
      photo,
      photos: [photo],
      description: 'Photo sighting submitted from Capture Pet. Reporter contact remains private.',
      reporterUserId: user.id,
      isGuest: false,
      createdAt: now.toISOString(),
    };

    storageService.addSighting(sighting);
    window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
    window.dispatchEvent(new Event('storage'));
    setPhoto('');
    setLocationText('');
    setDetectedLocation({ state: '', district: '', mandal: '', village: '', pinCode: '' });
    setSubmitting(false);
    stopCamera();
    showToast('Sighting captured privately and shared with the pet alert.', 'success');
    navigate('/dashboard');
  };

  const handleExitToDashboard = () => {
    stopCamera();
    navigate('/dashboard');
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

        {reports.length === 0 ? (
          <div className="capture-empty-state">No missing pets are available for sighting capture right now.</div>
        ) : (
          <>
            <div className="capture-report-grid">
              {reports.map((report) => {
                const name = getDogDisplayName(report.dog, report);
                const isSelected = selectedReport?.id === report.id;
                return (
                  <button
                    key={report.id}
                    type="button"
                    className={`capture-report-tile ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedReportId(report.id)}
                  >
                    <img src={getDogPhotoUrl(report.dog, report)} alt={name} onError={handleDogImageError} />
                    <span>{name}</span>
                  </button>
                );
              })}
            </div>

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

            <div className="capture-button-row">
              <button type="button" className="capture-main-button" onClick={handleCaptureFrame}>
                <Camera size={18} />
                <span>Capture Pet Photo</span>
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
          </>
        )}
      </section>

      {showReviewPopup && photo && (
        <div className="capture-review-backdrop" role="dialog" aria-modal="true" aria-labelledby="capture-review-title">
          <section className="capture-review-modal">
            <button type="button" className="capture-review-close" onClick={handleCloseReview} aria-label="Close captured photo review">
              <X size={20} />
              <span>Close</span>
            </button>
            <div className="capture-review-title-block">
              <h2 id="capture-review-title">Captured Pet Photo</h2>
              <span>Detect the sighting location, then submit privately.</span>
            </div>

            <div className="capture-review-image-panel">
              <img src={photo} alt="Captured pet sighting" />
            </div>

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
              <div className="capture-location-preview muted">Location is required before submitting.</div>
            )}

            <div className="capture-review-actions">
              <button type="button" className="capture-rotate-button" onClick={handleRetake}>
                <RotateCcw size={18} />
                <span>Retake Photo</span>
              </button>
              <button type="button" className="capture-submit-button" onClick={handleSubmit} disabled={submitting || !locationText}>
                <Check size={18} />
                <span>{submitting ? 'Submitting...' : 'Submit Private Sighting'}</span>
              </button>
            </div>
          </section>
        </div>
      )}

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
    </div>
  );
};
