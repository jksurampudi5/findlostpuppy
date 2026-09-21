import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Mail, ArrowRight, ShieldCheck, RefreshCw, ArrowLeft, Inbox, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const EmailAuthPage = () => {
  const { signInWithOtp, isAuthenticated, setActiveOnboardingTab, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Auto-redirect when authenticated (covers both OTP submission and Magic Link click)
  useEffect(() => {
    if (isAuthenticated) {
      setActiveOnboardingTab('owner');
      navigate('/owner', { replace: true });
    }
  }, [isAuthenticated, navigate, setActiveOnboardingTab]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const res = await signInWithOtp(cleanEmail);
    if (res.success) {
      showToast('🐾 Secure Firebase sign-in link sent to your email!', 'success');
      setStep('sent');
      setResendCooldown(30);
    } else {
      setErrorMsg(
        res.error || 'Unable to send the sign-in email. Please check your connection and try again.'
      );
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg('');

    const res = await signInWithOtp(email);
    if (res.success) {
      showToast('🔄 New Firebase sign-in link sent to your email!', 'info');
      setResendCooldown(30);
    } else {
      setErrorMsg(res.error || 'Failed to resend the sign-in email. Please try again in a moment.');
    }
  };

  return (
    <div className="auth-landing-page">
      <div className="auth-landing-container">
        <div className="auth-card card">
          {/* Brand & Header */}
          <div className="auth-card-header text-center">
            <div className="auth-paw-icon-bubble">
              {step === 'email' ? <PawPrint size={36} /> : <Inbox size={36} />}
            </div>
            <h1 className="auth-card-title">
              {step === 'email' ? 'FindLostPuppy 🐾' : 'Check Your Inbox 📬'}
            </h1>
            <p className="auth-card-quote">
              "Every paw deserves to find its way home."
            </p>
            <p className="auth-card-instruction">
              {step === 'email'
                ? 'Enter your email to sign in or create an account. We will send a secure one-tap sign-in link.'
                : `We sent a secure sign-in link to ${email}. Open that email on this device to continue.`}
            </p>
          </div>

          {errorMsg && (
            <div className="auth-error-banner" role="alert" style={{ marginBottom: '1.25rem' }}>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Email Input */}
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="auth-card-form">
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
                    disabled={isLoading}
                  />
                </div>
                <span className="form-hint">Used for passwordless sign-in and sighting alerts.</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block auth-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>Sending Link...</span>
                ) : (
                  <>
                    <span>🐾 Send Sign-In Link</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="auth-card-form">
              <div className="auth-email-sent-panel">
                <div className="auth-email-sent-icon">
                  <Mail size={26} />
                </div>
                <h2>Open your sign-in email</h2>
                <p>
                  Tap <strong>Sign in to FindLostPuppy</strong> in the email we sent. If it is not in your inbox,
                  check Spam or Promotions and mark it as safe.
                </p>
                <div className="auth-email-sent-address">{email}</div>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-lg btn-block auth-submit-btn"
                onClick={() => window.open('https://mail.google.com/mail/u/0/#inbox', '_blank', 'noopener,noreferrer')}
              >
                <span>Open Gmail</span>
                <ExternalLink size={18} />
              </button>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1.25rem',
                  fontSize: '0.85rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setErrorMsg('');
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <ArrowLeft size={14} />
                  <span>Change email</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isLoading}
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <RefreshCw size={14} className={resendCooldown > 0 ? '' : ''} />
                  <span>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend link'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Privacy Footnote */}
          <div className="auth-card-footer text-center">
            <div className="privacy-pill-subtle">
              <ShieldCheck size={16} />
              <span>100% Privacy Protected • Firebase Auth • No Spam</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
