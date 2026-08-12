import Link from 'next/link';
import { TeamBadge } from './TeamBadge';
import type { Match } from '@/lib/types';
import { fmtDate } from '@/lib/format';

function isMatchFinished(playedAt: string) {
  return new Date(playedAt.replace(' ', 'T')).getTime() + 60 * 60 * 1000 <= Date.now();
}

export function MatchCard({ match }: { match: Match }) {
  const finished = isMatchFinished(match.played_at);

  const winner = finished
    ? match.result_type === 'white_win'
      ? 'Pobednik: Beli'
      : match.result_type === 'colored_win'
        ? 'Pobednik: Šareni'
        : 'Nerešeno'
    : '';

  return (
    <Link
      href={`/matches/${match.id}`}
      className="card card-hover p-4 sm:p-5 flex flex-col gap-3 group relative"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.16em] sm:tracking-[0.18em] text-muted">
          Fudbal br. <span className="text-text font-bold font-display">{match.match_number}</span>
        </div>

        {!match.is_counted && (
          <span className="text-[9px] sm:text-[10px] uppercase tracking-wider bg-warning/15 text-warning px-2 py-0.5 rounded-md border border-warning/30 whitespace-nowrap">
            ne računa
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <TeamBadge team="white" />

        <div className="font-display text-3xl sm:text-4xl font-bold tabular-nums tracking-tight transition-transform duration-300 group-hover:scale-105">
          <span className={finished && match.result_type === 'white_win' ? 'text-primary' : 'text-text'}>
            {match.white_score}
          </span>
          <span className="text-muted mx-1.5 sm:mx-2">:</span>
          <span className={finished && match.result_type === 'colored_win' ? 'text-primary' : 'text-text'}>
            {match.colored_score}
          </span>
        </div>

        <TeamBadge team="colored" />
      </div>

      <div className="flex items-center justify-between text-[11px] sm:text-xs text-muted pt-3 border-t border-border/50 gap-2">
        <span className="whitespace-nowrap">{fmtDate(match.played_at)}</span>

        {winner && (
          <span className="text-text/80 font-medium truncate">
            {winner}
          </span>
        )}
      </div>

      {match.selector_name && (
        <div className="text-[10px] sm:text-[11px] text-muted truncate">
          Selektor: <span className="text-text/90">{match.selector_name}</span>
        </div>
      )}

      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-primary transition-all duration-500 group-hover:w-full"
      />
    </Link>
  );
}