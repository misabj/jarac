'use client';

import { useRouter } from 'next/navigation';
import type { Season } from '@/lib/types';

export function SeasonFilterSelect({
  seasons,
  current,
  className = 'w-full sm:max-w-xs',
}: {
  seasons: Season[];
  current?: number;
  className?: string;
}) {
  const router = useRouter();
  if (!seasons.length) return null;
  return (
    <select
      className={`input ${className}`}
      value={current ?? ''}
      onChange={(e) => router.push(`?season=${e.target.value}`)}
    >
      {seasons.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
          {s.is_active ? ' • aktivna' : ''}
        </option>
      ))}
    </select>
  );
}
