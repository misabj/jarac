'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PlayerAvatar } from './PlayerAvatar';
import { AwardBadges } from './AwardBadges';
import type { HistoricalPlayerStats } from '@/lib/types';
import type { AwardWithSeason } from '@/lib/queries';
import { fmtNum } from '@/lib/format';

type SortKey =
  | 'matches_played'
  | 'goals'
  | 'goals_per_match'
  | 'assists'
  | 'assists_per_match'
  | 'goals_plus_assists'
  | 'goals_plus_assists_per_match'
  | 'wins'
  | 'draws'
  | 'losses'
  | 'points'
  | 'points_per_match'
  | 'own_goals'
  | 'previous_season_average'
  | 'points_average_diff'
  | 'previous_season_goals_average'
  | 'goals_average_diff'
  | 'untracked_matches';

type Col = {
  key: SortKey;
  label: string;
  short?: string;
  accent?: string;
  bold?: boolean;
  decimals?: number;
  diff?: boolean; // boji + zelenom, – crvenom
  hideOnMobile?: boolean; // sakrij na ekranima < sm
};

const COLS: Col[] = [
  { key: 'matches_played',                label: 'Utakmice',                                    short: 'UTK',    bold: true },
  { key: 'goals',                         label: 'Golovi',                                      short: 'G',      accent: 'text-primary', bold: true },
  { key: 'goals_per_match',               label: 'Golovi / utakmica',                           short: 'G/U',    decimals: 2, hideOnMobile: true },
  { key: 'assists',                       label: 'Asistencije',                                 short: 'A',      accent: 'text-secondary' },
  { key: 'assists_per_match',             label: 'Asistencije / utakmica',                      short: 'A/U',    decimals: 2, hideOnMobile: true },
  { key: 'goals_plus_assists',            label: 'G + A',                                       short: 'G+A',    bold: true },
  { key: 'goals_plus_assists_per_match',  label: '(G+A) / utakmica',                            short: 'G+A/U',  decimals: 2, hideOnMobile: true },
  { key: 'wins',                          label: 'Pobede',                                      short: 'P',      accent: 'text-primary' },
  { key: 'draws',                         label: 'Nerešeno',                                    short: 'N',      accent: 'text-warning' },
  { key: 'losses',                        label: 'Porazi',                                      short: 'I',      accent: 'text-danger' },
  { key: 'points',                        label: 'Bodovi',                                      short: 'BOD',    accent: 'text-warning', bold: true },
  { key: 'points_per_match',              label: 'Bodovi / utakmica',                           short: 'BOD/U',  decimals: 2, hideOnMobile: true },
  { key: 'own_goals',                     label: 'Autogolovi',                                  short: 'AG',     accent: 'text-danger', hideOnMobile: true },
  { key: 'previous_season_average',       label: 'Prosek prošle sezone',                        short: '⌀ ant.', decimals: 2, hideOnMobile: true },
  { key: 'points_average_diff',           label: 'Razlika bodova vs prošla',                    short: 'Δ BOD',  decimals: 2, diff: true, hideOnMobile: true },
  { key: 'previous_season_goals_average', label: 'Prosek golova prošle sezone',                 short: '⌀ G ant.', decimals: 2, hideOnMobile: true },
  { key: 'goals_average_diff',            label: 'Razlika u proseku golova',                    short: 'Δ G',    decimals: 2, diff: true, hideOnMobile: true },
  { key: 'untracked_matches',             label: 'Utakmice bez upisane statistike',             short: 'Bez st.', hideOnMobile: true },
];

const DEFAULT_VISIBLE: SortKey[] = COLS.filter((c) => !c.hideOnMobile).map((c) => c.key);

interface Props {
  rows: HistoricalPlayerStats[];
  awardsByPlayer?: Record<number, AwardWithSeason[]>;
}

function renderCell(c: Col, v: number | null | undefined) {
  if (v == null) return <span className="text-muted/60">—</span>;
  const num = Number(v);
  if (!Number.isFinite(num)) return <span className="text-muted/60">—</span>;

  const formatted = c.decimals != null ? fmtNum(num, c.decimals) : String(num);
  if (c.diff) {
    const cls = num > 0 ? 'text-primary' : num < 0 ? 'text-danger' : 'text-muted';
    const sign = num > 0 ? '+' : '';
    return <span className={`${cls} font-semibold`}>{sign}{formatted}</span>;
  }
  return formatted;
}

