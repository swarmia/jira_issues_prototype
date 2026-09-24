import { useMutation } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';
import { ADD_ANNOTATION_MUTATION, DELETE_ANNOTATION_MUTATION } from '../gql/queries';
import type { Annotation } from '../gql/types';
import { formatDateTime } from '../lib/format';
import { Button, TextArea } from '../design-system/controls';
import { Avatar } from './Avatar';
import { styles } from './AnnotationsPanel.styles';

interface AnnotationsPanelProps {
  issueKey: string;
  annotations: Annotation[];
  composerOpen: boolean;
  onCloseComposer: () => void;
}

/** Upstream the entity is `Annotation`; its display title is "Notes". */
export function AnnotationsPanel({
  issueKey,
  annotations,
  composerOpen,
  onCloseComposer,
}: AnnotationsPanelProps) {
  const [content, setContent] = useState('');
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [addAnnotation, { loading, error }] = useMutation(ADD_ANNOTATION_MUTATION);
  const [deleteAnnotation] = useMutation(DELETE_ANNOTATION_MUTATION);

  useEffect(() => {
    if (composerOpen) textarea.current?.focus();
  }, [composerOpen]);

  if (!composerOpen && annotations.length === 0) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    await addAnnotation({ variables: { issueKey, content } });
    setContent('');
    onCloseComposer();
  };

  return (
    <section style={styles.panel} data-ui="AnnotationsPanel.panel">
      <h3 style={styles.title} data-ui="AnnotationsPanel.title">Notes</h3>

      {composerOpen && (
        <form style={styles.composer} data-ui="AnnotationsPanel.composer" onSubmit={submit}>
          <TextArea
            ref={textarea}
            style={styles.textarea}
            value={content}
            placeholder="Add context for the team — a decision, a blocker, a link…"
            onChange={event => setContent(event.target.value)}
            rows={3}
          />
          <div style={styles.composerActions} data-ui="AnnotationsPanel.composerActions">
            {error && <span style={styles.error} data-ui="AnnotationsPanel.error">{error.message}</span>}
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setContent('');
                onCloseComposer();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !content.trim()}
            >
              {loading ? 'Saving…' : 'Save note'}
            </Button>
          </div>
        </form>
      )}

      <div style={styles.list} data-ui="AnnotationsPanel.list">
        {annotations.map(annotation => (
          <article key={annotation.id} style={styles.note} data-ui="AnnotationsPanel.note">
            <Avatar
              initials={annotation.author?.initials ?? '?'}
              name={annotation.author?.name ?? 'Unknown'}
            />
            <div style={styles.noteBody} data-ui="AnnotationsPanel.noteBody">
              <div style={styles.noteMeta} data-ui="AnnotationsPanel.noteMeta">
                <span style={styles.noteAuthor} data-ui="AnnotationsPanel.noteAuthor">{annotation.author?.name ?? 'Unknown'}</span>
                <span>{formatDateTime(annotation.timestamp)}</span>
                {annotation.source !== 'Ui' && (
                  <span style={styles.noteSource} data-ui="AnnotationsPanel.noteSource">{annotation.source}</span>
                )}
                <button
                  style={styles.deleteButton} data-ui="AnnotationsPanel.deleteButton"
                  onClick={() =>
                    deleteAnnotation({ variables: { issueKey, annotationId: annotation.id } })
                  }
                >
                  Delete
                </button>
              </div>
              <p style={styles.noteText} data-ui="AnnotationsPanel.noteText">{annotation.content}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
