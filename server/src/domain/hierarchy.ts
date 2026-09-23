/**
 * The `ancestors`, `descendants` and `descendantStatusCounts` column groups.
 *
 * rapu stores `ancestor_ids` (direct parent up to the root) and `descendant_ids`
 * (the whole subtree, INCLUDING the issue itself) as materialized arrays. The
 * self-inclusion is load-bearing: `isLeafIssue` is `cardinality(descendant_ids) = 1`,
 * and the status counts cover the issue plus its subtree.
 */

import type { IssueRecord, IssueStatus } from '../data/store.js';

export type DescendantStatusCounts = Record<IssueStatus, number>;

export function ancestorIdsOf(issue: IssueRecord, byId: Map<string, IssueRecord>): string[] {
  const ancestors: string[] = [];
  let current = issue.parentIssueId ? byId.get(issue.parentIssueId) : undefined;
  while (current) {
    ancestors.push(current.id);
    current = current.parentIssueId ? byId.get(current.parentIssueId) : undefined;
  }
  return ancestors;
}

/** The issue's whole subtree, the issue itself first. */
export function descendantIdsOf(
  issue: IssueRecord,
  childrenByParent: Map<string, IssueRecord[]>,
): string[] {
  const collected = [issue.id];
  const queue = [...(childrenByParent.get(issue.id) ?? [])];
  while (queue.length > 0) {
    const next = queue.shift()!;
    collected.push(next.id);
    queue.push(...(childrenByParent.get(next.id) ?? []));
  }
  return collected;
}

export function emptyStatusCounts(): DescendantStatusCounts {
  return { TODO: 0, IN_PROGRESS: 0, DONE: 0, WONT_DO: 0 };
}

export function countStatuses(
  statuses: readonly (IssueStatus | null)[],
): DescendantStatusCounts {
  const counts = emptyStatusCounts();
  for (const status of statuses) {
    // An unmapped status counts towards nothing, matching the upstream
    // `if (status)` guard in descendantStatusCounts.
    if (status) counts[status] += 1;
  }
  return counts;
}
