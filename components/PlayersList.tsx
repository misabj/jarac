'use client';

import { useMemo, useState } from 'react';
import { PlayerCard } from '@/components/PlayerCard';
import type { PlayerSeasonStats } from '@/lib/types';
import type { AwardWithSeason } from '@/lib/queries';

interface Props {
  stats: PlayerSeasonStats[];
  activeIds: number[];
  awardsByPlayer?: Record<number, AwardWithSeason[]>;
}

export function PlayersList({ stats, activeIds, awardsByPlayer }: Props) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  const activeSet = useMemo(() => new Set(activeIds), [activeIds]);

  const filtered = useMemo(() => {
    return stats
      .filter((s) => (filter === 'active' ? activeSet.has(s.player_id) : true))
      .filter((s) => (q ? s.display_name.toLowerCase().includes(q.toLowerCase()) || (s.nickname ?? '').toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => b.points - a.points || b.goals - a.goals || a.display_name.localeCompare(b.display_name));
  }, [stats, q, filter, activeSet]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5 sm:mb-6">
        <input
          className="input flex-1"
          placeholder="Pretraži igrače…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="inline-flex rounded-xl border border-border bg-card/60 p-1 self-start sm:self-auto">
          {(['active', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm rounded-lg transition min-h-[40px] ${
                filter === f ? 'bg-gradient-primary text-background font-semibold' : 'text-muted hover:text-text'
              }`}
            >
              {f === 'active' ? 'Aktivni' : 'Svi'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-muted py-10 sm:py-12 text-sm sm:text-base">Nema igrača za zadati filter.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 stagger">
          {filtered.map((s) => (
            <div key={s.player_id} className="stagger-item">
              <PlayerCard stat={s} awards={awardsByPlayer?.[s.player_id]} />
            </div>
          ))}
        </div>
      )}

      <div className="text-[11px] text-muted mt-5 sm:mt-6 text-center">
        Prikazano {filtered.length} {filtered.length === 1 ? 'igrač' : 'igrača'}.
      </div>
    </div>
  );
}
