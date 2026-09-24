import { useState } from 'react';
import type { Effort } from '../gql/types';
import { formatFte, formatMonth, formatPercent } from '../lib/format';
import { Avatar } from './Avatar';
import { styles as cardStyles } from './Card.styles';
import { styles } from './EffortCard.styles';
import { Icon } from './Icon';
import { Metric } from './Metric';

type EffortView = 'total' | 'contributors';

export function EffortCard({ effort }: { effort: Effort }) {
  const [view, setView] = useState<EffortView>('total');
  const maxMonthly = Math.max(1, ...effort.monthly.map(point => point.fte));

  return (
    <section style={cardStyles.card} data-ui="Card.card">
      <div style={cardStyles.header} data-ui="Card.header">
        <h3 style={cardStyles.title} data-ui="Card.title">
          Effort
          <span title="Engineering time spent on this issue, in full-time-equivalent months.">
            <Icon name="InfoCircle" size={14} color="var(--textSecondary)" />
          </span>
        </h3>
        <div style={cardStyles.segmented} data-ui="Card.segmented" role="tablist" aria-label="Effort breakdown">
          {(['total', 'contributors'] as const).map(value => (
            <button
              key={value}
              role="tab"
              aria-selected={view === value}
              onClick={() => setView(value)}
              style={{ ...cardStyles.segmentedButton, ...(view === value ? cardStyles.segmentedButtonActive : {}) }}
            >
              {value === 'total' ? 'Total' : 'Contributors'}
            </button>
          ))}
        </div>
      </div>

      <div style={cardStyles.metrics} data-ui="Card.metrics">
        <Metric label="Lifetime" value={formatFte(effort.lifetimeFte)} />
      </div>

      {view === 'total' ? (
        effort.monthly.length === 0 ? (
          <div style={styles.empty} data-ui="EffortCard.empty">No effort logged yet</div>
        ) : (
          <div
            style={{ ...styles.chart, gridTemplateColumns: `24px repeat(${effort.monthly.length}, minmax(0, 1fr))` }} data-ui="EffortCard.chart"
          >
            <div style={styles.axis} data-ui="EffortCard.axis">
              <span>{maxMonthly.toFixed(maxMonthly < 1 ? 1 : 0)}</span>
              <span>0</span>
            </div>
            {effort.monthly.map(point => (
              <div
                key={point.month}
                style={styles.barCell} data-ui="EffortCard.barCell"
                title={`${formatMonth(point.month)}: ${formatFte(point.fte)}`}
              >
                <div
                  style={{ ...styles.bar, height: `${Math.max(0, (point.fte / maxMonthly) * 100)}%` }} data-ui="EffortCard.bar"
                />
              </div>
            ))}
            <div />
            {effort.monthly.map(point => (
              <div key={`${point.month}-label`} style={styles.barLabel} data-ui="EffortCard.barLabel">
                {formatMonth(point.month)}
              </div>
            ))}
          </div>
        )
      ) : (
        <div style={styles.contributors} data-ui="EffortCard.contributors">
          {effort.contributors.map(contributor => (
            <div key={contributor.author.id} style={styles.contributor} data-ui="EffortCard.contributor">
              <Avatar initials={contributor.author.initials} name={contributor.author.name} />
              <span style={styles.contributorName} data-ui="EffortCard.contributorName">{contributor.author.name}</span>
              <div style={styles.shareTrack} data-ui="EffortCard.shareTrack" title={formatPercent(contributor.share)}>
                <div style={{ ...styles.shareFill, width: formatPercent(contributor.share) }} data-ui="EffortCard.shareFill" />
              </div>
              <span className="tabularNums">{formatFte(contributor.fte)}</span>
            </div>
          ))}
          {effort.contributors.length === 0 && <div style={styles.empty} data-ui="EffortCard.empty">No contributors yet</div>}
        </div>
      )}
    </section>
  );
}
