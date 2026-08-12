/**
 * Uvozi istorijsku agregiranu statistiku iz Excel (.xlsx) fajla.
 *
 * Skripta:
 *   - Pronalazi sheet sa kolonom "Igrač" (ili sl.)
 *   - Detektuje header red automatski (skenira prvih 10 redova)
 *   - Učitava sve igrače (kreira nove ako ne postoje) i upiše u
 *     `historical_player_stats` tabelu za zadatu sezonu
 *
 * Pokretanje:
 *   npm run import:stats:xlsx -- "./data/Jarac 2025-26 - statistika.xlsx" "Jarac 2025/26"
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import mysql from 'mysql2/promise';
import slugify from 'slugify';

const file = process.argv[2];
const seasonName = process.argv[3];

if (!file || !seasonName) {
  console.error('Upotreba: npm run import:stats:xlsx -- <putanja-do-xlsx> "Naziv sezone"');
  console.error('Primer:   npm run import:stats:xlsx -- "./data/Jarac 2025-26 - statistika.xlsx" "Jarac 2025/26"');
  process.exit(1);
}

if (!fs.existsSync(file)) {
  console.error(`Fajl ne postoji: ${path.resolve(file)}`);
  process.exit(1);
}

// ---------- helpers ----------
function norm(s: unknown): string {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function num(v: unknown, fallback = 0): number {
  if (v == null || v === '') return fallback;
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  const cleaned = String(v).replace(/\s/g, '').replace(',', '.');
  if (cleaned === '' || cleaned === '-' || cleaned === '/') return fallback;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

function numNullable(v: unknown): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const cleaned = String(v).replace(/\s/g, '').replace(',', '.');
  if (cleaned === '' || cleaned === '-' || cleaned === '/') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Mapiranje očekivanih ključeva na set mogućih header naziva (normalizovanih)
const COLUMN_ALIASES: Record<string, string[]> = {
  player:             ['igrac', 'igrač', 'ime', 'ime i prezime', 'name', 'player'],
  matches_played:     ['utakmice', 'broj utakmica', 'utak.'],
  goals:              ['golovi', 'gol', 'g'],
  goals_per_match:    ['golovi po utakmici', 'g/utk', 'prosek golova'],
  assists:            ['asistencije', 'asist', 'a'],
  assists_per_match:  ['asistencije po utakmici', 'a/utk'],
  ga:                 ['asistencije+golovi', 'asistencije + golovi', 'golovi+asistencije', 'g+a'],
  ga_per_match:       [
    'asistencije+ golovi po utakmici',
    'asistencije+golovi po utakmici',
    'asistencije + golovi po utakmici',
    'golovi+asistencije po utakmici',
    'g+a/utk',
  ],
  wins:               ['pobede', 'p', 'w'],
  draws:              ['nereseno', 'nerešeno', 'n', 'd'],
  losses:             ['porazi', 'i', 'l'],
  points:             ['bodovi', 'bod'],
  points_per_match:   ['bodovi po utakmici', 'bod/utk'],
  own_goals:          ['autogolovi', 'ag'],
  prev_avg:           ['prosek prosle sezone', 'prosek prošle sezone'],
  points_diff:        [
    'bodovna razlika u odnosu na proslu sezonu',
    'bodovna razlika u odnosu na prošlu sezonu',
    'bodovna razlika',
  ],
  prev_goals_avg:     ['prosek golova prosle sezone', 'prosek golova prošle sezone'],
  goals_diff:         [
    'razlika u proseku golova u odnosu na proslu sezonu',
    'razlika u proseku golova u odnosu na prošlu sezonu',
    'razlika u proseku golova',
  ],
  untracked:          ['utakmice bez upisane statistike', 'utak. bez statistike', 'bez statistike'],
};

type ColMap = Partial<Record<keyof typeof COLUMN_ALIASES, number>>;

function buildColumnMap(headerRow: unknown[]): ColMap {
  const map: ColMap = {};
  const headers = headerRow.map(norm);
  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    let idx = -1;
    for (const alias of aliases) {
      const a = norm(alias);
      idx = headers.findIndex((h) => h === a);
      if (idx >= 0) break;
    }
    if (idx < 0) {
      // fallback: substring match (header sadrži alias)
      for (const alias of aliases) {
        const a = norm(alias);
        idx = headers.findIndex((h) => h.includes(a));
        if (idx >= 0) break;
      }
    }
    if (idx >= 0) map[key as keyof typeof COLUMN_ALIASES] = idx;
  }
  return map;
}

function findHeaderRow(rows: unknown[][]): number {
  // Skenira prvih 15 redova i traži red koji sadrži alias za 'player'
  const playerAliases = COLUMN_ALIASES.player.map(norm);
  const limit = Math.min(15, rows.length);
  for (let i = 0; i < limit; i++) {
    const row = rows[i] ?? [];
    const cells = row.map(norm);
    if (cells.some((c) => playerAliases.includes(c) || playerAliases.some((a) => c.includes(a)))) {
      return i;
    }
  }
  return 0;
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: '', last: parts[0] };
  // "Prezime Ime" je čest oblik u Jarcu
  const [last, ...firstParts] = parts;
  return { first: firstParts.join(' '), last };
}

// ---------- main ----------
async function main() {
  const wb = XLSX.readFile(path.resolve(file));
  console.log(`▶ Sheet-ovi u fajlu: ${wb.SheetNames.join(', ')}`);

  let chosenSheet: string | null = null;
  let headerIdx = 0;
  let aoa: unknown[][] = [];
  let colMap: ColMap = {};

  // pronađi prvi sheet koji ima kolonu "Igrač"
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '', blankrows: false });
    if (!data.length) continue;
    const hi = findHeaderRow(data);
    const cm = buildColumnMap((data[hi] as unknown[]) ?? []);
    if (cm.player !== undefined) {
      chosenSheet = name;
      headerIdx = hi;
      aoa = data;
      colMap = cm;
      break;
    }
  }

  if (!chosenSheet) {
    console.error('Nisam pronašao sheet sa kolonom "Igrač". Proveri Excel header.');
    process.exit(1);
  }

  console.log(`▶ Koristim sheet: "${chosenSheet}", header red: ${headerIdx + 1}`);
  console.log(`▶ Detektovane kolone: ${JSON.stringify(colMap, null, 2)}`);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jarac',
    charset: 'utf8mb4_unicode_ci',
  });

  // sezona — kreiraj ako ne postoji, ne diraj is_active
  await conn.execute(
    `INSERT INTO seasons (name, is_active) VALUES (?, 0)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [seasonName]
  );
  const [seasonRows] = await conn.execute('SELECT id FROM seasons WHERE name = ?', [seasonName]);
  const seasonId = (seasonRows as { id: number }[])[0].id;
  console.log(`▶ Sezona "${seasonName}" → id=${seasonId}`);

  let imported = 0;
  let skipped = 0;
  let created = 0;

  // učitaj postojeće igrače (za fuzzy match po normalizovanom display_name)
  const [existingPlayers] = await conn.execute('SELECT id, first_name, last_name, display_name, slug FROM players');
  const playerIndex = new Map<string, number>();
  for (const p of existingPlayers as Array<{ id: number; first_name: string; last_name: string; display_name: string; slug: string }>) {
    playerIndex.set(norm(p.display_name), p.id);
    playerIndex.set(norm(`${p.last_name} ${p.first_name}`), p.id);
    playerIndex.set(norm(`${p.first_name} ${p.last_name}`), p.id);
    playerIndex.set(p.slug, p.id);
  }

  for (let i = headerIdx + 1; i < aoa.length; i++) {
    const row = aoa[i] as unknown[];
    if (!row || row.length === 0) continue;
    const rawName = String(row[colMap.player as number] ?? '').trim();
    if (!rawName) { skipped++; continue; }
    // preskoči redove tipa "Ukupno", "Total"
    const ln = norm(rawName);
    if (ln === 'ukupno' || ln === 'total' || ln === 'prosek') { skipped++; continue; }

    // pronađi ili kreiraj igrača
    let playerId = playerIndex.get(ln);
    if (!playerId) {
      const { first, last } = splitName(rawName);
      const display = last && first ? `${last} ${first}` : rawName;
      let slug = slugify(display, { lower: true, strict: true, locale: 'sr' });
      if (!slug) slug = `igrac-${Date.now()}-${i}`;
      // osiguraj unique slug
      let suffix = 1;
      const base = slug;
      while (playerIndex.has(slug)) {
        suffix += 1;
        slug = `${base}-${suffix}`;
      }
      const [ins] = await conn.execute(
        `INSERT INTO players (first_name, last_name, display_name, slug, is_active)
         VALUES (?, ?, ?, ?, 1)`,
        [first, last || rawName, display, slug]
      );
      playerId = (ins as mysql.ResultSetHeader).insertId;
      playerIndex.set(ln, playerId);
      playerIndex.set(slug, playerId);
      created++;
    }

    const get = (k: keyof typeof COLUMN_ALIASES) => {
      const idx = colMap[k];
      return idx !== undefined ? row[idx] : undefined;
    };

    const data = {
      matches_played:               num(get('matches_played')),
      goals:                        num(get('goals')),
      goals_per_match:              num(get('goals_per_match')),
      assists:                      num(get('assists')),
      assists_per_match:            num(get('assists_per_match')),
      goals_plus_assists:           num(get('ga')),
      goals_plus_assists_per_match: num(get('ga_per_match')),
      wins:                         num(get('wins')),
      draws:                        num(get('draws')),
      losses:                       num(get('losses')),
      points:                       num(get('points')),
      points_per_match:             num(get('points_per_match')),
      own_goals:                    num(get('own_goals')),
      previous_season_average:      numNullable(get('prev_avg')),
      points_average_diff:          numNullable(get('points_diff')),
      previous_season_goals_average: numNullable(get('prev_goals_avg')),
      goals_average_diff:           numNullable(get('goals_diff')),
      untracked_matches:            num(get('untracked')),
    };

    await conn.execute(
      `INSERT INTO historical_player_stats
        (season_id, player_id, matches_played, goals, goals_per_match, assists, assists_per_match,
         goals_plus_assists, goals_plus_assists_per_match, wins, draws, losses, points, points_per_match,
         own_goals, previous_season_average, points_average_diff, previous_season_goals_average,
         goals_average_diff, untracked_matches)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         matches_played = VALUES(matches_played),
         goals = VALUES(goals),
         goals_per_match = VALUES(goals_per_match),
         assists = VALUES(assists),
         assists_per_match = VALUES(assists_per_match),
         goals_plus_assists = VALUES(goals_plus_assists),
         goals_plus_assists_per_match = VALUES(goals_plus_assists_per_match),
         wins = VALUES(wins),
         draws = VALUES(draws),
         losses = VALUES(losses),
         points = VALUES(points),
         points_per_match = VALUES(points_per_match),
         own_goals = VALUES(own_goals),
         previous_season_average = VALUES(previous_season_average),
         points_average_diff = VALUES(points_average_diff),
         previous_season_goals_average = VALUES(previous_season_goals_average),
         goals_average_diff = VALUES(goals_average_diff),
         untracked_matches = VALUES(untracked_matches)`,
      [
        seasonId,
        playerId,
        data.matches_played,
        data.goals,
        data.goals_per_match,
        data.assists,
        data.assists_per_match,
        data.goals_plus_assists,
        data.goals_plus_assists_per_match,
        data.wins,
        data.draws,
        data.losses,
        data.points,
        data.points_per_match,
        data.own_goals,
        data.previous_season_average,
        data.points_average_diff,
        data.previous_season_goals_average,
        data.goals_average_diff,
        data.untracked_matches,
      ]
    );
    imported++;
    console.log(`  ✓ ${rawName.padEnd(28)} → UTK ${data.matches_played}, G ${data.goals}, A ${data.assists}, BOD ${data.points}`);
  }

  console.log('');
  console.log(`▶ Gotovo. Uvezeno: ${imported}, kreirano novih igrača: ${created}, preskočeno: ${skipped}`);
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
