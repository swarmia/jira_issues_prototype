import type { CSSProperties } from 'react';

// Migrated from ChildIssues.module.css. Browser-state rules live in styles/interaction.css.
export const styles = {
  "header": {
    "display": "flex",
    "alignItems": "center",
    "justifyContent": "space-between",
    "marginTop": "32px",
    "marginBottom": "12px"
  },
  "title": {
    "fontFamily": "var(--fontFactorA)",
    "fontSize": "16px",
    "lineHeight": "24px",
    "fontWeight": "700",
    "margin": "0"
  },
  "counts": {
    "display": "flex",
    "alignItems": "center",
    "gap": "12px",
    "fontSize": "13px",
    "color": "var(--textSecondary)"
  },
  "count": {
    "display": "inline-flex",
    "alignItems": "center",
    "gap": "6px",
    "fontVariantNumeric": "tabular-nums"
  },
  "dot": {
    "width": "8px",
    "height": "8px",
    "borderRadius": "var(--radiusRound)",
    "flex": "none"
  },
  "list": {
    "border": "1px solid var(--strokeLight)",
    "borderRadius": "var(--radiusLarge)",
    "overflow": "hidden"
  },
  "row": {
    "display": "grid",
    "gridTemplateColumns": "8px 88px 1fr 110px 96px 18px",
    "alignItems": "center",
    "gap": "12px",
    "padding": "8px 16px",
    "fontSize": "14px",
    "lineHeight": "20px",
    "color": "var(--textPrimary)",
    "textDecoration": "none"
  },
  "key": {
    "color": "var(--textSecondary)",
    "fontVariantNumeric": "tabular-nums"
  },
  "childTitle": {
    "overflow": "hidden",
    "textOverflow": "ellipsis",
    "whiteSpace": "nowrap"
  },
  "status": {
    "color": "var(--textSecondary)",
    "fontSize": "13px"
  },
  "date": {
    "color": "var(--textSecondary)",
    "fontSize": "13px",
    "textAlign": "right",
    "fontVariantNumeric": "tabular-nums"
  },
} satisfies Record<string, CSSProperties>;
