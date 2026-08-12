import { initials, avatarColor } from '@/lib/format';

interface Props {
  name: string;
  photoUrl?: string | null;
  size?: number;
  className?: string;
}

export function PlayerAvatar({ name, photoUrl, size = 48, className = '' }: Props) {
  const dim = `${size}px`;
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        style={{ width: dim, height: dim }}
        className={`rounded-full object-cover border border-white/10 ring-1 ring-black/30 shadow-md ${className}`}
      />
    );
  }
  const ini = initials(name);
  const color = avatarColor(name);
  return (
    <div
      style={{
        width: dim,
        height: dim,
        background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.18), transparent 55%), ${color}`,
        fontSize: size * 0.4,
      }}
      className={`rounded-full flex items-center justify-center font-display font-bold text-white shrink-0 border border-white/10 ring-1 ring-black/30 shadow-md ${className}`}
      aria-label={name}
    >
      {ini}
    </div>
  );
}
