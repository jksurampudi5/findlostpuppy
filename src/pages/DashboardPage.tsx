import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Calendar, Camera, Check, Eye, Home, MapPin, Navigation, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import type { LostReport, Sighting } from '../types';
import { getDogDisplayName, getDogPhotoUrl, handleDogImageError } from '../utils/dogPhotoHelper';

export const DashboardPage: React.FC = () => {
  const { user, petSafetyStatus } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<LostReport[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [detailReport, setDetailReport] = useState<LostReport | null>(null);
  const [detailSighting, setDetailSighting] = useState<Sighting | null>(null);
  const isDashboardAdmin = Boolean(user?.isAdmin || user?.email?.toLowerCase().trim() === 'jksurmpudi5@gmail.com');

  const userReport = user ? storageService.getLatestReportByUserId(user.id, user.email) : null;
  const effectiveSafetyStatus: 'SAFE' | 'LOST' | 'UNDECIDED' = (() => {
    if (petSafetyStatus === 'LOST' || userReport?.status === 'LOST') return 'LOST';
    if (
      petSafetyStatus === 'SAFE' ||
      userReport?.status === 'SAFE' ||
      (userReport?.status as any) === 'REUNITED'
    ) {
      return 'SAFE';
    }
    if (user && storageService.isPetSafe(user.id, user.email)) return 'SAFE';
    return 'UNDECIDED';
  })();
  const [selectedStatus, setSelectedStatus] = useState<'SIGHTINGS' | 'SAFE' | 'LOST' | null>(null);

  useEffect(() => {
    const loadDashboardData = () => {
      setReports(storageService.getAllReports());
      setSightings(storageService.getAllSightings().filter((sighting) => sighting.isCurrent !== false));
    };

    loadDashboardData();
    window.addEventListener('findlostpuppy_reports_updated', loadDashboardData);
    window.addEventListener('storage', loadDashboardData);
    return () => {
      window.removeEventListener('findlostpuppy_reports_updated', loadDashboardData);
      window.removeEventListener('storage', loadDashboardData);
    };
  }, []);

  const visiblePets = useMemo(
    () =>
      reports.filter((report) =>
        selectedStatus === 'LOST'
          ? report.status === 'LOST'
          : report.status === 'SAFE' || report.status === 'REUNITED'
      ),
    [reports, selectedStatus]
  );

  const getSightingReport = (sighting: Sighting) =>
    reports.find((report) => report.id === sighting.reportId || report.id.toLowerCase() === sighting.reportId.toLowerCase());

  const openSightingDetails = (sighting: Sighting) => {
    setDetailSighting(sighting);
  };

  const openPetDetails = (report: LostReport) => {
    setDetailReport(report);
  };

  const refreshSightings = () => {
    setSightings(storageService.getAllSightings().filter((sighting) => sighting.isCurrent !== false));
    setReports(storageService.getAllReports());
  };

  const handleDeleteSighting = (sightingId: string) => {
    if (!isDashboardAdmin) return;
    const ok = window.confirm('Delete this sighting permanently?');
    if (!ok) return;
    storageService.deleteSightingAsAdmin(sightingId);
    if (detailSighting?.id === sightingId) setDetailSighting(null);
    refreshSightings();
  };

  const handleHardResetSightings = () => {
    if (!isDashboardAdmin || sightings.length === 0) return;
    const ok = window.confirm('Hard reset all sighted missing pet reports? This permanently deletes every sighting in this list.');
    if (!ok) return;
    sightings.forEach((sighting) => storageService.deleteSightingAsAdmin(sighting.id));
    setDetailSighting(null);
    refreshSightings();
  };

  return (
    <div className="dashboard-page dashboard-status-only-page">
      <div className="app-container dashboard-status-only-container">
        <section
          className={`dashboard-pet-status-card dashboard-pet-status-card-large ${
            effectiveSafetyStatus === 'LOST'
              ? 'dashboard-pet-status-card-missing'
              : effectiveSafetyStatus === 'SAFE'
                ? 'dashboard-pet-status-card-safe'
                : 'dashboard-pet-status-card-neutral'
          }`}
          aria-live="polite"
        >
          <div className="dashboard-status-title-block">
            <h1>Pet Status</h1>
          </div>

          <div className="dashboard-status-filter-buttons" role="tablist" aria-label="Pet safety list filter">
            <button
              type="button"
              className={`dashboard-status-filter-btn sighting-filter ${selectedStatus === 'SIGHTINGS' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('SIGHTINGS')}
              role="tab"
              aria-selected={selectedStatus === 'SIGHTINGS'}
            >
              <span className="dashboard-status-select-mark">
                {selectedStatus === 'SIGHTINGS' && <Check size={22} />}
              </span>
              <span className="dashboard-status-card-icon sighting-icon">
                <Navigation size={46} />
                <Camera size={18} className="dashboard-status-card-mini-icon" />
              </span>
              <span className="dashboard-status-card-copy">
                <strong>Sighted Missing Pets</strong>
                <span>Review captured pet sightings with photo and location details.</span>
              </span>
            </button>
            <button
              type="button"
              className={`dashboard-status-filter-btn safe-filter ${selectedStatus === 'SAFE' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('SAFE')}
              role="tab"
              aria-selected={selectedStatus === 'SAFE'}
            >
              <span className="dashboard-status-select-mark">
                {selectedStatus === 'SAFE' && <Check size={22} />}
              </span>
              <span className="dashboard-status-card-icon safe-icon">
                <Home size={46} />
                <ShieldCheck size={18} className="dashboard-status-card-mini-icon" />
              </span>
              <span className="dashboard-status-card-copy">
                <strong>Pets at Home</strong>
                <span>Your pet is safe at home. No search alert needed.</span>
              </span>
            </button>
            <button
              type="button"
              className={`dashboard-status-filter-btn missing-filter ${selectedStatus === 'LOST' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('LOST')}
              role="tab"
              aria-selected={selectedStatus === 'LOST'}
            >
              <span className="dashboard-status-select-mark">
                {selectedStatus === 'LOST' && <Check size={22} />}
              </span>
              <span className="dashboard-status-card-icon missing-icon">
                <AlertTriangle size={46} />
              </span>
              <span className="dashboard-status-card-copy">
                <strong>Pets Missing</strong>
                <span>Review missing pets and report a sighting if you found one.</span>
              </span>
            </button>
          </div>

          {selectedStatus && (
            <div className="dashboard-status-pets-panel">
              <div className="dashboard-status-pets-panel-header">
                <h2>
                  {selectedStatus === 'SIGHTINGS'
                    ? 'Sighted Missing Pets'
                    : selectedStatus === 'SAFE'
                      ? 'Pets at Home'
                      : 'Pets Missing'}
                </h2>
                <span>{selectedStatus === 'SIGHTINGS' ? sightings.length : visiblePets.length} listed</span>
              </div>
              {selectedStatus === 'LOST' && user && (
                <button
                  type="button"
                  className="dashboard-capture-shortcut-btn"
                  onClick={() => navigate('/capture')}
                >
                  <Camera size={16} />
                  <span>Capture Missing Pet Photo</span>
                </button>
              )}
              {selectedStatus === 'SIGHTINGS' && isDashboardAdmin && sightings.length > 0 && (
                <button
                  type="button"
                  className="dashboard-hard-reset-sightings-btn"
                  onClick={handleHardResetSightings}
                >
                  <Trash2 size={16} />
                  <span>Hard Reset Sightings</span>
                </button>
              )}

              <div className="dashboard-status-pets-list">
                {selectedStatus === 'SIGHTINGS' ? (
                  sightings.length > 0 ? (
                    sightings.map((sighting) => {
                      const report = getSightingReport(sighting);
                      const displayName = sighting.dogName || report?.dog?.name || 'Missing Pet';
                      const photoUrl = sighting.photo || sighting.photos?.[0] || (report ? getDogPhotoUrl(report.dog, report) : '');
                      return (
                        <article key={sighting.id} className={`dashboard-status-pet-row ${isDashboardAdmin ? 'has-admin-action' : ''}`}>
                          <div className="dashboard-status-pet-photo-wrap">
                            <img
                              src={photoUrl}
                              alt={displayName}
                              className="dashboard-status-pet-photo"
                              onError={handleDogImageError}
                            />
                          </div>
                          <div className="dashboard-status-pet-copy">
                            <strong>{displayName}</strong>
                            <span className="dashboard-status-pet-location">
                              <MapPin size={13} />
                              {sighting.village || sighting.mandal || sighting.district || sighting.location || 'Location shared'}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="dashboard-status-view-details-btn"
                            onClick={() => openSightingDetails(sighting)}
                          >
                            <Eye size={14} />
                            <span>View sighting</span>
                          </button>
                          {isDashboardAdmin && (
                            <button
                              type="button"
                              className="dashboard-sighting-delete-btn"
                              onClick={() => handleDeleteSighting(sighting.id)}
                              aria-label="Delete sighting"
                              title="Delete sighting"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </article>
                      );
                    })
                  ) : (
                    <div className="dashboard-status-empty">No missing pet sightings are listed yet.</div>
                  )
                ) : visiblePets.length > 0 ? (
                  visiblePets.map((report) => {
                    const displayName = getDogDisplayName(report.dog, report);
                    const photoUrl = getDogPhotoUrl(report.dog, report);
                    return (
                      <article
                        key={report.id}
                        className="dashboard-status-pet-row"
                      >
                        <div className="dashboard-status-pet-photo-wrap">
                          <img
                            src={photoUrl}
                            alt={displayName}
                            className="dashboard-status-pet-photo"
                            onError={handleDogImageError}
                          />
                        </div>
                        <div className="dashboard-status-pet-copy">
                          <strong>{displayName}</strong>
                        </div>
                        <button
                          type="button"
                          className="dashboard-status-view-details-btn"
                          onClick={() => openPetDetails(report)}
                        >
                          <Eye size={14} />
                          <span>View details</span>
                        </button>
                      </article>
                    );
                  })
                ) : (
                  <div className="dashboard-status-empty">
                    {selectedStatus === 'SAFE'
                      ? 'No pets at home are listed yet.'
                      : 'No missing pets are listed yet.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {detailReport && (() => {
        const displayName = getDogDisplayName(detailReport.dog, detailReport);
        const photoUrl = getDogPhotoUrl(detailReport.dog, detailReport);
        const isMissing = detailReport.status === 'LOST';
        const location =
          detailReport.ownerApproximateLocation ||
          detailReport.lastKnownLocation ||
          'Location not shared';
        const traits = [
          detailReport.dog?.color,
          detailReport.dog?.size,
          detailReport.dog?.gender,
        ].filter(Boolean).join(' • ');

        return (
          <div className="dashboard-status-modal-backdrop" role="presentation">
            <section
              className="dashboard-status-pet-popover dashboard-status-pet-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`${displayName} details`}
            >
              <button
                type="button"
                className="dashboard-status-modal-close"
                onClick={() => setDetailReport(null)}
                aria-label="Close pet details"
              >
                <X size={22} />
              </button>

              <div className="dashboard-status-popover-photo-stage">
                <img
                  src={photoUrl}
                  alt={displayName}
                  className="dashboard-status-popover-photo"
                  onError={handleDogImageError}
                />
              </div>
              <div className="dashboard-status-popover-copy">
                <div className="dashboard-status-modal-title-block">
                  <strong>{displayName}</strong>
                  <span>{detailReport.dog?.breed || 'Companion Pet'}</span>
                </div>
                {traits && (
                  <span className="dashboard-status-popover-line">
                    <Sparkles size={15} />
                    {traits}
                  </span>
                )}
                <span className="dashboard-status-popover-line">
                  <MapPin size={15} />
                  {isMissing ? detailReport.lastKnownLocation || location : location}
                </span>
                {isMissing && (
                  <span className="dashboard-status-popover-line">
                    <Calendar size={15} />
                    {detailReport.dateLost || 'Date unknown'} {detailReport.timeLost ? `• ${detailReport.timeLost}` : ''}
                  </span>
                )}
                {detailReport.dog?.distinguishingMarks && (
                  <p>{detailReport.dog.distinguishingMarks}</p>
                )}
                {detailReport.additionalNotes && (
                  <p>{detailReport.additionalNotes}</p>
                )}
                {isMissing && (
                  <a
                    href={`/report-sighting/${detailReport.id}`}
                    className="dashboard-status-popover-action"
                  >
                    <Eye size={16} />
                    <span>Report if found / sighted</span>
                  </a>
                )}
              </div>
            </section>
          </div>
        );
      })()}

      {detailSighting && (() => {
        const report = getSightingReport(detailSighting);
        const displayName = detailSighting.dogName || report?.dog?.name || 'Missing Pet';
        const photoUrl = detailSighting.photo || detailSighting.photos?.[0] || (report ? getDogPhotoUrl(report.dog, report) : '');
        const locationRows = [
          ['State', detailSighting.state],
          ['District', detailSighting.district],
          ['Mandal', detailSighting.mandal],
          ['Village', detailSighting.village],
          ['PIN Code', detailSighting.pinCode],
        ].filter(([, value]) => Boolean(value));

        return (
          <div className="dashboard-status-modal-backdrop" role="presentation">
            <section
              className="dashboard-status-pet-popover dashboard-status-pet-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`${displayName} sighting details`}
            >
              <button
                type="button"
                className="dashboard-status-modal-close"
                onClick={() => setDetailSighting(null)}
                aria-label="Close sighting details"
              >
                <X size={22} />
              </button>

              <div className="dashboard-status-popover-photo-stage">
                <img
                  src={photoUrl}
                  alt={`${displayName} sighting`}
                  className="dashboard-status-popover-photo"
                  onError={handleDogImageError}
                />
              </div>
              <div className="dashboard-status-popover-copy">
                <div className="dashboard-status-modal-title-block">
                  <strong>{displayName}</strong>
                  <span>Private sighting report</span>
                </div>
                <span className="dashboard-status-popover-line">
                  <Calendar size={15} />
                  {detailSighting.date} {detailSighting.time ? `• ${detailSighting.time}` : ''}
                </span>
                <span className="dashboard-status-popover-line">
                  <MapPin size={15} />
                  {detailSighting.location || 'Location shared'}
                </span>
                {locationRows.length > 0 && (
                  <div className="dashboard-sighting-location-grid">
                    {locationRows.map(([label, value]) => (
                      <div key={label} className="dashboard-sighting-location-cell">
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                )}
                {detailSighting.description && <p>{detailSighting.description}</p>}
                {isDashboardAdmin && (
                  <button
                    type="button"
                    className="dashboard-sighting-delete-wide-btn"
                    onClick={() => handleDeleteSighting(detailSighting.id)}
                  >
                    <Trash2 size={16} />
                    <span>Delete this sighting</span>
                  </button>
                )}
                {report && (
                  <button
                    type="button"
                    className="dashboard-status-popover-action"
                    onClick={() => {
                      setDetailSighting(null);
                      setDetailReport(report);
                    }}
                  >
                    <Eye size={16} />
                    <span>View missing pet profile</span>
                  </button>
                )}
              </div>
            </section>
          </div>
        );
      })()}
    </div>
  );
};
