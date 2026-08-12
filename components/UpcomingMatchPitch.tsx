import Link from 'next/link';
import type { CSSProperties } from 'react';
import { PlayerAvatar } from './PlayerAvatar';
import type { Match, MatchPlayerWithPlayer } from '@/lib/types';
import { fmtDateTime } from '@/lib/format';

type Slot = { x: number; y: number; mobileX?: number; mobileY?: number };
const starterPositions = ['goalkeeper', 'defense_top', 'defense_bottom', 'attack_top', 'attack_bottom'] as const;

const whiteSlots: Slot[] = [
  { x: 7, mobileX: 11, y: 50 },
  { x: 23, mobileX: 22, y: 31, mobileY: 31 },
  { x: 23, mobileX: 22, y: 69, mobileY: 69 },
  { x: 37, mobileX: 36, y: 31, mobileY: 31 },
  { x: 37, mobileX: 36, y: 69, mobileY: 69 },
];

const coloredSlots: Slot[] = [
  { x: 93, mobileX: 89, y: 50 },
  { x: 77, mobileX: 78, y: 31, mobileY: 31 },
  { x: 77, mobileX: 78, y: 69, mobileY: 69 },
  { x: 63, mobileX: 64, y: 31, mobileY: 31 },
  { x: 63, mobileX: 64, y: 69, mobileY: 69 },
];

interface Props {
  match: Match;
  players: MatchPlayerWithPlayer[];
  eyebrow?: string;
  showDetailsLink?: boolean;
  className?: string;
  compact?: boolean;
}

export function UpcomingMatchPitch({
  match,
  players,
  eyebrow = 'Sledeci mec / postave',
  showDetailsLink = true,
  className = '',
  compact = false,
}: Props) {
  const whites = players.filter((p) => p.team === 'white');
  const coloreds = players.filter((p) => p.team === 'colored');
  const whiteLineup = splitLineup(whites);
  const coloredLineup = splitLineup(coloreds);
  const hasLineups = whites.length > 0 || coloreds.length > 0;
  const sectionSpacing = compact ? '' : 'mt-8 sm:mt-10';
  const headingClass = compact
    ? 'mt-1 font-display text-xl font-bold sm:text-2xl'
    : 'mt-1 font-display text-2xl font-bold sm:text-3xl';
  const metaClass = compact ? 'mt-1 text-xs sm:text-sm text-muted' : 'mt-1 text-sm text-muted';
  const fieldClass = compact
    ? 'relative h-[300px] xs:h-[330px] sm:h-[390px] lg:h-[430px]'
    : 'relative h-[390px] xs:h-[410px] sm:h-auto sm:aspect-[16/9] sm:min-h-[430px]';
  const pitchInsetClass = compact ? 'absolute inset-2 sm:inset-4' : undefined;

  return (
    <section className={`${sectionSpacing} animate-fade-up ${className}`} style={{ animationDelay: '260ms' }}>
      <div className={`${compact ? 'mb-2' : 'mb-4'} flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between`}>
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-warning">
            <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
            {eyebrow}
          </div>
          <h2 className={headingClass}>Beli protiv Šarenih</h2>
          <p className={metaClass}>
            5 vs 5 &bull; {fmtDateTime(match.played_at)} &bull; {match.venue}
          </p>
        </div>
        {showDetailsLink && (
          <Link href={`/matches/${match.id}`} className={`${compact ? 'px-3 py-2 text-xs' : 'text-sm'} btn-ghost self-start sm:self-auto`}>
            Detalji meča
          </Link>
        )}
      </div>

      <div className="relative w-full overflow-hidden rounded-2xl border border-emerald-300/20 bg-[#123f2a] shadow-card">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(90deg,rgba(34,197,94,0.14),rgba(56,189,248,0.08),rgba(245,158,11,0.12))]" />
        <div aria-hidden className="absolute inset-0 opacity-[0.16] [background-image:repeating-linear-gradient(90deg,transparent_0,transparent_8%,rgba(255,255,255,0.2)_8%,rgba(255,255,255,0.2)_16%)]" />

        <div className={fieldClass}>
          <PitchLines className={pitchInsetClass} />

          <div className="absolute left-[29%] top-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-display text-lg font-bold uppercase tracking-[0.18em] text-white/20 sm:left-[30%] sm:text-2xl">
            Beli
          </div>
          <div className="absolute left-[74%] top-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-display text-lg font-bold uppercase tracking-[0.18em] text-white/20 sm:left-[70%] sm:text-2xl">
            Šareni
          </div>

          {whiteLineup.starters.map((player, index) => (
            <PitchPlayer key={player.id} player={player} slot={whiteSlots[index % whiteSlots.length]} team="white" compact={compact} />
          ))}
          {coloredLineup.starters.map((player, index) => (
            <PitchPlayer key={player.id} player={player} slot={coloredSlots[index % coloredSlots.length]} team="colored" compact={compact} />
          ))}

          {!hasLineups && (
            <div className="absolute inset-x-4 top-1/2 mx-auto max-w-md -translate-y-1/2 rounded-xl border border-white/15 bg-background/70 px-4 py-5 text-center text-sm text-muted backdrop-blur">
              Postave jos nisu dodate. Admin moze da ih upise na stranici ove utakmice.
            </div>
          )}
        </div>
      </div>

      {(whiteLineup.reserves.length > 0 || coloredLineup.reserves.length > 0) && (
        <div className="mt-2 grid w-full grid-cols-2 gap-2 sm:gap-3">
          <ReserveBench title="Rezerve - Beli" team="white" players={whiteLineup.reserves} compact={compact} />
          <ReserveBench title="Rezerve - Šareni" team="colored" players={coloredLineup.reserves} compact={compact} />
        </div>
      )}
    </section>
  );
}

