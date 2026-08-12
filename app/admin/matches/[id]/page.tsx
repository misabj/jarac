import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { getMatchById, getMatchLineupPlayers, getPlayers, getSeasons } from '@/lib/queries';
import { AdminMatchForm } from '@/components/AdminMatchForm';
import { MatchSquadEditor } from '@/components/MatchSquadEditor';

export const dynamic = 'force-dynamic';

export default async function AdminMatchEditPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect('/admin');
  const { id } = await params;
  const matchId = Number(id);
  const match = await getMatchById(matchId);
  if (!match) notFound();

  const [seasons, players, squad] = await Promise.all([
    getSeasons(),
    getPlayers({ onlyActive: false }),
    getMatchLineupPlayers(matchId),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <Link href="/admin/matches" className="text-sm text-muted hover:text-text">← Sve utakmice</Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mt-2 mb-6">
        <div>
          <div className="stat-label">Admin utakmica</div>
          <h1 className="mt-1 font-display text-3xl font-bold">FUDBAL BR. {match.match_number}</h1>
        </div>
        <Link href={`/matches/${match.id}`} className="btn-ghost text-sm">Pregled na sajtu →</Link>
      </div>

      <MatchSquadEditor
        key={squad.map((player) => `${player.id}:${player.team}:${player.goals}:${player.assists}:${player.own_goals}:${player.rating ?? ''}:${player.is_mvp}`).join('|')}
        matchId={matchId}
        players={squad}
        allPlayers={players}
      />

      <section className="mt-8">
        <div className="mb-3">
          <div className="stat-label">Podešavanja</div>
          <h2 className="mt-1 font-display text-2xl font-bold">Podaci utakmice</h2>
        </div>
        <div className="card p-5">
          <AdminMatchForm
            key={`${match.id}:${match.white_score}:${match.colored_score}:${match.result_type}`}
            seasons={seasons}
            match={match}
          />
        </div>
      </section>
    </div>
  );
}
