import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock } from 'lucide-react';
import { PRIVACY_POLICY } from '../data/legal/legalContent';

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#08090A', color: '#E1E4EA', paddingBottom: '60px' }}>
      {/* Top sticky nav */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(12, 14, 18, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '14px 20px',
        }}
      >
        <div
          style={{
            maxWidth: '860px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '9999px',
              padding: '8px 16px',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} style={{ color: '#FF9800' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#A0AEC0' }}>Official Policy</span>
          </div>
        </div>
      </header>

      {/* Main Content Wrap */}
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 20px' }}>
        {/* Title Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(255, 121, 0, 0.12), rgba(15, 23, 42, 0.6))',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            borderRadius: '20px',
            padding: '28px 24px',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(255, 152, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FF9800',
              }}
            >
              <Lock size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                {PRIVACY_POLICY.title}
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#A0AEC0' }}>
                Version {PRIVACY_POLICY.version} • Effective {PRIVACY_POLICY.lastUpdated}
              </p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#CBD5E1' }}>
            FindLostPuppy is dedicated to helping reunite lost pets with their families while strictly protecting
            owner privacy, phone numbers, and exact home addresses through administrative boundary masking.
          </p>
        </div>

        {/* Policy Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {PRIVACY_POLICY.sections.map((section, idx) => (
            <section
              key={idx}
              style={{
                background: 'rgba(18, 20, 26, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '22px 24px',
              }}
            >
              <h2
                style={{
                  margin: '0 0 14px',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#FFB74D',
                  letterSpacing: '-0.01em',
                }}
              >
                {section.heading}
              </h2>
              {Array.isArray(section.content) ? (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '14px',
                    lineHeight: 1.65,
                    color: '#D1D5DB',
                  }}
                >
                  {section.content.map((item, itemIdx) => (
                    <li key={itemIdx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.65, color: '#D1D5DB' }}>
                  {section.content}
                </p>
              )}
            </section>
          ))}
        </div>

        {/* Contact & Grievance Box */}
        <div
          style={{
            marginTop: '36px',
            background: 'rgba(12, 14, 18, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Questions or Privacy Requests?</div>
            <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '2px' }}>
              Direct data inquiries or account deletion requests to{' '}
              <a href="mailto:jksurampudi5@gmail.com" style={{ color: '#FF9800', textDecoration: 'underline' }}>
                jksurampudi5@gmail.com
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/homepage')}
            style={{
              background: '#FF7900',
              color: '#111827',
              border: 'none',
              borderRadius: '9999px',
              padding: '10px 22px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
};
