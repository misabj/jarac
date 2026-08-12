import Link from 'next/link';
import { PlayerAvatar } from './PlayerAvatar';
import { AwardBadges } from './AwardBadges';
import type { AwardWithSeason } from '@/lib/queries';

interface Item {
  player_id: number;
  display_name: string;
  slug: string;
  photo_url?: string | null;
  primary: string | number;
  secondary?: string | number;
}

interface Props {
  title: string;
  subtitle?: string;
  items: Item[];
  accent?: 'primary' | 'secondary' | 'warning' | 'danger';
  unit?: string;
  href?: string;
  awardsByPlayer?: Map<number, AwardWithSeason[]>;
  pinByAward?: 'top_scorer' | 'top_assistant' | 'season_mvp' | 'top_own_goals';
}

const accentMap = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  warning: 'text-warning',
  danger: 'text-danger',
};

const ringMap = {
  primary: 'bg-primary/15 text-primary',
  secondary: 'bg-secondary/15 text-secondary',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
};

export function StatCard({ title, subtitle, items, accent = 'primary', unit, href, awardsByPlayer, pinByAward }: Props) {
  let displayItems = items;
  if (pinByAward && awardsByPlayer) {
    let pinnedId: number | null = null;
    for (const [pid, list] of awardsByPlayer) {
      if (list.some((a) => a.type === pinByAward)) {
        pinnedId = pid;
        break;
      }
    }
    if (pinnedId != null) {
      const idx = items.findIndex((it) => it.player_id === pinnedId);
      if (idx > 0) {
        const copy = [...items];
        const [pinned] = copy.splice(idx, 1);
        copy.unshift(pinned);
        displayItems = copy;
      }
    }
  }

  return (
    <div className="card card-hover p-5 flex flex-col">
      {href && (
        <Link
          href={href}
          aria-label={`${title} - sve`}
          className="absolute inset-0 z-10 rounded-2xl"
        />
      )}

      <div className="relative z-20 pointer-events-none flex items-baseline justify-between mb-4">
        <div>
          <h3 className="text-sm font-display font-semibold uppercase tracking-[0.18em] text-muted">{title}</h3>
          {subtitle && <div className="text-[11px] text-muted/80 mt-0.5">{subtitle}</div>}
        </div>
        {href && <span className="text-xs text-secondary">sve →</span>}
      </div>

      {displayItems.length === 0 ? (
        <div className="relative z-20 pointer-events-none text-sm text-muted py-4 text-center">Nema podataka</div>
      ) : (
        <ol className="relative z-20 pointer-events-none space-y-1.5">
          {displayItems.slice(0, 5).map((it, i) => (
            <li
              key={it.player_id}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <a
                href={`/players/${it.slug}`}
                className="pointer-events-auto flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-card-hover/70 transition-all duration-200 hover:translate-x-1"
              >
                <span className={`grid place-items-center h-6 w-6 rounded-md text-[11px] font-bold tabular-nums ${i === 0 ? ringMap[accent] : 'bg-background/40 text-muted'}`}>
                  {i + 1}
                </span>
                <PlayerAvatar name={it.display_name} photoUrl={it.photo_url} size={32} />
                <span className="flex-1 truncate text-sm font-medium inline-flex items-center gap-1.5 min-w-0">
                  <span className="truncate">{it.display_name}</span>
                  <AwardBadges awards={awardsByPlayer?.get(it.player_id)} size="xs" />
                </span>
                <span className={`font-display font-bold tabular-nums ${accentMap[accent]}`}>
                  {it.primary}
                  {unit && <span className="text-[10px] text-muted ml-0.5">{unit}</span>}
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
