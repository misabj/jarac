import { getGalleryImages } from '@/lib/queries';
import { GalleryGrid } from '@/components/GalleryGrid';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Galerija • Jarac',
  description: 'Fotografije sa termina i utakmica KSC Jarac.',
};

export default async function GalleryPage() {
  const images = await getGalleryImages();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <header className="mb-6 animate-fade-up">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          KSC Jarac
        </div>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold tracking-tight">Galerija</h1>
        <p className="text-muted mt-1">Fotografije sa termina i utakmica.</p>
      </header>

      {images.length === 0 ? (
        <div className="card p-10 text-center text-muted">Još nema slika u galeriji.</div>
      ) : (
        <GalleryGrid images={images} />
      )}
    </div>
  );
}
