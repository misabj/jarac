import { readFile } from 'fs/promises';
import path from 'path';
import { getPlayerPhotosDir } from '@/lib/playerPhotos';

// Fallback serviranje fotografija igrača sa diska.
// U Next `output: 'standalone'` režimu statičko serviranje `public/` foldera
// ne vidi fajlove upisane u runtime-u (kroz admin upload), pa ovaj handler
// čita fajl direktno i vraća ga. Za slike koje već postoje u serviranom
// `public/`-u (legacy, iz repo-a) statičko serviranje ima prednost i ovaj
// handler se i ne poziva.

export const dynamic = 'force-dynamic';

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;

  // Sprečava path traversal — dozvoljeno je samo čisto ime fajla.
  const safe = path.basename(file);
  if (safe !== file) {
    return new Response('Not found', { status: 404 });
  }

  const ext = safe.split('.').pop()?.toLowerCase() ?? '';
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const data = await readFile(path.join(getPlayerPhotosDir(), safe));
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
