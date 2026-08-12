import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { getPlayerById } from '@/lib/queries';
import { AdminPlayerForm } from '@/components/AdminPlayerForm';

export const dynamic = 'force-dynamic';

export default async function AdminPlayerEditPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect('/admin');
  const { id } = await params;
  const player = await getPlayerById(Number(id));
  if (!player) notFound();

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-8">
      <Link href="/admin/players" className="text-sm text-muted hover:text-text">← Igrači</Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">Izmeni: {player.display_name}</h1>
      <div className="card p-6">
        <AdminPlayerForm player={player} />
      </div>
    </div>
  );
}
