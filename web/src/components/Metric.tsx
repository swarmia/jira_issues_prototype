import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface MetricProps {
  label: string;
  value: ReactNode;
  suffix?: ReactNode;
  swatch?: string;
}

export function Metric({ label, value, suffix, swatch }: MetricProps) {
  return (
    <div>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue}>
        {swatch && <span className={styles.swatch} style={{ background: swatch }} />}
        <span>{value}</span>
        {suffix && <span className={styles.metricSuffix}>{suffix}</span>}
      </div>
    </div>
  );
}
