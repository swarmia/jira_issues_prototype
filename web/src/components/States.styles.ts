import type { CSSProperties } from 'react';

// Migrated from States.module.css. Browser-state rules live in styles/interaction.css.
export const styles = {
  "state": {
    "display": "flex",
    "flexDirection": "column",
    "alignItems": "center",
    "justifyContent": "center",
    "gap": "8px",
    "padding": "64px 16px",
    "color": "var(--textSecondary)",
    "fontSize": "14px"
  },
  "spinner": {
    "width": "20px",
    "height": "20px",
    "borderRadius": "9999px",
    "border": "2px solid var(--strokeDark)",
    "borderTopColor": "var(--purple500)",
    "animation": "spin 0.8s linear infinite"
  },
  "errorTitle": {
    "fontFamily": "var(--fontFactorA)",
    "fontWeight": "700",
    "fontSize": "16px",
    "color": "var(--textPrimary)"
  },
  "errorMessage": {
    "maxWidth": "480px",
    "textAlign": "center"
  },
  "retry": {
    "border": "none",
    "background": "var(--buttonSecondaryBg)",
    "height": "32px",
    "padding": "0 14px",
    "borderRadius": "var(--radiusMedium)",
    "fontFamily": "var(--fontFactorA)",
    "fontWeight": "500",
    "fontSize": "14px",
    "cursor": "pointer",
    "color": "var(--textPrimary)"
  },
} satisfies Record<string, CSSProperties>;
