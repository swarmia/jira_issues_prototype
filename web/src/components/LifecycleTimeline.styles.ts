import type { CSSProperties } from 'react';

export const styles = {
  section: {
    marginTop: '40px',
  },
  title: {
    margin: '0 0 16px',
  },
  timeline: {
    position: 'relative',
  },
  bar: {
    display: 'flex',
    gap: '2px',
    height: '12px',
    background: 'var(--surfaceHover)',
    borderRadius: '2px',
  },
  segment: {
    minWidth: '6px',
    height: '100%',
    borderRadius: '2px',
    transition: 'opacity 0.2s ease',
  },
  tooltip: {
    position: 'absolute',
    bottom: '20px',
    transform: 'translateX(-50%)',
    background: 'var(--surfaceTooltip)',
    color: 'var(--white)',
    borderRadius: 'var(--radiusMedium)',
    padding: '8px 10px',
    fontSize: '13px',
    lineHeight: '18px',
    whiteSpace: 'nowrap',
    boxShadow: 'var(--shadowMedium)',
    pointerEvents: 'none',
    zIndex: '2',
  },
  tooltipTitle: {
    fontWeight: '700',
  },
  tooltipRange: {
    color: 'var(--black200)',
  },
  axis: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '6px',
    fontSize: '12px',
    color: 'var(--textChartAxis)',
  },
} satisfies Record<string, CSSProperties>;
