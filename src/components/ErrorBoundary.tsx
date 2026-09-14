import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[FindLostPuppy ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = import.meta.env.BASE_URL || '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#FAF7F2',
          fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif"
        }}>
          <div style={{
            maxWidth: '480px',
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '36px 28px',
            boxShadow: '0 12px 28px -4px rgba(36, 32, 29, 0.08)',
            border: '1px solid #EBE3D5'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐾</div>
            <h1 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '24px',
              fontWeight: 700,
              color: '#24201D',
              marginBottom: '10px'
            }}>
              Oops! Our puppy took a wrong turn
            </h1>
            <p style={{ color: '#79716B', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
              We ran into a small hiccup while loading this page. Don't worry, your pet and community data are completely safe!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#E06D44',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(224, 109, 68, 0.3)'
                }}
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#F4EFE6',
                  color: '#524B46',
                  border: '1px solid #EBE3D5',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
