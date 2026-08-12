'use server';

import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import slugify from 'slugify';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isAdmin, setAdminCookie, clearAdminCookie } from '@/lib/auth';
import {
  createPlayer,
  updatePlayer,
  deletePlayer,
  createMatch,
  updateMatch,
  updateMatchScoreFromPlayerStats,
  deleteMatch,
  addPlayerToMatch,
  updateMatchPlayerStats,
  removeMatchPlayer,
  createGalleryImage,
  getGalleryImageById,
  deleteGalleryImage,
  createBeerDonation,
  deleteBeerDonation,
} from '@/lib/queries';
import { calculateSkillTotal, PLAYER_SKILL_FIELDS, type PlayerSkillField } from '@/lib/playerSkills';
import { getPlayerPhotosDir } from '@/lib/playerPhotos';
import { getGalleryDir } from '@/lib/gallery';
async function requireAdmin() {
  if (!(await isAdmin())) throw new Error('Nije autorizovano');
}

const ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB

/**
 * Snima upload-ovanu fotografiju igrača u public/images/players/ i vraća
 * javni URL (npr. /images/players/nikolic-milos-172839.jpg). Ako nije prosleđen
 * validan fajl, vraća null.
 */
async function savePlayerPhoto(file: FormDataEntryValue | null, nameHint: string): Promise<string | null> {
  if (!file || typeof file === 'string') return null;
  const f = file as File;
  if (!f.size) return null;
  if (f.size > MAX_PHOTO_BYTES) throw new Error('Fotografija je prevelika (maks. 8 MB).');
  if (!f.type.startsWith('image/')) throw new Error('Dozvoljene su samo slike.');

  const rawExt = (f.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const ext = ALLOWED_IMAGE_EXT.includes(rawExt) ? rawExt : 'jpg';
  const base = slugify(nameHint || 'player', { lower: true, strict: true, locale: 'sr' }) || 'player';
  const filename = `${base}-${Date.now()}.${ext}`;

  const dir = getPlayerPhotosDir();
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await f.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return `/images/players/${filename}`;
}

// ---------------------- LOGIN ----------------------

export async function loginAction(formData: FormData) {
  const password = String(formData.get('password') || '');
  const ok = await setAdminCookie(password);
  if (!ok) {
    redirect('/admin?error=1');
  }
  redirect('/admin');
}

export async function logoutAction() {
  await clearAdminCookie();
  redirect('/admin');
}

// ---------------------- PLAYERS ----------------------

export async function createPlayerAction(formData: FormData) {
  await requireAdmin();
  const first = String(formData.get('first_name') || '').trim();
  const last = String(formData.get('last_name') || '').trim();
  const uploadedUrl = await savePlayerPhoto(formData.get('photo_file'), `${first}-${last}`);
  const skills = readPlayerSkills(formData);
  await createPlayer({
    first_name: first,
    last_name: last,
    display_name: String(formData.get('display_name') || '').trim() || undefined,
    nickname: (formData.get('nickname') as string) || null,
    photo_url: uploadedUrl || null,
    position: (formData.get('position') as string) || null,
    ...skills,
    is_active: formData.get('is_active') === 'on',
  });
  revalidatePublicPages();
  revalidatePath('/admin/players');
}

export async function updatePlayerAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const first = String(formData.get('first_name') || '').trim();
  const last = String(formData.get('last_name') || '').trim();
  const uploadedUrl = await savePlayerPhoto(formData.get('photo_file'), `${first}-${last}`);
  const removePhoto = formData.get('remove_photo') === 'on';
  const existing = (formData.get('existing_photo_url') as string) || null;
  const photo_url = uploadedUrl ? uploadedUrl : removePhoto ? null : existing;
  const skills = readPlayerSkills(formData);
  await updatePlayer(id, {
    first_name: first,
    last_name: last,
    display_name: String(formData.get('display_name') || '').trim() || undefined,
    nickname: (formData.get('nickname') as string) || null,
    photo_url,
    position: (formData.get('position') as string) || null,
    ...skills,
    is_active: formData.get('is_active') === 'on',
  });
  revalidatePublicPages();
  revalidatePath('/admin/players');
  revalidatePath(`/admin/players/${id}`);
}

function readPlayerSkills(formData: FormData) {
  const skills = Object.fromEntries(
    PLAYER_SKILL_FIELDS.map((field) => [field, readOptionalNumber(formData.get(field))])
  ) as Record<PlayerSkillField, number | null>;

  return {
    ...skills,
    skill_total: calculateSkillTotal(skills),
  };
}

function readOptionalNumber(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? '').trim().replace(',', '.');
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function deletePlayerAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  await deletePlayer(id);
  revalidatePublicPages();
  revalidatePath('/admin/players');
}

// ---------------------- MATCHES ----------------------

