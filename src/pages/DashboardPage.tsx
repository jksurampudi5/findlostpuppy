import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  PawPrint,
  AlertTriangle,
  Heart,
  Eye,
  MapPin,
  Search,
  PlusCircle,
  Clock,
  Sparkles,
  Share2,
  Trash2,
  Check,
  Phone,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { SightingModal } from '../components/SightingModal';
import { StatusBadge } from '../components/StatusBadge';
import { ReportModal } from '../components/ReportModal';
import { DogAwayFromHomeAnimation } from '../components/DogAwayFromHomeAnimation';
import { DogGoingHomeAnimation } from '../components/DogGoingHomeAnimation';
import type { LostReport, ReportStatus } from '../types';
import { triggerStarCelebration } from '../utils/confettiHelper';
import { getDogPhotoUrl, getDogDisplayName, handleDogImageError } from '../utils/dogPhotoHelper';
import { generateWhatsAppSosMessage } from '../utils/shareHelper';
import { maskPhoneNumber, maskEmail, isOwnerOfReport } from '../utils/privacyUtils';

export const DashboardPage: React.FC = () => {
  const { user, setActiveOnboardingTab, petSafetyStatus, refreshProgress } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState<LostReport[]>([]);
  const initialTab = searchParams.get('tab') === 'safe' ? 'safe' : 'missing';
  const [activeTab, setActiveTab] = useState<'missing' | 'safe'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

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

    // Enforce strictly 1 dog reflected per owner profile
    const seenOwnerIds = new Set<string>();
    const seenEmails = new Set<string>();
    const seenDogIds = new Set<string>();
    const deduplicatedByOwner: LostReport[] = [];

    for (const report of filtered) {
      const ownerEmail = (report.contactMechanism?.safeContactEmail || '').toLowerCase().trim();
      const rawOwnerId = (report.ownerId || '').replace(/^owner-/, '').toLowerCase().trim();
      const dogId = (report.dogId || report.dog?.id || '').toLowerCase().trim();

      const matchesOwnerId = Boolean(rawOwnerId && rawOwnerId !== 'unknown-owner' && seenOwnerIds.has(rawOwnerId));
      const matchesEmail = Boolean(ownerEmail && ownerEmail.includes('@') && seenEmails.has(ownerEmail));
      const matchesDogId = Boolean(dogId && seenDogIds.has(dogId));

      if (matchesOwnerId || matchesEmail || matchesDogId) {
        continue;
      }

      if (rawOwnerId && rawOwnerId !== 'unknown-owner') seenOwnerIds.add(rawOwnerId);
      if (ownerEmail && ownerEmail.includes('@')) seenEmails.add(ownerEmail);
      if (dogId) seenDogIds.add(dogId);
      deduplicatedByOwner.push(report);
    }

    setReports(deduplicatedByOwner);
  };

  useEffect(() => {
    reloadData();

    // Pull directly from Supabase to guarantee single source of truth across localhost, GitHub deployment, and real Android app
    storageService.pullFromSupabase().then(() => {
      reloadData();
    }).catch(() => {});

    const handleReportsUpdate = () => {
      reloadData();
    };

    window.addEventListener('findlostpuppy_reports_updated', handleReportsUpdate);
    window.addEventListener('findlostpuppy_data_synced', handleReportsUpdate);
    window.addEventListener('storage', handleReportsUpdate);

    return () => {
      window.removeEventListener('findlostpuppy_reports_updated', handleReportsUpdate);
      window.removeEventListener('findlostpuppy_data_synced', handleReportsUpdate);
      window.removeEventListener('storage', handleReportsUpdate);
    };
  }, []);

  // Filter reports strictly by 2 mutually-exclusive dog states:
  // 1. Missing Dogs (status === 'LOST')
  // 2. Safe at Home Dogs (status === 'SAFE' or legacy 'REUNITED')
  const missingDogs = useMemo(() => reports.filter((r) => r.status === 'LOST'), [reports]);
  const safeDogs = useMemo(
    () => reports.filter((r) => r.status === 'SAFE' || r.status === 'REUNITED'),
    [reports]
  );

  // User's own registered pet & reports
  const myPet = user ? storageService.getPetProfileByUserId(user.id, user.email) : null;
  const myProfile = user ? storageService.getOwnerProfileByUserId(user.id, user.email) : null;
  const myReports = useMemo(() => {
    if (!user) return [];
    return reports.filter(
      (r) =>
        r.ownerId === `owner-${user.id}` ||
        r.ownerId === user.id ||
        r.contactMechanism?.safeContactEmail === user.email
    );
  }, [reports, user]);

  // Derive the animation dog name from the most specific available source
  const myActiveLostReport = myReports.find(r => r.status === 'LOST');
  const animationDogName =
    myPet?.name ||
    myActiveLostReport?.dog?.name ||
    myReports[0]?.dog?.name ||
    'Bruno';
  const animationLocation =
    myProfile?.city || myProfile?.district ||
    myActiveLostReport?.ownerApproximateLocation ||
    'Local Area';

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
  const displayedSafe = useMemo(() => applySearch(safeDogs), [safeDogs, applySearch]);

  // Action: Atomically change report status with mutual exclusivity
  const handleStatusChange = (reportId: string, newStatus: ReportStatus) => {
    storageService.updateReportStatus(reportId, newStatus);
    if (newStatus === 'SAFE' || newStatus === 'REUNITED') {
      triggerStarCelebration();
      showToast('🏡 Wonderful! Pup marked as Safe at Home! ❤️', 'success');
    } else if (newStatus === 'LOST') {
      showToast('🚨 Alert marked as actively MISSING.', 'info');
    } else {
      showToast(`Report status updated to ${newStatus}`, 'info');
    }
    reloadData();
  };

  // Action: Delete / Remove Report permanently with instantaneous UI reactivity
  const handleDeleteReport = (reportId: string, dogName?: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the listing for "${dogName || 'this dog'}"? This will remove all pet data forever from the dashboard and database.`
    );
    if (!confirmed) return;

    // Instant optimistic state update across all tabs
    const targetClean = reportId.replace(/^LOST-/i, '').toLowerCase();
    const targetCanon = reportId.toLowerCase().startsWith('lost-')
      ? reportId.toLowerCase()
      : `lost-${reportId.toLowerCase()}`;

    setReports((prev) =>
      prev.filter((r) => {
        const rLower = r.id.toLowerCase();
        const rClean = rLower.replace(/^lost-/, '');
        const rCanon = rLower.startsWith('lost-') ? rLower : `lost-${rLower}`;
        return (
          r.id !== reportId &&
          rLower !== reportId.toLowerCase() &&
          rClean !== targetClean &&
          rCanon !== targetCanon
        );
      })
    );

    const success = storageService.deleteReport(reportId);
    if (success) {
      refreshProgress();
      showToast(`🗑️ Listing for ${dogName || 'dog'} permanently deleted forever.`, 'info');
      reloadData();
    }
  };

  // Compute the logged-in owner's missing dog name for the banner
  const userReport = user ? storageService.getLatestReportByUserId(user.id, user.email) : null;
  const effectiveSafetyStatus: 'SAFE' | 'LOST' | 'UNDECIDED' = (() => {
    if (petSafetyStatus === 'LOST' || userReport?.status === 'LOST') return 'LOST';
    if (petSafetyStatus === 'SAFE' || userReport?.status === 'SAFE' || (userReport?.status as any) === 'REUNITED') return 'SAFE';
    if (user && storageService.isPetSafe(user.id, user.email)) return 'SAFE';
    return 'UNDECIDED';
  })();

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
                  Real-time network for missing dogs, confirmed sightings, browse directory, and pets safe at home.
                </p>
              </div>
            </div>

            <div className="dashboard-header-actions dashboard-header-actions-row">
              <button
                type="button"
                onClick={() => {
                  setActiveOnboardingTab('report');
                  navigate('/alert');
                }}
                className="btn btn-primary header-action-btn"
              >
                <PlusCircle size={17} />
                <span>Pet Safety Alert Check</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/find')}
                className="btn btn-outline header-action-btn"
              >
                <Search size={17} />
                <span>Search Community Dogs</span>
              </button>
            </div>
          </div>

          {/* Real Dynamic Pet Status Animation — ACID compliant: driven by petSafetyStatus from AuthContext */}
          <div className="dashboard-hero-animation-wrap" style={{ marginTop: '1.25rem', marginBottom: '1.5rem' }}>
            {effectiveSafetyStatus === 'LOST' ? (
              /* 🚨 Pet is MISSING — show the dusk away-from-home search animation */
              <DogAwayFromHomeAnimation
                dogName={animationDogName}
                lastSeenArea={animationLocation}
              />
            ) : effectiveSafetyStatus === 'SAFE' ? (
              /* 🏡 Pet is SAFE — show the reunion going-home animation */
              <DogGoingHomeAnimation dogName={animationDogName} />
            ) : (
              /* UNDECIDED / community default — show Bruno's reunion story */
              <DogGoingHomeAnimation dogName="Bruno" />
            )}
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
              <span className="metric-label">
                <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                Not Safe (Missing Dogs)
              </span>
            </div>
            <div
              className={`metric-box ${activeTab === 'safe' ? 'active-metric' : ''}`}
              onClick={() => setActiveTab('safe')}
              role="button"
              tabIndex={0}
            >
              <span className="metric-number text-emerald-600">{safeDogs.length}</span>
              <span className="metric-label">
                <ShieldCheck size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                Safe (Safe at Home)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="app-container dashboard-main-content">
        {/* Navigation Tabs Header — Exactly 2 Prominent Tabs: Not Safe & Safe */}
        <div className="dashboard-tabs-container">
          <div className="dashboard-tabs" role="tablist">
            {/* TAB 1: NOT SAFE (MISSING DOGS) */}
            <button
              className={`dashboard-tab-btn tab-not-safe ${activeTab === 'missing' ? 'active' : ''}`}
              onClick={() => setActiveTab('missing')}
              role="tab"
              aria-selected={activeTab === 'missing'}
            >
              <AlertTriangle size={18} className="text-red-500" />
              <span className="tab-main-text">Not Safe</span>
              <span className="tab-counter-pill red-pill">{missingDogs.length}</span>
            </button>

            {/* TAB 2: SAFE (SAFE AT HOME) */}
            <button
              className={`dashboard-tab-btn tab-safe ${activeTab === 'safe' ? 'active' : ''}`}
              onClick={() => setActiveTab('safe')}
              role="tab"
              aria-selected={activeTab === 'safe'}
            >
              <Heart size={18} className="text-emerald-500" />
              <span className="tab-main-text">Safe</span>
              <span className="tab-counter-pill green-pill">{safeDogs.length}</span>
            </button>
          </div>

          {/* Quick Search Bar */}
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
                  <ShieldCheck size={40} className="text-emerald-600" />
                </div>
                <h3>All Furry Friends Are Safe at Home</h3>
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
                    <span>Check or Update Pet Safety Status</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="dog-profiles-grid">
                {displayedMissing.map((report) => {
                  const ownerPhone = report.contactMechanism?.safeContactPhone;
                  const ownerEmail = report.contactMechanism?.safeContactEmail;
                  const displayName = getDogDisplayName(report.dog, report);
                  const photoUrl = getDogPhotoUrl(report.dog, report);

                  return (
                    <div key={report.id} className="dog-profile-dashboard-card card lost-sos-card">
                      <div className="dog-profile-photo-container">
                        <img
                          src={photoUrl}
                          alt={displayName}
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
                          <h3 className="dog-card-name">{displayName}</h3>
                          <span className="dog-id-code">#{report.id.split('-').pop()}</span>
                        </div>

                        <div className="dog-meta-tags">
                          <span className="meta-tag">🐕 {report.dog?.breed || 'Companion Pet'}</span>
                          <span className="meta-tag">
                            {(report.dog?.gender || 'Male') === 'Male' ? '♂ Male' : '♀ Female'}
                          </span>
                          <span className="meta-tag">🎂 {report.dog?.age || '2 years'}</span>
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

                          {report.dog?.distinguishingMarks && (
                            <div className="incident-line">
                              <Sparkles size={14} className="incident-icon text-amber-500" />
                              <span>
                                <strong>Traits:</strong> {report.dog.distinguishingMarks}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* PRIVACY PROTECTED OWNER CONTACT & SIGHTING ROUTER */}
                        <div className="emergency-owner-contact-box" style={{ background: '#FFF8F8', border: '1.5px solid #FECACA', borderRadius: '10px', padding: '0.75rem' }}>
                          <div className="emergency-contact-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <ShieldCheck size={14} className="text-emerald-600" />
                              <span className="emergency-contact-label font-bold text-gray-800" style={{ fontSize: '0.78rem' }}>
                                {isOwnerOfReport(report, user) ? '👤 Your Pet Listing (Verified Owner)' : '🛡️ Verified Owner Contact (Protected)'}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.68rem', backgroundColor: isOwnerOfReport(report, user) ? '#DCFCE7' : '#EFF6FF', color: isOwnerOfReport(report, user) ? '#15803D' : '#1D4ED8', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
                              {isOwnerOfReport(report, user) ? 'Owner View' : 'Privacy Shield'}
                            </span>
                          </div>

                          <div className="emergency-contact-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {ownerPhone ? (
                              isOwnerOfReport(report, user) ? (
                                /* Owner sees their own number unmasked */
                                <a
                                  href={`tel:+91${ownerPhone}`}
                                  className="btn-emergency-contact btn-emergency-phone"
                                  style={{ padding: '5px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#ECFDF5', border: '1.5px solid #6EE7B7', borderRadius: '7px', color: '#065F46', fontWeight: 700, textDecoration: 'none' }}
                                  title="Call your own number"
                                >
                                  <Phone size={13} />
                                  <span>📞 {ownerPhone}</span>
                                </a>
                              ) : (
                                /* Guest sees protected badge and a safe "Report Sighting" action */
                                <>
                                  <div style={{ padding: '5px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#334155' }} title="Phone is protected for owner privacy">
                                    <Phone size={12} className="text-emerald-600" />
                                    <span>{maskPhoneNumber(ownerPhone)}</span>
                                  </div>
                                  <Link
                                    to={`/report-sighting/${report.id}`}
                                    className="btn-emergency-contact"
                                    style={{ padding: '5px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#22C55E', border: 'none', borderRadius: '7px', color: '#FFFFFF', fontWeight: 700, textDecoration: 'none' }}
                                    title="Report a sighting to alert the owner"
                                  >
                                    <Eye size={13} />
                                    <span>📸 Report Sighting</span>
                                  </Link>
                                </>
                              )
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Phone not shared</span>
                            )}

                            {ownerEmail && (
                              isOwnerOfReport(report, user) ? (
                                <a
                                  href={`mailto:${ownerEmail}`}
                                  className="btn-emergency-contact"
                                  style={{ padding: '5px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: '7px', color: '#1D4ED8', fontWeight: 700, textDecoration: 'none' }}
                                >
                                  <Mail size={13} />
                                  <span>📧 {ownerEmail}</span>
                                </a>
                              ) : (
                                <>
                                  <div style={{ padding: '5px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#334155' }} title="Email is masked for privacy">
                                    <Mail size={12} className="text-sky-600" />
                                    <span>{maskEmail(ownerEmail)}</span>
                                  </div>
                                  <a
                                    href={`mailto:${ownerEmail}?subject=I spotted ${getDogDisplayName(report.dog, report)}! - FindLostPuppy Alert&body=Hi, I spotted ${getDogDisplayName(report.dog, report)} (${report.dog.breed}) near ${report.lastKnownLocation}. Please contact me. I found this alert on FindLostPuppy. Reference: ${report.id}`}
                                    className="btn-emergency-contact"
                                    style={{ padding: '5px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#3B82F6', border: 'none', borderRadius: '7px', color: '#FFFFFF', fontWeight: 700, textDecoration: 'none' }}
                                    title="Send sighting email to owner"
                                    onClick={() => showToast('📧 Opening email to notify owner...', 'success')}
                                  >
                                    <Mail size={13} />
                                    <span>📧 Email Owner</span>
                                  </a>
                                </>
                              )
                            )}
                          </div>

                          <p style={{ fontSize: '0.72rem', color: '#991B1B', marginTop: '0.5rem', lineHeight: '1.35', fontWeight: 600 }}>
                            🚨 <strong>Emergency Contact:</strong> Use the buttons above to directly call or email the owner. Click <strong>"Report Sighting"</strong> below to send a location tip.
                          </p>
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
                            onClick={() => handleStatusChange(report.id, 'SAFE')}
                            className="btn btn-sm"
                            style={{
                              backgroundColor: '#ECFDF5',
                              color: '#059669',
                              borderColor: '#A7F3D0',
                              fontWeight: 700,
                            }}
                            title="Mark Pup Safe at Home"
                          >
                            <Check size={14} />
                            <span>Safe at Home 🏡</span>
                          </button>

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
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2 CONTENT: SAFE AT HOME DOG PROFILES */}
        {/* ========================================================================= */}
        {activeTab === 'safe' && (
          <div className="dashboard-tab-pane">
            <div className="tab-header-strip">
              <div>
                <h2 className="tab-section-title text-emerald-700">🏡 Pups Safe at Home</h2>
                <p className="tab-section-desc">
                  These dogs are safe and sound with their loving families.
                </p>
              </div>
              <span className="results-count-badge green-badge">
                {displayedSafe.length} Pups Safe at Home 🏡
              </span>
            </div>

            {displayedSafe.length === 0 ? (
              <div className="empty-state-card card">
                <Heart size={44} className="empty-icon text-emerald-500" />
                <h3>No Dogs Found in Safe List</h3>
                <p>
                  {searchQuery
                    ? `No dogs match "${searchQuery}".`
                    : 'Dogs marked safe at home will appear here.'}
                </p>
              </div>
            ) : (
              <div className="dog-profiles-grid">
                {displayedSafe.map((report) => {
                  const ownerPhone = report.contactMechanism?.safeContactPhone;
                  const ownerEmail = report.contactMechanism?.safeContactEmail;
                  const displayName = getDogDisplayName(report.dog, report);
                  const photoUrl = getDogPhotoUrl(report.dog, report);

                  return (
                    <div key={report.id} className="dog-profile-dashboard-card card reunited-card">
                      <div className="dog-profile-photo-container">
                        <img
                          src={photoUrl}
                          alt={displayName}
                          className="dog-profile-photo"
                          onError={handleDogImageError}
                        />
                        <div className="dog-profile-floating-badge">
                          <span className="reunited-celebration-pill">
                            <Heart size={12} />
                            <span>SAFE AT HOME 🏡</span>
                          </span>
                        </div>
                      </div>

                      <div className="dog-profile-content">
                        <div className="dog-name-row">
                          <h3 className="dog-card-name">{displayName}</h3>
                          <span className="reunion-badge">Safe at Home</span>
                        </div>

                        <div className="dog-meta-tags">
                          <span className="meta-tag">🐕 {report.dog?.breed || 'Companion Pet'}</span>
                          <span className="meta-tag">{report.ownerApproximateLocation}</span>
                        </div>

                        <div className="reunion-story-box">
                          <Heart size={14} className="text-emerald-600 flex-shrink-0 mt-1" />
                          <p className="reunion-story-text">
                            {report.additionalNotes || 'Safe with loving family at home!'}
                          </p>
                        </div>

                        {/* PRIVACY PROTECTED OWNER CONTACT */}
                        <div className="emergency-owner-contact-box" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.75rem', marginTop: '0.5rem' }}>
                          <div className="emergency-contact-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <ShieldCheck size={14} className="text-emerald-600" />
                              <span className="emergency-contact-label font-bold text-gray-800" style={{ fontSize: '0.78rem' }}>
                                {isOwnerOfReport(report, user) ? '👤 Your Pet Listing (Verified Owner)' : '🛡️ Verified Owner Contact (Protected)'}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.68rem', backgroundColor: isOwnerOfReport(report, user) ? '#DCFCE7' : '#EFF6FF', color: isOwnerOfReport(report, user) ? '#15803D' : '#1D4ED8', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
                              {isOwnerOfReport(report, user) ? 'Owner View' : 'Privacy Shield'}
                            </span>
                          </div>

                          <div className="emergency-contact-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {ownerPhone ? (
                              <div
                                className="btn-emergency-contact btn-emergency-phone"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.78rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  backgroundColor: '#F1F5F9',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '6px',
                                  color: '#334155',
                                }}
                                title="Direct phone is masked to protect owner family privacy from spam and scrapers"
                              >
                                <Phone size={12} className="text-emerald-600" />
                                <span>
                                  Phone: {maskPhoneNumber(ownerPhone)} (Protected)
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">Phone not shared</span>
                            )}

                            {ownerEmail && (
                              <div
                                className="btn-emergency-contact btn-emergency-email"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.78rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  backgroundColor: '#F1F5F9',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '6px',
                                  color: '#334155',
                                }}
                                title="Email is masked to protect owner family privacy from spam"
                              >
                                <Mail size={12} className="text-sky-600" />
                                <span>
                                  Email: {maskEmail(ownerEmail)} (Protected)
                                </span>
                              </div>
                            )}
                          </div>

                          <p style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.4rem', lineHeight: '1.25' }}>
                            🔒 <strong>Privacy Shield Active:</strong> Contact details are protected.
                          </p>
                        </div>

                        <div className="dog-card-actions">
                          <Link to={`/dog/${report.id}`} className="btn btn-outline btn-sm">
                            <span>View Pup Details 🐾</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(report.id, 'LOST')}
                            className="btn btn-ghost btn-sm text-amber-600"
                            title="Report missing if needed"
                          >
                            <span>Report Missing 🚨</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteReport(report.id, displayName)}
                            className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                            title="Remove this listing"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
