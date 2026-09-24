import type { CSSProperties } from 'react';

// Migrated from BurnupChart.module.css. Browser-state rules live in styles/interaction.css.
export const styles = {
  "wrapper": {
    "position": "relative",
    "marginTop": "16px"
  },
  "svg": {
    "width": "100%",
    "height": "auto",
    "display": "block",
    "fontFamily": "var(--fontInter)"
  },
  "tooltip": {
    "position": "absolute",
    "top": "0",
    "transform": "translateX(-50%)",
    "background": "var(--surfaceTooltip)",
    "color": "var(--white)",
    "borderRadius": "var(--radiusMedium)",
    "padding": "6px 10px",
    "fontSize": "13px",
    "lineHeight": "18px",
    "whiteSpace": "nowrap",
    "boxShadow": "var(--shadowMedium)",
    "pointerEvents": "none"
  },
  "tooltipTitle": {
    "fontWeight": "700"
  },
} satisfies Record<string, CSSProperties>;
