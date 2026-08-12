import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { getBeerDonations } from '@/lib/queries';
import { AdminBeerManager } from '@/components/AdminBeerManager';

export const dynamic = 'force-dynamic';

export default async function AdminBeerPage() {
  if (!(await isAdmin())) redirect('/admin');
  const donations = await getBeerDonations();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <Link href="/admin" className="text-sm text-muted hover:text-text">← Admin</Link>
      <h1 className="text-3xl font-bold mt-2 mb-1">🍺 Kasa za pivo</h1>
      <p className="text-muted mb-6 text-sm">
        Unesi svaku uplatu koja stigne na račun — javno se prikazuje na sajtu radi transparentnosti.
      </p>
      <AdminBeerManager donations={donations} />
    </div>
  );
}
