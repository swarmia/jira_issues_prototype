import type { CSSProperties } from 'react';

export type IconName =
  | 'Agents'
  | 'AiSparkles'
  | 'ArrowLeft'
  | 'Capitalization'
  | 'Check'
  | 'ChevronDown'
  | 'ChevronRight'
  | 'Dots'
  | 'Edit'
  | 'InfoCircle'
  | 'Metrics'
  | 'NavHome'
  | 'NavInitiative'
  | 'NavPullRequests'
  | 'NavSurveys'
  | 'NavWorkingAgreements'
  | 'Signal';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: CSSProperties;
}

/** Renders an SVG as a mask so it picks up the surrounding text color. */
export function Icon({ name, size = 16, color = 'currentColor', style }: IconProps) {
  const mask = `url(/icons/${name}.svg) center / contain no-repeat`;
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flex: 'none',
        display: 'inline-block',
        background: color,
        WebkitMask: mask,
        mask,
        ...style,
      }}
    />
  );
}
