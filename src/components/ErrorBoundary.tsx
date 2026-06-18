import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(): void {
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error" role="alert">
          <p>{this.state.error?.message ?? 'Something went wrong.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-retry"
          >
            Reload app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
