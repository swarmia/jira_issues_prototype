import type { CSSProperties } from 'react';

// Migrated from IssueListPage.module.css. Browser-state rules live in styles/interaction.css.
export const styles = {
  "header": {
    "display": "flex",
    "alignItems": "flex-start",
    "justifyContent": "space-between",
    "gap": "24px"
  },
  "title": {
    "fontFamily": "var(--fontFactorA)",
    "fontWeight": "700",
    "fontSize": "24px",
    "lineHeight": "32px"
  },
  "subtitle": {
    "margin": "6px 0 0",
    "maxWidth": "620px",
    "color": "var(--textSecondary)",
    "fontSize": "14px",
    "textWrap": "pretty"
  },
  "filters": {
    "display": "flex",
    "alignItems": "center",
    "gap": "12px",
    "marginTop": "24px",
    "flexWrap": "wrap"
  },
  "search": {
    "flex": "1",
    "minWidth": "240px",
    "height": "34px",
    "padding": "0 12px",
    "border": "1px solid var(--strokeDark)",
    "borderRadius": "var(--radiusMedium)",
    "fontFamily": "var(--fontInter)",
    "fontSize": "14px",
    "color": "var(--textPrimary)"
  },
  "select": {
    "height": "34px",
    "padding": "0 8px",
    "border": "1px solid var(--strokeDark)",
    "borderRadius": "var(--radiusMedium)",
    "fontFamily": "var(--fontInter)",
    "fontSize": "14px",
    "background": "var(--mainBackground)",
    "color": "var(--textPrimary)"
  },
  "count": {
    "color": "var(--textSecondary)",
    "fontSize": "13px"
  },
  "table": {
    "marginTop": "20px",
    "border": "1px solid var(--strokeLight)",
    "borderRadius": "var(--radiusLarge)",
    "overflow": "hidden",
    "boxShadow": "var(--shadowPaper1)"
  },
  "row": {
    "display": "grid",
    "gridTemplateColumns": "minmax(0, 2.4fr) 140px 170px 160px 110px 140px",
    "gap": "16px",
    "padding": "12px 16px",
    "alignItems": "center"
  },
  "head": {
    "background": "var(--surfaceHover)",
    "fontFamily": "var(--fontFactorA)",
    "fontWeight": "500",
    "fontSize": "12px",
    "letterSpacing": "0.06em",
    "textTransform": "uppercase",
    "color": "var(--textSecondary)"
  },
  "body": {
    "borderTop": "1px solid var(--strokeLight)",
    "fontSize": "14px",
    "color": "var(--textPrimary)"
  },
  "issueCell": {
    "display": "flex",
    "alignItems": "center",
    "gap": "8px",
    "minWidth": "0"
  },
  "issueKey": {
    "fontWeight": "500",
    "color": "var(--textSecondary)",
    "flex": "none"
  },
  "issueTitle": {
    "fontWeight": "500",
    "overflow": "hidden",
    "textOverflow": "ellipsis",
    "whiteSpace": "nowrap"
  },
  "assignee": {
    "display": "flex",
    "alignItems": "center",
    "gap": "8px",
    "minWidth": "0"
  },
  "progressCell": {
    "display": "flex",
    "alignItems": "center",
    "gap": "8px"
  },
  "progressTrack": {
    "flex": "1",
    "height": "6px",
    "borderRadius": "9999px",
    "background": "var(--blue50)",
    "overflow": "hidden"
  },
  "progressFill": {
    "display": "block",
    "height": "100%",
    "background": "var(--dataGreen)"
  },
  "muted": {
    "color": "var(--textSecondary)"
  },
  "right": {
    "textAlign": "right"
  },
} satisfies Record<string, CSSProperties>;
