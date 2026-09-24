import type { CSSProperties } from 'react';

// Migrated from EffortCard.module.css. Browser-state rules live in styles/interaction.css.
export const styles = {
  "chart": {
    "flex": "1",
    "minHeight": "150px",
    "display": "grid",
    "gridTemplateRows": "1fr auto",
    "columnGap": "16px",
    "marginTop": "16px"
  },
  "axis": {
    "display": "flex",
    "flexDirection": "column",
    "justifyContent": "space-between",
    "fontSize": "12px",
    "color": "var(--textChartAxis)",
    "textAlign": "right"
  },
  "barCell": {
    "display": "flex",
    "alignItems": "flex-end",
    "borderTop": "1px solid var(--strokeLight)",
    "borderBottom": "1px solid var(--strokeLight)",
    "padding": "0 12%"
  },
  "bar": {
    "width": "100%",
    "background": "var(--dataLightblue)",
    "transition": "height 0.2s ease"
  },
  "barLabel": {
    "textAlign": "center",
    "fontSize": "12px",
    "color": "var(--textChartAxis)",
    "paddingTop": "6px"
  },
  "contributors": {
    "marginTop": "16px",
    "display": "flex",
    "flexDirection": "column"
  },
  "contributor": {
    "display": "flex",
    "alignItems": "center",
    "gap": "10px",
    "padding": "10px 6px",
    "borderBottom": "1px solid var(--strokeLight)",
    "fontSize": "14px",
    "fontWeight": "500"
  },
  "contributorName": {
    "flex": "1",
    "minWidth": "0"
  },
  "shareTrack": {
    "width": "120px",
    "height": "6px",
    "borderRadius": "9999px",
    "background": "var(--blue50)",
    "overflow": "hidden",
    "flex": "none"
  },
  "shareFill": {
    "height": "100%",
    "background": "var(--dataLightblue)"
  },
  "empty": {
    "marginTop": "24px",
    "color": "var(--textSecondary)",
    "fontSize": "14px"
  },
} satisfies Record<string, CSSProperties>;
