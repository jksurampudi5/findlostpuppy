import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Calendar, Camera, Check, Eye, Home, MapPin, Navigation, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import type { LostReport, Sighting } from '../types';
import { getDogDisplayName, getDogPhotoUrl, handleDogImageError, resolveGenericMediaUrl } from '../utils/dogPhotoHelper';
import { EmptyState } from '../components/fallbacks/EmptyState';

/** Displays pet-status categories and grouped sightings with owner-gated safe-pet detail dialogs. */
export const DashboardPage: React.FC = () => {
  const { user, petSafetyStatus } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const listPanelRef = useRef<HTMLDivElement | null>(null);
  const [reports, setReports] = useState<LostReport[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [detailReport, setDetailReport] = useState<LostReport | null>(null);
  const [detailSighting, setDetailSighting] = useState<Sighting | null>(null);
  const [activeSightingPhotoIndex, setActiveSightingPhotoIndex] = useState(0);
  const [statusPanelOpen, setStatusPanelOpen] = useState(false);
  const isDashboardAdmin = Boolean(
    user?.isAdmin ||
    user?.email?.toLowerCase().trim() === 'jksurmpudi5@gmail.com' ||
    user?.email?.toLowerCase().trim() === 'jksurampudi5@gmail.com'
  );

  const userReport = user ? storageService.getLatestReportByUserId(user.id, user.email) : null;
  const userPetProfile = user ? storageService.getPetProfileByUserId(user.id, user.email) : null;
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

  const initialTab = (() => {
    const stateTab = (location.state as any)?.activeTab || (location.state as any)?.tab;
    if (stateTab === 'SAFE' || stateTab === 'LOST' || stateTab === 'SIGHTINGS') {
      return stateTab;
    }
    return 'SIGHTINGS';
  })();
  const [selectedStatus, setSelectedStatus] = useState<'SIGHTINGS' | 'SAFE' | 'LOST'>(initialTab);

  useEffect(() => {
    const stateTab = (location.state as any)?.activeTab || (location.state as any)?.tab;
    if (stateTab === 'SAFE' || stateTab === 'LOST' || stateTab === 'SIGHTINGS') {
      setSelectedStatus(stateTab);
    }
  }, [location.state]);

  /** Selects a pet-status category and opens its list modal. */
  const selectStatusAndScroll = (status: 'SIGHTINGS' | 'SAFE' | 'LOST') => {
    setSelectedStatus(status);
    setStatusPanelOpen(true);
  };

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

  const visiblePets = useMemo(() => {
    if (selectedStatus === 'LOST') {
      return reports.filter((report) => report.status === 'LOST');
    }
    const safeReports = reports.filter(
      (report) => report.status === 'SAFE' || report.status === 'REUNITED'
    );
    if (user && (effectiveSafetyStatus === 'SAFE' || userReport?.status === 'SAFE')) {
      const alreadyInList = safeReports.some(
        (r) => r.id === userReport?.id || r.ownerId === user.id || r.ownerId === `owner-${user.id}`
      );
      if (!alreadyInList && userReport) {
        return [userReport, ...safeReports];
      }
    }
    if (safeReports.length === 0 && selectedStatus === 'SAFE' && userPetProfile) {
      return [
        {
          id: `local-safe-${userPetProfile.id}`,
          dogId: userPetProfile.id,
          ownerId: user?.id || 'owner',
          dog: userPetProfile,
          ownerApproximateLocation: 'Safe at home',
          lastKnownLocation: 'Safe at home',
          dateLost: '',
          timeLost: '',
          additionalNotes: 'Your beloved companion is safe at home.',
          status: 'SAFE' as const,
          sightingCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          contactMechanism: {
            showPhone: false,
            showEmail: false,
            safeContactPhone: '',
            safeContactEmail: '',
            contactNote: 'Safe at home',
          },
        },
      ];
    }
    return safeReports;
  }, [reports, selectedStatus, user, effectiveSafetyStatus, userReport, userPetProfile]);

  const getSightingReport = (sighting: Sighting) =>
    reports.find((report) => report.id === sighting.reportId || report.id.toLowerCase() === sighting.reportId.toLowerCase());

  /** Matches the current user against normalized owner IDs or the report's contact email. */
  const isCurrentUserPetOwner = (report: LostReport) => {
    if (!user) return false;
    /** Removes repeated owner prefixes and normalizes whitespace and case for ID comparisons. */
    const normalizeOwnerId = (value?: string) =>
      (value || '').replace(/^(owner-)+/i, '').trim().toLowerCase();
    const userId = normalizeOwnerId(user.id);
    const ownerIds = [report.ownerId, report.dog?.ownerId].map(normalizeOwnerId).filter(Boolean);
    const userEmail = (user.email || '').trim().toLowerCase();
    const reportEmail = (report.contactMechanism?.safeContactEmail || '').trim().toLowerCase();
    return ownerIds.includes(userId) || Boolean(userEmail && reportEmail && userEmail === reportEmail);
  };

  /** Allows missing-report details for everyone and other report details only for a matching owner. */
  const canViewReportDetails = (report: LostReport) =>
    report.status === 'LOST' || isCurrentUserPetOwner(report);

  /** Hides the category list and opens the selected sighting at the requested photo index. */
  const openSightingDetails = (sighting: Sighting, photoIndex: number = 0) => {
    setStatusPanelOpen(false);
    setDetailSighting(sighting);
    setActiveSightingPhotoIndex(photoIndex);
  };

  /** Checks detail visibility before replacing the category list with the selected pet report. */
  const openPetDetails = (report: LostReport) => {
    if (!canViewReportDetails(report)) {
      showToast('Safe pet details are private to the pet owner.', 'info');
      return;
    }
    setStatusPanelOpen(false);
    setDetailReport(report);
  };

  /** Closes pet details and restores the category list modal. */
  const closePetDetails = () => {
    setDetailReport(null);
    setStatusPanelOpen(true);
  };

  /** Closes sighting details and restores the category list modal. */
  const closeSightingDetails = () => {
    setDetailSighting(null);
    setStatusPanelOpen(true);
  };

  const refreshSightings = () => {
    setSightings(storageService.getAllSightings().filter((sighting) => sighting.isCurrent !== false));
    setReports(storageService.getAllReports());
  };

  const handleDeleteSightingGroup = (sightingIds: string[]) => {
    if (sightingIds.length === 0) return;
    sightingIds.forEach(id => storageService.deleteSightingAsAdmin(id));
    if (detailSighting && sightingIds.includes(detailSighting.id)) setDetailSighting(null);
    refreshSightings();
    window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
    window.dispatchEvent(new Event('storage'));
    showToast(`Deleted ${sightingIds.length > 1 ? `all ${sightingIds.length} sightings` : 'sighting'} for this pet.`, 'success');
  };

  const handleHardResetSightings = () => {
    if (sightings.length === 0) return;
    sightings.forEach((sighting) => storageService.deleteSightingAsAdmin(sighting.id));
    setDetailSighting(null);
    refreshSightings();
    window.dispatchEvent(new CustomEvent('findlostpuppy_reports_updated'));
    window.dispatchEvent(new Event('storage'));
    showToast('All sightings cleared.', 'success');
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
              onClick={() => selectStatusAndScroll('SIGHTINGS')}
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
              onClick={() => selectStatusAndScroll('SAFE')}
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
              onClick={() => selectStatusAndScroll('LOST')}
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

          {selectedStatus && statusPanelOpen && (
            <div className="dashboard-status-modal-backdrop dashboard-list-modal-backdrop" role="presentation">
            <div className="dashboard-status-pets-panel dashboard-status-list-modal" ref={listPanelRef} role="dialog" aria-modal="true">
              <div className="dashboard-status-pets-panel-header">
                <h2>
                  {selectedStatus === 'SIGHTINGS'
                    ? 'Sighted Missing Pets'
                    : selectedStatus === 'SAFE'
                      ? 'Pets at Home'
                      : 'Pets Missing'}
                </h2>
                <span>{selectedStatus === 'SIGHTINGS' ? sightings.length : visiblePets.length} listed</span>
                <button
                  type="button"
                  className="dashboard-status-modal-close dashboard-list-modal-close"
                  onClick={() => setStatusPanelOpen(false)}
                  aria-label="Close pet status list"
                >
                  <X size={22} />
                </button>
              </div>
              {selectedStatus === 'LOST' && (
                <button
                  type="button"
                  className="dashboard-capture-shortcut-btn"
                  onClick={() => navigate('/capture')}
                >
                  <Camera size={16} />
                  <span>Capture Missing Pet Photo</span>
                </button>
              )}
              {selectedStatus === 'SAFE' && (
                <button
                  type="button"
                  className="dashboard-capture-shortcut-btn"
                  onClick={() => navigate('/capture')}
                  style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderColor: '#059669' }}
                >
                  <Camera size={16} />
                  <span>Report Other Pet (Capture Sighting)</span>
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
                    (() => {
                      const groupedSightings = Object.values(sightings.reduce((acc, sighting) => {
                        const reportId = sighting.reportId;
                        if (!acc[reportId]) acc[reportId] = [];
                        acc[reportId].push(sighting);
                        return acc;
                      }, {} as Record<string, Sighting[]>));
                      
                      return groupedSightings.map((group) => {
                        const firstSighting = group[0];
                        const report = getSightingReport(firstSighting);
                        const displayName = firstSighting.dogName || report?.dog?.name || 'Missing Pet';
                        // Original pet photo from the missing dog report
                        const originalPetPhoto = report ? getDogPhotoUrl(report.dog, report) : (firstSighting.photo || firstSighting.photos?.[0] || '');
                        
                        return (
                          <article key={firstSighting.reportId} className={`dashboard-status-pet-row ${isDashboardAdmin ? 'has-admin-action' : ''}`}>
                            <div className="dashboard-status-pet-photo-wrap">
                              <img
                                src={originalPetPhoto}
                                alt={displayName}
                                className="dashboard-status-pet-photo"
                                onError={handleDogImageError}
                              />
                            </div>
                            <div className="dashboard-status-pet-copy">
                              <strong>{displayName}</strong>
                              <span className="dashboard-status-pet-location">
                                <MapPin size={13} />
                                {firstSighting.village || firstSighting.mandal || firstSighting.district || firstSighting.location || 'Location shared'}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="dashboard-status-view-details-btn dashboard-view-sightings-btn"
                              onClick={() => openSightingDetails(firstSighting, 0)}
                            >
                              <Eye size={14} />
                              <span>View sightings ({group.length})</span>
                            </button>
                            {isDashboardAdmin && (
                              <button
                                type="button"
                                className="dashboard-sighting-delete-btn"
                                onClick={() => handleDeleteSightingGroup(group.map(s => s.id))}
                                aria-label="Delete all sightings for this pet"
                                title="Delete all sightings for this pet"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </article>
                        );
                      });
                    })()
                  ) : (
                    <EmptyState
                      icon={<Eye size={30} />}
                      title="No sightings reported yet."
                      message="Open a missing pet alert to report a sighting."
                      action={<button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/find')}>View Missing Pets</button>}
                    />
                  )
                ) : visiblePets.length > 0 ? (
                  visiblePets.map((report) => {
                    const displayName = getDogDisplayName(report.dog, report);
                    const photoUrl = selectedStatus === 'LOST' ? getDogPhotoUrl(report.dog, report) : '';
                    const canViewDetails = canViewReportDetails(report);
                    return (
                      <article
                        key={report.id}
                        className="dashboard-status-pet-row"
                      >
                        {selectedStatus === 'LOST' && (
                          <div className="dashboard-status-pet-photo-wrap">
                            <img
                              src={photoUrl}
                              alt={displayName}
                              className="dashboard-status-pet-photo"
                              onError={handleDogImageError}
                            />
                          </div>
                        )}
                        <div className="dashboard-status-pet-copy">
                          <strong>{displayName}</strong>
                        </div>
                        {canViewDetails ? (
                          <div className="dashboard-status-row-actions">
                          <button
                            type="button"
                            className="dashboard-status-view-details-btn"
                            onClick={() => openPetDetails(report)}
                          >
                            <Eye size={14} />
                            <span>View details</span>
                          </button>
                          </div>
                        ) : (
                          <span className="dashboard-owner-only-label">Owner-only details</span>
                        )}
                      </article>
                    );
                  })
                ) : (
                  <EmptyState
                    icon={selectedStatus === 'SAFE' ? <Home size={30} /> : <AlertTriangle size={30} />}
                    title={selectedStatus === 'SAFE' ? 'No pets added yet.' : 'No missing pet reports right now.'}
                    message={selectedStatus === 'SAFE' ? 'Add your pet profile to keep its details ready.' : 'Create an alert if your registered pet is missing.'}
                    action={
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(selectedStatus === 'SAFE' ? '/pet' : '/report')}
                      >
                        {selectedStatus === 'SAFE' ? 'Add Pet' : 'Create Report'}
                      </button>
                    }
                  />
                )}
              </div>
            </div>
            </div>
          )}
        </section>
      </div>

      {detailReport && canViewReportDetails(detailReport) && (() => {
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
                onClick={closePetDetails}
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
        const petSightings = sightings.filter((item) => item.reportId === detailSighting.reportId);
        
        let allPhotos: string[] = [];
        if (detailSighting.photos && detailSighting.photos.length > 0) {
          allPhotos = detailSighting.photos;
        } else if (detailSighting.photo) {
          allPhotos = [detailSighting.photo];
        }
        
        const photoUrl = resolveGenericMediaUrl(allPhotos[activeSightingPhotoIndex] || allPhotos[0] || '');
        
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
                onClick={closeSightingDetails}
                aria-label="Close sighting details"
              >
                <X size={22} />
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {petSightings.length > 1 && (
                  <div className="dashboard-sighting-tabs" role="tablist" aria-label="Sightings for this pet">
                    {petSightings.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={item.id === detailSighting.id}
                        className={`dashboard-sighting-tab ${item.id === detailSighting.id ? 'active' : ''}`}
                        onClick={() => {
                          setDetailSighting(item);
                          setActiveSightingPhotoIndex(0);
                        }}
                      >
                        Sighting {index + 1}
                      </button>
                    ))}
                  </div>
                )}
                <div className="dashboard-status-popover-photo-stage" style={{ marginBottom: 0 }}>
                  <img
                    src={photoUrl}
                    alt={`${displayName} sighting`}
                    className="dashboard-status-popover-photo"
                    onError={handleDogImageError}
                  />
                </div>
                {allPhotos.length > 1 && (
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {allPhotos.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSightingPhotoIndex(idx)}
                        style={{
                          width: '48px',
                          height: '48px',
                          padding: 0,
                          border: activeSightingPhotoIndex === idx ? '2px solid #F97316' : '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          background: '#000',
                          cursor: 'pointer',
                          opacity: activeSightingPhotoIndex === idx ? 1 : 0.6
                        }}
                      >
                        <img src={resolveGenericMediaUrl(p)} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                )}
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
                    onClick={() => {
                      handleDeleteSightingGroup(petSightings.length > 0 ? petSightings.map((s) => s.id) : [detailSighting.id]);
                    }}
                    title="Delete all sightings for this pet"
                  >
                    <Trash2 size={16} />
                    <span>Delete sightings for this pet</span>
                  </button>
                )}
                {report && (
                  <button
                    type="button"
                    className="dashboard-status-popover-action"
                    onClick={() => {
                      setDetailSighting(null);
                      openPetDetails(report);
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
