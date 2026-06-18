interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="error" role="alert">
      <p>{message}</p>
      <div className="actions">
        <button onClick={onRetry} className="btn-retry">
          Retry
        </button>
      </div>
    </div>
  );
}
