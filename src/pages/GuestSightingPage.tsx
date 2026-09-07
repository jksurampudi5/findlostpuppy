import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Camera,
  Calendar,
  Clock,
  Phone,
  User as UserIcon,
  Check,
  AlertTriangle,
  Share2,
  Navigation,
  Heart,
  Sparkles,
  Trash2,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { useToast } from '../context/ToastContext';
import { triggerStarCelebration } from '../utils/confettiHelper';
import type { LostReport, Sighting } from '../types';

export const GuestSightingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [report, setReport] = useState<LostReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const [locationText, setLocationText] = useState('');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(currentTime);
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  // UI State
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const found = storageService.getReportById(id);
    if (found) {
      setReport(found);
    }
    setLoading(false);
  }, [id]);

  // 1-Click GPS Location Detector for Good Samaritan
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const street = addr.road || addr.suburb || addr.neighbourhood || '';
            const locality = addr.city || addr.town || addr.village || addr.county || '';
            const finalStr = [street, locality].filter(Boolean).join(', ') || `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setLocationText(finalStr);
            showToast('📍 Exact location locked via GPS!', 'success');
          } else {
            setLocationText(`GPS Locked: Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`);
          }
        } catch {
          setLocationText(`GPS Locked: Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`);
          showToast('GPS fix acquired!', 'info');
        } finally {
          setGpsDetecting(false);
        }
      },
      (err) => {
        setGpsDetecting(false);
        if (err.code === err.PERMISSION_DENIED) {
          showToast('Location permission was denied. Please type the location manually.', 'info');
        } else {
          showToast('Could not acquire GPS location. Please enter details manually.', 'info');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Photo Upload Handler (Supports multiple photos)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f.type.startsWith('image/')) continue;
      if (f.size > 5 * 1024 * 1024) continue;
      validFiles.push(f);
    }

    if (validFiles.length === 0) {
      showToast('Please upload valid images under 5MB.', 'warning');
      return;
    }

    const readers = validFiles.map(
      (file) =>
        new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((newPhotos) => {
      setPhotos((prev) => [...prev, ...newPhotos]);
      showToast(`📸 ${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''} added!`, 'success');
    });
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Submit Sighting in GUEST MODE (No login required!)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationText.trim()) {
      showToast('Please enter the location where you saw the dog.', 'warning');
      return;
    }

    if (!report) {
      showToast('Report reference missing.', 'error');
      return;
    }

    setSubmitting(true);

    const sightingId = `sight-${Date.now()}`;
    const sighting: Sighting = {
      id: sightingId,
      reportId: report.id,
      dogName: report.dog.name,
      date,
      time,
      location: locationText.trim(),
      latitude,
      longitude,
      photo: photos[0] || undefined,
      photos,
      description: description.trim() || 'Spotted by community member.',
      reporterName: reporterName.trim() || 'Good Samaritan (Guest)',
      reporterPhone: reporterPhone.trim() || undefined,
      isGuest: true,
      createdAt: new Date().toISOString(),
    };

    storageService.addSighting(sighting);
    triggerStarCelebration();
    setIsSubmitted(true);
    setSubmitting(false);
    showToast('🎉 Thank you! Your sighting report has been recorded!', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="guest-sighting-loading app-container text-center py-12">
        <p>Loading missing dog alert...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="onboarding-page">
        <div className="app-container onboarding-container">
          <div className="card text-center py-12 px-6">
            <Heart size={48} className="text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Report Not Found or Already Reunited! ❤️</h2>
            <p className="text-secondary max-w-md mx-auto mb-6">
              This alert may have been resolved, or the puppy has already safely returned home with family.
            </p>
            <Link to="/" className="btn btn-primary">
              <span>Return to Community Network 🐾</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ownerPhone =
    report.contactMechanism.safeContactPhone || report.contactMechanism.safeContactEmail || '';

  return (
    <div className="guest-sighting-page">
      <div className="app-container guest-sighting-container">
        {/* Navigation Return */}
        <div className="guest-top-nav-row mb-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-ghost btn-sm"
          >
            <ArrowLeft size={16} />
            <span>Back to FindLostPuppy</span>
          </button>
        </div>

        {/* HERO BANNER: The Missing Puppy Info */}
        <div className="guest-hero-alert-card card">
          <div className="guest-hero-badge-row">
            <span className="guest-urgent-tag">
              <AlertTriangle size={14} />
              <span>ACTIVE MISSING PUPPY ALERT</span>
            </span>
            <span className="guest-id-tag">ID: {report.id}</span>
          </div>

          <div className="guest-hero-flex">
            <div className="guest-hero-photo-wrap">
              {report.dog.primaryPhoto ? (
                <img
                  src={report.dog.primaryPhoto}
                  alt={report.dog.name}
                  className="guest-hero-photo"
                />
              ) : (
                <div className="guest-hero-photo-placeholder">🐶</div>
              )}
            </div>

            <div className="guest-hero-info">
              <h1 className="guest-dog-name">{report.dog.name}</h1>
              <p className="guest-dog-breed">
                {report.dog.breed} • {report.dog.gender}
              </p>

              <div className="guest-dog-meta-list">
                <div className="guest-meta-item">
                  <MapPin size={15} className="text-terracotta flex-shrink-0" />
                  <span>
                    <strong>Missing From:</strong> {report.ownerApproximateLocation || report.lastKnownLocation}
                  </span>
                </div>

                <div className="guest-meta-item">
                  <Calendar size={15} className="text-terracotta flex-shrink-0" />
                  <span>
                    <strong>Lost on:</strong> {report.dateLost} at {report.timeLost}
                  </span>
                </div>

                {report.additionalNotes && (
                  <div className="guest-meta-item">
                    <Sparkles size={15} className="text-amber flex-shrink-0" />
                    <span>
                      <strong>Distinguishing Notes:</strong> {report.additionalNotes}
                    </span>
                  </div>
                )}
              </div>

              {ownerPhone && (
                <div className="guest-owner-call-bar">
                  <a href={`tel:${ownerPhone}`} className="btn btn-secondary btn-sm call-owner-link">
                    <Phone size={14} />
                    <span>Call Owner: {ownerPhone}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SUCCESS CONFIRMATION STATE */}
        {isSubmitted ? (
          <div className="sighting-success-card card mt-6">
            <div className="success-star-icon">🎉</div>
            <h2 className="success-hero-title">Thank You, Community Hero! 💖</h2>
            <p className="success-hero-sub">
              Your sighting for <strong>"{report.dog.name}"</strong> has been recorded and the owner will be notified immediately!
            </p>

            <div className="success-details-summary">
              <div className="summary-row">
                <MapPin size={16} className="text-terracotta" />
                <span><strong>Sighted Location:</strong> {locationText}</span>
              </div>
              <div className="summary-row">
                <Clock size={16} className="text-amber" />
                <span><strong>Time:</strong> {date} at {time}</span>
              </div>
              {photos.length > 0 && (
                <div className="summary-photos-strip">
                  {photos.map((p, i) => (
                    <img key={i} src={p} alt="Sighting preview" className="summary-photo-thumb" />
                  ))}
                </div>
              )}
            </div>

            {/* Direct Notify Actions */}
            <div className="success-actions-row">
              {ownerPhone && (
                <button
                  type="button"
                  onClick={() => {
                    const notifyMsg =
                      `Hi! I just reported a sighting of *"${report.dog.name}"* with photos on FindLostPuppy!\n` +
                      `📍 *Location:* ${locationText}\n` +
                      `🕒 *Time:* ${date} at ${time}\n` +
                      (description ? `📝 *Notes:* ${description}\n` : '') +
                      `Please check your community flyer! 🙏`;
                    window.open(`https://api.whatsapp.com/send?phone=${ownerPhone.replace(/\D/g, '')}&text=${encodeURIComponent(notifyMsg)}`, '_blank');
                  }}
                  className="btn btn-whatsapp btn-lg"
                  style={{
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    borderColor: '#25D366',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 700,
                  }}
                >
                  <Share2 size={16} />
                  <span>💬 Notify Owner on WhatsApp</span>
                </button>
              )}

              {ownerPhone && (
                <a href={`tel:${ownerPhone}`} className="btn btn-outline btn-lg">
                  <Phone size={16} />
                  <span>📞 Call Owner Directly</span>
                </a>
              )}

              <Link to="/" className="btn btn-ghost btn-sm">
                <span>Return to Home Network 🐾</span>
              </Link>
            </div>
          </div>
        ) : (
          /* GUEST SIGHTING FORM */
          <div className="guest-form-card card mt-6">
            <div className="guest-form-header">
              <div className="guest-form-icon">🐾</div>
              <div>
                <h2 className="guest-form-title">Spotted or Found {report.dog.name}?</h2>
                <p className="guest-form-sub">
                  ⚡ <strong>Guest Sighting Mode:</strong> No account or login required! Submit details below in seconds so the owner can rush to the location.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="guest-sighting-form">
              {/* FIELD 1: SIGHTING LOCATION */}
              <div className="form-group">
                <div className="label-with-action">
                  <label className="form-label cute-label" htmlFor="sighting-location">
                    <span>📍 Where Did You See {report.dog.name}?</span> <span className="required-tag">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={gpsDetecting}
                    className="btn btn-outline btn-xs gps-detect-btn"
                  >
                    <Navigation size={13} className={gpsDetecting ? 'spin' : ''} />
                    <span>{gpsDetecting ? 'Detecting GPS...' : '📍 Use My Current Location'}</span>
                  </button>
                </div>
                <div className="input-with-icon">
                  <MapPin size={16} className="input-icon text-terracotta" />
                  <input
                    id="sighting-location"
                    type="text"
                    className="form-input cute-input"
                    placeholder="e.g. Near Supermarket, 5th Cross Road, Gachibowli"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    required
                  />
                </div>
                <span className="form-hint">
                  Be as specific as possible (nearby shop, landmark, street name, or apartment).
                </span>
              </div>

              {/* FIELD 2: PHOTOS OF SPOTTED PUP */}
              <div className="form-group">
                <label className="form-label cute-label">
                  <span>📸 Upload Photos of the Spotted Pup</span>
                  <span className="optional-tag" style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: '#9CA3AF' }}>
                    (Highly Recommended)
                  </span>
                </label>

                <div className="guest-photo-upload-area">
                  {photos.length > 0 && (
                    <div className="photo-previews-grid">
                      {photos.map((p, idx) => (
                        <div key={idx} className="photo-preview-item">
                          <img src={p} alt={`Sighting photo ${idx + 1}`} className="preview-img" />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="photo-delete-btn"
                            title="Remove"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-outline btn-sm upload-sighting-photo-btn"
                  >
                    <Camera size={15} />
                    <span>{photos.length > 0 ? 'Add More Photos 📸' : 'Snap or Upload Photo 📸'}</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                  />
                  <span className="form-hint" style={{ marginTop: '0.4rem', display: 'block' }}>
                    Upload one or more photos. Helps the pet parent confirm it's their pup immediately!
                  </span>
                </div>
              </div>

              {/* FIELD 3: DATE & TIME */}
              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label cute-label" htmlFor="sighting-date">
                    <span>📅 Date Sighted</span>
                  </label>
                  <div className="input-with-icon">
                    <Calendar size={16} className="input-icon text-terracotta" />
                    <input
                      id="sighting-date"
                      type="date"
                      className="form-input cute-input"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label cute-label" htmlFor="sighting-time">
                    <span>⏰ Approximate Time</span>
                  </label>
                  <div className="input-with-icon">
                    <Clock size={16} className="input-icon text-amber" />
                    <input
                      id="sighting-time"
                      type="text"
                      className="form-input cute-input"
                      placeholder="e.g. 05:45 PM"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* FIELD 4: CONDITION / NOTES */}
              <div className="form-group">
                <label className="form-label cute-label" htmlFor="sighting-desc">
                  <span>📝 Notes & Pup Condition</span>
                </label>
                <textarea
                  id="sighting-desc"
                  rows={3}
                  className="form-textarea cute-input"
                  placeholder="e.g. Pup was drinking water near tea stall. Seemed healthy, wearing red collar. Heading towards park."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* FIELD 5: FINDER CONTACT (OPTIONAL) */}
              <div className="guest-contact-box">
                <div className="guest-contact-header">
                  <ShieldCheck size={16} className="text-sage" />
                  <span>Your Contact Info (Optional — so the owner can thank you or reach you)</span>
                </div>

                <div className="form-grid-2col" style={{ marginTop: '0.65rem' }}>
                  <div className="form-group mb-0">
                    <label className="form-label cute-label text-xs" htmlFor="finder-name">
                      Your Name
                    </label>
                    <div className="input-with-icon">
                      <UserIcon size={14} className="input-icon text-muted" />
                      <input
                        id="finder-name"
                        type="text"
                        className="form-input cute-input"
                        placeholder="e.g. Ramesh"
                        value={reporterName}
                        onChange={(e) => setReporterName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group mb-0">
                    <label className="form-label cute-label text-xs" htmlFor="finder-phone">
                      Your Phone Number
                    </label>
                    <div className="input-with-icon">
                      <Phone size={14} className="input-icon text-muted" />
                      <input
                        id="finder-phone"
                        type="tel"
                        className="form-input cute-input"
                        placeholder="e.g. 98480 •••••"
                        value={reporterPhone}
                        onChange={(e) => setReporterPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="guest-submit-row mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-lg w-full submit-guest-sighting-btn"
                >
                  <Check size={18} />
                  <span>{submitting ? 'Submitting Report...' : '🐾 Submit Sighting & Alert Owner Now'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
