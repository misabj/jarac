import { query, queryOne, execute } from './db';
import type {
  Season,
  Player,
  Match,
  MatchPlayer,
  MatchPlayerWithPlayer,
  PlayerSeasonStats,
  HistoricalPlayerStats,
  GalleryImage,
  BeerDonation,
  Team,
  ResultType,
} from './types';
import { calculateSkillTotal, PLAYER_SKILL_FIELDS, type PlayerSkillField } from './playerSkills';
import slugify from 'slugify';

// =====================================================
// SEASONS
// =====================================================

export async function getActiveSeason(): Promise<Season | null> {
  const s = await queryOne<Season>(
    'SELECT * FROM seasons WHERE is_active = 1 ORDER BY id DESC LIMIT 1'
  );
  if (s) return s;
  return await queryOne<Season>('SELECT * FROM seasons ORDER BY id DESC LIMIT 1');
}

export async function getSeasons(): Promise<Season[]> {
  return query<Season>('SELECT * FROM seasons ORDER BY starts_at DESC, id DESC');
}

export async function getSeasonsWithMatches(): Promise<Season[]> {
  return query<Season>(
    `SELECT DISTINCT s.*
     FROM seasons s
     JOIN matches m ON m.season_id = s.id
     ORDER BY s.starts_at DESC, s.id DESC`
  );
}

export async function getSeasonById(id: number): Promise<Season | null> {
  return queryOne<Season>('SELECT * FROM seasons WHERE id = ?', [id]);
}

// =====================================================
// PLAYERS
// =====================================================

export async function getPlayers(opts?: { onlyActive?: boolean; search?: string }): Promise<Player[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts?.onlyActive) where.push('is_active = 1');
  if (opts?.search) {
    where.push('(display_name LIKE ? OR nickname LIKE ?)');
    params.push(`%${opts.search}%`, `%${opts.search}%`);
  }
  const sql = `SELECT * FROM players ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY display_name ASC`;
  return query<Player>(sql, params);
}

export async function getPlayerBySlug(slug: string): Promise<Player | null> {
  return queryOne<Player>('SELECT * FROM players WHERE slug = ?', [slug]);
}

export async function getPlayerById(id: number): Promise<Player | null> {
  return queryOne<Player>('SELECT * FROM players WHERE id = ?', [id]);
}

export interface CreatePlayerInput {
  first_name: string;
  last_name: string;
  display_name?: string;
  nickname?: string | null;
  photo_url?: string | null;
  position?: string | null;
  skill_running?: number | null;
  skill_shooting?: number | null;
  skill_defense?: number | null;
  skill_efficiency?: number | null;
  skill_goalkeeper?: number | null;
  skill_dribbling?: number | null;
  skill_substitution?: number | null;
  skill_passing?: number | null;
  skill_control?: number | null;
  skill_explosiveness?: number | null;
  skill_stamina?: number | null;
  skill_total?: number;
  is_active?: boolean;
  slug?: string;
}

function makeSlug(value: string): string {
  return slugify(value, { lower: true, strict: true, locale: 'sr' }) || `player-${Date.now()}`;
}

