import { useState } from 'react';
import type { Effort } from '../gql/types';
import { formatFte, formatMonth, formatPercent } from '../lib/format';
import { Avatar } from './Avatar';
import cardStyles from './Card.module.css';
import styles from './EffortCard.module.css';
import { Icon } from './Icon';
import { Metric } from './Metric';

type EffortView = 'total' | 'contributors';

export function EffortCard({ effort }: { effort: Effort }) {
  const [view, setView] = useState<EffortView>('total');
  const maxMonthly = Math.max(1, ...effort.monthly.map(point => point.fte));

  return (
    <section className={cardStyles.card}>
      <div className={cardStyles.header}>
        <h3 className={cardStyles.title}>
          Effort
          <span title="Engineering time spent on this issue, in full-time-equivalent months.">
            <Icon name="InfoCircle" size={14} color="var(--textSecondary)" />
          </span>
        </h3>
        <div className={cardStyles.segmented} role="tablist" aria-label="Effort breakdown">
          {(['total', 'contributors'] as const).map(value => (
            <button
              key={value}
              role="tab"
              aria-selected={view === value}
              onClick={() => setView(value)}
              className={`${cardStyles.segmentedButton} ${
                view === value ? cardStyles.segmentedButtonActive : ''
              }`}
            >
              {value === 'total' ? 'Total' : 'Contributors'}
            </button>
          ))}
        </div>
      </div>

      <div className={cardStyles.metrics}>
        <Metric label="Lifetime" value={formatFte(effort.lifetimeFte)} />
      </div>

      {view === 'total' ? (
        effort.monthly.length === 0 ? (
          <div className={styles.empty}>No effort logged yet</div>
        ) : (
          <div
            className={styles.chart}
            style={{ gridTemplateColumns: `24px repeat(${effort.monthly.length}, minmax(0, 1fr))` }}
          >
            <div className={styles.axis}>
              <span>{maxMonthly.toFixed(maxMonthly < 1 ? 1 : 0)}</span>
              <span>0</span>
            </div>
            {effort.monthly.map(point => (
              <div
                key={point.month}
                className={styles.barCell}
                title={`${formatMonth(point.month)}: ${formatFte(point.fte)}`}
              >
                <div
                  className={styles.bar}
                  style={{ height: `${Math.max(0, (point.fte / maxMonthly) * 100)}%` }}
                />
              </div>
            ))}
            <div />
            {effort.monthly.map(point => (
              <div key={`${point.month}-label`} className={styles.barLabel}>
                {formatMonth(point.month)}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className={styles.contributors}>
          {effort.contributors.map(contributor => (
            <div key={contributor.author.id} className={styles.contributor}>
              <Avatar initials={contributor.author.initials} name={contributor.author.name} />
              <span className={styles.contributorName}>{contributor.author.name}</span>
              <div className={styles.shareTrack} title={formatPercent(contributor.share)}>
                <div className={styles.shareFill} style={{ width: formatPercent(contributor.share) }} />
              </div>
              <span className="tabularNums">{formatFte(contributor.fte)}</span>
            </div>
          ))}
          {effort.contributors.length === 0 && <div className={styles.empty}>No contributors yet</div>}
        </div>
      )}
    </section>
  );
}
