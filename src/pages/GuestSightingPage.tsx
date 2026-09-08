import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  Eye,
  PawPrint,
  LayoutDashboard,
  MessageCircle,
  Info,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { useToast } from '../context/ToastContext';
import { triggerStarCelebration } from '../utils/confettiHelper';
import abulluImg from '../assets/abullu.jpg';
import {
  getDogPhotoUrl,
  getDogDisplayName,
  handleDogImageError,
} from '../utils/dogPhotoHelper';
import type { LostReport, Sighting } from '../types';

export const GuestSightingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [report, setReport] = useState<LostReport | null>(null);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab state: 'info' | 'report' | 'sightings'
  const [activeTab, setActiveTab] = useState<'info' | 'report' | 'sightings'>('info');

  // Photo gallery state
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Sighting Form State
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

  const loadData = () => {
    if (!id) {
      setLoading(false);
      return;
    }
    const all = storageService.getAllReports();
    const cleanId = id.toLowerCase().replace('lost-', '');
    let found = storageService.getReportById(id);
    if (!found) {
      found = all.find(
        (r) =>
          r.id.toLowerCase() === id.toLowerCase() ||
          r.id.toLowerCase().includes(cleanId) ||
          cleanId.includes(r.id.toLowerCase().replace('lost-', ''))
      );
    }
    if (!found && all.length > 0) {
      found = all[0];
    }
    if (found) {
      setReport(found);
      setSightings(storageService.getSightingsForReport(found.id));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // All photos for gallery
  const allDogPhotos = React.useMemo(() => {
    if (!report?.dog) return [abulluImg];
    const fallbackPhoto = getDogPhotoUrl(report.dog, report);
    const photosList = [
      report.dog.primaryPhoto,
      ...(report.dog.photos || []),
      fallbackPhoto,
    ].filter(Boolean) as string[];
    if (photosList.length === 0) return [abulluImg];
    return Array.from(new Set(photosList));
  }, [report]);

  const currentDogPhoto =
    allDogPhotos[activePhotoIndex] ||
    getDogPhotoUrl(report?.dog, report) ||
    abulluImg;
  const dogDisplayName = getDogDisplayName(report?.dog, report);

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
            const finalStr =
              [street, locality].filter(Boolean).join(', ') ||
              `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
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
    loadData();
    showToast('🎉 Thank you! Your sighting report has been recorded!', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Share Alert to WhatsApp
  const handleShareWhatsApp = () => {
    if (!report || !report.dog) return;
    const sightingUrl = `${window.location.origin}/report-sighting/${report.id}`;
    const ownerPhone =
      report.contactMechanism?.safeContactPhone ||
      (report as any)?.ownerPhone ||
      (report as any)?.contactPhone ||
      report.contactMechanism?.safeContactEmail ||
      '';
    const msg =
      `🚨 *EMERGENCY LOST DOG ALERT* 🐾\n\n` +
      `Please help us find *"${report.dog.name || 'our lost dog'}"* (${report.dog.breed || 'Dog'})!\n` +
      `📍 *Last Seen:* ${report.lastKnownLocation || report.ownerApproximateLocation || 'Area not specified'}\n` +
      (ownerPhone ? `📞 *Owner Contact:* ${ownerPhone}\n` : '') +
      `\n🐾 *Direct Pet Details, Photos & Sighting Report:* (No login needed)\n` +
      `👉 ${sightingUrl}\n\n` +
      `FindLostPuppy Community Network 🐕❤️`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="guest-sighting-loading app-container text-center py-12">
        <div className="loading-spinner mb-4" />
        <p className="text-secondary font-medium">Loading missing dog alert details...</p>
      </div>
    );
  }

  if (!report || !report.dog) {
    return (
      <div className="onboarding-page">
        <div className="app-container onboarding-container">
          <div className="card text-center py-12 px-6">
            <Heart size={48} className="text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Report Not Found or Already Reunited! ❤️</h2>
            <p className="text-secondary max-w-md mx-auto mb-6">
              This alert may have been resolved, or the puppy has already safely returned home with family.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/dashboard" className="btn btn-primary">
                <LayoutDashboard size={16} />
                <span>Explore Community Dashboard 🐾</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { dog, lastKnownLocation, ownerApproximateLocation, dateLost, timeLost, contactMechanism } = report;
  const ownerPhone =
    contactMechanism?.safeContactPhone ||
    (report as any)?.ownerPhone ||
    (report as any)?.contactPhone ||
    '';
  const ownerEmail =
    contactMechanism?.safeContactEmail ||
    (report as any)?.ownerEmail ||
    '';
  const cleanPhone = ownerPhone.replace(/\D/g, '');

  return (
    <div className="guest-sighting-page">
      <div className="app-container guest-sighting-container">
        {/* TOP UTILITY HEADER: Quick Navigation & Share */}
        <div className="guest-top-nav-bar">
          <Link to="/dashboard" className="btn btn-ghost btn-sm">
            <ArrowLeft size={16} />
            <span>Community Dashboard</span>
          </Link>

          <div className="guest-nav-actions-right">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="btn btn-whatsapp btn-sm"
              style={{
                backgroundColor: '#25D366',
                color: '#FFFFFF',
                borderColor: '#25D366',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 700,
              }}
            >
              <Share2 size={14} />
              <span>Share Alert</span>
            </button>

            <Link to="/dashboard" className="btn btn-outline btn-sm explore-network-btn">
              <LayoutDashboard size={14} />
              <span>Browse All Dogs 🐕</span>
            </Link>
          </div>
        </div>

        {/* HERO BANNER: URGENT MISSING ALERT HEADER */}
        <div className="guest-alert-banner card">
          <div className="guest-hero-badge-row">
            <span className="guest-urgent-tag">
              <AlertTriangle size={15} />
              <span>🚨 ACTIVE EMERGENCY LOST DOG ALERT</span>
            </span>
            <span className="guest-id-tag">Report ID: {report.id}</span>
          </div>

          <div className="guest-hero-headline">
            <h1 className="guest-main-title">
              Help Bring <span className="dog-name-highlight">"{dog.name}"</span> Home!
            </h1>
            <p className="guest-main-sub">
              {dog.breed} • Missing from{' '}
              <strong>{lastKnownLocation || ownerApproximateLocation}</strong>
            </p>
          </div>
        </div>

        {/* SEPARATE TABS NAVIGATION BAR */}
        <div className="guest-hub-tabs-container card">
          <div className="guest-hub-tabs" role="tablist">
            {/* TAB 1: LOST PET DETAILS & OWNER CONTACT */}
            <button
              type="button"
              className={`hub-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
              role="tab"
              aria-selected={activeTab === 'info'}
            >
              <PawPrint size={18} className="tab-icon text-terracotta" />
              <div className="tab-label-group">
                <span className="tab-title">🐾 Lost Pet Details & Contact</span>
                <span className="tab-subtitle">Photos, traits & owner contact</span>
              </div>
            </button>

            {/* TAB 2: REPORT SIGHTING FORM */}
            <button
              type="button"
              className={`hub-tab-btn ${activeTab === 'report' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('report');
                setIsSubmitted(false);
              }}
              role="tab"
              aria-selected={activeTab === 'report'}
            >
              <Camera size={18} className="tab-icon text-amber" />
              <div className="tab-label-group">
                <span className="tab-title">📸 Report Sighting / I Found This Pet</span>
                <span className="tab-subtitle">No login needed • Instant alert</span>
              </div>
            </button>

            {/* TAB 3: COMMUNITY SIGHTINGS TIMELINE */}
            <button
              type="button"
              className={`hub-tab-btn ${activeTab === 'sightings' ? 'active' : ''}`}
              onClick={() => setActiveTab('sightings')}
              role="tab"
              aria-selected={activeTab === 'sightings'}
            >
              <Eye size={18} className="tab-icon text-blue-500" />
              <div className="tab-label-group">
                <span className="tab-title">🗺️ Sightings Trail ({sightings.length})</span>
                <span className="tab-subtitle">Live search tracker</span>
              </div>
              {sightings.length > 0 && (
                <span className="tab-counter-pill blue-pill">{sightings.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1 CONTENT: LOST PET DETAILS & OWNER CONTACT INFORMATION */}
        {/* ========================================================================= */}
        {activeTab === 'info' && (
          <div className="hub-tab-pane">
            <div className="guest-info-grid">
              {/* LEFT COLUMN: HIGH-RES PHOTO GALLERY */}
              <div className="guest-photo-gallery-column">
                <div className="guest-main-photo-card card">
                  {currentDogPhoto ? (
                    <div className="guest-main-photo-wrap">
                      <img
                        src={currentDogPhoto}
                        alt={`${dogDisplayName} - ${dog.breed}`}
                        className="guest-main-photo-img"
                        onError={handleDogImageError}
                      />
                      <div className="guest-photo-overlay-tag">
                        <PawPrint size={13} />
                        <span>{dogDisplayName}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="guest-photo-placeholder-box">
                      <PawPrint size={54} className="text-secondary" />
                      <p>No photo uploaded</p>
                    </div>
                  )}

                  {/* Multiple Photo Thumbnails */}
                  {allDogPhotos.length > 1 && (
                    <div className="guest-thumbnails-strip">
                      {allDogPhotos.map((photo, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`guest-thumb-btn ${activePhotoIndex === idx ? 'active' : ''}`}
                          onClick={() => setActivePhotoIndex(idx)}
                          aria-label={`View photo ${idx + 1}`}
                        >
                          <img
                            src={photo}
                            alt={`Photo ${idx + 1}`}
                            className="thumb-img"
                            onError={handleDogImageError}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* QUICK CTA: SPOTTED THIS PET? */}
                <div className="guest-quick-sighting-cta card">
                  <div className="quick-cta-icon-box">
                    <Eye size={22} className="text-amber" />
                  </div>
                  <div>
                    <h3 className="quick-cta-title">Did you spot {dog.name}?</h3>
                    <p className="quick-cta-desc">
                      Every sighting counts! Help the family locate {dog.name} with an instant location and photo report.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('report')}
                      className="btn btn-primary btn-md w-full"
                      style={{ marginTop: '0.75rem' }}
                    >
                      <Camera size={16} />
                      <span>📸 Report Sighting of {dog.name} Now</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: PET INFORMATION & OWNER CONTACT */}
              <div className="guest-details-column">
                {/* 1. OWNER CONTACT INFORMATION CARD (HERO PLACEMENT) */}
                <div className="guest-owner-contact-card card">
                  <div className="owner-contact-header">
                    <ShieldCheck size={20} className="text-emerald-500" />
                    <div>
                      <h2 className="owner-contact-title">Verified Pet Parent Contact</h2>
                      <p className="owner-contact-sub">
                        Direct contact information shared by the owner to report sightings immediately.
                      </p>
                    </div>
                  </div>

                  <div className="owner-action-buttons-grid">
                    {cleanPhone && (
                      <a
                        href={`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(
                          `Hi! I am reaching out regarding your missing dog *"${dog.name}"* on FindLostPuppy. I have information to share!`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-whatsapp btn-lg contact-action-btn"
                        style={{
                          backgroundColor: '#25D366',
                          color: '#FFFFFF',
                          borderColor: '#25D366',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontWeight: 700,
                        }}
                      >
                        <MessageCircle size={18} />
                        <span>💬 Chat with Owner on WhatsApp</span>
                      </a>
                    )}

                    {ownerPhone && (
                      <a
                        href={`tel:${ownerPhone}`}
                        className="btn btn-secondary btn-lg contact-action-btn"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontWeight: 700,
                        }}
                      >
                        <Phone size={18} />
                        <span>📞 Call Owner: {ownerPhone}</span>
                      </a>
                    )}

                    {ownerEmail && !ownerPhone && (
                      <a
                        href={`mailto:${ownerEmail}?subject=${encodeURIComponent(
                          `Information regarding lost dog ${dog.name}`
                        )}`}
                        className="btn btn-outline btn-md"
                      >
                        <span>✉️ Email Owner: {ownerEmail}</span>
                      </a>
                    )}
                  </div>

                  <div className="contact-safe-note">
                    <ShieldCheck size={14} className="text-sage" />
                    <span>
                      100% Free & Direct Community Contact • No registration required to assist the family.
                    </span>
                  </div>
                </div>

                {/* 2. LAST SEEN LOCATION & TIME */}
                <div className="guest-incident-card card">
                  <h3 className="section-title-cute">📍 Last Seen Incident Details</h3>
                  <div className="incident-details-list">
                    <div className="incident-row">
                      <MapPin size={18} className="text-terracotta flex-shrink-0" />
                      <div>
                        <span className="incident-label">Last Known Location:</span>
                        <p className="incident-value">
                          {lastKnownLocation || ownerApproximateLocation || 'Area not specified'}
                        </p>
                      </div>
                    </div>

                    <div className="incident-row">
                      <Calendar size={18} className="text-terracotta flex-shrink-0" />
                      <div>
                        <span className="incident-label">Date & Time Lost:</span>
                        <p className="incident-value">
                          {dateLost || 'Recently'} at {timeLost || 'Unknown time'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. VITAL TRAITS & CHARACTERISTICS */}
                <div className="guest-traits-card card">
                  <h3 className="section-title-cute">🐾 Pet Traits & Identification</h3>
                  <div className="traits-badges-grid">
                    <div className="trait-badge-item">
                      <span className="trait-key">Breed</span>
                      <span className="trait-val">{dog.breed}</span>
                    </div>

                    <div className="trait-badge-item">
                      <span className="trait-key">Gender</span>
                      <span className="trait-val">{dog.gender}</span>
                    </div>

                    {dog.age && (
                      <div className="trait-badge-item">
                        <span className="trait-key">Age</span>
                        <span className="trait-val">{dog.age}</span>
                      </div>
                    )}

                    {dog.size && (
                      <div className="trait-badge-item">
                        <span className="trait-key">Size</span>
                        <span className="trait-val">{dog.size}</span>
                      </div>
                    )}

                    {dog.color && (
                      <div className="trait-badge-item">
                        <span className="trait-key">Color</span>
                        <span className="trait-val">{dog.color}</span>
                      </div>
                    )}

                    {dog.collarInfo && (
                      <div className="trait-badge-item">
                        <span className="trait-key">Collar</span>
                        <span className="trait-val">{dog.collarInfo}</span>
                      </div>
                    )}
                  </div>

                  {dog.distinguishingMarks && (
                    <div className="trait-highlight-block">
                      <Sparkles size={16} className="text-amber flex-shrink-0" />
                      <div>
                        <strong>Distinguishing Marks:</strong> {dog.distinguishingMarks}
                      </div>
                    </div>
                  )}

                  {dog.temperament && (
                    <div className="trait-highlight-block" style={{ marginTop: '0.5rem' }}>
                      <Info size={16} className="text-terracotta flex-shrink-0" />
                      <div>
                        <strong>Temperament & Behavior:</strong> {dog.temperament}
                      </div>
                    </div>
                  )}

                  {dog.medicalNotes && (
                    <div className="trait-highlight-block medical-note" style={{ marginTop: '0.5rem' }}>
                      <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                      <div>
                        <strong>Medical Notes / Special Needs:</strong> {dog.medicalNotes}
                      </div>
                    </div>
                  )}

                  {report.additionalNotes && (
                    <div className="trait-highlight-block" style={{ marginTop: '0.5rem' }}>
                      <Info size={16} className="text-blue-500 flex-shrink-0" />
                      <div>
                        <strong>Circumstances / Owner Notes:</strong> {report.additionalNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2 CONTENT: REPORT SIGHTING FORM (ZERO LOGIN REQUIRED) */}
        {/* ========================================================================= */}
        {activeTab === 'report' && (
          <div className="hub-tab-pane">
            {isSubmitted ? (
              <div className="sighting-success-card card">
                <div className="success-star-icon">🎉</div>
                <h2 className="success-hero-title">Thank You, Community Hero! 💖</h2>
                <p className="success-hero-sub">
                  Your sighting for <strong>"{dog.name}"</strong> has been recorded.
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
                  {cleanPhone && (
                    <button
                      type="button"
                      onClick={() => {
                        const notifyMsg =
                          `Hi! I just reported a sighting of *"${dog.name}"* with photos on FindLostPuppy!\n\n` +
                          `📍 *Location:* ${locationText}\n` +
                          `🕒 *Time:* ${date} at ${time}\n` +
                          (description ? `📝 *Notes:* ${description}\n` : '') +
                          `\nPlease check your alert hub! 🙏`;
                        window.open(
                          `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(
                            notifyMsg
                          )}`,
                          '_blank'
                        );
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
                      <span>💬 Inform Owner on WhatsApp Now</span>
                    </button>
                  )}

                  {ownerPhone && (
                    <a href={`tel:${ownerPhone}`} className="btn btn-outline btn-lg">
                      <Phone size={16} />
                      <span>📞 Call Owner Directly</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab('sightings')}
                    className="btn btn-secondary btn-sm"
                  >
                    <span>View All Sightings on Timeline 🗺️</span>
                  </button>

                  <Link to="/dashboard" className="btn btn-ghost btn-sm">
                    <span>Explore Community Dashboard 🐾</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="guest-form-card card">
                <div className="guest-form-header">
                  <div className="guest-form-icon">📸</div>
                  <div>
                    <h2 className="guest-form-title">Spotted or Found {dog.name}?</h2>
                    <p className="guest-form-sub">
                      ⚡ <strong>Instant Sighting Report:</strong> No account, profile, or login required! Submit details below so the owner can rush to the location.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="guest-sighting-form">
                  {/* FIELD 1: SIGHTING LOCATION */}
                  <div className="form-group">
                    <div className="label-with-action">
                      <label className="form-label cute-label" htmlFor="sighting-location">
                        <span>📍 Where Did You Spot {dog.name}?</span> <span className="required-tag">*</span>
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
                        placeholder="e.g. Near Palangi Supermarket, Main Road"
                        value={locationText}
                        onChange={(e) => setLocationText(e.target.value)}
                        required
                      />
                    </div>
                    <span className="form-hint">
                      Be as specific as possible (nearby landmark, shop, street name, or junction).
                    </span>
                  </div>

                  {/* FIELD 2: PHOTOS OF SPOTTED PUP */}
                  <div className="form-group">
                    <label className="form-label cute-label">
                      <span>📸 Upload Photo of the Spotted Dog</span>
                      <span
                        className="optional-tag"
                        style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: '#9CA3AF' }}
                      >
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
                        Helps the owner verify if it's their pup immediately!
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
                      placeholder="e.g. Pup seemed healthy, was walking towards park near the bakery. Responding to whistles."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* FIELD 5: FINDER CONTACT (OPTIONAL) */}
                  <div className="guest-contact-box">
                    <div className="guest-contact-header">
                      <ShieldCheck size={16} className="text-sage" />
                      <span>Your Contact Info (Optional — so the family can thank or reach you)</span>
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
        )}

        {/* ========================================================================= */}
        {/* TAB 3 CONTENT: COMMUNITY SIGHTINGS TIMELINE */}
        {/* ========================================================================= */}
        {activeTab === 'sightings' && (
          <div className="hub-tab-pane">
            <div className="card guest-timeline-card">
              <div className="timeline-card-header">
                <div>
                  <h2 className="timeline-card-title">🗺️ Community Sighting Trail</h2>
                  <p className="timeline-card-sub">
                    Live log of all verified sightings reported by community members for <strong>"{dog.name}"</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('report');
                    setIsSubmitted(false);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <Camera size={14} />
                  <span>+ Add New Sighting</span>
                </button>
              </div>

              {sightings.length === 0 ? (
                <div className="empty-state-card text-center py-8">
                  <Eye size={40} className="empty-icon text-blue-500 mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-1">No sightings recorded yet</h3>
                  <p className="text-secondary max-w-sm mx-auto mb-4">
                    Be the first vigilant neighbor to spot {dog.name} and share the location with the family!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('report');
                      setIsSubmitted(false);
                    }}
                    className="btn btn-primary btn-md"
                  >
                    <span>📸 Report First Sighting of {dog.name}</span>
                  </button>
                </div>
              ) : (
                <div className="guest-sightings-list">
                  {sightings.map((sighting, idx) => (
                    <div key={sighting.id || idx} className="guest-sighting-item card">
                      <div className="sighting-item-header">
                        <div className="sighting-time-pill">
                          <Calendar size={13} />
                          <span>{sighting.date} at {sighting.time}</span>
                        </div>
                        <span className="sighting-reporter-tag">
                          Spotted by {sighting.reporterName || 'Community Neighbor'}
                        </span>
                      </div>

                      <div className="sighting-item-body">
                        <div className="sighting-location-line">
                          <MapPin size={16} className="text-terracotta flex-shrink-0" />
                          <strong>{sighting.location}</strong>
                        </div>

                        {sighting.description && (
                          <p className="sighting-notes-line">{sighting.description}</p>
                        )}

                        {/* Sighting Photos */}
                        {(sighting.photos?.length || sighting.photo) ? (
                          <div className="sighting-photos-strip">
                            {(sighting.photos || [sighting.photo]).filter(Boolean).map((p, pIdx) => (
                              <img
                                key={pIdx}
                                src={p as string}
                                alt={`Sighting photo ${pIdx + 1}`}
                                className="sighting-evidence-thumb"
                                onError={handleDogImageError}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOTTOM GLOBAL EXPLORE BAR */}
        <div className="guest-bottom-explore-bar card">
          <div className="explore-bar-flex">
            <div className="explore-bar-info">
              <PawPrint size={22} className="text-terracotta" />
              <div>
                <h4 className="explore-bar-title">FindLostPuppy Community Network</h4>
                <p className="explore-bar-sub">
                  Explore all missing dog alerts, verified sightings, and happy reunions across the community.
                </p>
              </div>
            </div>

            <Link to="/dashboard" className="btn btn-outline btn-md">
              <LayoutDashboard size={15} />
              <span>Explore Public Dashboard →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestSightingPage;
