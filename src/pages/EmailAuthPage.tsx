import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Mail, ArrowRight, ShieldCheck, KeyRound, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const EmailAuthPage = () => {
  const { signInWithOtp, verifyOtp, isAuthenticated, activeOnboardingTab, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Auto-redirect when authenticated (covers both OTP submission and Magic Link click)
  useEffect(() => {
    if (isAuthenticated) {
      const target =
        !activeOnboardingTab || activeOnboardingTab === 'completed'
          ? '/dashboard'
          : `/${activeOnboardingTab}`;
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, activeOnboardingTab, navigate]);

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
      showToast('🐾 Verification code sent to your email!', 'success');
      setStep('otp');
      setResendCooldown(30);
    } else {
      setErrorMsg(
        res.error || 'Unable to send verification code. Please check your connection and try again.'
      );
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanOtp = otpToken.trim().replace(/\D/g, '');
    if (cleanOtp.length < 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }

    const res = await verifyOtp(email, cleanOtp);
    if (res.success) {
      showToast('Welcome to FindLostPuppy! 🐾', 'success');
    } else {
      setErrorMsg(
        res.error || 'The code you entered is invalid or has expired. Please check and try again.'
      );
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg('');

    const res = await signInWithOtp(email);
    if (res.success) {
      showToast('🔄 New verification code sent to your email!', 'info');
      setResendCooldown(30);
    } else {
      setErrorMsg(res.error || 'Failed to resend verification code. Please try again in a moment.');
    }
  };

  return (
    <div className="auth-landing-page">
      <div className="auth-landing-container">
        <div className="auth-card card">
          {/* Brand & Header */}
          <div className="auth-card-header text-center">
            <div className="auth-paw-icon-bubble">
              {step === 'email' ? <PawPrint size={36} /> : <KeyRound size={36} />}
            </div>
            <h1 className="auth-card-title">
              {step === 'email' ? 'FindLostPuppy 🐾' : 'Check Your Email 📬'}
            </h1>
            <p className="auth-card-quote">
              "Every paw deserves to find its way home."
            </p>
            <p className="auth-card-instruction">
              {step === 'email'
                ? 'Enter your email to sign in or create an account. A secure one-time code will be sent to your inbox.'
                : `We've sent a verification code and magic link to ${email}.`}
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
                  <span>Sending Code...</span>
                ) : (
                  <>
                    <span>🐾 Continue</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Verification Code Input (Supports both 6-digit and 8-digit Supabase OTPs) */
            <form onSubmit={handleOtpSubmit} className="auth-card-form">
              <div className="form-group">
                <label className="form-label" htmlFor="user-otp">
                  Verification Code <span className="required-tag">*</span>
                </label>
                <div className="input-with-icon">
                  <KeyRound size={18} className="input-icon" />
                  <input
                    id="user-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    className="form-input"
                    placeholder="Enter code"
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                    style={{
                      letterSpacing: otpToken.length > 6 ? '0.22em' : '0.35em',
                      fontSize: '1.35rem',
                      fontWeight: '700',
                      textAlign: 'center',
                    }}
                    autoFocus
                    required
                    disabled={isLoading}
                  />
                </div>
                <span className="form-hint">
                  Tip: You can also tap the Magic Link in your email to sign in automatically.
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block auth-submit-btn"
                disabled={isLoading || otpToken.length < 6}
              >
                {isLoading ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    <span>🐾 Verify & Sign In</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* Resend and Change Email Actions */}
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
                    setOtpToken('');
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
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* Privacy Footnote */}
          <div className="auth-card-footer text-center">
            <div className="privacy-pill-subtle">
              <ShieldCheck size={16} />
              <span>100% Privacy Protected • Official Supabase Auth • No Spam</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
