import type { ReactNode } from 'react';
import appLogo from '../../assets/app_logo.png';

interface FallbackShellProps {
  title: string;
  message: string;
  children?: ReactNode;
  icon?: ReactNode;
  fullScreen?: boolean;
  loading?: boolean;
}

/** Renders the shared fallback layout as a loading status or alert, with optional recovery actions. */
export function FallbackShell({
  title,
  message,
  children,
  icon,
  fullScreen = false,
  loading = false,
}: FallbackShellProps) {
  return (
    <section
      className={`fallback-shell ${fullScreen ? 'fallback-shell--fullscreen' : ''}`}
      role={loading ? 'status' : 'alert'}
      aria-live="polite"
      aria-busy={loading}
    >
      <div className="fallback-card">
        <div className={`fallback-visual ${loading ? 'is-loading' : ''}`} aria-hidden="true">
          {icon || <img src={appLogo} alt="" />}
        </div>
        <h1>{title}</h1>
        <p>{message}</p>
        {children && <div className="fallback-actions">{children}</div>}
      </div>
    </section>
  );
}
