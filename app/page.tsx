import Link from 'next/link';
import {
  getActiveSeason,
  getLeaderboard,
  getLatestMatch,
  getUpcomingMatches,
  getMatchPlayers,
  getMatchLineupPlayers,
  getMatches,
  getHistoricalStats,
  getSeasonWithMostHistory,
  getAllAwardsWithSeason,
  groupAwardsByPlayer,
} from '@/lib/queries';
import { StatCard } from '@/components/StatCard';
import { TeamBadge } from '@/components/TeamBadge';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { HistoricalReportTable } from '@/components/HistoricalReportTable';
import { MatchCountdown } from '@/components/MatchCountdown';
import { UpcomingMatchPitch } from '@/components/UpcomingMatchPitch';
import { MatchScorerLists } from '@/components/MatchScorerLists';
import { fmtDate, fmtNum } from '@/lib/format';
import { seasonCompetitionSuffix } from '@/lib/seasonLabels';

export const revalidate = 300;

export default async function HomePage() {
  const [activeSeason, allAwards] = await Promise.all([
    getActiveSeason(),
    getAllAwardsWithSeason(),
  ]);

  const [currentStats, latest, upcomingMatches, allMatches] = activeSeason
    ? await Promise.all([
        getLeaderboard(activeSeason.id),
        getLatestMatch(activeSeason.id),
        getUpcomingMatches(activeSeason.id, 3),
        getMatches(activeSeason.id),
      ])
    : [[], null, null, []];
  const upcoming = upcomingMatches?.[0] ?? null;

  const now = Date.now();
  const totalMatchesPlayed = allMatches.filter(
    (match) => new Date(match.played_at.replace(' ', 'T')).getTime() + 60 * 60 * 1000 <= now
  ).length;
  const hasCurrentData = totalMatchesPlayed > 0;

  // Fallback: ako aktivna sezona nema utakmica, prikaži istorijsku
  let historicalSeason = null;
  let historicalStats: Awaited<ReturnType<typeof getHistoricalStats>> = [];
  if (!hasCurrentData) {
    const hs = await getSeasonWithMostHistory();
    if (hs) {
      historicalSeason = hs;
      historicalStats = await getHistoricalStats(hs.id);
    }
  }

  const [latestPlayers, upcomingPlayers] = await Promise.all([
    latest ? getMatchPlayers(latest.id) : Promise.resolve([]),
    upcoming ? getMatchLineupPlayers(upcoming.id) : Promise.resolve([]),
  ]);

  // Trenutna sezona — derivat statistike
  const totalGoals = currentStats.reduce((acc, s) => acc + s.goals, 0);
  const topScorers = [...currentStats].sort((a, b) => b.goals - a.goals).filter((s) => s.goals > 0);
  const topAssistants = [...currentStats].sort((a, b) => b.assists - a.assists).filter((s) => s.assists > 0);
  const mvpRace = [...currentStats].sort((a, b) => b.mvp_score - a.mvp_score).filter((s) => s.mvp_score > 0);
  const mostMatches = [...currentStats].sort((a, b) => b.matches_played - a.matches_played).filter((s) => s.matches_played > 0);
  const topPoints = [...currentStats].sort((a, b) => b.points - a.points).filter((s) => s.points > 0);

  // Istorijska — derivat statistike
  const histTotalGoals = historicalStats.reduce((acc, s) => acc + Number(s.goals), 0);
  const histMaxMatches = historicalStats.reduce((acc, s) => Math.max(acc, Number(s.matches_played)), 0);

  if (!activeSeason && !historicalSeason) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">Jarac</h1>
        <p className="text-muted text-sm sm:text-base">
          Još uvek nema podataka. Pokreni{' '}
          <code className="text-secondary">npm run db:seed</code> i uvezi statistiku.
        </p>
      </div>
    );
  }

  const displaySeason = hasCurrentData ? activeSeason : historicalSeason ?? activeSeason;
  const awardsByPlayer = groupAwardsByPlayer(
    displaySeason ? allAwards.filter((award) => award.season_id === displaySeason.id) : []
  );
  const competitionSuffix = seasonCompetitionSuffix(displaySeason);
  const statsTotalGoals = hasCurrentData ? totalGoals : histTotalGoals;
  const matchesTotal = hasCurrentData ? totalMatchesPlayed : histMaxMatches;
  const activePlayersTotal = hasCurrentData
    ? currentStats.filter((s) => s.matches_played > 0).length
    : historicalStats.length;

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl mt-4 sm:mt-8 bg-gradient-hero border border-border/60 px-5 py-7 sm:px-12 sm:py-10 lg:py-12">
        <div aria-hidden className="absolute inset-0 bg-gradient-mesh opacity-90 pointer-events-none" />
        <div aria-hidden className="absolute -top-24 -right-24 h-60 w-60 sm:h-80 sm:w-80 rounded-full bg-primary/25 blur-3xl pointer-events-none animate-float" />
        <div aria-hidden className="absolute -bottom-28 -left-28 h-60 w-60 sm:h-80 sm:w-80 rounded-full bg-secondary/25 blur-3xl pointer-events-none animate-float" style={{ animationDelay: '1.5s' }} />
        <div aria-hidden className="absolute top-1/3 right-1/4 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-warning/15 blur-3xl pointer-events-none animate-float" style={{ animationDelay: '0.7s' }} />

        <div aria-hidden className="hidden sm:block absolute -right-32 top-1/2 -translate-y-1/2 h-[480px] w-[480px] rounded-full border border-primary/10 animate-spin-slow pointer-events-none" />
        <div aria-hidden className="hidden sm:block absolute -right-16 top-1/2 -translate-y-1/2 h-[320px] w-[320px] rounded-full border border-secondary/10 animate-spin-slow pointer-events-none" style={{ animationDirection: 'reverse', animationDuration: '20s' }} />

        {/* Hero slika — diskretno utopljena u pozadinu, desna strana, vertikalno centrirana */}
        <div
          aria-hidden
          className="hidden lg:block absolute top-1/2 -translate-y-1/2 right-6 xl:right-14 w-[300px] xl:w-[380px] h-[300px] xl:h-[380px] pointer-events-none animate-fade-up"
          style={{ animationDelay: '260ms' }}
        >
          <div className="relative w-full h-full">
            {/* Diskretni glow halo iza — staklena svetlost */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent blur-3xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/jarac_hero.jpg"
              alt=""
              className="relative w-full h-full object-cover rounded-full mix-blend-luminosity"
              style={{
                opacity: 0.22,
                filter: 'grayscale(1) contrast(1.05) brightness(1.1)',
                WebkitMaskImage:
                  'radial-gradient(circle at center, rgba(0,0,0,1) 35%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0) 85%)',
                maskImage:
                  'radial-gradient(circle at center, rgba(0,0,0,1) 35%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0) 85%)',
              }}
            />
          </div>
        </div>

        <div className="relative">
          <div className="chip mb-3 animate-fade-up">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-secondary tracking-[0.18em] sm:tracking-[0.2em]">{displaySeason?.name}</span>
            {!hasCurrentData && historicalSeason && (
              <span className="ml-1 text-muted text-[10px]">• izveštaj</span>
            )}
          </div>
          <div className="relative">
            <div className="max-w-xl">
              <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] animate-fade-up" style={{ animationDelay: '60ms' }}>
                Jarac <span className="text-gradient">Sredom</span>
              </h1>
              <p className="mt-2.5 sm:mt-3 text-muted text-sm sm:text-lg animate-fade-up" style={{ animationDelay: '120ms' }}>
                KSC Jarac • statistika, golovi, asistencije i još mnogo toga...
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-5 sm:gap-3 animate-fade-up" style={{ animationDelay: '180ms' }}>
              <Link href="/standings" className="btn-primary text-sm sm:text-base">Pogledaj tabelu</Link>
              <Link href="/matches" className="btn-ghost text-sm sm:text-base">Utakmice →</Link>
            </div>
            <div className="mt-4 w-full max-w-[390px] animate-fade-up lg:absolute lg:right-0 lg:top-0 lg:mt-0 lg:max-w-[520px] lg:shrink-0" style={{ animationDelay: '180ms' }}>
              <MatchCountdown targetDate={upcoming?.played_at} targetDates={upcomingMatches?.map((match) => match.played_at)} compact />
            </div>
          </div>

          {upcoming && (
            <UpcomingMatchPitch
              match={upcoming}
              players={upcomingPlayers}
              compact
              className="mt-5 w-full sm:mt-6"
            />
          )}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:grid-cols-4 sm:gap-3 stagger">
        <Stat label="Odigranih utakmica" value={matchesTotal} />
        <Stat label="Igrača" value={activePlayersTotal} />
        <Stat label="Golova" value={statsTotalGoals} />
        <Stat label="Termin" value="18h" small />
      </div>

      {/* LATEST MATCH — iznad statistike sezone */}
      {hasCurrentData && latest && (
        <section className="mt-10 sm:mt-14 animate-fade-up">
          <div className="flex items-baseline justify-between mb-3 sm:mb-4">
            <h2 className="font-display text-xl sm:text-2xl font-bold">Poslednja utakmica</h2>
            <Link href={`/matches/${latest.id}`} className="text-xs sm:text-sm text-secondary hover:underline underline-offset-4">
              Detalji →
            </Link>
          </div>
          <div className="card card-hover p-4 sm:p-10 relative">
            <Link
              href={`/matches/${latest.id}`}
              aria-label={`Detalji utakmice ${latest.match_number}`}
              className="absolute inset-0 z-10 rounded-2xl"
            />
            <div aria-hidden className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
            <div aria-hidden className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
            <div className="relative z-20 pointer-events-none">
              <div className="text-[10px] sm:text-xs uppercase tracking-[0.18em] sm:tracking-[0.2em] text-muted mb-4 sm:mb-5">
                Fudbal br. <span className="text-text font-bold">{latest.match_number}</span> • {fmtDate(latest.played_at)}
                {latest.selector_name && <> • Selektor: <span className="text-text">{latest.selector_name}</span></>}
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 max-w-2xl mx-auto">
                <div className="min-w-0 text-right">
                  <TeamBadge team="white" />
                  <div className="mt-2 text-[11px] sm:text-sm text-muted truncate">Beli tim</div>
                </div>
                <div className="font-display text-[44px] xs:text-5xl sm:text-7xl lg:text-8xl font-bold tabular-nums tracking-tight whitespace-nowrap leading-none">
                  <span className={latest.result_type === 'white_win' ? 'text-primary drop-shadow-[0_0_24px_rgba(34,197,94,0.4)]' : ''}>
                    <AnimatedNumber value={latest.white_score} />
                  </span>
                  <span className="text-muted mx-1 sm:mx-3">:</span>
                  <span className={latest.result_type === 'colored_win' ? 'text-primary drop-shadow-[0_0_24px_rgba(34,197,94,0.4)]' : ''}>
                    <AnimatedNumber value={latest.colored_score} />
                  </span>
                </div>
                <div className="min-w-0">
                  <TeamBadge team="colored" />
                  <div className="mt-2 text-[11px] sm:text-sm text-muted truncate">Šareni tim</div>
                </div>
              </div>

              <MatchScorerLists
                whitePlayers={latestPlayers.filter((p) => p.team === 'white')}
                coloredPlayers={latestPlayers.filter((p) => p.team === 'colored')}
                className="mt-6 sm:mt-8"
              />
            </div>
          </div>
        </section>
      )}

      {/* AKTIVNA SEZONA */}
      {hasCurrentData && (
        <section className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 stagger">
          <div className="stagger-item">
            <StatCard
              title={`Najbolji strelac ${competitionSuffix}`}
              subtitle={`Ukupno golova u ${competitionSuffix}`}
              accent="primary"
              unit="g"
              href="/standings#scorers"
              items={topScorers.map((s) => ({ ...s, primary: s.goals }))}
              awardsByPlayer={awardsByPlayer}
            />
          </div>
          <div className="stagger-item">
            <StatCard
              title={`Najbolji asistent ${competitionSuffix}`}
              subtitle="Ukupno asistencija"
              accent="secondary"
              unit="a"
              href="/standings#assists"
              items={topAssistants.map((s) => ({ ...s, primary: s.assists }))}
              awardsByPlayer={awardsByPlayer}
              pinByAward="top_assistant"
            />
          </div>
          <div className="stagger-item">
            <StatCard
              title={competitionSuffix === 'letnje lige' ? 'MVP letnje lige' : 'MVP trka'}
              subtitle="Bodovi + G/A + prosek + prisutnost"
              accent="warning"
              href="/standings#mvp"
              items={mvpRace.map((s) => ({ ...s, primary: fmtNum(s.mvp_score, 1) }))}
              awardsByPlayer={awardsByPlayer}
              pinByAward="season_mvp"
            />
          </div>
          <div className="stagger-item">
            <StatCard
              title="Najviše utakmica"
              subtitle="Najveća prisutnost"
              accent="secondary"
              unit="utk"
              href="/standings#presence"
              items={mostMatches.map((s) => ({ ...s, primary: s.matches_played }))}
              awardsByPlayer={awardsByPlayer}
            />
          </div>
          <div className="stagger-item">
            <StatCard
              title="Najviše bodova"
              subtitle="3 za pobedu, 1 za nerešeno"
              accent="primary"
              unit="b"
              href="/standings"
              items={topPoints.map((s) => ({ ...s, primary: s.points }))}
              awardsByPlayer={awardsByPlayer}
            />
          </div>
          <div className="stagger-item card card-hover p-5 flex flex-col justify-between min-h-[240px] sm:min-h-[260px] group">
            <Link
              href="/matches"
              aria-label="Pogledaj utakmice"
              className="absolute inset-0 z-10 rounded-2xl"
            />
            <div>
              <h3 className="text-[13px] sm:text-sm font-semibold uppercase tracking-[0.16em] sm:tracking-[0.18em] text-muted">Broj odigranih utakmica</h3>
              <div className="mt-3 sm:mt-4 text-5xl sm:text-7xl font-display font-bold tabular-nums leading-none text-gradient">
                <AnimatedNumber value={totalMatchesPlayed} />
              </div>
              <div className="text-xs sm:text-sm text-muted mt-2 sm:mt-3">u sezoni {activeSeason?.name}</div>
            </div>
            <Link href="/matches" className="btn-ghost mt-4 group-hover:border-primary/40 text-sm">Pogledaj utakmice →</Link>
          </div>
        </section>
      )}

      {/* ISTORIJSKA SEZONA — Izveštaj iz Excela */}
      {!hasCurrentData && historicalSeason && historicalStats.length > 0 && (
        <section className="mt-8 sm:mt-14 animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 sm:mb-5">
            <div>
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-warning font-semibold mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                Izveštaj prošle sezone
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                {historicalSeason.name}
              </h2>
              <p className="text-muted text-sm mt-1">
                Aktivna sezona{' '}
                <span className="text-text">{activeSeason?.name ?? '—'}</span>{' '}
                još uvek nema odigranih utakmica.
              </p>
            </div>
            <Link href="/standings" className="btn-ghost text-sm self-start sm:self-auto">
              Detalji →
            </Link>
          </div>
          <HistoricalReportTable rows={historicalStats} awardsByPlayer={Object.fromEntries(awardsByPlayer)} />
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, small = false }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="stagger-item bg-background/40 border border-border/60 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 backdrop-blur transition-all hover:border-primary/40 hover:bg-background/60">
      <div className="stat-label">{label}</div>
      <div className={small ? 'text-base sm:text-lg font-display font-bold' : 'stat-value text-xl sm:text-2xl'}>
        {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </div>
    </div>
  );
}

