export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value.replace(' ', 'T')) : value;
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('sr-Latn-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function fmtDateTime(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value.replace(' ', 'T')) : value;
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString('sr-Latn-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtNum(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || isNaN(Number(value))) return '0';
  const n = Number(value);
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(digits);
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 65%, 38%)`;
}
