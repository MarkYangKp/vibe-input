import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>应用出错了</h1>
          <p style={{ color: 'var(--text-secondary, #666)', marginBottom: '1.5rem' }}>
            请尝试刷新页面或重启应用
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'var(--accent, #4f46e5)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
