import { Fragment, type ReactNode } from 'react';

const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`)/g;

/** Minimal renderer for the subset of markdown Jira summaries use: paragraphs, bold, code. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((paragraph, index) => (
        <p key={index} style={{ margin: index === 0 ? '0 0 8px' : '0 0 8px' }}>
          {inline(paragraph)}
        </p>
      ))}
    </>
  );
}

function inline(text: string): ReactNode[] {
  return text.split(TOKEN).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <b key={index}>{part.slice(2, -2)}</b>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} style={{ fontFamily: 'var(--fontMonospace)', fontSize: 13 }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}
