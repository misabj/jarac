import type { AwardWithSeason } from '@/lib/queries';
import { isSummerDevelopmentLeague } from '@/lib/seasonLabels';

const TYPE_META: Record<AwardWithSeason['type'], { icon: string; label: string; color: string }> = {
  season_mvp:     { icon: '🏆', label: 'MVP sezone',             color: 'text-warning' },
  top_scorer:     { icon: '⚽', label: 'Najbolji strelac',        color: 'text-primary' },
  top_assistant:  { icon: '🎯', label: 'Najbolji asistent',       color: 'text-secondary' },
  top_own_goals:  { icon: '🤡', label: 'Najviše autogolova',      color: 'text-danger' },
  match_mvp:      { icon: '⭐', label: 'MVP utakmice',            color: 'text-warning' },
  fair_play:      { icon: '🤝', label: 'Fer-plej',                color: 'text-secondary' },
  special:        { icon: '🎖️', label: 'Specijalna nagrada',      color: 'text-warning' },
};

interface BadgesProps {
  awards: AwardWithSeason[] | undefined;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

/**
 * Mali red ikonica trofeja koji se prikazuje inline pored imena igrača.
 * Svaka ikonica ima `title` tooltip sa nazivom nagrade i sezonom.
 */
export function AwardBadges({ awards, size = 'sm', className = '' }: BadgesProps) {
  if (!awards || awards.length === 0) return null;
  const sizeCls =
    size === 'xs' ? 'text-[11px]' : size === 'md' ? 'text-base' : 'text-[13px]';
  return (
    <span className={`inline-flex items-center gap-0.5 align-middle leading-none ${sizeCls} ${className}`}>
      {awards.map((a) => {
        const m = TYPE_META[a.type];
        if (!m) return null;
        const label = getAwardLabel(a, m.label);
        return (
          <span
            key={a.id}
            title={`${label} • ${a.season_name}${a.description ? ` — ${a.description}` : ''}`}
            className="inline-block hover:scale-110 transition-transform duration-150 cursor-help"
            aria-label={label}
          >
            {m.icon}
          </span>
        );
      })}
    </span>
  );
}

interface AwardChipsProps {
  awards: AwardWithSeason[] | undefined;
  className?: string;
}

/**
 * Prošireni prikaz (sa nazivima) za profil igrača.
 */
export function AwardChips({ awards, className = '' }: AwardChipsProps) {
  if (!awards || awards.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {awards.map((a) => {
        const m = TYPE_META[a.type];
        if (!m) return null;
        const label = getAwardLabel(a, m.label);
        return (
          <span
            key={a.id}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold
              bg-warning/10 border border-warning/30 ${m.color}`}
            title={a.description ?? undefined}
          >
            <span className="text-sm leading-none">{m.icon}</span>
            <span>{label}</span>
            <span className="text-muted font-normal text-[10px]">• {a.season_name}</span>
          </span>
        );
      })}
    </div>
  );
}

function getAwardLabel(award: AwardWithSeason, fallback: string) {
  if (!isSummerDevelopmentLeague(award.season_name)) return fallback;
  if (award.type === 'season_mvp') return 'MVP trka';
  if (award.type === 'top_scorer') return 'Najbolji strelac letnje lige';
  if (award.type === 'top_assistant') return 'Najbolji asistent letnje lige';
  if (award.type === 'top_own_goals') return 'Najviše autogolova letnje lige';
  return fallback;
}
