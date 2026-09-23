import { Link } from 'react-router-dom';
import { EmptyState } from '../components/States';

export function NotFoundPage() {
  return (
    <>
      <EmptyState message="That page does not exist." />
      <p style={{ textAlign: 'center' }}>
        <Link to="/issues">Back to issues</Link>
      </p>
    </>
  );
}
