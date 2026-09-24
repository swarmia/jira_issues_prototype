import type { CSSProperties } from 'react';

// Migrated from AppLayout.module.css. Browser-state rules live in styles/interaction.css.
export const styles = {
  "shell": {
    "display": "flex",
    "minHeight": "100vh"
  },
  "main": {
    "flex": "1",
    "minWidth": "0",
    "padding": "32px 40px 64px"
  },
  "content": {
    "maxWidth": "1440px",
    "margin": "0 auto",
    "display": "flex",
    "flexDirection": "column"
  },
} satisfies Record<string, CSSProperties>;
