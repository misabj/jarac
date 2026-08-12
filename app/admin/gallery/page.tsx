import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { getGalleryImages } from '@/lib/queries';
import { AdminGalleryManager } from '@/components/AdminGalleryManager';

export const dynamic = 'force-dynamic';

export default async function AdminGalleryPage() {
  if (!(await isAdmin())) redirect('/admin');
  const images = await getGalleryImages();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <Link href="/admin" className="text-sm text-muted hover:text-text">← Admin</Link>
      <h1 className="text-3xl font-bold mt-2 mb-6">Galerija</h1>
      <AdminGalleryManager images={images} />
    </div>
  );
}
