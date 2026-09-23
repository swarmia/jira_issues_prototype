import type { IssueStatus } from '../gql/types';

/** Keyed by Swarmia status. `null` covers source statuses with no mapping. */
export const statusColor: Record<IssueStatus, string> = {
  TODO: 'var(--blue200)',
  IN_PROGRESS: 'var(--purple500)',
  DONE: 'var(--green500)',
  WONT_DO: 'var(--black300)',
};

export const statusLabel: Record<IssueStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
  WONT_DO: "Won't do",
};

/** An unmapped source status is shown, but greyed — it drives no metric. */
export const UNMAPPED_COLOR = 'var(--black200)';

export function colorForStatus(status: IssueStatus | null): string {
  return status ? statusColor[status] : UNMAPPED_COLOR;
}

export function labelForStatus(status: IssueStatus | null): string {
  return status ? statusLabel[status] : 'Unmapped';
}

/** The order the lifecycle bar renders categories in. */
export const STATUS_ORDER: IssueStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'WONT_DO'];
