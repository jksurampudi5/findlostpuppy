import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Dog, HeartHandshake, LayoutDashboard, Sparkles, X, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { getDogPhotoUrl, resolveGenericMediaUrl, handleDogImageError } from '../utils/dogPhotoHelper';
import { BackButton } from '../components/ui/back-button';
import { VillageDogTransition } from '../components/ui/VillageDogTransition';
import { AdoptionShareModal } from '../components/AdoptionShareModal';

/** Offers pet registration, adoption listing, or skip to dashboard. */
export const RegisteredPet: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setActiveOnboardingTab } = useAuth();

  const [isTransitioningBack, setIsTransitioningBack] = React.useState(false);
  const [isTransitioningForward, setIsTransitioningForward] = React.useState(false);
  const [isTransitioningAdoption, setIsTransitioningAdoption] = React.useState(false);
  const [isTransitioningSkip, setIsTransitioningSkip] = React.useState(false);
  const [selectedAdoptionPetId, setSelectedAdoptionPetId] = React.useState<string | undefined>(undefined);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

  const adoptionSuccess = Boolean((location.state as any)?.adoptionSuccess);
  const submittedPetName = (location.state as any)?.petName;
  const stateAdoptionPetId = (location.state as any)?.adoptionPetId;

  const existingPet = user ? storageService.getPetProfileByUserId(user.id, user.email) : null;
  const hasExistingPet = Boolean(existingPet?.id && (existingPet?.name || existingPet?.breed));
  const petPhotoUrl = existingPet ? getDogPhotoUrl(existingPet) : '';

  // Existing adoption pet lookup
  const userAdoptionPets = user ? storageService.getAdoptionPetsByUserId(user.id, user.email, user.phone) : [];
  const existingAdoptionPet = stateAdoptionPetId
    ? storageService.getAdoptionPetById(stateAdoptionPetId) || userAdoptionPets[0]
    : userAdoptionPets[0];
  const hasExistingAdoptionPet = Boolean(
    existingAdoptionPet?.id && (existingAdoptionPet?.petName || existingAdoptionPet?.breed)
  );
  const adoptionPhotoUrl = existingAdoptionPet?.photo ? resolveGenericMediaUrl(existingAdoptionPet.photo) : '';

  // Redirect to Owner Profile or Location if prerequisites are not yet complete
  React.useEffect(() => {
    if (user && !storageService.hasCompletedOwnerProfile(user.id, user.email)) {
      navigate('/owner', { replace: true });
    } else if (user && !storageService.hasCompletedLocation(user.id, user.email)) {
      navigate('/location', { replace: true });
    }
  }, [user, navigate]);

  const handleBack = () => {
    if (isTransitioningBack || isTransitioningForward || isTransitioningAdoption || isTransitioningSkip) return;
    setIsTransitioningBack(true);
  };

  const handleBackTransitionComplete = () => {
    setIsTransitioningBack(false);
    setActiveOnboardingTab('location');
    navigate('/location');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const exitToDashboard = () => {
    if (isTransitioningBack || isTransitioningForward || isTransitioningAdoption || isTransitioningSkip) return;
    setIsTransitioningSkip(true);
  };

  const goToPetDetails = () => {
    if (isTransitioningBack || isTransitioningForward || isTransitioningAdoption || isTransitioningSkip) return;
    setIsTransitioningForward(true);
  };

  const handleForwardTransitionComplete = () => {
    setIsTransitioningForward(false);
    setActiveOnboardingTab('dog');
    navigate('/pet');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const goToAdoptionDetails = (petId?: string) => {
    if (isTransitioningBack || isTransitioningForward || isTransitioningAdoption || isTransitioningSkip) return;
    setSelectedAdoptionPetId(petId || existingAdoptionPet?.id);
    setIsTransitioningAdoption(true);
  };

  const handleAdoptionTransitionComplete = () => {
    setIsTransitioningAdoption(false);
    navigate('/adoption-details', {
      state: selectedAdoptionPetId ? { adoptionPetId: selectedAdoptionPetId } : undefined,
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSkipTransitionComplete = () => {
    setIsTransitioningSkip(false);
    setActiveOnboardingTab('dashboard');
    navigate('/homepage');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="onboarding-page onboarding-choice-page">
      <div className="app-container onboarding-container">
        <section className="onboarding-card card owner-theme-card onboarding-choice-card">
          <div className="onboarding-top-nav-row">
            <div className="onboarding-top-nav-left">
              <BackButton
                onClick={handleBack}
                title="Go back to Location"
                aria-label="Back to Location"
              />
            </div>
            <div className="section-card-title-block onboarding-top-nav-title">
              <h1>Pet Choice</h1>
            </div>
            <button
              type="button"
              className="onboarding-exit-btn onboarding-top-nav-close"
              onClick={exitToDashboard}
              aria-label="Exit onboarding and go to dashboard"
              title="Exit to dashboard"
            >
              <X size={19} />
            </button>
          </div>

          {adoptionSuccess && (
            <div
              className="onboarding-choice-banner adoption-success-banner"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1.15rem',
                margin: '0.5rem 0 1rem',
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.16), rgba(190, 24, 93, 0.08))',
                border: '1px solid rgba(244, 114, 182, 0.35)',
                borderRadius: '16px',
                color: '#FCE7F3',
              }}
            >
              <Sparkles size={22} style={{ color: '#F472B6', flexShrink: 0 }} />
              <div style={{ fontSize: '0.86rem', lineHeight: '1.4' }}>
                <strong style={{ color: '#FFFFFF', display: 'block' }}>
                  Adoption details submitted{submittedPetName ? ` for ${submittedPetName}` : ''}! 🎉
                </strong>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                  <span>You can now add your own pet details below, or skip directly to the dashboard.</span>
                  {existingAdoptionPet && (
                    <button
                      type="button"
                      onClick={() => setIsShareModalOpen(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        background: '#EC4899',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 10px rgba(236,72,153,0.45)',
                      }}
                    >
                      <Share2 size={13} />
                      <span>Share Adoption Card</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="onboarding-choice-grid">
            {/* 1. ADD MY PET / EXISTING PET */}
            {hasExistingPet && existingPet ? (
              <button
                type="button"
                className="onboarding-choice-option pet-option existing-pet-active-option"
                onClick={goToPetDetails}
              >
                <span className="choice-icon-wrap choice-pet-avatar-wrap">
                  {petPhotoUrl ? (
                    <img
                      src={petPhotoUrl}
                      alt={existingPet.name}
                      className="choice-pet-avatar-img"
                    />
                  ) : (
                    <Dog size={30} />
                  )}
                </span>
                <span className="choice-copy">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong>My Pet: {existingPet.name}</strong>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        background: 'rgba(16, 185, 129, 0.16)',
                        border: '1px solid rgba(52, 211, 153, 0.4)',
                        color: '#34D399',
                      }}
                    >
                      Registered
                    </span>
                  </div>
                  <small>
                    {existingPet.breed ? `${existingPet.breed} • ` : ''}View or update registered pet profile.
                  </small>
                </span>
                <ArrowRight size={20} />
              </button>
            ) : (
              <button
                type="button"
                className="onboarding-choice-option pet-option"
                onClick={goToPetDetails}
              >
                <span className="choice-icon-wrap">
                  <Dog size={30} />
                </span>
                <span className="choice-copy">
                  <strong>Add My Pet</strong>
                  <small>Create or update your personal pet details and photo.</small>
                </span>
                <ArrowRight size={20} />
              </button>
            )}

            {/* 2. ADD ADOPTION PET DETAILS / EXISTING ADOPTION PET */}
            {hasExistingAdoptionPet && existingAdoptionPet ? (
              <button
                type="button"
                className="onboarding-choice-option adoption-option existing-adoption-pet-active-option"
                onClick={() => goToAdoptionDetails(existingAdoptionPet.id)}
              >
                <span
                  className="choice-icon-wrap choice-pet-avatar-wrap"
                  style={{
                    borderColor: 'rgba(244, 114, 182, 0.45)',
                    background: 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(190,24,93,0.35))',
                  }}
                >
                  {adoptionPhotoUrl ? (
                    <img
                      src={adoptionPhotoUrl}
                      alt={existingAdoptionPet.petName}
                      className="choice-pet-avatar-img"
                      onError={handleDogImageError}
                    />
                  ) : (
                    <HeartHandshake size={30} style={{ color: '#F472B6' }} />
                  )}
                </span>
                <span className="choice-copy">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong>
                      Adoption Pet: {existingAdoptionPet.petName}
                      {userAdoptionPets.length > 1 ? ` (+${userAdoptionPets.length - 1} more)` : ''}
                    </strong>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        background: 'rgba(236, 72, 153, 0.16)',
                        border: '1px solid rgba(244, 114, 182, 0.4)',
                        color: '#F472B6',
                      }}
                    >
                      For Adoption
                    </span>
                  </div>
                  <small>
                    {existingAdoptionPet.breed ? `${existingAdoptionPet.breed} • ` : ''}View or update adoption pet listing.
                  </small>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsShareModalOpen(true);
                    }}
                    title="Share public adoption card"
                    style={{
                      background: 'rgba(236,72,153,0.22)',
                      border: '1.5px solid rgba(244,114,182,0.45)',
                      borderRadius: '50%',
                      width: '34px',
                      height: '34px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#F472B6',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <Share2 size={16} />
                  </button>
                  <ArrowRight size={20} />
                </div>
              </button>
            ) : (
              <button
                type="button"
                className="onboarding-choice-option adoption-option"
                onClick={() => goToAdoptionDetails()}
              >
                <span className="choice-icon-wrap" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.3), rgba(190,24,93,0.4))', color: '#F472B6' }}>
                  <HeartHandshake size={30} />
                </span>
                <span className="choice-copy">
                  <strong>Add adoption pet details</strong>
                  <small>Post pet details & location for users who can adopt.</small>
                </span>
                <ArrowRight size={20} />
              </button>
            )}

            {/* 3. SKIP */}
            <button
              type="button"
              className="onboarding-choice-option skip-option"
              onClick={exitToDashboard}
            >
              <span className="choice-icon-wrap">
                <LayoutDashboard size={30} />
              </span>
              <span className="choice-copy">
                <strong>Skip</strong>
                <small>Explore community sightings and safe pets.</small>
              </span>
              <ArrowRight size={20} />
            </button>
          </div>
        </section>
      </div>

      {isTransitioningBack && (
        <VillageDogTransition
          direction="backward"
          fromStep="Pet Choice"
          toStep="Location"
          durationMs={1100}
          onComplete={handleBackTransitionComplete}
        />
      )}

      {isTransitioningForward && (
        <VillageDogTransition
          direction="forward"
          fromStep="Pet Choice"
          toStep="Pet Details"
          durationMs={1400}
          onComplete={handleForwardTransitionComplete}
        />
      )}

      {isTransitioningAdoption && (
        <VillageDogTransition
          direction="forward"
          fromStep="Pet Choice"
          toStep="Adoption Details"
          durationMs={1400}
          onComplete={handleAdoptionTransitionComplete}
        />
      )}

      {isTransitioningSkip && (
        <VillageDogTransition
          direction="forward"
          fromStep="Pet Choice"
          toStep="Pet Status"
          durationMs={1400}
          onComplete={handleSkipTransitionComplete}
        />
      )}

      {/* Public Adoption Share Card Modal */}
      <AdoptionShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        pet={existingAdoptionPet || null}
      />
    </div>
  );
};