export async function createMatchAction(formData: FormData) {
  await requireAdmin();
  const id = await createMatch({
    season_id: Number(formData.get('season_id')),
    match_number: String(formData.get('match_number') || '').trim(),
    played_at: String(formData.get('played_at') || '').replace('T', ' ') + ':00',
    venue: String(formData.get('venue') || 'KSC Jarac'),
    scheduled_time: (formData.get('scheduled_time') as string) || null,
    selector_name: (formData.get('selector_name') as string) || null,
    white_score: Number(formData.get('white_score') || 0),
    colored_score: Number(formData.get('colored_score') || 0),
    is_counted: formData.get('is_counted') === 'on',
    notes: (formData.get('notes') as string) || null,
    report: (formData.get('report') as string) || null,
    reporter_name: (formData.get('reporter_name') as string) || null,
  });
  const lineupRaw = String(formData.get('lineup_players') || '');
  if (lineupRaw) {
    try {
      const lineup = JSON.parse(lineupRaw) as Array<{ player_id: number; status: string; position?: string | null }>;
      for (const item of lineup) {
        const playerId = Number(item.player_id);
        if (!playerId) continue;
        const isWhite = item.status === 'white' || item.status === 'white_reserve';
        const isColored = item.status === 'colored' || item.status === 'colored_reserve';
        if (!isWhite && !isColored) continue;

        await addPlayerToMatch({
          match_id: id,
          player_id: playerId,
          team: isWhite ? 'white' : 'colored',
          comment: item.status.endsWith('_reserve') ? 'reserve' : null,
          lineup_position: item.status.endsWith('_reserve') ? 'reserve' : sanitizeLineupPosition(item.position),
        });
      }
    } catch {
      // Ako je planer poslao nevalidan JSON, utakmica se ipak kreira bez postave.
    }
  }
  revalidatePublicPages();
  revalidatePath(`/matches/${id}`);
  revalidatePath('/admin/matches');
  revalidatePath(`/admin/matches/${id}`);
  redirect(`/admin/matches/${id}`);
}

export async function updateMatchAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const playedRaw = String(formData.get('played_at') || '');
  const whiteScoreRaw = formData.get('white_score');
  const coloredScoreRaw = formData.get('colored_score');
  await updateMatch(id, {
    season_id: Number(formData.get('season_id')),
    match_number: String(formData.get('match_number') || '').trim(),
    played_at: playedRaw ? playedRaw.replace('T', ' ') + (playedRaw.length === 16 ? ':00' : '') : undefined,
    venue: String(formData.get('venue') || 'KSC Jarac'),
    scheduled_time: (formData.get('scheduled_time') as string) || null,
    selector_name: (formData.get('selector_name') as string) || null,
    white_score: whiteScoreRaw === null ? undefined : Number(whiteScoreRaw || 0),
    colored_score: coloredScoreRaw === null ? undefined : Number(coloredScoreRaw || 0),
    is_counted: formData.get('is_counted') === 'on',
    notes: (formData.get('notes') as string) || null,
    report: (formData.get('report') as string) || null,
    reporter_name: (formData.get('reporter_name') as string) || null,
  });
  revalidatePublicPages();
  revalidatePath(`/matches/${id}`);
  revalidatePath(`/admin/matches/${id}`);
}

export async function deleteMatchAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  await deleteMatch(id);
  revalidatePublicPages();
  revalidatePath('/admin/matches');
  redirect('/admin/matches');
}

// ---------------------- MATCH PLAYERS ----------------------

export async function addMatchPlayerAction(formData: FormData) {
  await requireAdmin();
  const match_id = Number(formData.get('match_id'));
  await addPlayerToMatch({
    match_id,
    player_id: Number(formData.get('player_id')),
    team: (String(formData.get('team')) as 'white' | 'colored'),
    goals: Number(formData.get('goals') || 0),
    assists: Number(formData.get('assists') || 0),
    own_goals: Number(formData.get('own_goals') || 0),
    rating: formData.get('rating') ? Number(formData.get('rating')) : null,
    is_mvp: formData.get('is_mvp') === 'on',
    comment: (formData.get('comment') as string) || null,
  });
  await updateMatchScoreFromPlayerStats(match_id);
  revalidatePublicPages();
  revalidatePath(`/admin/matches/${match_id}`);
  revalidatePath(`/matches/${match_id}`);
}

export async function updateMatchPlayerAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const match_id = Number(formData.get('match_id'));
  await updateMatchPlayerStats(id, {
    team: (String(formData.get('team')) as 'white' | 'colored'),
    goals: Number(formData.get('goals') || 0),
    assists: Number(formData.get('assists') || 0),
    own_goals: Number(formData.get('own_goals') || 0),
    rating: formData.get('rating') ? Number(formData.get('rating')) : null,
    is_mvp: formData.get('is_mvp') === 'on',
    comment: (formData.get('comment') as string) || null,
  });
  await updateMatchScoreFromPlayerStats(match_id);
  revalidatePublicPages();
  revalidatePath(`/admin/matches/${match_id}`);
  revalidatePath(`/matches/${match_id}`);
}

