import { Component, type ErrorInfo, type ReactNode } from 'react';
import { FallbackShell } from './FallbackShell';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  /** Switches the boundary into its recovery state after a descendant render error. */
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  /** Best-effort records a crash timestamp in session storage and logs error details only in development. */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    try {
      sessionStorage.setItem('findlostpuppy_last_crash', new Date().toISOString());
    } catch {}
    if (import.meta.env.DEV) {
      console.error('[FindLostPuppy] Component error:', error, errorInfo);
    }
  }

  /** Clears the error state and reloads the current page. */
  private retry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  /** Navigates to the homepage under the configured application base URL. */
  private goHome = () => {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    window.location.assign(`${base}/homepage`);
  };

  /** Returns children normally, or the recovery shell with retry and home actions after an error. */
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <FallbackShell
        fullScreen
        title="Something went wrong. Please try again."
        message="Your saved information remains on this device. You can retry or return to the dashboard."
      >
        <button type="button" className="fallback-button fallback-button--primary" onClick={this.retry}>Retry</button>
        <button type="button" className="fallback-button" onClick={this.goHome}>Go to Home</button>
      </FallbackShell>
    );
  }
}
