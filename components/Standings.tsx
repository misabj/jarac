'use client';

import { useEffect, useMemo, useState } from 'react';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import type { PlayerSeasonStats } from '@/lib/types';
import type { AwardWithSeason } from '@/lib/queries';
import { fmtNum } from '@/lib/format';

type Tab = {
  key: string;
  label: string;
  sortKey: keyof PlayerSeasonStats;
  columns: Array<{
    key: keyof PlayerSeasonStats | 'rank';
    label: string;
    align?: 'left' | 'right' | 'center';
    format?: (v: unknown, row: PlayerSeasonStats) => React.ReactNode;
    accent?: string;
  }>;
  filter?: (s: PlayerSeasonStats) => boolean;
  /**
   * Ako je definisan, igrač koji ima nagradu ovog tipa biće pinovan na #1 u
   * tabu, bez obzira na izračunate brojeve (npr. MVP sezone uvek na vrhu MVP
   * trke iako po sirovim brojevima nije najbolji).
   */
  pinByAward?: 'top_scorer' | 'top_assistant' | 'season_mvp' | 'top_own_goals';
};

const tabs: Tab[] = [
  {
    key: 'general',
    label: 'Generalna tabela',
    sortKey: 'points',
   // pinByAward: 'season_mvp',
    columns: [
      { key: 'rank', label: '#', align: 'left' },
      { key: 'display_name', label: 'Igrač' },
      { key: 'matches_played', label: 'UTK', align: 'right' },
      { key: 'wins', label: 'P', align: 'right', accent: 'text-primary' },
      { key: 'draws', label: 'N', align: 'right', accent: 'text-warning' },
      { key: 'losses', label: 'I', align: 'right', accent: 'text-danger' },
      { key: 'goals', label: 'G', align: 'right', accent: 'text-primary' },
      { key: 'assists', label: 'A', align: 'right', accent: 'text-secondary' },
      { key: 'points', label: 'Bodovi', align: 'right', accent: 'font-bold text-warning' },
    ],
  },
  {
    key: 'scorers',
    label: 'Strelci',
    sortKey: 'goals',
    filter: (s) => s.goals > 0,
    pinByAward: 'top_scorer',
    columns: [
      { key: 'rank', label: '#' },
      { key: 'display_name', label: 'Igrač' },
      { key: 'matches_played', label: 'UTK', align: 'right' },
      { key: 'goals', label: 'Golovi', align: 'right', accent: 'font-bold text-primary' },
      { key: 'goals_per_match', label: 'G/UTK', align: 'right', format: (v) => fmtNum(Number(v), 2) },
    ],
  },
  {
    key: 'assists',
    label: 'Asistencije',
    sortKey: 'assists',
    filter: (s) => s.assists > 0,
    pinByAward: 'top_assistant',
    columns: [
      { key: 'rank', label: '#' },
      { key: 'display_name', label: 'Igrač' },
      { key: 'matches_played', label: 'UTK', align: 'right' },
      { key: 'assists', label: 'Asist.', align: 'right', accent: 'font-bold text-secondary' },
      { key: 'assists_per_match', label: 'A/UTK', align: 'right', format: (v) => fmtNum(Number(v), 2) },
    ],
  },
  {
    key: 'ga',
    label: 'G+A',
    sortKey: 'goals_plus_assists',
    filter: (s) => s.goals_plus_assists > 0,
    columns: [
      { key: 'rank', label: '#' },
      { key: 'display_name', label: 'Igrač' },
      { key: 'matches_played', label: 'UTK', align: 'right' },
      { key: 'goals', label: 'G', align: 'right', accent: 'text-primary' },
      { key: 'assists', label: 'A', align: 'right', accent: 'text-secondary' },
      { key: 'goals_plus_assists', label: 'G+A', align: 'right', accent: 'font-bold' },
      { key: 'goals_plus_assists_per_match', label: 'G+A/UTK', align: 'right', format: (v) => fmtNum(Number(v), 2) },
    ],
  },
  {
    key: 'mvp',
    label: 'MVP trka',
    sortKey: 'mvp_score',
    pinByAward: 'season_mvp',
    columns: [
      { key: 'rank', label: '#' },
      { key: 'display_name', label: 'Igrač' },
      { key: 'counted_matches', label: 'UTK', align: 'right' },
      { key: 'wins', label: 'Pob', align: 'right', accent: 'font-bold text-primary' },
      { key: 'draws', label: 'N', align: 'right', accent: 'text-warning' },
      { key: 'losses', label: 'I', align: 'right', accent: 'text-danger' },
      { key: 'goals', label: 'G', align: 'right', accent: 'text-primary' },
      { key: 'assists', label: 'A', align: 'right', accent: 'text-secondary' },
      { key: 'points', label: 'Bod', align: 'right', accent: 'text-warning' },
      { key: 'mvp_score', label: 'MVP', align: 'right', format: (v) => fmtNum(Number(v), 1), accent: 'font-bold text-warning' },
    ],
  },
  {
    key: 'own_goals',
    label: 'Autogolovi',
    sortKey: 'own_goals',
    filter: (s) => s.own_goals > 0,
    pinByAward: 'top_own_goals',
    columns: [
      { key: 'rank', label: '#' },
      { key: 'display_name', label: 'Igrač' },
      { key: 'own_goals', label: 'AG', align: 'right', accent: 'font-bold text-danger' },
    ],
  },
  {
    key: 'presence',
    label: 'Prisutnost',
    sortKey: 'matches_played',
    filter: (s) => s.matches_played > 0,
    columns: [
      { key: 'rank', label: '#' },
      { key: 'display_name', label: 'Igrač' },
      { key: 'matches_played', label: 'UTK', align: 'right', accent: 'font-bold' },
      { key: 'counted_matches', label: 'Računato', align: 'right' },
    ],
  },
  {
    key: 'avg_goals',
    label: 'Prosek golova',
    sortKey: 'goals_per_match',
    filter: (s) => s.counted_matches > 0,
    columns: [
      { key: 'rank', label: '#' },
      { key: 'display_name', label: 'Igrač' },
      { key: 'matches_played', label: 'UTK', align: 'right' },
      { key: 'goals', label: 'G', align: 'right', accent: 'text-primary' },
      { key: 'goals_per_match', label: 'G/UTK', align: 'right', accent: 'font-bold text-primary', format: (v) => fmtNum(Number(v), 2) },
    ],
  },
  {
    key: 'avg_points',
    label: 'Prosek bodova',
    sortKey: 'points_per_match',
    filter: (s) => s.counted_matches > 0,
    columns: [
      { key: 'rank', label: '#' },
      { key: 'display_name', label: 'Igrač' },
      { key: 'matches_played', label: 'UTK', align: 'right' },
      { key: 'points', label: 'Bod', align: 'right', accent: 'text-warning' },
      { key: 'points_per_match', label: 'Bod/UTK', align: 'right', accent: 'font-bold text-warning', format: (v) => fmtNum(Number(v), 2) },
    ],
  },
];

