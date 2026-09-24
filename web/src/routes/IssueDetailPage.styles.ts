import type { CSSProperties } from 'react';

// Migrated from IssueDetailPage.module.css. Browser-state rules live in styles/interaction.css.
export const styles = {
  "back": {
    "display": "inline-flex",
    "alignItems": "center",
    "gap": "6px",
    "color": "var(--textSecondary)",
    "fontSize": "14px",
    "fontWeight": "500",
    "alignSelf": "flex-start"
  },
  "breadcrumb": {
    "display": "flex",
    "alignItems": "center",
    "gap": "6px",
    "marginTop": "24px",
    "fontSize": "13px",
    "fontWeight": "500",
    "color": "var(--textSecondary)"
  },
  "issueKey": {
    "color": "var(--textPrimary)"
  },
  "titleRow": {
    "display": "flex",
    "alignItems": "center",
    "gap": "16px",
    "marginTop": "6px",
    "flexWrap": "wrap"
  },
  "title": {
    "fontFamily": "var(--fontFactorA)",
    "fontWeight": "700",
    "fontSize": "20px",
    "lineHeight": "28px"
  },
  "jiraLink": {
    "width": "22px",
    "height": "22px",
    "border": "1px solid var(--strokeDark)",
    "borderRadius": "var(--radiusMedium)",
    "display": "grid",
    "placeItems": "center"
  },
  "spacer": {
    "flex": "1"
  },
  "board": {
    "display": "flex",
    "alignItems": "center",
    "gap": "6px",
    "fontSize": "14px",
    "fontWeight": "500"
  },
  "boardDot": {
    "width": "10px",
    "height": "10px",
    "borderRadius": "9999px"
  },
  "addNote": {
    "display": "flex",
    "alignItems": "center",
    "gap": "6px",
    "border": "none",
    "background": "none",
    "padding": "0",
    "fontFamily": "var(--fontInter)",
    "fontSize": "14px",
    "fontWeight": "700",
    "color": "var(--textLinkDefault)",
    "cursor": "pointer"
  },
  "cards": {
    "display": "grid",
    "gridTemplateColumns": "repeat(auto-fit, minmax(420px, 1fr))",
    "gap": "24px",
    "marginTop": "24px"
  },
  "detailsGrid": {
    "display": "grid",
    "gridTemplateColumns": "minmax(260px, 1fr) minmax(0, 2fr)",
    "gap": "48px",
    "marginTop": "28px"
  },
  "rightColumn": {
    "minWidth": "0"
  },
  "sectionTitle": {
    "fontFamily": "var(--fontFactorA)",
    "fontWeight": "700",
    "fontSize": "16px",
    "lineHeight": "24px",
    "marginBottom": "20px"
  },
  "fields": {
    "display": "grid",
    "gridTemplateColumns": "130px minmax(0, 1fr)",
    "rowGap": "14px",
    "margin": "0",
    "fontSize": "14px",
    "lineHeight": "20px"
  },
  "fieldLabel": {
    "color": "var(--textSecondary)"
  },
  "fieldValue": {
    "margin": "0"
  },
  "inlineValue": {
    "display": "flex",
    "alignItems": "center",
    "gap": "6px"
  },
  "sprints": {
    "textWrap": "pretty"
  },
  "mappedStatus": {
    "marginLeft": "8px",
    "color": "var(--textSecondary)",
    "fontSize": "13px"
  },
  "labels": {
    "display": "inline-flex",
    "flexWrap": "wrap",
    "gap": "4px"
  },
  "label": {
    "padding": "0 6px",
    "borderRadius": "var(--radiusSmall)",
    "background": "var(--labelNeutralSoftBg)",
    "color": "var(--labelNeutralSoftText)",
    "fontSize": "12px",
    "lineHeight": "18px"
  },
} satisfies Record<string, CSSProperties>;
