'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  addMatchPlayerAction,
  updateMatchPlayerAction,
  removeMatchPlayerAction,
  updateMatchLineupAction,
} from '@/app/admin/actions';
import type { MatchPlayerWithPlayer, Player } from '@/lib/types';
import { PlayerAvatar } from './PlayerAvatar';
import { TeamBadge } from './TeamBadge';

interface Props {
  matchId: number;
  players: MatchPlayerWithPlayer[];
  allPlayers: Player[];
}

export function MatchSquadEditor({ matchId, players, allPlayers }: Props) {
  const usedIds = new Set(players.map((p) => p.player_id));
  const available = allPlayers.filter((p) => !usedIds.has(p.id));
  const whites = players.filter((p) => p.team === 'white');
  const coloreds = players.filter((p) => p.team === 'colored');
  const liveScore = getLiveScore(players);

  return (
    <div className="space-y-7">
      <LiveScorePanel whiteScore={liveScore.white} coloredScore={liveScore.colored} players={players} />

      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="stat-label">Live unos</div>
            <h2 className="mt-1 font-display text-2xl font-bold">Golovi, asistencije i ocene</h2>
          </div>
          <div className="text-xs text-muted">Rezultat se automatski računa posle čuvanja igrača.</div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <TeamEditor team="white" matchId={matchId} players={whites} score={liveScore.white} />
          <TeamEditor team="colored" matchId={matchId} players={coloreds} score={liveScore.colored} />
        </div>
      </section>

      <AddPlayerForm matchId={matchId} available={available} />
      <LineupEditor matchId={matchId} players={players} />
    </div>
  );
}

function getLiveScore(players: MatchPlayerWithPlayer[]) {
  const whiteGoals = players.filter((p) => p.team === 'white').reduce((sum, p) => sum + p.goals, 0);
  const coloredGoals = players.filter((p) => p.team === 'colored').reduce((sum, p) => sum + p.goals, 0);
  const whiteOwnGoals = players.filter((p) => p.team === 'white').reduce((sum, p) => sum + p.own_goals, 0);
  const coloredOwnGoals = players.filter((p) => p.team === 'colored').reduce((sum, p) => sum + p.own_goals, 0);

  return {
    white: whiteGoals + coloredOwnGoals,
    colored: coloredGoals + whiteOwnGoals,
  };
}

function LiveScorePanel({
  whiteScore,
  coloredScore,
  players,
}: {
  whiteScore: number;
  coloredScore: number;
  players: MatchPlayerWithPlayer[];
}) {
  const goals = players.reduce((sum, p) => sum + p.goals, 0);
  const assists = players.reduce((sum, p) => sum + p.assists, 0);
  const ownGoals = players.reduce((sum, p) => sum + p.own_goals, 0);

  return (
    <section className="card p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="stat-label">Automatski skor</div>
          <div className="mt-1 flex items-center gap-3">
            <TeamBadge team="white" />
            <div className="font-display text-5xl font-bold tabular-nums leading-none">
              <span className={whiteScore > coloredScore ? 'text-primary' : 'text-text'}>{whiteScore}</span>
              <span className="mx-2 text-muted">:</span>
              <span className={coloredScore > whiteScore ? 'text-primary' : 'text-text'}>{coloredScore}</span>
            </div>
            <TeamBadge team="colored" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
          <MiniStat label="Golovi" value={goals} accent="text-primary" />
          <MiniStat label="Asist." value={assists} accent="text-secondary" />
          <MiniStat label="Autog." value={ownGoals} accent="text-danger" />
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/35 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}

function AddPlayerForm({ matchId, available }: { matchId: number; available: Player[] }) {
  const [pending, start] = useTransition();
  const [team, setTeam] = useState<'white' | 'colored'>('white');

  return (
    <div className="card p-4">
      <div className="text-sm font-semibold mb-3">Dodaj igrača u utakmicu</div>
      <form
        action={(fd) => start(() => addMatchPlayerAction(fd))}
        className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-2"
      >
        <input type="hidden" name="match_id" value={matchId} />
        <select name="player_id" className="input" required defaultValue="">
          <option value="" disabled>Izaberi igrača…</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>{p.display_name}</option>
          ))}
        </select>
        <select
          name="team"
          className="input"
          value={team}
          onChange={(e) => setTeam(e.target.value as 'white' | 'colored')}
        >
          <option value="white">Beli</option>
          <option value="colored">Šareni</option>
        </select>
        <button className="btn-primary px-5" disabled={pending || available.length === 0}>
          {pending ? '...' : '+ Dodaj'}
        </button>
      </form>
      {available.length === 0 && (
        <p className="text-xs text-muted mt-2">Svi igrači su već u sastavu.</p>
      )}
    </div>
  );
}

