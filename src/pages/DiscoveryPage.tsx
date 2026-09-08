import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, PawPrint, PlusCircle, X } from 'lucide-react';
import type { LostReport, ReportStatus } from '../types';
import { storageService } from '../services/storageService';
import { DogCard } from '../components/DogCard';

export const DiscoveryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState<LostReport[]>([]);

  // Search & Filter State
  const initialQuery = searchParams.get('q') || '';
  const initialStatus = (searchParams.get('status') as ReportStatus | 'ALL') || 'ALL';
  const initialLocation = searchParams.get('loc') || 'ALL';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>(initialStatus);
  const [locationFilter, setLocationFilter] = useState<string>(initialLocation);
  const [breedFilter, setBreedFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'sightings'>('newest');

  useEffect(() => {
    setReports(storageService.getAllReports());
  }, []);

  // Compute unique breeds & locations from current reports
  const availableBreeds = useMemo(() => {
    const breeds = new Set(reports.map((r) => r.dog.breed));
    return Array.from(breeds).sort();
  }, [reports]);

  const availableLocations = useMemo(() => {
    const locs = new Set(
      reports.map((r) => {
        // Extract city from approximate location
        const locStr = r.ownerApproximateLocation || r.lastKnownLocation || '';
        const parts = locStr.split(',');
        return parts[parts.length - 1]?.trim() || locStr;
      })
    );
    return Array.from(locs).filter(Boolean).sort();
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => {
        // Status filter
        if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

        // Breed filter
        if (breedFilter !== 'ALL' && r.dog?.breed !== breedFilter) return false;

        // Location filter
        const locStr = (r.ownerApproximateLocation || r.lastKnownLocation || '').toLowerCase();
        if (locationFilter !== 'ALL' && !locStr.includes(locationFilter.toLowerCase())) {
          return false;
        }

        // Search Query (matches dog name, breed, color, description, marks, approximate location)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = (r.dog?.name || '').toLowerCase().includes(q);
          const matchBreed = (r.dog?.breed || '').toLowerCase().includes(q);
          const matchColor = (r.dog?.color || '').toLowerCase().includes(q);
          const matchLoc = locStr.includes(q);
          const matchMarks = r.dog?.distinguishingMarks?.toLowerCase().includes(q) || false;
          const matchNotes = r.additionalNotes?.toLowerCase().includes(q) || false;

          if (!matchName && !matchBreed && !matchColor && !matchLoc && !matchMarks && !matchNotes) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'sightings') {
          return (b.sightingCount || 0) - (a.sightingCount || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [reports, searchQuery, statusFilter, locationFilter, breedFilter, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setLocationFilter('ALL');
    setBreedFilter('ALL');
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'ALL' || locationFilter !== 'ALL' || breedFilter !== 'ALL';

  return (
    <div className="discovery-page">
      <div className="discovery-header-banner">
        <div className="app-container">
          <div className="discovery-header-content">
            <h1 className="discovery-title">🐾 Discover & Identify Lost Dogs</h1>
            <p className="discovery-subtitle">
              Browse lost dogs in your region. Even a brief glimpse or sighting can help an anxious pet owner locate their furry best friend.
            </p>

            {/* Quick action: Report if owner */}
            <div className="discovery-quick-cta">
              <span>Lost your own puppy?</span>
              <Link to="/report" className="btn btn-primary btn-sm">
                <PlusCircle size={15} />
                <span>Create Lost Dog Report</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="app-container discovery-content-area">
        {/* Search & Filter Bar */}
        <div className="discovery-controls card">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="search"
              className="search-input-field"
              placeholder="Search by dog name, breed (e.g. Golden Retriever), color, or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search lost dogs"
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="filters-row">
            {/* Status Select */}
            <div className="filter-select-group">
              <label className="filter-label" htmlFor="filter-status">
                Status:
              </label>
              <select
                id="filter-status"
                className="form-select filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="ALL">All Statuses</option>
                <option value="LOST">🚨 Missing Dogs (Lost)</option>
                <option value="REUNITED">🎉 Reunited Dogs ❤️</option>
              </select>
            </div>

            {/* Breed Select */}
            <div className="filter-select-group">
              <label className="filter-label" htmlFor="filter-breed">
                Breed:
              </label>
              <select
                id="filter-breed"
                className="form-select filter-select"
                value={breedFilter}
                onChange={(e) => setBreedFilter(e.target.value)}
              >
                <option value="ALL">All Breeds</option>
                {availableBreeds.map((breed) => (
                  <option key={breed} value={breed}>
                    {breed}
                  </option>
                ))}
              </select>
            </div>

            {/* Region / City Select */}
            <div className="filter-select-group">
              <label className="filter-label" htmlFor="filter-location">
                Region:
              </label>
              <select
                id="filter-location"
                className="form-select filter-select"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="ALL">All Regions</option>
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="filter-select-group">
              <label className="filter-label" htmlFor="filter-sort">
                Sort:
              </label>
              <select
                id="filter-sort"
                className="form-select filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="newest">Most Recent</option>
                <option value="sightings">Most Sightings</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-ghost btn-sm clear-all-btn"
                onClick={clearFilters}
              >
                <X size={15} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Metadata Bar */}
        <div className="results-meta-bar">
          <span className="results-count-text">
            Showing <strong>{filteredReports.length}</strong> {filteredReports.length === 1 ? 'dog' : 'dogs'}
            {statusFilter !== 'ALL' ? ` with status ${statusFilter}` : ''}
          </span>
          <span className="privacy-reminder-pill">
            🔒 Public approximate locations displayed
          </span>
        </div>

        {/* Dogs Grid or Empty State */}
        {filteredReports.length === 0 ? (
          <div className="empty-state-card card">
            <div className="empty-icon-circle">
              <PawPrint size={40} />
            </div>
            <h3 className="empty-title">🐾 No lost pups found matching your filters</h3>
            <p className="empty-desc">
              Try adjusting your search term, selecting "All Breeds", or resetting your filters.
            </p>
            <div className="empty-actions">
              <button type="button" className="btn btn-primary" onClick={clearFilters}>
                Clear All Filters
              </button>
              <Link to="/report" className="btn btn-outline">
                Report a Missing Pup
              </Link>
            </div>
          </div>
        ) : (
          <div className="dogs-grid">
            {filteredReports.map((report) => (
              <DogCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