export async function updateMatchLineupAction(formData: FormData) {
  await requireAdmin();
  const match_id = Number(formData.get('match_id'));
  const raw = String(formData.get('lineup_players') || '');
  if (!match_id || !raw) return;

  try {
    const lineup = JSON.parse(raw) as Array<{
      id: number;
      team: string;
      position: string | null;
      comment?: string | null;
    }>;

    for (const item of lineup) {
      const id = Number(item.id);
      const team = item.team === 'colored' ? 'colored' : item.team === 'white' ? 'white' : null;
      const lineupPosition = sanitizeLineupPosition(item.position);
      if (!id || !team) continue;

      await updateMatchPlayerStats(id, {
        team,
        lineup_position: lineupPosition,
        comment: withReserveComment(item.comment ?? null, lineupPosition === 'reserve'),
      });
    }
  } catch {
    return;
  }

  await updateMatchScoreFromPlayerStats(match_id);
  revalidatePublicPages();
  revalidatePath(`/matches/${match_id}`);
  revalidatePath(`/admin/matches/${match_id}`);
}

export async function removeMatchPlayerAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const match_id = Number(formData.get('match_id'));
  await removeMatchPlayer(id);
  await updateMatchScoreFromPlayerStats(match_id);
  revalidatePublicPages();
  revalidatePath(`/admin/matches/${match_id}`);
  revalidatePath(`/matches/${match_id}`);
}

function revalidatePublicPages() {
  revalidatePath('/');
  revalidatePath('/players');
  revalidatePath('/players/[slug]', 'page');
  revalidatePath('/standings');
  revalidatePath('/matches');
  revalidatePath('/matches/[id]', 'page');
}

function sanitizeLineupPosition(value: string | null | undefined): string | null {
  const allowed = new Set(['goalkeeper', 'defense_top', 'defense_bottom', 'attack_top', 'attack_bottom', 'reserve']);
  return value && allowed.has(value) ? value : null;
}

function withReserveComment(comment: string | null, isReserve: boolean): string | null {
  const cleaned = String(comment ?? '')
    .replace(/\breserve\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s*[-|,;:]\s*|\s*[-|,;:]\s*$/g, '')
    .trim();

  if (isReserve) return cleaned ? `${cleaned} reserve` : 'reserve';
  return cleaned || null;
}

// ---------------------- GALLERY ----------------------

/**
 * Snima upload-ovanu sliku galerije u folder galerije i vraća javni URL
 * (npr. /images/gallery/1780000000000.jpg). Vraća null ako fajl nije validan.
 */
async function saveGalleryImage(file: FormDataEntryValue | null): Promise<string | null> {
  if (!file || typeof file === 'string') return null;
  const f = file as File;
  if (!f.size) return null;
  if (f.size > MAX_PHOTO_BYTES) throw new Error('Slika je prevelika (maks. 8 MB).');
  if (!f.type.startsWith('image/')) throw new Error('Dozvoljene su samo slike.');

  const rawExt = (f.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const ext = ALLOWED_IMAGE_EXT.includes(rawExt) ? rawExt : 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const dir = getGalleryDir();
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await f.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return `/images/gallery/${filename}`;
}

export async function uploadGalleryImageAction(formData: FormData) {
  await requireAdmin();
  const files = formData.getAll('images');
  const title = String(formData.get('title') || '').trim() || null;

  let saved = 0;
  for (const file of files) {
    const url = await saveGalleryImage(file);
    if (!url) continue;
    await createGalleryImage({ image_url: url, title });
    saved += 1;
  }

  revalidatePath('/gallery');
  revalidatePath('/admin/gallery');
}

export async function deleteGalleryImageAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!Number.isFinite(id)) return;

  const image = await getGalleryImageById(id);
  await deleteGalleryImage(id);

  // Obriši i fajl sa diska ako je lokalni upload (/images/gallery/...).
  if (image?.image_url?.startsWith('/images/gallery/')) {
    const filename = path.basename(image.image_url);
    try {
      await unlink(path.join(getGalleryDir(), filename));
    } catch {
      // fajl možda ne postoji — ignoriši
    }
  }

  revalidatePath('/gallery');
  revalidatePath('/admin/gallery');
}

// ---------------------- BEER DONATIONS (kasa za pivo) ----------------------

export async function createBeerDonationAction(formData: FormData) {
  await requireAdmin();
  const donorName = String(formData.get('donor_name') || '').trim();
  const amount = readOptionalNumber(formData.get('amount'));
  const donatedAt = String(formData.get('donated_at') || '').trim();

  if (!donorName || amount === null || amount <= 0 || !donatedAt) {
    throw new Error('Ime, iznos i datum su obavezni.');
  }

  await createBeerDonation({
    donor_name: donorName,
    amount,
    message: String(formData.get('message') || '').trim() || null,
    donated_at: donatedAt,
    is_public: formData.get('is_public') !== 'off',
  });

  revalidatePath('/admin/beer');
}

export async function deleteBeerDonationAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!Number.isFinite(id)) return;
  await deleteBeerDonation(id);
  revalidatePath('/admin/beer');
}