export async function createPlayer(input: CreatePlayerInput): Promise<number> {
  const display = (input.display_name?.trim()) || `${input.last_name} ${input.first_name}`.trim();
  let slug = (input.slug && input.slug.trim()) || makeSlug(display);
  const skillValues = getSkillValues(input);
  const skillTotal = input.skill_total ?? calculateSkillTotal(skillValues);

  // ensure unique slug
  let suffix = 1;
  const base = slug;
  while (await queryOne('SELECT id FROM players WHERE slug = ?', [slug])) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  const res = await execute(
    `INSERT INTO players (
       first_name, last_name, display_name, nickname, slug, photo_url, position,
       skill_running, skill_shooting, skill_defense, skill_efficiency, skill_goalkeeper,
       skill_dribbling, skill_substitution, skill_passing, skill_control,
       skill_explosiveness, skill_stamina, skill_total,
       is_active
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.first_name,
      input.last_name,
      display,
      input.nickname ?? null,
      slug,
      input.photo_url ?? null,
      input.position ?? null,
      ...PLAYER_SKILL_FIELDS.map((field) => skillValues[field] ?? null),
      skillTotal,
      input.is_active === false ? 0 : 1,
    ]
  );
  return res.insertId;
}

export async function updatePlayer(id: number, input: Partial<CreatePlayerInput>): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  const hasSkillChange = PLAYER_SKILL_FIELDS.some((field) => field in input);
  const normalizedInput = hasSkillChange && input.skill_total === undefined
    ? { ...input, skill_total: calculateSkillTotal(getSkillValues(input)) }
    : input;

  for (const [k, v] of Object.entries(normalizedInput)) {
    if (v === undefined) continue;
    if (k === 'is_active') {
      fields.push('is_active = ?');
      values.push(v ? 1 : 0);
    } else {
      fields.push(`${k} = ?`);
      values.push(v);
    }
  }
  if (!fields.length) return;
  values.push(id);
  await execute(`UPDATE players SET ${fields.join(', ')} WHERE id = ?`, values);
}

function getSkillValues(input: Partial<Record<PlayerSkillField, number | null | undefined>>) {
  return Object.fromEntries(
    PLAYER_SKILL_FIELDS.map((field) => [field, input[field] ?? null])
  ) as Record<PlayerSkillField, number | null>;
}

export async function deletePlayer(id: number): Promise<void> {
  await execute('DELETE FROM players WHERE id = ?', [id]);
}

// =====================================================
// MATCHES
// =====================================================

export async function getMatches(seasonId?: number): Promise<Match[]> {
  if (seasonId) {
    return query<Match>(
      'SELECT * FROM matches WHERE season_id = ? ORDER BY played_at DESC, id DESC',
      [seasonId]
    );
  }
  return query<Match>('SELECT * FROM matches ORDER BY played_at DESC, id DESC');
}

export async function getMatchesWithSeason(): Promise<Array<Match & { season_name: string }>> {
  return query<Array<Match & { season_name: string }>[number]>(
    `SELECT m.*, s.name AS season_name
     FROM matches m
     JOIN seasons s ON s.id = m.season_id
     ORDER BY m.played_at DESC, m.id DESC`
  );
}

export async function getLatestMatch(seasonId?: number): Promise<Match | null> {
  if (seasonId) {
    return queryOne<Match>(
      `SELECT *
       FROM matches
       WHERE season_id = ?
         AND is_counted = 1
         AND DATE_ADD(played_at, INTERVAL 1 HOUR) <= NOW()
       ORDER BY played_at DESC, id DESC
       LIMIT 1`,
      [seasonId]
    );
  }

  return queryOne<Match>(
    `SELECT *
     FROM matches
     WHERE is_counted = 1
       AND DATE_ADD(played_at, INTERVAL 1 HOUR) <= NOW()
     ORDER BY played_at DESC, id DESC
     LIMIT 1`
  );
}

export async function getUpcomingMatch(seasonId?: number): Promise<Match | null> {
  const matches = await getUpcomingMatches(seasonId, 1);
  return matches[0] ?? null;
}

export async function getUpcomingMatches(seasonId?: number, limit = 3): Promise<Match[]> {
  if (seasonId) {
    return query<Match>(
      `SELECT *
       FROM matches
       WHERE season_id = ?
         AND DATE_ADD(played_at, INTERVAL 1 HOUR) > NOW()
       ORDER BY played_at ASC, id ASC
       LIMIT ?`,
      [seasonId, limit]
    );
  }
  return query<Match>(
    `SELECT *
     FROM matches
     WHERE DATE_ADD(played_at, INTERVAL 1 HOUR) > NOW()
     ORDER BY played_at ASC, id ASC
     LIMIT ?`,
    [limit]
  );
}

export async function getMatchById(id: number): Promise<Match | null> {
  return queryOne<Match>('SELECT * FROM matches WHERE id = ?', [id]);
}

export async function getMatchPlayers(matchId: number): Promise<MatchPlayerWithPlayer[]> {
  return query<MatchPlayerWithPlayer>(
    `SELECT mp.*, p.display_name, p.nickname, p.slug, p.photo_url
     FROM match_players mp
     JOIN players p ON p.id = mp.player_id
     WHERE mp.match_id = ?
     ORDER BY mp.team ASC, mp.goals DESC, mp.assists DESC, p.display_name ASC`,
    [matchId]
  );
}

export async function getMatchLineupPlayers(matchId: number): Promise<MatchPlayerWithPlayer[]> {
  return query<MatchPlayerWithPlayer>(
    `SELECT mp.*, p.display_name, p.nickname, p.slug, p.photo_url
     FROM match_players mp
     JOIN players p ON p.id = mp.player_id
     WHERE mp.match_id = ?
     ORDER BY
       mp.team ASC,
       CASE mp.lineup_position
         WHEN 'goalkeeper' THEN 1
         WHEN 'defense_top' THEN 2
         WHEN 'defense_bottom' THEN 3
         WHEN 'attack_top' THEN 4
         WHEN 'attack_bottom' THEN 5
         WHEN 'reserve' THEN 6
         ELSE 7
       END ASC,
       mp.id ASC`,
    [matchId]
  );
}

export interface CreateMatchInput {
  season_id: number;
  match_number: string;
  played_at: string; // 'YYYY-MM-DD HH:MM:SS'
  venue?: string;
  scheduled_time?: string | null;
  selector_name?: string | null;
  white_score?: number;
  colored_score?: number;
  is_counted?: boolean;
  notes?: string | null;
  report?: string | null;
  reporter_name?: string | null;
}

function deriveResult(white: number, colored: number): ResultType {
  if (white > colored) return 'white_win';
  if (colored > white) return 'colored_win';
  return 'draw';
}

export async function createMatch(input: CreateMatchInput): Promise<number> {
  const white = input.white_score ?? 0;
  const colored = input.colored_score ?? 0;
  const res = await execute(
    `INSERT INTO matches
      (season_id, match_number, played_at, venue, scheduled_time, selector_name,
       white_score, colored_score, result_type, is_counted, notes, report, reporter_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.season_id,
      input.match_number,
      input.played_at,
      input.venue ?? 'KSC Jarac',
      input.scheduled_time ?? null,
      input.selector_name ?? null,
      white,
      colored,
      deriveResult(white, colored),
      input.is_counted === false ? 0 : 1,
      input.notes ?? null,
      input.report ?? null,
      input.reporter_name ?? null,
    ]
  );
  return res.insertId;
}

