import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import {
  getSeasons,
  getActiveSeason,
  getPlayers,
  getHistoricalStats,
  getSeasonWithMostHistory,
} from '@/lib/queries';
import { AdminMatchForm } from '@/components/AdminMatchForm';
import type { AdminLineupPlannerPlayer } from '@/components/AdminLineupPlanner';

export const dynamic = 'force-dynamic';

export default async function NewMatchPage() {
  if (!(await isAdmin())) redirect('/admin');
  const seasons = await getSeasons();
  const active = await getActiveSeason();
  const [players, balanceSeason] = await Promise.all([
    getPlayers({ onlyActive: true }),
    getSeasonWithMostHistory(),
  ]);
  const historicalStats = balanceSeason ? await getHistoricalStats(balanceSeason.id) : [];
  const statsByPlayer = new Map(historicalStats.map((stat) => [stat.player_id, stat]));
  const lineupPlayers: AdminLineupPlannerPlayer[] = players.map((player) => {
    const stats = statsByPlayer.get(player.id);
    return {
      id: player.id,
      display_name: player.display_name,
      nickname: player.nickname,
      photo_url: player.photo_url,
      balance_rating: Number(player.skill_total || stats?.points_per_match || stats?.previous_season_average || 0),
      balance_matches: Number(stats?.matches_played ?? 0),
    };
  });

  if (!seasons.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <p className="text-muted">Nema sezona u bazi. Pokreni <code>npm run db:seed</code>.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <Link href="/admin/matches" className="text-sm text-muted hover:text-text">← Utakmice</Link>
      <h1 className="text-3xl font-bold mt-2 mb-6">Nova utakmica</h1>
      <div className="card p-4 sm:p-6">
        <AdminMatchForm
          seasons={seasons}
          defaultSeasonId={active?.id}
          lineupPlayers={lineupPlayers}
        />
      </div>
    </div>
  );
}
