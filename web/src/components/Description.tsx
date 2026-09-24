import { useState } from 'react';
import { RichText } from './RichText';
import { styles } from './Description.styles';

export function Description({ description }: { description: string | null }) {
  const [expanded, setExpanded] = useState(false);

  if (!description) {
    return (
      <div>
        <h3 style={styles.heading} data-ui="Description.heading">Description</h3>
        <div style={styles.subheading} data-ui="Description.subheading">No description</div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={styles.heading} data-ui="Description.heading">Description</h3>
      <div style={styles.subheading} data-ui="Description.subheading">Summary</div>
      <div style={{ ...styles.body, maxHeight: expanded ? 'none' : 60 }} data-ui="Description.body">
        <RichText text={description} />
        {!expanded && <div style={styles.fade} data-ui="Description.fade" />}
      </div>
      <button style={styles.toggle} data-ui="Description.toggle" onClick={() => setExpanded(value => !value)}>
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
}
