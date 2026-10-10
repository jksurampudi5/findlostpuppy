import React from 'react';
import { PawPrint, Globe, MapPin, Heart } from 'lucide-react';

interface GeoBlockPageProps {
  countryName?: string;
  countryCode?: string;
}

/**
 * Shown when a visitor's IP is detected outside India.
 * FindLostPuppy is an India-only service — this page explains why
 * and shows a friendly, non-alarming message.
 */
export function GeoBlockPage({ countryName, countryCode }: GeoBlockPageProps) {
  const displayCountry = countryName || countryCode || 'your region';

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        {/* Flag + Paw */}
        <div style={styles.iconRow}>
          <div style={styles.flagBubble}>
            <span style={styles.flagEmoji}>🇮🇳</span>
          </div>
          <div style={styles.pawBubble}>
            <PawPrint size={22} color="#FF7900" />
          </div>
        </div>

        {/* Headline */}
        <h1 style={styles.title}>India-Only Service</h1>
        <p style={styles.subtitle}>FindLostPuppy is available exclusively in India.</p>

        {/* Country notice */}
        <div style={styles.regionBox}>
          <Globe size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
          <span style={styles.regionText}>
            Your current region appears to be&nbsp;
            <strong style={{ color: '#CBD5E1' }}>{displayCountry}</strong>.
          </span>
        </div>

        {/* Explanation */}
        <p style={styles.body}>
          This platform connects pet owners, community volunteers, and local
          rescue networks across India. Our entire infrastructure — boundaries,
          phone validation, location data, and emergency contacts — is built
          specifically for India.
        </p>

        <div style={styles.divider} />

        {/* Why India only */}
        <div style={styles.reasonList}>
          <ReasonItem icon={<MapPin size={15} />} text="Hyper-local Indian district &amp; mandal boundaries" />
          <ReasonItem icon={<PawPrint size={15} />} text="Community rescue networks across Indian cities" />
          <ReasonItem icon={<Heart size={15} />} text="Emergency contacts tied to Indian phone networks" />
        </div>

        {/* Footer note */}
        <p style={styles.footNote}>
          If you are in India and seeing this message, you may be connected via a
          VPN or proxy. Please disable it and refresh the page.
        </p>

        <button
          style={styles.retryBtn}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>

      {/* Subtle paw watermark */}
      <div style={styles.watermark} aria-hidden="true">🐾</div>
    </div>
  );
}

function ReasonItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={styles.reasonItem}>
      <span style={styles.reasonIcon}>{icon}</span>
      <span style={styles.reasonText} dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
}

// ── Inline styles (no external CSS dependency, renders before App CSS loads) ─

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #05050A 0%, #0D0F14 60%, #111620 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  card: {
    background: 'linear-gradient(145deg, #13151A 0%, #0F1115 100%)',
    border: '1px solid rgba(255,121,0,0.18)',
    borderRadius: '24px',
    padding: '40px 36px',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
    position: 'relative',
    zIndex: 1,
  },
  iconRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '28px',
  },
  flagBubble: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'rgba(255,121,0,0.10)',
    border: '1px solid rgba(255,121,0,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    lineHeight: 1,
  },
  flagEmoji: {
    fontSize: '28px',
  },
  pawBubble: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(255,121,0,0.08)',
    border: '1px solid rgba(255,121,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#FFFFFF',
    margin: '0 0 6px',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#94A3B8',
    margin: '0 0 20px',
  },
  regionBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(255,121,0,0.07)',
    border: '1px solid rgba(255,121,0,0.15)',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '20px',
    fontSize: '13.5px',
    color: '#94A3B8',
  },
  regionText: {
    lineHeight: 1.4,
  },
  body: {
    fontSize: '14px',
    color: '#8898AA',
    lineHeight: 1.65,
    margin: '0 0 20px',
  },
  divider: {
    height: '1px',
    background: 'rgba(255,255,255,0.06)',
    margin: '4px 0 18px',
  },
  reasonList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '24px',
  },
  reasonItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  reasonIcon: {
    color: '#FF7900',
    marginTop: '1px',
    flexShrink: 0,
  },
  reasonText: {
    fontSize: '13.5px',
    color: '#94A3B8',
    lineHeight: 1.45,
  },
  footNote: {
    fontSize: '12.5px',
    color: '#64748B',
    lineHeight: 1.55,
    marginBottom: '24px',
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  retryBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #FF9432 0%, #FF7900 50%, #E86500 100%)',
    border: 'none',
    borderRadius: '14px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '0.2px',
    transition: 'opacity 0.2s',
  },
  watermark: {
    position: 'fixed',
    bottom: '-20px',
    right: '-20px',
    fontSize: '160px',
    opacity: 0.03,
    pointerEvents: 'none',
    userSelect: 'none',
    zIndex: 0,
    lineHeight: 1,
  },
};
