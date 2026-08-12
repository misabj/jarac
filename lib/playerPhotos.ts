import path from 'path';

/**
 * Folder u kome se čuvaju upload-ovane fotografije igrača.
 *
 * Podrazumevano `public/images/players/` (radi lokalno i na produkciji).
 * Na produkciji (Next `output: 'standalone'` na cPanel/DreamWeb) statičko
 * serviranje `public/` foldera ne pronalazi fajlove upisane u runtime-u, pa
 * ih servira route handler koji čita direktno sa diska (vidi
 * `app/images/players/[file]/route.ts`). Da bi slike preživele redeploy,
 * postavi env varijablu `PLAYER_PHOTOS_DIR` na apsolutnu, upisivu putanju
 * van build outputa (npr. `/home/USER/jarac_uploads/players`).
 */
export function getPlayerPhotosDir(): string {
  const configured = process.env.PLAYER_PHOTOS_DIR?.trim();
  if (configured) return configured;
  return path.join(process.cwd(), 'public', 'images', 'players');
}
