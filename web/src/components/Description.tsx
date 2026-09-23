import { useState } from 'react';
import { RichText } from './RichText';
import styles from './Description.module.css';

export function Description({ description }: { description: string | null }) {
  const [expanded, setExpanded] = useState(false);

  if (!description) {
    return (
      <div>
        <h3 className={styles.heading}>Description</h3>
        <div className={styles.subheading}>No description</div>
      </div>
    );
  }

  return (
    <div>
      <h3 className={styles.heading}>Description</h3>
      <div className={styles.subheading}>Summary</div>
      <div className={styles.body} style={{ maxHeight: expanded ? 'none' : 60 }}>
        <RichText text={description} />
        {!expanded && <div className={styles.fade} />}
      </div>
      <button className={styles.toggle} onClick={() => setExpanded(value => !value)}>
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
}
