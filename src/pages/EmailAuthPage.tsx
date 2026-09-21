import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, PawPrint, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const EmailAuthPage = () => {
  const { signInWithGoogle, isAuthenticated, setActiveOnboardingTab, isLoading, authNotice } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const visibleError = errorMsg || authNotice;

  useEffect(() => {
    if (isAuthenticated) {
      setActiveOnboardingTab('owner');
      navigate('/owner', { replace: true });
    }
  }, [isAuthenticated, navigate, setActiveOnboardingTab]);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    const res = await signInWithGoogle();

    if (res.success) {
      if (!res.redirected) {
        showToast('Signed in with Google.', 'success');
        setActiveOnboardingTab('owner');
        navigate('/owner', { replace: true });
      }
      return;
    }

    setErrorMsg(res.error || 'Could not sign in with Google. Please try again.');
  };

  return (
    <div className="auth-landing-page">
      <div className="auth-landing-container">
        <div className="auth-card card">
          <div className="auth-card-header text-center">
            <div className="auth-paw-icon-bubble">
              <PawPrint size={36} />
            </div>
            <h1 className="auth-card-title">FindLostPuppy</h1>
            <p className="auth-card-quote">"Every paw deserves to find its way home."</p>
            <p className="auth-card-instruction">
              Sign in with Google to continue. This avoids email-link quota issues and keeps your
              profile, pet details, sightings, and photos synced securely.
            </p>
          </div>

          {visibleError && (
            <div className="auth-error-banner" role="alert" style={{ marginBottom: '1.25rem' }}>
              <span>{visibleError}</span>
            </div>
          )}

          <div className="auth-card-form">
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block auth-submit-btn"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Signing you in...</span>
              ) : (
                <>
                  <span>Continue with Google</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          <div className="auth-card-footer text-center">
            <div className="privacy-pill-subtle">
              <ShieldCheck size={16} />
              <span>100% Privacy Protected • Google Sign-In • Firebase Auth</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