export function HistoricalReportTable({ rows, awardsByPlayer }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('points');
  const [desc, setDesc] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [q, setQ] = useState('');

  const query = q.trim().toLowerCase();

  const sorted = useMemo(() => {
    const filtered = query
      ? rows.filter(
          (r) =>
            r.display_name.toLowerCase().includes(query) ||
            (r.nickname ?? '').toLowerCase().includes(query)
        )
      : rows;
    return [...filtered].sort((a, b) => {
      const av = Number(a[sortKey] ?? 0);
      const bv = Number(b[sortKey] ?? 0);
      if (av === bv) return a.display_name.localeCompare(b.display_name);
      return desc ? bv - av : av - bv;
    });
  }, [rows, sortKey, desc, query]);

  const visibleCols = showAll ? COLS : COLS.filter((c) => DEFAULT_VISIBLE.includes(c.key));

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDesc((d) => !d);
    } else {
      setSortKey(key);
      setDesc(true);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="card p-8 text-center text-muted">
        Nema istorijske statistike za ovu sezonu.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
            🔍
          </span>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pretraži igrača…"
            aria-label="Pretraži igrača"
            className="input w-full pl-9"
          />
          {q && (
            <button
              type="button"
              aria-label="Obriši pretragu"
              onClick={() => setQ('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted hover:text-text hover:bg-card-hover transition"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <div className="text-xs text-muted">
            {sorted.length} {sorted.length === 1 ? 'igrač' : 'igrača'} • klikni na zaglavlje za sortiranje
          </div>
          <button
            onClick={() => setShowAll((s) => !s)}
            className="btn-ghost px-3 py-1.5 text-xs whitespace-nowrap"
          >
            {showAll ? 'Manje kolona' : 'Sve kolone'}
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto scrollbar-clean">
          <table className="table-base min-w-full text-[13px] sm:text-sm">
            <thead>
              <tr>
                <th className="text-left sticky left-0 z-20 bg-background/95 backdrop-blur min-w-[44px]">#</th>
                <th className="text-left sticky left-[44px] z-20 bg-background/95 backdrop-blur min-w-[180px]">Igrač</th>
                {visibleCols.map((c) => (
                  <th
                    key={c.key}
                    className="text-right whitespace-nowrap cursor-pointer select-none hover:text-text transition-colors"
                    onClick={() => handleSort(c.key)}
                    title={c.label}
                  >
                    <span className="inline-flex items-center gap-1">
                      <span>{c.short ?? c.label}</span>
                      {sortKey === c.key && (
                        <span className="text-primary text-[10px]">{desc ? '▼' : '▲'}</span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, idx) => (
                <tr key={row.player_id} className={idx === 0 ? 'bg-primary/[0.05]' : ''}>
                  <td className="sticky left-0 z-10 bg-card/95 backdrop-blur">
                    <span
                      className={`inline-grid place-items-center h-7 w-7 rounded-lg text-xs font-bold tabular-nums ${
                        idx === 0
                          ? 'bg-gradient-primary text-background shadow-glow-primary'
                          : idx === 1
                          ? 'bg-secondary/20 text-secondary'
                          : idx === 2
                          ? 'bg-warning/20 text-warning'
                          : 'bg-background/40 text-muted'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="sticky left-[44px] z-10 bg-card/95 backdrop-blur">
                    <a href={`/players/${row.slug}`} className="flex items-center gap-2.5 group min-w-[160px]">
                      <PlayerAvatar name={row.display_name} photoUrl={row.photo_url} size={28} />
                      <span className="font-medium truncate group-hover:text-primary transition-colors inline-flex items-center gap-1.5 min-w-0">
                        <span className="truncate">{row.display_name}</span>
                        <AwardBadges awards={awardsByPlayer?.[row.player_id]} size="xs" />
                      </span>
                    </a>
                  </td>
                  {visibleCols.map((c) => {
                    const v = row[c.key] as number | null | undefined;
                    return (
                      <td
                        key={c.key}
                        className={`tabular-nums text-right whitespace-nowrap ${c.accent ?? ''} ${c.bold ? 'font-bold' : ''}`}
                      >
                        {renderCell(c, v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={visibleCols.length + 2} className="text-center text-muted py-6">
                    Nema igrača za zadatu pretragu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-[11px] text-muted px-2 leading-relaxed">
        UTK – utakmice, G – golovi, A – asistencije, BOD – bodovi (3 za pobedu, 1 za nerešeno),
        AG – autogolovi, Δ – razlika u odnosu na prethodnu sezonu.
        Na manjim ekranima skroluj horizontalno ili klikni „Sve kolone" za pun izveštaj.
      </div>
    </div>
  );
}
