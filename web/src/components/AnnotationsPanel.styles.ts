import type { CSSProperties } from 'react';

// Migrated from AnnotationsPanel.module.css. Browser-state rules live in styles/interaction.css.
export const styles = {
  "panel": {
    "border": "1px solid var(--strokeLight)",
    "borderRadius": "var(--radiusLarge)",
    "padding": "16px 20px",
    "marginTop": "24px",
    "boxShadow": "var(--shadowPaper1)"
  },
  "title": {
    "fontFamily": "var(--fontFactorA)",
    "fontWeight": "700",
    "fontSize": "16px",
    "lineHeight": "24px"
  },
  "composer": {
    "marginTop": "12px"
  },
  "textarea": {
    "width": "100%",
    "border": "1px solid var(--strokeDark)",
    "borderRadius": "var(--radiusMedium)",
    "padding": "10px 12px",
    "fontFamily": "var(--fontInter)",
    "fontSize": "14px",
    "lineHeight": "20px",
    "resize": "vertical",
    "color": "var(--textPrimary)"
  },
  "composerActions": {
    "display": "flex",
    "alignItems": "center",
    "justifyContent": "flex-end",
    "gap": "8px",
    "marginTop": "8px"
  },
  "error": {
    "color": "var(--red500)",
    "fontSize": "13px",
    "marginRight": "auto"
  },
  "list": {
    "display": "flex",
    "flexDirection": "column",
    "gap": "16px",
    "marginTop": "16px"
  },
  "note": {
    "display": "flex",
    "gap": "12px"
  },
  "noteBody": {
    "minWidth": "0"
  },
  "noteMeta": {
    "display": "flex",
    "alignItems": "center",
    "gap": "10px",
    "fontSize": "13px",
    "color": "var(--textSecondary)"
  },
  "noteAuthor": {
    "fontWeight": "700",
    "color": "var(--textPrimary)"
  },
  "deleteButton": {
    "border": "none",
    "background": "none",
    "padding": "0",
    "fontSize": "13px",
    "color": "var(--textSecondary)",
    "cursor": "pointer",
    "opacity": "0",
    "transition": "opacity 0.15s ease"
  },
  "noteText": {
    "margin": "4px 0 0",
    "fontSize": "14px",
    "lineHeight": "20px",
    "textWrap": "pretty"
  },
  "noteSource": {
    "padding": "0 6px",
    "borderRadius": "var(--radiusSmall)",
    "background": "var(--labelPromoSoftBg)",
    "color": "var(--labelPromoSoftText)",
    "fontSize": "12px"
  },
} satisfies Record<string, CSSProperties>;
