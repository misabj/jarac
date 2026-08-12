import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { getActiveSeason, getMatchesWithSeason } from '@/lib/queries';
import { fmtDate } from '@/lib/format';
import { deleteMatchAction } from '../actions';
import type { Match } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminMatchesPage() {
  if (!(await isAdmin())) redirect('/admin');
  const [activeSeason, matches] = await Promise.all([getActiveSeason(), getMatchesWithSeason()]);
  const activeSeasonMatches = activeSeason ? matches.filter((match) => match.season_id === activeSeason.id) : [];
  const regularSeasonMatches = matches.filter((match) => match.season_name === 'Jarac 2025/26');

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <Link href="/admin" className="text-sm text-muted hover:text-text">← Admin</Link>
      <div className="flex items-end justify-between mt-2 mb-6">
        <h1 className="text-3xl font-bold">Utakmice</h1>
        <Link href="/admin/matches/new" className="btn-primary">+ Nova utakmica</Link>
      </div>

      <div className="space-y-6">
        <AdminMatchesSection
          title="Letnja razvojna liga"
          subtitle="Trenutno aktivno takmičenje"
          matches={activeSeasonMatches}
          accent="primary"
        />
        <AdminMatchesSection
          title="Jarac 2025/26"
          subtitle="Regularna sezona"
          matches={regularSeasonMatches}
          accent="secondary"
        />
      </div>
    </div>
  );
}

function AdminMatchesSection({
  title,
  subtitle,
  matches,
  accent,
}: {
  title: string;
  subtitle: string;
  matches: Array<Match & { season_name: string }>;
  accent: 'primary' | 'secondary';
}) {
  const dotClass = accent === 'primary' ? 'bg-primary' : 'bg-secondary';

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
            {subtitle}
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold">{title}</h2>
        </div>
        <span className="text-xs text-muted">{matches.length} utakmica</span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto scrollbar-clean">
          <table className="table-base">
            <thead>
              <tr>
                <th>#</th>
                <th>Datum</th>
                <th>Rezultat</th>
                <th>Selektor</th>
                <th className="text-center">Računa se</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id}>
                  <td className="font-bold">
                    <Link href={`/admin/matches/${m.id}`} className="hover:text-primary">
                      FUDBAL BR. {m.match_number}
                    </Link>
                  </td>
                  <td className="text-muted">{fmtDate(m.played_at)}</td>
                  <td className="tabular-nums font-bold">{m.white_score} : {m.colored_score}</td>
                  <td className="text-muted">{m.selector_name ?? '—'}</td>
                  <td className="text-center">{m.is_counted ? <span className="text-primary">●</span> : <span className="text-warning">○</span>}</td>
                  <td className="text-right">
                    <Link href={`/admin/matches/${m.id}`} className="text-xs text-secondary hover:underline mr-3">izmeni</Link>
                    <form action={deleteMatchAction} className="inline">
                      <input type="hidden" name="id" value={m.id} />
                      <button className="text-xs text-danger hover:underline">obriši</button>
                    </form>
                  </td>
                </tr>
              ))}
              {matches.length === 0 && (
                <tr><td colSpan={6} className="text-center text-muted py-8">Nema utakmica u ovoj sekciji.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
