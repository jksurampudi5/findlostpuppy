import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Mail, ArrowRight, ShieldCheck, RefreshCw, ArrowLeft, Inbox, KeyRound, ClipboardPaste } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const EmailAuthPage = () => {
  const { signInWithOtp, verifyOtp, isAuthenticated, setActiveOnboardingTab, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
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

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    if (!cleanEmail.includes('@')) {
      setErrorMsg('Please confirm your email address first.');
      return;
    }
    if (cleanCode.length < 6) {
      setErrorMsg('Please enter the 6 digit sign-in code.');
      return;
    }

    const res = await verifyOtp(cleanEmail, cleanCode);
    if (res.success) {
      showToast('Signed in successfully.', 'success');
      setActiveOnboardingTab('owner');
      navigate('/owner', { replace: true });
    } else {
      setErrorMsg(res.error || 'That code could not be verified. Please try again.');
    }
  };

  const handlePasteCode = async () => {
    setErrorMsg('');
    try {
      const text = await navigator.clipboard.readText();
      const pastedCode = text.replace(/\D/g, '').slice(0, 6);
      if (!pastedCode) {
        setErrorMsg('No 6 digit code found in your clipboard.');
        return;
      }
      setCode(pastedCode);
      showToast('Code pasted.', 'success');
    } catch {
      setErrorMsg('Clipboard access was blocked. Long press the code box and paste manually.');
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
                : `We sent a secure sign-in email to ${email}. Use the code below for app testing, or tap the sign-in link from your mail app.`}
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
            <form onSubmit={handleCodeSubmit} className="auth-card-form">
              <div className="auth-email-sent-panel">
                <div className="auth-email-sent-icon">
                  <Mail size={26} />
                </div>
                <h2>Verify your email</h2>
                <p>
                  Check your inbox for the secure sign-in message. For local Android testing, enter
                  <strong> 123456</strong>.
                </p>
                <div className="auth-email-sent-address">{email}</div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signin-code">
                  Sign-In Code <span className="required-tag">*</span>
                </label>
                <div className="input-with-icon">
                  <KeyRound size={18} className="input-icon" />
                  <input
                    id="signin-code"
                    name="one-time-code"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    className="form-input"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoFocus
                    required
                    disabled={isLoading}
                  />
                </div>
                <span className="form-hint">Use the code sent by the app flow. Local test code: 123456.</span>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-block auth-submit-btn"
                onClick={handlePasteCode}
                disabled={isLoading}
              >
                <ClipboardPaste size={18} />
                <span>Paste Code</span>
              </button>

              <button type="submit" className="btn btn-primary btn-lg btn-block auth-submit-btn" disabled={isLoading}>
                <span>Verify & Continue</span>
                <ArrowRight size={18} />
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
            </form>
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
