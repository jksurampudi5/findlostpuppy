import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  PawPrint,
  AlertTriangle,
  Eye,
  RefreshCw,
  Download,
  Upload,
  Search,
  Check,
  Trash2,
  Share2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  ExternalLink,
  Copy,
  Heart,
  Cloud,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storageService } from '../services/storageService';
import { cloudSyncService, type CloudSyncStatus } from '../services/cloudSyncService';
import { StatusBadge } from '../components/StatusBadge';
import type { User, DogProfile, LostReport, Sighting, ReportStatus } from '../types';
import { getDogPhotoUrl, getDogDisplayName, handleDogImageError } from '../utils/dogPhotoHelper';
import { generateWhatsAppSosMessage } from '../utils/shareHelper';
import { triggerStarCelebration } from '../utils/confettiHelper';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<'members' | 'pets' | 'alerts' | 'sightings' | 'backup'>('members');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [pets, setPets] = useState<DogProfile[]>([]);
  const [reports, setReports] = useState<LostReport[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>(cloudSyncService.getStatus());
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const loadAllAdminData = () => {
    setUsers(storageService.getAllRegisteredUsers());
    setPets(storageService.getAllPets());
    setReports(storageService.getAllReports());
    setSightings(storageService.getAllSightings());
  };

  useEffect(() => {
    loadAllAdminData();

    const unsubscribeSync = cloudSyncService.onStatusChange(setSyncStatus);

    const handleDataUpdate = () => {
      loadAllAdminData();
    };

    window.addEventListener('findlostpuppy_reports_updated', handleDataUpdate);
    window.addEventListener('findlostpuppy_session_updated', handleDataUpdate);
    window.addEventListener('storage', handleDataUpdate);

    return () => {
      unsubscribeSync();
      window.removeEventListener('findlostpuppy_reports_updated', handleDataUpdate);
      window.removeEventListener('findlostpuppy_session_updated', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
    };
  }, []);

  // Quick Manual Cloud Sync
  const handleManualSync = async () => {
    showToast('🔄 Syncing with Supabase Cloud Database & Relay...', 'info');
    const [supabaseSuccess, cloudResult] = await Promise.all([
      storageService.pullFromSupabase(),
      cloudSyncService.syncCommunityData(true),
    ]);
    loadAllAdminData();
    if (supabaseSuccess || cloudResult.success) {
      showToast('✅ Supabase Cloud Sync Complete! All pet records updated.', 'success');
    } else {
      showToast('⚠️ Sync completed with local cache.', 'info');
    }
  };

  // Export Complete Backup JSON
  const handleExportBackup = () => {
    setIsExporting(true);
    try {
      const jsonStr = storageService.exportFullDatabaseJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `findlostpuppy-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('📥 Complete Community Database exported successfully!', 'success');
    } catch {
      showToast('Failed to export backup JSON.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Import / Merge Backup JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const res = storageService.importFullDatabaseJSON(text);
        if (res.success) {
          const counts = res.importedCounts || {};
          showToast(
            `✅ Backup imported! Added: ${counts.users || 0} users, ${counts.pets || 0} pets, ${counts.reports || 0} alerts.`,
            'success'
          );
          loadAllAdminData();
          // Also sync merged state to cloud relay
          cloudSyncService.syncCommunityData(true);
        } else {
          showToast(`❌ Import failed: ${res.error}`, 'error');
        }
      } catch (err: any) {
        showToast(`❌ Error reading file: ${err.message}`, 'error');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Actions on Pet & Report Status
  const handleToggleReportStatus = (reportId: string, currentStatus: ReportStatus) => {
    const nextStatus = currentStatus === 'LOST' ? 'SAFE' : 'LOST';
    storageService.updateReportStatus(reportId, nextStatus);
    if (nextStatus === 'SAFE') {
      triggerStarCelebration();
      showToast('🏡 Pup marked as Safe at Home!', 'success');
    } else {
      showToast('🚨 Alert marked as actively Missing.', 'info');
    }
    loadAllAdminData();
    cloudSyncService.syncCommunityData(true);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    const confirmed = window.confirm(`Admin Action: Permanently delete user "${userName}" and all associated data?`);
    if (!confirmed) return;

    storageService.deleteUserAsAdmin(userId);
    showToast(`🗑️ User ${userName} deleted.`, 'info');
    loadAllAdminData();
    cloudSyncService.syncCommunityData(true);
  };

  const handleDeletePet = (petId: string, petName: string) => {
    const confirmed = window.confirm(`Admin Action: Remove pet profile "${petName}"?`);
    if (!confirmed) return;

    storageService.deletePetAsAdmin(petId);
    showToast(`🗑️ Pet ${petName} removed.`, 'info');
    loadAllAdminData();
    cloudSyncService.syncCommunityData(true);
  };

  const handleDeleteAlert = (reportId: string, dogName: string) => {
    const confirmed = window.confirm(`Admin Action: Remove missing alert for "${dogName}"?`);
    if (!confirmed) return;

    storageService.deleteReport(reportId);
    showToast(`🗑️ Alert for ${dogName} removed.`, 'info');
    loadAllAdminData();
    cloudSyncService.syncCommunityData(true);
  };

  const handleDeleteSighting = (sightingId: string) => {
    const confirmed = window.confirm('Admin Action: Delete this sighting report?');
    if (!confirmed) return;

    storageService.deleteSightingAsAdmin(sightingId);
    showToast('🗑️ Sighting deleted.', 'info');
    loadAllAdminData();
    cloudSyncService.syncCommunityData(true);
  };

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`📋 Copied ${label} to clipboard!`, 'info');
    }
  };

  // Filtered lists
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [users, searchQuery]);

  const filteredPets = useMemo(() => {
    if (!searchQuery.trim()) return pets;
    const q = searchQuery.toLowerCase();
    return pets.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.breed?.toLowerCase().includes(q) ||
        p.color?.toLowerCase().includes(q) ||
        p.distinguishingMarks?.toLowerCase().includes(q)
    );
  }, [pets, searchQuery]);

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.toLowerCase();
    return reports.filter(
      (r) =>
        r.dog?.name?.toLowerCase().includes(q) ||
        r.dog?.breed?.toLowerCase().includes(q) ||
        (r.lastKnownLocation || '').toLowerCase().includes(q) ||
        (r.ownerApproximateLocation || '').toLowerCase().includes(q) ||
        r.contactMechanism?.safeContactPhone?.includes(q) ||
        r.contactMechanism?.safeContactEmail?.toLowerCase().includes(q)
    );
  }, [reports, searchQuery]);

  const filteredSightings = useMemo(() => {
    if (!searchQuery.trim()) return sightings;
    const q = searchQuery.toLowerCase();
    return sightings.filter(
      (s) =>
        s.dogName?.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q) ||
        s.reporterName?.toLowerCase().includes(q) ||
        s.reporterPhone?.includes(q) ||
        s.description?.toLowerCase().includes(q)
    );
  }, [sightings, searchQuery]);

  const missingReportsCount = useMemo(() => reports.filter((r) => r.status === 'LOST').length, [reports]);
  const safeReportsCount = useMemo(() => reports.filter((r) => r.status === 'SAFE').length, [reports]);

  return (
    <div className="admin-portal-page">
      {/* Admin Top Header Banner */}
      <div className="admin-header-banner">
        <div className="app-container">
          <div className="admin-header-flex">
            <div className="admin-title-wrap">
              <div className="admin-shield-icon">
                <Shield size={32} />
              </div>
              <div>
                <div className="admin-badge-row">
                  <span className="admin-master-badge">🛡️ Designated Admin Portal</span>
                  {syncStatus.isOnline ? (
                    <span className="cloud-status-pill online">
                      <CheckCircle2 size={12} />
                      <span>Cloud Relay Online</span>
                    </span>
                  ) : (
                    <span className="cloud-status-pill offline">
                      <AlertCircle size={12} />
                      <span>Offline Mode</span>
                    </span>
                  )}
                </div>
                <h1 className="admin-page-title">Community Admin Operations & Roster</h1>
                <p className="admin-page-subtitle">
                  Authorized Administrator: <strong>{user?.email || 'jksurampudi5@gmail.com'}</strong> • Real-time cross-device member tracking, pet registry, and emergency alerts.
                </p>
              </div>
            </div>

            <div className="admin-header-actions">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncStatus.isSyncing}
                className="btn btn-secondary btn-sm"
                title="Sync latest reports and members across community devices"
              >
                <RefreshCw size={15} className={syncStatus.isSyncing ? 'animate-spin' : ''} />
                <span>{syncStatus.isSyncing ? 'Syncing...' : 'Sync Cloud Relay'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportBackup}
                disabled={isExporting}
                className="btn btn-outline btn-sm"
                title="Export complete database backup JSON"
              >
                <Download size={15} />
                <span>Export JSON</span>
              </button>

              <label className="btn btn-primary btn-sm admin-import-btn" title="Import community backup JSON">
                <Upload size={15} />
                <span>{isImporting ? 'Importing...' : 'Import Data'}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="admin-metrics-grid">
            <div
              className={`admin-metric-card ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => setActiveTab('members')}
              role="button"
              tabIndex={0}
            >
              <div className="metric-icon-wrap bg-blue-50 text-blue-600">
                <Users size={22} />
              </div>
              <div>
                <span className="admin-metric-num">{users.length}</span>
                <span className="admin-metric-label">Enrolled Members</span>
              </div>
            </div>

            <div
              className={`admin-metric-card ${activeTab === 'pets' ? 'active' : ''}`}
              onClick={() => setActiveTab('pets')}
              role="button"
              tabIndex={0}
            >
              <div className="metric-icon-wrap bg-purple-50 text-purple-600">
                <PawPrint size={22} />
              </div>
              <div>
                <span className="admin-metric-num">{pets.length}</span>
                <span className="admin-metric-label">Registered Pets</span>
              </div>
            </div>

            <div
              className={`admin-metric-card ${activeTab === 'alerts' ? 'active' : ''}`}
              onClick={() => setActiveTab('alerts')}
              role="button"
              tabIndex={0}
            >
              <div className="metric-icon-wrap bg-red-50 text-red-600">
                <AlertTriangle size={22} />
              </div>
              <div>
                <span className="admin-metric-num text-red-600">{missingReportsCount}</span>
                <span className="admin-metric-label">Active Missing Alerts</span>
              </div>
            </div>

            <div
              className={`admin-metric-card ${activeTab === 'alerts' ? 'active' : ''}`}
              onClick={() => setActiveTab('alerts')}
              role="button"
              tabIndex={0}
            >
              <div className="metric-icon-wrap bg-emerald-50 text-emerald-600">
                <Heart size={22} />
              </div>
              <div>
                <span className="admin-metric-num text-emerald-600">{safeReportsCount}</span>
                <span className="admin-metric-label">Safe at Home</span>
              </div>
            </div>

            <div
              className={`admin-metric-card ${activeTab === 'sightings' ? 'active' : ''}`}
              onClick={() => setActiveTab('sightings')}
              role="button"
              tabIndex={0}
            >
              <div className="metric-icon-wrap bg-amber-50 text-amber-600">
                <Eye size={22} />
              </div>
              <div>
                <span className="admin-metric-num">{sightings.length}</span>
                <span className="admin-metric-label">Sightings Logged</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Admin Content Container */}
      <div className="app-container admin-main-container">
        {/* Tab Navigation & Search Bar */}
        <div className="admin-nav-bar card">
          <div className="admin-tabs" role="tablist">
            <button
              className={`admin-tab-btn ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => setActiveTab('members')}
              role="tab"
            >
              <Users size={17} />
              <span>👥 Enrolled Pet Parents</span>
              <span className="admin-count-pill">{users.length}</span>
            </button>

            <button
              className={`admin-tab-btn ${activeTab === 'pets' ? 'active' : ''}`}
              onClick={() => setActiveTab('pets')}
              role="tab"
            >
              <PawPrint size={17} />
              <span>🐶 All Pets Registry</span>
              <span className="admin-count-pill">{pets.length}</span>
            </button>

            <button
              className={`admin-tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
              onClick={() => setActiveTab('alerts')}
              role="tab"
            >
              <AlertTriangle size={17} />
              <span>🚨 Missing Pet Alerts</span>
              <span className="admin-count-pill red-pill">{missingReportsCount}</span>
            </button>

            <button
              className={`admin-tab-btn ${activeTab === 'sightings' ? 'active' : ''}`}
              onClick={() => setActiveTab('sightings')}
              role="tab"
            >
              <Eye size={17} />
              <span>👁️ Sightings Log</span>
              <span className="admin-count-pill">{sightings.length}</span>
            </button>

            <button
              className={`admin-tab-btn ${activeTab === 'backup' ? 'active' : ''}`}
              onClick={() => setActiveTab('backup')}
              role="tab"
            >
              <Cloud size={17} />
              <span>☁️ Cloud Sync & Backups</span>
            </button>
          </div>

          {activeTab !== 'backup' && (
            <div className="admin-search-wrapper">
              <Search size={16} className="admin-search-icon" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-search-input"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="search-clear-btn">
                  ×
                </button>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: ENROLLED MEMBERS & PET PARENTS */}
        {/* ========================================================================= */}
        {activeTab === 'members' && (
          <div className="admin-tab-content">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">Enrolled Pet Parents & Users</h2>
                <p className="admin-section-desc">
                  All signed-in community members, verified contact details, addresses, and pet ownership links.
                </p>
              </div>
              <span className="results-count-badge">
                Showing {filteredUsers.length} of {users.length} enrolled users
              </span>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="empty-state-card card">
                <Users size={44} className="empty-icon text-gray-400" />
                <h3>No Enrolled Members Found</h3>
                <p>{searchQuery ? `No users match "${searchQuery}".` : 'No users have enrolled yet.'}</p>
              </div>
            ) : (
              <div className="admin-table-wrapper card">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>User / Parent</th>
                      <th>Email Contact</th>
                      <th>Phone</th>
                      <th>Location / District</th>
                      <th>Registered Pets</th>
                      <th>Joined Date</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const profile = storageService.getOwnerProfileByUserId(u.id);
                      const userPet = storageService.getPetProfileByUserId(u.id);
                      const userReports = storageService.getReportsByOwner(u.id);
                      const phone = profile?.phone || u.phone || '-';
                      const location = profile?.approximateArea || profile?.district || profile?.city || '-';

                      return (
                        <tr key={u.id}>
                          <td>
                            <div className="user-identity-cell">
                              <div className="admin-avatar-circle">
                                {profile?.photo ? (
                                  <img src={profile.photo} alt={u.name} className="admin-avatar-img" />
                                ) : (
                                  <span>{u.name?.charAt(0).toUpperCase() || 'U'}</span>
                                )}
                              </div>
                              <div>
                                <strong className="user-name-text">{u.name}</strong>
                                <span className="user-id-subtext">ID: {u.id}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="contact-cell">
                              <a href={`mailto:${u.email}`} className="email-link">
                                <Mail size={13} />
                                <span>{u.email}</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(u.email, 'Email')}
                                className="copy-icon-btn"
                                title="Copy email"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          </td>
                          <td>
                            {phone !== '-' ? (
                              <div className="contact-cell">
                                <a href={`tel:${phone}`} className="phone-link">
                                  <Phone size={13} />
                                  <span>{phone}</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(phone, 'Phone')}
                                  className="copy-icon-btn"
                                  title="Copy phone"
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400">Not provided</span>
                            )}
                          </td>
                          <td>
                            <div className="location-cell">
                              <MapPin size={13} className="text-terracotta" />
                              <span>{location}</span>
                            </div>
                          </td>
                          <td>
                            <div className="pets-summary-cell">
                              {userPet ? (
                                <span className="pet-tag-badge">
                                  🐾 {userPet.name} ({userPet.breed})
                                </span>
                              ) : userReports.length > 0 ? (
                                <span className="pet-tag-badge">
                                  🐾 {userReports[0].dog.name}
                                </span>
                              ) : (
                                <span className="text-gray-400">None yet</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="date-cell">
                              <Calendar size={13} />
                              <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td>
                            {u.isAdmin || u.email.toLowerCase() === 'jksurampudi5@gmail.com' ? (
                              <span className="role-badge admin-role">Admin 🛡️</span>
                            ) : (
                              <span className="role-badge member-role">Member</span>
                            )}
                          </td>
                          <td>
                            <div className="table-actions-cell">
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                                title="Delete user"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ALL REGISTERED PETS */}
        {/* ========================================================================= */}
        {activeTab === 'pets' && (
          <div className="admin-tab-content">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">All Registered Community Pets</h2>
                <p className="admin-section-desc">
                  Master registry of dogs, distinguishing features, microchips, owner contact details, and safety status.
                </p>
              </div>
              <span className="results-count-badge">
                Showing {filteredPets.length} of {pets.length} pets
              </span>
            </div>

            {filteredPets.length === 0 ? (
              <div className="empty-state-card card">
                <PawPrint size={44} className="empty-icon text-gray-400" />
                <h3>No Registered Pets Found</h3>
                <p>{searchQuery ? `No pets match "${searchQuery}".` : 'No pet profiles registered yet.'}</p>
              </div>
            ) : (
              <div className="admin-table-wrapper card">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Pet Photo & Name</th>
                      <th>Breed / Traits</th>
                      <th>Gender / Age / Size</th>
                      <th>Owner Contact</th>
                      <th>Safety Status</th>
                      <th>Quick Status Override</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPets.map((pet) => {
                      const linkedReport = reports.find(
                        (r) => r.dogId === pet.id || (r.dog && r.dog.name?.toLowerCase() === pet.name?.toLowerCase())
                      );
                      const isLost = linkedReport?.status === 'LOST';
                      const ownerProfile = storageService.getOwnerProfileByUserId(pet.ownerId);

                      return (
                        <tr key={pet.id}>
                          <td>
                            <div className="pet-identity-cell">
                              <img
                                src={pet.primaryPhoto || getDogPhotoUrl(pet, linkedReport || undefined)}
                                alt={pet.name}
                                className="admin-pet-thumb"
                                onError={handleDogImageError}
                              />
                              <div>
                                <strong className="pet-name-title">{pet.name}</strong>
                                <span className="pet-color-sub">{pet.color}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <strong>{pet.breed}</strong>
                              {pet.distinguishingMarks && (
                                <p className="pet-marks-text">
                                  <Sparkles size={11} className="text-amber-500 inline mr-1" />
                                  {pet.distinguishingMarks}
                                </p>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="attributes-stack">
                              <span className="attribute-pill">{pet.gender}</span>
                              <span className="attribute-pill">{pet.age}</span>
                              <span className="attribute-pill">{pet.size}</span>
                            </div>
                          </td>
                          <td>
                            <div>
                              <strong className="block text-sm">{ownerProfile?.fullName || 'Pet Parent'}</strong>
                              {ownerProfile?.phone && (
                                <a href={`tel:${ownerProfile.phone}`} className="phone-link text-xs">
                                  📞 {ownerProfile.phone}
                                </a>
                              )}
                              {ownerProfile?.email && (
                                <a href={`mailto:${ownerProfile.email}`} className="email-link text-xs block">
                                  ✉️ {ownerProfile.email}
                                </a>
                              )}
                            </div>
                          </td>
                          <td>
                            {isLost ? (
                              <StatusBadge status="LOST" size="sm" />
                            ) : (
                              <StatusBadge status="SAFE" size="sm" />
                            )}
                          </td>
                          <td>
                            {linkedReport ? (
                              <button
                                type="button"
                                onClick={() => handleToggleReportStatus(linkedReport.id, linkedReport.status)}
                                className={`btn btn-sm ${isLost ? 'btn-success-soft' : 'btn-danger-soft'}`}
                                title="Toggle pet status"
                              >
                                {isLost ? 'Mark Safe 🏡' : 'Mark Lost 🚨'}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">Safe (No active alert)</span>
                            )}
                          </td>
                          <td>
                            <div className="table-actions-cell">
                              {linkedReport && (
                                <Link
                                  to={`/dog/${linkedReport.id}`}
                                  className="btn btn-ghost btn-sm text-terracotta"
                                  title="View Live Flyer"
                                >
                                  <ExternalLink size={15} />
                                </Link>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeletePet(pet.id, pet.name)}
                                className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                                title="Delete pet profile"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MISSING PET ALERTS & SOS MONITOR */}
        {/* ========================================================================= */}
        {activeTab === 'alerts' && (
          <div className="admin-tab-content">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">🚨 Active Missing Dog Alerts & Safety Status</h2>
                <p className="admin-section-desc">
                  Real-time missing pet emergency broadcast directory with instant WhatsApp SOS links and owner direct hotlines.
                </p>
              </div>
              <span className="results-count-badge red-badge">
                {missingReportsCount} Actively Missing • {safeReportsCount} Safe at Home
              </span>
            </div>

            {filteredReports.length === 0 ? (
              <div className="empty-state-card card">
                <AlertTriangle size={44} className="empty-icon text-red-500" />
                <h3>No Missing Pet Alerts</h3>
                <p>{searchQuery ? `No reports match "${searchQuery}".` : 'No lost dog reports found.'}</p>
              </div>
            ) : (
              <div className="admin-table-wrapper card">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Dog Photo & Name</th>
                      <th>Last Seen Location</th>
                      <th>Lost Date / Time</th>
                      <th>Owner Emergency Contact</th>
                      <th>Sightings</th>
                      <th>WhatsApp SOS</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => {
                      const isLost = report.status === 'LOST';
                      const displayName = getDogDisplayName(report.dog, report);
                      const photoUrl = getDogPhotoUrl(report.dog, report);
                      const phone = report.contactMechanism?.safeContactPhone;
                      const email = report.contactMechanism?.safeContactEmail;

                      return (
                        <tr key={report.id} className={isLost ? 'row-alert-lost' : 'row-alert-safe'}>
                          <td>
                            <StatusBadge status={report.status} size="sm" />
                          </td>
                          <td>
                            <div className="pet-identity-cell">
                              <img
                                src={photoUrl}
                                alt={displayName}
                                className="admin-pet-thumb"
                                onError={handleDogImageError}
                              />
                              <div>
                                <strong className="pet-name-title">{displayName}</strong>
                                <span className="pet-color-sub">
                                  #{report.id.split('-').pop()} • {report.dog?.breed}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="location-cell">
                              <MapPin size={13} className="text-terracotta" />
                              <span>{report.lastKnownLocation || report.ownerApproximateLocation}</span>
                            </div>
                          </td>
                          <td>
                            <div className="date-cell">
                              <Calendar size={13} />
                              <span>
                                {report.dateLost} ({report.timeLost})
                              </span>
                            </div>
                          </td>
                          <td>
                            <div>
                              {phone ? (
                                <a href={`tel:${phone}`} className="phone-link text-xs font-bold block">
                                  📞 {phone}
                                </a>
                              ) : (
                                <span className="text-xs text-gray-400">No phone</span>
                              )}
                              {email && (
                                <a href={`mailto:${email}`} className="email-link text-xs block">
                                  ✉️ {email}
                                </a>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="sightings-count-badge">
                              <Eye size={12} />
                              <span>{report.sightingCount || 0} sightings</span>
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => {
                                const { whatsappUrl, dashboardUrl } = generateWhatsAppSosMessage(
                                  report,
                                  report.dog,
                                  phone
                                );
                                if (navigator.clipboard) navigator.clipboard.writeText(dashboardUrl);
                                showToast('📲 WhatsApp SOS alert opened & Dashboard link copied!', 'success');
                                window.open(whatsappUrl, '_blank');
                              }}
                              className="btn btn-whatsapp btn-sm"
                              style={{
                                backgroundColor: '#25D366',
                                color: '#FFFFFF',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                              title="Broadcast SOS on WhatsApp"
                            >
                              <Share2 size={13} />
                              <span>WhatsApp</span>
                            </button>
                          </td>
                          <td>
                            <div className="table-actions-cell">
                              <button
                                type="button"
                                onClick={() => handleToggleReportStatus(report.id, report.status)}
                                className={`btn btn-sm ${isLost ? 'btn-success-soft' : 'btn-danger-soft'}`}
                                title={isLost ? 'Mark Safe at Home' : 'Mark Missing'}
                              >
                                {isLost ? <Check size={14} /> : <AlertTriangle size={14} />}
                                <span>{isLost ? 'Safe' : 'Lost'}</span>
                              </button>

                              <Link
                                to={`/dog/${report.id}`}
                                className="btn btn-ghost btn-sm text-terracotta"
                                title="View Public Flyer"
                              >
                                <ExternalLink size={15} />
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleDeleteAlert(report.id, displayName)}
                                className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                                title="Delete Alert"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: COMMUNITY SIGHTINGS */}
        {/* ========================================================================= */}
        {activeTab === 'sightings' && (
          <div className="admin-tab-content">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">Community Sighting Reports & Leads</h2>
                <p className="admin-section-desc">
                  Log of community sightings submitted by volunteers and neighbors across neighborhoods.
                </p>
              </div>
              <span className="results-count-badge amber-badge">
                Showing {filteredSightings.length} of {sightings.length} sightings
              </span>
            </div>

            {filteredSightings.length === 0 ? (
              <div className="empty-state-card card">
                <Eye size={44} className="empty-icon text-amber-500" />
                <h3>No Sightings Recorded</h3>
                <p>{searchQuery ? `No sightings match "${searchQuery}".` : 'No community sightings have been submitted yet.'}</p>
              </div>
            ) : (
              <div className="admin-table-wrapper card">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Dog Name / Report ID</th>
                      <th>Sighted Location</th>
                      <th>Date / Time</th>
                      <th>Reporter Details</th>
                      <th>Notes / Clues</th>
                      <th>Photo</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSightings.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <strong>{s.dogName || 'Lost Dog'}</strong>
                          <span className="block text-xs text-gray-500">#{s.reportId}</span>
                        </td>
                        <td>
                          <div className="location-cell">
                            <MapPin size={13} className="text-terracotta" />
                            <span>{s.location}</span>
                          </div>
                        </td>
                        <td>
                          <div className="date-cell">
                            <Calendar size={13} />
                            <span>
                              {s.date} at {s.time}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{s.reporterName || 'Anonymous Volunteer'}</strong>
                            {s.reporterPhone && (
                              <a href={`tel:${s.reporterPhone}`} className="phone-link text-xs block">
                                📞 {s.reporterPhone}
                              </a>
                            )}
                            {s.reporterEmail && (
                              <a href={`mailto:${s.reporterEmail}`} className="email-link text-xs block">
                                ✉️ {s.reporterEmail}
                              </a>
                            )}
                          </div>
                        </td>
                        <td>
                          <p className="sighting-desc-cell">{s.description || 'No additional notes'}</p>
                        </td>
                        <td>
                          {s.photo ? (
                            <img src={s.photo} alt="Sighting" className="admin-sighting-thumb" />
                          ) : (
                            <span className="text-xs text-gray-400">No photo</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleDeleteSighting(s.id)}
                            className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                            title="Delete sighting"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: CLOUD SYNC & DATA BACKUP */}
        {/* ========================================================================= */}
        {activeTab === 'backup' && (
          <div className="admin-tab-content">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">☁️ Community Cloud Relay & Database Management</h2>
                <p className="admin-section-desc">
                  Cross-device sync relay, full database export/import backups, and cross-platform integrity verification.
                </p>
              </div>
            </div>

            <div className="admin-backup-grid">
              {/* Card 1: Cloud Relay Status */}
              <div className="backup-panel-card card">
                <div className="panel-card-header">
                  <Cloud size={24} className="text-blue-600" />
                  <h3 className="panel-card-title">Live Cloud Relay Sync</h3>
                </div>
                <p className="panel-card-text">
                  The Community Cloud Relay automatically synchronizes missing pet alerts, registrations, and sightings across devices, so your friends on other phones see changes in real time.
                </p>

                <div className="cloud-relay-stats-box">
                  <div className="relay-stat-item">
                    <span className="stat-label">Cloud Backend:</span>
                    <span className="stat-val text-emerald-600 font-bold">⚡ Supabase Database</span>
                  </div>
                  <div className="relay-stat-item">
                    <span className="stat-label">Project URL:</span>
                    <span className="stat-val font-mono text-xs text-gray-700">kfmtlrmttskqaepoznwy.supabase.co</span>
                  </div>
                  <div className="relay-stat-item">
                    <span className="stat-label">Relay Status:</span>
                    <span className="stat-val text-emerald-600 font-bold">● Active & Connected</span>
                  </div>
                  <div className="relay-stat-item">
                    <span className="stat-label">Last Synchronized:</span>
                    <span className="stat-val">
                      {syncStatus.lastSyncedAt
                        ? new Date(syncStatus.lastSyncedAt).toLocaleString()
                        : 'Live / Synchronized'}
                    </span>
                  </div>
                  <div className="relay-stat-item">
                    <span className="stat-label">Network:</span>
                    <span className="stat-val">{syncStatus.isOnline ? 'Online (Real-time)' : 'Offline'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={syncStatus.isSyncing}
                  className="btn btn-primary btn-block"
                >
                  <RefreshCw size={16} className={syncStatus.isSyncing ? 'animate-spin' : ''} />
                  <span>{syncStatus.isSyncing ? 'Synchronizing...' : 'Force Supabase Cloud Sync Now'}</span>
                </button>
              </div>

              {/* Card 2: JSON Backup & Restore */}
              <div className="backup-panel-card card">
                <div className="panel-card-header">
                  <Download size={24} className="text-terracotta" />
                  <h3 className="panel-card-title">JSON Data Backup & Restore</h3>
                </div>
                <p className="panel-card-text">
                  Download a complete portable snapshot of the entire registry (members, pet profiles, missing reports, and sightings) or upload a backup file from a friend's device.
                </p>

                <div className="backup-actions-stack">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    disabled={isExporting}
                    className="btn btn-outline btn-block"
                  >
                    <Download size={16} />
                    <span>Download Full Backup JSON</span>
                  </button>

                  <label className="btn btn-secondary btn-block admin-import-label">
                    <Upload size={16} />
                    <span>{isImporting ? 'Importing File...' : 'Upload & Merge Backup JSON'}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportFile}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
