import type { ReactNode } from 'react';
import { styles } from './Card.styles';

interface MetricProps {
  label: string;
  value: ReactNode;
  suffix?: ReactNode;
  swatch?: string;
}

export function Metric({ label, value, suffix, swatch }: MetricProps) {
  return (
    <div>
      <div style={styles.metricLabel} data-ui="Card.metricLabel">{label}</div>
      <div style={styles.metricValue} data-ui="Card.metricValue">
        {swatch && <span style={{ ...styles.swatch, background: swatch }} data-ui="Card.swatch" />}
        <span>{value}</span>
        {suffix && <span style={styles.metricSuffix} data-ui="Card.metricSuffix">{suffix}</span>}
      </div>
    </div>
  );
}
