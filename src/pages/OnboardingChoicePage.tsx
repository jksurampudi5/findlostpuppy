import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Dog, LayoutDashboard, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { getDogPhotoUrl } from '../utils/dogPhotoHelper';
import { BackButton } from '../components/ui/back-button';
import { VillageDogTransition } from '../components/ui/VillageDogTransition';

/** Offers pet registration or the existing-pet flow, with an option to skip to the dashboard. */
export const OnboardingChoicePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setActiveOnboardingTab } = useAuth();

  const [isTransitioningBack, setIsTransitioningBack] = React.useState(false);
  const [isTransitioningForward, setIsTransitioningForward] = React.useState(false);

  const existingPet = user ? storageService.getPetProfileByUserId(user.id, user.email) : null;
  const hasExistingPet = Boolean(existingPet?.id && (existingPet?.name || existingPet?.breed));
  const petPhotoUrl = existingPet ? getDogPhotoUrl(existingPet) : '';

  const handleBack = () => {
    if (isTransitioningBack || isTransitioningForward) return;
    setIsTransitioningBack(true);
  };

  const handleBackTransitionComplete = () => {
    setIsTransitioningBack(false);
    setActiveOnboardingTab('location');
    navigate('/location');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const exitToDashboard = () => {
    setActiveOnboardingTab('dashboard');
    navigate('/homepage');
  };

  const goToPetDetails = () => {
    if (isTransitioningBack || isTransitioningForward) return;
    setIsTransitioningForward(true);
  };

  const handleForwardTransitionComplete = () => {
    setIsTransitioningForward(false);
    setActiveOnboardingTab('dog');
    navigate('/pet');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const goToCapturePet = () => {
    setActiveOnboardingTab('dashboard');
    navigate('/capture');
  };

  // Preserve feature for reference
  void goToCapturePet;

  return (
    <div className="onboarding-page onboarding-choice-page">
      <div className="app-container onboarding-container">
        <section className="onboarding-card card owner-theme-card onboarding-choice-card">
          <button
            type="button"
            className="onboarding-exit-btn"
            onClick={exitToDashboard}
            aria-label="Exit onboarding and go to dashboard"
            title="Exit to dashboard"
          >
            <X size={19} />
          </button>

          {/* Top-left back button inside container for going back to Location */}
          <div className="pet-profile-header-bar choice-header-bar">
            <div className="pet-profile-header-left">
              <BackButton
                onClick={handleBack}
                title="Go back to Location"
                aria-label="Back to Location"
              />
            </div>
          </div>

          <div className="section-card-title-block">
            <h1>{hasExistingPet ? 'Pet Registered' : 'Pet Choice'}</h1>
          </div>

          <div className="onboarding-choice-grid">
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
                  <strong>You already had a pet: {existingPet.name}</strong>
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
                  <small>Create or update your pet details and photo.</small>
                </span>
                <ArrowRight size={20} />
              </button>
            )}

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
          durationMs={2400}
          onComplete={handleBackTransitionComplete}
        />
      )}

      {isTransitioningForward && (
        <VillageDogTransition
          direction="forward"
          fromStep="Pet Choice"
          toStep="Pet Details"
          durationMs={2400}
          onComplete={handleForwardTransitionComplete}
        />
      )}
    </div>
  );
};
