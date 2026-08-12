import {
  getActiveSeason,
  getLeaderboard,
  getPlayers,
  getHistoricalStats,
  getSeasonWithMostHistory,
  getMatches,
  getAllAwardsWithSeason,
  groupAwardsByPlayer,
} from '@/lib/queries';
import { PlayersList } from '@/components/PlayersList';
import type { PlayerSeasonStats } from '@/lib/types';

export const revalidate = 60;

export default async function PlayersPage() {
  const [activeSeason, players, allAwards] = await Promise.all([
    getActiveSeason(),
    getPlayers(),
    getAllAwardsWithSeason(),
  ]);
  const [matches, currentStats] = activeSeason
    ? await Promise.all([getMatches(activeSeason.id), getLeaderboard(activeSeason.id)])
    : [[], []];
  const hasCurrent = matches.length > 0;

  let stats: PlayerSeasonStats[] = [];
  let displaySeasonName = activeSeason?.name ?? '—';
  let displaySeasonId = activeSeason?.id;

  if (hasCurrent && activeSeason) {
    stats = currentStats;
  } else {
    // fallback: konvertuj istorijske u PlayerSeasonStats shape
    const hs = await getSeasonWithMostHistory();
    if (hs) {
      displaySeasonName = `${hs.name} • izveštaj`;
      displaySeasonId = hs.id;
      const hist = await getHistoricalStats(hs.id);
      stats = hist.map((h) => ({
        player_id: h.player_id,
        display_name: h.display_name,
        nickname: h.nickname,
        slug: h.slug,
        photo_url: h.photo_url,
        skill_total: Number(h.skill_total || 0),
        matches_played: Number(h.matches_played),
        counted_matches: Number(h.matches_played),
        goals: Number(h.goals),
        assists: Number(h.assists),
        own_goals: Number(h.own_goals),
        wins: Number(h.wins),
        draws: Number(h.draws),
        losses: Number(h.losses),
        points: Number(h.points),
        goals_per_match: Number(h.goals_per_match),
        assists_per_match: Number(h.assists_per_match),
        goals_plus_assists: Number(h.goals_plus_assists),
        goals_plus_assists_per_match: Number(h.goals_plus_assists_per_match),
        points_per_match: Number(h.points_per_match),
        mvp_score:
          Number(h.wins) * 5.0 +
          Number(h.draws) * 2.0 +
          Number(h.goals) * 1.5 +
          Number(h.assists) * 1.0 -
          Number(h.losses) * 2.0,
      }));
    }
  }

  // Dopuni igrače koji nisu u stat-ovima
  const known = new Set(stats.map((s) => s.player_id));
  for (const p of players) {
    if (!known.has(p.id)) {
      stats.push({
        player_id: p.id,
        display_name: p.display_name,
        nickname: p.nickname,
        slug: p.slug,
        photo_url: p.photo_url,
        skill_total: Number(p.skill_total || 0),
        matches_played: 0,
        counted_matches: 0,
        goals: 0,
        assists: 0,
        own_goals: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        goals_per_match: 0,
        assists_per_match: 0,
        goals_plus_assists: 0,
        goals_plus_assists_per_match: 0,
        points_per_match: 0,
        mvp_score: 0,
      });
    }
  }

  const activeIds = players.filter((p) => p.is_active === 1).map((p) => p.id);
  const awardsSerializable = Object.fromEntries(
    groupAwardsByPlayer(displaySeasonId ? allAwards.filter((award) => award.season_id === displaySeasonId) : [])
  );

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6 sm:py-8">
      <header className="mb-6 sm:mb-8 animate-fade-up">
        <div className="chip mb-3">
          <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${hasCurrent ? 'bg-primary' : 'bg-warning'}`} />
          {displaySeasonName}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Igrači</h1>
        <p className="text-muted mt-2 text-sm sm:text-base">
          Svi igrači Jarac lige sa statistikom u {hasCurrent ? 'aktivnoj' : 'prošloj'} sezoni.
        </p>
      </header>
      <PlayersList stats={stats} activeIds={activeIds} awardsByPlayer={awardsSerializable} />
    </div>
  );
}
