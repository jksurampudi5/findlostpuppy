import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Shield,
  Eye,
  Phone,
  Mail,
  ArrowLeft,
  Share2,
  AlertTriangle,
  Sparkles,
  PawPrint,
  PlusCircle,
  Trash2,
  Check,
} from 'lucide-react';
import type { LostReport, Sighting, ReportStatus } from '../types';
import { storageService } from '../services/storageService';
import { StatusBadge } from '../components/StatusBadge';
import { SightingModal } from '../components/SightingModal';
import { ReportModal } from '../components/ReportModal';
import { useToast } from '../context/ToastContext';
import { triggerStarCelebration } from '../utils/confettiHelper';
import { getDogPhotoUrl, getDogDisplayName, handleDogImageError } from '../utils/dogPhotoHelper';
import { generateWhatsAppSosMessage } from '../utils/shareHelper';
import { useAuth } from '../context/AuthContext';
import { maskPhoneNumber, maskEmail, maskOwnerName, isOwnerOfReport } from '../utils/privacyUtils';

export const DogDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [report, setReport] = useState<LostReport | null>(null);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isSightingModalOpen, setIsSightingModalOpen] = useState(false);

  // Safety, reporting and blocking
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'listing' | 'user'>('listing');
  const [isBlocked, setIsBlocked] = useState(false);

  const refreshData = () => {
    if (!id) return;
    const updated = storageService.getReportById(id);
    if (updated) {
      setReport({ ...updated });
      setSightings(storageService.getSightingsForReport(updated.id));
      setIsBlocked(storageService.isUserBlocked(updated.ownerId));
    }
  };

  useEffect(() => {
    if (!id) return;
    refreshData();

    const handleUpdate = () => {
      refreshData();
    };

    window.addEventListener('findlostpuppy_reports_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('findlostpuppy_reports_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [id]);

  const handleStatusChange = (newStatus: ReportStatus) => {
    if (!report) return;
    storageService.updateReportStatus(report.id, newStatus);
    if (newStatus === 'SAFE' || newStatus === 'REUNITED') {
      triggerStarCelebration();
      showToast('🏡 Wonderful news! Pup marked as Safe at Home! ❤️', 'success');
    } else if (newStatus === 'LOST') {
      showToast('🚨 Alert marked as actively MISSING.', 'info');
    }
    refreshData();
  };

  const handleDeleteReport = () => {
    if (!report) return;
    const dogName = getDogDisplayName(report.dog, report);
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the alert for "${dogName}"? This will delete all pet data forever from the dashboard and database.`
    );
    if (!confirmed) return;

    const success = storageService.deleteReport(report.id);
    if (success) {
      showToast(`🗑️ Alert for ${dogName} permanently deleted forever.`, 'info');
      navigate('/dashboard');
    }
  };

  const handleShare = () => {
    if (navigator.share && report) {
      const name = getDogDisplayName(report.dog, report);
      navigator.share({
        title: `Find ${name} - Lost Dog Report`,
        text: `Please help find ${name}, a ${report.dog?.breed || 'Companion Pet'} lost in ${report.ownerApproximateLocation || report.lastKnownLocation}.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('🐾 Link copied to clipboard! Share it with friends & neighbors.', 'success');
    }
  };

  const handleBlockToggle = () => {
    if (!report) return;
    if (isBlocked) {
      storageService.unblockUser(report.ownerId);
      setIsBlocked(false);
      showToast('User has been unblocked.', 'info');
    } else {
      const confirmed = window.confirm(
        'Are you sure you want to block this user? Listings and sightings from this user will be hidden from your feed.'
      );
      if (confirmed) {
        storageService.blockUser(report.ownerId, report.contactMechanism?.safeContactEmail);
        setIsBlocked(true);
        showToast('User blocked. Their listings are now hidden.', 'info');
      }
    }
  };

  if (!report) {
    return (
      <div className="app-container detail-not-found">
        <div className="empty-state-card card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <PawPrint size={48} className="text-terracotta mx-auto mb-3" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            🐾 Lost Dog Alert Resolved or Not Found
          </h2>
          <p className="text-secondary max-w-md mx-auto mb-6">
            This pet alert may have safely concluded with the puppy home, or the report ID has been updated.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/dashboard" className="btn btn-primary">
              <span>Explore Community Dashboard 📊</span>
            </Link>
            <Link to="/find" className="btn btn-outline">
              <span>Browse All Dogs 🐾</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { dog, status, ownerApproximateLocation, lastKnownLocation, dateLost, timeLost, contactMechanism } = report;
  const displayName = getDogDisplayName(dog, report);
  const primaryPhoto = getDogPhotoUrl(dog, report);
  const allPhotos = [primaryPhoto, ...(dog?.photos || [])].filter(Boolean);
  const currentPhoto = allPhotos[selectedPhotoIndex] || primaryPhoto;

  return (
    <div className="dog-detail-page">
      <div className="app-container">
        {/* Navigation Breadcrumb */}
        <div className="detail-breadcrumb-bar">
          <button
            onClick={() => {
              if (window.history.length > 2) navigate(-1);
              else navigate('/dashboard');
            }}
            className="btn btn-ghost btn-sm back-nav-btn"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <div className="breadcrumb-report-id">
            <span>Report ID:</span>
            <code>{report.id}</code>
          </div>
          <div className="breadcrumb-actions-right">
            {status === 'LOST' ? (
              <button
                type="button"
                onClick={() => handleStatusChange('SAFE')}
                className="btn btn-sm"
                style={{
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  borderColor: '#A7F3D0',
                  fontWeight: 700,
                }}
                title="Mark Pup Safe at Home 🏡"
              >
                <Check size={14} />
                <span>Safe at Home 🏡</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleStatusChange('LOST')}
                className="btn btn-sm btn-ghost text-amber-600"
                title="Report missing if needed"
              >
                <span>Report Missing 🚨</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const { whatsappUrl, dashboardUrl } = generateWhatsAppSosMessage(
                  report,
                  report.dog,
                  report.contactMechanism?.safeContactPhone
                );
                try {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(dashboardUrl);
                  }
                } catch {}
                showToast('📲 WhatsApp SOS alert opened! Live Public Dashboard link copied.', 'success');
                window.open(whatsappUrl, '_blank');
              }}
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
              title="Share Alert on WhatsApp"
            >
              <Share2 size={14} />
              <span>WhatsApp</span>
            </button>

            <button onClick={handleShare} className="btn btn-outline btn-sm share-btn">
              <Share2 size={15} />
              <span>Share Link</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteReport}
              className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
              title="Remove / Delete this report"
            >
              <Trash2 size={15} />
              <span>Remove Alert</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setReportType('listing');
                setIsReportModalOpen(true);
              }}
              className="btn btn-ghost btn-sm report-btn"
              title="Report this listing for moderation"
            >
              <span>⚠️ Report</span>
            </button>

            <button
              type="button"
              onClick={handleBlockToggle}
              className={`btn btn-sm ${isBlocked ? 'btn-secondary' : 'btn-ghost'}`}
              title={isBlocked ? 'Unblock this user' : 'Block this user'}
            >
              <span>{isBlocked ? '✓ Unblock' : '🚫 Block'}</span>
            </button>
          </div>
        </div>

        {/* Blocked User Warning Banner */}
        {isBlocked && (
          <div className="blocked-user-banner card" role="alert">
            <span>🚫 <strong>You have blocked this user.</strong> You can unblock them at any time above or from Settings → Legal.</span>
          </div>
        )}

        {/* Safe at Home Celebration Banner if applicable */}
        {(status === 'SAFE' || status === 'REUNITED') && (
          <div className="reunited-celebration-banner card">
            <div className="reunited-icon-circle">
              <Sparkles size={28} />
            </div>
            <div>
              <h3>🏡 Safe at Home: {displayName} is safe with family!</h3>
              <p>
                Thanks to vigilant community sightings and neighbors, {displayName} is at home safe and sound.
              </p>
            </div>
          </div>
        )}

        {/* Main Grid: Gallery & Info */}
        <div className="detail-grid">
          {/* Left Column: Photo Gallery */}
          <div className="detail-gallery-column">
            <div className="main-photo-frame card">
              <img
                src={currentPhoto}
                alt={`${displayName} - ${dog?.breed || 'Companion Pet'}`}
                className="main-photo-img"
                onError={handleDogImageError}
              />
              <div className="main-photo-status-badge">
                <StatusBadge status={status} size="lg" />
              </div>
            </div>

            {/* Thumbnails */}
            {allPhotos.length > 1 && (
              <div className="thumbnails-row">
                {allPhotos.map((photo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`thumbnail-btn ${selectedPhotoIndex === idx ? 'active' : ''}`}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    aria-label={`View photo ${idx + 1}`}
                  >
                    <img src={photo} alt={`Thumbnail ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Sighting Trigger Box */}
            <div className="sighting-prompt-card card">
              <div className="prompt-header">
                <Eye size={20} className="prompt-icon" />
                <h4>Have you seen {dog.name}?</h4>
              </div>
              <p className="prompt-text">
                Spotted this pup wandering or in someone's care? Even a partial sighting helps establish their trail.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-block btn-lg cta-report-sighting"
                onClick={() => setIsSightingModalOpen(true)}
              >
                <PawPrint size={20} />
                <span>🐾 Report a Sighting of {dog.name}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Dog Details & Actions */}
          <div className="detail-content-column">
            <div className="detail-header-card card">
              <div className="detail-header-top">
                <div>
                  <span className="detail-status-pill">{status} DOG REPORT</span>
                  <h1 className="detail-dog-name">{dog.name}</h1>
                  <span className="detail-breed-badge">{dog.breed}</span>
                </div>
                <div className="detail-meta-date">
                  <Calendar size={15} />
                  <span>Lost: {dateLost}</span>
                </div>
              </div>

              {/* Last Seen Area Callout */}
              <div className="last-seen-callout">
                <div className="last-seen-header">
                  <MapPin size={18} className="map-pin-icon" />
                  <strong>Approximate Last Seen Area</strong>
                </div>
                <p className="last-seen-location-text">{ownerApproximateLocation}</p>
                {lastKnownLocation && (
                  <p className="last-known-subtext">
                    <strong>Specific Landmark:</strong> {lastKnownLocation}
                  </p>
                )}
                {timeLost && (
                  <p className="last-known-subtext">
                    <strong>Time Lost:</strong> Around {timeLost}
                  </p>
                )}
                <div className="privacy-badge-pill">
                  <Shield size={13} />
                  <span>Exact owner street address protected for family safety</span>
                </div>
              </div>
            </div>

            {/* Quick Characteristics Grid */}
            <div className="attributes-grid card">
              <h3 className="section-subheading">🐾 Vital Characteristics</h3>
              <div className="traits-grid">
                <div className="trait-item">
                  <span className="trait-label">Gender</span>
                  <span className="trait-value">{dog.gender}</span>
                </div>
                <div className="trait-item">
                  <span className="trait-label">Age</span>
                  <span className="trait-value">{dog.age}</span>
                </div>
                <div className="trait-item">
                  <span className="trait-label">Size</span>
                  <span className="trait-value">{dog.size}</span>
                </div>
                <div className="trait-item">
                  <span className="trait-label">Color</span>
                  <span className="trait-value">{dog.color}</span>
                </div>
                <div className="trait-item">
                  <span className="trait-label">Collar</span>
                  <span className="trait-value">{dog.collarInfo || 'None reported'}</span>
                </div>
                <div className="trait-item">
                  <span className="trait-label">Microchip</span>
                  <span className="trait-value">{dog.microchipId ? 'Yes (Registered)' : 'Not Microchipped'}</span>
                </div>
              </div>
            </div>

            {/* Distinguishing Marks & Story */}
            <div className="story-card card">
              <h3 className="section-subheading">🔍 Distinguishing Marks & Features</h3>
              <p className="story-text">
                {dog.distinguishingMarks || 'No specific scars or distinguishing marks noted.'}
              </p>

              {dog.coatDescription && (
                <div className="story-sub-block">
                  <strong>Coat Description:</strong> {dog.coatDescription}
                </div>
              )}

              {dog.temperament && (
                <div className="story-sub-block">
                  <strong>Temperament / Behavior:</strong> {dog.temperament}
                </div>
              )}

              {dog.medicalNotes && (
                <div className="story-sub-block medical-alert-block">
                  <AlertTriangle size={15} />
                  <span><strong>Medical Needs:</strong> {dog.medicalNotes}</span>
                </div>
              )}

              {report.additionalNotes && (
                <div className="story-sub-block">
                  <strong>Circumstances:</strong> {report.additionalNotes}
                </div>
              )}
            </div>

            {/* Pet Parent Info Card with Privacy Masking */}
            {(() => {
              const rawOwnerId = report.ownerId.replace('owner-', '');
              const ownerProfile = storageService.getOwnerProfileByUserId(rawOwnerId);
              if (!ownerProfile) return null;
              const isOwner = isOwnerOfReport(report, user);
              const displayName = isOwner ? ownerProfile.fullName : maskOwnerName(ownerProfile.fullName);

              return (
                <div className="owner-info-detail-card card">
                  <h3 className="section-subheading">🧑‍🦱 Pet Parent Information</h3>
                  <div className="owner-detail-flex">
                    <div className="owner-detail-avatar-wrap">
                      {ownerProfile.photo && isOwner ? (
                        <img src={ownerProfile.photo} alt={displayName} className="owner-detail-avatar-img" />
                      ) : (
                        <div className="owner-detail-avatar-placeholder">🧑‍🦱</div>
                      )}
                    </div>
                    <div className="owner-detail-info">
                      <h4 className="owner-detail-name">
                        {displayName} {isOwner ? '(You - Owner)' : '(Verified Pet Parent)'}
                      </h4>
                      {ownerProfile.approximateArea && (
                        <div className="owner-detail-meta">
                          <MapPin size={14} className="text-terracotta" />
                          <span>{ownerProfile.approximateArea}</span>
                        </div>
                      )}
                      <div className="owner-detail-privacy-note">
                        <Shield size={12} />
                        <span>{isOwner ? 'Your full profile details' : 'Contact details protected for family privacy & safety'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Owner & Pet Together */}
                  <div className="owner-pet-together-strip">
                    <div className="together-avatar owner-together">
                      {ownerProfile.photo && isOwner ? (
                        <img src={ownerProfile.photo} alt={displayName} />
                      ) : (
                        <span>🧑‍🦱</span>
                      )}
                    </div>
                    <div className="together-heart">❤️</div>
                    <div className="together-avatar pet-together">
                      {dog.primaryPhoto ? (
                        <img src={dog.primaryPhoto} alt={dog.name} />
                      ) : (
                        <span>🐶</span>
                      )}
                    </div>
                    <span className="together-label">{displayName.split(' ')[0]} & {dog.name}</span>
                  </div>
                </div>
              );
            })()}

            {/* Safe Contact Owner Mechanism with Privacy Shield */}
            <div className="safe-contact-card card">
              <h3 className="section-subheading">❤️ Verified Owner Contact</h3>
              <p className="contact-helper-text">
                {isOwnerOfReport(report, user)
                  ? 'Your verified emergency contact details on file:'
                  : `Have you seen ${dog.name}? Use the Sighting Report tool to securely send details directly to the family.`}
              </p>

              {isOwnerOfReport(report, user) ? (
                <div className="revealed-contact-box">
                  {contactMechanism?.safeContactPhone && (
                    <div className="contact-line">
                      <Phone size={18} className="contact-icon" />
                      <div>
                        <span className="contact-label">Your Phone:</span>
                        <a href={`tel:${contactMechanism.safeContactPhone}`} className="contact-action-link">
                          {contactMechanism.safeContactPhone}
                        </a>
                      </div>
                    </div>
                  )}
                  {contactMechanism?.safeContactEmail && (
                    <div className="contact-line">
                      <Mail size={18} className="contact-icon" />
                      <div>
                        <span className="contact-label">Your Email:</span>
                        <a href={`mailto:${contactMechanism.safeContactEmail}`} className="contact-action-link">
                          {contactMechanism.safeContactEmail}
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="contact-safety-note" style={{ color: '#15803D', backgroundColor: '#DCFCE7' }}>
                    <Shield size={14} />
                    <span>You are viewing your own contact info. Public viewers see masked numbers for security.</span>
                  </div>
                </div>
              ) : (
                <div className="privacy-relay-contact-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {contactMechanism?.safeContactPhone && (
                      <div className="contact-line" style={{ padding: '6px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <Phone size={14} className="text-emerald-600" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                          Phone: {maskPhoneNumber(contactMechanism.safeContactPhone)} (Protected)
                        </span>
                      </div>
                    )}
                    {contactMechanism?.safeContactEmail && (
                      <div className="contact-line" style={{ padding: '6px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <Mail size={14} className="text-sky-600" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                          Email: {maskEmail(contactMechanism.safeContactEmail)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="contact-safety-note" style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', borderRadius: '8px', padding: '8px 12px' }}>
                    <Shield size={14} className="text-emerald-600" />
                    <span>
                      🛡️ <strong>Privacy Shield Active:</strong> Direct phone numbers are masked to prevent spam. Report sightings below to instantly forward your location and notes to the owner.
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-block btn-lg"
                    onClick={() => setIsSightingModalOpen(true)}
                  >
                    <PawPrint size={18} />
                    <span>🐾 Report Sighting of {dog.name}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sightings Timeline Section */}
        <section className="sightings-timeline-section">
          <div className="timeline-header-flex">
            <div>
              <div className="section-eyebrow">
                <Eye size={16} />
                <span>Community Eyes</span>
              </div>
              <h2 className="section-title">Sightings Timeline ({sightings.length})</h2>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsSightingModalOpen(true)}
            >
              <PlusCircle size={15} />
              <span>Add New Sighting</span>
            </button>
          </div>

          {sightings.length === 0 ? (
            <div className="empty-state-card card">
              <Eye size={36} className="empty-icon" />
              <h3>No sightings reported yet</h3>
              <p>Be the first neighbor to spot {dog.name} and share their location with the owner.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsSightingModalOpen(true)}
              >
                🐾 Submit First Sighting
              </button>
            </div>
          ) : (
            <div className="sightings-list">
              {sightings.map((sighting) => (
                <div key={sighting.id} className="sighting-card card">
                  <div className="sighting-card-top">
                    <div className="sighting-time-badge">
                      <Calendar size={14} />
                      <span>{sighting.date} at {sighting.time}</span>
                    </div>
                    <span className="sighting-reporter-pill">
                      Spotted by {sighting.reporterName || 'Kind Neighbor'}
                    </span>
                  </div>

                  <div className="sighting-location-row">
                    <MapPin size={16} className="map-pin-icon" />
                    <strong>{sighting.location}</strong>
                  </div>

                  <p className="sighting-description">{sighting.description}</p>

                  {sighting.photo && (
                    <div className="sighting-photo-wrapper">
                      <img src={sighting.photo} alt={`Sighting of ${dog.name}`} className="sighting-photo-img" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Sighting Modal */}
      <SightingModal
        isOpen={isSightingModalOpen}
        onClose={() => setIsSightingModalOpen(false)}
        reportId={report.id}
        dogName={dog.name}
        onSightingAdded={refreshData}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        type={reportType}
        targetId={reportType === 'listing' ? report.id : report.ownerId}
        targetTitle={reportType === 'listing' ? report.dog.name : report.contactMechanism.safeContactEmail || 'Listing Creator'}
        targetUserId={report.ownerId}
        onSuccess={() => {
          showToast(`Report received. Thank you for keeping our community safe.`, 'success');
        }}
      />
    </div>
  );
};