function splitLineup(players: MatchPlayerWithPlayer[]) {
  const markedReserves = players.filter((player) => isReserve(player));
  const candidates = orderStarters(players.filter((player) => !isReserve(player)));

  return {
    starters: candidates.slice(0, 5),
    reserves: [...candidates.slice(5), ...markedReserves],
  };
}

function orderStarters(players: MatchPlayerWithPlayer[]) {
  const assigned = new Map<string, MatchPlayerWithPlayer>();
  const automatic: MatchPlayerWithPlayer[] = [];

  for (const player of players) {
    const position = player.lineup_position;
    if (position && starterPositions.includes(position as (typeof starterPositions)[number]) && !assigned.has(position)) {
      assigned.set(position, player);
    } else {
      automatic.push(player);
    }
  }

  return starterPositions
    .map((position) => assigned.get(position) ?? automatic.shift())
    .filter((player): player is MatchPlayerWithPlayer => Boolean(player))
    .concat(automatic);
}

function isReserve(player: MatchPlayerWithPlayer) {
  if (player.lineup_position) return player.lineup_position === 'reserve';
  return (player.comment ?? '').toLowerCase().includes('reserve');
}

function PitchLines({ className = 'absolute inset-3 sm:inset-5' }: { className?: string }) {
  return (
    <div aria-hidden className={className}>
      <div className="absolute inset-0 rounded-xl border-2 border-white/70" />
      <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-white/70" />
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70 sm:h-32 sm:w-32" />
      <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />

      <div className="absolute left-0 top-1/2 h-32 w-[11%] -translate-y-1/2 border-y-2 border-r-2 border-white/70 sm:h-40" />
      <div className="absolute right-0 top-1/2 h-32 w-[11%] -translate-y-1/2 border-y-2 border-l-2 border-white/70 sm:h-40" />
      <div className="absolute left-0 top-1/2 h-16 w-[5%] -translate-y-1/2 border-y-2 border-r-2 border-white/70 sm:h-20" />
      <div className="absolute right-0 top-1/2 h-16 w-[5%] -translate-y-1/2 border-y-2 border-l-2 border-white/70 sm:h-20" />

      <div className="absolute -left-2 top-1/2 h-16 w-2 -translate-y-1/2 rounded-l border-y-2 border-l-2 border-white/70 sm:h-20" />
      <div className="absolute -right-2 top-1/2 h-16 w-2 -translate-y-1/2 rounded-r border-y-2 border-r-2 border-white/70 sm:h-20" />
    </div>
  );
}

