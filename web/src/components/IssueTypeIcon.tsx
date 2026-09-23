/** Keyed by Swarmia issue type (`SwarmiaIssueType`), not the raw tracker type. */
const shapes: Record<string, { color: string; radius: string }> = {
  Story: { color: 'var(--green500)', radius: '1px' },
  Task: { color: 'var(--blue500)', radius: '1px' },
  Bug: { color: 'var(--red500)', radius: '9999px' },
  Epic: { color: 'var(--purple500)', radius: '1px' },
};

export function IssueTypeIcon({ issueType, title }: { issueType: string | null; title?: string }) {
  const shape = (issueType && shapes[issueType]) || shapes.Task!;
  return (
    <span
      title={title}
      style={{
        width: 8,
        height: 11,
        flex: 'none',
        border: `1.5px solid ${shape.color}`,
        borderBottom: 'none',
        borderRadius: shape.radius,
      }}
    />
  );
}
