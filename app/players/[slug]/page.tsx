import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getActiveSeason,
  getPlayerBySlug,
  getPlayerStats,
  getPlayerMatchHistory,
  getPlayerAwards,
  getHistoricalForPlayer,
  getAllAwardsWithSeason,
} from '@/lib/queries';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { TeamBadge } from '@/components/TeamBadge';
import { AwardChips, AwardBadges } from '@/components/AwardBadges';
import { PlayerFormChart } from '@/components/PlayerFormChart';
import { fmtDate, fmtNum } from '@/lib/format';
import { hasAnyPlayerSkill, PLAYER_SKILL_FIELDS, PLAYER_SKILL_LABELS } from '@/lib/playerSkills';

export const revalidate = 300;

export default async function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const player = await getPlayerBySlug(slug);
  if (!player) notFound();

  const season = await getActiveSeason();
  const historical = await getHistoricalForPlayer(player.id);
  const allAwards = await getAllAwardsWithSeason();
  const playerAwards = allAwards.filter((a) => a.player_id === player.id);

  const [stats, history, awards] = season
    ? await Promise.all([
        getPlayerStats(player.id, season.id),
        getPlayerMatchHistory(player.id, season.id),
        getPlayerAwards(player.id, season.id),
      ])
    : [null, [], []];

  const hasCurrentData = history.length > 0;
  const primaryHist = !hasCurrentData ? historical[0] ?? null : null;
  const hasSkillRatings = hasAnyPlayerSkill(player);

  // form data za grafikon — bod po utakmici
  const form = [...history].reverse().map((h) => {
    const isWhite = h.team === 'white';
    const won = (isWhite && h.result_type === 'white_win') || (!isWhite && h.result_type === 'colored_win');
    const draw = h.result_type === 'draw';
    return {
      match_number: h.match_number,
      points: h.is_counted ? (won ? 3 : draw ? 1 : 0) : 0,
      goals: h.goals,
      assists: h.assists,
      is_counted: Boolean(h.is_counted),
    };
  });

  const headerStats = stats && hasCurrentData
    ? { matches: stats.matches_played, goals: stats.goals, assists: stats.assists, points: stats.points }
    : primaryHist
    ? {
        matches: Number(primaryHist.matches_played),
        goals: Number(primaryHist.goals),
        assists: Number(primaryHist.assists),
        points: Number(primaryHist.points),
      }
    : null;

  const headerSeasonName = hasCurrentData
    ? season?.name
    : primaryHist
    ? `${primaryHist.season_name} • izveštaj`
    : season?.name ?? '—';

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-6 sm:py-8">
      <Link href="/players" className="text-sm text-muted hover:text-text">← Svi igrači</Link>

      {/* HEADER */}
      <div className="card mt-4 p-5 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 relative overflow-hidden">
        <div aria-hidden className="absolute -top-24 -right-24 h-60 w-60 sm:h-72 sm:w-72 rounded-full bg-primary/15 blur-3xl pointer-events-none animate-float" />
        <div aria-hidden className="absolute -bottom-24 -left-24 h-60 w-60 sm:h-72 sm:w-72 rounded-full bg-secondary/15 blur-3xl pointer-events-none animate-float" style={{ animationDelay: '1.4s' }} />
        <div className="relative animate-pop-in shrink-0">
          <PlayerAvatar name={player.display_name} photoUrl={player.photo_url} size={120} className="shadow-glow-primary sm:w-[140px] sm:h-[140px]" />
        </div>
        <div className="flex-1 text-center sm:text-left relative min-w-0">
          <div className="mb-4 flex justify-center sm:justify-start">
            <div className="chip">
              <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${hasCurrentData ? 'bg-primary' : 'bg-warning'}`} />
              <span className={hasCurrentData ? 'text-secondary' : 'text-warning'}>{headerSeasonName}</span>
            </div>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight animate-fade-up break-words inline-flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1" style={{ animationDelay: '60ms' }}>
            <span>{player.display_name}</span>
            <AwardBadges awards={playerAwards} size="md" />
          </h1>
          {player.nickname && (
            <div className="text-muted mt-2 italic text-sm sm:text-base animate-fade-up" style={{ animationDelay: '120ms' }}>„{player.nickname}“</div>
          )}
          {player.position && (
            <div className="text-[10px] sm:text-xs text-muted mt-2 uppercase tracking-[0.18em]">{player.position}</div>
          )}
          {playerAwards.length > 0 && (
            <div className="mt-3 sm:mt-4 animate-fade-up" style={{ animationDelay: '180ms' }}>
              <AwardChips awards={playerAwards} />
            </div>
          )}

          {headerStats && (
            <div className="mt-6 sm:mt-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 stagger">
              <BigStat label="Utakmice" value={headerStats.matches} />
              <BigStat label="Golovi" value={headerStats.goals} accent="text-primary" />
              <BigStat label="Asistencije" value={headerStats.assists} accent="text-secondary" />
              <BigStat label="Bodovi" value={headerStats.points} accent="text-warning" />
            </div>
          )}
        </div>
      </div>

      {hasSkillRatings && (
        <section className="mt-8 sm:mt-10 animate-fade-up">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold">Ocene igrača</h2>
            <div className="rounded-lg border border-border/70 bg-card/70 px-3 py-2 text-right">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted">Total</div>
              <div className="font-display text-xl font-bold tabular-nums text-warning">{player.skill_total}</div>
            </div>
          </div>
          <div className="card p-4 sm:p-5 grid grid-cols-[repeat(auto-fit,minmax(112px,1fr))] gap-3 sm:gap-4">
            {PLAYER_SKILL_FIELDS.map((field) => (
              <Detail
                key={field}
                label={PLAYER_SKILL_LABELS[field]}
                value={player[field] ?? '—'}
                accent={field === 'skill_substitution' ? 'text-danger' : ''}
              />
            ))}
          </div>
        </section>
      )}

      {/* DETAILED STATS */}
      {hasCurrentData && stats && (
        <section className="mt-8 sm:mt-10 animate-fade-up">
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-3">Statistika sezone</h2>
          <div className="card p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <Detail label="Pobede" value={stats.wins} accent="text-primary" />
            <Detail label="Nerešeno" value={stats.draws} accent="text-warning" />
            <Detail label="Porazi" value={stats.losses} accent="text-danger" />
            <Detail label="Autogolovi" value={stats.own_goals} accent="text-danger" />
            <Detail label="G+A" value={stats.goals_plus_assists} />
            <Detail label="MVP score" value={fmtNum(stats.mvp_score, 1)} accent="text-warning" />
            <Detail label="Golovi / utk" value={fmtNum(stats.goals_per_match, 2)} accent="text-primary" />
            <Detail label="Asist. / utk" value={fmtNum(stats.assists_per_match, 2)} accent="text-secondary" />
            <Detail label="G+A / utk" value={fmtNum(stats.goals_plus_assists_per_match, 2)} />
            <Detail label="Bodovi / utk" value={fmtNum(stats.points_per_match, 2)} accent="text-warning" />
            <Detail label="Računato utk" value={stats.counted_matches} />
            <Detail label="Ukupno utk" value={stats.matches_played} />
          </div>
        </section>
      )}

      {/* HISTORICAL PER SEASON */}
      {historical.length > 0 && (
        <section className="mt-8 sm:mt-10 animate-fade-up">
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-3">Po sezonama</h2>
          <div className="space-y-3">
            {historical.map((h) => (
              <div key={h.id} className="card p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="stat-label">Sezona</div>
                    <div className="mt-1 font-display text-lg font-bold">{h.season_name}</div>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/40 px-3 py-2 text-right">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-muted">Bodovi</div>
                    <div className="font-display text-xl font-bold tabular-nums text-warning">{Number(h.points)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  <Detail label="Utakmice" value={Number(h.matches_played)} />
                  <Detail label="Golovi" value={Number(h.goals)} accent="text-primary" />
                  <Detail label="Asistencije" value={Number(h.assists)} accent="text-secondary" />
                  <Detail label="G+A" value={Number(h.goals_plus_assists)} />
                  <Detail label="Pobede" value={Number(h.wins)} accent="text-primary" />
                  <Detail label="Nerešeno" value={Number(h.draws)} accent="text-warning" />
                  <Detail label="Porazi" value={Number(h.losses)} accent="text-danger" />
                  <Detail label="Autogolovi" value={Number(h.own_goals)} accent="text-danger" />
                  <Detail label="Golovi / utk" value={fmtNum(Number(h.goals_per_match), 2)} accent="text-primary" />
                  <Detail label="Asist. / utk" value={fmtNum(Number(h.assists_per_match), 2)} accent="text-secondary" />
                  <Detail label="G+A / utk" value={fmtNum(Number(h.goals_plus_assists_per_match), 2)} />
                  <Detail label="Bodovi / utk" value={fmtNum(Number(h.points_per_match), 2)} accent="text-warning" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AWARDS */}
      {awards.length > 0 && (
        <section className="mt-8 sm:mt-10 animate-fade-up">
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-3">Nagrade i priznanja</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {awards.map((a) => (
              <div key={a.id} className="card p-4">
                <div className="text-xs uppercase tracking-wider text-warning font-bold">{a.type.replace('_', ' ')}</div>
                <div className="font-semibold mt-1">{a.title}</div>
                {a.description && <p className="text-sm text-muted mt-1">{a.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FORM CHART */}
      {form.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-2xl font-bold mb-3">Forma po utakmicama</h2>
          <PlayerFormChart data={form} />
        </section>
      )}

      {/* MATCH HISTORY */}
      {hasCurrentData && (
        <section className="mt-8 sm:mt-10 animate-fade-up">
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-3">Istorija utakmica</h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto scrollbar-clean">
              <table className="table-base text-[13px] sm:text-sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Datum</th>
                    <th>Tim</th>
                    <th>Rezultat</th>
                    <th className="text-right">G</th>
                    <th className="text-right">A</th>
                    <th className="text-right">AG</th>
                    <th className="text-right">Ocena</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => {
                    const isWhite = h.team === 'white';
                    const won = (isWhite && h.result_type === 'white_win') || (!isWhite && h.result_type === 'colored_win');
                    const draw = h.result_type === 'draw';
                    return (
                      <tr key={h.id}>
                        <td className="font-bold">{h.match_number}</td>
                        <td className="text-muted">{fmtDate(h.played_at)}</td>
                        <td><TeamBadge team={h.team} /></td>
                        <td className="tabular-nums font-semibold">
                          <span className={isWhite && won ? 'text-primary' : ''}>{h.white_score}</span>
                          <span className="text-muted mx-1">:</span>
                          <span className={!isWhite && won ? 'text-primary' : ''}>{h.colored_score}</span>
                          {!h.is_counted && <span className="ml-2 text-[10px] text-warning">(ne računa)</span>}
                          {draw && <span className="ml-2 text-[10px] text-warning">N</span>}
                        </td>
                        <td className="text-right tabular-nums text-primary">{h.goals || ''}</td>
                        <td className="text-right tabular-nums text-secondary">{h.assists || ''}</td>
                        <td className="text-right tabular-nums text-danger">{h.own_goals || ''}</td>
                        <td className="text-right tabular-nums">{h.rating != null ? fmtNum(h.rating, 1) : '—'}</td>
                        <td className="text-right">
                          <Link href={`/matches/${h.match_id}`} className="text-secondary hover:underline text-xs">detalji</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {!hasCurrentData && historical.length === 0 && (
        <div className="card mt-8 p-6 text-center text-muted text-sm">
          Nema istorijskih ni trenutnih podataka za ovog igrača.
        </div>
      )}
    </div>
  );
}

function BigStat({ label, value, accent = 'text-text' }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="stagger-item bg-background/40 border border-border/60 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-center transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:bg-background/60">
      <div className={`font-display text-2xl sm:text-3xl font-bold tabular-nums ${accent}`}>{value}</div>
      <div className="stat-label mt-1">{label}</div>
    </div>
  );
}

function Detail({ label, value, accent = '' }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="min-w-0">
      <div className="stat-label whitespace-nowrap text-[10px] tracking-[0.12em] sm:text-[11px] sm:tracking-[0.18em] leading-tight">{label}</div>
      <div className={`font-display text-lg sm:text-xl font-bold tabular-nums mt-0.5 ${accent}`}>{value}</div>
    </div>
  );
}
