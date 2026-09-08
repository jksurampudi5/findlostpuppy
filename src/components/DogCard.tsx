import { Link } from 'react-router-dom';
import { MapPin, Calendar, Eye } from 'lucide-react';
import type { LostReport } from '../types';
import { StatusBadge } from './StatusBadge';
import { getDogPhotoUrl, getDogDisplayName, handleDogImageError } from '../utils/dogPhotoHelper';

interface DogCardProps {
  report: LostReport;
}

export const DogCard: React.FC<DogCardProps> = ({ report }) => {
  const { id, dog, status, dateLost, ownerApproximateLocation, sightingCount } = report;
  const displayName = getDogDisplayName(dog, report);
  const photoUrl = getDogPhotoUrl(dog, report);

  return (
    <article className="dog-card card card-hoverable" id={`card-${id}`}>
      <Link to={`/dog/${id}`} className="dog-card-image-link" aria-label={`View details for ${displayName}`}>
        <div className="dog-card-image-wrapper">
          <img
            src={photoUrl}
            alt={`${displayName} - ${dog?.breed || 'Companion Pet'}`}
            className="dog-card-img"
            loading="lazy"
            onError={handleDogImageError}
          />
          <div className="dog-card-badge-overlay">
            <StatusBadge status={status} size="sm" />
          </div>

          {sightingCount > 0 && status !== 'SAFE' && status !== 'REUNITED' && (
            <div className="dog-card-sighting-pill" title={`${sightingCount} sighting(s) reported`}>
              <Eye size={12} />
              <span>{sightingCount} sighting{sightingCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="dog-card-body">
        <div className="dog-card-header">
          <h3 className="dog-card-title">
            <Link to={`/dog/${id}`}>{displayName}</Link>
          </h3>
          <span className="dog-card-breed">{dog?.breed || 'Companion Pet'}</span>
        </div>

        <div className="dog-card-meta-list">
          <div className="dog-card-meta-item">
            <MapPin size={14} className="meta-icon" />
            <span className="meta-text">{ownerApproximateLocation || 'Nearby Area'}</span>
          </div>
          <div className="dog-card-meta-item">
            <Calendar size={14} className="meta-icon" />
            <span className="meta-text">Lost on {dateLost}</span>
          </div>
        </div>

        {dog.distinguishingMarks && (
          <p className="dog-card-notes">
            {dog.distinguishingMarks.length > 80
              ? `${dog.distinguishingMarks.slice(0, 80)}...`
              : dog.distinguishingMarks}
          </p>
        )}

        <div className="dog-card-footer">
          <div className="dog-card-tags">
            <span className="attribute-pill">{dog.gender}</span>
            <span className="attribute-pill">{dog.age}</span>
          </div>

          <Link to={`/dog/${id}`} className="btn btn-outline btn-sm dog-view-btn">
            <span>View Pup</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
};
