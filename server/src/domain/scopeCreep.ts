/**
 * The `scopeCreep` column group: how much an issue grew after work started.
 *
 * Transcribed from `computeScopeCreep` in
 * apps/rapu/src/db/materialized/SwarmiaIssues/scopeCreep.ts, including its two
 * null cases, which are distinct from a real 0:
 *
 *   - never started      -> the ratio is undefined
 *   - no initial children -> nothing to divide by
 *
 * A real 0 means the issue started, had initial children, and nothing crept in.
 *
 * Boundary is the start of the day AFTER `startedAt`: children created before it
 * are initial, on or after it are creep. Won't-do children are excluded by the
 * caller.
 */

export interface ScopeCreep {
  initialIssueCount: number;
  creepedIssueCount: number;
  scopeIncrease: number | null;
}

export function computeScopeCreep({
  startedAt,
  childCreatedAts,
}: {
  startedAt: Date | null;
  childCreatedAts: readonly Date[];
}): ScopeCreep {
  if (!startedAt) {
    return {
      initialIssueCount: childCreatedAts.length,
      creepedIssueCount: 0,
      scopeIncrease: null,
    };
  }

  const startOfDay = Date.UTC(
    startedAt.getUTCFullYear(),
    startedAt.getUTCMonth(),
    startedAt.getUTCDate(),
  );
  const boundary = startOfDay + 86_400_000;

  const initialIssueCount = childCreatedAts.filter(at => at.getTime() < boundary).length;
  const creepedIssueCount = childCreatedAts.filter(at => at.getTime() >= boundary).length;

  return {
    initialIssueCount,
    creepedIssueCount,
    scopeIncrease: initialIssueCount > 0 ? creepedIssueCount / initialIssueCount : null,
  };
}
