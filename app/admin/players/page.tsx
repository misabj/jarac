import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { getPlayers } from '@/lib/queries';
import { AdminPlayerForm } from '@/components/AdminPlayerForm';
import { deletePlayerAction } from '../actions';
import { PlayerAvatar } from '@/components/PlayerAvatar';

export const dynamic = 'force-dynamic';

export default async function AdminPlayersPage() {
  if (!(await isAdmin())) redirect('/admin');
  const players = await getPlayers();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <Link href="/admin" className="text-sm text-muted hover:text-text">← Admin</Link>
      <h1 className="text-3xl font-bold mt-2 mb-6">Igrači</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-clean">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Igrač</th>
                  <th>Nadimak</th>
                  <th>Slug</th>
                  <th>Pozicija</th>
                  <th className="text-right">Total</th>
                  <th className="text-center">Aktivan</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <PlayerAvatar name={p.display_name} photoUrl={p.photo_url} size={28} />
                        <Link href={`/admin/players/${p.id}`} className="font-medium hover:text-primary">
                          {p.display_name}
                        </Link>
                      </div>
                    </td>
                    <td className="text-muted">{p.nickname ?? '—'}</td>
                    <td className="text-xs text-muted font-mono">{p.slug}</td>
                    <td className="text-muted">{p.position ?? '—'}</td>
                    <td className="text-right tabular-nums font-semibold text-warning">{p.skill_total || '—'}</td>
                    <td className="text-center">
                      {p.is_active ? <span className="text-primary">●</span> : <span className="text-muted">○</span>}
                    </td>
                    <td className="text-right">
                      <form action={deletePlayerAction} className="inline">
                        <input type="hidden" name="id" value={p.id} />
                        <button className="text-xs text-danger hover:underline" formAction={deletePlayerAction}>
                          Obriši
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {players.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-muted py-8">Nema igrača.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5 h-fit">
          <h2 className="font-bold mb-4">Novi igrač</h2>
          <AdminPlayerForm />
        </div>
      </div>
    </div>
  );
}
