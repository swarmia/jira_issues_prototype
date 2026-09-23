import { useMutation } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';
import { ADD_ANNOTATION_MUTATION, DELETE_ANNOTATION_MUTATION } from '../gql/queries';
import type { Annotation } from '../gql/types';
import { formatDateTime } from '../lib/format';
import { Avatar } from './Avatar';
import styles from './AnnotationsPanel.module.css';

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
    <section className={styles.panel}>
      <h3 className={styles.title}>Notes</h3>

      {composerOpen && (
        <form className={styles.composer} onSubmit={submit}>
          <textarea
            ref={textarea}
            className={styles.textarea}
            value={content}
            placeholder="Add context for the team — a decision, a blocker, a link…"
            onChange={event => setContent(event.target.value)}
            rows={3}
          />
          <div className={styles.composerActions}>
            {error && <span className={styles.error}>{error.message}</span>}
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                setContent('');
                onCloseComposer();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={loading || !content.trim()}
            >
              {loading ? 'Saving…' : 'Save note'}
            </button>
          </div>
        </form>
      )}

      <div className={styles.list}>
        {annotations.map(annotation => (
          <article key={annotation.id} className={styles.note}>
            <Avatar
              initials={annotation.author?.initials ?? '?'}
              name={annotation.author?.name ?? 'Unknown'}
            />
            <div className={styles.noteBody}>
              <div className={styles.noteMeta}>
                <span className={styles.noteAuthor}>{annotation.author?.name ?? 'Unknown'}</span>
                <span>{formatDateTime(annotation.timestamp)}</span>
                {annotation.source !== 'Ui' && (
                  <span className={styles.noteSource}>{annotation.source}</span>
                )}
                <button
                  className={styles.deleteButton}
                  onClick={() =>
                    deleteAnnotation({ variables: { issueKey, annotationId: annotation.id } })
                  }
                >
                  Delete
                </button>
              </div>
              <p className={styles.noteText}>{annotation.content}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