export async function updateMatch(id: number, input: Partial<CreateMatchInput>): Promise<void> {
  const current = await getMatchById(id);
  if (!current) return;
  const merged = { ...current, ...input };
  const white = merged.white_score ?? 0;
  const colored = merged.colored_score ?? 0;
  await execute(
    `UPDATE matches SET
       season_id = ?, match_number = ?, played_at = ?, venue = ?, scheduled_time = ?,
       selector_name = ?, white_score = ?, colored_score = ?, result_type = ?,
       is_counted = ?, notes = ?, report = ?, reporter_name = ?
     WHERE id = ?`,
    [
      merged.season_id,
      merged.match_number,
      merged.played_at,
      merged.venue ?? 'KSC Jarac',
      merged.scheduled_time ?? null,
      merged.selector_name ?? null,
      white,
      colored,
      deriveResult(Number(white), Number(colored)),
      input.is_counted === false ? 0 : merged.is_counted ? 1 : 0,
      merged.notes ?? null,
      merged.report ?? null,
      merged.reporter_name ?? null,
      id,
    ]
  );
}

export async function updateMatchScoreFromPlayerStats(matchId: number): Promise<void> {
  const totals = await queryOne<{
    white_goals: number | string | null;
    colored_goals: number | string | null;
    white_own_goals: number | string | null;
    colored_own_goals: number | string | null;
  }>(
    `SELECT
       COALESCE(SUM(CASE WHEN team = 'white' THEN goals ELSE 0 END), 0) AS white_goals,
       COALESCE(SUM(CASE WHEN team = 'colored' THEN goals ELSE 0 END), 0) AS colored_goals,
       COALESCE(SUM(CASE WHEN team = 'white' THEN own_goals ELSE 0 END), 0) AS white_own_goals,
       COALESCE(SUM(CASE WHEN team = 'colored' THEN own_goals ELSE 0 END), 0) AS colored_own_goals
     FROM match_players
     WHERE match_id = ?`,
    [matchId]
  );

  const white = Number(totals?.white_goals ?? 0) + Number(totals?.colored_own_goals ?? 0);
  const colored = Number(totals?.colored_goals ?? 0) + Number(totals?.white_own_goals ?? 0);

  await execute(
    `UPDATE matches
     SET white_score = ?, colored_score = ?, result_type = ?
     WHERE id = ?`,
    [white, colored, deriveResult(white, colored), matchId]
  );
}

