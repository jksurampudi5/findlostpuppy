import { useState } from 'react';
import { PawPrint, Mail, ArrowRight, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const EmailAuthPage = () => {
  const { loginWithEmail, isLoading } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const res = await loginWithEmail(email, name);
    if (res.success) {
      showToast('Welcome to FindLostPuppy! 🐾', 'success');
    } else {
      setErrorMsg(res.error || 'Unable to continue. Please check your email.');
    }
  };

  return (
    <div className="auth-landing-page">
      <div className="auth-landing-container">
        <div className="auth-card card">
          {/* Brand & Mission */}
          <div className="auth-card-header text-center">
            <div className="auth-paw-icon-bubble">
              <PawPrint size={36} />
            </div>
            <h1 className="auth-card-title">FindLostPuppy 🐾</h1>
            <p className="auth-card-quote">
              "Every paw deserves to find its way home."
            </p>
            <p className="auth-card-instruction">
              Enter your email to sign in or create an account. You will stay remembered on this device.
            </p>
          </div>

          {errorMsg && (
            <div className="auth-error-banner" role="alert">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Simple Email Form */}
          <form onSubmit={handleSubmit} className="auth-card-form">
            <div className="form-group">
              <label className="form-label" htmlFor="user-email">
                Your Email Address <span className="required-tag">*</span>
              </label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="user-email"
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <span className="form-hint">Used for verification and sighting alerts.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="user-name">
                Your Name <span className="optional-tag">(Optional)</span>
              </label>
              <div className="input-with-icon">
                <UserIcon size={18} className="input-icon" />
                <input
                  id="user-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Suresh Varma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Checking...</span>
              ) : (
                <>
                  <span>🐾 Continue</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Privacy Footnote */}
          <div className="auth-card-footer text-center">
            <div className="privacy-pill-subtle">
              <ShieldCheck size={16} />
              <span>100% Privacy Protected • No spam • Auto-remembered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
