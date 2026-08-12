import { PlayerAvatar } from './PlayerAvatar';
import { AwardBadges } from './AwardBadges';
import type { PlayerSeasonStats } from '@/lib/types';
import type { AwardWithSeason } from '@/lib/queries';
import { fmtNum } from '@/lib/format';

interface Props {
  stat: PlayerSeasonStats;
  awards?: AwardWithSeason[];
}

export function PlayerCard({ stat, awards }: Props) {
  return (
    <a
      href={`/players/${stat.slug}`}
      className="card card-hover p-4 flex flex-col gap-3 group"
    >
      <div className="flex items-center gap-3">
        <PlayerAvatar name={stat.display_name} photoUrl={stat.photo_url} size={56} className="transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[-3deg]" />
        <div className="min-w-0 flex-1">
          <div className="font-display font-semibold truncate group-hover:text-primary transition-colors duration-200 inline-flex items-center gap-1.5 max-w-full">
            <span className="truncate">{stat.display_name}</span>
            <AwardBadges awards={awards} size="sm" />
          </div>
          {stat.nickname && <div className="text-xs text-muted truncate">„{stat.nickname}"</div>}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-1">
        <Mini label="UTK" value={stat.matches_played} />
        <Mini label="G" value={stat.goals} accent="text-primary" />
        <Mini label="A" value={stat.assists} accent="text-secondary" />
        <Mini label="BOD" value={stat.points} accent="text-warning" />
      </div>
      <div className="text-[11px] text-muted flex justify-between border-t border-border/50 pt-2">
        <span>G+A: <span className="text-text font-medium">{stat.goals_plus_assists}</span></span>
        <span>OC: <span className="text-warning font-medium">{stat.skill_total || '-'}</span></span>
        <span>G/U: <span className="text-text font-medium">{fmtNum(stat.goals_per_match, 2)}</span></span>
      </div>
    </a>
  );
}

function Mini({ label, value, accent = 'text-text' }: { label: string; value: number; accent?: string }) {
  return (
    <div className="text-center bg-background/40 rounded-lg py-1.5 border border-border/40 transition-colors group-hover:border-border/80">
      <div className={`text-base font-display font-bold tabular-nums ${accent}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-[0.14em] text-muted">{label}</div>
    </div>
  );
}
