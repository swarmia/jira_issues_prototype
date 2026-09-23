import type { IssueStatus } from '../gql/types';
import { colorForStatus } from '../lib/statusColors';
import { Icon } from './Icon';

interface StatusBadgeProps {
  /** Raw tracker status — what the team actually calls it. */
  sourceStatus: string | null;
  /** Swarmia status. Null when the source status is unmapped. */
  status: IssueStatus | null;
}

export function StatusBadge({ sourceStatus, status }: StatusBadgeProps) {
  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      title={status === null ? 'This status is not mapped to a Swarmia status' : undefined}
    >
      {status === 'DONE' ? (
        <Icon name="Check" size={12} color="var(--green600)" />
      ) : (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 9999,
            background: colorForStatus(status),
            display: 'inline-block',
          }}
        />
      )}
      {sourceStatus ?? 'No status'}
    </span>
  );
}