function PitchPlayer({
  player,
  slot,
  team,
  compact = false,
}: {
  player: MatchPlayerWithPlayer;
  slot: Slot;
  team: 'white' | 'colored';
  compact?: boolean;
}) {
  const label = player.nickname || player.display_name;
  const ringClass = team === 'white' ? 'ring-white/90' : 'ring-warning/80';
  const avatarSize = compact ? 36 : 44;
  const avatarClass = compact
    ? `ring-2 ${ringClass} shadow-[0_10px_28px_rgba(0,0,0,0.42)] sm:h-12 sm:w-12`
    : `ring-2 ${ringClass} shadow-[0_10px_28px_rgba(0,0,0,0.42)] sm:h-14 sm:w-14`;

  return (
    <a
      href={`/players/${player.slug}`}
      className={`absolute left-[var(--mobile-x)] top-[var(--mobile-y)] z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-center transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:left-[var(--slot-x)] sm:top-[var(--slot-y)] ${
        compact ? 'w-14 xs:w-16 sm:w-20' : 'w-16 xs:w-20 sm:w-24'
      }`}
      style={{
        '--slot-x': `${slot.x}%`,
        '--mobile-x': `${slot.mobileX ?? slot.x}%`,
        '--slot-y': `${slot.y}%`,
        '--mobile-y': `${slot.mobileY ?? slot.y}%`,
      } as CSSProperties}
      title={player.display_name}
    >
      <GoalBalls goals={player.goals} />
      <PlayerAvatar
        name={player.display_name}
        photoUrl={player.photo_url}
        size={avatarSize}
        className={avatarClass}
      />
      <span
        className={`max-w-full font-bold leading-tight text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.95)] ${
          compact ? 'text-[9px] sm:text-[11px]' : 'text-[10px] sm:text-xs'
        }`}
      >
        {label}
      </span>
    </a>
  );
}

function GoalBalls({ goals }: { goals: number }) {
  const count = Math.max(0, Number(goals) || 0);
  if (count === 0) return null;

  return (
    <div
      className="pointer-events-none absolute -top-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 text-[10px] font-black leading-none text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] sm:-top-6 sm:text-xs"
      aria-label={`${count} golova`}
    >
      <span aria-hidden>⚽</span>
      <span className="tabular-nums">x{count}</span>
    </div>
  );
}

function ReserveBench({
  title,
  team,
  players,
  compact = false,
}: {
  title: string;
  team: 'white' | 'colored';
  players: MatchPlayerWithPlayer[];
  compact?: boolean;
}) {
  const borderClass = team === 'white' ? 'border-white/20' : 'border-warning/30';

  return (
    <div className={`rounded-xl border ${borderClass} bg-background/45 ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'} backdrop-blur`}>
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{title}</div>
      <div className="flex flex-wrap gap-2">
        {players.map((player) => (
          <a
            key={player.id}
            href={`/players/${player.slug}`}
            className="flex min-w-0 items-center gap-1.5 rounded-lg border border-white/10 bg-card/70 px-1.5 py-1.5 transition hover:border-primary/40 hover:bg-card-hover sm:gap-2 sm:px-2"
          >
            <PlayerAvatar name={player.display_name} photoUrl={player.photo_url} size={28} />
            <span className="max-w-[86px] truncate text-[11px] font-semibold text-text sm:max-w-[150px] sm:text-xs">
              {player.nickname || player.display_name}
            </span>
          </a>
        ))}
        {players.length === 0 && <span className="text-xs text-muted">Nema rezervi.</span>}
      </div>
    </div>
  );
}
