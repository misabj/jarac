import { readFile } from 'fs/promises';
import path from 'path';
import { getGalleryDir } from '@/lib/gallery';

// Fallback serviranje slika galerije sa diska (isti razlog kao kod
// fotografija igrača — standalone build ne servira runtime upload-e statički).

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
    const data = await readFile(path.join(getGalleryDir(), safe));
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
