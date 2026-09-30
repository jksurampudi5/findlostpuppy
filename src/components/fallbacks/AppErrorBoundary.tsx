import { Component, type ErrorInfo, type ReactNode } from 'react';
import { FallbackShell } from './FallbackShell';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    try {
      sessionStorage.setItem('findlostpuppy_last_crash', new Date().toISOString());
    } catch {}
    if (import.meta.env.DEV) {
      console.error('[FindLostPuppy] Component error:', error, errorInfo);
    }
  }

  private retry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  private goHome = () => {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    window.location.assign(`${base}/homepage`);
  };

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
