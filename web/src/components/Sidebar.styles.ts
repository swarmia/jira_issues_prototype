import type { CSSProperties } from 'react';

// Migrated from Sidebar.module.css. Browser-state rules live in styles/interaction.css.
export const styles = {
  "sidebar": {
    "width": "220px",
    "flex": "none",
    "background": "var(--blue900)",
    "padding": "16px 10px",
    "display": "flex",
    "flexDirection": "column",
    "position": "sticky",
    "top": "0",
    "height": "100vh"
  },
  "logo": {
    "padding": "4px 10px 18px",
    "display": "flex"
  },
  "nav": {
    "display": "flex",
    "flexDirection": "column",
    "gap": "2px"
  },
  "item": {
    "display": "flex",
    "alignItems": "center",
    "gap": "12px",
    "padding": "8px 10px",
    "borderRadius": "8px",
    "fontFamily": "var(--fontFactorA)",
    "fontSize": "15px",
    "fontWeight": "500",
    "color": "rgba(255, 255, 255, 0.9)",
    "cursor": "pointer",
    "transition": "background 0.2s ease"
  },
  "active": {
    "background": "rgba(255, 255, 255, 0.14)"
  },
  "label": {
    "flex": "1"
  },
  "dot": {
    "width": "8px",
    "height": "8px",
    "borderRadius": "9999px",
    "background": "var(--dataPink)"
  },
} satisfies Record<string, CSSProperties>;
