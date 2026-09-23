import type { Issue } from '../gql/types';
import { formatDuration, formatPercent, formatPercentValue } from '../lib/format';
import cardStyles from './Card.module.css';
import { BurnupChart } from './charts/BurnupChart';
import { Metric } from './Metric';

export function ProgressCard({ issue }: { issue: Issue }) {
  const { progress, activityStatistics } = issue;
  return (
    <section className={cardStyles.card}>
      <div className={cardStyles.header}>
        <h3 className={cardStyles.title}>Progress</h3>
      </div>

      <div className={cardStyles.metrics}>
        <Metric
          label="Completed"
          value={formatPercent(progress.percent)}
          suffix={`${progress.completed}/${progress.total}`}
        />
        <Metric
          label="Lifetime"
          value={formatDuration(issue.lifetimeSeconds)}
          swatch="var(--blue200)"
        />
        <Metric
          label="In progress"
          value={
            issue.inProgressTimeSeconds === null
              ? 'Not started'
              : formatDuration(issue.inProgressTimeSeconds)
          }
          swatch="var(--purple500)"
        />
        <Metric
          label="Flow eff."
          value={formatPercentValue(issue.flowEfficiency)}
          // Days, not seconds: flow efficiency counts days with activity against
          // the business days in the window.
          suffix={`${activityStatistics.active} / ${activityStatistics.openBusinessAndActiveDays} days`}
        />
      </div>

      <BurnupChart
        points={progress.burnup}
        from={issue.createdAt}
        to={issue.completedAt ?? new Date().toISOString()}
        startedAt={issue.startedAt}
      />
    </section>
  );
}
