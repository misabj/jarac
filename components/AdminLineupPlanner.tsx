'use client';

import { useMemo, useState } from 'react';
import { PlayerAvatar } from './PlayerAvatar';

export type LineupStatus = 'registered' | 'white' | 'colored' | 'white_reserve' | 'colored_reserve';
type LineupPosition = 'auto' | 'goalkeeper' | 'defense_top' | 'defense_bottom' | 'attack_top' | 'attack_bottom';
type StarterPosition = Exclude<LineupPosition, 'auto'>;

export interface AdminLineupPlannerPlayer {
  id: number;
  display_name: string;
  nickname: string | null;
  photo_url: string | null;
  balance_rating: number;
  balance_matches: number;
}

interface LineupEntry {
  playerId: number;
  status: LineupStatus;
  position: LineupPosition;
}

interface Slot {
  x: number;
  y: number;
  mobileX?: number;
  mobileY?: number;
}

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

const statusLabels: Record<LineupStatus, string> = {
  registered: 'Prijavljen',
  white: 'Beli',
  colored: 'Šareni',
  white_reserve: 'Rez. Beli',
  colored_reserve: 'Rez. Šareni',
};

const starterPositions: StarterPosition[] = [
  'goalkeeper',
  'defense_top',
  'defense_bottom',
  'attack_top',
  'attack_bottom',
];

const positionLabels: Record<LineupPosition, string> = {
  auto: 'Auto',
  goalkeeper: 'Gol',
  defense_top: 'Odbrana gore',
  defense_bottom: 'Odbrana dole',
  attack_top: 'Napad gore',
  attack_bottom: 'Napad dole',
};

