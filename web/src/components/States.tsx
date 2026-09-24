import { styles } from './States.styles';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div style={styles.state} data-ui="States.state" role="status">
      <span style={styles.spinner} data-ui="States.spinner" />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={styles.state} data-ui="States.state">
      <span style={styles.errorTitle} data-ui="States.errorTitle">Something went wrong</span>
      <span style={styles.errorMessage} data-ui="States.errorMessage">{message}</span>
      {onRetry && (
        <button style={styles.retry} data-ui="States.retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div style={styles.state} data-ui="States.state">{message}</div>;
}
