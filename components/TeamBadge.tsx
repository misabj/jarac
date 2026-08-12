import type { Team } from '@/lib/types';

export function TeamBadge({ team, score, className = '' }: { team: Team; score?: number; className?: string }) {
  if (team === 'white') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-white/95 text-background border border-white/20 ${className}`}>
        <span className="h-2 w-2 rounded-full bg-background" />
        Beli
        {score !== undefined && <span className="ml-1 tabular-nums">{score}</span>}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-gradient-colored text-white border border-white/10 ${className}`}>
      <span className="h-2 w-2 rounded-full bg-white" />
      Šareni
      {score !== undefined && <span className="ml-1 tabular-nums">{score}</span>}
    </span>
  );
}