export function AdminLineupPlanner({ players }: { players: AdminLineupPlannerPlayer[] }) {
  const [entries, setEntries] = useState<LineupEntry[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [search, setSearch] = useState('');

  const playersById = useMemo(() => new Map(players.map((player) => [player.id, player])), [players]);
  const usedIds = new Set(entries.map((entry) => entry.playerId));

  const availablePlayers = players
    .filter((player) => !usedIds.has(player.id))
    .filter((player) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return `${player.display_name} ${player.nickname ?? ''}`.toLowerCase().includes(q);
    })
    .slice(0, 80);

  const lineups = getLineups(entries, playersById);
  const whiteScore = sumRating(lineups.white);
  const coloredScore = sumRating(lineups.colored);
  const diff = Math.abs(whiteScore - coloredScore);

  function addPlayer(playerId: number) {
    if (!playerId || usedIds.has(playerId)) return;
    setEntries((current) => [...current, { playerId, status: 'registered', position: 'auto' }]);
    setSelectedPlayerId('');
  }

  function updateStatus(playerId: number, status: LineupStatus) {
    setEntries((current) =>
      normalizePositions(
        current.map((entry) =>
          entry.playerId === playerId
            ? { ...entry, status, position: isStarterStatus(status) ? entry.position : 'auto' }
            : entry
        )
      )
    );
  }

  function updatePosition(playerId: number, position: LineupPosition) {
    setEntries((current) => {
      const target = current.find((entry) => entry.playerId === playerId);
      if (!target || !isStarterStatus(target.status)) return current;

      return current.map((entry) => {
        if (entry.playerId === playerId) return { ...entry, position };
        if (position !== 'auto' && entry.status === target.status && entry.position === position) {
          return { ...entry, position: 'auto' };
        }
        return entry;
      });
    });
  }

  function removePlayer(playerId: number) {
    setEntries((current) => current.filter((entry) => entry.playerId !== playerId));
  }

  function autoSplit() {
    const selected = entries
      .map((entry) => playersById.get(entry.playerId))
      .filter((player): player is AdminLineupPlannerPlayer => Boolean(player))
      .sort((a, b) => b.balance_rating - a.balance_rating);

    const white: AdminLineupPlannerPlayer[] = [];
    const colored: AdminLineupPlannerPlayer[] = [];
    const whiteReserve: AdminLineupPlannerPlayer[] = [];
    const coloredReserve: AdminLineupPlannerPlayer[] = [];

    for (const player of selected.slice(0, 10)) {
      const whiteTotal = sumRating(white);
      const coloredTotal = sumRating(colored);
      const putWhite =
        white.length < 5 &&
        (colored.length >= 5 ||
          whiteTotal < coloredTotal ||
          (whiteTotal === coloredTotal && white.length <= colored.length));
      if (putWhite) white.push(player);
      else colored.push(player);
    }

    for (const player of selected.slice(10)) {
      if (whiteReserve.length <= coloredReserve.length) whiteReserve.push(player);
      else coloredReserve.push(player);
    }

    setEntries([
      ...white.map((player, index) => ({
        playerId: player.id,
        status: 'white' as const,
        position: defaultPosition(index),
      })),
      ...whiteReserve.map((player) => ({ playerId: player.id, status: 'white_reserve' as const, position: 'auto' as const })),
      ...colored.map((player, index) => ({
        playerId: player.id,
        status: 'colored' as const,
        position: defaultPosition(index),
      })),
      ...coloredReserve.map((player) => ({ playerId: player.id, status: 'colored_reserve' as const, position: 'auto' as const })),
    ]);
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-background/35 p-3 sm:p-4">
      <input type="hidden" name="lineup_players" value={JSON.stringify(serializeEntries(entries))} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="stat-label">Postave</div>
          <h3 className="mt-1 font-display text-xl font-bold">Prijavljeni i fer podela</h3>
        </div>
        <button type="button" className="btn-ghost text-xs" onClick={autoSplit} disabled={entries.length < 2}>
          Fer podela
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              type="search"
              className="input"
              placeholder="Pretraga igraca"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="input"
              value={selectedPlayerId}
              onChange={(event) => setSelectedPlayerId(event.target.value)}
            >
              <option value="">Izaberi prijavljenog...</option>
              {availablePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.nickname || player.display_name} - {formatRating(player.balance_rating)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-primary px-4 text-sm"
              onClick={() => addPlayer(Number(selectedPlayerId))}
              disabled={!selectedPlayerId}
            >
              Dodaj
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/70">
            <div className="hidden grid-cols-[minmax(0,1fr)_118px_138px_32px] gap-2 border-b border-border/70 bg-card/50 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-muted sm:grid">
              <span>Igrac</span>
              <span>Status</span>
              <span>Pozicija</span>
              <span />
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {entries.map((entry) => {
                const player = playersById.get(entry.playerId);
                if (!player) return null;
                return (
                  <div key={entry.playerId} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_32px] items-center gap-2 border-b border-border/40 px-3 py-2 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_118px_138px_32px]">
                    <div className="col-span-3 flex min-w-0 items-center gap-2 sm:col-span-1">
                      <PlayerAvatar name={player.display_name} photoUrl={player.photo_url} size={30} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{player.nickname || player.display_name}</div>
                        <div className="text-[11px] text-muted">
                          Ocena {formatRating(player.balance_rating)} / {player.balance_matches || 0} utk.
                        </div>
                      </div>
                    </div>
                    <select
                      className="input px-2 py-1.5 text-xs"
                      value={entry.status}
                      onChange={(event) => updateStatus(entry.playerId, event.target.value as LineupStatus)}
                    >
                      {(Object.keys(statusLabels) as LineupStatus[]).map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                    <select
                      className="input px-2 py-1.5 text-xs"
                      value={entry.position}
                      onChange={(event) => updatePosition(entry.playerId, event.target.value as LineupPosition)}
                      disabled={!isStarterStatus(entry.status)}
                      title={isStarterStatus(entry.status) ? 'Pozicija na terenu' : 'Pozicija je dostupna samo za startere'}
                    >
                      {(Object.keys(positionLabels) as LineupPosition[]).map((position) => (
                        <option key={position} value={position}>
                          {positionLabels[position]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="rounded-lg border border-border/70 px-2 py-1 text-xs text-muted hover:border-danger/50 hover:text-danger"
                      onClick={() => removePlayer(entry.playerId)}
                      aria-label={`Ukloni ${player.display_name}`}
                    >
                      x
                    </button>
                  </div>
                );
              })}
              {entries.length === 0 && (
                <div className="px-3 py-8 text-center text-sm text-muted">
                  Dodaj igrace koji su se prijavili, pa klikni Fer podela.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <BalanceBox label="Beli" value={whiteScore} count={lineups.white.length} />
            <BalanceBox label="Šareni" value={coloredScore} count={lineups.colored.length} />
            <BalanceBox label="Razlika" value={diff} count={entries.length} />
          </div>
        </div>

        <AdminPitchPreview
          white={lineups.white}
          colored={lineups.colored}
          whiteReserves={lineups.whiteReserves}
          coloredReserves={lineups.coloredReserves}
        />
      </div>
    </div>
  );
}

function serializeEntries(entries: LineupEntry[]) {
  const lineups = getLineupEntryGroups(entries);

  return [
    ...lineups.white.map((entry, index) => ({ player_id: entry.playerId, status: 'white', position: defaultPosition(index) })),
    ...lineups.whiteReserves.map((entry) => ({ player_id: entry.playerId, status: 'white_reserve', position: 'reserve' })),
    ...lineups.colored.map((entry, index) => ({ player_id: entry.playerId, status: 'colored', position: defaultPosition(index) })),
    ...lineups.coloredReserves.map((entry) => ({ player_id: entry.playerId, status: 'colored_reserve', position: 'reserve' })),
  ];
}

function getLineups(entries: LineupEntry[], playersById: Map<number, AdminLineupPlannerPlayer>) {
  const lineups = getLineupEntryGroups(entries);
  const toPlayers = (lineupEntries: LineupEntry[]) =>
    lineupEntries
      .map((entry) => playersById.get(entry.playerId))
      .filter((player): player is AdminLineupPlannerPlayer => Boolean(player));

  return {
    white: toPlayers(lineups.white),
    colored: toPlayers(lineups.colored),
    whiteReserves: toPlayers(lineups.whiteReserves),
    coloredReserves: toPlayers(lineups.coloredReserves),
  };
}

function getLineupEntryGroups(entries: LineupEntry[]) {
  const white = orderStarterEntries(entries.filter((entry) => entry.status === 'white'));
  const colored = orderStarterEntries(entries.filter((entry) => entry.status === 'colored'));

  return {
    white: white.slice(0, 5),
    colored: colored.slice(0, 5),
    whiteReserves: [...white.slice(5), ...entries.filter((entry) => entry.status === 'white_reserve')],
    coloredReserves: [...colored.slice(5), ...entries.filter((entry) => entry.status === 'colored_reserve')],
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

  const ordered: LineupEntry[] = [];
  for (const position of starterPositions) {
    ordered.push(assigned.get(position) ?? automatic.shift() ?? nullEntry);
  }

  return ordered.filter((entry) => entry !== nullEntry).concat(automatic);
}

const nullEntry = { playerId: -1, status: 'registered', position: 'auto' } satisfies LineupEntry;

function normalizePositions(entries: LineupEntry[]) {
  const used = {
    white: new Set<LineupPosition>(),
    colored: new Set<LineupPosition>(),
  };

  return entries.map((entry) => {
    if (!isStarterStatus(entry.status)) {
      return entry.position === 'auto' ? entry : { ...entry, position: 'auto' as const };
    }
    if (!isStarterPosition(entry.position)) return entry;
    if (used[entry.status].has(entry.position)) return { ...entry, position: 'auto' as const };
    used[entry.status].add(entry.position);
    return entry;
  });
}

function isStarterStatus(status: LineupStatus): status is 'white' | 'colored' {
  return status === 'white' || status === 'colored';
}

function isStarterPosition(position: LineupPosition): position is StarterPosition {
  return position !== 'auto';
}

function defaultPosition(index: number): LineupPosition {
  return starterPositions[index] ?? 'auto';
}

function sumRating(players: AdminLineupPlannerPlayer[]) {
  return players.reduce((total, player) => total + player.balance_rating, 0);
}

function formatRating(value: number) {
  return value.toFixed(2);
}

function BalanceBox({ label, value, count }: { label: string; value: number; count: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted">{label}</div>
      <div className="mt-1 font-display text-lg font-bold tabular-nums">{formatRating(value)}</div>
      <div className="text-[10px] text-muted">{count} igr.</div>
    </div>
  );
}

function AdminPitchPreview({
  white,
  colored,
  whiteReserves,
  coloredReserves,
}: {
  white: AdminLineupPlannerPlayer[];
  colored: AdminLineupPlannerPlayer[];
  whiteReserves: AdminLineupPlannerPlayer[];
  coloredReserves: AdminLineupPlannerPlayer[];
}) {
  return (
    <div className="min-w-0">
      <div className="relative h-[330px] overflow-hidden rounded-2xl border border-emerald-300/20 bg-[#123f2a]">
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
        <ReserveList title="Rez. Šareni" players={coloredReserves} />
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
  player: AdminLineupPlannerPlayer;
  slot: Slot | undefined;
  team: 'white' | 'colored';
}) {
  if (!slot) return null;

  return (
    <div
      className="absolute z-10 flex w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-center"
      style={{ left: `${slot.mobileX ?? slot.x}%`, top: `${slot.mobileY ?? slot.y}%` }}
    >
      <PlayerAvatar
        name={player.display_name}
        photoUrl={player.photo_url}
        size={36}
        className={`ring-2 ${team === 'white' ? 'ring-white/90' : 'ring-warning/80'}`}
      />
      <span className="max-w-full truncate rounded-md border border-black/20 bg-background/85 px-1.5 py-0.5 text-[10px] font-bold leading-tight text-white">
        {player.nickname || player.display_name}
      </span>
    </div>
  );
}

function ReserveList({ title, players }: { title: string; players: AdminLineupPlannerPlayer[] }) {
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
