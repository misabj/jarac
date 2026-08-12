import type { CSSProperties } from 'react';
import type { MatchPlayerWithPlayer } from '@/lib/types';

type ScoringRow =
  | { type: 'goal'; player: MatchPlayerWithPlayer }
  | { type: 'own_goal'; player: MatchPlayerWithPlayer };

function getScoringRows(teamPlayers: MatchPlayerWithPlayer[], opponentPlayers: MatchPlayerWithPlayer[]): ScoringRow[] {
  const scorers = teamPlayers
    .filter((player) => player.goals > 0)
    .sort(
      (a, b) =>
        b.goals - a.goals ||
        b.assists - a.assists ||
        (a.nickname || a.display_name).localeCompare(b.nickname || b.display_name)
    )
    .map((player) => ({ type: 'goal' as const, player }));

  const ownGoals = opponentPlayers
    .filter((player) => player.own_goals > 0)
    .sort(
      (a, b) =>
        b.own_goals - a.own_goals ||
        (a.nickname || a.display_name).localeCompare(b.nickname || b.display_name)
    )
    .map((player) => ({ type: 'own_goal' as const, player }));

  return [...scorers, ...ownGoals];
}

export function MatchScorerLists({
  whitePlayers,
  coloredPlayers,
  className = '',
  compact = false,
  style,
}: {
  whitePlayers: MatchPlayerWithPlayer[];
  coloredPlayers: MatchPlayerWithPlayer[];
  className?: string;
  compact?: boolean;
  style?: CSSProperties;
}) {
  const whiteScorers = getScoringRows(whitePlayers, coloredPlayers);
  const coloredScorers = getScoringRows(coloredPlayers, whitePlayers);

  if (whiteScorers.length === 0 && coloredScorers.length === 0) return null;

  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 max-w-5xl mx-auto ${className}`}
      style={style}
    >
      <ScorerList team="white" players={whiteScorers} compact={compact} />
      <ScorerList team="colored" players={coloredScorers} compact={compact} />
    </div>
  );
}

function ScorerList({
  team,
  players,
  compact,
}: {
  team: 'white' | 'colored';
  players: ScoringRow[];
  compact: boolean;
}) {
  if (players.length === 0) return <div className="hidden sm:block" />;

  const dotClass = team === 'white' ? 'bg-white' : 'bg-warning';
  const title = team === 'white' ? 'Beli golovi / asistencije' : 'Šareni golovi / asistencije';
  const rowText = compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg';
  const panelClass =
    team === 'white'
      ? 'border-white/20 bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
      : 'border-warning/30 bg-warning/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]';
  const glowClass =
    team === 'white'
      ? 'from-white/12 via-white/4 to-transparent'
      : 'from-warning/18 via-warning/5 to-transparent';
  const topLineClass = team === 'white' ? 'bg-white/45' : 'bg-warning';

  return (
    <div className={`relative flex h-full w-full min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border p-4 sm:p-5 ${panelClass}`}>
      <div aria-hidden className={`absolute inset-x-0 top-0 h-1 ${topLineClass}`} />
      <div aria-hidden className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${glowClass} blur-2xl`} />
      <div className="relative flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-text/85">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
        <span className="min-w-0 truncate">{title}</span>
      </div>
      <div className="relative flex w-full flex-col gap-1.5">
        {players.map((row) => (
          <div
            key={`${row.type}-${row.player.id}`}
            className={`grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 rounded-lg px-2 py-1 text-left font-bold leading-snug transition hover:bg-white/[0.04] ${rowText} ${
              row.type === 'own_goal' ? 'text-danger' : 'text-text'
            }`}
          >
            <a
              href={`/players/${row.player.slug}`}
              className={`min-w-0 truncate transition ${row.type === 'own_goal' ? 'hover:text-danger/80' : 'hover:text-primary'}`}
            >
              {row.type === 'own_goal' ? 'AG ' : ''}
              {row.player.nickname || row.player.display_name}
            </a>
            <span className="whitespace-nowrap text-right tabular-nums">
              <span className={row.type === 'own_goal' ? 'text-danger' : 'text-primary'}>
                ⚽x{row.type === 'own_goal' ? row.player.own_goals : row.player.goals}
              </span>
              {row.type === 'goal' && row.player.assists > 0 && (
                <>
                  <span className="mx-1 text-muted">/</span>
                  <span className="text-secondary">A x{row.player.assists}</span>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