export async function deleteMatch(id: number): Promise<void> {
  await execute('DELETE FROM matches WHERE id = ?', [id]);
}

// =====================================================
// MATCH PLAYERS
// =====================================================

export interface AddPlayerToMatchInput {
  match_id: number;
  player_id: number;
  team: Team;
  goals?: number;
  assists?: number;
  own_goals?: number;
  rating?: number | null;
  is_mvp?: boolean;
  comment?: string | null;
  lineup_position?: string | null;
}

export async function addPlayerToMatch(input: AddPlayerToMatchInput): Promise<number> {
  const res = await execute(
    `INSERT INTO match_players (match_id, player_id, team, goals, assists, own_goals, rating, is_mvp, comment, lineup_position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       team = VALUES(team),
       goals = VALUES(goals),
       assists = VALUES(assists),
       own_goals = VALUES(own_goals),
       rating = VALUES(rating),
       is_mvp = VALUES(is_mvp),
       comment = VALUES(comment),
       lineup_position = VALUES(lineup_position)`,
    [
      input.match_id,
      input.player_id,
      input.team,
      input.goals ?? 0,
      input.assists ?? 0,
      input.own_goals ?? 0,
      input.rating ?? null,
      input.is_mvp ? 1 : 0,
      input.comment ?? null,
      input.lineup_position ?? null,
    ]
  );
  return res.insertId;
}