type LineupPosition = 'auto' | 'goalkeeper' | 'defense_top' | 'defense_bottom' | 'attack_top' | 'attack_bottom' | 'reserve';
type StarterPosition = Exclude<LineupPosition, 'auto' | 'reserve'>;
type LineupEntry = {
  id: number;
  team: 'white' | 'colored';
  position: LineupPosition;
  comment: string | null;
};
type Slot = { x: number; y: number };

const starterPositions: StarterPosition[] = ['goalkeeper', 'defense_top', 'defense_bottom', 'attack_top', 'attack_bottom'];
const whiteSlots: Slot[] = [
  { x: 8, y: 50 },
  { x: 23, y: 34 },
  { x: 23, y: 66 },
  { x: 37, y: 34 },
  { x: 37, y: 66 },
];
const coloredSlots: Slot[] = [
  { x: 92, y: 50 },
  { x: 77, y: 34 },
  { x: 77, y: 66 },
  { x: 63, y: 34 },
  { x: 63, y: 66 },
];
const positionLabels: Record<LineupPosition, string> = {
  auto: 'Auto',
  goalkeeper: 'Gol',
  defense_top: 'Odbrana gore',
  defense_bottom: 'Odbrana dole',
  attack_top: 'Napad gore',
  attack_bottom: 'Napad dole',
  reserve: 'Rezerva',
};

