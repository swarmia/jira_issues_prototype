import type { CSSProperties } from 'react';

// Migrated from Card.module.css. Browser-state rules live in styles/interaction.css.
export const styles = {
  "card": {
    "border": "1px solid var(--strokeLight)",
    "borderRadius": "var(--radiusLarge)",
    "padding": "20px 24px 16px",
    "boxShadow": "var(--shadowPaper1)",
    "display": "flex",
    "flexDirection": "column",
    "background": "var(--mainBackground)"
  },
  "header": {
    "display": "flex",
    "alignItems": "center",
    "justifyContent": "space-between",
    "gap": "12px"
  },
  "title": {
    "fontFamily": "var(--fontFactorA)",
    "fontWeight": "700",
    "fontSize": "16px",
    "lineHeight": "24px",
    "display": "flex",
    "alignItems": "center",
    "gap": "6px"
  },
  "metrics": {
    "display": "flex",
    "flexWrap": "wrap",
    "gap": "28px",
    "marginTop": "20px",
    "paddingLeft": "6px"
  },
  "metricLabel": {
    "fontSize": "12px",
    "fontWeight": "500",
    "color": "var(--textSecondary)"
  },
  "metricValue": {
    "display": "flex",
    "alignItems": "center",
    "gap": "8px",
    "fontFamily": "var(--fontFactorA)",
    "fontWeight": "700",
    "fontSize": "20px",
    "lineHeight": "28px",
    "marginTop": "2px"
  },
  "metricSuffix": {
    "fontFamily": "var(--fontInter)",
    "fontWeight": "500",
    "fontSize": "13px",
    "color": "var(--textSecondary)"
  },
  "swatch": {
    "width": "14px",
    "height": "14px",
    "borderRadius": "9999px",
    "flex": "none"
  },
  "segmented": {
    "display": "flex",
    "border": "1px solid var(--strokeLight)",
    "borderRadius": "var(--radiusMedium)",
    "padding": "2px",
    "gap": "2px"
  },
  "segmentedButton": {
    "border": "none",
    "background": "transparent",
    "fontFamily": "var(--fontFactorA)",
    "fontWeight": "500",
    "fontSize": "14px",
    "height": "26px",
    "padding": "0 12px",
    "borderRadius": "4px",
    "cursor": "pointer",
    "color": "var(--textPrimary)"
  },
  "segmentedButtonActive": {
    "background": "var(--surfaceSelected)"
  },
} satisfies Record<string, CSSProperties>;
