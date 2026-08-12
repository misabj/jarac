import { PlayerAvatar } from './PlayerAvatar';
import { AwardBadges } from './AwardBadges';
import type { PlayerSeasonStats } from '@/lib/types';
import type { AwardWithSeason } from '@/lib/queries';
import { fmtNum } from '@/lib/format';

type Column = {
  key: keyof PlayerSeasonStats | 'rank';
  label: string;
  align?: 'left' | 'right' | 'center';
  format?: (v: unknown, row: PlayerSeasonStats) => React.ReactNode;
  accent?: string;
};

interface Props {
  rows: PlayerSeasonStats[];
  columns: Column[];
  sortKey?: keyof PlayerSeasonStats;
  desc?: boolean;
  highlightTop?: boolean;
  awardsByPlayer?: Record<number, AwardWithSeason[]>;
  /** Ako je postavljen, igrač sa ovim id-jem se forsira na poziciju #1. */
  pinnedPlayerId?: number | null;
}

function compareGeneralLeague(a: PlayerSeasonStats, b: PlayerSeasonStats) {
  // Ligaška logika:
  // 1. Bodovi više
  // 2. Pobede više
  // 3. Porazi manje
  // 4. Golovi više
  // 5. Asistencije više
  // 6. Manje odigranih, ako je sve ostalo isto
  // 7. Ime
  if (b.points !== a.points) return b.points - a.points;
  if (b.wins !== a.wins) return b.wins - a.wins;
  if (a.losses !== b.losses) return a.losses - b.losses;
  if (b.goals !== a.goals) return b.goals - a.goals;
  if (b.assists !== a.assists) return b.assists - a.assists;
  if (a.matches_played !== b.matches_played) return a.matches_played - b.matches_played;

  return a.display_name.localeCompare(b.display_name, 'sr');
}

/**
 * MVP trka — kompozitni skor (NBA-stil): kombinuje timski uspeh (pobede/porazi)
 * i individualni učinak (G+A), uz prisutnost/ocenu. Poredak prati mvp_score;
 * tie-break: pobede → G+A → manje poraza → manje odigranih → ime.
 */
function compareMvpRace(a: PlayerSeasonStats, b: PlayerSeasonStats) {
  if (b.mvp_score !== a.mvp_score) return b.mvp_score - a.mvp_score;
  if (b.wins !== a.wins) return b.wins - a.wins;
  if (b.goals_plus_assists !== a.goals_plus_assists) return b.goals_plus_assists - a.goals_plus_assists;
  if (a.losses !== b.losses) return a.losses - b.losses;
  if (a.matches_played !== b.matches_played) return a.matches_played - b.matches_played;

  return a.display_name.localeCompare(b.display_name, 'sr');
}

export function LeaderboardTable({
  rows,
  columns,
  sortKey,
  desc = true,
  highlightTop = true,
  awardsByPlayer,
  pinnedPlayerId,
}: Props) {
  const sorted = sortKey
    ? [...rows].sort((a, b) => {
        // Generalna tabela koristi ligaško sortiranje, ne samo points DESC.
        if (sortKey === 'points') {
          return compareGeneralLeague(a, b);
        }
        // MVP trka: stepenasto — bodovi primarni, pa golovi, pa asistencije.
        if (sortKey === 'mvp_score') {
          return compareMvpRace(a, b);
        }

        const av = Number(a[sortKey] ?? 0);
        const bv = Number(b[sortKey] ?? 0);

        if (av !== bv) {
          return desc ? bv - av : av - bv;
        }

        return a.display_name.localeCompare(b.display_name, 'sr');
      })
    : rows;

  // Ako je zadat pinnedPlayerId i taj igrač postoji u rezultatima, podigni ga
  // na vrh (override default sortinga). Tako npr. MVP sezone ostaje na #1 iako
  // po sirovim brojevima nije najveći.
  const finalRows = (() => {
    if (!pinnedPlayerId) return sorted;
    const idx = sorted.findIndex((r) => r.player_id === pinnedPlayerId);
    if (idx <= 0) return sorted;
    const copy = [...sorted];
    const [pinned] = copy.splice(idx, 1);
    copy.unshift(pinned);
    return copy;
  })();

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto scrollbar-clean">
        <table className="table-base min-w-full">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  className={
                    c.align === 'right'
                      ? 'text-right'
                      : c.align === 'center'
                        ? 'text-center'
                        : ''
                  }
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {finalRows.map((row, idx) => (
              <tr
                key={row.player_id}
                className={highlightTop && idx === 0 ? 'bg-primary/[0.05]' : ''}
              >
                {columns.map((c) => {
                  if (c.key === 'rank') {
                    const medal =
                      idx === 0
                        ? 'bg-gradient-primary text-background shadow-glow-primary'
                        : idx === 1
                          ? 'bg-secondary/20 text-secondary'
                          : idx === 2
                            ? 'bg-warning/20 text-warning'
                            : 'bg-background/40 text-muted';

                    return (
                      <td key="rank">
                        <span
                          className={`inline-grid place-items-center h-7 w-7 rounded-lg text-xs font-bold tabular-nums ${medal}`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                    );
                  }

                  const v = row[c.key];
                  const align =
                    c.align === 'right'
                      ? 'text-right'
                      : c.align === 'center'
                        ? 'text-center'
                        : '';

                  if (c.key === 'display_name') {
                    return (
                      <td key="display_name">
                        <a href={`/players/${row.slug}`} className="flex items-center gap-2.5 group">
                          <PlayerAvatar
                            name={row.display_name}
                            photoUrl={row.photo_url}
                            size={32}
                            className="transition-transform duration-200 group-hover:scale-110"
                          />
                          <span className="font-medium group-hover:text-primary transition-colors inline-flex items-center gap-1.5">
                            <span>{row.display_name}</span>
                            <AwardBadges awards={awardsByPlayer?.[row.player_id]} size="xs" />
                          </span>
                        </a>
                      </td>
                    );
                  }

                  const formatted = c.format
                    ? c.format(v, row)
                    : typeof v === 'number'
                      ? fmtNum(v, 2)
                      : String(v ?? '');

                  return (
                    <td key={String(c.key)} className={`tabular-nums ${align} ${c.accent ?? ''}`}>
                      {formatted}
                    </td>
                  );
                })}
              </tr>
            ))}

            {finalRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted py-6">
                  Nema podataka
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}