function LineupEditor({ matchId, players }: { matchId: number; players: MatchPlayerWithPlayer[] }) {
  const [pending, start] = useTransition();
  const [entries, setEntries] = useState<LineupEntry[]>(() =>
    players.map((player) => ({
      id: player.id,
      team: player.team,
      position: normalizeInitialPosition(player),
      comment: player.comment,
    }))
  );

  const playersByMatchId = useMemo(() => new Map(players.map((player) => [player.id, player])), [players]);
  const lineups = getLineups(entries, playersByMatchId);

  function updateTeam(id: number, team: 'white' | 'colored') {
    setEntries((current) =>
      normalizeEntries(current.map((entry) => (entry.id === id ? { ...entry, team } : entry)))
    );
  }

  function updatePosition(id: number, position: LineupPosition) {
    setEntries((current) => {
      const target = current.find((entry) => entry.id === id);
      if (!target) return current;

      return normalizeEntries(
        current.map((entry) => {
          if (entry.id === id) return { ...entry, position };
          if (isStarterPosition(position) && entry.team === target.team && entry.position === position) {
            return { ...entry, position: 'auto' };
          }
          return entry;
        })
      );
    });
  }

  return (
    <div className="card p-4">
      <form action={(fd) => start(() => updateMatchLineupAction(fd))} className="space-y-4">
        <input type="hidden" name="match_id" value={matchId} />
        <input type="hidden" name="lineup_players" value={JSON.stringify(serializeLineup(entries))} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="stat-label">Postave</div>
            <h3 className="mt-1 font-display text-xl font-bold">Raspored utakmice</h3>
          </div>
          <button className="btn-primary self-start px-4 text-sm sm:self-auto" disabled={pending}>
            {pending ? 'Cuvanje...' : 'Sacuvaj raspored'}
          </button>
        </div>

        <LineupPitchPreview
          white={lineups.white}
          colored={lineups.colored}
          whiteReserves={lineups.whiteReserves}
          coloredReserves={lineups.coloredReserves}
        />

        <div className="overflow-hidden rounded-xl border border-border/70">
          <div className="border-b border-border/70 bg-card/50 px-3 py-3">
            <div className="stat-label">Teren i pozicije</div>
          </div>
          <div className="hidden grid-cols-[minmax(0,1fr)_120px_160px] gap-2 border-b border-border/70 bg-card/30 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-muted sm:grid">
            <span>Igrac</span>
            <span>Tim</span>
            <span>Pozicija</span>
          </div>
          <div className="max-h-[430px] overflow-y-auto">
            {entries.map((entry) => {
              const player = playersByMatchId.get(entry.id);
              if (!player) return null;
              return (
                <div key={entry.id} className="grid grid-cols-2 items-center gap-2 border-b border-border/40 px-3 py-2 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_120px_160px]">
                  <div className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-1">
                    <PlayerAvatar name={player.display_name} photoUrl={player.photo_url} size={32} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{player.nickname || player.display_name}</div>
                      <div className="text-[11px] text-muted">{entry.position === 'reserve' ? 'Rezerva' : positionLabels[entry.position]}</div>
                    </div>
                  </div>
                  <select
                    className="input px-2 py-1.5 text-xs"
                    value={entry.team}
                    onChange={(event) => updateTeam(entry.id, event.target.value as 'white' | 'colored')}
                  >
                    <option value="white">Beli</option>
                    <option value="colored">Sareni</option>
                  </select>
                  <select
                    className="input px-2 py-1.5 text-xs"
                    value={entry.position}
                    onChange={(event) => updatePosition(entry.id, event.target.value as LineupPosition)}
                  >
                    {(Object.keys(positionLabels) as LineupPosition[]).map((position) => (
                      <option key={position} value={position}>
                        {positionLabels[position]}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
}

function TeamEditor({
  team,
  matchId,
  players,
  score,
}: {
  team: 'white' | 'colored';
  matchId: number;
  players: MatchPlayerWithPlayer[];
  score: number;
}) {
  return (
    <div className="card overflow-hidden border-primary/10">
      <div className="px-4 py-4 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TeamBadge team={team} />
          <span className="text-xs text-muted">{players.length} igrača</span>
        </div>
        <div className="font-display text-4xl font-bold tabular-nums text-primary">{score}</div>
      </div>
      <div className="divide-y divide-border/50">
        {players.map((p) => (
          <PlayerRow key={p.id} player={p} matchId={matchId} />
        ))}
        {players.length === 0 && (
          <div className="p-6 text-center text-muted text-sm">Nema igrača u ovom timu.</div>
        )}
      </div>
    </div>
  );
}

function PlayerRow({ player, matchId }: { player: MatchPlayerWithPlayer; matchId: number }) {
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => updateMatchPlayerAction(fd))}
      className="p-4 transition-colors hover:bg-card-hover/35"
    >
      <input type="hidden" name="id" value={player.id} />
      <input type="hidden" name="match_id" value={matchId} />
      <input type="hidden" name="team" value={player.team} />
      <div className="flex flex-col gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <PlayerAvatar name={player.display_name} photoUrl={player.photo_url} size={48} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-bold leading-tight">{player.nickname || player.display_name}</div>
            {player.nickname && <div className="truncate text-xs text-muted">{player.display_name}</div>}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!confirm('Ukloniti igrača iz utakmice?')) return;
              const fd = new FormData();
              fd.set('id', String(player.id));
              fd.set('match_id', String(matchId));
              start(() => removeMatchPlayerAction(fd));
            }}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-danger transition hover:bg-danger/10"
          >
            ukloni
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Field label="Golovi" name="goals" defaultValue={player.goals} accent="text-primary" />
          <Field label="Asist." name="assists" defaultValue={player.assists} accent="text-secondary" />
          <Field label="Autog." name="own_goals" defaultValue={player.own_goals} accent="text-danger" />
          <Field label="Ocena" name="rating" step="0.1" defaultValue={player.rating ?? ''} accent="text-warning" />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
          <label className="flex h-11 items-center gap-2 rounded-xl border border-border/60 bg-background/35 px-3 text-sm font-semibold cursor-pointer">
            <input type="checkbox" name="is_mvp" defaultChecked={player.is_mvp === 1} className="h-4 w-4 accent-warning" />
            <span className="text-warning">MVP</span>
          </label>
          <input
            name="comment"
            placeholder="komentar (opciono)"
            defaultValue={player.comment ?? ''}
            className="input h-11 py-2 text-sm"
          />
          <button className="btn-primary h-11 px-5 text-sm" disabled={pending}>
            {pending ? 'Čuvanje...' : 'Sačuvaj'}
          </button>
        </div>
      </div>
    </form>
  );
}

function LineupPitchPreview({
  white,
  colored,
  whiteReserves,
  coloredReserves,
}: {
  white: MatchPlayerWithPlayer[];
  colored: MatchPlayerWithPlayer[];
  whiteReserves: MatchPlayerWithPlayer[];
  coloredReserves: MatchPlayerWithPlayer[];
}) {
  return (
    <div className="min-w-0">
      <div className="relative h-[340px] overflow-hidden rounded-2xl border border-emerald-300/20 bg-[#123f2a] sm:h-[380px] xl:h-[420px]">
        <div aria-hidden className="absolute inset-0 opacity-[0.16] [background-image:repeating-linear-gradient(90deg,transparent_0,transparent_9%,rgba(255,255,255,0.2)_9%,rgba(255,255,255,0.2)_18%)]" />
        <PitchLines />
        <div className="absolute left-[29%] top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-lg font-bold uppercase tracking-[0.18em] text-white/20">
          Beli
        </div>
        <div className="absolute left-[74%] top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-lg font-bold uppercase tracking-[0.18em] text-white/20">
          Šareni
        </div>
        {white.map((player, index) => (
          <PitchPlayer key={player.id} player={player} slot={whiteSlots[index]} team="white" />
        ))}
        {colored.map((player, index) => (
          <PitchPlayer key={player.id} player={player} slot={coloredSlots[index]} team="colored" />
        ))}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <ReserveList title="Rez. Beli" players={whiteReserves} />
        <ReserveList title="Rez. Sareni" players={coloredReserves} />
      </div>
    </div>
  );
}

function PitchLines() {
  return (
    <div aria-hidden className="absolute inset-3">
      <div className="absolute inset-0 rounded-xl border-2 border-white/70" />
      <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-white/70" />
      <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70" />
      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
      <div className="absolute left-0 top-1/2 h-24 w-[12%] -translate-y-1/2 border-y-2 border-r-2 border-white/70" />
      <div className="absolute right-0 top-1/2 h-24 w-[12%] -translate-y-1/2 border-y-2 border-l-2 border-white/70" />
      <div className="absolute left-0 top-1/2 h-14 w-[6%] -translate-y-1/2 border-y-2 border-r-2 border-white/70" />
      <div className="absolute right-0 top-1/2 h-14 w-[6%] -translate-y-1/2 border-y-2 border-l-2 border-white/70" />
    </div>
  );
}

function PitchPlayer({
  player,
  slot,
  team,
}: {
  player: MatchPlayerWithPlayer;
  slot: Slot | undefined;
  team: 'white' | 'colored';
}) {
  if (!slot) return null;

  return (
    <div
      className="absolute z-10 flex w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-center"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
    >
      <GoalBalls goals={player.goals} />
      <PlayerAvatar
        name={player.display_name}
        photoUrl={player.photo_url}
        size={36}
        className={`ring-2 ${team === 'white' ? 'ring-white/90' : 'ring-warning/80'}`}
      />
      <span className="max-w-full truncate text-[10px] font-bold leading-tight text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.95)]">
        {player.nickname || player.display_name}
      </span>
    </div>
  );
}

function GoalBalls({ goals }: { goals: number }) {
  const count = Math.max(0, Number(goals) || 0);
  if (count === 0) return null;

  return (
    <div
      className="pointer-events-none absolute -top-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 text-[10px] font-black leading-none text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]"
      aria-label={`${count} golova`}
    >
      <span aria-hidden>⚽</span>
      <span className="tabular-nums">x{count}</span>
    </div>
  );
}

function ReserveList({ title, players }: { title: string; players: MatchPlayerWithPlayer[] }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/40 p-2">
      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-muted">{title}</div>
      <div className="space-y-1">
        {players.map((player) => (
          <div key={player.id} className="truncate text-xs font-semibold">
            {player.nickname || player.display_name}
          </div>
        ))}
        {players.length === 0 && <div className="text-xs text-muted">-</div>}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  step,
  accent = 'text-text',
}: {
  label: string;
  name: string;
  defaultValue: number | string;
  step?: string;
  accent?: string;
}) {
  return (
    <label className="block rounded-xl border border-border/60 bg-background/35 p-2">
      <span className="text-[10px] uppercase tracking-wider text-muted">{label}</span>
      <input
        name={name}
        type="number"
        step={step ?? '1'}
        min={0}
        defaultValue={defaultValue}
        inputMode="numeric"
        className={`mt-1 h-11 w-full rounded-lg border border-border/70 bg-background/70 px-2 text-center font-display text-xl font-bold tabular-nums outline-none transition focus:border-primary/70 focus:ring-4 focus:ring-primary/15 ${accent}`}
      />
    </label>
  );
}

function normalizeInitialPosition(player: MatchPlayerWithPlayer): LineupPosition {
  if (isLineupPosition(player.lineup_position)) return player.lineup_position;
  if ((player.comment ?? '').toLowerCase().includes('reserve')) return 'reserve';
  return 'auto';
}

function serializeLineup(entries: LineupEntry[]) {
  const groups = getLineupEntryGroups(entries);

  return [
    ...groups.white.map((entry, index) => ({
      id: entry.id,
      team: 'white',
      position: starterPositions[index],
      comment: entry.comment,
    })),
    ...groups.whiteReserves.map((entry) => ({
      id: entry.id,
      team: 'white',
      position: 'reserve',
      comment: entry.comment,
    })),
    ...groups.colored.map((entry, index) => ({
      id: entry.id,
      team: 'colored',
      position: starterPositions[index],
      comment: entry.comment,
    })),
    ...groups.coloredReserves.map((entry) => ({
      id: entry.id,
      team: 'colored',
      position: 'reserve',
      comment: entry.comment,
    })),
  ];
}

function getLineups(entries: LineupEntry[], playersByMatchId: Map<number, MatchPlayerWithPlayer>) {
  const groups = getLineupEntryGroups(entries);
  const toPlayers = (lineupEntries: LineupEntry[]) =>
    lineupEntries
      .map((entry) => playersByMatchId.get(entry.id))
      .filter((player): player is MatchPlayerWithPlayer => Boolean(player));

  return {
    white: toPlayers(groups.white),
    colored: toPlayers(groups.colored),
    whiteReserves: toPlayers(groups.whiteReserves),
    coloredReserves: toPlayers(groups.coloredReserves),
  };
}

function getLineupEntryGroups(entries: LineupEntry[]) {
  const white = orderStarterEntries(entries.filter((entry) => entry.team === 'white' && entry.position !== 'reserve'));
  const colored = orderStarterEntries(entries.filter((entry) => entry.team === 'colored' && entry.position !== 'reserve'));

  return {
    white: white.slice(0, 5),
    colored: colored.slice(0, 5),
    whiteReserves: [
      ...white.slice(5),
      ...entries.filter((entry) => entry.team === 'white' && entry.position === 'reserve'),
    ],
    coloredReserves: [
      ...colored.slice(5),
      ...entries.filter((entry) => entry.team === 'colored' && entry.position === 'reserve'),
    ],
  };
}

function orderStarterEntries(entries: LineupEntry[]) {
  const assigned = new Map<StarterPosition, LineupEntry>();
  const automatic: LineupEntry[] = [];

  for (const entry of entries) {
    if (isStarterPosition(entry.position) && !assigned.has(entry.position)) {
      assigned.set(entry.position, entry);
    } else {
      automatic.push(entry);
    }
  }

  return starterPositions
    .map((position) => assigned.get(position) ?? automatic.shift())
    .filter((entry): entry is LineupEntry => Boolean(entry))
    .concat(automatic);
}

function normalizeEntries(entries: LineupEntry[]) {
  const used = {
    white: new Set<LineupPosition>(),
    colored: new Set<LineupPosition>(),
  };

  return entries.map((entry) => {
    if (!isStarterPosition(entry.position)) return entry;
    if (used[entry.team].has(entry.position)) return { ...entry, position: 'auto' as const };
    used[entry.team].add(entry.position);
    return entry;
  });
}

function isLineupPosition(value: string | null | undefined): value is LineupPosition {
  return value === 'auto' || value === 'goalkeeper' || value === 'defense_top' || value === 'defense_bottom' || value === 'attack_top' || value === 'attack_bottom' || value === 'reserve';
}

function isStarterPosition(value: LineupPosition): value is StarterPosition {
  return value !== 'auto' && value !== 'reserve';
}
