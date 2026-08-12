import { getActiveSeason, getMatches, getSeasonsWithMatches } from '@/lib/queries';
import { MatchCard } from '@/components/MatchCard';
import { SeasonFilterSelect } from '@/components/SeasonFilterSelect';

export const revalidate = 300;

export default async function MatchesPage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const sp = await searchParams;
  const [seasons, active] = await Promise.all([getSeasonsWithMatches(), getActiveSeason()]);
  const seasonId = sp.season ? Number(sp.season) : active?.id;

  const matches = seasonId ? await getMatches(seasonId) : [];
  const currentSeason = seasons.find((s) => s.id === seasonId);

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6 sm:py-8">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8 animate-fade-up">
        <div>
          <div className="chip mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
            {currentSeason?.name ?? 'Sve sezone'}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Utakmice</h1>
          <p className="text-muted mt-2 text-sm sm:text-base">Ukupno {matches.length} odigranih u prikazu.</p>
        </div>
        {seasons.length > 1 && <SeasonFilterSelect seasons={seasons} current={seasonId} />}
      </header>

      {matches.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center text-muted text-sm sm:text-base">
          Još uvek nema unetih utakmica u ovoj sezoni.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 stagger">
          {matches.map((m) => (
            <div key={m.id} className="stagger-item">
              <MatchCard match={m} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
