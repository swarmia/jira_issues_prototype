interface AvatarProps {
  initials: string;
  name?: string;
  size?: number;
}

export function Avatar({ initials, name, size = 24 }: AvatarProps) {
  return (
    <span
      title={name}
      style={{
        width: size,
        height: size,
        flex: 'none',
        borderRadius: 9999,
        background: 'var(--purple400)',
        color: 'var(--white)',
        fontSize: Math.round(size * 0.42),
        fontWeight: 700,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {initials}
    </span>
  );
}
