/**
 * Uvozi istorijsku agregiranu statistiku iz Excel CSV-a.
 *
 * Očekivani CSV header (Excel → Save as CSV UTF-8):
 *   Igrač, Utakmice, Golovi, Golovi po utakmici, Asistencije,
 *   Asistencije po utakmici, Asistencije+golovi, Asistencije+ golovi po utakmici,
 *   Pobede, Nerešeno, Porazi, Bodovi, Bodovi po utakmici, Autogolovi,
 *   Prosek prošle sezone, Bodovna razlika u odnosu na prošlu sezonu,
 *   Prosek golova prošle sezone, Razlika u proseku golova u odnosu na prošlu sezonu,
 *   Utakmice bez upisane statistike
 *
 * Pokreni:
 *   npm run import:stats -- ./data/stats.csv "Jarac 2025/26"
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import mysql from 'mysql2/promise';
import slugify from 'slugify';

const file = process.argv[2];
const seasonName = process.argv[3];

if (!file || !seasonName) {
  console.error('Upotreba: npm run import:stats -- <putanja-do-csv> "Naziv sezone"');
  process.exit(1);
}

type Row = Record<string, string>;

function num(v: string | undefined, fallback = 0): number {
  if (v == null) return fallback;
  const cleaned = String(v).replace(/\s/g, '').replace(',', '.');
  if (cleaned === '' || cleaned === '-' || cleaned === '/') return fallback;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

function numNullable(v: string | undefined): number | null {
  if (v == null) return null;
  const cleaned = String(v).replace(/\s/g, '').replace(',', '.');
  if (cleaned === '' || cleaned === '-' || cleaned === '/') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function pick(row: Row, ...keys: string[]): string | undefined {
  for (const k of keys) {
    for (const rk of Object.keys(row)) {
      if (rk.trim().toLowerCase() === k.trim().toLowerCase()) {
        return row[rk];
      }
    }
  }
  return undefined;
}

async function main() {
  const raw = fs.readFileSync(path.resolve(file), 'utf8');
  const rows: Row[] = parse(raw, { columns: true, skip_empty_lines: true, trim: true, bom: true });

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jarac',
    charset: 'utf8mb4_unicode_ci',
  });

  // sezona
  await conn.execute(
    `INSERT INTO seasons (name, is_active) VALUES (?, 0)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [seasonName]
  );
  const [seasonRows] = await conn.execute('SELECT id FROM seasons WHERE name = ?', [seasonName]);
  const seasonId = (seasonRows as { id: number }[])[0].id;

  let count = 0;
  for (const row of rows) {
    const player = pick(row, 'Igrač', 'Igrac', 'player', 'display_name');
    if (!player) continue;

    const slug = slugify(player, { lower: true, strict: true, locale: 'sr' });

    // upsert player ako ne postoji
    await conn.execute(
      `INSERT INTO players (first_name, last_name, display_name, slug, is_active)
       VALUES (?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE display_name = VALUES(display_name)`,
      ['', '', player, slug]
    );
    const [pRows] = await conn.execute('SELECT id FROM players WHERE slug = ?', [slug]);
    const playerId = (pRows as { id: number }[])[0].id;

    const data = {
      matches_played: num(pick(row, 'Utakmice')),
      goals: num(pick(row, 'Golovi')),
      goals_per_match: num(pick(row, 'Golovi po utakmici')),
      assists: num(pick(row, 'Asistencije')),
      assists_per_match: num(pick(row, 'Asistencije po utakmici')),
      goals_plus_assists: num(pick(row, 'Asistencije+golovi', 'Asistencije + golovi', 'Golovi+asistencije')),
      goals_plus_assists_per_match: num(
        pick(row, 'Asistencije+ golovi po utakmici', 'Asistencije+golovi po utakmici', 'Golovi+asistencije po utakmici')
      ),
      wins: num(pick(row, 'Pobede')),
      draws: num(pick(row, 'Nerešeno', 'Nereseno')),
      losses: num(pick(row, 'Porazi')),
      points: num(pick(row, 'Bodovi')),
      points_per_match: num(pick(row, 'Bodovi po utakmici')),
      own_goals: num(pick(row, 'Autogolovi')),
      previous_season_average: numNullable(pick(row, 'Prosek prošle sezone', 'Prosek prosle sezone')),
      points_average_diff: numNullable(
        pick(row, 'Bodovna razlika u odnosu na prošlu sezonu', 'Bodovna razlika u odnosu na proslu sezonu')
      ),
      previous_season_goals_average: numNullable(
        pick(row, 'Prosek golova prošle sezone', 'Prosek golova prosle sezone')
      ),
      goals_average_diff: numNullable(
        pick(row, 'Razlika u proseku golova u odnosu na prošlu sezonu', 'Razlika u proseku golova u odnosu na proslu sezonu')
      ),
      untracked_matches: num(pick(row, 'Utakmice bez upisane statistike')),
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
    count++;
    console.log(`  ✓ ${player} → ${data.matches_played} utk, ${data.goals} G, ${data.assists} A`);
  }

  console.log(`Uvezeno redova: ${count}`);
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
