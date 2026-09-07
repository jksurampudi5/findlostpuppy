import { useState } from 'react';
import { X, Camera, MapPin, Calendar, Clock, Heart, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Sighting } from '../types';
import { storageService } from '../services/storageService';
import { useToast } from '../context/ToastContext';

interface SightingModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  dogName: string;
  onSightingAdded: () => void;
}

export const SightingModal: React.FC<SightingModalProps> = ({
  isOpen,
  onClose,
  reportId,
  dogName,
  onSightingAdded,
}) => {
  const { showToast } = useToast();

  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('10:00 AM');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string>('');
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image should be under 5MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !description.trim()) {
      showToast('Please provide both the location and a brief description.', 'warning');
      return;
    }

    setLoading(true);

    const newSighting: Sighting = {
      id: `sight-${Date.now()}`,
      reportId,
      dogName,
      date,
      time,
      location: location.trim(),
      photo: photo || undefined,
      description: description.trim(),
      reporterName: reporterName.trim() || 'Caring Neighbor',
      reporterPhone: reporterContact.includes('@') ? undefined : reporterContact.trim(),
      reporterEmail: reporterContact.includes('@') ? reporterContact.trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      storageService.addSighting(newSighting);
      setLoading(false);
      setSubmitted(true);

      // Trigger celebratory micro-animation
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#E06D44', '#44775D', '#F59E0B'],
        });
      } catch (err) {
        console.log('Confetti error:', err);
      }

      showToast(`🐾 Sighting recorded for ${dogName}! Thank you!`, 'success');
      onSightingAdded();
    } catch {
      setLoading(false);
      showToast('Could not save sighting. Please try again.', 'error');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sighting-title"
      >
        <div className="modal-header">
          <div className="sighting-modal-heading-box">
            <h3 id="sighting-title" className="sighting-modal-title">
              🐾 Report a Sighting of {dogName}
            </h3>
            <p className="modal-subtitle">
              Every detail helps the owner locate and bring {dogName} home!
            </p>
          </div>
          <button onClick={onClose} className="toast-close" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="sighting-success-state">
            <div className="success-icon-bubble">
              <Heart size={36} fill="#E06D44" color="#E06D44" />
            </div>
            <h3>Thank You for Helping {dogName}!</h3>
            <p>
              Your sighting has been logged and the pet owner has been alerted.
              Kind neighbors like you make reunions possible.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
            >
              Back to Dog Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Privacy protection notice */}
              <div className="sighting-privacy-notice">
                <Shield size={16} />
                <span>Your contact details are strictly kept private and only shared with {dogName}'s verified family.</span>
              </div>

              <div className="form-vertical-stack">
                <div className="form-group">
                  <label className="form-label" htmlFor="sight-date">
                    Date Seen <span className="required-tag">*</span>
                  </label>
                  <div className="input-with-icon">
                    <Calendar size={16} className="input-icon" />
                    <input
                      id="sight-date"
                      type="date"
                      className="form-input"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      max={today}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="sight-time">
                    Approximate Time <span className="required-tag">*</span>
                  </label>
                  <div className="input-with-icon">
                    <Clock size={16} className="input-icon" />
                    <input
                      id="sight-time"
                      type="text"
                      className="form-input"
                      placeholder="e.g. 08:30 AM or Afternoon"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sight-location">
                  Where did you spot {dogName}? <span className="required-tag">*</span>
                </label>
                <div className="input-with-icon">
                  <MapPin size={16} className="input-icon" />
                  <input
                    id="sight-location"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Near Rythu Bazar vegetable stalls, Benz Circle"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>
                <span className="form-hint">Mention nearby landmarks, shops, or street names.</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sight-desc">
                  What did you observe? <span className="required-tag">*</span>
                </label>
                <textarea
                  id="sight-desc"
                  className="form-textarea"
                  rows={3}
                  placeholder={`Describe what ${dogName} was doing, direction they headed, whether they seemed scared, collar color, etc.`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* Photo Upload */}
              <div className="form-group">
                <label className="form-label">
                  📸 Sighting Photo <span className="optional-tag">(Optional but immensely helpful)</span>
                </label>
                {photo ? (
                  <div className="sighting-photo-preview">
                    <img src={photo} alt="Sighting preview" />
                    <button
                      type="button"
                      className="remove-sighting-photo"
                      onClick={() => setPhoto('')}
                      aria-label="Remove photo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="sighting-upload-button">
                    <Camera size={20} />
                    <span>Upload or Snap a Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handlePhotoSelect}
                    />
                  </label>
                )}
              </div>

              <div className="form-vertical-stack">
                <div className="form-group">
                  <label className="form-label" htmlFor="sight-reporter-name">
                    Your Name <span className="optional-tag">(Optional)</span>
                  </label>
                  <input
                    id="sight-reporter-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rahul S."
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="sight-reporter-contact">
                    Contact Phone or Email <span className="optional-tag">(Optional)</span>
                  </label>
                  <input
                    id="sight-reporter-contact"
                    type="text"
                    className="form-input"
                    placeholder="In case owner needs quick directions"
                    value={reporterContact}
                    onChange={(e) => setReporterContact(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Submitting...' : '🐾 Submit Sighting'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