export function Standings({
  stats,
  awardsByPlayer,
  seasonMatchCount = 0,
  seasonName,
}: {
  stats: PlayerSeasonStats[];
  awardsByPlayer?: Record<number, AwardWithSeason[]>;
  /** Ukupan broj odigranih (is_counted) utakmica u sezoni — koristi se za MVP prag (50%). */
  seasonMatchCount?: number;
  seasonName?: string;
}) {
  const [active, setActive] = useState<string>('general');
  const current = useMemo(() => tabs.find((t) => t.key === active) ?? tabs[0], [active]);
  const isSummerLeague = (seasonName ?? '').toLowerCase().includes('letnja razvojna liga');

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (tabs.some((tab) => tab.key === hash)) setActive(hash);
  }, []);

  // MVP kandidat mora da je odigrao bar 50% utakmica u sezoni.
  const mvpMinMatches = Math.ceil(seasonMatchCount * 0.5);

  const rows = useMemo(() => {
    let r = stats;
    if (current.filter) r = r.filter(current.filter);
    if (current.key === 'mvp' && mvpMinMatches > 0) {
      r = r.filter((s) => s.counted_matches >= mvpMinMatches);
    }
    return r;
  }, [stats, current, mvpMinMatches]);

  // Ako tab ima pinByAward, identifikuj igrača koji je nosilac te nagrade;
  // taj igrač će biti prikazan na #1 u tabu (override sortinga po brojevima).
  const pinnedPlayerId = useMemo<number | null>(() => {
    if (!current.pinByAward || !awardsByPlayer) return null;
    for (const [pid, list] of Object.entries(awardsByPlayer)) {
      if (list.some((a) => a.type === current.pinByAward)) return Number(pid);
    }
    return null;
  }, [current.pinByAward, awardsByPlayer]);

  return (
    <div>
      <div className="mb-4 sm:mb-5 rounded-2xl border border-border/60 bg-card/35 px-2 pb-2 pt-3 overflow-visible">
        <div className="overflow-x-auto overflow-y-visible scrollbar-clean pb-1 pt-1">
          <div className="flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap">
            {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setActive(t.key);
                window.history.replaceState(null, '', `#${t.key}`);
              }}
                className={`relative min-h-10 px-4 py-2.5 text-sm rounded-xl border transition-all duration-200 active:scale-95 whitespace-nowrap ${
                  active === t.key
                    ? 'bg-gradient-primary text-background border-transparent font-semibold shadow-glow-primary'
                    : 'border-border text-muted hover:text-text hover:border-primary/40 hover:-translate-y-0.5'
                }`}
              >
                {getTabLabel(t, isSummerLeague)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div key={active} className="animate-fade-up">
        {current.key === 'mvp' && (
          <div className="mb-4 rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className="text-warning">🏆</span>
              <h3 className="font-display text-sm sm:text-base font-bold">Kako se bira MVP sezone</h3>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
              MVP je igrač koji <span className="text-text font-semibold">najviše doprinosi pobedama</span> i
              ujedno ima <span className="text-text font-semibold">najviše golova i asistencija</span> — kao u
              velikim ligama, ceni se i timski uspeh i individualni učinak.
              {mvpMinMatches > 0 && (
                <>
                  {' '}Uslov: bar{' '}
                  <span className="text-text font-semibold">{mvpMinMatches}</span> od{' '}
                  <span className="text-text font-semibold">{seasonMatchCount}</span> odigranih utakmica (≥ 50%).
                </>
              )}
            </p>

            <div className="mt-3 rounded-xl border border-border/50 bg-background/40 px-3 py-2.5 font-mono text-[11px] sm:text-xs leading-relaxed overflow-x-auto">
              <span className="text-warning font-semibold">MVP</span>
              {' = '}
              <span className="text-primary">5 × Pobede</span>
              {' + '}
              <span className="text-warning">2 × Nerešeno</span>
              {' + '}
              <span className="text-primary">1.5 × Golovi</span>
              {' + '}
              <span className="text-secondary">1 × Asistencije</span>
              {' + '}
              <span className="text-text">3 × MVP meča</span>
              {' + '}
              <span className="text-text">0.5 × Prisutnost</span>
              {' − '}
              <span className="text-danger">2 × Porazi</span>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] sm:text-xs">
              <div>
                <div className="font-semibold text-primary mb-1">Podiže score</div>
                <ul className="text-muted space-y-0.5">
                  <li>• Pobede (najjači faktor) i nerešeni rezultati</li>
                  <li>• Golovi (vrede više) i asistencije</li>
                  <li>• Prisutnost i MVP pojedinačnog meča</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-danger mb-1">Spušta score</div>
                <ul className="text-muted space-y-0.5">
                  <li>• Porazi</li>
                </ul>
              </div>
            </div>

            <p className="mt-3 text-[11px] sm:text-xs text-muted">
              Poredak prati ukupan <span className="text-warning font-semibold">MVP</span> zbir; kod izjednačenja
              prednost imaju više pobeda, pa više golova + asistencija.
            </p>
          </div>
        )}
        <LeaderboardTable
          rows={rows}
          columns={current.columns}
          sortKey={current.sortKey}
          desc={true}
          awardsByPlayer={awardsByPlayer}
          pinnedPlayerId={pinnedPlayerId}
        />
      </div>
    </div>
  );
}

function getTabLabel(tab: Tab, isSummerLeague: boolean) {
  if (!isSummerLeague) return tab.label;
  if (tab.key === 'scorers') return 'Strelci letnje lige';
  if (tab.key === 'assists') return 'Asistenti letnje lige';
  if (tab.key === 'mvp') return 'MVP trka';
  return tab.label;
}
