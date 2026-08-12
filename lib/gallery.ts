import path from 'path';

/**
 * Folder u kome se čuvaju slike galerije.
 *
 * Podrazumevano `public/images/gallery/` (radi lokalno i na produkciji).
 * Kao i kod fotografija igrača, u Next `output: 'standalone'` režimu statičko
 * serviranje `public/` foldera ne pronalazi fajlove upisane u runtime-u, pa ih
 * servira route handler koji čita sa diska (`app/images/gallery/[file]/route.ts`).
 * Za trajnost preko redeploy-a postavi env `GALLERY_DIR` na apsolutnu, upisivu
 * putanju van build outputa.
 */
export function getGalleryDir(): string {
  const configured = process.env.GALLERY_DIR?.trim();
  if (configured) return configured;
  return path.join(process.cwd(), 'public', 'images', 'gallery');
}