export async function updateMatchPlayerStats(
  id: number,
  input: Partial<AddPlayerToMatchInput>
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined) continue;
    if (k === 'is_mvp') {
      fields.push('is_mvp = ?');
      values.push(v ? 1 : 0);
    } else {
      fields.push(`${k} = ?`);
      values.push(v);
    }
  }
  if (!fields.length) return;
  values.push(id);
  await execute(`UPDATE match_players SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function removeMatchPlayer(id: number): Promise<void> {
  await execute('DELETE FROM match_players WHERE id = ?', [id]);
}

// =====================================================
// LEADERBOARD / STATS
// =====================================================

/**
 * Vraća kompletnu statistiku po igraču za datu sezonu.
 * Bodovi: pobeda = 3, nerešeno = 1, poraz = 0.
 * Računa se samo iz završenih utakmica gde je matches.is_counted = 1.
 */
export async function getLeaderboard(seasonId: number): Promise<PlayerSeasonStats[]> {
  const seasonMeta = await queryOne<{ counted_matches: number | string | null }>(
    `SELECT COUNT(*) AS counted_matches
     FROM matches
     WHERE season_id = ?
       AND is_counted = 1
       AND DATE_ADD(played_at, INTERVAL 1 HOUR) <= NOW()`,
    [seasonId]
  );
  const seasonCountedMatches = Number(seasonMeta?.counted_matches ?? 0);

  const sql = `
    SELECT
      p.id AS player_id,
      p.display_name,
      p.nickname,
      p.slug,
      p.photo_url,
      p.skill_total,
      COUNT(s.mp_id) AS matches_played,
      SUM(CASE WHEN s.is_counted = 1 THEN 1 ELSE 0 END) AS counted_matches,
      COALESCE(SUM(s.goals), 0) AS goals,
      COALESCE(SUM(s.assists), 0) AS assists,
      COALESCE(SUM(s.own_goals), 0) AS own_goals,
      COALESCE(SUM(s.is_mvp), 0) AS match_mvp_count,
      AVG(s.rating) AS rating_average,
      SUM(CASE
        WHEN s.is_counted = 1 AND (
          (s.team = 'white'   AND s.result_type = 'white_win') OR
          (s.team = 'colored' AND s.result_type = 'colored_win')
        ) THEN 1 ELSE 0 END) AS wins,
      SUM(CASE WHEN s.is_counted = 1 AND s.result_type = 'draw' THEN 1 ELSE 0 END) AS draws,
      SUM(CASE
        WHEN s.is_counted = 1 AND (
          (s.team = 'white'   AND s.result_type = 'colored_win') OR
          (s.team = 'colored' AND s.result_type = 'white_win')
        ) THEN 1 ELSE 0 END) AS losses
    FROM players p
    LEFT JOIN (
      SELECT
        mp.id AS mp_id,
        mp.player_id,
        mp.team,
        mp.goals,
        mp.assists,
        mp.own_goals,
        mp.rating,
        mp.is_mvp,
        m.is_counted,
        m.result_type
      FROM match_players mp
      JOIN matches m ON m.id = mp.match_id
      WHERE m.season_id = ?
        AND m.is_counted = 1
        AND DATE_ADD(m.played_at, INTERVAL 1 HOUR) <= NOW()
    ) s ON s.player_id = p.id
    GROUP BY p.id
    HAVING COUNT(s.mp_id) > 0
  `;
  const rows = await query<Record<string, number | string | null>>(sql, [seasonId]);

  const stats: PlayerSeasonStats[] = rows.map((r) => {
      const goals = Number(r.goals || 0);
      const assists = Number(r.assists || 0);
      const own_goals = Number(r.own_goals || 0);
      const wins = Number(r.wins || 0);
      const draws = Number(r.draws || 0);
      const losses = Number(r.losses || 0);
      const counted = Number(r.counted_matches || 0);
      const matches_played = Number(r.matches_played || 0);
      const points = wins * 3 + draws;
      const gpa = counted > 0 ? goals / counted : 0;
      const apm = counted > 0 ? assists / counted : 0;
      const ga = goals + assists;
      const ppm = counted > 0 ? points / counted : 0;
      const presence = seasonCountedMatches > 0 ? counted / seasonCountedMatches : 0;
      const matchMvpCount = Number(r.match_mvp_count || 0);
      // MVP lige (NBA-inspirisano): kompozit timskog uspeha (pobede/porazi) i
      // individualnog učinka. Gol vredi više od asistencije; PORAZI oduzimaju.
      // Svaki parametar ulazi tačno jednom — bez dvostrukog brojanja.
      const mvp_score =
        wins * 5.0 +          // timski uspeh — najvažniji (ko najviše pobeđuje)
        draws * 2.0 +         // nerešeno
        goals * 1.5 +         // učinak: golovi (vrede više od asistencija)
        assists * 1.0 +       // učinak: asistencije
        matchMvpCount * 3.0 + // MVP pojedinačnog meča
        presence * 0.5 -      // dostupnost (odigrane utakmice)
        losses * 2.0;         // PORAZI — jedini negativni faktor
      return {
        player_id: Number(r.player_id),
        display_name: String(r.display_name),
        nickname: (r.nickname as string | null) ?? null,
        slug: String(r.slug),
        photo_url: (r.photo_url as string | null) ?? null,
        skill_total: Number(r.skill_total || 0),
        matches_played,
        counted_matches: counted,
        goals,
        assists,
        own_goals,
        wins,
        draws,
        losses,
        points,
        goals_per_match: gpa,
        assists_per_match: apm,
        goals_plus_assists: ga,
        goals_plus_assists_per_match: counted > 0 ? ga / counted : 0,
        points_per_match: ppm,
        mvp_score,
      };
    });

  return stats;
}

export async function getPlayerStats(playerId: number, seasonId: number): Promise<PlayerSeasonStats | null> {
  const all = await getLeaderboard(seasonId);
  return all.find((s) => s.player_id === playerId) ?? null;
}

export async function getPlayerMatchHistory(
  playerId: number,
  seasonId: number
): Promise<Array<MatchPlayer & { match_number: string; played_at: string; white_score: number; colored_score: number; result_type: ResultType; is_counted: 0 | 1; match_id: number }>> {
  return query(
    `SELECT mp.*, m.match_number, m.played_at, m.white_score, m.colored_score, m.result_type, m.is_counted, m.id as match_id
     FROM match_players mp
     JOIN matches m ON m.id = mp.match_id
     WHERE mp.player_id = ? AND m.season_id = ?
     ORDER BY m.played_at DESC, m.id DESC`,
    [playerId, seasonId]
  );
}

// =====================================================
// AWARDS
// =====================================================

export interface Award {
  id: number;
  season_id: number;
  match_id: number | null;
  player_id: number;
  type: 'match_mvp' | 'season_mvp' | 'top_scorer' | 'top_assistant' | 'top_own_goals' | 'fair_play' | 'special';
  title: string;
  description: string | null;
}

export async function getPlayerAwards(playerId: number, seasonId: number): Promise<Award[]> {
  return query<Award>(
    'SELECT * FROM awards WHERE player_id = ? AND season_id = ? ORDER BY created_at DESC',
    [playerId, seasonId]
  );
}

/**
 * Vraća sve nagrade iz svih sezona, sa imenom sezone — koristi se za prikaz
 * trofeja pored imena igrača bilo gde u aplikaciji.
 */
export interface AwardWithSeason extends Award {
  season_name: string;
}

export async function getAllAwardsWithSeason(): Promise<AwardWithSeason[]> {
  return query<AwardWithSeason>(
    `SELECT a.*, s.name AS season_name
     FROM awards a
     JOIN seasons s ON s.id = a.season_id
     ORDER BY s.starts_at DESC, a.created_at DESC`
  );
}

/**
 * Pomoćna funkcija: grupiše listu nagrada po player_id.
 */
export function groupAwardsByPlayer(awards: AwardWithSeason[]): Map<number, AwardWithSeason[]> {
  const map = new Map<number, AwardWithSeason[]>();
  for (const a of awards) {
    const arr = map.get(a.player_id) ?? [];
    arr.push(a);
    map.set(a.player_id, arr);
  }
  return map;
}

// =====================================================
// HISTORICAL PLAYER STATS (uvoz iz Excela / prošle sezone)
// =====================================================

/**
 * Vraća kompletnu istorijsku statistiku za zadatu sezonu (iz Excel uvoza).
 * Koristi se za prikaz prošle sezone u istom formatu kao u Excelu.
 */
export async function getHistoricalStats(seasonId: number): Promise<HistoricalPlayerStats[]> {
  return query<HistoricalPlayerStats>(
    `SELECT
       h.*,
       p.display_name,
       p.nickname,
       p.slug,
       p.photo_url,
       p.skill_total
     FROM historical_player_stats h
     JOIN players p ON p.id = h.player_id
     WHERE h.season_id = ?
     ORDER BY h.points DESC, h.goals DESC, p.display_name ASC`,
    [seasonId]
  );
}

/**
 * Vraća sezonu koja ima najviše istorijskih podataka (za fallback prikaz
 * kada aktivna sezona još nema utakmica).
 */
export async function getSeasonWithMostHistory(): Promise<Season | null> {
  return queryOne<Season>(
    `SELECT s.* FROM seasons s
     LEFT JOIN historical_player_stats h ON h.season_id = s.id
     GROUP BY s.id
     ORDER BY COUNT(h.id) DESC, s.starts_at DESC
     LIMIT 1`
  );
}

export async function getHistoricalForPlayer(
  playerId: number
): Promise<Array<HistoricalPlayerStats & { season_name: string }>> {
  return query(
    `SELECT h.*, s.name AS season_name,
            p.display_name, p.nickname, p.slug, p.photo_url, p.skill_total
     FROM historical_player_stats h
     JOIN seasons s ON s.id = h.season_id
     JOIN players p ON p.id = h.player_id
     WHERE h.player_id = ?
     ORDER BY s.starts_at DESC, s.id DESC`,
    [playerId]
  );
}

// =====================================================
// GALLERY
// =====================================================

export async function getGalleryImages(): Promise<GalleryImage[]> {
  return query<GalleryImage>(
    'SELECT * FROM gallery_images ORDER BY created_at DESC, id DESC'
  );
}

export async function getGalleryImageById(id: number): Promise<GalleryImage | null> {
  return queryOne<GalleryImage>('SELECT * FROM gallery_images WHERE id = ?', [id]);
}

export async function createGalleryImage(data: {
  image_url: string;
  title?: string | null;
}): Promise<number> {
  const res = await execute(
    'INSERT INTO gallery_images (image_url, title) VALUES (?, ?)',
    [data.image_url, data.title ?? null]
  );
  return res.insertId;
}

export async function deleteGalleryImage(id: number): Promise<void> {
  await execute('DELETE FROM gallery_images WHERE id = ?', [id]);
}

// =====================================================
// BEER DONATIONS (kasa za pivo)
// =====================================================

export async function getBeerDonations(limit = 200): Promise<BeerDonation[]> {
  return query<BeerDonation>(
    'SELECT * FROM beer_donations ORDER BY donated_at DESC, id DESC LIMIT ?',
    [limit]
  );
}

export async function getPublicBeerDonations(limit = 100): Promise<BeerDonation[]> {
  return query<BeerDonation>(
    'SELECT * FROM beer_donations WHERE is_public = 1 ORDER BY donated_at DESC, id DESC LIMIT ?',
    [limit]
  );
}

export async function getBeerDonationsSummary(): Promise<{ total: number; count: number }> {
  const row = await queryOne<{ total: number | null; count: number }>(
    'SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM beer_donations WHERE is_public = 1'
  );
  return { total: Number(row?.total ?? 0), count: Number(row?.count ?? 0) };
}

export async function getBeerDonationById(id: number): Promise<BeerDonation | null> {
  return queryOne<BeerDonation>('SELECT * FROM beer_donations WHERE id = ?', [id]);
}

export async function createBeerDonation(data: {
  donor_name: string;
  amount: number;
  message?: string | null;
  donated_at: string;
  is_public?: boolean;
}): Promise<number> {
  const res = await execute(
    'INSERT INTO beer_donations (donor_name, amount, message, donated_at, is_public) VALUES (?, ?, ?, ?, ?)',
    [data.donor_name, data.amount, data.message ?? null, data.donated_at, data.is_public === false ? 0 : 1]
  );
  return res.insertId;
}

export async function deleteBeerDonation(id: number): Promise<void> {
  await execute('DELETE FROM beer_donations WHERE id = ?', [id]);
}
