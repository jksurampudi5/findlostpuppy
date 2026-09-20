import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Camera, Dog, LayoutDashboard, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const OnboardingChoicePage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveOnboardingTab } = useAuth();

  const exitToDashboard = () => {
    setActiveOnboardingTab('dashboard');
    navigate('/dashboard');
  };

  const goToPetDetails = () => {
    setActiveOnboardingTab('dog');
    navigate('/pet');
  };

  const goToCapturePet = () => {
    setActiveOnboardingTab('dashboard');
    navigate('/capture');
  };

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

          <div className="section-card-title-block">
            <h1>What would you like to do?</h1>
            <p>Choose the next step. You can add your pet now, report a sighting, or skip and come back later.</p>
          </div>

          <div className="onboarding-choice-grid">
            <button type="button" className="onboarding-choice-option pet-option" onClick={goToPetDetails}>
              <span className="choice-icon-wrap">
                <Dog size={30} />
              </span>
              <span className="choice-copy">
                <strong>Add My Pet</strong>
                <small>Create or update your pet details and photo.</small>
              </span>
              <ArrowRight size={20} />
            </button>

            <button type="button" className="onboarding-choice-option sighting-option" onClick={goToCapturePet}>
              <span className="choice-icon-wrap">
                <Camera size={30} />
              </span>
              <span className="choice-copy">
                <strong>Report Pet Sighting</strong>
                <small>Capture a missing pet photo and detected location privately.</small>
              </span>
              <ArrowRight size={20} />
            </button>

            <button type="button" className="onboarding-choice-option skip-option" onClick={exitToDashboard}>
              <span className="choice-icon-wrap">
                <LayoutDashboard size={30} />
              </span>
              <span className="choice-copy">
                <strong>Skip for Now</strong>
                <small>Go to Dashboard. You can add details later.</small>
              </span>
              <Plus size={20} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
