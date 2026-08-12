import {
  getActiveSeason,
  getLeaderboard,
  getHistoricalStats,
  getSeasonWithMostHistory,
  getMatches,
  getAllAwardsWithSeason,
  groupAwardsByPlayer,
  getSeasonsWithMatches,
} from '@/lib/queries';
import { Standings } from '@/components/Standings';
import { HistoricalReportTable } from '@/components/HistoricalReportTable';
import { SeasonFilterSelect } from '@/components/SeasonFilterSelect';

export const revalidate = 300;

export default async function StandingsPage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const sp = await searchParams;
  const [activeSeason, allAwards, seasons] = await Promise.all([
    getActiveSeason(),
    getAllAwardsWithSeason(),
    getSeasonsWithMatches(),
  ]);
  const selectedSeason = sp.season
    ? seasons.find((season) => season.id === Number(sp.season))
    : activeSeason;
  const targetSeason = selectedSeason ?? activeSeason;

  // Da li izabrana sezona ima utakmica?
  const [matches, stats] = targetSeason
    ? await Promise.all([getMatches(targetSeason.id), getLeaderboard(targetSeason.id)])
    : [[], []];
  const hasCurrent = matches.length > 0;
  const seasonMatchCount = matches.filter((m) => m.is_counted === 1).length;

  // Fallback istorijska
  let historicalSeason = null;
  let historical: Awaited<ReturnType<typeof getHistoricalStats>> = [];
  if (!hasCurrent) {
    const hs = await getSeasonWithMostHistory();
    if (hs) {
      historicalSeason = hs;
      historical = await getHistoricalStats(hs.id);
    }
  }

  const displaySeason = hasCurrent ? targetSeason : historicalSeason ?? targetSeason;

  if (!displaySeason) return <div className="p-8 text-center text-muted">Nema podataka.</div>;
  const awardsByPlayer = Object.fromEntries(
    groupAwardsByPlayer(allAwards.filter((award) => award.season_id === displaySeason.id))
  );

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6 sm:py-8">
      <header className="mb-6 sm:mb-8 animate-fade-up">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="chip mb-3">
              <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${hasCurrent ? 'bg-primary' : 'bg-warning'}`} />
              <span className={hasCurrent ? 'text-secondary' : 'text-warning'}>{displaySeason.name}</span>
              {!hasCurrent && <span className="text-muted text-[10px] ml-1">• izveštaj</span>}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Tabela i <span className="text-gradient">rang liste</span>
            </h1>
            <p className="text-muted mt-2 text-sm sm:text-base">
              {hasCurrent
                ? 'Sve statistike, sortiranje po više kriterijuma.'
                : 'Pregled izveštaja prošle sezone — kliknite na zaglavlje za sortiranje.'}
            </p>
          </div>
          {seasons.length > 1 && (
            <div className="w-full lg:w-[320px]">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Sezona
              </div>
              <SeasonFilterSelect seasons={seasons} current={displaySeason.id} className="w-full" />
            </div>
          )}
        </div>
      </header>
      {hasCurrent ? (
        <Standings
          stats={stats}
          awardsByPlayer={awardsByPlayer}
          seasonMatchCount={seasonMatchCount}
          seasonName={displaySeason.name}
        />
      ) : (
        <HistoricalReportTable rows={historical} awardsByPlayer={awardsByPlayer} />
      )}
    </div>
  );
}
