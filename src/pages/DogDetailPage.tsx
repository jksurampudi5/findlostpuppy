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
} from 'lucide-react';
import type { LostReport, Sighting } from '../types';
import { storageService } from '../services/storageService';
import { StatusBadge } from '../components/StatusBadge';
import { SightingModal } from '../components/SightingModal';
import { useToast } from '../context/ToastContext';

export const DogDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [report, setReport] = useState<LostReport | null>(null);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isSightingModalOpen, setIsSightingModalOpen] = useState(false);
  const [contactRevealed, setContactRevealed] = useState(false);

  useEffect(() => {
    if (!id) return;
    const foundReport = storageService.getReportById(id);
    if (foundReport) {
      setReport(foundReport);
      setSightings(storageService.getSightingsForReport(foundReport.id));
    }
  }, [id]);

  const refreshData = () => {
    if (!id) return;
    const updated = storageService.getReportById(id);
    if (updated) {
      setReport({ ...updated });
      setSightings(storageService.getSightingsForReport(updated.id));
    }
  };

  const handleShare = () => {
    if (navigator.share && report) {
      navigator.share({
        title: `Find ${report.dog.name} - Lost Dog Report`,
        text: `Please help find ${report.dog.name}, a ${report.dog.breed} lost in ${report.ownerApproximateLocation}.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('🐾 Link copied to clipboard! Share it with friends & neighbors.', 'success');
    }
  };

  if (!report) {
    return (
      <div className="app-container detail-not-found">
        <div className="empty-state-card card">
          <h2>🐾 Lost Dog Report Not Found</h2>
          <p>This report may have been resolved, archived, or the link is incorrect.</p>
          <Link to="/find" className="btn btn-primary">
            Browse All Lost Dogs
          </Link>
        </div>
      </div>
    );
  }

  const { dog, status, ownerApproximateLocation, lastKnownLocation, dateLost, timeLost, contactMechanism } = report;
  const allPhotos = [dog.primaryPhoto, ...(dog.photos || [])].filter(Boolean);
  const currentPhoto = allPhotos[selectedPhotoIndex] || dog.primaryPhoto;

  return (
    <div className="dog-detail-page">
      <div className="app-container">
        {/* Navigation Breadcrumb */}
        <div className="detail-breadcrumb-bar">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm back-nav-btn">
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div className="breadcrumb-report-id">
            <span>Report ID:</span>
            <code>{report.id}</code>
          </div>
          <button onClick={handleShare} className="btn btn-outline btn-sm share-btn">
            <Share2 size={15} />
            <span>Share Alert</span>
          </button>
        </div>

        {/* Reunited Celebration Banner if applicable */}
        {status === 'REUNITED' && (
          <div className="reunited-celebration-banner card">
            <div className="reunited-icon-circle">
              <Sparkles size={28} />
            </div>
            <div>
              <h3>❤️ Joyful News: {dog.name} has been safely reunited!</h3>
              <p>
                Thanks to vigilant community sightings and neighbors, {dog.name} is back home safe and sound.
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
                alt={`${dog.name} - ${dog.breed}`}
                className="main-photo-img"
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

            {/* Pet Parent Info Card */}
            {(() => {
              const rawOwnerId = report.ownerId.replace('owner-', '');
              const ownerProfile = storageService.getOwnerProfileByUserId(rawOwnerId);
              if (!ownerProfile) return null;
              return (
                <div className="owner-info-detail-card card">
                  <h3 className="section-subheading">🧑‍🦱 Pet Parent Information</h3>
                  <div className="owner-detail-flex">
                    <div className="owner-detail-avatar-wrap">
                      {ownerProfile.photo ? (
                        <img src={ownerProfile.photo} alt={ownerProfile.fullName} className="owner-detail-avatar-img" />
                      ) : (
                        <div className="owner-detail-avatar-placeholder">🧑‍🦱</div>
                      )}
                    </div>
                    <div className="owner-detail-info">
                      <h4 className="owner-detail-name">{ownerProfile.fullName}</h4>
                      {ownerProfile.approximateArea && (
                        <div className="owner-detail-meta">
                          <MapPin size={14} className="text-terracotta" />
                          <span>{ownerProfile.approximateArea}</span>
                        </div>
                      )}
                      <div className="owner-detail-privacy-note">
                        <Shield size={12} />
                        <span>Exact address protected for family safety</span>
                      </div>
                    </div>
                  </div>

                  {/* Owner & Pet Together */}
                  <div className="owner-pet-together-strip">
                    <div className="together-avatar owner-together">
                      {ownerProfile.photo ? (
                        <img src={ownerProfile.photo} alt={ownerProfile.fullName} />
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
                    <span className="together-label">{ownerProfile.fullName.split(' ')[0]} & {dog.name}</span>
                  </div>
                </div>
              );
            })()}

            {/* Safe Contact Owner Mechanism */}
            <div className="safe-contact-card card">
              <h3 className="section-subheading">❤️ Contact Owner Directly</h3>
              <p className="contact-helper-text">
                {contactMechanism.contactNote ||
                  `Have direct information or holding ${dog.name}? Reach out to the verified family below.`}
              </p>

              {contactRevealed ? (
                <div className="revealed-contact-box">
                  {contactMechanism.safeContactPhone && (
                    <div className="contact-line">
                      <Phone size={18} className="contact-icon" />
                      <div>
                        <span className="contact-label">Owner Phone:</span>
                        <a href={`tel:${contactMechanism.safeContactPhone}`} className="contact-action-link">
                          {contactMechanism.safeContactPhone}
                        </a>
                      </div>
                    </div>
                  )}
                  {contactMechanism.safeContactEmail && (
                    <div className="contact-line">
                      <Mail size={18} className="contact-icon" />
                      <div>
                        <span className="contact-label">Owner Email:</span>
                        <a href={`mailto:${contactMechanism.safeContactEmail}`} className="contact-action-link">
                          {contactMechanism.safeContactEmail}
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="contact-safety-note">
                    <Shield size={14} />
                    <span>Please only contact if you have legitimate information regarding {dog.name}.</span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  onClick={() => setContactRevealed(true)}
                >
                  <Phone size={18} />
                  <span>Show Verified Owner Contact Information</span>
                </button>
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
    </div>
  );
};
