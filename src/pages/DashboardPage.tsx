import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  PawPrint,
  AlertTriangle,
  Heart,
  Eye,
  Calendar,
  MapPin,
  Search,
  PlusCircle,
  Clock,
  Sparkles,
  Edit3,
  Share2,
  Trash2,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { SightingModal } from '../components/SightingModal';
import { StatusBadge } from '../components/StatusBadge';
import { ReportModal } from '../components/ReportModal';
import type { LostReport, ReportStatus } from '../types';
import { triggerStarCelebration } from '../utils/confettiHelper';
import { getDogPhotoUrl, getDogDisplayName, handleDogImageError } from '../utils/dogPhotoHelper';

export const DashboardPage: React.FC = () => {
  const { user, setActiveOnboardingTab } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [reports, setReports] = useState<LostReport[]>([]);
  const initialTab = searchParams.get('tab') === 'browse' ? 'browse' : 'missing';
  const [activeTab, setActiveTab] = useState<'missing' | 'reunited' | 'browse' | 'my_pups'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  // Browse All Dogs tab filters
  const [browseStatus, setBrowseStatus] = useState<ReportStatus | 'ALL'>('ALL');
  const [browseBreed, setBrowseBreed] = useState<string>('ALL');
  const [browseLocation, setBrowseLocation] = useState<string>('ALL');
  const [browseSort, setBrowseSort] = useState<'newest' | 'sightings'>('newest');

  // Sighting Modal State
  const [sightingReport, setSightingReport] = useState<LostReport | null>(null);

  // Report Modal State
  const [reportingTarget, setReportingTarget] = useState<LostReport | null>(null);

  const reloadData = () => {
    const all = storageService.getAllReports();
    const blockedIds = storageService.getBlockedUserIds();
    const filtered = all.filter((r) => {
      const cleanOwnerId = r.ownerId ? r.ownerId.replace('owner-', '') : '';
      return !blockedIds.includes(r.ownerId) && !blockedIds.includes(cleanOwnerId);
    });
    setReports(filtered);
  };

  useEffect(() => {
    reloadData();

    const handleReportsUpdate = () => {
      reloadData();
    };

    window.addEventListener('findlostpuppy_reports_updated', handleReportsUpdate);
    window.addEventListener('storage', handleReportsUpdate);

    return () => {
      window.removeEventListener('findlostpuppy_reports_updated', handleReportsUpdate);
      window.removeEventListener('storage', handleReportsUpdate);
    };
  }, []);

  // Filter reports strictly by 3 mutually-exclusive dog states:
  // 1. Missing Dogs (status === 'LOST')
  // 2. Reunited Dogs (status === 'REUNITED')
  const missingDogs = useMemo(() => reports.filter((r) => r.status === 'LOST'), [reports]);
  const reunitedDogs = useMemo(() => reports.filter((r) => r.status === 'REUNITED'), [reports]);

  // Unique breeds and locations for Browse filters
  const availableBreeds = useMemo(() => {
    const breeds = new Set(reports.map((r) => r.dog.breed));
    return Array.from(breeds).sort();
  }, [reports]);

  const availableLocations = useMemo(() => {
    const locs = new Set(
      reports.map((r) => {
        const locStr = r.ownerApproximateLocation || r.lastKnownLocation || '';
        const parts = locStr.split(',');
        return parts[parts.length - 1]?.trim() || locStr;
      })
    );
    return Array.from(locs).filter(Boolean).sort();
  }, [reports]);

  // User's own registered pet & reports
  const myPet = user ? storageService.getPetProfileByUserId(user.id) : null;
  const myProfile = user ? storageService.getOwnerProfileByUserId(user.id) : null;
  const isMyPetSafe = user ? storageService.isPetSafe(user.id) : false;
  const myReports = useMemo(() => {
    if (!user) return [];
    return reports.filter(
      (r) =>
        r.ownerId === `owner-${user.id}` ||
        r.ownerId === user.id ||
        r.contactMechanism?.safeContactEmail === user.email
    );
  }, [reports, user]);

  // Filter list based on search query
  const applySearch = React.useCallback(
    (list: LostReport[]) => {
      if (!searchQuery.trim()) return list;
      const q = searchQuery.toLowerCase();
      return list.filter(
        (r) =>
          r.dog?.name?.toLowerCase().includes(q) ||
          r.dog?.breed?.toLowerCase().includes(q) ||
          (r.ownerApproximateLocation || '').toLowerCase().includes(q) ||
          (r.lastKnownLocation || '').toLowerCase().includes(q) ||
          r.additionalNotes?.toLowerCase().includes(q)
      );
    },
    [searchQuery]
  );

  const displayedMissing = useMemo(() => applySearch(missingDogs), [missingDogs, applySearch]);
  const displayedReunited = useMemo(() => applySearch(reunitedDogs), [reunitedDogs, applySearch]);

  // Filter for Browse All Dogs tab
  const displayedBrowse = useMemo(() => {
    return reports
      .filter((r) => {
        if (browseStatus !== 'ALL' && r.status !== browseStatus) return false;
        if (browseBreed !== 'ALL' && r.dog?.breed !== browseBreed) return false;
        if (
          browseLocation !== 'ALL' &&
          !(r.ownerApproximateLocation || '').toLowerCase().includes(browseLocation.toLowerCase())
        ) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = (r.dog?.name || '').toLowerCase().includes(q);
          const matchBreed = (r.dog?.breed || '').toLowerCase().includes(q);
          const matchColor = (r.dog?.color || '').toLowerCase().includes(q);
          const matchLoc = (r.ownerApproximateLocation || '').toLowerCase().includes(q) || (r.lastKnownLocation || '').toLowerCase().includes(q);
          const matchMarks = r.dog?.distinguishingMarks?.toLowerCase().includes(q) || false;
          const matchNotes = r.additionalNotes?.toLowerCase().includes(q) || false;
          if (!matchName && !matchBreed && !matchColor && !matchLoc && !matchMarks && !matchNotes) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (browseSort === 'sightings') {
          return (b.sightingCount || 0) - (a.sightingCount || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [reports, browseStatus, browseBreed, browseLocation, searchQuery, browseSort]);

  // Action: Atomically change report status with mutual exclusivity
  const handleStatusChange = (reportId: string, newStatus: ReportStatus) => {
    storageService.updateReportStatus(reportId, newStatus);
    if (newStatus === 'REUNITED') {
      triggerStarCelebration();
      showToast('🎉 Wonderful news! Pup marked as safely REUNITED! ❤️', 'success');
    } else if (newStatus === 'LOST') {
      showToast('🚨 Alert marked as actively MISSING.', 'info');
    } else {
      showToast(`Report status updated to ${newStatus}`, 'info');
    }
    reloadData();
  };

  // Action: Delete / Remove Report permanently
  const handleDeleteReport = (reportId: string, dogName?: string) => {
    const confirmed = window.confirm(`Are you sure you want to remove the alert for "${dogName || 'this dog'}"?`);
    if (!confirmed) return;

    const success = storageService.deleteReport(reportId);
    if (success) {
      showToast(`🗑️ Alert for ${dogName || 'dog'} removed successfully.`, 'info');
      reloadData();
    }
  };

  return (
    <div className="dashboard-page">
      {/* Dashboard Top Banner */}
      <div className="dashboard-header-banner">
        <div className="app-container">
          <div className="dashboard-header-flex">
            <div className="dashboard-user-greeting">
              <div className="user-avatar-large">
                <PawPrint size={28} />
              </div>
              <div>
                <h1 className="dashboard-title">Community Pet Recovery Dashboard</h1>
                <p className="dashboard-subtitle">
                  Real-time network for missing dogs, confirmed sightings, browse directory, and heartwarming reunions.
                </p>
              </div>
            </div>

            <div className="dashboard-header-actions">
              <button
                type="button"
                onClick={() => {
                  setActiveOnboardingTab('report');
                  navigate('/alert');
                }}
                className="btn btn-primary"
              >
                <PlusCircle size={18} />
                <span>Pet Safety Alert Check</span>
              </button>
            </div>
          </div>

          {/* Metrics Overview Bar */}
          <div className="dashboard-metrics-grid">
            <div
              className={`metric-box ${activeTab === 'missing' ? 'active-metric' : ''}`}
              onClick={() => setActiveTab('missing')}
              role="button"
              tabIndex={0}
            >
              <span className="metric-number text-red-600">{missingDogs.length}</span>
              <span className="metric-label">🚨 Missing Dogs</span>
            </div>
            <div
              className={`metric-box ${activeTab === 'reunited' ? 'active-metric' : ''}`}
              onClick={() => setActiveTab('reunited')}
              role="button"
              tabIndex={0}
            >
              <span className="metric-number text-emerald-600">{reunitedDogs.length}</span>
              <span className="metric-label">🎉 Returned Home ❤️</span>
            </div>
            <div
              className={`metric-box ${activeTab === 'browse' ? 'active-metric' : ''}`}
              onClick={() => setActiveTab('browse')}
              role="button"
              tabIndex={0}
            >
              <span className="metric-number text-amber-600">{reports.length}</span>
              <span className="metric-label">🔍 Browse All Dogs</span>
            </div>
            <div
              className={`metric-box ${activeTab === 'my_pups' ? 'active-metric' : ''}`}
              onClick={() => setActiveTab('my_pups')}
              role="button"
              tabIndex={0}
            >
              <span className="metric-number text-indigo-600">
                {myPet ? myPet.name : myReports.length}
              </span>
              <span className="metric-label">🐾 My Registered Pup</span>
            </div>
          </div>
        </div>
      </div>

      <div className="app-container dashboard-main-content">
        {/* Navigation Tabs Header */}
        <div className="dashboard-tabs-container">
          <div className="dashboard-tabs" role="tablist">
            {/* TAB 1: MISSING DOGS */}
            <button
              className={`dashboard-tab-btn ${activeTab === 'missing' ? 'active' : ''}`}
              onClick={() => setActiveTab('missing')}
              role="tab"
              aria-selected={activeTab === 'missing'}
            >
              <AlertTriangle size={18} className="text-red-500" />
              <span>Missing Dogs</span>
              <span className="tab-counter-pill red-pill">{missingDogs.length}</span>
            </button>

            {/* TAB 2: RETURNED / REUNITED */}
            <button
              className={`dashboard-tab-btn ${activeTab === 'reunited' ? 'active' : ''}`}
              onClick={() => setActiveTab('reunited')}
              role="tab"
              aria-selected={activeTab === 'reunited'}
            >
              <Heart size={18} className="text-emerald-500" />
              <span>Returned & Reunited</span>
              <span className="tab-counter-pill green-pill">{reunitedDogs.length}</span>
            </button>

            {/* TAB 3: BROWSE ALL COMMUNITY DOGS */}
            <button
              className={`dashboard-tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
              onClick={() => setActiveTab('browse')}
              role="tab"
              aria-selected={activeTab === 'browse'}
            >
              <Search size={18} className="text-amber-500" />
              <span>Browse Dogs</span>
              <span className="tab-counter-pill amber-pill">{reports.length}</span>
            </button>

            {/* TAB 4: MY PUPS & REPORTS */}
            <button
              className={`dashboard-tab-btn ${activeTab === 'my_pups' ? 'active' : ''}`}
              onClick={() => setActiveTab('my_pups')}
              role="tab"
              aria-selected={activeTab === 'my_pups'}
            >
              <PawPrint size={18} className="text-indigo-500" />
              <span>My Pup & Alerts</span>
              {myPet && <span className="tab-counter-pill purple-pill">{myPet.name}</span>}
            </button>
          </div>

          {/* Quick Search Bar */}
          {activeTab !== 'my_pups' && (
            <div className="dashboard-search-wrap">
              <div className="search-input-box">
                <Search size={16} className="search-box-icon" />
                <input
                  type="text"
                  placeholder={`Search by dog name, breed, or location...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="dashboard-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="search-clear-btn"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1 CONTENT: MISSING DOG PROFILES */}
        {/* ========================================================================= */}
        {activeTab === 'missing' && (
          <div className="dashboard-tab-pane">
            <div className="tab-header-strip">
              <div>
                <h2 className="tab-section-title">🚨 Active Missing Dog Searches</h2>
                <p className="tab-section-desc">
                  These dogs are currently lost. Please check photos, markings, and report sightings immediately if spotted.
                </p>
              </div>
              <span className="results-count-badge">
                Showing {displayedMissing.length} of {missingDogs.length} missing pups
              </span>
            </div>

            {displayedMissing.length === 0 ? (
              <div className="empty-state-card card cozy-empty-state">
                <div className="cozy-empty-icon-circle">
                  <span style={{ fontSize: '2.5rem' }}>🏡</span>
                </div>
                <h3>All Furry Friends Are Safe at Home! 💚</h3>
                <p>
                  {searchQuery
                    ? `No missing dogs match "${searchQuery}". Try searching with a different name or area.`
                    : 'Great news! There are currently no active missing dog reports in your community. Every puppy is safe with family!'}
                </p>
                <div style={{ marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveOnboardingTab('report');
                      navigate('/alert');
                    }}
                    className="btn btn-outline btn-sm"
                  >
                    <span>Check or Update Pet Safety Status 🐾</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="dog-profiles-grid">
                {displayedMissing.map((report) => (
                  <div key={report.id} className="dog-profile-dashboard-card card">
                    <div className="dog-profile-photo-container">
                      <img
                        src={getDogPhotoUrl(report.dog, report)}
                        alt={getDogDisplayName(report.dog, report)}
                        className="dog-profile-photo"
                        onError={handleDogImageError}
                      />
                      <div className="dog-profile-floating-badge">
                        <StatusBadge status="LOST" size="sm" />
                      </div>
                      {report.sightingCount > 0 && (
                        <div className="sighting-count-tag">
                          <Eye size={12} />
                          <span>{report.sightingCount} Sightings Reported</span>
                        </div>
                      )}
                    </div>

                    <div className="dog-profile-content">
                      <div className="dog-name-row">
                        <h3 className="dog-card-name">{getDogDisplayName(report.dog, report)}</h3>
                        <span className="dog-id-code">#{report.id.split('-').pop()}</span>
                      </div>

                      <div className="dog-meta-tags">
                        <span className="meta-tag">🐕 {report.dog.breed}</span>
                        <span className="meta-tag">
                          {report.dog.gender === 'Male' ? '♂ Male' : '♀ Female'}
                        </span>
                        <span className="meta-tag">🎂 {report.dog.age}</span>
                      </div>

                      <div className="dog-incident-details">
                        <div className="incident-line">
                          <MapPin size={14} className="incident-icon text-terracotta" />
                          <span>
                            <strong>Last Seen:</strong> {report.lastKnownLocation} ({report.ownerApproximateLocation})
                          </span>
                        </div>

                        <div className="incident-line">
                          <Clock size={14} className="incident-icon text-terracotta" />
                          <span>
                            <strong>Lost On:</strong> {report.dateLost} • {report.timeLost}
                          </span>
                        </div>

                        {report.dog.distinguishingMarks && (
                          <div className="incident-line">
                            <Sparkles size={14} className="incident-icon text-amber-500" />
                            <span>
                              <strong>Traits:</strong> {report.dog.distinguishingMarks}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="dog-card-actions">
                        <button
                          type="button"
                          onClick={() => setSightingReport(report)}
                          className="btn btn-secondary btn-sm sighting-trigger-btn"
                        >
                          <Eye size={15} />
                          <span>Report Sighting</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(report.id, 'REUNITED')}
                          className="btn btn-sm"
                          style={{
                            backgroundColor: '#ECFDF5',
                            color: '#059669',
                            borderColor: '#A7F3D0',
                            fontWeight: 700,
                          }}
                          title="Mark Pup Reunited & Safe"
                        >
                          <Check size={14} />
                          <span>Reunited ❤️</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const sightingUrl = `${window.location.origin}/report-sighting/${report.id}`;
                            const msg = `🚨 *EMERGENCY LOST PUPPY ALERT* 🐾\n\nPlease help find *"${report.dog.name}"* (${report.dog.breed})!\n📍 *Last seen:* ${report.lastKnownLocation}.\n\n🐾 *Sighted or found this dog?* Report location & photos (*No login required!*):\n👉 ${sightingUrl}\n\nFindLostPuppy Network 🐕❤️`;
                            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          className="btn btn-whatsapp btn-sm"
                          style={{
                            backgroundColor: '#25D366',
                            color: '#FFFFFF',
                            borderColor: '#25D366',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontWeight: 700,
                          }}
                          title="Share Alert on WhatsApp"
                        >
                          <Share2 size={13} />
                          <span>WhatsApp</span>
                        </button>

                        <Link to={`/dog/${report.id}`} className="btn btn-outline btn-sm">
                          <span>Flyer →</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDeleteReport(report.id, getDogDisplayName(report.dog, report))}
                          className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                          title="Remove this alert"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2 CONTENT: RETURNED & REUNITED DOG PROFILES */}
        {/* ========================================================================= */}
        {activeTab === 'reunited' && (
          <div className="dashboard-tab-pane">
            <div className="tab-header-strip">
              <div>
                <h2 className="tab-section-title text-emerald-700">🎉 Safely Returned Pups</h2>
                <p className="tab-section-desc">
                  Heartwarming reunions! These dogs have been successfully recovered and are back home safe with their families.
                </p>
              </div>
              <span className="results-count-badge green-badge">
                {displayedReunited.length} Happy Reunions ❤️
              </span>
            </div>

            {displayedReunited.length === 0 ? (
              <div className="empty-state-card card">
                <Heart size={44} className="empty-icon text-emerald-500" />
                <h3>No Reunited Dogs Found</h3>
                <p>
                  {searchQuery
                    ? `No reunited dogs match "${searchQuery}".`
                    : 'Reunited dogs will appear here as neighbors help bring lost pups home.'}
                </p>
              </div>
            ) : (
              <div className="dog-profiles-grid">
                {displayedReunited.map((report) => (
                  <div key={report.id} className="dog-profile-dashboard-card card reunited-card">
                    <div className="dog-profile-photo-container">
                      <img
                        src={getDogPhotoUrl(report.dog, report)}
                        alt={getDogDisplayName(report.dog, report)}
                        className="dog-profile-photo"
                        onError={handleDogImageError}
                      />
                      <div className="dog-profile-floating-badge">
                        <span className="reunited-celebration-pill">
                          <Heart size={12} />
                          <span>SAFE AT HOME ❤️</span>
                        </span>
                      </div>
                    </div>

                    <div className="dog-profile-content">
                      <div className="dog-name-row">
                        <h3 className="dog-card-name">{getDogDisplayName(report.dog, report)}</h3>
                        <span className="reunion-badge">Reunited</span>
                      </div>

                      <div className="dog-meta-tags">
                        <span className="meta-tag">🐕 {report.dog.breed}</span>
                        <span className="meta-tag">{report.ownerApproximateLocation}</span>
                      </div>

                      <div className="reunion-story-box">
                        <Heart size={14} className="text-emerald-600 flex-shrink-0 mt-1" />
                        <p className="reunion-story-text">
                          {report.additionalNotes || 'Safely reunited with loving family through neighborhood community support!'}
                        </p>
                      </div>

                      <div className="dog-card-actions">
                        <Link to={`/dog/${report.id}`} className="btn btn-outline btn-sm">
                          <span>View Reunion Details ❤️</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(report.id, 'LOST')}
                          className="btn btn-ghost btn-sm text-amber-600"
                          title="Re-open missing search if needed"
                        >
                          <span>Re-open Search 🚨</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteReport(report.id, getDogDisplayName(report.dog, report))}
                          className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                          title="Remove this report"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3 CONTENT: BROWSE ALL COMMUNITY DOGS */}
        {/* ========================================================================= */}
        {activeTab === 'browse' && (
          <div className="dashboard-tab-pane">
            <div className="tab-header-strip">
              <div>
                <h2 className="tab-section-title text-amber-700">🔍 Browse Community Dogs Directory</h2>
                <p className="tab-section-desc">
                  Filter by status, breed, or locality to quickly identify pets and match sightings across neighborhoods.
                </p>
              </div>
              <span className="results-count-badge amber-badge">
                Showing {displayedBrowse.length} of {reports.length} community dogs
              </span>
            </div>

            {/* Filter controls row */}
            <div className="discovery-controls card" style={{ marginBottom: '1.5rem' }}>
              <div className="filters-row">
                {/* Status Filter */}
                <div className="filter-select-group">
                  <label className="filter-label" htmlFor="browse-status">Status:</label>
                  <select
                    id="browse-status"
                    className="form-select filter-select cute-select"
                    value={browseStatus}
                    onChange={(e) => setBrowseStatus(e.target.value as any)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="LOST">🚨 Missing (Lost)</option>
                    <option value="REUNITED">🎉 Reunited ❤️</option>
                  </select>
                </div>

                {/* Breed Filter */}
                <div className="filter-select-group">
                  <label className="filter-label" htmlFor="browse-breed">Breed:</label>
                  <select
                    id="browse-breed"
                    className="form-select filter-select cute-select"
                    value={browseBreed}
                    onChange={(e) => setBrowseBreed(e.target.value)}
                  >
                    <option value="ALL">All Breeds</option>
                    {availableBreeds.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div className="filter-select-group">
                  <label className="filter-label" htmlFor="browse-loc">Location:</label>
                  <select
                    id="browse-loc"
                    className="form-select filter-select cute-select"
                    value={browseLocation}
                    onChange={(e) => setBrowseLocation(e.target.value)}
                  >
                    <option value="ALL">All Locations</option>
                    {availableLocations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Filter */}
                <div className="filter-select-group">
                  <label className="filter-label" htmlFor="browse-sort">Sort:</label>
                  <select
                    id="browse-sort"
                    className="form-select filter-select cute-select"
                    value={browseSort}
                    onChange={(e) => setBrowseSort(e.target.value as any)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="sightings">Most Sightings</option>
                  </select>
                </div>

                {(browseStatus !== 'ALL' || browseBreed !== 'ALL' || browseLocation !== 'ALL' || searchQuery) && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setBrowseStatus('ALL');
                      setBrowseBreed('ALL');
                      setBrowseLocation('ALL');
                      setSearchQuery('');
                    }}
                    style={{ alignSelf: 'flex-end', marginBottom: '0.25rem' }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {displayedBrowse.length === 0 ? (
              <div className="empty-state-card card">
                <Search size={44} className="empty-icon text-amber-500" />
                <h3>No Dogs Found</h3>
                <p>
                  No community dogs match your current search and filter criteria. Try adjusting or clearing filters above.
                </p>
              </div>
            ) : (
              <div className="dog-profiles-grid">
                {displayedBrowse.map((report) => (
                  <div key={report.id} className="dog-profile-dashboard-card card">
                    <div className="dog-profile-photo-container">
                      <img
                        src={getDogPhotoUrl(report.dog, report)}
                        alt={getDogDisplayName(report.dog, report)}
                        className="dog-profile-photo"
                        onError={handleDogImageError}
                      />
                      <div className="dog-profile-floating-badge">
                        <StatusBadge status={report.status} size="sm" />
                      </div>
                      {report.sightingCount > 0 && report.status !== 'REUNITED' && (
                        <div className="sighting-count-tag">
                          <Eye size={12} />
                          <span>{report.sightingCount} sighting{report.sightingCount > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    <div className="dog-profile-content">
                      <div className="dog-name-row">
                        <h3 className="dog-card-name">{getDogDisplayName(report.dog, report)}</h3>
                        <span className="dog-id-code">#{report.id.split('-').pop()}</span>
                      </div>

                      <div className="dog-meta-tags">
                        <span className="meta-tag">🐕 {report.dog.breed}</span>
                        <span className="meta-tag">{report.dog.gender}</span>
                        <span className="meta-tag">{report.dog.color}</span>
                      </div>

                      <div className="dog-area-snippet">
                        <MapPin size={14} className="text-terracotta flex-shrink-0" />
                        <span>{report.ownerApproximateLocation || report.lastKnownLocation}</span>
                      </div>

                      <div className="dog-card-actions">
                        {report.status !== 'REUNITED' && (
                          <button
                            type="button"
                            onClick={() => setSightingReport(report)}
                            className="btn btn-secondary btn-sm sighting-trigger-btn"
                          >
                            <Eye size={15} />
                            <span>I Spotted This Dog</span>
                          </button>
                        )}

                        {report.status === 'LOST' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(report.id, 'REUNITED')}
                            className="btn btn-sm"
                            style={{
                              backgroundColor: '#ECFDF5',
                              color: '#059669',
                              borderColor: '#A7F3D0',
                              fontWeight: 700,
                            }}
                            title="Mark Reunited ❤️"
                          >
                            <Check size={14} />
                            <span>Reunited ❤️</span>
                          </button>
                        )}

                        <Link to={`/dog/${report.id}`} className="btn btn-outline btn-sm">
                          <span>View Details →</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDeleteReport(report.id, getDogDisplayName(report.dog, report))}
                          className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                          title="Remove this listing"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4 CONTENT: MY PUPS & REPORTS */}
        {/* ========================================================================= */}
        {activeTab === 'my_pups' && (
          <div className="dashboard-tab-pane">
            <div className="tab-header-strip">
              <div>
                <h2 className="tab-section-title">🐾 My Pet Profile & Safety Overview</h2>
                <p className="tab-section-desc">
                  Your registered pet, home location, and current alert status.
                </p>
              </div>
            </div>

            {/* User Pet Profile Card */}
            {myPet ? (
              <div className="my-pet-dashboard-card card">
                <div className="my-pet-card-grid">
                  <div className="my-pet-photo-frame">
                    <img
                      src={getDogPhotoUrl(myPet)}
                      alt={getDogDisplayName(myPet)}
                      className="my-pet-photo"
                      onError={handleDogImageError}
                    />
                  </div>

                  <div className="my-pet-info">
                    <div className="my-pet-header-row">
                      <div>
                        <h2 className="my-pet-name">{getDogDisplayName(myPet)}</h2>
                        <span className="my-pet-breed-tag">🐕 {myPet.breed} • {myPet.gender}</span>
                      </div>

                      <div className="my-pet-status-pill">
                        {isMyPetSafe ? (
                          <span className="safe-pill-tag">
                            <Heart size={13} />
                            <span>Safe at Home 🏠</span>
                          </span>
                        ) : myReports.length > 0 ? (
                          <span className="missing-pill-tag">
                            <AlertTriangle size={13} />
                            <span>Active Alert 🚨</span>
                          </span>
                        ) : (
                          <span className="safe-pill-tag">
                            <Heart size={13} />
                            <span>Safe at Home 🏠</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="my-pet-details-chips">
                      <span className="chip">🎂 {myPet.age || '2 years'}</span>
                      <span className="chip">📏 {myPet.size}</span>
                      {myPet.color && <span className="chip">🎨 {myPet.color}</span>}
                      {myPet.collarInfo && <span className="chip">🏷️ {myPet.collarInfo}</span>}
                    </div>

                    <div className="my-pet-actions-row">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveOnboardingTab('dog');
                          navigate('/pet');
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        <Edit3 size={14} />
                        <span>Edit Pet Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveOnboardingTab('report');
                          navigate('/alert');
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        <AlertTriangle size={14} />
                        <span>Manage Safety Alert</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : !user ? (
              <div className="empty-state-card card">
                <PawPrint size={40} className="empty-icon text-indigo-500" />
                <h3>Welcome, Neighbor! 🐾</h3>
                <p>
                  You are viewing real-time community recovery alerts across your area. Sign in or create a profile to register your own puppy and broadcast instant alerts.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
                  <Link to="/" className="btn btn-primary btn-md">
                    <PlusCircle size={16} />
                    <span>Sign In / Register Pet</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="empty-state-card card">
                <PawPrint size={40} className="empty-icon text-indigo-500" />
                <h3>No Pet Registered Yet</h3>
                <p>Register your pet’s details so neighbors can recognize them if they ever wander.</p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveOnboardingTab('dog');
                    navigate('/pet');
                  }}
                  className="btn btn-primary btn-md"
                >
                  <PlusCircle size={16} />
                  <span>Add Pet Profile Now</span>
                </button>
              </div>
            )}

            {/* My Filed Reports Section */}
            {myReports.length > 0 && (
              <div className="my-reports-section mt-6">
                <h3 className="section-title-sm mb-3">📢 My Broadcasted Alerts</h3>
                <div className="owner-reports-list">
                  {myReports.map((report) => (
                    <div key={report.id} className="owner-report-card card">
                      <div className="report-card-media">
                        <img
                          src={getDogPhotoUrl(report.dog, report)}
                          alt={getDogDisplayName(report.dog, report)}
                          onError={handleDogImageError}
                        />
                      </div>

                      <div className="report-card-info">
                        <div className="report-card-top-row">
                          <div>
                            <div className="report-id-pill">{report.id}</div>
                            <h3 className="report-pup-name">{getDogDisplayName(report.dog, report)}</h3>
                            <span className="report-pup-breed">
                              {report.dog?.breed || 'Companion Pet'} • {report.dog?.gender || 'Male'}
                            </span>
                          </div>
                          <StatusBadge status={report.status} size="md" />
                        </div>

                        <div className="report-card-meta">
                          <div className="meta-line">
                            <MapPin size={15} />
                            <span>Last seen: {report.lastKnownLocation}</span>
                          </div>
                          <div className="meta-line">
                            <Calendar size={15} />
                            <span>Lost on: {report.dateLost} at {report.timeLost}</span>
                          </div>
                        </div>

                        {/* Status Management Actions */}
                        <div className="report-card-actions-bar">
                          <div className="status-toggle-wrapper">
                            <span className="toggle-label">Change Status:</span>
                            <select
                              className="form-select status-select-dropdown"
                              value={report.status}
                              onChange={(e) =>
                                handleStatusChange(report.id, e.target.value as ReportStatus)
                              }
                            >
                              <option value="LOST">🔴 MISSING (Active Alert)</option>
                              <option value="REUNITED">🟢 REUNITED (Home Safe!)</option>
                              <option value="CLOSED">⚪ CLOSED</option>
                            </select>
                          </div>

                          <div className="button-group-actions">
                            <Link to={`/dog/${report.id}`} className="btn btn-outline btn-sm">
                              <Eye size={15} />
                              <span>View Public Page</span>
                            </Link>

                            {report.status !== 'REUNITED' && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm reunite-btn"
                                onClick={() => handleStatusChange(report.id, 'REUNITED')}
                              >
                                <Heart size={15} />
                                <span>Mark Reunited ❤️</span>
                              </button>
                            )}

                            <button
                              type="button"
                              className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteReport(report.id, getDogDisplayName(report.dog, report))}
                              title="Delete this alert"
                            >
                              <Trash2 size={15} />
                              <span>Remove Alert</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Owner Location & Contact Card */}
            {myProfile && (
              <div className="profile-display-card card mt-6">
                <h3 className="profile-heading">Pet Parent Contact Profile</h3>
                <div className="profile-info-grid">
                  <div className="info-item">
                    <span className="info-label">Full Name</span>
                    <span className="info-value">{myProfile.fullName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Phone</span>
                    <span className="info-value">{myProfile.phone}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Preferred Contact</span>
                    <span className="info-value">{myProfile.preferredContact}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Approximate Area</span>
                    <span className="info-value">
                      {myProfile.approximateArea || `${myProfile.city}, ${myProfile.state}`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sighting Modal */}
      {sightingReport && (
        <SightingModal
          isOpen={!!sightingReport}
          onClose={() => setSightingReport(null)}
          reportId={sightingReport.id}
          dogName={sightingReport.dog.name}
          onSightingAdded={() => {
            setSightingReport(null);
            reloadData();
            showToast('🐾 Community sighting submitted! Thank you for helping!', 'success');
          }}
        />
      )}

      {/* Report Modal */}
      {reportingTarget && (
        <ReportModal
          isOpen={!!reportingTarget}
          onClose={() => setReportingTarget(null)}
          type="listing"
          targetId={reportingTarget.id}
          targetTitle={reportingTarget.dog.name}
          targetUserId={reportingTarget.ownerId}
          onSuccess={() => {
            showToast('Report submitted for moderation review.', 'success');
          }}
        />
      )}
    </div>
  );
};
