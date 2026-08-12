'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { Season } from '@/lib/types';

export function SeasonSelector({ seasons, current }: { seasons: Season[]; current: number }) {
  const router = useRouter();
  const params = useSearchParams();

  if (!seasons.length) return null;

  return (
    <select
      className="input max-w-xs"
      value={current}
      onChange={(e) => {
        const sp = new URLSearchParams(params.toString());
        sp.set('season', e.target.value);
        router.push(`?${sp.toString()}`);
      }}
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
