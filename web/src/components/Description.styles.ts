import type { CSSProperties } from 'react';

// Migrated from Description.module.css. Browser-state rules live in styles/interaction.css.
export const styles = {
  "heading": {
    "fontFamily": "var(--fontFactorA)",
    "fontWeight": "700",
    "fontSize": "16px",
    "lineHeight": "24px",
    "margin": "0 0 20px"
  },
  "subheading": {
    "fontSize": "14px",
    "fontWeight": "700",
    "marginBottom": "8px"
  },
  "body": {
    "position": "relative",
    "overflow": "hidden",
    "fontSize": "14px",
    "lineHeight": "20px",
    "textWrap": "pretty"
  },
  "fade": {
    "position": "absolute",
    "left": "0",
    "right": "0",
    "bottom": "0",
    "height": "24px",
    "background": "linear-gradient(rgba(255, 255, 255, 0), var(--mainBackground))"
  },
  "toggle": {
    "border": "none",
    "background": "none",
    "padding": "0",
    "marginTop": "8px",
    "color": "var(--textLinkDefault)",
    "fontFamily": "var(--fontInter)",
    "fontSize": "14px",
    "fontWeight": "500",
    "cursor": "pointer"
  },
} satisfies Record<string, CSSProperties>;
